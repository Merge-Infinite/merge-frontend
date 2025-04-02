"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppDispatch } from "@/lib/wallet/store";
import { AppMode, updateAppMode } from "@/lib/wallet/store/app-context";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

// Import the wallet app with ssr: false
const WalletAppComponent = dynamic(() => import("@/lib/wallet"), {
  ssr: false,
});
export default function Wallet() {
  const [backButton] = initBackButton();

  const dispatch = useDispatch<AppDispatch>();
  const setAppMode = useCallback(
    (mode: AppMode) => {
      dispatch(updateAppMode(mode));
    },
    [dispatch]
  );
  const router = useRouter();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);

  return (
    <div className="flex flex-col items-center  h-full ">
      <Tabs defaultValue="wallet" className="w-full mt-4">
        <TabsList className="flex justify-center gap-6 bg-transparent">
          <TabsTrigger
            value="game"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
            onClick={() => {
              setAppMode(AppMode.GAMES);
              router.push("/");
            }}
          >
            GAME
          </TabsTrigger>
          <TabsTrigger
            onClick={() => {
              setAppMode(AppMode.WALLET);
            }}
            value="wallet"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
          >
            WALLET
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <WalletAppComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
