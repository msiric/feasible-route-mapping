import 'dotenv/config';
import { spawn } from 'node:child_process';
import { createGateway } from './demo/gateway';
const production = process.env.NODE_ENV === 'production';
const secret = process.env.DEMO_PROXY_SECRET || '';
const origin = process.env.CLIENT_URI || 'http://localhost:5176';
if (production && (secret.length < 32 || !origin.startsWith('https://'))) throw new Error('Production demo configuration is incomplete');
let ready = !process.env.VALHALLA_CONFIG;
const engine = process.env.VALHALLA_CONFIG ? spawn('/usr/local/bin/valhalla_service', [process.env.VALHALLA_CONFIG, '1'], { stdio: ['ignore', 'ignore', 'inherit'] }) : undefined;
engine?.on('exit', () => process.exit(1));
engine?.on('error', () => process.exit(1));
const app = createGateway({ secret, origin, production, ready: () => ready });
const server = app.listen(Number(process.env.PORT || 5076), '0.0.0.0', () => console.log('Routing gateway started'));
server.requestTimeout = 50_000; server.headersTimeout = 10_000;
async function checkStartup() {
  for (let i = 0; i < 60; i++) {
    try {
      const result = await fetch('http://127.0.0.1:8002/status', { signal: AbortSignal.timeout(1500) });
      if (result.ok) { ready = true; console.log('Routing engine ready'); return; }
    } catch { /* Bounded startup wait; no periodic keep-alive. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  engine?.kill('SIGTERM'); process.exit(1);
}
if (engine) void checkStartup();
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => {
  ready = false; server.close(); engine?.kill('SIGTERM');
  setTimeout(() => process.exit(0), 3000).unref();
});
