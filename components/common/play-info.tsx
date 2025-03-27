"use client";

import useAdsgram from "@/hooks/useAdsgram";
import { useUser } from "@/hooks/useUser";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "../ui/button";
interface GamePlayInfoProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

export default function GamePlayInfo({}: GamePlayInfoProps) {
  const { user } = useUser();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const onReward = useCallback(async () => {
    toast.success("Rewarded");
  }, []);

  const onError = useCallback((result: any) => {
    toast.error(result?.description || "Error");
  }, []);

  const showAd = useAdsgram({
    blockId: "9126",
    onReward,
    onError,
  });

  return (
    <div className="w-full justify-between items-center inline-flex p-4">
      <div className="justify-start items-center gap-2 flex">
        <div className="p-2 rounded-3xl border border-[#1f1f1f] justify-start items-center gap-2 flex">
          <div className="justify-start items-center flex">
            <Image
              src="/images/energy.svg"
              alt="explore"
              width={24}
              height={24}
            />
            <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
              {user?.userBalance?.energyBalance.toLocaleString()}/48
            </div>
          </div>
          <Image
            src="/images/plus.svg"
            alt="explore"
            width={32}
            height={32}
            onClick={() => {
              dispatch(updateTabMode(TabMode.HOME));
              router.back();
            }}
          />
        </div>
        <Button
          className="p-2 rounded-3xl border border-[#1f1f1f] justify-start items-center gap-2 flex w-fit bg-transparent"
          size="default"
          onClick={showAd}
        >
          <div className="justify-start items-center flex">
            <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
              +5
            </div>
            <Image
              src="/images/energy.svg"
              alt="explore"
              width={24}
              height={24}
            />
          </div>
          <Image src="/images/ad.svg" alt="explore" width={24} height={24} />
        </Button>
      </div>
      <Image
        src="/images/recipe.svg"
        onClick={() => {
          router.push("/recipe");
        }}
        alt="explore"
        width={24}
        height={24}
      />
    </div>
  );
}
