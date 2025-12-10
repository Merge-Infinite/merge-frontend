"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchScoreboard,
  fetchScoreboardDate,
  formatDateForApi,
  TransformedGame,
} from "@/lib/api/nba-games";

interface UseNbaGamesOptions {
  date?: Date;
  refetchInterval?: number;
  enabled?: boolean;
}

export function useNbaGames(options: UseNbaGamesOptions = {}) {
  const { date, refetchInterval = 30000, enabled = true } = options;

  // Create a stable date key for the query
  const dateKey = date ? formatDateForApi(date) : "today";

  return useQuery<TransformedGame[], Error>({
    queryKey: ["nba", "games", dateKey],
    queryFn: () => fetchScoreboard(date),
    refetchInterval,
    enabled,
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useNbaScoreboardDate() {
  return useQuery<string, Error>({
    queryKey: ["nba", "scoreboard", "date"],
    queryFn: fetchScoreboardDate,
    staleTime: 60000, // Check date once per minute
  });
}

export default useNbaGames;
