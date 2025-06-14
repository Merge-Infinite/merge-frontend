"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import SplashScreen from "@/components/common/Spash";
import { BagScreen } from "@/components/screen/bag/bag";
import { HomeScreen } from "@/components/screen/home/home";
import { Leaderboard } from "@/components/screen/leaderboard/leaderboard";
import { NFTMarket } from "@/components/screen/market/market";
import { Shop } from "@/components/screen/shop/shop";
import TaskScreen from "@/components/screen/task/Task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  AppMode,
  TabMode,
  updateAppMode,
  updateTabMode,
} from "@/lib/wallet/store/app-context";
import { initBackButton, retrieveLaunchParams } from "@telegram-apps/sdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
export default function Home() {
  const [backButton] = initBackButton();
  const user = useSelector((state: RootState) => state.user);
  const { initDataRaw } = retrieveLaunchParams();

  const authed = useSelector((state: RootState) => state.appContext.authed);
  const appMode = useSelector((state: RootState) => state.appContext.appMode);
  const tabMode = useSelector((state: RootState) => state.appContext.tabMode);
  const accountId = useSelector(
    (state: RootState) => state.appContext.accountId
  );
  const { saveAddress, login } = useUser();
  const { address } = useAccount(accountId);
  const initialized = useSelector(
    (state: RootState) => state.appContext.initialized
  );
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  useEffect(() => {
    backButton.hide();
    dispatch(updateAppMode(AppMode.GAMES));
  }, []);

  useEffect(() => {
    if (initDataRaw) {
      login();
    }
  }, [initDataRaw]);

  useEffect(() => {
    if (address) {
      saveAddress();
    }
  }, [address]);

  // useEffect(() => {
  //   if (!authed && initialized) {
  //     const loginInterval = setInterval(async () => {
  //       try {
  //         await apiClient.callFunc<string, string>("auth", "login", "123456");
  //         dispatch(updateAuthed(true));
  //         clearInterval(loginInterval);
  //       } catch (e) {}
  //     }, 3000);

  //     return () => {
  //       clearInterval(loginInterval);
  //     };
  //   }
  // }, [authed, initialized]);

  return (
    <div className="flex flex-col items-center h-full w-full p-4">
      {!user.profile ? (
        <SplashScreen />
      ) : (
        <Tabs
          defaultValue={tabMode || "home"}
          value={tabMode}
          className="w-full h-full"
          onValueChange={(value) => dispatch(updateTabMode(value as TabMode))}
        >
          <TabsList
            className={`flex items-start gap-6 p-4 rounded-3xl border border-[#333] bg-neutral-950/[.60] fixed right-8 left-8 bg-black z-10 ${
              appMode !== AppMode.GAMES ? "hidden" : ""
            }`}
            style={{
              bottom: 40,
            }}
          >
            <TabsTrigger value="home">
              <Image src="/images/home.svg" alt="logo" width={24} height={24} />
            </TabsTrigger>
            <TabsTrigger value="play" onClick={() => router.push("/play")}>
              <Image src="/images/play.svg" alt="logo" width={24} height={24} />
            </TabsTrigger>

            <TabsTrigger value="task">
              <Image src="/images/task.svg" alt="logo" width={24} height={24} />
            </TabsTrigger>
            {/* <TabsTrigger value="leaderboard">
              <Image src="/images/rank.svg" alt="logo" width={24} height={24} />
            </TabsTrigger> */}
            <TabsTrigger value="bag">
              <Image src="/images/bag.svg" alt="logo" width={24} height={24} />
            </TabsTrigger>
            <TabsTrigger value="market">
              <Image
                src="/images/market.svg"
                alt="logo"
                width={24}
                height={24}
              />
            </TabsTrigger>
            <TabsTrigger value="shop">
              <Image src="/images/shop.svg" alt="logo" width={24} height={24} />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="h-full">
            <HomeScreen />
          </TabsContent>
          <TabsContent value="market" className="h-full">
            <NFTMarket />
          </TabsContent>
          <TabsContent value="bag" className="h-full">
            <BagScreen />
          </TabsContent>
          <TabsContent value="task" className="h-full ">
            <TaskScreen />
          </TabsContent>
          <TabsContent value="shop" className="h-full ">
            <Shop />
          </TabsContent>
          <TabsContent value="leaderboard" className="h-full">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
