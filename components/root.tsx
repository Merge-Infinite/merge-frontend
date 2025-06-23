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
import { type PropsWithChildren, useEffect, useState } from "react";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ErrorPage } from "@/components/common/ErrorPage";
import { useDidMount } from "@/hooks/useDidMount";

import { AuthProvider } from "@/app/context/AuthContext";
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
const queryClient = new QueryClient();

// Telegram Mini App Component
function TelegramApp(props: PropsWithChildren) {
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

  if (!apolloClient) {
    return <h2>Initializing app...</h2>;
  }

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <AppRoot
          appearance={themeParams.isDark ? "dark" : "light"}
          platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
          className="w-full h-full"
        >
          {props.children}
        </AppRoot>
        <Toaster />
        <SonnerToaster />
      </AuthProvider>
    </ApolloProvider>
  );
}

// Web App Component with Slush Wallet
function WebApp(props: PropsWithChildren) {
  const appContext = useSelector((state: RootState) => state.appContext);

  const apolloClient = useCustomApolloClient(
    appContext.networkId,
    "suiet-desktop-extension",
    "1.0.0",
    new ChromeStorage()
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
            return wallet.name === SLUSH_WALLET_NAME;
          }}
          slushWallet={{
            name: "Merge Infinity",
          }}
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
}

// Universal App Component that decides which version to render
function App(props: PropsWithChildren) {
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);

  useEffect(() => {
    // Only check environment on client side
    setIsTelegram(isTelegramEnvironment());
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
}

// Telegram-specific Root Inner
function TelegramRootInner({ children }: PropsWithChildren) {
  const [client] = useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 1000 } } })
  );

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
            <ReactQueryClientProvider client={new ReactQueryClient()}>
              <ApiClientContext.Provider value={new WebApiClient()}>
                <App>{children}</App>
              </ApiClientContext.Provider>
            </ReactQueryClientProvider>
          </QueryClientProvider>
        </SDKProvider>
      </PersistGate>
    </Provider>
  );
}

// Web-specific Root Inner
function WebRootInner({ children }: PropsWithChildren) {
  const [client] = useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 1000 } } })
  );

  useEffect(() => {
    persistorStore.flush().then(() => {
      console.log("Persisted state has been cleared.");
    });
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistorStore}>
        <QueryClientProvider client={client}>
          <ReactQueryClientProvider client={new ReactQueryClient()}>
            <ApiClientContext.Provider value={new WebApiClient()}>
              <App>{children}</App>
            </ApiClientContext.Provider>
          </ReactQueryClientProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

// Universal Root Inner
function RootInner({ children }: PropsWithChildren) {
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
}

// Main Root Component
export function Root(props: PropsWithChildren) {
  const didMount = useDidMount();

  return didMount ? (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  ) : (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
      Loading
    </div>
  );
}
