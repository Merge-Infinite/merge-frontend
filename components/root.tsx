"use client";

import {
  bindMiniAppCSSVars,
  bindThemeParamsCSSVars,
  bindViewportCSSVars,
  SDKProvider,
  useLaunchParams,
  useMiniApp,
  useThemeParams,
  useViewport,
} from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";
import React, {
  memo,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ErrorPage } from "@/components/common/ErrorPage";
import { useDidMount } from "@/hooks/useDidMount";

import { UniversalAppProvider } from "@/app/context/UniversalAppContext";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { ApiClientContext } from "@/lib/wallet/hooks/useApiClient";
import { useCustomApolloClient } from "@/lib/wallet/hooks/useCustomApolloClient";
import { WebApiClient } from "@/lib/wallet/scripts/shared/ui-api-client";
import { persistorStore, RootState, store } from "@/lib/wallet/store";
import { ChromeStorage } from "@/lib/wallet/store/storage";
import { isTelegramEnvironment } from "@/utils/functions";
import { ApolloProvider } from "@apollo/client";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { registerSlushWallet, SLUSH_WALLET_NAME } from "@mysten/slush-wallet";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  QueryClient as ReactQueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "react-query";
import { Provider, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// Import Slush Wallet
registerSlushWallet("Merge Infinity");
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
});

// Telegram Mini App Component
const TelegramApp = memo(function TelegramApp(props: PropsWithChildren) {
  const lp = useLaunchParams();
  const miniApp = useMiniApp();
  const themeParams = useThemeParams();
  const viewport = useViewport();
  const appContext = useSelector((state: RootState) => state.appContext);

  useEffect(() => {
    miniApp.setHeaderColor("#000000");
    return bindMiniAppCSSVars(miniApp, themeParams);
  }, [miniApp, themeParams]);

  useEffect(() => {
    return bindThemeParamsCSSVars(themeParams);
  }, [themeParams]);

  useEffect(() => {
    if (viewport) {
      return bindViewportCSSVars(viewport);
    }
    return undefined;
  }, [viewport]);

  const apolloClient = useCustomApolloClient(
    appContext.networkId,
    "suiet-desktop-extension",
    "1.0.0",
    new ChromeStorage()
  );

  const walletFilter = useCallback((wallet: any) => {
    return wallet.name === SLUSH_WALLET_NAME;
  }, []);

  const slushWallet = useMemo(
    () => ({
      name: "Merge Infinity",
    }),
    []
  );

  const appearance = themeParams.isDark ? "dark" : "light";
  const platform = ["macos", "ios"].includes(lp.platform) ? "ios" : "base";

  if (!apolloClient) {
    return <h2>Initializing app...</h2>;
  }

  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
      <WalletProvider autoConnect={true}>
        <ApolloProvider client={apolloClient}>
          <UniversalAppProvider>
            <AppRoot
              appearance={appearance}
              platform={platform}
              className="w-full h-full"
            >
              {props.children}
            </AppRoot>
            <Toaster />
            <SonnerToaster />
          </UniversalAppProvider>
        </ApolloProvider>
      </WalletProvider>
    </SuiClientProvider>
  );
});

// Web App Component with Slush Wallet
const WebApp = memo(function WebApp(props: PropsWithChildren) {
  const appContext = useSelector((state: RootState) => state.appContext);

  const apolloClient = useCustomApolloClient(
    appContext.networkId,
    "suiet-desktop-extension",
    "1.0.0",
    new ChromeStorage()
  );

  const walletFilter = useCallback((wallet: any) => {
    return wallet.name === SLUSH_WALLET_NAME;
  }, []);

  const slushWallet = useMemo(
    () => ({
      name: "Merge Infinity",
    }),
    []
  );
  if (!apolloClient) {
    return <h2>Initializing app...</h2>;
  }

  return (
    <ApolloProvider client={apolloClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider
          autoConnect={true}
          walletFilter={(wallet) => {
            if (wallet.name === SLUSH_WALLET_NAME) {
              return true;
            }
            return false;
          }}
          slushWallet={slushWallet}
        >
          <UniversalAppProvider>
            <div className=" min-h-screen flex  justify-center w-full">
              {props.children}
            </div>
            <Toaster />
            <SonnerToaster />
          </UniversalAppProvider>
        </WalletProvider>
      </SuiClientProvider>
    </ApolloProvider>
  );
});

// Universal App Component that decides which version to render
const App = memo(function App(props: PropsWithChildren) {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);

  useEffect(() => {
    // Only check environment on client side
    isTelegramEnvironment().then((isTelegram) => {
      setIsTelegram(isTelegram);
    });
  }, []);

  // Show loading while determining environment
  if (isTelegram === null) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Render appropriate app version
  return isTelegram ? <TelegramApp {...props} /> : <WebApp {...props} />;
});

// Telegram-specific Root Inner
const TelegramRootInner = memo(function TelegramRootInner({
  children,
}: PropsWithChildren) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60000 } } })
  );

  const [reactQueryClient] = useState(
    () =>
      new ReactQueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000,
            cacheTime: 300000,
          },
        },
      })
  );

  const webApiClient = useMemo(() => new WebApiClient(), []);

  useEffect(() => {
    persistorStore.flush().then(() => {
      console.log("Persisted state has been cleared.");
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistorStore}>
        <SDKProvider acceptCustomStyles>
          <QueryClientProvider client={client}>
            <ReactQueryClientProvider client={reactQueryClient}>
              <ApiClientContext.Provider value={webApiClient}>
                <App>{children}</App>
              </ApiClientContext.Provider>
            </ReactQueryClientProvider>
          </QueryClientProvider>
        </SDKProvider>
      </PersistGate>
    </Provider>
  );
});

// Web-specific Root Inner
const WebRootInner = memo(function WebRootInner({
  children,
}: PropsWithChildren) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60000 } } })
  );

  const [reactQueryClient] = useState(
    () =>
      new ReactQueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000,
            cacheTime: 300000,
          },
        },
      })
  );

  const webApiClient = useMemo(() => new WebApiClient(), []);

  useEffect(() => {
    persistorStore.flush().then(() => {
      console.log("Persisted state has been cleared.");
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistorStore}>
        <QueryClientProvider client={client}>
          <ReactQueryClientProvider client={reactQueryClient}>
            <ApiClientContext.Provider value={webApiClient}>
              <App>{children}</App>
            </ApiClientContext.Provider>
          </ReactQueryClientProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
});

// Universal Root Inner
const RootInner = memo(function RootInner({ children }: PropsWithChildren) {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);

  useEffect(() => {
    setIsTelegram(isTelegramEnvironment());
  }, []);

  if (isTelegram === null) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return isTelegram ? (
    <TelegramRootInner>{children}</TelegramRootInner>
  ) : (
    <WebRootInner>{children}</WebRootInner>
  );
});

// Main Root Component
export function Root(props: PropsWithChildren) {
  const didMount = useDidMount();

  return didMount ? (
    <React.StrictMode>
      <ErrorBoundary fallback={ErrorPage}>
        <RootInner {...props} />
      </ErrorBoundary>
    </React.StrictMode>
  ) : (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
      Loading
    </div>
  );
}
