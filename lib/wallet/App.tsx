"use client";
import { ApolloProvider } from "@apollo/client";
import { Suspense, useEffect } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useRoutes } from "react-router-dom";
import "react-tabs/style/react-tabs.css";
import { ToastContainer } from "react-toastify";
import "./App.scss";
import ErrorBoundary from "./components/ErrorBoundary";
import { useCustomApolloClient } from "./hooks/useCustomApolloClient";
import routesConfig from "./routes";
import { RootState } from "./store";
import { ChromeStorage } from "./store/storage";
import "./styles/react-toastify.scss";

function useRegisterHandleRejectionEvent() {
  useEffect(() => {
    // const handleError = (event: PromiseRejectionEvent) => {
    //   console.error("catch unhandledrejection:", event);
    //   event.promise.catch((e) => {
    //     if (e.message.includes(ErrorCode.NO_AUTH)) {
    //       // message.info("Session expired, please login again");
    //       return;
    //     }
    //     // message.error(e.message);
    //   });
    //   event.preventDefault();
    // };
    // window.addEventListener("unhandledrejection", handleError);
    // return () => {
    //   window.removeEventListener("unhandledrejection", handleError);
    // };
  }, []);
}

function App() {
  const routes = useRoutes(routesConfig);
  useRegisterHandleRejectionEvent();
  const appContext = useSelector((state: RootState) => state.appContext);
  const client = useCustomApolloClient(
    appContext.networkId,
    "suiet-desktop",
    "1.0.0",
    new ChromeStorage()
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // After authentication, redirect to home if at root path
    console.log("location", location.pathname);
    if (
      appContext.authed &&
      (location.pathname === "/wallet" || location.pathname === "/")
    ) {
      navigate("/home");
    }
  }, [appContext.authed, location.pathname, navigate]);

  if (!client) {
    return <h2>Initializing app...</h2>;
  }

  return (
    <div className="app">
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <Suspense fallback={<div>Loading...</div>}>{routes}</Suspense>
        </ApolloProvider>
        <ToastContainer />
      </ErrorBoundary>
    </div>
  );
}

export default App;
