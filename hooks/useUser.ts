/* eslint-disable @typescript-eslint/no-explicit-any */
import { retrieveLaunchParams } from "@telegram-apps/sdk";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import useApi from "./useApi";
import { useEffect } from "react";

export function useUser() {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const lp = useLaunchParams();
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
    await getMe?.refetch();
  };

  const getUserInventory = async () => {
    await userInventory?.refetch();
  };

  useEffect(() => {
    if (initDataRaw) {
      login();
    }
  }, [initDataRaw]);

  return {
    user: getMe?.data,
    inventory: userInventory?.data,
    refetchInventory: userInventory?.refetch,
    refetch: getMe?.refetch,
    isLoading: false,
    error: null,
  };
}
