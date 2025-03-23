"use client";

import { useUser } from "@/hooks/useUser";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
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
  return (
    <div className="w-full justify-between items-center inline-flex">
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
              {user?.userBalance?.energyBalance.toLocaleString()}
            </div>
          </div>
          <Image
            src="/images/plus.svg"
            alt="explore"
            width={32}
            height={32}
            onClick={() => {
              dispatch(updateTabMode(TabMode.SHOP));
              router.back();
            }}
          />
        </div>
        <div className="p-2 rounded-3xl border border-[#1f1f1f] justify-start items-center gap-2 flex">
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
        </div>
      </div>
      <Image src="/images/recipe.svg" alt="explore" width={24} height={24} />
    </div>
  );
}
