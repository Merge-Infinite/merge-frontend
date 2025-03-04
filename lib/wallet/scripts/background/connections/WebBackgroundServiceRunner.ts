// src/lib/background/WebBackgroundServiceRunner.ts
import { WebBackgroundApiProxy } from '../api-proxy';
import WebPort, { IPort } from '../utils/Port';
import { log } from '../utils/log';
import { PortName } from '../../shared';

/**
 * Service runner for the background API proxy in web environment
 * Sets up connections and manages the lifecycle of the API proxy
 */
export class WebBackgroundServiceRunner {
  private readonly apiProxy: WebBackgroundApiProxy;
  private isInitialized = false;
  private readonly connectedPorts: Map<string, WebPort> = new Map();

  constructor() {
    this.apiProxy = new WebBackgroundApiProxy();
  }

  /**
   * Initialize the background service
   */
  public init() {
    if (this.isInitialized) {
      log('Background service already initialized');
      return;
    }

    // Set up connection listener for UI connections
    if (typeof window !== 'undefined') {
      // Listen for connection requests via custom events
      window.addEventListener('suiet:connect', ((event: CustomEvent) => {
        const { portName, connectionId } = event.detail || {};
        if (!portName) {
          log('Invalid connection request: missing port name');
          return;
        }
        this.handleConnection(portName, connectionId);
      }) as EventListener);

      log('Web background service initialized and ready for connections');
      this.isInitialized = true;
    } else {
      log('Window not available, cannot initialize background service');
    }
  }

  /**
   * Handle a new connection request
   * @param portName Name of the port
   * @param connectionId Optional ID for this connection
   */
  private handleConnection(portName: string, connectionId?: string) {
    const uniqueId =
      connectionId ??
      `${portName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const portKey = `${portName}:${uniqueId}`;

    log(`Creating new port for ${portName} with ID ${uniqueId}`);

    try {
      // Create a new port for this connection
      const port = new WebPort(
        { name: portName },
        {
          onConnect: (connectedPort) => {
            log(`Port ${portName} connected with ID ${uniqueId}`);
            this.setupPort(connectedPort);
          },
        }
      );

      // Store the port
      this.connectedPorts.set(portKey, port);

      // Handle port disconnection
      port.onDisconnect.addListener('disconnect', () => {
        log(`Port ${portName} with ID ${uniqueId} disconnected`);
        this.connectedPorts.delete(portKey);
      });

      // Respond to the connection event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('suiet:connected', {
            detail: {
              portName,
              connectionId: uniqueId,
              success: true,
            },
          })
        );
      }
    } catch (error) {
      log(`Error creating port for ${portName}`, error);

      // Notify of connection failure
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('suiet:connected', {
            detail: {
              portName,
              connectionId: uniqueId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
        );
      }
    }
  }

  /**
   * Setup a port by registering it with the API proxy
   * @param port The port to setup
   */
  private setupPort(port: IPort) {
    try {
      // Pass the port to the API proxy for handling messages
      this.apiProxy.listen(port);
      log(`Port ${port.name} registered with API proxy`);
    } catch (error) {
      log(`Error setting up port ${port.name}`, error);
    }
  }

  /**
   * Connect to the background service from UI (client-side method)
   * @param portName Name of the port to connect to
   * @returns Promise that resolves with the connection ID
   */
  public static async connect(portName: PortName): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error(
        'Cannot connect to background service: window not available'
      );
    }

    return await new Promise((resolve, reject) => {
      // Generate a unique connection ID
      const connectionId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      // Listen for connection response
      const connectionListener = ((event: CustomEvent) => {
        const { connectionId: responseId, success, error } = event.detail || {};

        if (responseId === connectionId) {
          // Remove the listener once we get our response
          window.removeEventListener('suiet:connected', connectionListener);

          if (success) {
            resolve(connectionId);
          } else {
            reject(new Error(error || 'Connection failed'));
          }
        }
      }) as EventListener;

      window.addEventListener('suiet:connected', connectionListener);

      // Request connection
      window.dispatchEvent(
        new CustomEvent('suiet:connect', {
          detail: {
            portName,
            connectionId,
          },
        })
      );

      // Set a timeout for the connection
      setTimeout(() => {
        window.removeEventListener('suiet:connected', connectionListener);
        reject(new Error('Connection timed out'));
      }, 5000);
    });
  }

  /**
   * Clean up resources
   */
  public cleanup() {
    // Disconnect all ports
    for (const [key, port] of this.connectedPorts.entries()) {
      try {
        port.disconnect();
      } catch (error) {
        log(`Error disconnecting port ${key}`, error);
      }
    }

    this.connectedPorts.clear();
    this.isInitialized = false;

    log('Background service cleaned up');
  }
}

// Create singleton instance
const webBackgroundService = new WebBackgroundServiceRunner();
export default webBackgroundService;
