"use client";

import { suiClient } from "@/lib/utils";
import { NBA_REWARD_POOL_ID } from "@/utils/constants";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useCallback, useEffect, useState } from "react";

export interface NbaPoolData {
  totalRewardSui: number;
  totalRewardUsd: number;
  balanceMist: string;
}

interface UseNbaPoolOptions {
  refreshInterval?: number;
  enabled?: boolean;
  suiPrice?: number;
}

// Default SUI price fallback
const DEFAULT_SUI_PRICE_USD = 2;

export function useNbaPool(options: UseNbaPoolOptions = {}) {
  const { refreshInterval = 30000, enabled = true, suiPrice = DEFAULT_SUI_PRICE_USD } = options;

  const [poolData, setPoolData] = useState<NbaPoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPoolData = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch the pool object from the blockchain
      const response = await suiClient.getObject({
        id: NBA_REWARD_POOL_ID,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (!response.data) {
        throw new Error("Pool object not found");
      }

      // Extract balance from the pool object content
      // RewardPool struct has: balance: Balance<SUI>
      const content = response.data.content;
      let balanceMist = "0";

      if (content && content.dataType === "moveObject") {
        const fields = content.fields as Record<string, unknown>;
        // Balance<SUI> is stored as a u64 value in the balance field
        if (fields.balance !== undefined) {
          balanceMist = String(fields.balance);
        }
      }


      // Convert MIST to SUI
      const balanceSui = Number(balanceMist) / Number(MIST_PER_SUI);
      const balanceUsd = balanceSui * suiPrice;

      setPoolData({
        totalRewardSui: balanceSui,
        totalRewardUsd: balanceUsd,
        balanceMist,
      });
    } catch (err) {
      console.error("Error fetching NBA pool data:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch pool data"));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, suiPrice]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchPoolData();
    }
  }, [enabled, fetchPoolData]);

  // Set up auto-refresh
  useEffect(() => {
    if (!enabled || !refreshInterval) return;

    const intervalId = setInterval(fetchPoolData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [enabled, refreshInterval, fetchPoolData]);

  return {
    poolData,
    isLoading,
    error,
    refetch: fetchPoolData,
  };
}

export default useNbaPool;
