"use client";

import { SkeletonCard } from "@/components/common/SkeletonCard";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { ChallengeItem } from "./item";
export const ChallengeTab = ({ day }: { day: string }) => {
  const [backButton] = initBackButton();
  const router = useRouter();
  const { inventory } = useUser();

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

  if (fetchDailyChallenges?.isPending) {
    return <SkeletonCard />;
  }

  console.log(inventory);
  console.log(fetchDailyChallenges?.data?.items);
  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex">
      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
        Challenge to create {fetchDailyChallenges?.data?.items?.length}{" "}
        elements:
      </div>
      <div className="self-stretch justify-start items-center gap-2 inline-flex flex-wrap">
        {fetchDailyChallenges?.data?.items?.map((item: any) => {
          const isOwned = !!inventory?.find((inventoryItem: any) => {
            return inventoryItem.itemId === item?.item?.id;
          });
          return (
            <ChallengeItem
              key={item.id}
              name={item.item.handle}
              icon={item.item.emoji}
              itemChallengeId={item.id}
              itemId={item.item.id}
              inventory={inventory}
              className={isOwned ? "text-black bg-white" : "text-white"}
              onClick={() => {
                router.push(`/submit?itemChallengeId=${item.id}`);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ChallengeTab);
