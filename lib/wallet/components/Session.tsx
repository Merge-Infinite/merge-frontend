import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useApiClient } from "../hooks/useApiClient";
import { useBiometricAuth } from "../hooks/useBiometricAuth";
import LockPage from "../pages/LockPage";
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
      await apiClient.callFunc("auth", "isAuthed", null);
      dispatch(updateAuthed(true));
    } catch (e) {
      dispatch(updateAuthed(false));
    }
  }

  useEffect(() => {
    if (!authed) {
      const ac = new AbortController();
      authenticate(ac.signal).catch(() => {});
      return () => {
        ac.abort();
      };
    }
  }, [isSetuped]);

  useEffect(() => {
    const controller = new AbortController();
    verifyAuthStatus(controller);
    return () => {
      controller.abort();
    };
  }, []);
  if (!authed) return <LockPage />;
  return <>{props.children}</>;
};

export default Session;
