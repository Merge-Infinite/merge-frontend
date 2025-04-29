"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
/* eslint-disable @typescript-eslint/no-explicit-any */

import LeaderboardTab from "@/components/screen/leaderboard/leaderboard-tab";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
export const Leaderboard = () => {
  const [backButton] = initBackButton();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
      dispatch(updateTabMode(TabMode.HOME));
    });
  }, []);
  return (
    <div
      className="flex flex-col items-center justify-start p-4"
      style={{
        paddingBottom: 100,
      }}
    >
      <Tabs defaultValue="leaderboard" className="w-full h-full">
        <TabsList className="flex justify-center gap-6 bg-transparent">
          <TabsTrigger
            value="leaderboard"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
          >
            Leaderboard
          </TabsTrigger>
          <TabsTrigger
            value="reward"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
          >
            Reward
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="leaderboard"
          className="overflow-y-auto h-[var(--tg-viewport-height) - 100px]"
        >
          <LeaderboardTab />
        </TabsContent>
        <TabsContent
          value="reward"
          className="overflow-y-auto h-[var(--tg-viewport-height) - 100px]"
        ></TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(Leaderboard);
