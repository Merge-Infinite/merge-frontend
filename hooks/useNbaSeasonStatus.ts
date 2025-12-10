"use client";

import { useState, useEffect } from "react";

// Get current season dates based on current year
// NBA Regular Season typically runs from late October to mid-April
function getCurrentSeasonDates(): { start: Date; end: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // If we're between January-September, we're in the previous year's season
  // If we're between October-December, we're in the current year's season
  const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;

  return {
    start: new Date(`${seasonStartYear}-10-22T00:00:00`),
    end: new Date(`${seasonStartYear + 1}-04-13T23:59:59`),
  };
}

export type SeasonStatus = "pre-season" | "in-progress" | "ended";

export interface SeasonInfo {
  status: SeasonStatus;
  daysUntilStart?: number;
  hoursUntilStart?: number;
  minutesUntilStart?: number;
  secondsUntilStart?: number;
  seasonStartDate?: Date;
  seasonEndDate?: Date;
}

function getSeasonInfo(): SeasonInfo {
  const now = new Date();
  const { start, end } = getCurrentSeasonDates();

  if (now < start) {
    const diff = start.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      status: "pre-season",
      daysUntilStart: days,
      hoursUntilStart: hours,
      minutesUntilStart: minutes,
      secondsUntilStart: seconds,
      seasonStartDate: start,
    };
  } else if (now <= end) {
    return {
      status: "in-progress",
      seasonEndDate: end,
    };
  } else {
    return {
      status: "ended",
      seasonEndDate: end,
    };
  }
}

interface UseNbaSeasonStatusOptions {
  enabled?: boolean;
}

export function useNbaSeasonStatus(options: UseNbaSeasonStatusOptions = {}) {
  const { enabled = true } = options;
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>(getSeasonInfo);

  useEffect(() => {
    if (!enabled) return;

    const updateSeasonInfo = () => {
      setSeasonInfo(getSeasonInfo());
    };

    // Update immediately
    updateSeasonInfo();

    // Update every second for countdown
    const interval = setInterval(updateSeasonInfo, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  return seasonInfo;
}

export default useNbaSeasonStatus;
