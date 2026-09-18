import { Incident, IncidentStatus, Priority } from '@rescue-link/schema';
import { CONFIG } from '@rescue-link/config';

export class DynamoIncidentStore {
  private tableName = CONFIG.DYNAMODB_TABLE_INCIDENTS;
  private docClientPromise: Promise<{ docClient: any; PutCommand: any; GetCommand: any; ScanCommand: any; QueryCommand: any }> | null = null;

  private async getDocClient() {
    if (!this.docClientPromise) {
      this.docClientPromise = (async () => {
        const clientPkg = '@aws-sdk/client-dynamodb';
        const libPkg = '@aws-sdk/lib-dynamodb';
        const { DynamoDBClient } = await import(clientPkg);
        const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand } = await import(libPkg);
        const client = new DynamoDBClient({ region: CONFIG.AWS_REGION });
        const docClient = DynamoDBDocumentClient.from(client);
        return { docClient, PutCommand, GetCommand, ScanCommand, QueryCommand };
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

  async list(filter?: { status?: IncidentStatus | IncidentStatus[]; priority?: Priority; q?: string; since?: number }): Promise<Incident[]> {
    const statusList = filter?.status
      ? Array.isArray(filter.status)
        ? filter.status
        : [filter.status]
      : [];

    if (statusList.length === 1 && !filter?.priority && !filter?.since && !filter?.q) {
      const { docClient, QueryCommand } = await this.getDocClient();
      const res: any = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'StatusCreatedAtIndex',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': statusList[0] },
          ScanIndexForward: false,
        })
      );
      return (res.Items as Incident[]) || [];
    }

    const { docClient, ScanCommand } = await this.getDocClient();

    const filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (statusList.length > 0) {
      expressionAttributeNames['#status'] = 'status';
      const keys = statusList.map((s, idx) => {
        const k = `:st_${idx}`;
        expressionAttributeValues[k] = s;
        return k;
      });
      filterExpressions.push(`#status IN (${keys.join(', ')})`);
    }

    if (filter?.priority) {
      expressionAttributeNames['#priority'] = 'priority';
      expressionAttributeValues[':priority'] = filter.priority;
      filterExpressions.push('#priority = :priority');
    }

    if (filter?.since !== undefined && !Number.isNaN(filter.since)) {
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeNames['#createdAt'] = 'createdAt';
      expressionAttributeValues[':since'] = filter.since;
      filterExpressions.push('(#updatedAt >= :since OR #createdAt >= :since)');
    }

    if (filter?.q && filter.q.trim() !== '') {
      const queryStr = filter.q.trim();
      expressionAttributeNames['#desc'] = 'description';
      expressionAttributeNames['#cat'] = 'category';
      expressionAttributeValues[':qStr'] = queryStr;
      filterExpressions.push('(contains(#desc, :qStr) OR contains(#cat, :qStr))');
    }

    let items: Incident[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const scanInput: any = {
        TableName: this.tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      if (filterExpressions.length > 0) {
        scanInput.FilterExpression = filterExpressions.join(' AND ');
        scanInput.ExpressionAttributeNames = expressionAttributeNames;
        scanInput.ExpressionAttributeValues = expressionAttributeValues;
      }

      const res: any = await docClient.send(new ScanCommand(scanInput));
      if (res.Items) {
        items.push(...(res.Items as Incident[]));
      }
      lastEvaluatedKey = res.LastEvaluatedKey;
    } while (lastEvaluatedKey);

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
