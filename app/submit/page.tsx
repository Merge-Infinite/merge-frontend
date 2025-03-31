"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import ElementItem from "@/components/common/ElementItem";
import { RecipeDetail } from "@/components/screen/play/recipe-detail";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdsgram } from "@/hooks/useAdsgram";
import useApi from "@/hooks/useApi";
import { shortenName } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SubmitItem() {
  const searchParams = useSearchParams();
  const itemChallengeId = searchParams.get("itemChallengeId");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [backButton] = initBackButton();
  const router = useRouter();

  const fetchItemChallenge = useApi({
    key: ["item-challenge"],
    method: "GET",
    url: `challenges/item/${itemChallengeId}`,
  }).get;

  const submitItemChallenge = useApi({
    key: ["submit-item-challenge"],
    method: "POST",
    url: `challenges/submit`,
  }).post;

  const fetchCraftedItemsToday = useApi({
    key: ["crafted-items-today"],
    method: "GET",
    url: `challenges/crafted-items/today?itemId=${fetchItemChallenge?.data?.item?.id}`,
    enabled: false,
  }).get;

  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
    fetchItemChallenge?.refetch();
  }, [fetchItemChallenge, fetchCraftedItemsToday]);

  useEffect(() => {
    if (fetchItemChallenge?.data?.item?.id) {
      fetchCraftedItemsToday?.refetch();
    }
  }, [fetchItemChallenge?.data?.item?.id]);

  const { showAd, isLoading } = useAdsgram({
    blockId: "9126",
    onReward: () => {
      setIsRecipeDetailOpen(true);
    },
    onError: (e: any) => {
      toast.error(e?.description || "Error");
    },
  });

  return (
    <div className="flex flex-col h-full gap-4 ">
      <div className="self-stretch justify-start items-center gap-2 inline-flex">
        <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
          {fetchItemChallenge?.data?.item?.emoji}
          <div className="text-white text-xs  leading-normal">
            {shortenName(fetchItemChallenge?.data?.item?.handle)}
          </div>
        </div>
        <Button
          isLoading={isLoading}
          disabled={isLoading}
          onClick={showAd}
          className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex w-fit"
        >
          <div className="text-white text-xs font-normal leading-normal">
            View Recipe
          </div>
          <Image
            src="/images/ad.svg"
            alt="arrow-right"
            width={24}
            height={24}
          />
        </Button>
        <div className="justify-start items-start flex">
          <Image src={"images/points.svg"} alt="item" width={16} height={16} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            +1 Point
          </div>
        </div>
      </div>
      <div
        className={`flex px-3 py-1 rounded-3xl border border-[#333333] justify-center items-center gap-2 w-fit ${
          fetchCraftedItemsToday?.data?.length > 0
            ? "bg-white text-[#333]"
            : "bg-[#333333] text-white"
        }`}
      >
        {fetchItemChallenge?.data?.item?.emoji}
        <div className="text-xs font-normal leading-normal">
          {fetchItemChallenge?.data?.item?.handle}
        </div>
      </div>
      <Button
        className="px-3 py-1  rounded-3xl justify-center items-center gap-2 inline-flex w-fit"
        disabled={
          fetchCraftedItemsToday?.data?.length === 0 ||
          submitItemChallenge?.isPending
        }
        onClick={() => {
          submitItemChallenge?.mutateAsync({
            itemChallengeId: itemChallengeId,
          });
        }}
        isLoading={submitItemChallenge?.isPending}
      >
        <div className="text-[#333333] text-xs font-normal font-['Sora'] uppercase leading-normal">
          Submit
        </div>
      </Button>
      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
        If you don't have this element available:
      </div>
      <Button
        className="px-3 py-1  rounded-3xl justify-center items-center gap-2 inline-flex w-fit"
        onClick={() => {
          router.push("/play");
        }}
      >
        <div className="text-center text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
          Merge
        </div>
      </Button>

      <Sheet open={isRecipeDetailOpen} onOpenChange={setIsRecipeDetailOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#141414] text-white border-t border-[#333333]"
          showClose={true}
          style={{
            height: "90%",
          }}
        >
          <SheetHeader className="w-[80%] flex flex-row items-center gap-2">
            <SheetTitle className="text-white text-center">
              <ElementItem
                {...fetchItemChallenge?.data?.item}
                amount={undefined}
              />
            </SheetTitle>
          </SheetHeader>
          <RecipeDetail item={fetchItemChallenge?.data?.item} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
