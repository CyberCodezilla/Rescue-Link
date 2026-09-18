import { Incident, IncidentStatus, Priority } from '@rescue-link/schema';
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

  async create(incident: Incident): Promise<Incident> {
    this.incidents.set(incident.id, incident);
    return incident;
  }

  async getById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async list(filter?: { status?: IncidentStatus; priority?: Priority }): Promise<Incident[]> {
    const hasStatus = Boolean(filter?.status);
    const hasPriority = Boolean(filter?.priority);

    let result = Array.from(this.incidents.values());

    if (hasStatus || hasPriority) {
      result = result.filter(
        (i) =>
          (!hasStatus || i.status === filter!.status) &&
          (!hasPriority || i.priority === filter!.priority)
      );
    }

    return result.sort((a, b) => b.createdAt - a.createdAt);
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const existing = this.incidents.get(id);
    if (!existing) return null;

    const updated: Incident = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    this.incidents.set(id, updated);
    return updated;
  }

  async clear(): Promise<void> {
    this.incidents.clear();
  }
}

export class DelegatingIncidentStore implements IIncidentStore {
  private memoryStore = new InMemoryIncidentStore();
  private dynamoStore = new DynamoIncidentStore();

  private isMock(): boolean {
    return CONFIG.USE_LOCAL_MOCK_STORE || !process.env.AWS_ACCESS_KEY_ID;
  }

  async create(incident: Incident): Promise<Incident> {
    if (this.isMock()) {
      return this.memoryStore.create(incident);
    }
    try {
      const created = await this.dynamoStore.create(incident);
      await this.memoryStore.create(created);
      return created;
    } catch (err) {
      console.warn('[IncidentStore] DynamoDB create failed, falling back to memory store:', err);
      return this.memoryStore.create(incident);
    }
  }

  async getById(id: string): Promise<Incident | null> {
    if (this.isMock()) {
      return this.memoryStore.getById(id);
    }
    try {
      const item = await this.dynamoStore.getById(id);
      if (item) {
        await this.memoryStore.create(item);
      }
      return item ?? this.memoryStore.getById(id);
    } catch (err) {
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
      console.warn('[IncidentStore] DynamoDB list failed, falling back to memory store:', err);
      return this.memoryStore.list(filter);
    }
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    if (this.isMock()) {
      return this.memoryStore.update(id, updates);
    }
    try {
      const updated = await this.dynamoStore.update(id, updates);
      if (updated) {
        await this.memoryStore.create(updated);
      }
      return updated ?? this.memoryStore.update(id, updates);
    } catch (err) {
      console.warn('[IncidentStore] DynamoDB update failed, falling back to memory store:', err);
      return this.memoryStore.update(id, updates);
    }
  }

  async clear(): Promise<void> {
    await this.memoryStore.clear();
  }
}

export const incidentStore = new DelegatingIncidentStore();
