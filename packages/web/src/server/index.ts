import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { registerApiRoutes } from './api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, '../../dist/client');

export async function createServer() {
  const app = Fastify({ logger: false });

  registerApiRoutes(app);

  // SPA fallback: serve index.html for any non-API route
  if (existsSync(clientDir)) {
    await app.register(staticPlugin, {
      root: clientDir,
      prefix: '/',
    });
    app.setNotFoundHandler((_req, reply) => {
      reply.sendFile('index.html');
    });
  }

  return app;
}

export async function startServer(port = 0): Promise<{ url: string; port: number }> {
  const app = await createServer();
  const address = await app.listen({ port, host: '127.0.0.1' });
  const actualPort = (app.server.address() as { port: number }).port;
  return { url: address, port: actualPort };
}
