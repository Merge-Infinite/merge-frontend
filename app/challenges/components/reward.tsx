"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import useApi from "@/hooks/useApi";
import { initBackButton } from "@telegram-apps/sdk";
import { CheckIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export const RewardTab = () => {
  const [backButton] = initBackButton();
  const router = useRouter();
  const [activeValue, setActiveValue] = useState(10);

  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, [backButton, router]);

  const fetchTotalElements = useApi({
    key: ["total-elements"],
    method: "GET",
    url: `challenges/total-elements`,
  }).get;

  const fetchRewards = useApi({
    key: ["rewards"],
    method: "GET",
    url: `challenges/rewards`,
  }).get;

  const claimReward = useApi({
    key: ["claim-reward"],
    method: "POST",
    url: `challenges/claim-reward`,
  }).post;

  useEffect(() => {
    fetchTotalElements?.refetch();
    fetchRewards?.refetch();
  }, [fetchTotalElements, fetchRewards]);

  // Generate range of numbers for element values
  const fiveHundredElements = Array.from(
    { length: 50 },
    (_, i) => (i + 1) * 10
  ).sort((a, b) => a - b);

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-col space-y-2">
        <h2 className="text-white text-sm font-bold font-['Sora']">Daily</h2>

        <div>
          <span className="text-white text-sm font-normal font-['Sora']">
            Total number of elements:{" "}
          </span>
          <span className="text-[#68ffd1] text-sm font-normal font-['Sora']">
            {fetchTotalElements?.data?.totalSubmitted}
          </span>
        </div>
      </div>

      <Card className="bg-transparent border-[#1f1f1f]">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-white text-sm font-normal font-['Sora']">
            500 elements:{" "}
          </CardTitle>
          <CheckIcon className="text-white w-6 h-6" />
        </CardHeader>
        <CardContent className="p-2">
          <ScrollArea className="h-64">
            <div className="flex flex-wrap gap-2">
              {fiveHundredElements.map((value) => {
                const found = fetchRewards?.data?.rewards.find(
                  (reward) => reward.submissionCount === value
                );

                const isActive = !!found;
                const isClaimed = !!found?.claimed;
                return (
                  <Button
                    key={value}
                    variant={activeValue === value ? "default" : "outline"}
                    className={
                      isActive
                        ? isClaimed
                          ? "bg-[#333333] hover:bg-[#333333] text-white rounded-3xl px-3 py-1 h-auto w-fit"
                          : "bg-[#a668ff] hover:bg-[#9150e9] text-neutral-950 rounded-3xl px-3 py-1 h-auto w-fit"
                        : "border-[#333333] text-[#333333] hover:text-white hover:border-white rounded-3xl px-3 py-1 h-auto"
                    }
                    onClick={() => {
                      if (
                        isClaimed ||
                        !isActive ||
                        claimReward?.isPending ||
                        !found?.id
                      )
                        return;
                      claimReward
                        ?.mutateAsync({
                          rewardId: found?.id,
                        })
                        .then(() => {
                          fetchRewards?.refetch();
                        });
                    }}
                    isLoading={claimReward?.isPending}
                    disabled={claimReward?.isPending}
                  >
                    <span className="text-xs font-normal font-['Sora'] uppercase">
                      {value}
                    </span>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="bg-transparent border-[#1f1f1f]">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-white text-sm font-normal font-['Sora']">
            1,000 elements:{" "}
          </span>
          <XIcon className="text-[#1f1f1f] w-6 h-6" />
        </CardContent>
      </Card>

      <Card className="bg-transparent border-[#1f1f1f]">
        <CardContent className="flex items-center justify-between p-4">
          <span className="text-white text-sm font-normal font-['Sora']">
            1,500 elements:{" "}
          </span>
          <XIcon className="text-[#1f1f1f] w-6 h-6" />
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(RewardTab);
