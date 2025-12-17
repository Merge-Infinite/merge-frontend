"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowLeft, Calendar, Close, Dropdown } from "@/components/icons";
import { useState, useMemo } from "react";
import { useNbaGames } from "@/hooks/useNbaGames";
import { useNbaSeasonStatus } from "@/hooks/useNbaSeasonStatus";
import { TransformedGame, GameStatus } from "@/lib/api/nba-games";
import { NBA_TEAMS_BY_TIER } from "@/data/nba-teams";
import SeasonStatusBanner from "./SeasonStatusBanner";
import Image from "next/image";

// Create a map of tricode to logo path
const TEAM_LOGO_MAP: Record<string, string> = {};
NBA_TEAMS_BY_TIER.forEach((tier) => {
  tier.teams.forEach((team) => {
    TEAM_LOGO_MAP[team.teamId] = `/images/tiers/team-logos/${team.logo}`;
  });
});

interface SeasonMatchesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

// Generate days of the week centered around today
function generateWeekDays(centerDate: Date = new Date()) {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  // Start from 3 days ago
  for (let i = -3; i <= 3; i++) {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + i);
    days.push({
      day: dayNames[date.getDay()],
      date: date.getDate(),
      fullDate: new Date(date),
      isToday: isSameDay(date, today),
    });
  }

  return days;
}

// Get current month/year string
function getMonthYearString(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Get team logo path or null
function getTeamLogo(tricode: string): string | null {
  return TEAM_LOGO_MAP[tricode] || null;
}

// Generate month options for picker (6 months back, 6 months forward)
function generateMonthOptions(): { value: string; label: string; date: Date }[] {
  const options = [];
  const today = new Date();

  for (let i = -6; i <= 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ value, label, date });
  }

  return options;
}

// Game status display helper
function getGameStatusDisplay(game: TransformedGame): {
  primary: string;
  secondary: string;
} {
  if (game.gameStatus === GameStatus.SCHEDULED) {
    return { primary: game.date, secondary: game.time };
  } else if (game.gameStatus === GameStatus.IN_PROGRESS) {
    return {
      primary: `Q${game.period}`,
      secondary: game.gameClock || "LIVE",
    };
  } else {
    return {
      primary: `${game.homeScore} - ${game.awayScore}`,
      secondary: "FINAL",
    };
  }
}

export default function SeasonMatchesSheet({
  open,
  onOpenChange,
}: SeasonMatchesSheetProps) {
  const [selectedDay, setSelectedDay] = useState(3); // Default to today (center of week)
  const [weekOffset, setWeekOffset] = useState(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Season status with live countdown
  const seasonInfo = useNbaSeasonStatus({ enabled: open });

  // Month options for picker
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  // Generate week days based on current offset
  const daysOfWeek = useMemo(() => {
    const centerDate = new Date();
    centerDate.setDate(centerDate.getDate() + weekOffset * 7);
    return generateWeekDays(centerDate);
  }, [weekOffset]);

  // Get the selected date based on selectedDay and weekOffset
  const selectedDate = useMemo(() => {
    return daysOfWeek[selectedDay]?.fullDate;
  }, [daysOfWeek, selectedDay]);

  // Fetch NBA games for selected date - only enabled when sheet is open
  const { data: games, isLoading, isError, refetch } = useNbaGames({
    date: selectedDate,
    enabled: open,
    refetchInterval: 30000, // Refresh every 30 seconds for live scores
  });

  // Current month/year display
  const monthYearDisplay = useMemo(() => {
    const centerDate = new Date();
    centerDate.setDate(centerDate.getDate() + weekOffset * 7);
    return getMonthYearString(centerDate);
  }, [weekOffset]);

  // Navigate weeks
  const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => prev + 1);

  // Handle month selection
  const handleMonthSelect = (monthDate: Date) => {
    const today = new Date();
    const diffInDays = Math.floor(
      (monthDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weekDiff = Math.floor(diffInDays / 7);
    setWeekOffset(weekDiff);
    setSelectedDay(3); // Reset to center of week
    setShowMonthPicker(false);
  };

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
          <div className="bg-[#141414] border border-[#292929] rounded-2xl p-3 sticky top-0 z-10 relative">
            {/* Month */}
            <div className="flex items-center justify-center px-1 py-0 relative mb-2">
              <p className="text-xs font-bold font-['Sora'] text-[#858585] uppercase">
                {monthYearDisplay}
              </p>
              <div className="absolute right-1 flex gap-2 items-center">
                <Calendar size={24} color="white" />
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center justify-center"
                >
                  <Dropdown
                    size={16}
                    color="white"
                    className={`transition-transform duration-200 ${showMonthPicker ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>

            {/* Month Picker Dropdown */}
            {showMonthPicker && (
              <div className="absolute left-4 right-4 top-14 bg-[#1f1f1f] border border-[#292929] rounded-xl max-h-48 overflow-y-auto z-20 shadow-lg">
                {monthOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMonthSelect(option.date)}
                    className={`w-full px-4 py-2 text-left text-sm font-['Sora'] hover:bg-[#292929] transition-colors ${
                      option.label === monthYearDisplay
                        ? "text-[#9447ff] bg-[#9447ff]/10"
                        : "text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* Days */}
            <div className="flex items-center justify-center w-full">
              <button
                onClick={goToPreviousWeek}
                className="flex items-center justify-center w-6 h-full"
              >
                <ArrowLeft size={20} color="white" />
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
                    } ${item.isToday ? "bg-[#9447ff]/10 rounded-t-lg" : ""}`}
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

              <button
                onClick={goToNextWeek}
                className="flex items-center justify-center w-6 h-full"
              >
                <div className="rotate-180">
                  <ArrowLeft size={20} color="white" />
                </div>
              </button>
            </div>
          </div>

          {/* Season Status Banner */}
          <SeasonStatusBanner seasonInfo={seasonInfo} />

          {/* Games List */}
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-4">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9447ff]"></div>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <p className="text-sm text-[#858585]">Failed to load games</p>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-[#9447ff] rounded-lg text-white text-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && (!games || games.length === 0) && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-[#858585]">No games scheduled</p>
              </div>
            )}

            {/* Games */}
            {games?.map((game) => {
              const statusDisplay = getGameStatusDisplay(game);
              const homeLogo = getTeamLogo(game.homeTricode);
              const awayLogo = getTeamLogo(game.awayTricode);

              return (
                <div
                  key={game.id}
                  className="bg-[#1f1f1f] rounded-2xl px-4 py-3 flex gap-2.5 items-center"
                >
                  {/* Home Team */}
                  <div className="flex-1 flex flex-col gap-1 items-center">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {homeLogo ? (
                        <Image
                          src={homeLogo}
                          alt={game.homeTeam}
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {game.homeTricode}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-normal font-['Sora'] text-white text-center">
                        {game.homeTeam}
                      </p>
                      <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                        {game.homeRecord}
                      </p>
                      {game.gameStatus !== GameStatus.SCHEDULED && (
                        <p className="text-lg font-bold font-['Sora'] text-white">
                          {game.homeScore}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status / Time */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-xs font-normal font-['Sora'] text-white">
                      {statusDisplay.primary}
                    </p>
                    <p
                      className={`text-sm font-bold font-['Sora'] uppercase ${
                        game.gameStatus === GameStatus.IN_PROGRESS
                          ? "text-[#9447ff]"
                          : "text-white"
                      }`}
                    >
                      {statusDisplay.secondary}
                    </p>
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex flex-col gap-1 items-center">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {awayLogo ? (
                        <Image
                          src={awayLogo}
                          alt={game.awayTeam}
                          width={32}
                          height={32}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {game.awayTricode}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-normal font-['Sora'] text-white text-center">
                        {game.awayTeam}
                      </p>
                      <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                        {game.awayRecord}
                      </p>
                      {game.gameStatus !== GameStatus.SCHEDULED && (
                        <p className="text-lg font-bold font-['Sora'] text-white">
                          {game.awayScore}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
