import React, { useCallback, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { WebApiClient } from "../scripts/shared/ui-api-client";
import { RootState } from "../store";
import { updateAuthed } from "../store/app-context";

export const ApiClientContext = React.createContext<WebApiClient | null>(null);

export function useApiClient() {
  const apiClient = useContext(ApiClientContext);
  const { authed } = useSelector((state: RootState) => state.appContext);
  console.log(`authed: ${authed}`);
  const dispatch = useDispatch();

  const handleAuthExpired = useCallback(() => {
    if (!authed) return;
    dispatch(updateAuthed(false));
    console.log(
      "[api client] no auth event triggered, set app state to unauthed"
    );
  }, [authed]);

  useEffect(() => {
    if (!apiClient) return;
    const off = apiClient.on("authExpired", handleAuthExpired);
    return () => {
      off();
    };
  }, [apiClient, handleAuthExpired]);

  return apiClient as WebApiClient;
}
