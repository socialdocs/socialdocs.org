// A tiny store: the actor's key pair, its followers and its notes.
// It persists to DATA_DIR as JSON when one is configured. Swap it for a
// database in a real server; the rest of the code only uses these methods.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function openStore(dataDir) {
  const file = dataDir && path.join(dataDir, 'state.json');
  let state = file && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;

  if (!state) {
    // ActivityPub doesn't mandate a key type, but RSA is what every
    // server can verify today (Ed25519 support is still spreading).
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    state = {
      publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }),
      privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
      followers: {}, // actor id -> { inbox, sharedInbox }
      notes: [],     // newest last
    };
  }

  const save = () => {
    if (!file) return;
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state, null, 2), { mode: 0o600 });
  };
  save();

  return {
    publicKeyPem: state.publicKeyPem,
    privateKey: crypto.createPrivateKey(state.privateKeyPem),
    followers: () => Object.entries(state.followers).map(([id, f]) => ({ id, ...f })),
    addFollower(id, { inbox, sharedInbox }) { state.followers[id] = { inbox, sharedInbox }; save(); },
    removeFollower(id) { delete state.followers[id]; save(); },
    notes: () => state.notes,
    addNote(note) { state.notes.push(note); save(); },
    note: (id) => state.notes.find((n) => n.id === id),
  };
}
