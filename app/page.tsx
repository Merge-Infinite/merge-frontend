"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import SplashScreen from "@/components/common/Splash";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import userApi from "@/lib/api/user";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  AppMode,
  TabMode,
  updateAppMode,
  updateSuiPrice,
  updateTabMode,
} from "@/lib/wallet/store/app-context";
import { clearUser } from "@/lib/wallet/store/user";
import { useCurrentAccount } from "@mysten/dapp-kit";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useUniversalApp } from "./context/UniversalAppContext";

const BagScreen = dynamic(
  () =>
    import("@/components/screen/bag/bag").then((mod) => ({
      default: mod.BagScreen,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-800 rounded h-32">Loading...</div>
    ),
  }
);

const HomeScreen = dynamic(
  () =>
    import("@/components/screen/home/home").then((mod) => ({
      default: mod.HomeScreen,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-800 rounded h-32">Loading...</div>
    ),
  }
);

const Leaderboard = dynamic(
  () =>
    import("@/components/screen/leaderboard/leaderboard").then((mod) => ({
      default: mod.Leaderboard,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-800 rounded h-32">Loading...</div>
    ),
  }
);

const NFTMarket = dynamic(
  () =>
    import("@/components/screen/market/market").then((mod) => ({
      default: mod.NFTMarket,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-800 rounded h-32">Loading...</div>
    ),
  }
);

const Shop = dynamic(
  () =>
    import("@/components/screen/shop/shop").then((mod) => ({
      default: mod.Shop,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-800 rounded h-32">Loading...</div>
    ),
  }
);

const TaskScreen = dynamic(() => import("@/components/screen/task/Task"), {
  loading: () => (
    <div className="animate-pulse bg-gray-800 rounded h-32">Loading...</div>
  ),
});
export default function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { backButton, isTelegram, isReady } = useUniversalApp();
  const { data: suiPrice } = userApi.getSuiPrice.useQuery();
  const { user, login } = useUser();
  const account = useCurrentAccount();

  const handleTabChange = useCallback(
    (value: string) => {
      dispatch(updateTabMode(value as TabMode));
    },
    [dispatch]
  );

  useEffect(() => {
    if (suiPrice) {
      dispatch(updateSuiPrice((suiPrice as any).price || 0));
    }
  }, [suiPrice]);

  const handlePlayClick = useCallback(() => {
    router.push("/play");
  }, [router]);

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.hide();
      }
      dispatch(updateAppMode(AppMode.GAMES));
    }
  }, [isReady, isTelegram, backButton, dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token && isReady) {
      dispatch(clearUser());
      login();
    }
  }, [isReady, account]);

  const { appMode, tabMode } = useSelector((state: RootState) => ({
    appMode: state.appContext.appMode,
    tabMode: state.appContext.tabMode,
  }));

  const tabListClassName = useMemo(
    () =>
      `flex items-start gap-6 p-4 rounded-3xl border border-[#333] bg-neutral-950/[.60] fixed right-8 left-8 bg-black z-10 ${
        appMode !== AppMode.GAMES ? "hidden" : ""
      }`,
    [appMode]
  );

  const containerClassName = useMemo(
    () =>
      `flex flex-col items-center h-full w-full p-4 ${
        !isTelegram && "h-screen "
      }`,
    [isTelegram]
  );

  return (
    <div className={containerClassName}>
      {!user ? (
        <SplashScreen />
      ) : (
        <Tabs
          defaultValue={tabMode || "home"}
          value={tabMode}
          className="w-full h-full"
          onValueChange={handleTabChange}
        >
          <TabsList
            className={tabListClassName}
            style={{
              bottom: 40,
            }}
          >
            <TabsTrigger value="home">
              <Image
                src="/images/home.svg"
                alt="Home"
                width={24}
                height={24}
                priority
              />
            </TabsTrigger>
            <TabsTrigger value="play" onClick={handlePlayClick}>
              <Image src="/images/play.svg" alt="Play" width={24} height={24} />
            </TabsTrigger>

            <TabsTrigger value="task">
              <Image
                src="/images/task.svg"
                alt="Tasks"
                width={24}
                height={24}
              />
            </TabsTrigger>
            {/* <TabsTrigger value="leaderboard">
              <Image src="/images/rank.svg" alt="Leaderboard" width={24} height={24} />
            </TabsTrigger> */}
            <TabsTrigger value="bag">
              <Image src="/images/bag.svg" alt="Bag" width={24} height={24} />
            </TabsTrigger>
            <TabsTrigger value="market">
              <Image
                src="/images/market.svg"
                alt="Market"
                width={24}
                height={24}
              />
            </TabsTrigger>
            <TabsTrigger value="shop">
              <Image src="/images/shop.svg" alt="Shop" width={24} height={24} />
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
