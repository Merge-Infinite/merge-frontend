"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameScreen } from "@/components/screen/game";
import WalletApp from "@/lib/wallet";
import { useRouter } from "next/navigation";
export function HomeScreen() {
  const router = useRouter();
  return (
    <Tabs defaultValue="wallet" className="w-full">
      <TabsList className="flex justify-center gap-6 bg-transparent">
        <TabsTrigger
          value="game"
          className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
          onClick={() => router.push("/")}
        >
          GAME
        </TabsTrigger>
        <TabsTrigger
          value="wallet"
          className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
        >
          WALLET
        </TabsTrigger>
      </TabsList>
      <TabsContent value="game">
        <GameScreen />
      </TabsContent>
      <TabsContent value="wallet">
        <WalletApp />
      </TabsContent>
    </Tabs>
  );
}
