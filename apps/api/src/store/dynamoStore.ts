import { Incident, IncidentStatus, Priority } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';

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
    const { docClient, PutCommand } = await this.getDocClient();

    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: incident,
      })
    );

    return incident;
  }

  async getById(id: string): Promise<Incident | null> {
    const { docClient, GetCommand } = await this.getDocClient();

    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );

    return (res.Item as Incident) || null;
  }

  async list(filter?: { status?: IncidentStatus; priority?: Priority; q?: string; since?: number }): Promise<Incident[]> {
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
        items.push(...(res.Items as Incident[]));
      }
      lastEvaluatedKey = res.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const hasStatus = Boolean(filter?.status);
    const hasPriority = Boolean(filter?.priority);
    const hasSince = filter?.since !== undefined && !Number.isNaN(filter.since);
    const hasQuery = Boolean(filter?.q && filter.q.trim() !== '');
    const searchTerm = hasQuery ? filter!.q!.trim().toLowerCase() : '';

    if (hasStatus || hasPriority || hasSince || hasQuery) {
      items = items.filter((i) => {
        if (hasStatus && i.status !== filter!.status) return false;
        if (hasPriority && i.priority !== filter!.priority) return false;
        if (hasSince && (i.updatedAt || i.createdAt) < filter!.since!) return false;
        if (hasQuery) {
          const textToSearch = [
            i.category,
            i.description,
            i.location?.label,
            i.assignedTo,
            i.triage?.suggestedAction,
            i.triage?.notes,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!textToSearch.includes(searchTerm)) return false;
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

    await this.create(updated);
    return updated;
  }

  async clear(): Promise<void> {
    // No-op for safety in production table
  }
}
