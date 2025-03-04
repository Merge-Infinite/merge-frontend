"use client";
import "./utils/setup-buffer-shim";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.scss";
import { Provider } from "react-redux";
import { persistorStore, store } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import { ApiClientContext } from "./hooks/useApiClient";
import { WebApiClient } from "./scripts/shared/ui-api-client";
import { QueryClient, QueryClientProvider } from "react-query";
import { usePathname } from "next/navigation";

export default function Wallet() {
  const pathname = usePathname();
  console.log("pathname", pathname);
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistorStore}>
            <QueryClientProvider client={new QueryClient()}>
              <ApiClientContext.Provider value={new WebApiClient()}>
                <App />
              </ApiClientContext.Provider>
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
