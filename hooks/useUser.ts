/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  updateUserInventory,
  updateUserProfile,
} from "@/lib/wallet/store/user";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useApi from "./useApi";

import { isTelegramEnvironment } from "@/utils/functions";
import {
  useCurrentAccount,
  useCurrentWallet,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";
import { SLUSH_WALLET_NAME } from "@mysten/slush-wallet";
import { useSearchParams } from "next/navigation";

// Web user data structure (you might need to adjust this based on your needs)
interface WebUserData {
  id: string;
  address: string;
  // Add other fields as needed
}

export function useUser(inventorySearch?: string) {
  // Environment detection
  const [isTelegram, setIsTelegram] = useState<boolean | null>(null);

  // Telegram-specific data
  const { initDataRaw, initData } = isTelegram
    ? retrieveLaunchParams()
    : { initDataRaw: null, initData: null };
  const lp = isTelegram ? useLaunchParams() : null;
  const params = useSearchParams();
  const referralCode = params.get("referralCode");

  // Web-specific data (Slush Wallet)
  const { currentWallet } = useCurrentWallet();
  const isSlushWallet = currentWallet?.name === SLUSH_WALLET_NAME;
  const account = useCurrentAccount();

  // Common state and selectors
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const user = useSelector((state: RootState) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedInRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  // Determine environment on mount
  useEffect(() => {
    setIsTelegram(isTelegramEnvironment());
  }, []);

  // API endpoints (you might need to adjust these for web authentication)
  const telegramAuthApi = useApi({
    key: ["auth", "telegram"],
    method: "POST",
    url: "auth/telegram",
  }).post;

  const webAuthApi = useApi({
    key: ["auth", "web"],
    method: "POST",
    url: "auth/sui", // Assuming you have a web auth endpoint
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
  }, []);

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
  }, [userInventory]);

  const saveAddress = useCallback(async () => {
    // Get address from appropriate source
    const currentAddress = isTelegram ? address : account?.address;

    if (!currentAddress) return null;

    try {
      setIsLoading(true);
      await saveAddressApi?.mutateAsync({ address: currentAddress });
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
  }, [address, isTelegram, saveAddressApi, account]);

  // Telegram login logic
  const telegramLogin = useCallback(async () => {
    if (!initDataRaw || isLoggedInRef.current) return;

    isLoggedInRef.current = true;
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
        const response = await telegramAuthApi?.mutateAsync({
          initData: initDataRaw,
          referralCode: lp?.startParam,
        });
        if (response?.accessToken) {
          localStorage.setItem("token", response.accessToken);
          await Promise.all([getUser(), getUserInventory()]);
          return;
        }
      }
      await getUserInventory();
    } catch (error) {
      console.error("Telegram login error:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isLoggedInRef.current = false;
      setIsLoading(false);
    }
  }, [initDataRaw, initData, lp?.startParam, telegramAuthApi]);

  // Web login logic
  const webLogin = useCallback(async () => {
    if (isLoggedInRef.current || !account || !isSlushWallet) return;

    try {
      const storedUser = getLocalStorage("user");
      const currentAddress = account?.address;

      if (!currentAddress) {
        throw new Error("No wallet address available");
      }

      if (storedUser && storedUser.address === currentAddress) {
        dispatch(updateUserProfile(storedUser));
      }

      // Handle authentication token only if not already authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        const message = `Login to Merge Infinity with wallet: ${currentAddress} at ${new Date().getTime()}`;
        const messageEncoded = new TextEncoder().encode(message);
        const signature = await signPersonalMessage({
          message: messageEncoded,
          account: account!,
        });

        const response = await webAuthApi?.mutateAsync({
          walletAddress: currentAddress,
          signature: signature,
          message: message.toString(),
          referralCode: referralCode,
        });
        console.log(response);
        if (response?.accessToken) {
          localStorage.setItem("token", response.accessToken);
          await Promise.all([getUser(), getUserInventory()]);
          return;
        }
      }
      await getUserInventory();
    } catch (error) {
      console.error("Web login error:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isLoggedInRef.current = false;
      setIsLoading(false);
    }
  }, [account, isSlushWallet, isLoggedInRef.current, isSlushWallet]);

  // Universal login function
  const login = useCallback(async () => {
    if (isTelegram === null) return;
    if (isTelegram) {
      await telegramLogin();
    } else {
      await webLogin();
    }
  }, [isTelegram, account]);

  // Auto-login effect for Telegram
  useEffect(() => {
    if (isTelegram && initDataRaw) {
      const token = localStorage.getItem("token");
      if (token) {
        getUser();
      }
    }
  }, [isTelegram, initDataRaw]);

  // Auto-login effect for Web (when wallet connects)
  useEffect(() => {
    if (!isTelegram && account && isSlushWallet) {
      const token = localStorage.getItem("token");
      if (token) {
        getUser();
      }
    }
  }, [isTelegram, account, isSlushWallet]);

  return {
    user: user.profile,
    inventory: user.inventory,
    refetchInventory: getUserInventory,
    refetch: getUser,
    login,
    saveAddress,
    webLogin,
    isLoading,
    error,

    isTelegram,
    webWallet: !isTelegram ? currentWallet : null,
  };
}
