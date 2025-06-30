/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { initBackButton } from "@telegram-apps/sdk";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSelector } from "react-redux";

import { useUser } from "@/hooks/useUser";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import { isTelegramEnvironment } from "@/utils/functions";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useUtils } from "@telegram-apps/sdk-react";

// Types
interface UniversalAppContextType {
  // Environment
  isTelegram: boolean;
  isLoading: boolean;

  // Telegram specific
  backButton: any;

  suiBalance: number | null;
  // Wallet info
  wallet: {
    isConnected: boolean;
    address: string | null;
    type: "telegram" | "web";
  };

  // User data
  user: any;
  inventory: any[];
  utils: any | null; // Added utils to context type
  // Functions
  login: () => Promise<void>;
  saveAddress: () => Promise<any>;
  refetchUser: () => Promise<any>;
  refetchInventory: () => Promise<void>;

  // Status
  isUserLoading: boolean;
  userError: Error | null;

  // Ready state
  isReady: boolean; // true when environment is detected and basic setup is complete
}

// Create context
const UniversalAppContext = createContext<UniversalAppContextType | null>(null);

// Hook to use the context
export function useUniversalApp() {
  const context = useContext(UniversalAppContext);
  if (!context) {
    throw new Error("useUniversalApp must be used within UniversalAppProvider");
  }
  return context;
}

// Provider component
interface UniversalAppProviderProps {
  children: React.ReactNode;
}

export function UniversalAppProvider({ children }: UniversalAppProviderProps) {
  // Environment state
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const suiClient = useSuiClient();

  // Telegram specific state
  const [backButton, setBackButton] = useState<any>(null);

  // Redux selectors
  const accountId = useSelector(
    (state: RootState) => state.appContext.accountId
  );

  // Hooks - only call when appropriate
  const { address: telegramAddress } = useAccount(accountId);
  let utils: any = null;
  try {
    utils = useUtils();
  } catch (error) {
    console.debug("useUtils failed (expected if not in Telegram):", error);
    utils = null;
  }
  const account = useCurrentAccount();
  // User hook
  const {
    user,
    inventory,
    login,
    saveAddress,
    refetch: refetchUser,
    refetchInventory,

    isLoading: isUserLoading,
    error: userError,
  } = useUser();

  // Initialize environment detection
  useEffect(() => {
    if (isTelegram) {
      // Initialize Telegram-specific features
      try {
        const [bb] = initBackButton();
        setBackButton(bb);
        bb.hide();
      } catch (error) {
        console.warn("Failed to initialize Telegram features:", error);
      }
    }

    setIsLoading(false);
  }, [isTelegram]);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    const isTelegramResult = await isTelegramEnvironment();
    setIsTelegram(isTelegramResult);
  };

  useEffect(() => {
    if (!isTelegram && account?.address) {
      getSuiBalanceWebapp();
    }
  }, [isTelegram, account?.address]);

  const getSuiBalanceWebapp = async () => {
    const balance = Number(
      (
        await suiClient.getBalance({
          owner: account?.address || "",
        })
      ).totalBalance
    );
    setBalance(balance);
  };

  // Set ready state
  useEffect(() => {
    if (isTelegram !== null && !isLoading) {
      if (isTelegram) {
        // For Telegram, ready when we have initDataRaw or failed to get it
        setIsReady(true);
      } else {
        // For web, ready immediately after environment detection
        setIsReady(true);
      }
    }
  }, [isTelegram, isLoading]);

  // Auto-login for Telegram
  useEffect(() => {
    if (isReady) {
      login();
    }
  }, [isReady]);

  // Auto-save address when available
  useEffect(() => {
    if (isTelegram && telegramAddress && isReady) {
      saveAddress();
    }
  }, [isTelegram, telegramAddress, isReady, saveAddress]);

  // Get current wallet info
  const getWalletInfo = useCallback(() => {
    if (isTelegram) {
      return {
        isConnected: !!telegramAddress,
        address: telegramAddress,
        type: "telegram" as const,
        isSlushWallet: false,
      };
    } else {
      return {
        isConnected: false,
        address: null,
        type: "web" as const,
        isSlushWallet: false,
      };
    }
  }, [isTelegram, telegramAddress]);

  const contextValue: UniversalAppContextType = {
    // Environment
    isTelegram: isTelegram ?? false,
    isLoading,

    // Telegram specific
    backButton,

    wallet: getWalletInfo(),
    utils: isTelegram ? utils : null,
    user,
    inventory: inventory || [],

    // Functions
    login,
    saveAddress,
    suiBalance: balance,
    refetchUser,
    refetchInventory: refetchInventory as () => Promise<void>,

    // Status
    isUserLoading,
    userError,

    // Ready state
    isReady,
  };

  return (
    <UniversalAppContext.Provider value={contextValue}>
      {children}
    </UniversalAppContext.Provider>
  );
}

// Optional: Higher-order component for screens that need to wait for readiness
export function withUniversalApp<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    const { isReady, isLoading } = useUniversalApp();

    if (!isReady || isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div>Loading...</div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Loading screen component
export function UniversalLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div>Initializing...</div>
      </div>
    </div>
  );
}
