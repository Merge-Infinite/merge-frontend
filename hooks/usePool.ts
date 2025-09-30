import { suiClient } from "@/lib/utils";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import {
  MER3_PACKAGE_ID,
  MER3_UPGRADED_PACKAGE_ID,
  POOL_SYSTEM,
} from "@/utils/constants";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

// Types based on your Move contract
export interface Pool {
  id: string;
  poolId: string;
  name: string;
  totalPrize: number;
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
  tokenType: string;
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

        if (!returnValues) {
          return null;
        }
        return {
          id: poolId,
          poolId,
          name: String(returnValues.name),
          totalPrize: Number(
            returnValues.total_sui_deposited ||
              Number(returnValues.total_rewards_added)
          ),
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
          tokenType: String(returnValues.token_type),
        };
      } catch (err) {
        console.error(`Error fetching pool info for ${poolId}:`, err);
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
      const createdEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${MER3_PACKAGE_ID}::pool_rewards::PoolCreated`,
        },
        limit: 1000, // Adjust as needed
        order: "ascending",
      });

      const customCreatedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${MER3_UPGRADED_PACKAGE_ID}::pool_rewards::CustomTokenPoolCreated`,
        },
        limit: 1000, // Adjust as needed
        order: "ascending",
      });

      console.log("createdEvents", createdEvents);
      console.log("customCreatedEvents", customCreatedEvents);

      const poolIds: string[] = [];
      for (const event of [
        ...createdEvents.data,
        ...customCreatedEvents.data,
      ]) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const poolId = (event.parsedJson as any).pool_id;
          if (poolId && !poolIds.includes(poolId)) {
            poolIds.push(poolId);
          }
        }
      }

      // Query PoolDeleted events to filter out deleted pools
      const deletedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${packageId}::pool_rewards::PoolDeleted`,
        },
        limit: 1000, // Adjust as needed
        order: "ascending",
      });

      const customDeletedEvents = await suiClient.queryEvents({
        query: {
          MoveEventType: `${MER3_UPGRADED_PACKAGE_ID}::pool_rewards::CustomPoolDeleted`,
        },
        limit: 1000, // Adjust as needed
        order: "ascending",
      });

      const deletedPoolIds: Set<string> = new Set();
      for (const event of deletedEvents.data) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const poolId = (event.parsedJson as any).pool_id;
          if (poolId) {
            deletedPoolIds.add(poolId);
          }
        }
      }

      for (const event of customDeletedEvents.data) {
        if (event.parsedJson && typeof event.parsedJson === "object") {
          const poolId = (event.parsedJson as any).pool_id;
          if (poolId) {
            deletedPoolIds.add(poolId);
          }
        }
      }

      // Filter out deleted pools from the list
      const activePoolIds = poolIds.filter(
        (poolId) => !deletedPoolIds.has(poolId)
      );

      return activePoolIds;
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

      const validPools = poolResults.filter(
        (pool): pool is Pool => pool !== null
      );

      setPools(validPools);
    } catch (err) {
      console.error("Error fetching pools:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pools");
    } finally {
      setLoading(false);
    }
  }, [fetchAllPoolIds, fetchPoolInfo]);

  // Helper functions
  const getPoolById = useCallback(
    (poolId: string): Pool | undefined => {
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
