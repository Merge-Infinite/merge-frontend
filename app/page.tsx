"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import SplashScreen from "@/components/common/Splash";
import { BagScreen } from "@/components/screen/bag/bag";
import { HomeScreen } from "@/components/screen/home/home";
import { Leaderboard } from "@/components/screen/leaderboard/leaderboard";
import { NFTMarket } from "@/components/screen/market/market";
import { Shop } from "@/components/screen/shop/shop";
import TaskScreen from "@/components/screen/task/Task";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  AppMode,
  TabMode,
  updateAppMode,
  updateTabMode,
} from "@/lib/wallet/store/app-context";
import { clearUser } from "@/lib/wallet/store/user";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUniversalApp } from "./context/UniversalAppContext";
export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, backButton, isTelegram, isReady, login } = useUniversalApp();
  const account = useCurrentAccount();

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.hide();
      }
      dispatch(updateAppMode(AppMode.GAMES));
    }
  }, [isReady, isTelegram, backButton, dispatch]);

  useEffect(() => {
    if (!isTelegram && isReady && account && !user) {
      login();
    }
  }, [isReady, account, user, isTelegram]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token && isReady) {
      dispatch(clearUser());
      login();
    }
  }, [user, isTelegram]);

  const appMode = useSelector((state: RootState) => state.appContext.appMode);
  const tabMode = useSelector((state: RootState) => state.appContext.tabMode);

  return (
    <div
      className={`flex flex-col items-center h-full w-full p-4 ${
        !isTelegram && "h-screen "
      }`}
    >
      {!user ? (
        <SplashScreen />
      ) : (
        <Tabs
          defaultValue={tabMode || "home"}
          value={tabMode}
          className="w-full h-full"
          onValueChange={(value) => dispatch(updateTabMode(value as TabMode))}
        >
          <TabsList
            className={`flex items-start gap-6 p-4 rounded-3xl border border-[#333] bg-neutral-950/[.60] fixed right-8 left-8  bg-black z-10 ${
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
