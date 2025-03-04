// src/lib/api/WebKeepAliveConnection.ts
import { isDev } from '../../../utils/env';
import WebPort from '../utils/Port';

function log(message: string, details?: any, devOnly = true) {
  if (devOnly && !isDev) return;
  console.log('[web keep alive]', message, details);
}

/**
 * A helper class to maintain an active connection to the background service
 * This replaces the Chrome extension's KeepAliveConnection
 */
export default class WebKeepAliveConnection {
  private port: WebPort | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly clientName: string;
  private readonly pingIntervalMs = 25000; // 25 seconds
  private readonly reconnectDelayMs = 2000; // 2 seconds

  constructor(clientName: string) {
    this.clientName = clientName;
  }

  public connect() {
    this.cleanup(); // Clean up any existing connections

    try {
      // Create a port specifically for keeping alive
      this.port = new WebPort(
        {
          name: `keep-alive-${this.clientName}`,
        },
        {
          onConnect: (port) => {
            log(`Keep alive connection established for ${this.clientName}`);
            this.setupPing();
          },
        }
      );

      // Handle disconnection
      this.port.onDisconnect.addListener('disconnect', () => {
        log(`Keep alive disconnected for ${this.clientName}`);
        this.handleDisconnect();
      });
    } catch (error) {
      log('Error establishing keep-alive connection', error, false);
      this.scheduleReconnect();
    }
  }

  private setupPing() {
    // Clear any existing ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Set up regular pings to keep the connection alive
    this.pingInterval = setInterval(() => {
      if (this.port && this.port.connected) {
        this.port.postMessage({
          type: 'PING',
          timestamp: Date.now(),
          client: this.clientName,
        });
      } else {
        log('Connection lost, attempting to reconnect');
        this.scheduleReconnect();
      }
    }, this.pingIntervalMs);
  }

  private handleDisconnect() {
    this.cleanup();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Schedule a reconnection attempt
    this.reconnectTimeout = setTimeout(() => {
      log(`Attempting to reconnect ${this.clientName}`);
      this.connect();
    }, this.reconnectDelayMs);
  }

  private cleanup() {
    // Clear intervals and timeouts
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Disconnect the port if it exists
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
  }

  public disconnect() {
    log(`Disconnecting keep-alive for ${this.clientName}`);
    this.cleanup();
  }
}
