"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Close, Question, VIP, Dot, M3RToken } from "@/components/icons";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface LuckyRateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const bonusData = [
  {
    source: "Base rate",
    bonus: "16.66%",
    status: "Active",
  },
  {
    source: "Subscription (3mo)",
    bonus: "+12%",
    status: "Active",
  },
  {
    source: "M3R holding (72,000 M3R)",
    bonus: "+36%",
    status: "Active",
  },
];

export default function LuckyRateSheet({
  open,
  onOpenChange,
}: LuckyRateSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showClose={false} className="h-[80vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 h-11">
          <p className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
            Lucky rate
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center"
          >
            <Close size={24} color="#858585" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-4 pt-3 h-[calc(100%-44px)] overflow-y-auto">
          {/* Stats Section */}
          <div className="flex flex-col gap-4">
            {/* Lucky Rate Header */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 items-center justify-between w-full">
                <div className="flex gap-0.5 items-center">
                  <p className="text-sm font-normal font-['Sora'] text-white">
                    Your lucky rate:
                  </p>
                  <button className="flex items-center justify-center">
                    <Question size={20} color="white" />
                  </button>
                </div>
                <p className="text-sm font-bold font-['Sora'] text-white">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    64%
                  </span>{" "}
                  total bonus
                </p>
              </div>

              {/* Progress Bar */}
              <div className="bg-[#292929] p-1.5 rounded-full w-full">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"
                  style={{ width: "64%" }}
                />
              </div>
            </div>

            {/* Table */}
            <div className="border border-[#292929] rounded-2xl overflow-hidden">
              {/* Header Row */}
              <div className="flex items-center h-9 border-b border-[#292929]">
                <div className="flex-1 px-2 py-1">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    Source
                  </p>
                </div>
                <div className="w-21 px-2 py-1">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    Bonus
                  </p>
                </div>
                <div className="w-[90px] px-2 py-1">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    Status
                  </p>
                </div>
              </div>

              {/* Data Rows */}
              {bonusData.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center h-11 ${
                    index !== bonusData.length - 1
                      ? "border-b border-[#292929]"
                      : ""
                  }`}
                >
                  <div className="flex-1 px-2 py-1">
                    <p className="text-xs font-normal font-['Sora'] text-white">
                      {item.source}
                    </p>
                  </div>
                  <div className="w-21 px-2 py-1">
                    <p className="text-xs font-normal font-['Sora'] text-white">
                      {item.bonus}
                    </p>
                  </div>
                  <div className="w-[90px] px-2 py-1 flex gap-1 items-center">
                    <Dot size={9} color="#00DBB6" />
                    <p className="text-xs font-normal font-['Sora'] text-white">
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Text */}
            <div className="text-sm font-normal font-['Sora'] text-white">
              <p>Total Lucky Rate: 64%</p>
              <p>Max Lucky achievable: 100%</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#292929] w-full" />

          {/* How to Increase Section */}
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
              How to Increase Your Lucky Rate
            </p>

            <div className="bg-black border border-[#292929] rounded-2xl p-2">
              <div className="flex flex-col gap-2">
                {/* Subscribe Card */}
                <div className="bg-[#141414] rounded-xl pl-3 pr-4 py-4 flex flex-col gap-3">
                  <div className="flex gap-3 items-start">
                    <VIP size={32} color="#A768FF" />
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                        Subscribe
                      </p>
                      <p className="text-sm font-normal font-['Sora'] text-white">
                        Earn{" "}
                        <span className="text-[#68ffd1]">+4%</span> Lucky for
                        every month subscribed
                      </p>
                      <Button className="bg-[#a768ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-fit px-3 py-1 h-auto">
                        <span className="text-xs font-normal font-['Sora'] uppercase">
                          Subscribe Now
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Hold M3R Tokens Card */}
                <div className="bg-[#141414] rounded-xl pl-3 pr-4 py-4 flex flex-col gap-3">
                  <div className="flex gap-3 items-start">
                    <M3RToken size={32} />
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                        Hold M3R Tokens
                      </p>
                      <p className="text-sm font-normal font-['Sora'] text-white">
                        Every 2,000 M3R adds{" "}
                        <span className="text-[#68ffd1]">+1%</span> Lucky
                      </p>
                      <Button className="bg-[#a768ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-fit px-3 py-1 h-auto">
                        <span className="text-xs font-normal font-['Sora'] uppercase">
                          Stake to earn
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Have an account Hibt Card */}
                <div className="bg-[#141414] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 overflow-clip shrink-0 rounded-full flex items-center justify-center relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px]">
                        <Image
                          src="/images/hibt-logo.png"
                          alt="Hibt"
                          width={38}
                          height={38}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                        Have an account Hibt
                      </p>
                      <p className="text-sm font-normal font-['Sora'] text-white">
                        adds <span className="text-[#68ffd1]">+1%</span> Lucky
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 rounded-[32px]">
                    <Input
                      placeholder="Enter your Hibt account"
                      className="bg-[#141414] border border-[#333333] rounded-full px-3 py-2 text-sm font-['Sora'] text-white placeholder:text-[#5c5c5c] h-auto"
                    />
                  </div>

                  <Button className="bg-[#a768ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-full px-3 py-1 h-auto">
                    <span className="text-xs font-normal font-['Sora'] uppercase">
                      Verify
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
