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
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import Session from "@/lib/wallet/components/Session";
import { ApiClientContext } from "@/lib/wallet/hooks/useApiClient";
import { useCustomApolloClient } from "@/lib/wallet/hooks/useCustomApolloClient";
import { WebApiClient } from "@/lib/wallet/scripts/shared/ui-api-client";
import { persistorStore, RootState, store } from "@/lib/wallet/store";
import { ChromeStorage } from "@/lib/wallet/store/storage";
import { ApolloProvider } from "@apollo/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  QueryClient as ReactQueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "react-query";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";

function App(props: PropsWithChildren) {
  const lp = useLaunchParams();
  const miniApp = useMiniApp();
  const themeParams = useThemeParams();
  const viewport = useViewport();
  const appContext = useSelector((state: RootState) => state.appContext);
  const client = useCustomApolloClient(
    appContext.networkId,
    "suiet-desktop",
    "1.0.0",
    new ChromeStorage()
  );

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
    return undefined; // Always return something consistent
  }, [viewport]);

  if (!client) {
    return <h2>Initializing app...</h2>;
  }

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <Session>
          <AppRoot
            appearance={themeParams.isDark ? "dark" : "light"}
            platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
            className="h-[var(--tg-viewport-height)] w-[var(--tg-viewport-width)] p-4"
          >
            {props.children}
          </AppRoot>
          <Toaster />
          <SonnerToaster />
        </Session>
      </AuthProvider>
    </ApolloProvider>
  );
}

function RootInner({ children }: PropsWithChildren) {
  const [client] = useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 1000 } } })
  );

  return (
    <SDKProvider acceptCustomStyles>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistorStore}>
              <ReactQueryClientProvider client={new ReactQueryClient()}>
                <ApiClientContext.Provider value={new WebApiClient()}>
                  <App>{children}</App>
                </ApiClientContext.Provider>
              </ReactQueryClientProvider>
            </PersistGate>
          </Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </SDKProvider>
  );
}

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
