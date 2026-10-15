// HTTP signature inspection: draft-cavage-12 signing strings and RFC 9421
// signature bases. Pure functions over a parsed request; verification uses
// WebCrypto (globalThis.crypto.subtle), available in browsers and Node 20+.

/**
 * @typedef {{
 *   method: string,
 *   target: string,
 *   headers: Map<string, string[]>,
 *   body: string,
 * }} ParsedRequest
 */

/**
 * Parse a raw HTTP/1.1 request: request line, headers, blank line, body.
 * @param {string} raw
 * @returns {ParsedRequest}
 */
export function parseRequest(raw) {
  const text = raw.replace(/\r\n/g, '\n').replace(/^\s*\n/, '');
  const split = text.indexOf('\n\n');
  const head = split === -1 ? text : text.slice(0, split);
  const body = split === -1 ? '' : text.slice(split + 2);
  const [requestLine = '', ...headerLines] = head.split('\n');
  const [method = '', target = ''] = requestLine.trim().split(/\s+/);
  if (!method || !target.startsWith('/')) {
    throw new Error('The first line must be a request line, e.g. "POST /users/alice/inbox HTTP/1.1".');
  }

  /** @type {Map<string, string[]>} */
  const headers = new Map();
  let last = '';
  for (const line of headerLines) {
    if (/^[ \t]/.test(line) && last) {
      // obsolete line folding: append to the previous value
      const values = headers.get(last) ?? [];
      values[values.length - 1] += ` ${line.trim()}`;
      continue;
    }
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const name = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    headers.set(name, [...(headers.get(name) ?? []), value]);
    last = name;
  }
  return {method: method.toUpperCase(), target, headers, body};
}

/** @param {ParsedRequest} req @param {string} name */
export function header(req, name) {
  const values = req.headers.get(name.toLowerCase());
  return values ? values.join(', ') : undefined;
}

// ---------------------------------------------------------------------------
// draft-cavage-http-signatures-12
// ---------------------------------------------------------------------------

/**
 * Parse a cavage Signature header: keyId="...",algorithm="...",headers="...",signature="..."
 * @param {string} value
 * @returns {Record<string, string>}
 */
export function parseCavageSignature(value) {
  /** @type {Record<string, string>} */
  const params = {};
  const re = /([A-Za-z]+)=(?:"([^"]*)"|([^,\s]*))/g;
  let match;
  while ((match = re.exec(value)) !== null) {
    params[match[1]] = match[2] ?? match[3];
  }
  return params;
}

/**
 * Build the cavage signing string (draft-cavage-12 §2.3) the way Mastodon
 * does: (request-target) is the lower-cased method and the full path
 * including the query string.
 * @param {ParsedRequest} req
 * @param {Record<string, string>} params Parsed Signature header
 * @returns {{signingString: string, missing: string[]}}
 */
export function cavageSigningString(req, params) {
  const names = (params.headers || 'date').toLowerCase().split(/\s+/).filter(Boolean);
  /** @type {string[]} */
  const missing = [];
  const lines = names.map((name) => {
    if (name === '(request-target)') return `(request-target): ${req.method.toLowerCase()} ${req.target}`;
    if (name === '(created)' || name === '(expires)') {
      const key = name.slice(1, -1);
      if (params[key] === undefined) missing.push(name);
      return `${name}: ${params[key] ?? ''}`;
    }
    const value = header(req, name);
    if (value === undefined) missing.push(name);
    return `${name}: ${value ?? ''}`;
  });
  return {signingString: lines.join('\n'), missing};
}

/**
 * Mastodon's requirements for which headers a cavage signature must cover
 * (signed_request.rb, v4.7.3).
 * @param {string} method
 * @param {string[]} signed Lower-cased names from the headers parameter
 * @returns {string[]} Human-readable problems
 */
export function mastodonCavageProblems(method, signed) {
  const problems = [];
  const m = method.toUpperCase();
  if (!signed.includes('date') && !signed.includes('(created)')) {
    problems.push('Mastodon requires the Date header or (created) pseudo-header to be signed');
  }
  if (!signed.includes('(request-target)') && !signed.includes('digest')) {
    problems.push('Mastodon requires the Digest header or (request-target) pseudo-header to be signed');
  }
  if (m === 'GET' && !signed.includes('host')) {
    problems.push('Mastodon requires the Host header to be signed when doing a GET request');
  }
  if (m === 'POST' && !signed.includes('digest')) {
    problems.push('Mastodon requires the Digest header to be signed when doing a POST request');
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Digests
// ---------------------------------------------------------------------------

/** @param {ArrayBuffer} buffer */
function toBase64(buffer) {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** @param {string} b64 */
export function fromBase64(b64) {
  const binary = atob(b64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const DIGEST_ALGORITHMS = {'sha-256': 'SHA-256', 'sha-512': 'SHA-512'};

/**
 * Check a legacy Digest header ("SHA-256=base64") against the body.
 * @param {string} body
 * @param {string | undefined} digestHeader
 * @returns {Promise<{ok: boolean, expected?: string, message: string}>}
 */
export async function checkDigest(body, digestHeader) {
  const hash = toBase64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
  const expected = `SHA-256=${hash}`;
  if (!digestHeader) return {ok: false, expected, message: 'No Digest header.'};
  const entries = digestHeader.split(',').map((d) => {
    const i = d.indexOf('=');
    return [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()];
  });
  const sha256 = entries.find(([alg]) => alg === 'sha-256');
  if (!sha256) return {ok: false, expected, message: 'Digest has no SHA-256 value (Mastodon only supports SHA-256).'};
  return sha256[1] === hash
    ? {ok: true, expected, message: 'Digest matches the body.'}
    : {ok: false, expected, message: 'Digest does not match the body as entered. (Any change to the body bytes, including whitespace and line endings, changes the digest.)'};
}

/**
 * Check an RFC 9530 Content-Digest header (sha-256=:base64:, sha-512=:base64:).
 * @param {string} body
 * @param {string | undefined} contentDigest
 */
export async function checkContentDigest(body, contentDigest) {
  if (!contentDigest) return {ok: false, message: 'No Content-Digest header.'};
  const dict = parseDictionary(contentDigest);
  for (const [alg, item] of dict) {
    const name = DIGEST_ALGORITHMS[/** @type {'sha-256'|'sha-512'} */ (alg)];
    if (!name || item.value?.type !== 'bytes') continue;
    const hash = toBase64(await crypto.subtle.digest(name, new TextEncoder().encode(body)));
    return hash === item.value.value
      ? {ok: true, message: `Content-Digest (${alg}) matches the body.`}
      : {ok: false, message: `Content-Digest (${alg}) does not match the body as entered.`};
  }
  return {ok: false, message: 'Content-Digest has no sha-256 or sha-512 value.'};
}

// ---------------------------------------------------------------------------
// RFC 8941 structured fields (the subset RFC 9421 needs)
// ---------------------------------------------------------------------------

/**
 * @typedef {{type: 'string' | 'token' | 'integer' | 'decimal' | 'boolean' | 'bytes', value: any}} BareItem
 * @typedef {{value: BareItem | null, inner?: Item[], params: [string, BareItem][]}} Item
 */

class Parser {
  /** @param {string} input */
  constructor(input) {
    this.s = input;
    this.i = 0;
  }
  ws() {
    while (this.s[this.i] === ' ' || this.s[this.i] === '\t') this.i++;
  }
  /** @param {string} message */
  fail(message) {
    throw new Error(`Structured field parse error at ${this.i}: ${message}`);
  }
  key() {
    const m = /^[a-z*][a-z0-9_\-.*]*/.exec(this.s.slice(this.i));
    if (!m) this.fail('expected a key');
    this.i += m[0].length;
    return m[0];
  }
  /** @returns {BareItem} */
  bareItem() {
    const c = this.s[this.i];
    if (c === '"') {
      let out = '';
      this.i++;
      while (this.i < this.s.length) {
        const ch = this.s[this.i++];
        if (ch === '\\') out += this.s[this.i++];
        else if (ch === '"') return {type: 'string', value: out};
        else out += ch;
      }
      this.fail('unterminated string');
    }
    if (c === ':') {
      const end = this.s.indexOf(':', this.i + 1);
      if (end === -1) this.fail('unterminated byte sequence');
      const value = this.s.slice(this.i + 1, end);
      this.i = end + 1;
      return {type: 'bytes', value};
    }
    if (c === '?') {
      const value = this.s[this.i + 1] === '1';
      this.i += 2;
      return {type: 'boolean', value};
    }
    const num = /^-?\d+(\.\d+)?/.exec(this.s.slice(this.i));
    if (num) {
      this.i += num[0].length;
      return num[1] ? {type: 'decimal', value: Number(num[0])} : {type: 'integer', value: Number(num[0])};
    }
    const tok = /^[A-Za-z*][A-Za-z0-9!#$%&'*+\-.^_`|~:/]*/.exec(this.s.slice(this.i));
    if (tok) {
      this.i += tok[0].length;
      return {type: 'token', value: tok[0]};
    }
    return this.fail('expected an item');
  }
  /** @returns {[string, BareItem][]} */
  params() {
    /** @type {[string, BareItem][]} */
    const out = [];
    while (this.s[this.i] === ';') {
      this.i++;
      this.ws();
      const k = this.key();
      /** @type {BareItem} */
      let v = {type: 'boolean', value: true};
      if (this.s[this.i] === '=') {
        this.i++;
        v = this.bareItem();
      }
      out.push([k, v]);
    }
    return out;
  }
  /** @returns {Item} */
  itemOrInnerList() {
    if (this.s[this.i] === '(') {
      this.i++;
      /** @type {Item[]} */
      const inner = [];
      for (;;) {
        this.ws();
        if (this.s[this.i] === ')') {
          this.i++;
          break;
        }
        if (this.i >= this.s.length) this.fail('unterminated inner list');
        const value = this.bareItem();
        inner.push({value, params: this.params()});
      }
      return {value: null, inner, params: this.params()};
    }
    const value = this.bareItem();
    return {value, params: this.params()};
  }
}

/**
 * Parse an RFC 8941 dictionary.
 * @param {string} input
 * @returns {Map<string, Item>}
 */
export function parseDictionary(input) {
  const p = new Parser(input.trim());
  /** @type {Map<string, Item>} */
  const out = new Map();
  while (p.i < p.s.length) {
    p.ws();
    const k = p.key();
    if (p.s[p.i] === '=') {
      p.i++;
      out.set(k, p.itemOrInnerList());
    } else {
      out.set(k, {value: {type: 'boolean', value: true}, params: p.params()});
    }
    p.ws();
    if (p.s[p.i] === ',') p.i++;
  }
  return out;
}

/** @param {BareItem} item */
function serializeBare(item) {
  switch (item.type) {
    case 'string':
      return `"${String(item.value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    case 'bytes':
      return `:${item.value}:`;
    case 'boolean':
      return item.value ? '?1' : '?0';
    default:
      return String(item.value);
  }
}

/** @param {[string, BareItem][]} params */
function serializeParams(params) {
  return params.map(([k, v]) => (v.type === 'boolean' && v.value ? `;${k}` : `;${k}=${serializeBare(v)}`)).join('');
}

/** @param {Item} item */
function serializeItem(item) {
  if (item.inner) {
    return `(${item.inner.map(serializeItem).join(' ')})${serializeParams(item.params)}`;
  }
  return `${serializeBare(/** @type {BareItem} */ (item.value))}${serializeParams(item.params)}`;
}

// ---------------------------------------------------------------------------
// RFC 9421 signature base
// ---------------------------------------------------------------------------

/**
 * Build the RFC 9421 signature base (§2.5) for one signature label.
 * @param {ParsedRequest} req
 * @param {string} signatureInput Signature-Input header value
 * @param {{label?: string, targetUri: string}} options targetUri is the full
 *   request URI (scheme + authority + path + query); RFC 9421 needs it for
 *   @target-uri, @authority and @scheme.
 */
export function signatureBase(req, signatureInput, options) {
  const dict = parseDictionary(signatureInput);
  const label = options.label ?? [...dict.keys()][0];
  const entry = label ? dict.get(label) : undefined;
  if (!entry || !entry.inner) throw new Error(`No signature "${label ?? ''}" in Signature-Input.`);

  const url = new URL(options.targetUri);
  /** @type {string[]} */
  const lines = [];
  /** @type {string[]} */
  const unsupported = [];
  for (const component of entry.inner) {
    const name = String(component.value?.value);
    const params = Object.fromEntries(component.params.map(([k, v]) => [k, v.value]));
    const id = serializeItem(component);
    let value;
    switch (name) {
      case '@method':
        value = req.method;
        break;
      case '@target-uri':
        value = url.href;
        break;
      case '@authority':
        value = url.host.toLowerCase();
        break;
      case '@scheme':
        value = url.protocol.replace(':', '').toLowerCase();
        break;
      case '@request-target':
        value = url.pathname + url.search;
        break;
      case '@path':
        value = url.pathname;
        break;
      case '@query':
        value = url.search || '?';
        break;
      case '@query-param': {
        const raw = url.search.slice(1).split('&').map((pair) => pair.split('='));
        const match = raw.find(([k]) => decodeURIComponent(k.replace(/\+/g, ' ')) === params.name);
        value = match ? encodeURIComponent(decodeURIComponent((match[1] ?? '').replace(/\+/g, ' '))) : undefined;
        break;
      }
      default:
        if (name.startsWith('@')) {
          unsupported.push(name);
          value = undefined;
        } else if (Object.keys(params).length > 0) {
          unsupported.push(id);
          value = undefined;
        } else {
          const values = req.headers.get(name.toLowerCase());
          value = values ? values.map((v) => v.trim()).join(', ') : undefined;
        }
    }
    if (value === undefined && !unsupported.includes(name) && !unsupported.includes(id)) {
      throw new Error(`The signature covers ${id}, which is not present in the request.`);
    }
    lines.push(`${id}: ${value ?? ''}`);
  }
  lines.push(`"@signature-params": ${serializeItem({value: null, inner: entry.inner, params: entry.params})}`);

  const params = Object.fromEntries(entry.params.map(([k, v]) => [k, v.value]));
  const components = entry.inner.map((c) => String(c.value?.value));
  return {label, base: lines.join('\n'), params, components, unsupported};
}

/**
 * Mastodon's requirements for RFC 9421 signatures (signed_request.rb, v4.7.3).
 * @param {string} method
 * @param {string[]} components
 * @param {Record<string, unknown>} params
 */
export function mastodonRfc9421Problems(method, components, params) {
  const problems = [];
  if (params.created === undefined) problems.push('Mastodon requires the (created) parameter to be signed');
  if (params.keyid === undefined) problems.push('Mastodon requires the keyid parameter');
  if (!components.includes('@method') || !components.includes('@target-uri')) {
    problems.push('Mastodon requires the @method and @target-uri derived components to be signed');
  }
  if (method.toUpperCase() === 'POST' && !components.includes('content-digest')) {
    problems.push('Mastodon requires the Content-Digest header to be signed when doing a POST request');
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Verification (WebCrypto)
// ---------------------------------------------------------------------------

/**
 * @param {string} pem
 * @param {'rsa' | 'ed25519'} kind
 */
export async function importPublicKey(pem, kind) {
  const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '');
  if (!b64) throw new Error('Paste a PEM public key ("-----BEGIN PUBLIC KEY-----").');
  const der = fromBase64(b64);
  const algorithm = kind === 'ed25519' ? {name: 'Ed25519'} : {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'};
  return crypto.subtle.importKey('spki', der, algorithm, false, ['verify']);
}

/**
 * Verify a signature over a signing string / signature base.
 * Supports rsa-sha256 / rsa-v1_5-sha256 (RSASSA-PKCS1-v1_5 SHA-256) and ed25519.
 * @param {{data: string, signature: string, pem: string, kind: 'rsa' | 'ed25519'}} options
 */
export async function verifySignature({data, signature, pem, kind}) {
  const key = await importPublicKey(pem, kind);
  const algorithm = kind === 'ed25519' ? {name: 'Ed25519'} : {name: 'RSASSA-PKCS1-v1_5'};
  return crypto.subtle.verify(algorithm, key, fromBase64(signature), new TextEncoder().encode(data));
}

/**
 * Pick the key kind from a signature algorithm name, if it says.
 * @param {string | undefined} algorithm
 * @returns {'rsa' | 'ed25519' | undefined}
 */
export function keyKindFor(algorithm) {
  if (!algorithm) return undefined;
  const a = algorithm.toLowerCase();
  if (a === 'ed25519') return 'ed25519';
  if (a === 'rsa-sha256' || a === 'rsa-v1_5-sha256') return 'rsa';
  return undefined;
}
