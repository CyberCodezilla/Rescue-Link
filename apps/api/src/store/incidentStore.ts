import { Incident, IncidentSchema, IncidentStatus, Priority } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';
import { DynamoIncidentStore } from './dynamoStore';

export interface IIncidentStore {
  create(incident: Incident): Promise<Incident>;
  getById(id: string): Promise<Incident | null>;
  list(filter?: { status?: IncidentStatus; priority?: Priority }): Promise<Incident[]>;
  update(id: string, updates: Partial<Incident>): Promise<Incident | null>;
  clear(): Promise<void>;
}

export class InMemoryIncidentStore implements IIncidentStore {
  private incidents: Map<string, Incident> = new Map();

  getStoreTelemetry(): { activeStore: 'memory'; fallbackCount: number } {
    return { activeStore: 'memory', fallbackCount: 0 };
  }

  async create(incident: Incident): Promise<Incident> {
    const validated = IncidentSchema.parse(incident);
    this.incidents.set(validated.id, validated);
    return validated;
  }

  async getById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async list(filter?: { status?: IncidentStatus; priority?: Priority }): Promise<Incident[]> {
    let result = Array.from(this.incidents.values());

    if (filter?.status) {
      result = result.filter((incident) => incident.status === filter.status);
    }
    if (filter?.priority) {
      result = result.filter((incident) => incident.priority === filter.priority);
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const existing = this.incidents.get(id);
    if (!existing) return null;

    const updated = IncidentSchema.parse({
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    });

    this.incidents.set(id, updated);
    return updated;
  }

  async clear(): Promise<void> {
    this.incidents.clear();
  }
}

export class DelegatingIncidentStore implements IIncidentStore {
  private fallbackCount = 0;
  private memoryStore = new InMemoryIncidentStore();
  private dynamoStore = new DynamoIncidentStore();

  getStoreTelemetry(): { activeStore: 'memory' | 'dynamo'; fallbackCount: number } {
    return {
      activeStore: this.isMock() ? 'memory' : 'dynamo',
      fallbackCount: this.fallbackCount,
    };
  }

  private isMock(): boolean {
    return CONFIG.USE_LOCAL_MOCK_STORE || process.env.NODE_ENV === 'test';
  }

  async create(incident: Incident): Promise<Incident> {
    const validated = IncidentSchema.parse(incident);

    if (this.isMock()) {
      return this.memoryStore.create(validated);
    }

    try {
      const created = await this.dynamoStore.create(validated);
      await this.memoryStore.create(created);
      return created;
    } catch (err) {
      this.fallbackCount++;
      console.warn('[IncidentStore] DynamoDB create failed, falling back to memory store:', err);
      return this.memoryStore.create(validated);
    }
  }

  async getById(id: string): Promise<Incident | null> {
    if (this.isMock()) {
      return this.memoryStore.getById(id);
    }

    try {
      const item = await this.dynamoStore.getById(id);
      if (item) await this.memoryStore.create(item);
      return item ?? this.memoryStore.getById(id);
    } catch (err) {
      this.fallbackCount++;
      console.warn('[IncidentStore] DynamoDB getById failed, falling back to memory store:', err);
      return this.memoryStore.getById(id);
    }
  }

  async list(filter?: { status?: IncidentStatus; priority?: Priority }): Promise<Incident[]> {
    if (this.isMock()) {
      return this.memoryStore.list(filter);
    }

    try {
      return await this.dynamoStore.list(filter);
    } catch (err) {
      this.fallbackCount++;
      console.warn('[IncidentStore] DynamoDB list failed, falling back to memory store:', err);
      return this.memoryStore.list(filter);
    }
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const validated = IncidentSchema.parse({
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    });

    if (this.isMock()) {
      return this.memoryStore.update(id, validated);
    }

    try {
      const updated = await this.dynamoStore.update(id, validated);
      if (updated) await this.memoryStore.create(updated);
      return updated ?? this.memoryStore.update(id, validated);
    } catch (err) {
      this.fallbackCount++;
      console.warn('[IncidentStore] DynamoDB update failed, falling back to memory store:', err);
      return this.memoryStore.update(id, validated);
    }
  }

  async clear(): Promise<void> {
    await this.memoryStore.clear();
  }
}

export const incidentStore = new DelegatingIncidentStore();
