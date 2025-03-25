/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useApi from "./useApi";

export function useUser() {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const lp = useLaunchParams();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const [user, setUser] = useState<any>(null);
  const authApi = useApi({
    key: ["auth"],
    method: "POST",
    url: "auth/telegram",
  }).post;

  const getMe = useApi({
    key: ["auth"],
    method: "GET",
    url: "user/me",
  }).get;

  const userInventory = useApi({
    key: ["user", "inventory"],
    method: "GET",
    url: "user/inventory",
  }).get;

  const saveAddressApi = useApi({
    key: ["user", "saveAddress"],
    method: "POST",
    url: "user/saveAddress",
  }).post;

  const login = async () => {
    console.log("login");
    try {
      const existUser = localStorage.getItem("user");
      if (existUser) {
        const localUser = JSON.parse(existUser);
        if (localUser.id) {
          if (Number(initData?.user?.id) !== Number(localUser?.telegramId)) {
            localStorage.clear();
          }
          setUser(localUser);
        } else {
          localStorage.clear();
        }
      }
      const existToken = localStorage.getItem("token");
      if (!existToken) {
        const response: any = await authApi?.mutateAsync({
          initData: initDataRaw,
          referralCode: lp.startParam,
        });
        if (response.accessToken) {
          localStorage.setItem("token", response.accessToken);
        }
      }
      await getUser();
      await getUserInventory();
    } catch (error) {
      console.log(error);
    }
  };

  const getUser = async () => {
    try {
      const response = await getMe?.refetch();
      setUser(response?.data);
      localStorage.setItem("user", JSON.stringify(response?.data));
    } catch (error) {
      console.log(error);
    }
  };

  const saveAddress = async () => {
    try {
      await saveAddressApi?.mutateAsync({ address });
      const response = await getMe?.refetch();
      localStorage.setItem("user", JSON.stringify(response?.data));
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (address && !getMe?.data?.walletAddress) {
      saveAddress();
    }
  }, [address]);

  const getUserInventory = async () => {
    try {
      await userInventory?.refetch();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (initDataRaw) {
      login();
    }
  }, [initDataRaw]);

  return {
    user,
    inventory: userInventory?.data,
    refetchInventory: userInventory?.refetch,
    refetch: getMe?.refetch,
    isLoading: false,
    error: null,
  };
}
