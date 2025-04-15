"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ChallengeTab } from "./components/challenges";
import { RewardTab } from "./components/reward";
import { SubmittedTab } from "./components/submitted";
export default function Challenge() {
  const searchParams = useSearchParams();
  const day = searchParams.get("day");
  const type = searchParams.get("type");
  const [backButton] = initBackButton();
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <div className="justify-start text-white text-sm font-bold font-['Sora'] leading-normal w-full">
        {type === "daily" ? "Daily" : "Web3"}
      </div>
      <Tabs defaultValue="challenges" className="w-full h-full">
        <TabsList className="flex justify-start gap-6 bg-transparent">
          <TabsTrigger
            value="challenges"
            className=" data-[state=active]:border-b-2"
          >
            CHALLENGE
          </TabsTrigger>
          <TabsTrigger
            value="submitted"
            className=" data-[state=active]:border-b-2"
          >
            SUBMITED
          </TabsTrigger>

          <TabsTrigger
            value="rewards"
            className=" data-[state=active]:border-b-2"
          >
            REWARDS
          </TabsTrigger>
        </TabsList>
        <TabsContent value="challenges" className="h-full">
          <ChallengeTab day={day || "1"} type={type || "daily"} />
        </TabsContent>
        <TabsContent value="submitted" className="h-full">
          <SubmittedTab />
        </TabsContent>
        <TabsContent value="rewards" className="h-full">
          <RewardTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
