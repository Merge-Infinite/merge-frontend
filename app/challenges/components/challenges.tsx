"use client";

import { SkeletonCard } from "@/components/common/SkeletonCard";
import useApi from "@/hooks/useApi";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ChallengeItem } from "./item";
export const ChallengeTab = ({ day, type }: { day: string; type: string }) => {
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
    url: `challenges/daily`,
  }).get;

  const fetchSubmissionsToday = useApi({
    key: ["submissions-today"],
    method: "GET",
    url: `challenges/submissions/today`,
  }).get;

  useEffect(() => {
    fetchDailyChallenges?.refetch();
    fetchSubmissionsToday?.refetch();
  }, [fetchDailyChallenges, fetchSubmissionsToday]);

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex">
      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
        Challenge to create {fetchDailyChallenges?.data?.items?.length}{" "}
        elements:
      </div>
      <div className="self-stretch justify-start items-center gap-2 inline-flex flex-wrap">
        {fetchDailyChallenges?.isPending || fetchSubmissionsToday?.isPending ? (
          <SkeletonCard />
        ) : (
          fetchDailyChallenges?.data?.items?.map((item: any) => {
            const isOwned = !!fetchSubmissionsToday?.data?.find(
              (submission: any) => {
                return submission.dailyChallengeItem.item.id === item.item?.id;
              }
            );
            return (
              <ChallengeItem
                key={item.id}
                name={item.item.handle}
                icon={item.item.emoji}
                itemChallengeId={item.id}
                itemId={item.item.id}
                inventory={fetchSubmissionsToday?.data}
                className={isOwned ? "text-black bg-white" : "text-white"}
                onClick={() => {
                  router.push(`/submit?itemChallengeId=${item.id}`);
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(ChallengeTab);
