"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HomeScreen } from "@/components/screen/home";
import Image from "next/image";
import PlayGame from "@/components/screen/play";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const [backButton] = initBackButton();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    backButton.hide();
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Tabs defaultValue="home" className="w-full h-full">
        <TabsList className="flex items-start gap-6 p-4 rounded-3xl border border-[#333] bg-neutral-950/[.60] fixed right-8 left-8 bottom-8">
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
            <Image src="/images/market.svg" alt="logo" width={24} height={24} />
          </TabsTrigger>
          <TabsTrigger value="shop">
            <Image src="/images/shop.svg" alt="logo" width={24} height={24} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <HomeScreen />
        </TabsContent>
        {/* <TabsContent value="play" className="h-full">
          <PlayGame />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
