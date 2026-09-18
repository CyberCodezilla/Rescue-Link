import { Incident, IncidentStatus, Priority, IncidentSchema } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';
import type { IncidentFilterOptions } from './incidentStore';

export class DynamoIncidentStore {
  private tableName = CONFIG.DYNAMODB_TABLE_INCIDENTS;
  private docClientPromise: Promise<{ docClient: any; PutCommand: any; GetCommand: any; ScanCommand: any }> | null = null;

  private async getDocClient() {
    if (!this.docClientPromise) {
      this.docClientPromise = (async () => {
        const clientPkg = '@aws-sdk/client-dynamodb';
        const libPkg = '@aws-sdk/lib-dynamodb';
        const { DynamoDBClient } = await import(clientPkg);
        const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = await import(libPkg);
        const client = new DynamoDBClient({ region: CONFIG.AWS_REGION });
        const docClient = DynamoDBDocumentClient.from(client);
        return { docClient, PutCommand, GetCommand, ScanCommand };
      })();
    }
    return this.docClientPromise;
  }

  async create(incident: Incident): Promise<Incident> {
    // Persistence Boundary Guard: Enforce strict schema validation before writing to DynamoDB
    const validIncident = IncidentSchema.parse(incident);
    const { docClient, PutCommand } = await this.getDocClient();

    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: validIncident,
      })
    );

    return validIncident;
  }

  async getById(id: string): Promise<Incident | null> {
    const { docClient, GetCommand } = await this.getDocClient();

    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );

    if (!res.Item) return null;
    const parsed = IncidentSchema.safeParse(res.Item);
    if (!parsed.success) {
      console.warn(`[DynamoIncidentStore] Ignored malformed item in DB (ID: ${id}):`, parsed.error.format());
      return null;
    }
    return parsed.data;
  }

  async list(filter?: IncidentFilterOptions): Promise<Incident[]> {
    const { docClient, ScanCommand } = await this.getDocClient();

    let items: Incident[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const res: any = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
      if (res.Items) {
        for (const item of res.Items) {
          const parsed = IncidentSchema.safeParse(item);
          if (parsed.success) {
            items.push(parsed.data);
          } else {
            console.warn(`[DynamoIncidentStore] Ignored malformed item in DB list scan (ID: ${item?.id}):`, parsed.error.format());
          }
        }
      }
      lastEvaluatedKey = res.LastEvaluatedKey;
    } while (lastEvaluatedKey);

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

      items = items.filter((i) => {
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

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  async update(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: Incident = {
      ...existing,
      ...updates,
      triage: updates.triage ? { ...(existing.triage || {}), ...updates.triage } : existing.triage,
      updatedAt: Date.now(),
    };

    // Enforce persistence boundary schema validation before update
    const validUpdated = IncidentSchema.parse(updated);
    await this.create(validUpdated);
    return validUpdated;
  }

  async clear(): Promise<void> {
    // No-op for safety in production table
  }
}
