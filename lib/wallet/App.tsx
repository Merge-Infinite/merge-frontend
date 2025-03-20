"use client";
import { useEffect } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { useSelector } from "react-redux";
import { useRoutes } from "react-router-dom";
import "react-tabs/style/react-tabs.css";
import { ToastContainer } from "react-toastify";
import "./App.scss";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAutoLoadFeatureFlags } from "./hooks/useFeatureFlags";
import routesConfig from "./routes";
import { RootState } from "./store";
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
  const appContext = useSelector((state: RootState) => state.appContext);
  useRegisterHandleRejectionEvent();
  useAutoLoadFeatureFlags();

  return (
    <div className="app">
      <ErrorBoundary>
        {routes}
        <ToastContainer />
      </ErrorBoundary>
    </div>
  );
}

export default App;
