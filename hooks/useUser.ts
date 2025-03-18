/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import useApi from "./useApi";

export function useUser() {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const lp = useLaunchParams();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
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
    try {
      const existUser = localStorage.getItem("user");
      if (existUser) {
        const localUser = JSON.parse(existUser);
        if (initData?.user?.id !== localUser?.id) {
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
      localStorage.setItem("user", JSON.stringify(initData?.user));
      await getUser();
      await getUserInventory();
    } catch (error) {
      console.log(error);
    }
  };

  const getUser = async () => {
    try {
      await getMe?.refetch();
    } catch (error) {
      console.log(error);
    }
  };

  const saveAddress = async () => {
    try {
      await saveAddressApi?.mutateAsync({ address });
      getMe?.refetch();
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

  console.log(getMe?.data);

  return {
    user: getMe?.data,
    inventory: userInventory?.data,
    refetchInventory: userInventory?.refetch,
    refetch: getMe?.refetch,
    isLoading: false,
    error: null,
  };
}
