"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import useApi from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ChallengeItem } from "./item";

export const SubmittedTab = () => {
  const router = useRouter();

  const { backButton, isTelegram, isReady } = useUniversalApp();

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.show();
        backButton.on("click", () => {
          router.back();
        });
      }
    }
  }, [isReady, isTelegram, backButton]);
  const fetchSubmittedItems = useApi({
    key: ["submitted-items"],
    method: "GET",
    url: `challenges/submitted-items`,
  }).get;

  useEffect(() => {
    fetchSubmittedItems?.refetch();
  }, [fetchSubmittedItems]);

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex.">
      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
        Total number of submissions:{" "}
        <span className="text-[#68FFD1]">
          {fetchSubmittedItems?.data?.length}
        </span>
      </div>
      <div className="self-stretch justify-start items-center gap-2 inline-flex flex-wrap">
        {fetchSubmittedItems?.isPending ? (
          <SkeletonCard />
        ) : (
          fetchSubmittedItems?.data?.map((item: any) => (
            <ChallengeItem
              key={item.id}
              name={item.dailyChallengeItem.item.handle}
              icon={item.dailyChallengeItem.item.emoji}
              className={"bg-white text-black"}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(SubmittedTab);
