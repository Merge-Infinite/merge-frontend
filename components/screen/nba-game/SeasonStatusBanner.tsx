"use client";

import { SeasonInfo } from "@/hooks/useNbaSeasonStatus";

interface SeasonStatusBannerProps {
  seasonInfo: SeasonInfo;
}

export default function SeasonStatusBanner({
  seasonInfo,
}: SeasonStatusBannerProps) {
  return (
    <div className="bg-[#141414] border border-[#292929] rounded-2xl p-3">
      {seasonInfo.status === "pre-season" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-bold font-['Sora'] text-[#858585] uppercase">
            Regular Season Starts In
          </p>
          <div className="flex gap-3 items-center">
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold font-['Sora'] text-white">
                {seasonInfo.daysUntilStart}
              </p>
              <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                days
              </p>
            </div>
            <span className="text-xl font-bold text-[#858585]">:</span>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold font-['Sora'] text-white">
                {String(seasonInfo.hoursUntilStart).padStart(2, "0")}
              </p>
              <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                hrs
              </p>
            </div>
            <span className="text-xl font-bold text-[#858585]">:</span>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold font-['Sora'] text-white">
                {String(seasonInfo.minutesUntilStart).padStart(2, "0")}
              </p>
              <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                min
              </p>
            </div>
            <span className="text-xl font-bold text-[#858585]">:</span>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold font-['Sora'] text-white">
                {String(seasonInfo.secondsUntilStart).padStart(2, "0")}
              </p>
              <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                sec
              </p>
            </div>
          </div>
          <p className="text-xs font-normal font-['Sora'] text-[#858585]">
            {seasonInfo.seasonStartDate?.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {seasonInfo.status === "in-progress" && (
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-sm font-bold font-['Sora'] text-green-500 uppercase">
            Regular Season In Progress
          </p>
        </div>
      )}

      {seasonInfo.status === "ended" && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold font-['Sora'] text-[#858585] uppercase">
            Regular Season Ended
          </p>
          <p className="text-xs font-normal font-['Sora'] text-[#858585]">
            Playoffs and Finals may be underway
          </p>
        </div>
      )}
    </div>
  );
}
