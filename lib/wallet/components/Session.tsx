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

  useEffect(() => {
    if (!authed && initialized) {
      // Create an interval to repeatedly attempt login until authenticated
      const loginInterval = setInterval(async () => {
        try {
          console.log("Attempting login via interval");
          await apiClient.callFunc<string, string>("auth", "login", "123456");
          dispatch(updateAuthed(true));
          clearInterval(loginInterval);
        } catch (e) {
          console.log("Login attempt failed, will retry");
        }
      }, 3000);

      return () => {
        clearInterval(loginInterval);
      };
    }
  }, [authed, initialized, isSetuped]);

  return <>{props.children}</>;
};

export default Session;
