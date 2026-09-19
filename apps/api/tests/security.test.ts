import { describe, expect, it } from 'vitest';
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
      .set('x-api-key', 'test-only-rescue-link-key')
      .send({ status: 'resolved' });

    expect(res.status).toBe(404);
  });

  it('rejects unauthenticated /api/notifications/test request', async () => {
    const res = await request(app)
      .post('/api/notifications/test')
      .set('NODE_ENV', 'production')
      .send({ priority: 'critical' });

    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated POST /api/incidents/:id/acknowledge request', async () => {
    const res = await request(app)
      .post('/api/incidents/test-id-123/acknowledge')
      .set('NODE_ENV', 'production')
      .send({ assignedTo: 'unit-1' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized access');
  });

  it('rejects unauthenticated POST /api/incidents/:id/broadcast request', async () => {
    const res = await request(app)
      .post('/api/incidents/test-id-123/broadcast')
      .set('NODE_ENV', 'production')
      .send({ message: 'Emergency alert' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized access');
  });

  it('includes rate limit standard headers on API requests', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).toHaveProperty('ratelimit-limit');
  });
});
