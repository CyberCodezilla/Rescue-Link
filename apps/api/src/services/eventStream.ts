import { Response } from 'express';
import { Incident } from '@rescue-link/schema';

export interface SSEEvent {
  type: 'incident:created' | 'incident:updated' | 'broadcast:sent';
  incident: Incident;
  message?: string;
  timestamp: number;
}

export interface BroadcastAdapter {
  broadcast?: (event: SSEEvent) => void | Promise<void>;
  publish?: (event: SSEEvent) => void | Promise<void>;
}

export class EventStreamManager {
  private adapter: BroadcastAdapter | null = null;
  private clients: Set<Response> = new Set();

  constructor(adapter: BroadcastAdapter | null = null) {
    this.adapter = adapter;
  }

  setAdapter(adapter: BroadcastAdapter | null): void {
    this.adapter = adapter;
  }

  addClient(res: Response): void {
    this.clients.add(res);
  }

  removeClient(res: Response): void {
    this.clients.delete(res);
  }

  broadcast(event: SSEEvent): void {
    if (this.adapter?.broadcast) {
      void this.adapter.broadcast(event);
    } else if (this.adapter?.publish) {
      void this.adapter.publish(event);
    }

    const payload = `event: incident\ndata: ${JSON.stringify(event)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const eventStreamManager = new EventStreamManager();

/**
 * Local in-process broadcast adapter.
 * Used for single-node operation and tests.
 */
export class LocalBroadcastAdapter implements BroadcastAdapter {
  broadcast(event: SSEEvent): void {
    void event;
  }
}
