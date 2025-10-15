"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Pool } from "@/hooks/usePool";
import { useRouter } from "next/navigation";
import React from "react";
import Emoji from "./common/Emoji";

interface RecipeItem {
  id: number;
  handle: string;
  emoji: string;
  isNew: boolean;
  explore: number;
  reward: number;
  mask: number;
  dep: null | number;
  freq: number;
  isBasic: boolean;
}

interface PoolInfoSheetProps {
  pool: Pool | null;
  poolRequiredItems: RecipeItem[];
  children?: React.ReactNode;
}

export const PoolInfoSheet: React.FC<PoolInfoSheetProps> = ({
  pool,
  poolRequiredItems,
  children,
}) => {
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children ? (
          children
        ) : (
          <div className="flex justify-start items-center gap-1 cursor-pointer">
            <div className="justify-start text-white text-sm font-normal font-sora underline leading-normal">
              Pool information
            </div>
            <div className="w-6 h-6 relative overflow-hidden">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="white" opacity="0.95" />
                <text
                  x="12"
                  y="16"
                  textAnchor="middle"
                  fill="#141414"
                  fontSize="14"
                  fontWeight="bold"
                >
                  i
                </text>
              </svg>
            </div>
          </div>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-[#141414] rounded-t-3xl border-0"
      >
        <div className="pb-8 inline-flex flex-col justify-start items-center gap-4 w-full">
          <SheetHeader className="self-stretch px-4">
            <SheetTitle className="text-white text-sm font-semibold font-sora uppercase leading-normal tracking-wide">
              Pool Information
            </SheetTitle>
          </SheetHeader>

          <div className="self-stretch px-4 pb-2 flex flex-col justify-start items-start gap-4">
            <div className="self-stretch flex flex-col justify-start items-start gap-2">
              <div className="self-stretch inline-flex justify-start items-center gap-1">
                <div className="w-20 justify-start text-[#858585] text-sm font-normal font-sora leading-normal">
                  Pool Name:
                </div>
                <div className="justify-start text-white text-sm font-bold font-sora leading-normal">
                  {pool?.name || "Vietnam Independence Day Pool"}
                </div>
              </div>
              <div className="self-stretch inline-flex justify-start items-center gap-1">
                <div className="w-20 justify-start text-[#858585] text-sm font-normal font-sora leading-normal">
                  Start date:
                </div>
                <div className="justify-start text-white text-sm font-bold font-sora leading-normal">
                  {pool?.startTime
                    ? new Date(pool.startTime).toLocaleString()
                    : "10:00 - 25 Aug, 2025"}
                </div>
              </div>
              <div className="self-stretch inline-flex justify-start items-center gap-1">
                <div className="w-20 justify-start text-[#858585] text-sm font-normal font-sora leading-normal">
                  End date:
                </div>
                <div className="justify-start text-white text-sm font-bold font-sora leading-normal">
                  {pool?.endTime
                    ? new Date(pool.endTime).toLocaleString()
                    : "23:59 - 30 Aug, 2025"}
                </div>
              </div>
            </div>
            <div className="self-stretch justify-start text-[#858585] text-sm font-normal font-sora leading-normal">
              {pool?.description || ""}
            </div>
          </div>

          <div className="self-stretch h-px bg-[#292929]" />

          <div className="self-stretch px-4 pb-2 flex flex-col justify-start items-start gap-4">
            <div className="justify-start text-white text-sm font-semibold font-sora uppercase leading-normal tracking-wide">
              Pool Requirement
            </div>

            <div className="self-stretch inline-flex justify-start items-start gap-2.5 flex-wrap content-start">
              {poolRequiredItems.length > 0 ? (
                poolRequiredItems.map((item) => (
                  <>
                    <div className="self-stretch justify-start text-[#858585] text-sm font-normal font-sora leading-normal">
                      Your NFT must include the following elements to be
                      eligible for staking
                    </div>

                    <div
                      key={item.id}
                      className="px-3 py-1 rounded-3xl outline outline-1 outline-offset-[-1px] outline-[#292929] flex justify-center items-center gap-2"
                    >
                      <div className="justify-start text-white text-xs font-normal font-sora uppercase leading-normal">
                        <Emoji emoji={item.emoji} size={18} /> {item.handle} (1)
                      </div>
                    </div>
                  </>
                ))
              ) : (
                // Fallback to static content if no API data
                <div className="self-stretch justify-start">
                  <span className="text-[#858585] text-sm font-normal font-['Sora'] leading-normal">
                    Your NFT must include{" "}
                  </span>
                  <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
                    any
                  </span>
                  <span className="text-[#858585] text-sm font-normal font-['Sora'] leading-normal">
                    {" "}
                  </span>
                  <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
                    3 elements
                  </span>
                  <span className="text-[#858585] text-sm font-normal font-['Sora'] leading-normal">
                    {" "}
                    to be eligible for staking.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="self-stretch px-4 pb-2 flex flex-col justify-start items-start gap-2">
            <Button
              onClick={() => router.push("/creative")}
              className="self-stretch px-4 py-2 bg-[#a668ff] hover:bg-[#9555ee] rounded-3xl inline-flex justify-center items-center gap-2"
            >
              <span className="justify-start text-white text-sm font-normal font-sora uppercase leading-normal">
                Create NFT
              </span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5.5 12H18.5" stroke="white" strokeWidth="1.5" />
                <path
                  d="M13.5 7.5L18 12L13.5 16.5"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
