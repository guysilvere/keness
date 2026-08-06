import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from './index.js';

describe('Web API Routes', () => {
  beforeEach(() => {
    const tmp = mkdtempSync(join(tmpdir(), 'keness-test-'));
    process.env['KENESS_DIR'] = join(tmp, '.keness');
    process.env['KENESS_HOME'] = tmp;
  });
  it('handles GET /api/status', async () => {
    const app = await createServer();
    const res = await app.inject({ method: 'GET', url: '/api/status' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', version: '0.1.0' });
  });

  it('handles POST /api/registry create element', async () => {
    const app = await createServer();
    const res = await app.inject({
      method: 'POST',
      url: '/api/registry',
      payload: {
        type: 'skill',
        name: 'test',
        description: 'test description',
        content: 'Test skill',
        scope: 'global',
        appIds: ['claude-code', 'cursor', 'codex', 'gemini-cli', 'opencode'],
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty('entry');
  });
});
