"use client";
import { Button } from "@/components/ui/button";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";
import { useUtils } from "@telegram-apps/sdk-react";
import Image from "next/image";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function SubmitItem() {
  const [backButton] = initBackButton();
  const router = useRouter();
  const { user, refetch } = useUser();
  const utils = useUtils();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);

  console.log(user);

  const claimEnergy = useApi({
    key: ["claim-energy"],
    method: "POST",
    url: "user/claim-referral-energy",
  }).post;

  const onShare = async () => {
    try {
      utils.shareURL(
        `${process.env.NEXT_PUBLIC_TELEGRAM_APP}?startapp=${user?.referralCode}`,
        "Learning by AI with Merge Infinite"
      );
    } catch (error) {
      console.log(error);
    }
  };

  const onCopy = async () => {
    try {
      navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_TELEGRAM_APP}?startapp=${user?.referralCode}`
      );
      toast("Copied to clipboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="self-stretch justify-center items-center gap-2 inline-flex">
        <div className="grow shrink basis-0 text-white text-base font-bold font-['Sora'] leading-normal">
          Friends
        </div>
      </div>
      <div className="self-stretch justify-between items-center inline-flex">
        <div className="justify-start items-start gap-1 flex">
          <Image src="/images/friend.svg" alt="friend" width={24} height={24} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] uppercase leading-normal">
            {user?.friendCount}
          </div>
        </div>
        <div className="justify-start items-center gap-1 flex">
          <Image src="/images/energy.svg" alt="star" width={24} height={24} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            {user?.referralEnergy}
          </div>
          <Button
            disabled={!user?.referralEnergy || claimEnergy?.isPending}
            className="px-3 py-1 bg-[#a668ff] rounded-3xl justify-center items-center gap-2 flex"
            onClick={async () => {
              await claimEnergy?.mutateAsync({});
              await refetch?.();
            }}
            isLoading={claimEnergy?.isPending}
          >
            <div className="text-center text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
              Claim
            </div>
          </Button>
        </div>
      </div>
      <div className="self-stretch">
        <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
          You will receive{" "}
        </span>
        <span className="text-[#68ffd1] text-sm font-normal font-['Sora'] leading-normal">
          10
        </span>
        <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
          {" "}
          energy each time you invite a friend to join the Game.
        </span>
      </div>
      <div className="self-stretch justify-start items-start gap-2 inline-flex">
        <Button
          onClick={onShare}
          className="grow shrink basis-0 h-8 px-3 py-1 bg-[#a668ff] rounded-3xl justify-center items-center gap-2 flex"
        >
          <div className="text-center text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
            Invite Friends
          </div>
        </Button>
        <Button
          onClick={onCopy}
          className="grow shrink basis-0 h-8 px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 flex"
        >
          <div className="text-black text-xs font-normal font-['Sora'] uppercase leading-normal">
            Copy Link
          </div>
        </Button>
      </div>
    </div>
  );
}
