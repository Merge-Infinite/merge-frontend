"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { BagScreen } from "@/components/screen/bag/bag";
import { HomeScreen } from "@/components/screen/home/home";
import { NFTMarket } from "@/components/screen/market/market";
import { Shop } from "@/components/screen/shop/shop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { AppDispatch, RootState } from "@/lib/wallet/store";
import {
  AppMode,
  TabMode,
  updateTabMode,
} from "@/lib/wallet/store/app-context";
import { initBackButton } from "@telegram-apps/sdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Home() {
  const [backButton] = initBackButton();
  const { user } = useUser();
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const appMode = useSelector((state: RootState) => state.appContext.appMode);
  const tabMode = useSelector((state: RootState) => state.appContext.tabMode);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  useEffect(() => {
    backButton.hide();
  }, []);

  if (!user || !authed) {
    return <SkeletonCard />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[var(--tg-viewport-height)] ">
      <Tabs
        defaultValue={tabMode || "home"}
        className="w-full h-full "
        value={tabMode}
        onValueChange={(value) => dispatch(updateTabMode(value as TabMode))}
      >
        {appMode === AppMode.GAMES && (
          <TabsList
            className="flex items-start gap-6 p-4 rounded-3xl border border-[#333] bg-neutral-950/[.60] fixed right-8 left-8  bg-black"
            style={{
              bottom: 8,
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
        )}
        <TabsContent value="home" className="h-full">
          <HomeScreen />
        </TabsContent>
        <TabsContent value="market" className="h-full">
          <NFTMarket />
        </TabsContent>
        <TabsContent value="bag" className="h-full">
          <BagScreen />
        </TabsContent>
        <TabsContent value="shop" className="h-full">
          <Shop />
        </TabsContent>
      </Tabs>
    </div>
  );
}
