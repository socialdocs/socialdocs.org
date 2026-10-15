// Start the server: `DOMAIN=social.example node src/main.js`
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { loadConfig } from './config.js';
import { openStore } from './store.js';
import { createApp } from './app.js';

const cfg = loadConfig();
const store = openStore(cfg.dataDir);
const handler = createApp({ cfg, store });

// Federation needs https on the default port. Terminate TLS here, or put a
// reverse proxy in front and run plain http behind it.
const server = cfg.tlsCert
  ? https.createServer({ cert: fs.readFileSync(cfg.tlsCert), key: fs.readFileSync(cfg.tlsKey) }, handler)
  : http.createServer(handler);

server.listen(cfg.port, () => {
  console.log(`@${cfg.username}@${cfg.domain} listening on port ${cfg.port}`);
});
