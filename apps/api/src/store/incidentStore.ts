import { z } from 'zod';
import { Incident, IncidentStatus, Priority, IncidentSchema } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';
import { DynamoIncidentStore } from './dynamoStore';

export interface IncidentFilterOptions {
  status?: IncidentStatus | IncidentStatus[];
  priority?: Priority | Priority[];
  q?: string;
  since?: number;
}

export interface IIncidentStore {
  create(incident: Incident): Promise<Incident>;
  getById(id: string): Promise<Incident | null>;
  list(filter?: IncidentFilterOptions): Promise<Incident[]>;
  update(id: string, updates: Partial<Incident>): Promise<Incident | null>;
  clear(): Promise<void>;
}

export class InMemoryIncidentStore implements IIncidentStore {
  private incidents: Map<string, Incident> = new Map();

  async create(incident: Incident): Promise<Incident> {
    const validIncident = IncidentSchema.parse(incident);
    this.incidents.set(validIncident.id, validIncident);
    return validIncident;
  }

  async getById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async list(filter?: IncidentFilterOptions): Promise<Incident[]> {
    let result = Array.from(this.incidents.values());

    if (filter) {
      const statuses = filter.status
        ? Array.isArray(filter.status)
          ? filter.status
          : [filter.status]
        : undefined;

      const priorities = filter.priority
        ? Array.isArray(filter.priority)
          ? filter.priority
          : [filter.priority]
        : undefined;

      const searchQuery = filter.q?.toLowerCase();
      const sinceTime = filter.since;

      result = result.filter((i) => {
        if (statuses && !statuses.includes(i.status)) return false;
        if (priorities && !priorities.includes(i.priority)) return false;
        if (sinceTime !== undefined && i.createdAt < sinceTime) return false;
        if (searchQuery) {
          const text = `${i.category} ${i.description} ${i.triage?.suggestedAction || ''}`.toLowerCase();
          if (!text.includes(searchQuery)) return false;
        }
        return true;
      });
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

    const validUpdated = IncidentSchema.parse(updated);
    this.incidents.set(id, validUpdated);
    return validUpdated;
  }

  async clear(): Promise<void> {
    this.incidents.clear();
  }
}

export class DelegatingIncidentStore implements IIncidentStore {
  private memoryStore = new InMemoryIncidentStore();
  private dynamoStore = new DynamoIncidentStore();
  private fallbackCount = 0;
  private lastFallbackTime: number | null = null;

  constructor() {
    this.checkHealthOnStartup();
  }

  private isMock(): boolean {
    return CONFIG.USE_LOCAL_MOCK_STORE || !process.env.AWS_ACCESS_KEY_ID;
  }

  public checkHealthOnStartup(): void {
    const isMockMode = this.isMock();
    const isProd = CONFIG.NODE_ENV === 'production';

    console.log(`[IncidentStore] Initialized active store: ${isMockMode ? 'InMemoryIncidentStore (mock mode)' : 'DynamoDB Dual-Adapter Store'}`);

    if (isProd && isMockMode) {
      console.error(
        '🚨 [DATA PERSISTENCE ALERT] PRODUCTION WARNING: Server is using InMemoryIncidentStore. Data WILL NOT persist across server restarts! Verify AWS_ACCESS_KEY_ID and USE_LOCAL_MOCK_STORE settings.'
      );
    }
  }

  public getStoreTelemetry() {
    const isMockMode = this.isMock();
    const isProd = CONFIG.NODE_ENV === 'production';

    return {
      activeStore: isMockMode ? ('memory' as const) : ('dynamodb' as const),
      isMock: isMockMode,
      fallbackCount: this.fallbackCount,
      lastFallbackTime: this.lastFallbackTime,
      isProductionFallbackAlert: isProd && isMockMode,
    };
  }

  private recordFallback(operation: string, err: unknown) {
    this.fallbackCount++;
    this.lastFallbackTime = Date.now();
    const isProd = CONFIG.NODE_ENV === 'production';

    if (isProd) {
      console.error(
        `🚨 [DATA PERSISTENCE ALERT] Production DynamoDB operation '${operation}' failed! Falling back to volatile InMemoryIncidentStore. Error:`,
        err
      );
    } else {
      console.warn(`[IncidentStore] DynamoDB operation '${operation}' failed, falling back to memory store:`, err);
    }
  }

  async create(incident: Incident): Promise<Incident> {
    // Upfront schema enforcement at the persistence entry point
    const validated = IncidentSchema.parse(incident);

    if (this.isMock()) {
      return this.memoryStore.create(validated);
    }
    try {
      const created = await this.dynamoStore.create(validated);
      await this.memoryStore.create(created);
      return created;
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw err;
      }
      this.recordFallback('create', err);
      return this.memoryStore.create(validated);
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
      this.recordFallback('getById', err);
      return this.memoryStore.getById(id);
    }
  }

  async list(filter?: IncidentFilterOptions): Promise<Incident[]> {
    if (this.isMock()) {
      return this.memoryStore.list(filter);
    }
    try {
      return await this.dynamoStore.list(filter);
    } catch (err) {
      this.recordFallback('list', err);
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
      if (err instanceof z.ZodError) {
        throw err;
      }
      this.recordFallback('update', err);
      return this.memoryStore.update(id, updates);
    }
  }

  async clear(): Promise<void> {
    await this.memoryStore.clear();
  }
}

export const incidentStore = new DelegatingIncidentStore();
