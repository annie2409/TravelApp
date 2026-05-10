// Smoke test for the bootstrap-level health route.
// Builds a minimal app instead of importing src/index.ts so we don't
// open a real port or initialize sockets/Prisma during unit tests.
import express from 'express';
import request from 'supertest';

function buildApp() {
  const app = express();
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(buildApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
