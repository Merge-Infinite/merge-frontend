import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useApiClient } from "../hooks/useApiClient";
import { useBiometricAuth } from "../hooks/useBiometricAuth";
import { RootState } from "../store";
import { updateAuthed } from "../store/app-context";
import { Extendable } from "../types";

const Session = (props: Extendable) => {
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const initialized = useSelector(
    (state: RootState) => state.appContext.initialized
  );

  const dispatch = useDispatch();
  const apiClient = useApiClient();
  const { isSetuped, authenticate } = useBiometricAuth();

  async function verifyAuthStatus(ac: AbortController) {
    try {
      console.log("starting login");
      await apiClient.callFunc<string, string>("auth", "login", "123456");

      dispatch(updateAuthed(true));
    } catch (e) {
      dispatch(updateAuthed(false));
    }
  }

  useEffect(() => {
    if (!authed && initialized) {
      // Create an interval to repeatedly attempt login until authenticated
      const loginInterval = setInterval(async () => {
        alert("loginInterval");
        try {
          console.log("Attempting login via interval");
          await apiClient.callFunc<string, string>("auth", "login", "123456");
          dispatch(updateAuthed(true));
          // Clear interval once successfully authenticated
          clearInterval(loginInterval);
        } catch (e) {
          alert(e);
          console.log("Login attempt failed, will retry");
        }
      }, 3000); // Try every 5 seconds

      // Clean up interval on component unmount
      return () => {
        clearInterval(loginInterval);
      };
    }
  }, [isSetuped]);

  useEffect(() => {
    dispatch(updateAuthed(true));
    const controller = new AbortController();
    return () => {
      controller.abort();
    };
  }, []);

  if (!authed && initialized) {
    return <SkeletonCard />;
  }

  return <>{props.children}</>;
};

export default Session;
