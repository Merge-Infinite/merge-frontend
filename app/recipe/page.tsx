"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import ElementItem from "@/components/common/ElementItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAdsgram from "@/hooks/useAdsgram";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { Loader2, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export default function Home() {
  const [backButton] = initBackButton();
  const router = useRouter();
  const { user } = useUser();
  const [item, setItem] = useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);

  const getUserBagApi = useApi({
    key: ["getUserBag"],
    method: "GET",
    url: "user/mybags",
  }).get;

  useEffect(() => {
    getUserBagApi?.refetch();
  }, []);

  const showAd = useAdsgram({
    blockId: "9126",
    onReward: () => {
      router.push(`/recipe-detail?id=${item.itemId}`);
    },
    onError: (e: any) => {
      toast.error(e?.description || "Error");
    },
  });

  const shouldDisable = useMemo(() => {
    return (
      user?.userBalance?.subscriptionEndDate &&
      new Date(user?.userBalance?.subscriptionEndDate) > new Date()
    );
  }, [user?.userBalance?.subscriptionEndDate]);

  return (
    <div className="flex flex-col items-center  h-full">
      <div className="w-full p-4 inline-flex flex-col justify-start items-start gap-2">
        <div className="w-full rounded-[32px] inline-flex flex-col justify-start items-start gap-1">
          <div className="self-stretch px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-start items-start gap-4">
            <SearchIcon className="w-5 h-5 text-white" />
            <Input className="inline-flex h-5 flex-col justify-start items-start overflow-hidden text-white ring-0 px-0 border-none" />
          </div>
        </div>
        <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
          1.Find the recipe for anything you want.
          <br />
          2.Skip the video to get the recipe:
        </div>
        <Button
          className=" bg-[#a668ff] rounded-3xl inline-flex justify-center items-center gap-2 w-fit"
          disabled={shouldDisable}
          onClick={() => {
            dispatch(updateTabMode(TabMode.SHOP));
            router.push("/");
          }}
        >
          <Image
            src="/images/vip.svg"
            alt="subscription"
            width={24}
            height={24}
          />
          <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
            Subscription
          </div>
        </Button>
        <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
          Recipe:
        </div>
        <div className="self-stretch inline-flex justify-start items-center gap-2 flex-wrap content-center">
          {getUserBagApi?.isPending ? (
            <div className="flex flex-col items-center justify-center w-full h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#68ffd1] mb-2" />
              <p className="text-gray-400">Loading inventory...</p>
            </div>
          ) : getUserBagApi?.data && getUserBagApi?.data?.length > 0 ? (
            <div className="flex flex-wrap gap-2 w-full">
              {getUserBagApi?.data?.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setItem(item);
                    if (!shouldDisable) {
                      showAd();
                    } else {
                      router.push(`/recipe-detail?id=${item.itemId}`);
                    }
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <ElementItem {...item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-64">
              <p className="text-gray-400">No recipe found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
