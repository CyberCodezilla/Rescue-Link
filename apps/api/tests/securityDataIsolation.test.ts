import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { incidentsRouter } from '../src/routes/incidents';
import { incidentStore } from '../src/store/incidentStore';
import { Incident } from '@rescue-link/schema';

describe('Cognito Access Token & Rescuer Data Isolation Security Tests', () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/incidents', incidentsRouter);

    await incidentStore.clear();

    // Populate initial test incidents for Rescuer A and Rescuer B
    const incidentA: Incident = {
      id: 'incident-rescuer-A-101',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      status: 'acknowledged',
      priority: 'critical',
      category: 'flood',
      description: 'Rescue mission assigned to Rescuer A',
      peopleAffected: 3,
      urgentNeeds: ['boat'],
      location: { lat: 27.7, lng: 85.3 },
      assignedTo: 'rescuer-A',
    };

    const incidentB: Incident = {
      id: 'incident-rescuer-B-202',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'in_progress',
      priority: 'high',
      category: 'landslide',
      description: 'Evacuation mission assigned to Rescuer B',
      peopleAffected: 2,
      urgentNeeds: ['shelter'],
      location: { lat: 27.8, lng: 85.4 },
      assignedTo: 'rescuer-B',
    };

    await incidentStore.create(incidentA);
    await incidentStore.create(incidentB);
  });

  it('1. Rejects request with 401 when Authorization header is missing', async () => {
    const res = await request(app).patch('/api/incidents/incident-rescuer-A-101').send({ status: 'resolved' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('2. Rejects request with 401 when Authorization format is invalid', async () => {
    const res = await request(app)
      .patch('/api/incidents/incident-rescuer-A-101')
      .set('Authorization', 'Basic invalid-token-credentials')
      .send({ status: 'resolved' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('3. Rejects request with 401 when Cognito token sub is empty or malformed', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', 'Bearer mock-access-token- ');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid mock token sub');
  });

  it('4. Rescuer A (sub: rescuer-A) receives ONLY Rescuer A assigned incidents', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A');

    expect(res.status).toBe(200);
    const incidents = Array.isArray(res.body) ? res.body : res.body.incidents;
    expect(incidents.length).toBe(1);
    expect(incidents[0].id).toBe('incident-rescuer-A-101');
    expect(incidents[0].assignedTo).toBe('rescuer-A');
  });

  it('5. Rescuer B (sub: rescuer-B) receives ONLY Rescuer B assigned incidents', async () => {
    const res = await request(app)
      .get('/api/incidents')
      .set('Authorization', 'Bearer mock-access-token-rescuer-B');

    expect(res.status).toBe(200);
    const incidents = Array.isArray(res.body) ? res.body : res.body.incidents;
    expect(incidents.length).toBe(1);
    expect(incidents[0].id).toBe('incident-rescuer-B-202');
    expect(incidents[0].assignedTo).toBe('rescuer-B');
  });

  it('6. Backend overwrites query filter bypass attempt (GET /api/incidents?assignedTo=rescuer-B by Rescuer A)', async () => {
    const res = await request(app)
      .get('/api/incidents?assignedTo=rescuer-B')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A');

    expect(res.status).toBe(200);
    const incidents = Array.isArray(res.body) ? res.body : res.body.incidents;
    expect(incidents.length).toBe(1);
    expect(incidents[0].id).toBe('incident-rescuer-A-101');
    expect(incidents[0].assignedTo).toBe('rescuer-A');
  });

  it('7. Rejects Cross-User PATCH attempt with 403 Forbidden (Rescuer A attempting to modify Rescuer B incident)', async () => {
    const res = await request(app)
      .patch('/api/incidents/incident-rescuer-B-202')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A')
      .send({ status: 'resolved' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('8. Rejects Cross-User Acknowledge attempt with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/incidents/incident-rescuer-B-202/acknowledge')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A')
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('9. Rejects Cross-User Broadcast attempt with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/incidents/incident-rescuer-B-202/broadcast')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A')
      .send({ message: 'Evacuate immediately' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('10. Rejects Cross-User DELETE attempt with 403 Forbidden', async () => {
    const res = await request(app)
      .delete('/api/incidents/incident-rescuer-B-202')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A');

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden');
  });

  it('11. Rejects Ownership Reassignment attempt (Rescuer A passing assignedTo: rescuer-B)', async () => {
    const res = await request(app)
      .patch('/api/incidents/incident-rescuer-A-101')
      .set('Authorization', 'Bearer mock-access-token-rescuer-A')
      .send({ assignedTo: 'rescuer-B' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Forbidden: You cannot reassign ownership');
  });

  it('12. Allows unauthenticated anonymous SOS creation (POST /api/incidents)', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({
        category: 'fire',
        description: 'Anonymous emergency SOS from survivor',
        location: { lat: 27.7, lng: 85.3 },
        peopleAffected: 2,
        urgentNeeds: ['medical'],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.category).toBe('fire');
  });
});
