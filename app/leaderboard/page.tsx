"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
/* eslint-disable @typescript-eslint/no-explicit-any */

import LeaderboardTab from "@/components/screen/leaderboard/leaderboard-tab";
import React from "react";
export const Leaderboard = () => {
  return (
    <div
      className="flex flex-col items-center justify-start"
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
