"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import MiTask from "./SocialChannels";
const miTask = [
  "Join MI Group",
  "Join MI Channel",
  "Follow MI on X",
  "Join MI Discord",
  "Join MI Facebook",
  "Follow MI on IG",
  "Subscribe MI Youtube Channel",
  "Follow MI on Tiktok",
  "Follow MI CEO on X",
  "Follow MI Head Marketing on X",
  "Follow MI Reddit",
  "Follow MI 9GAG",
];

const suiTask = [
  "Join SUI Foundation VN Telegram",
  "Join SUI HUB VN telegram",
  "Join SUI Foundation Discord",
  "Follow SUI X",
  "Follow SUI Youtube",
  "Follow SUI Fam",
  "Follow SUI Network VN",
  "Join Sui Community VN",
];

export const TaskScreen = () => {
  return (
    <div
      className="flex flex-col items-center justify-start h-full w-full"
      style={{
        paddingBottom: 100,
      }}
    >
      <Tabs defaultValue="mi" className="w-full h-full ">
        <TabsList className="flex justify-center gap-6 bg-transparent">
          <TabsTrigger
            value="mi"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2"
          >
            MI
          </TabsTrigger>
          <TabsTrigger
            value="sui"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2"
          >
            SUI
          </TabsTrigger>
          <TabsTrigger
            value="special"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2"
          >
            SPECIAL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mi" className="overflow-y-auto h-full ]">
          <MiTask type="mi" />
        </TabsContent>
        <TabsContent value="sui" className="overflow-y-auto h-full ">
          <MiTask type="sui" />
        </TabsContent>
        <TabsContent value="special" className=" h-full overflow-y-auto ">
          <MiTask type="special" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(TaskScreen);
