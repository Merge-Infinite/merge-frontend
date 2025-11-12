"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowLeft, Calendar, Close } from "@/components/icons";
import { useState } from "react";

interface SeasonMatchesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock game data
const mockGames = [
  {
    id: 1,
    homeTeam: "Timberwolves",
    homeRecord: "3-3",
    awayTeam: "Nets",
    awayRecord: "0-6",
    date: "Tue 4 Nov",
    time: "7:00 AM GMT",
  },
  {
    id: 2,
    homeTeam: "Bucks",
    homeRecord: "4-2",
    awayTeam: "Pacers",
    awayRecord: "1-5",
    date: "Tue 4 Nov",
    time: "7:00 AM GMT",
  },
  {
    id: 3,
    homeTeam: "Jazz",
    homeRecord: "2-4",
    awayTeam: "Celtics",
    awayRecord: "3-4",
    date: "Tue 4 Nov",
    time: "7:00 AM GMT",
  },
  {
    id: 4,
    homeTeam: "Wizards",
    homeRecord: "1-5",
    awayTeam: "Knicks",
    awayRecord: "3-3",
    date: "Tue 4 Nov",
    time: "7:00 AM GMT",
  },
  {
    id: 5,
    homeTeam: "Mavericks",
    homeRecord: "2-4",
    awayTeam: "Rockets",
    awayRecord: "3-2",
    date: "Tue 4 Nov",
    time: "7:00 AM GMT",
  },
  {
    id: 6,
    homeTeam: "Pistons",
    homeRecord: "4-2",
    awayTeam: "Grizzlies",
    awayRecord: "3-4",
    date: "Tue 4 Nov",
    time: "7:00 AM GMT",
  },
];

const daysOfWeek = [
  { day: "Sun", date: 2 },
  { day: "Mon", date: 3 },
  { day: "Tue", date: 4 },
  { day: "Web", date: 5 },
  { day: "Thu", date: 6 },
  { day: "Fri", date: 7 },
  { day: "Sat", date: 8 },
];

export default function SeasonMatchesSheet({
  open,
  onOpenChange,
}: SeasonMatchesSheetProps) {
  const [selectedDay, setSelectedDay] = useState(0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showClose={false} className="h-[80vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 h-11">
          <p className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
            NBA Games & Scores
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center"
          >
            <Close size={24} color="#858585" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 px-4 pt-3 h-[calc(100%-44px)] overflow-hidden">
          {/* Calendar Selector */}
          <div className="bg-[#141414] border border-[#292929] rounded-2xl p-3 sticky top-0 z-10">
            {/* Month */}
            <div className="flex items-center justify-center px-1 py-0 relative mb-2">
              <p className="text-xs font-bold font-['Sora'] text-[#858585] uppercase">
                November 2025
              </p>
              <div className="absolute right-1 flex gap-2 items-center">
                <Calendar size={24} color="white" />
                <button className="flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Days */}
            <div className="flex items-center justify-center w-full">
              <button className="flex items-center justify-center w-6 h-full">
                <div className="rotate-180">
                  <ArrowLeft size={20} color="white" />
                </div>
              </button>

              <div className="flex-1 flex gap-1 items-center">
                {daysOfWeek.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDay(index)}
                    className={`flex-1 flex flex-col items-center justify-center pb-1 ${
                      selectedDay === index
                        ? "border-b-2 border-[#9447ff]"
                        : ""
                    }`}
                  >
                    <p className="text-sm font-normal font-['Sora'] text-white">
                      {item.day}
                    </p>
                    <p className="text-lg font-bold font-['Sora'] text-white">
                      {item.date}
                    </p>
                  </button>
                ))}
              </div>

              <button className="flex items-center justify-center w-6 h-full">
                <ArrowLeft size={20} color="white" />
              </button>
            </div>
          </div>

          {/* Games List */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-4">
            {mockGames.map((game) => (
              <div
                key={game.id}
                className="bg-[#1f1f1f] rounded-2xl px-4 py-3 flex gap-2.5 items-center"
              >
                {/* Home Team */}
                <div className="flex-1 flex flex-col gap-1 items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {game.homeTeam.substring(0, 2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-normal font-['Sora'] text-white text-center">
                      {game.homeTeam}
                    </p>
                    <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                      {game.homeRecord}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="text-xs font-normal font-['Sora'] text-white">
                    {game.date}
                  </p>
                  <p className="text-sm font-bold font-['Sora'] text-white uppercase">
                    {game.time}
                  </p>
                </div>

                {/* Away Team */}
                <div className="flex-1 flex flex-col gap-1 items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {game.awayTeam.substring(0, 2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-normal font-['Sora'] text-white text-center">
                      {game.awayTeam}
                    </p>
                    <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                      {game.awayRecord}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
