import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useBiometricAuth } from "../hooks/useBiometricAuth";
import { RootState } from "../store";
import { Extendable } from "../types";

const Session = (props: Extendable) => {
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const initialized = useSelector(
    (state: RootState) => state.appContext.initialized
  );

  const { isSetuped, authenticate } = useBiometricAuth();

  useEffect(() => {
    if (authed && initialized && isSetuped) {
      authenticate();
    }
  }, [authed, initialized, isSetuped]);

  return <>{props.children}</>;
};

export default Session;
