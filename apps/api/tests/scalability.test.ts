import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { incidentStore } from '../src/store/incidentStore';
import { notificationQueue } from '../src/services/notificationQueue';
import { eventStreamManager, LocalBroadcastAdapter, BroadcastAdapter, SSEEvent } from '../src/services/eventStream';

describe('API Scalability, Notification Queue & Pub/Sub Architecture Tests', () => {
  beforeEach(async () => {
    await incidentStore.clear();
  });

  it('NotificationQueue enqueues jobs asynchronously without throwing', async () => {
    const mockIncident = {
      id: 'queue-test-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new' as const,
      priority: 'critical' as const,
      category: 'flood',
      description: 'Queue test incident',
      peopleAffected: 4,
      urgentNeeds: ['boat'],
      location: { lat: 37.77, lng: -122.41 },
    };

    notificationQueue.enqueue(mockIncident);
    const stats = notificationQueue.getStats();
    expect(stats).toHaveProperty('completedJobs');
    expect(stats).toHaveProperty('failedJobs');
  });

  it('EventStreamManager supports custom BroadcastAdapter for multi-node scaling', async () => {
    class CustomAdapter implements BroadcastAdapter {
      public publishedEvents: SSEEvent[] = [];
      private handler?: (event: SSEEvent) => void;

      async publish(event: SSEEvent): Promise<void> {
        this.publishedEvents.push(event);
        if (this.handler) this.handler(event);
      }

      onMessage(handler: (event: SSEEvent) => void): void {
        this.handler = handler;
      }
    }

    const customAdapter = new CustomAdapter();
    eventStreamManager.setAdapter(customAdapter);

    const testEvent: SSEEvent = {
      type: 'incident:created',
      incident: {
        id: 'sse-test-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'new',
        priority: 'high',
        category: 'fire',
        description: 'PubSub test',
        peopleAffected: 2,
        urgentNeeds: [],
        location: { lat: 40.71, lng: -74.00 },
      },
      timestamp: Date.now(),
    };

    eventStreamManager.broadcast(testEvent);
    expect(customAdapter.publishedEvents.length).toBe(1);
    expect(customAdapter.publishedEvents[0].incident.id).toBe('sse-test-1');

    // Reset back to local adapter
    eventStreamManager.setAdapter(new LocalBroadcastAdapter());
  });

  it('GET /api/incidents supports multi-status filter ?status=new,acknowledged', async () => {
    await incidentStore.create({
      id: 'inc-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new',
      priority: 'critical',
      category: 'flood',
      description: 'Test flood',
      peopleAffected: 2,
      urgentNeeds: [],
      location: { lat: 0, lng: 0 },
    });

    await incidentStore.create({
      id: 'inc-2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'resolved',
      priority: 'low',
      category: 'other',
      description: 'Resolved incident',
      peopleAffected: 1,
      urgentNeeds: [],
      location: { lat: 0, lng: 0 },
    });

    const res = await request(app).get('/api/incidents?status=new,acknowledged');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe('inc-1');
  });

  it('GET /api/incidents supports pagination envelope ?page=1&limit=1', async () => {
    await incidentStore.create({
      id: 'page-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new',
      priority: 'critical',
      category: 'flood',
      description: 'Page test 1',
      peopleAffected: 2,
      urgentNeeds: [],
      location: { lat: 0, lng: 0 },
    });

    await incidentStore.create({
      id: 'page-2',
      createdAt: Date.now() - 100,
      updatedAt: Date.now() - 100,
      status: 'new',
      priority: 'high',
      category: 'fire',
      description: 'Page test 2',
      peopleAffected: 3,
      urgentNeeds: [],
      location: { lat: 0, lng: 0 },
    });

    const res = await request(app).get('/api/incidents?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('incidents');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.incidents.length).toBe(1);
    expect(res.body.pagination.totalCount).toBe(2);
    expect(res.body.pagination.hasMore).toBe(true);
  });

  it('GET /api/incidents supports full-text search query ?q=balcony and timestamp delta ?since=', async () => {
    const pastTime = Date.now() - 10000;
    const currentTime = Date.now();

    await incidentStore.create({
      id: 'search-1',
      createdAt: pastTime - 5000,
      updatedAt: pastTime - 5000,
      status: 'new',
      priority: 'high',
      category: 'flood',
      description: 'Trapped on balcony in downtown area',
      peopleAffected: 2,
      urgentNeeds: ['boat'],
      location: { lat: 37.77, lng: -122.41, label: 'Downtown Tower' },
    });

    await incidentStore.create({
      id: 'search-2',
      createdAt: currentTime,
      updatedAt: currentTime,
      status: 'new',
      priority: 'critical',
      category: 'fire',
      description: 'Basement fire spreading to main hall',
      peopleAffected: 5,
      urgentNeeds: ['medical'],
      location: { lat: 37.78, lng: -122.42, label: 'Main Street Mall' },
    });

    // Test q parameter
    const searchRes = await request(app).get('/api/incidents?q=balcony');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.length).toBe(1);
    expect(searchRes.body[0].id).toBe('search-1');

    // Test since parameter
    const sinceRes = await request(app).get(`/api/incidents?since=${currentTime - 1000}`);
    expect(sinceRes.status).toBe(200);
    expect(sinceRes.body.length).toBe(1);
    expect(sinceRes.body[0].id).toBe('search-2');
  });
});
