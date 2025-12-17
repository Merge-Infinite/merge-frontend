"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import Image from "next/image";

// Reward distribution table data
const REWARD_DISTRIBUTION = [
  { rank: "#1", share: "40%", color: "#68ffd1" },
  { rank: "#2", share: "25%", color: "#a768ff" },
  { rank: "#3", share: "15%", color: "#ffc400" },
  { rank: "#4", share: "10%", color: "#ffffff" },
  { rank: "#5", share: "5%", color: "#ffffff" },
  { rank: "#6", share: "3%", color: "#ffffff" },
  { rank: "#7", share: "2%", color: "#ffffff" },
];

interface NFTValueEstimatorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: {
    name: string;
    logoUrl?: string | null;
    logo?: string;
    totalMinted: number;
    supplyLimit: number;
  } | null;
  totalRewardPool: number;
}

export default function NFTValueEstimatorSheet({
  open,
  onOpenChange,
  team,
  totalRewardPool,
}: NFTValueEstimatorSheetProps) {
  if (!team) return null;

  // Calculate estimated values per NFT for each rank position
  const calculateEstimatedValue = (sharePercent: number) => {
    const teamShare = (totalRewardPool * sharePercent) / 100;
    const mintedCount = team.totalMinted || 1; // Avoid division by zero
    return Math.round(teamShare / mintedCount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showClose={false}
        className="bg-transparent border-0 p-0 px-6"
      >
        <div className="bg-[#1f1f1f] border border-[#292929] rounded-2xl p-4 flex flex-col gap-4">
          {/* Title */}
          <p className="text-base font-semibold font-['Sora'] text-white text-center uppercase tracking-wider">
            NFT Value Estimator
          </p>

          {/* Body */}
          <div className="flex flex-col gap-3">
            {/* Team Card */}
            <div className="bg-[rgba(136,136,136,0.08)] border border-[rgba(255,255,255,0.06)] rounded-2xl flex flex-col gap-1 overflow-hidden">
              {/* Team Header */}
              <div className="flex items-center gap-2 pl-3 pr-2 py-1">
                {/* Team Logo */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                  {team.logoUrl || team.logo ? (
                    <Image
                      src={team.logoUrl || `/images/tiers/team-logos/${team.logo}`}
                      alt={team.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <span className="text-3xl">🏀</span>
                  )}
                </div>
                {/* Team Name */}
                <p className="text-sm font-bold font-['Sora'] text-white flex-1">
                  {team.name}
                </p>
              </div>

              {/* Stats Row */}
              <div className="bg-[rgba(136,136,136,0.08)] flex gap-1 items-center justify-center px-3 py-1 rounded-xl">
                <div className="flex flex-col items-start flex-1">
                  <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                    Total reward pool
                  </p>
                  <p className="text-sm font-bold font-['Sora'] text-white">
                    {totalRewardPool.toLocaleString()} SUI
                  </p>
                </div>
                <div className="flex flex-col items-start flex-1 max-w-[120px]">
                  <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                    NFT Minted
                  </p>
                  <p className="text-sm font-bold font-['Sora'] text-white">
                    {team.totalMinted}/{team.supplyLimit}
                  </p>
                </div>
              </div>
            </div>

            {/* Reward Distribution Table */}
            <div className="bg-[rgba(136,136,136,0.08)] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-1 flex flex-col gap-0.5">
              {/* Table Header */}
              <div className="flex items-center h-8 border-b border-[#292929]">
                <div className="w-9 flex items-center justify-center px-2 py-1">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    #
                  </p>
                </div>
                <div className="flex-1 px-2 py-1">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    Reward share
                  </p>
                </div>
                <div className="flex-1 px-2 py-1">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    Est. Value/NFT
                  </p>
                </div>
              </div>

              {/* Table Rows */}
              {REWARD_DISTRIBUTION.map((item, index) => {
                const sharePercent = parseInt(item.share);
                const estimatedValue = calculateEstimatedValue(sharePercent);
                const isLast = index === REWARD_DISTRIBUTION.length - 1;

                return (
                  <div
                    key={item.rank}
                    className={`flex items-center h-8 ${
                      !isLast ? "border-b border-[#333333]" : ""
                    }`}
                  >
                    <div className="w-9 flex items-center justify-center px-2 py-1">
                      <p
                        className="text-xs font-normal font-['Sora']"
                        style={{ color: item.color }}
                      >
                        {item.rank}
                      </p>
                    </div>
                    <div className="flex-1 px-2 py-1">
                      <p
                        className="text-xs font-normal font-['Sora']"
                        style={{ color: item.color }}
                      >
                        {item.share}
                      </p>
                    </div>
                    <div className="flex-1 px-2 py-1">
                      <p
                        className="text-xs font-bold font-['Sora']"
                        style={{ color: item.color }}
                      >
                        {estimatedValue.toLocaleString()} SUI
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer Text */}
            <p className="text-xs font-normal font-['Sora'] text-[#858585]">
              Estimated values based on the team's projected rank, the total
              reward pool, and how many NFTs have been minted for that team.
            </p>
          </div>

          {/* Understood Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="h-10 w-full bg-white border border-[#333333] rounded-3xl flex items-center justify-center"
          >
            <p className="text-sm font-semibold font-['Sora'] text-black uppercase tracking-wider">
              Understood
            </p>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
