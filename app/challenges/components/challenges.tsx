"use client";

import useApi from "@/hooks/useApi";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ChallengeItem } from "./item";

export const ChallengeTab = ({ day }: { day: string }) => {
  const [backButton] = initBackButton();
  const router = useRouter();

  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, [backButton, router]);

  const fetchDailyChallenges = useApi({
    key: ["daily-challenges"],
    method: "GET",
    url: `challenges/daily/${Number(day)}`,
  }).get;

  useEffect(() => {
    fetchDailyChallenges?.refetch();
  }, [fetchDailyChallenges]);

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex p-4">
      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
        Challenge to create 10 elements:
      </div>
      <div className="self-stretch justify-start items-center gap-2 inline-flex flex-wrap">
        {fetchDailyChallenges?.data?.items?.map((item: any) => (
          <ChallengeItem
            key={item.id}
            name={item.item.handle}
            icon={item.item.emoji}
            itemChallengeId={item.id}
            onClick={() => {
              router.push(`/submit?itemChallengeId=${item.id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(ChallengeTab);
