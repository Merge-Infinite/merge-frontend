// src/lib/api/DirectApiClient.ts
import { cloneDeep } from "lodash-es";
import mitt, { Emitter } from "mitt";
import {
  AccountApi,
  AuthApi,
  getStorage,
  IStorage,
  NetworkApi,
  TransactionApi,
  WalletApi,
} from "../../core";
import { isDev } from "../../utils/env";
import { DappBgApi } from "../background/bg-api/dapp";
import { ErrorCode } from "../background/errors";

// Types
export interface CallFuncOption {
  timeout?: number;
  withAuth?: boolean;
}

function log(message: string, details?: any, devOnly = true) {
  if (devOnly && !isDev) return;
}

export interface ApiClientEventListeners {
  authExpired: (properties: undefined) => void;
}
export type ApiClientEvent = keyof ApiClientEventListeners;
export type ApiClientEventsMap = {
  [E in keyof ApiClientEventListeners]: Parameters<
    ApiClientEventListeners[E]
  >[0];
};

// Services interfaces
interface RootApi {
  clearToken: () => Promise<void>;
  resetAppData: (token: string) => Promise<void>;
  validateToken: (token: string) => Promise<void>;
}

export class WebApiClient {
  private readonly events: Emitter<ApiClientEventsMap>;
  private storage: IStorage | undefined;

  // Service instances
  private serviceInstances: Record<string, any> = {};
  private root: RootApi | undefined;
  private wallet: WalletApi | undefined;
  private account: AccountApi | undefined;
  private auth: AuthApi | undefined;
  private txn: TransactionApi | undefined;
  private network: NetworkApi | undefined;
  private dapp: DappBgApi | undefined;

  constructor() {
    this.events = mitt();
    this.initServices();
  }

  private initServices() {
    // Initialize storage first
    this.storage = this.getStorage();

    // Initialize service instances
    this.wallet = new WalletApi(this.storage);
    this.account = new AccountApi(this.storage);
    this.auth = new AuthApi(this.storage);
    this.txn = new TransactionApi(this.storage);
    this.network = new NetworkApi();

    // Initialize dapp service with dependencies
    this.dapp = new DappBgApi(
      { storage: this.storage },
      this.txn,
      this.network,
      this.auth,
      this.account
    );

    // Initialize root service
    this.root = {
      clearToken: async () => {
        const meta = await this.storage?.loadMeta();
        if (!meta) return;
        try {
          await this.storage?.clearMeta();
        } catch (e) {
          console.error(e);
          throw new Error("Clear meta failed");
        }
      },
      resetAppData: async () => {
        await this.storage?.reset();
        this.initServices();
      },
      validateToken: async (token: string) => {
        return true;
      },
    };

    // Register services in service map for callFunc
    this.serviceInstances = {
      root: this.root,
      wallet: this.wallet,
      account: this.account,
      auth: this.auth,
      txn: this.txn,
      network: this.network,
      dapp: this.dapp,
    };

    log("Services initialized", Object.keys(this.serviceInstances));
  }

  private getStorage(): IStorage {
    const storage = getStorage();
    if (!storage) {
      throw new Error("Web platform not supported by storage system");
    }
    return storage;
  }

  async callFunc<Req, Res>(
    service: string,
    funcName: string,
    payload: Req,
    options?: CallFuncOption
  ): Promise<Res> {
    // Debug logging to trace function call
    console.log(`Calling ${service}.${funcName}`, { payload });

    // Check if service exists
    if (!this.serviceInstances[service]) {
      const error = new Error(`Service "${service}" does not exist`);
      console.log("Error in callFunc", { error, service, funcName }, false);
      throw error;
    }

    // Check if function exists in service
    const serviceInstance = this.serviceInstances[service];
    if (typeof serviceInstance[funcName] !== "function") {
      const error = new Error(
        `Method "${funcName}" does not exist in service "${service}"`
      );
      log("Error in callFunc", { error, service, funcName }, false);
      throw error;
    }

    // Prepare parameters
    const params = payload ? cloneDeep(payload) : {};
    // Inject token if withAuth is true
    if (options?.withAuth === true) {
      try {
        const token = this.auth?.getToken();
        Object.assign(params, { token });
        // For context objects, add token there too
        if (
          "context" in params &&
          params.context &&
          typeof params.context === "object"
        ) {
          Object.assign(params.context, { token });
        }
      } catch (e) {
        log("Error injecting token", e);
        this.events.emit("authExpired");
        throw new Error("Authentication required");
      }
    }

    try {
      // Call the service function directly
      log(`Executing ${service}.${funcName}`, params);
      const result = await serviceInstance[funcName](params);
      log(`Result from ${service}.${funcName}:`, result);
      return result;
    } catch (error) {
      log("Error in callFunc", { error, service, funcName }, false);

      // Handle auth errors specifically
      if (error?.code === ErrorCode.NO_AUTH) {
        this.events.emit("authExpired");
      }

      throw error;
    }
  }

  on<E extends ApiClientEvent>(event: E, listener: ApiClientEventListeners[E]) {
    this.events.on(event, listener);
    return () => this.events.off(event, listener);
  }

  /**
   * Convenience methods for common service calls
   */

  // Wallet service methods
  async getWallets() {
    return await this.callFunc("wallet", "getWallets", {});
  }

  async createWallet(params: { name: string }) {
    return await this.callFunc("wallet", "createWallet", params);
  }

  // Account service methods
  async getAccounts(params: { walletId: string }) {
    return await this.callFunc("account", "getAccounts", params, {
      withAuth: true,
    });
  }

  // Auth service methods
  async login(params: { password: string }) {
    return await this.callFunc("auth", "login", params);
  }

  async logout() {
    return await this.callFunc("auth", "logout", {});
  }

  async initPassword(params: { password: string }) {
    return await this.callFunc("auth", "initPassword", params);
  }

  // Transaction service methods
  async sendTransaction(params: any) {
    return await this.callFunc("txn", "sendTransaction", params, {
      withAuth: true,
    });
  }

  // Network service methods
  async getNetworks() {
    return await this.callFunc("network", "getNetworks", {});
  }
}
