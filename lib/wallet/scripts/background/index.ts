// src/lib/background/WebApiBridgeConnection.ts
import { PortName } from '../shared';
import { WebBackgroundApiProxy } from './api-proxy';
import { log } from './utils/log';

/**
 * Creates a bridge between UI and background services in a web environment
 * Similar to ApiBridgeConnection but adapted for web instead of Chrome extensions
 */
export class WebApiBridgeConnection {
  private readonly bgApiProxy: WebBackgroundApiProxy;
  private readonly portName: PortName;
  private connectionListeners: ((event: CustomEvent) => void)[] = [];

  constructor(bgApiProxy: WebBackgroundApiProxy, portName: PortName) {
    this.bgApiProxy = bgApiProxy;
    this.portName = portName;
  }

  /**
   * Connect and start listening for connection events
   */
  connect() {
    if (typeof window === 'undefined') {
      log('Cannot set up WebApiBridgeConnection: window not available');
      return;
    }

    // Handle connection requests
    const handleConnect = ((event: CustomEvent) => {
      const { portName, port } = event.detail || {};

      if (portName === this.portName && port) {
        log(`WebApiBridgeConnection handling connection for ${portName}`);
        this.bgApiProxy.listen(port);
      }
    }) as EventListener;

    // Register the event listener
    window.addEventListener('suiet:bridge:connect', handleConnect);
    this.connectionListeners.push(handleConnect as any);

    log(`WebApiBridgeConnection set up for ${this.portName}`);
  }

  /**
   * Clean up listeners
   */
  disconnect() {
    if (typeof window === 'undefined') return;

    // Remove all registered event listeners
    this.connectionListeners.forEach((listener) => {
      window.removeEventListener('suiet:bridge:connect', listener as any);
    });

    this.connectionListeners = [];
    log(`WebApiBridgeConnection for ${this.portName} disconnected`);
  }
}

/**
 * Keep-alive mechanism for web environment
 * Unlike Chrome extensions, web environment doesn't have service workers that get killed
 * But this provides similar interface for compatibility
 */
export function setupWebKeepAlive() {
  if (typeof window === 'undefined') return;

  // Set up listener for keep-alive requests
  window.addEventListener('suiet:keep-alive', ((event: CustomEvent) => {
    const { id } = event.detail || {};

    if (!id) return;

    // Respond to keep-alive request
    window.dispatchEvent(
      new CustomEvent('suiet:keep-alive:response', {
        detail: {
          id,
          timestamp: Date.now(),
          type: 'PONG',
        },
      })
    );

    log(`Responded to keep-alive request ${id}`);
  }) as EventListener);

  log('Web keep-alive mechanism set up');
}

/**
 * Initialize the web background environment
 * @param bgApiProxy The API proxy instance
 */
export function initializeWebBackground(bgApiProxy: WebBackgroundApiProxy) {
  // Set up keep-alive mechanism
  setupWebKeepAlive();

  // Set up connections for different client types
  const uiBgBridgeConnection = new WebApiBridgeConnection(
    bgApiProxy,
    PortName.SUIET_UI_BACKGROUND
  );
  uiBgBridgeConnection.connect();

  const cntBgBridgeConnection = new WebApiBridgeConnection(
    bgApiProxy,
    PortName.SUIET_CONTENT_BACKGROUND
  );
  cntBgBridgeConnection.connect();

  log('Web background environment initialized');

  // Return cleanup function
  return () => {
    uiBgBridgeConnection.disconnect();
    cntBgBridgeConnection.disconnect();
    log('Web background environment cleaned up');
  };
}
