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
    if (!authed) {
      const ac = new AbortController();
      verifyAuthStatus(ac);

      return () => {
        ac.abort();
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

  if (!authed) {
    return <SkeletonCard />;
  }

  return <>{props.children}</>;
};

export default Session;
