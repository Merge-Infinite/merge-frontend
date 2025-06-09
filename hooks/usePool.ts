import { suiClient } from "@/lib/utils";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import { MER3_PACKAGE_ID, POOL_SYSTEM } from "@/utils/constants";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// Types based on your Move contract
export interface Pool {
  id: string;
  poolId: string;
  name: string;
  description: string;
  creator: string;
  imageUrl: string;
  requiredElements: number[];
  startTime: number;
  endTime: number;
  isActive: boolean;
  participantCount: number;
  totalStakedCount: number;
  suiRewards: number;
}

export interface PoolOverview {
  poolId: string;
  totalPrize: number;
  daysRemaining: number;
  hoursRemaining: number;
  participantCount: number;
  totalStakedCount: number;
  isActive: boolean;
}

interface UsePoolSystemOptions {
  network?: "mainnet" | "testnet" | "devnet";
  packageId?: string;
  poolSystemId?: string;
  refreshInterval?: number; // in milliseconds
}

interface UsePoolSystemReturn {
  pools: Pool[];
  poolOverviews: PoolOverview[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getPoolById: (poolId: string) => Pool | undefined;
  getPoolOverview: (poolId: string) => PoolOverview | undefined;
}

export const usePoolSystem = (
  options: UsePoolSystemOptions = {}
): UsePoolSystemReturn => {
  const {
    packageId = MER3_PACKAGE_ID,
    poolSystemId = POOL_SYSTEM,
    refreshInterval = 30000,
  } = options;
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const [pools, setPools] = useState<Pool[]>([]);
  const [poolOverviews, setPoolOverviews] = useState<PoolOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoolInfo = useCallback(
    async (poolId: string): Promise<Pool | null> => {
      try {
        if (!packageId) {
          throw new Error("Package ID is required");
        }

        const result = await suiClient.getObject({
          id: poolId,
          options: {
            showContent: true,
            showType: true,
          },
        });
        console.log("result", result);
        if (
          result.data?.content?.dataType === "moveObject" &&
          !result.data?.content?.fields
        ) {
          return null;
        }

        // Parse the returned values
        const returnValues =
          result.data?.content?.dataType === "moveObject"
            ? (result.data?.content?.fields as any)
            : null;

        return {
          id: poolId,
          poolId,
          name: String(returnValues.name),
          description: String(returnValues.description),
          creator: String(returnValues.creator), // You might need to fetch this separately
          imageUrl: String(returnValues.image_url), // You might need to fetch this separately
          requiredElements: Array.isArray(returnValues.required_elements)
            ? returnValues.required_elements.map((element: any) =>
                Number(element)
              )
            : [],
          startTime: Number(returnValues.start_time),
          endTime: Number(returnValues.end_time),
          isActive: Boolean(returnValues.is_active),
          suiRewards: Number(returnValues.sui_reward_pool),
          participantCount: Number(returnValues.participant_count),
          totalStakedCount: Number(returnValues.total_staked_count),
        };
      } catch (err) {
        console.error(`Error fetching pool info for ${poolId}:`, err);
        return null;
      }
    },
    [packageId, poolSystemId, suiClient]
  );

  // Fetch pool overview with time calculations
  const fetchPoolOverview = useCallback(
    async (poolId: string): Promise<PoolOverview | null> => {
      try {
        if (!packageId) {
          throw new Error("Package ID is required");
        }

        // Get current clock object ID (you might need to provide this)
        const clockObjectId =
          "0x0000000000000000000000000000000000000000000000000000000000000006";

        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::pool_rewards::get_pool_overview`,
          arguments: [
            tx.object(poolSystemId),
            tx.object(poolId),
            tx.object(clockObjectId),
          ],
        });

        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx.serialize(),
          sender: address,
        });

        if (!result.results?.[0]?.returnValues) {
          return null;
        }

        const [
          totalPrize,
          daysRemaining,
          hoursRemaining,
          participantCount,
          totalStakedCount,
          isActive,
        ] = result.results[0].returnValues;

        return {
          poolId,
          totalPrize: Number(totalPrize),
          daysRemaining: Number(daysRemaining),
          hoursRemaining: Number(hoursRemaining),
          participantCount: Number(participantCount),
          totalStakedCount: Number(totalStakedCount),
          isActive: Boolean(isActive),
        };
      } catch (err) {
        console.error(`Error fetching pool overview for ${poolId}:`, err);
        return null;
      }
    },
    [packageId, poolSystemId, suiClient]
  );

  // Get all pool IDs from events
  const fetchAllPoolIds = useCallback(async (): Promise<string[]> => {
    try {
      if (!packageId) {
        throw new Error("Package ID is required");
      }

      // Query PoolCreated events to get all pool IDs
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${packageId}::pool_rewards::PoolCreated`,
        },
        limit: 1000, // Adjust as needed
        order: "ascending",
      });

      const poolIds: string[] = [];
      for (const event of events.data) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const poolId = (event.parsedJson as any).pool_id;
          if (poolId && !poolIds.includes(poolId)) {
            poolIds.push(poolId);
          }
        }
      }

      return poolIds;
    } catch (err) {
      console.error("Error fetching pool IDs:", err);
      return [];
    }
  }, [packageId, suiClient]);

  // Main fetch function
  const fetchAllPools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all pool IDs
      const poolIds = await fetchAllPoolIds();
      console.log("poolIds", poolIds);

      if (poolIds.length === 0) {
        setPools([]);
        setPoolOverviews([]);
        return;
      }

      // Fetch detailed info for each pool
      const poolPromises = poolIds.map((poolId) => fetchPoolInfo(poolId));

      const [poolResults] = await Promise.all([Promise.all(poolPromises)]);

      // Filter out null results
      const validPools = poolResults.filter(
        (pool): pool is Pool =>
          pool !== null && pool.isActive && pool.endTime > Date.now()
      );

      setPools(validPools);
    } catch (err) {
      console.error("Error fetching pools:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pools");
    } finally {
      setLoading(false);
    }
  }, [fetchAllPoolIds, fetchPoolInfo, fetchPoolOverview]);

  // Helper functions
  const getPoolById = useCallback(
    (poolId: string): Pool | undefined => {
      console.log("pools", pools);
      return pools.find((pool) => pool.poolId === poolId);
    },
    [pools]
  );

  const getPoolOverview = useCallback(
    (poolId: string): PoolOverview | undefined => {
      return poolOverviews.find((overview) => overview.poolId === poolId);
    },
    [poolOverviews]
  );

  // Initial fetch
  useEffect(() => {
    if (packageId && poolSystemId) {
      fetchAllPools();
    }
  }, [packageId, poolSystemId, fetchAllPools]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0 && packageId && poolSystemId) {
      const interval = setInterval(fetchAllPools, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, packageId, poolSystemId, fetchAllPools]);

  return {
    pools,
    poolOverviews,
    loading,
    error,
    refetch: fetchAllPools,
    getPoolById,
    getPoolOverview,
  };
};
