"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { BagScreen } from "@/components/screen/bag/bag";
import { HomeScreen } from "@/components/screen/home";
import { NFTMarket } from "@/components/screen/market/market";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initBackButton } from "@telegram-apps/sdk";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const [backButton] = initBackButton();
  const { user, inventory, refetchInventory } = useAuth();

  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    backButton.hide();
  }, []);

  const isWalletPath = React.useMemo(() => {
    return pathname.includes("wallet");
  }, [pathname]);

  if (!user) {
    return <SkeletonCard />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[var(--tg-viewport-height)] ">
      <Tabs defaultValue="market" className="w-full h-full ">
        {!isWalletPath && (
          <TabsList className="flex items-start gap-6 p-4 rounded-3xl border border-[#333] bg-neutral-950/[.60] fixed right-8 left-8 bottom-8 bg-black">
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
        <TabsContent value="bag">
          <BagScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
}
