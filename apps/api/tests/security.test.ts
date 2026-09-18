import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('API Security & Authentication Tests', () => {
  it('rejects unauthenticated PATCH /api/incidents/:id management requests', async () => {
    const res = await request(app)
      .patch('/api/incidents/test-id-123')
      .set('NODE_ENV', 'production')
      .send({ status: 'resolved' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized access');
  });

  it('allows authenticated PATCH /api/incidents/:id with valid x-api-key', async () => {
    const res = await request(app)
      .patch('/api/incidents/non-existent-id')
      .set('x-api-key', 'rescuelink-responder-key-2026')
      .send({ status: 'resolved' });

    // Should pass auth check (returns 404 because ID doesn't exist, not 401)
    expect(res.status).toBe(404);
  });

  it('rejects unauthenticated /api/notifications/test request', async () => {
    const res = await request(app)
      .post('/api/notifications/test')
      .set('NODE_ENV', 'production')
      .send({ priority: 'critical' });

    expect(res.status).toBe(401);
  });

  it('returns helmet security headers on API responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
