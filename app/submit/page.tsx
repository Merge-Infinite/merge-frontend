"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import { Button } from "@/components/ui/button";
import useApi from "@/hooks/useApi";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SubmitItem() {
  const searchParams = useSearchParams();
  const itemChallengeId = searchParams.get("itemChallengeId");

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

  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
    fetchItemChallenge?.refetch();
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 ">
      <div className="self-stretch justify-start items-center gap-2 inline-flex">
        <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
          {fetchItemChallenge?.data?.item?.emoji}
          <div className="text-white text-xs  leading-normal">
            {fetchItemChallenge?.data?.item?.handle}
          </div>
        </div>
        <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 flex">
          <div className="text-white text-xs font-normal leading-normal">
            View Recipe
          </div>
          <div data-svg-wrapper>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                opacity="0.987"
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1.93498 3.00382C3.17498 2.99364 4.41479 3.00382 5.65449 3.03431C4.87943 4.12711 4.09693 5.21449 3.30693 6.2965C3.18132 6.46638 3.08985 6.64931 3.03254 6.84528C4.05461 6.874 5.07083 6.84351 6.08132 6.75382C6.99802 5.54034 7.89229 4.31065 8.76424 3.0648C9.77991 2.9937 10.7961 2.98351 11.813 3.03431C10.9391 4.27412 10.065 5.514 9.19107 6.75382C9.68955 6.82419 10.1977 6.85467 10.7155 6.84528C11.2033 6.8351 11.6911 6.82498 12.1789 6.8148C12.2294 6.759 12.2903 6.71839 12.3618 6.69284C13.2208 5.4626 14.0948 4.24309 14.9838 3.03431C15.9803 2.98351 16.9763 2.9937 17.9716 3.0648C17.2415 4.10986 16.4997 5.14644 15.746 6.17455C15.5907 6.37943 15.4789 6.60297 15.4106 6.84528C16.4327 6.874 17.4489 6.84351 18.4594 6.75382C19.3672 5.54114 20.2513 4.3115 21.1118 3.0648C21.3425 3.02717 21.5051 3.12876 21.5996 3.36967C21.5056 8.61437 21.3633 13.8583 21.1728 19.1014C21.2709 20.5061 20.651 21.4105 19.313 21.8148C14.0868 21.8751 8.86321 21.8548 3.64229 21.7538C2.82882 21.4688 2.31052 20.9098 2.08741 20.077C1.85929 14.5094 1.69669 8.94022 1.59961 3.36967C1.68252 3.21583 1.7943 3.09388 1.93498 3.00382ZM8.88619 9.52821C9.05516 9.52339 9.21772 9.55388 9.374 9.61967C11.706 10.7495 13.8096 12.2027 15.685 13.9794C15.8882 14.2436 15.8882 14.5079 15.685 14.7721C13.7316 16.6436 11.5162 18.1274 9.03863 19.2233C8.72973 19.191 8.52644 19.0285 8.42888 18.7355C8.38821 15.829 8.38821 12.9225 8.42888 10.016C8.51138 9.78126 8.66382 9.61864 8.88619 9.52821Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
        <div className="justify-start items-start flex">
          <Image src={"images/points.svg"} alt="item" width={16} height={16} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            +1 Point
          </div>
        </div>
      </div>
      <div
        className={`flex px-3 py-1 rounded-3xl border border-[#333333] justify-center items-center gap-2 w-fit ${
          fetchItemChallenge?.data?.isUserHaveItem
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
          !fetchItemChallenge?.data?.isUserHaveItem ||
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
    </div>
  );
}
