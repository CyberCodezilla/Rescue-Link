import { Response } from 'express';
import { Incident } from '@rescue-link/schema';

export interface SSEEvent {
  type: 'incident:created' | 'incident:updated' | 'broadcast:sent';
  incident: Incident;
  message?: string;
  timestamp: number;
}

export interface BroadcastAdapter {
  publish?: (event: SSEEvent) => void | Promise<void>;
  broadcast?: (event: SSEEvent) => void | Promise<void>;
  onMessage?: (handler: (event: SSEEvent) => void) => void;
}

export class EventStreamManager {
  private adapter: BroadcastAdapter | null = null;
  private clients: Set<Response> = new Set();

  constructor(adapter: BroadcastAdapter | null = null) {
    if (adapter) {
      this.setAdapter(adapter);
    }
  }

  setAdapter(adapter: BroadcastAdapter | null): void {
    this.adapter = adapter;
    if (this.adapter?.onMessage) {
      this.adapter.onMessage((event) => {
        this.sendToClients(event);
      });
    }
  }

  addClient(res: Response): void {
    this.clients.add(res);
  }

  removeClient(res: Response): void {
    this.clients.delete(res);
  }

  private sendToClients(event: SSEEvent): void {
    const payload = `event: incident\ndata: ${JSON.stringify(event)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  broadcast(event: SSEEvent): void {
    if (this.adapter?.publish) {
      void this.adapter.publish(event);
    } else if (this.adapter?.broadcast) {
      void this.adapter.broadcast(event);
    } else {
      this.sendToClients(event);
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
  private handlers: Set<(event: SSEEvent) => void> = new Set();

  publish(event: SSEEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error('[LocalBroadcastAdapter] Handler execution error:', err);
      }
    }
  }

  broadcast(event: SSEEvent): void {
    this.publish(event);
  }

  onMessage(handler: (event: SSEEvent) => void): void {
    this.handlers.add(handler);
  }
}
