import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { allAdapters, detectAll } from '@keness/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, '../../dist/client');

export async function createServer() {
  const app = Fastify({ logger: false });

  // Serve the built Preact app when available
  if (existsSync(clientDir)) {
    await app.register(staticPlugin, {
      root: clientDir,
      prefix: '/',
    });
  }

  app.get('/api/status', async () => ({
    status: 'ok',
    version: '0.0.1',
  }));

  app.get('/api/detect', async () => {
    const results = await detectAll(allAdapters);
    return { results };
  });

  return app;
}

export async function startServer(port = 0): Promise<{ url: string }> {
  const app = await createServer();
  const address = await app.listen({ port, host: '127.0.0.1' });
  return { url: address };
}
