"use client";

import { GameScreen } from "@/components/screen/home/game";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WalletApp from "@/lib/wallet";
import { AppDispatch } from "@/lib/wallet/store";
import { AppMode, updateAppMode } from "@/lib/wallet/store/app-context";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
export function HomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const setAppMode = useCallback(
    (mode: AppMode) => {
      dispatch(updateAppMode(mode));
    },
    [dispatch]
  );

  return (
    <Tabs defaultValue="game" className="w-full">
      <TabsList className="flex justify-center gap-6 bg-transparent">
        <TabsTrigger
          value="game"
          className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
          onClick={() => setAppMode(AppMode.GAMES)}
        >
          GAME
        </TabsTrigger>
        <TabsTrigger
          onClick={() => setAppMode(AppMode.WALLET)}
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
