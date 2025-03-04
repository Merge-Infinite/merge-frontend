// src/lib/port/WebPort.ts
import { EventEmitter } from 'events';
import { log } from './log';

// Define the interface for our web-compatible port
export interface IPort {
  connected: boolean;
  name: string;
  postMessage: (message: any) => void;
  disconnect: () => void;
  onDisconnect: EventEmitter;
  onMessage: EventEmitter;
}

// Custom event emitter instead of Chrome's event API
class PortEventEmitter extends EventEmitter {
  addListener(event: string, listener: (...args: any[]) => void): this {
    return super.addListener(event, listener);
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    return super.removeListener(event, listener);
  }
}

// Connection info type for web port
export interface WebConnectInfo {
  name: string;
}

// Web storage channel for cross-component communication
export default class WebPort implements IPort {
  #connected: boolean = false;
  #portName: string;
  #onMessageEmitter: PortEventEmitter;
  #onDisconnectEmitter: PortEventEmitter;
  readonly #onConnectCallback: (port: IPort) => void | Promise<void>;

  // Optional storage for persisting messages
  #storageKey: string;

  constructor(
    connectInfo: WebConnectInfo,
    opts?: {
      onConnect?: (port: IPort) => void | Promise<void>;
      useLocalStorage?: boolean;
    }
  ) {
    if (!connectInfo.name) {
      throw new Error('port name is required');
    }

    this.#portName = connectInfo.name;
    this.#onConnectCallback = opts?.onConnect ?? (() => {});
    this.#onMessageEmitter = new PortEventEmitter();
    this.#onDisconnectEmitter = new PortEventEmitter();
    this.#storageKey = `web-port:${this.#portName}`;

    this.#connect();

    // Set up browser-specific event listeners for tab/window events
    if (typeof window !== 'undefined') {
      // Handle page unload (similar to port disconnect in extensions)
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });

      // Setup storage event listener for cross-tab communication if needed
      if (opts?.useLocalStorage) {
        window.addEventListener('storage', (event) => {
          if (event.key?.startsWith(this.#storageKey)) {
            try {
              const data = JSON.parse(event.newValue || '{}');
              this.#onMessageEmitter.emit('message', data);
            } catch (err) {
              log(`Error parsing message: ${err}`);
            }
          }
        });
      }
    }
  }

  #connect() {
    this.#connected = true;
    log(`web port ${this.#portName} connected`);

    // Use setTimeout to mimic async behavior of Chrome runtime
    setTimeout(() => {
      this.#onConnectCallback(this);
    }, 0);

    return this;
  }

  public postMessage(message: any) {
    if (!this.#connected) {
      log('postMessage: web port not connected, reconnecting');
      this.#connect();
    }

    // Emit the message for local listeners
    this.#onMessageEmitter.emit('message', message);

    // Optionally store in localStorage for cross-tab communication
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const messageKey = `${this.#storageKey}:${Date.now()}`;
        window.localStorage.setItem(messageKey, JSON.stringify(message));

        // Clean up old messages to prevent localStorage from filling up
        setTimeout(() => {
          window.localStorage.removeItem(messageKey);
        }, 5000);
      } catch (err) {
        log(`Error storing message: ${err}`);
      }
    }
  }

  public disconnect() {
    if (this.#connected) {
      this.#connected = false;
      log(`web port ${this.#portName} disconnected`);
      this.#onDisconnectEmitter.emit('disconnect', { error: false });
    }
  }

  get connected() {
    return this.#connected;
  }

  get name() {
    return this.#portName;
  }

  get onMessage() {
    return this.#onMessageEmitter;
  }

  get onDisconnect() {
    return this.#onDisconnectEmitter;
  }
}
