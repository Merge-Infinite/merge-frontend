/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  updateUserInventory,
  updateUserProfile,
} from "@/lib/wallet/store/user";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useApi from "./useApi";

export function useUser(inventorySearch?: string) {
  // Constants and state
  const { initDataRaw, initData } = retrieveLaunchParams();
  const lp = useLaunchParams();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const user = useSelector((state: RootState) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedInRef = useRef(false);
  const initializedRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  // API endpoints
  const authApi = useApi({
    key: ["auth"],
    method: "POST",
    url: "auth/telegram",
  }).post;

  const getMe = useApi({
    key: ["auth"],
    method: "GET",
    url: "user/me",
    enabled: false,
  }).get;

  const userInventory = useApi({
    key: ["user", "inventory"],
    method: "GET",
    url: `user/inventory?search=${inventorySearch || ""}`,
    enabled: false,
  }).get;

  const saveAddressApi = useApi({
    key: ["user", "saveAddress"],
    method: "POST",
    url: "user/saveAddress",
  }).post;

  // Helper to handle localStorage safely
  const getLocalStorage = useCallback((key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage:`, e);
      localStorage.removeItem(key);
      return null;
    }
  }, []);

  const setLocalStorage = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error setting ${key} in localStorage:`, e);
      return false;
    }
  }, []);

  // User data management
  const getUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getMe?.refetch();
      if (response?.data) {
        dispatch(updateUserProfile(response.data));
        setLocalStorage("user", response.data);
      }
      return response;
    } catch (error) {
      console.error("Error fetching user:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getMe, setLocalStorage, user]);

  const getUserInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await userInventory?.refetch();
      dispatch(updateUserInventory(response?.data as any[]));
    } catch (error) {
      console.error("Error fetching inventory:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userInventory?.data]);

  const saveAddress = useCallback(async () => {
    if (!address) return null;

    try {
      setIsLoading(true);
      await saveAddressApi?.mutateAsync({ address });
      const response = await getMe?.refetch();
      if (response?.data) {
        dispatch(updateUserProfile(response.data));
        setLocalStorage("user", response.data);
      }
      return response;
    } catch (error) {
      console.error("Error saving address:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address, user]);

  const login = useCallback(async () => {
    if (!initDataRaw || isLoggedInRef.current || initializedRef.current) return;

    isLoggedInRef.current = true;
    initializedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const storedUser = getLocalStorage("user");

      if (storedUser) {
        const telegramIdMatches =
          storedUser?.id &&
          Number(initData?.user?.id) === Number(storedUser?.telegramId);
        if (telegramIdMatches) {
          dispatch(updateUserProfile(storedUser));
        } else {
          localStorage.clear();
        }
      }
      // Handle authentication token only if not already authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        const response = await authApi?.mutateAsync({
          initData: initDataRaw,
          referralCode: lp.startParam,
        });
        if (response?.accessToken) {
          localStorage.setItem("token", response.accessToken);
          await Promise.all([getUser(), getUserInventory()]);
          return;
        }
      }
      await getUserInventory();
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isLoggedInRef.current = false;

      setIsLoading(false);
    }
  }, [lp.startParam]);

  return {
    user: user.profile,
    inventory: user.inventory,
    refetchInventory: getUserInventory,
    refetch: getUser,
    login,
    saveAddress,
    isLoading,
    error,
  };
}
