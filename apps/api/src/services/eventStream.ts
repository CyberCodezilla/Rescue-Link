import { Response } from 'express';
import { Incident } from '@rescue-link/schema';

export interface SSEEvent {
  type: 'incident:created' | 'incident:updated' | 'broadcast:sent';
  incident: Incident;
  message?: string;
  timestamp: number;
}

export interface BroadcastAdapter {
  publish(event: SSEEvent): Promise<void>;
  onMessage(handler: (event: SSEEvent) => void): void;
}

export class LocalBroadcastAdapter implements BroadcastAdapter {
  private handler?: (event: SSEEvent) => void;

  async publish(event: SSEEvent): Promise<void> {
    if (this.handler) {
      this.handler(event);
    }
  }

  onMessage(handler: (event: SSEEvent) => void): void {
    this.handler = handler;
  }
}

export class EventStreamManager {
  private clients: Set<Response> = new Set();
  private adapter: BroadcastAdapter = new LocalBroadcastAdapter();

  constructor() {
    this.adapter.onMessage((event) => this.writeToClients(event));
  }

  setAdapter(adapter: BroadcastAdapter): void {
    this.adapter = adapter;
    this.adapter.onMessage((event) => this.writeToClients(event));
  }

  addClient(res: Response): void {
    this.clients.add(res);
  }

  removeClient(res: Response): void {
    this.clients.delete(res);
  }

  broadcast(event: SSEEvent): void {
    this.adapter.publish(event).catch((err) => {
      console.error('[EventStreamManager] Pub/Sub publish error:', err);
      this.writeToClients(event);
    });
  }

  private writeToClients(event: SSEEvent): void {
    const payload = `event: incident\ndata: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const eventStreamManager = new EventStreamManager();
