"use client";

import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
  SDKProvider,
  useLaunchParams,
  useMiniApp,
  useThemeParams,
  useViewport,
  bindMiniAppCSSVars,
  bindThemeParamsCSSVars,
  bindViewportCSSVars,
} from "@telegram-apps/sdk-react";
import { AppRoot } from "@telegram-apps/telegram-ui";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ErrorPage } from "@/components/common/ErrorPage";
import { useDidMount } from "@/hooks/useDidMount";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

function App(props: PropsWithChildren) {
  const lp = useLaunchParams();
  const miniApp = useMiniApp();
  const themeParams = useThemeParams();
  const viewport = useViewport();

  useEffect(() => {
    miniApp.setHeaderColor("#000000");
    return bindMiniAppCSSVars(miniApp, themeParams);
  }, [miniApp, themeParams]);

  useEffect(() => {
    return bindThemeParamsCSSVars(themeParams);
  }, [themeParams]);

  useEffect(() => {
    return viewport && bindViewportCSSVars(viewport);
  }, [viewport]);

  return (
    <AppRoot
      appearance={themeParams.isDark ? "dark" : "light"}
      platform={["macos", "ios"].includes(lp.platform) ? "ios" : "base"}
      className="h-[var(--tg-viewport-height)] w-[var(--tg-viewport-width)] p-4"
    >
      {props.children}
    </AppRoot>
  );
}

function RootInner({ children }: PropsWithChildren) {
  const [client] = useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 1000 } } })
  );

  return (
    <SDKProvider acceptCustomStyles>
      <QueryClientProvider client={client}>
        <App>{children}</App>
        <Toaster />
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
