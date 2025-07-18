"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import useApi from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ChallengeItem } from "./item";
export const ChallengeTab = ({ day, type }: { day: string; type: string }) => {
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

  const fetchDailyChallenges = useApi({
    key: ["daily-challenges"],
    method: "GET",
    url: `challenges/daily`,
  }).get;

  const fetchTrendChallenges = useApi({
    key: ["trend-challenges"],
    method: "GET",
    url: `challenges/trending`,
  }).get;

  const fetchSubmissionsToday = useApi({
    key: ["submissions-today"],
    method: "GET",
    url: `challenges/submissions/today`,
  }).get;

  useEffect(() => {
    fetchDailyChallenges?.refetch();
    fetchSubmissionsToday?.refetch();
    fetchTrendChallenges?.refetch();
  }, []);

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex">
      {!!fetchTrendChallenges?.data && (
        <div className="w-full  flex-col justify-start items-start gap-2 inline-flex">
          <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
            Special challenge
          </div>
          <div className="self-stretch justify-start items-center gap-2 inline-flex flex-wrap">
            {fetchTrendChallenges?.isPending ? (
              <SkeletonCard />
            ) : (
              fetchTrendChallenges?.data?.items?.map((item: any) => {
                const isOwned = !!fetchSubmissionsToday?.data?.find(
                  (submission: any) => {
                    return (
                      submission.dailyChallengeItem.item.id === item.item?.id
                    );
                  }
                );
                return (
                  <ChallengeItem
                    key={item.id}
                    name={item.item.handle.toUpperCase()}
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
      )}
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
