"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameScreen } from "@/components/screen/game";
export function HomeScreen() {
  return (
    <Tabs defaultValue="game" className="w-full">
      <TabsList className="flex justify-center gap-6 bg-transparent">
        <TabsTrigger
          value="game"
          className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
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
      <TabsContent value="wallet"></TabsContent>
    </Tabs>
  );
}
