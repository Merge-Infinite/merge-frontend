import { suiClient } from "@/lib/utils";
import { MER3_PACKAGE_ID, POOL_SYSTEM } from "@/utils/constants";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Enhanced interfaces
export interface StakeInfo {
  id: string;
  nftId: string;
  owner: string;
  poolId: string;
  stakeTime: Date;
  weight: number;
  stakeDurationMs: number;
  stakeDurationHours: number;
  lastEventTime: number;
  eventType: "staked" | "unstaked";
  displayData?: {
    name?: string;
    image_uri?: string;
    description?: string;
    item_ids?: number[];
  };
}

interface NFTStakeEvent {
  nftId: string;
  poolId: string;
  owner: string;
  stakeTime: number;
  eventTime: number;
  eventType: "staked" | "unstaked";
  stakeDuration?: number;
  rewardsForfeited?: boolean;
}

// Enhanced StakeStats with SUI rewards
interface StakeStats {
  totalStakes: number;
  totalStakingHours: number;
  avgStakingHours: number;
  totalWeight: number;
  oldestStake?: Date;
  newestStake?: Date;

  // SUI Rewards
  totalPendingSuiRewards: number;
  totalClaimedSuiRewards: number;
  totalSuiEarned: number;

  // Energy System
  totalEnergyEarned: number;
  dailyEnergyRate: number;

  // Pool breakdown
  poolBreakdown: PoolStats[];
}

interface PoolStats {
  poolId: string;
  poolName: string;
  nftCount: number;
  totalWeight: number;
  pendingSuiRewards: number;
  claimedSuiRewards: number;
  energyEarned: number;
  canClaimNow: boolean;
  timeUntilNextClaim: number;
}

interface UseStakeInfoListOptions {
  refreshInterval?: number;
  autoFetch?: boolean;
  walletAddress?: string;
  poolId?: string;
  includeNFTDetails?: boolean;
  enableRealTimeUpdates?: boolean;
  calculateRewards?: boolean; // New option to enable reward calculations
}

export function useStakeInfoList(options: UseStakeInfoListOptions) {
  const [stakeInfos, setStakeInfos] = useState<StakeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Default options with proper destructuring
  const {
    refreshInterval = 30000, // 30 seconds default
    autoFetch = true,
    walletAddress,
    poolId,
    includeNFTDetails = true,
    enableRealTimeUpdates = false,
    calculateRewards = true, // Enable by default
  } = options;

  // Constants for reward calculations
  const SUI_DECIMALS = 9;
  const REWARD_UPDATE_INTERVAL = 21_600_000; // 6 hours
  const BASE_ENERGY_PER_HOUR = 10;
  const ENERGY_MULTIPLIER_PER_ITEM = 0.1;

  /**
   * Fetch all stake/unstake events for a user
   */
  const fetchUserStakeEvents = useCallback(
    async (
      userAddress: string,
      targetPoolId?: string
    ): Promise<NFTStakeEvent[]> => {
      try {
        const events: NFTStakeEvent[] = [];

        // Query NFTStaked events
        const stakedEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${MER3_PACKAGE_ID}::pool_rewards::NFTStaked`,
          },
          limit: 1000,
          order: "descending",
        });

        // Query NFTUnstaked events
        const unstakedEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${MER3_PACKAGE_ID}::pool_rewards::NFTUnstaked`,
          },
          limit: 1000,
          order: "descending",
        });

        // Process staked events
        for (const event of stakedEvents.data) {
          if (event.parsedJson && typeof event.parsedJson === "object") {
            const eventData = event.parsedJson as any;

            if (
              eventData.owner === userAddress &&
              (!targetPoolId || eventData.pool_id === targetPoolId)
            ) {
              events.push({
                nftId: eventData.nft_id,
                poolId: eventData.pool_id,
                owner: eventData.owner,
                stakeTime: Number(eventData.stake_time),
                eventTime: Number(event.timestampMs),
                eventType: "staked",
              });
            }
          }
        }

        // Process unstaked events
        for (const event of unstakedEvents.data) {
          if (event.parsedJson && typeof event.parsedJson === "object") {
            const eventData = event.parsedJson as any;

            if (
              eventData.owner === userAddress &&
              (!targetPoolId || eventData.pool_id === targetPoolId)
            ) {
              events.push({
                nftId: eventData.nft_id,
                poolId: eventData.pool_id,
                owner: eventData.owner,
                stakeTime: 0,
                eventTime: Number(event.timestampMs),
                eventType: "unstaked",
                stakeDuration: Number(eventData.stake_duration || 0),
                rewardsForfeited: Boolean(eventData.rewards_forfeited),
              });
            }
          }
        }

        events.sort((a, b) => b.eventTime - a.eventTime);
        return events;
      } catch (error) {
        console.error("Error fetching user stake events:", error);
        throw new Error(`Failed to fetch stake events: ${error}`);
      }
    },
    []
  );

  /**
   * Determine currently staked NFTs from events
   */
  const determineCurrentlyStakedNFTs = useCallback(
    (events: NFTStakeEvent[]): Map<string, NFTStakeEvent> => {
      const nftLatestEvents = new Map<string, NFTStakeEvent>();

      for (const event of events) {
        const nftKey = `${event.nftId}_${event.poolId}`;

        if (!nftLatestEvents.has(nftKey)) {
          nftLatestEvents.set(nftKey, event);
        }
      }

      const currentlyStaked = new Map<string, NFTStakeEvent>();

      for (const [nftKey, latestEvent] of nftLatestEvents) {
        if (latestEvent.eventType === "staked") {
          currentlyStaked.set(nftKey, latestEvent);
        }
      }

      return currentlyStaked;
    },
    []
  );

  /**
   * Get staked NFT object data from the pool's ObjectTable
   */
  const getStakedNFTData = useCallback(
    async (poolId: string, nftId: string): Promise<any | null> => {
      try {
        const poolSystemObject = await suiClient.getObject({
          id: POOL_SYSTEM,
          options: {
            showContent: true,
          },
        });

        if (
          !poolSystemObject.data?.content ||
          poolSystemObject.data.content.dataType !== "moveObject"
        ) {
          return null;
        }

        const fields = poolSystemObject.data.content.fields as any;
        const poolsTableId = fields.pools?.fields?.id?.id;

        if (!poolsTableId) {
          return null;
        }

        const poolObject = await suiClient.getDynamicFieldObject({
          parentId: poolsTableId,
          name: {
            type: "0x2::object::ID",
            value: poolId,
          },
        });

        if (
          !poolObject.data?.content ||
          poolObject.data.content.dataType !== "moveObject"
        ) {
          return null;
        }

        const poolFields = poolObject.data.content.fields as any;
        const stakedNftsTableId = poolFields.staked_nfts?.fields?.id?.id;

        if (!stakedNftsTableId) {
          return null;
        }

        const stakedNftObject = await suiClient.getDynamicFieldObject({
          parentId: stakedNftsTableId,
          name: {
            type: "0x2::object::ID",
            value: nftId,
          },
        });

        if (
          !stakedNftObject.data?.content ||
          stakedNftObject.data.content.dataType !== "moveObject"
        ) {
          return null;
        }

        const stakedNftFields = stakedNftObject.data.content.fields as any;
        const nftData = stakedNftFields.nft?.fields;

        if (!nftData) {
          return null;
        }

        return {
          name: nftData.metadata?.fields?.name || "Unknown NFT",
          image_uri: nftData.metadata?.fields?.image_uri || "",
          description: nftData.metadata?.fields?.description || "",
          item_ids: nftData.item_ids || [],
          stakedNftData: stakedNftFields,
        };
      } catch (error) {
        console.error(
          `Error fetching staked NFT data for ${nftId} in pool ${poolId}:`,
          error
        );
        return null;
      }
    },
    []
  );

  /**
   * Convert stake events to StakeInfo objects
   */
  const convertEventsToStakeInfos = useCallback(
    async (
      currentlyStakedMap: Map<string, NFTStakeEvent>
    ): Promise<StakeInfo[]> => {
      const stakeInfos: StakeInfo[] = [];
      const currentTime = Date.now();

      for (const [nftKey, stakeEvent] of currentlyStakedMap) {
        try {
          const stakeDurationMs = currentTime - stakeEvent.stakeTime;
          const stakeDurationHours = Math.floor(
            stakeDurationMs / (1000 * 60 * 60)
          );
          const weight = stakeDurationHours > 0 ? stakeDurationHours : 1;

          let displayData;
          if (includeNFTDetails) {
            displayData = await getStakedNFTData(
              stakeEvent.poolId,
              stakeEvent.nftId
            );
          }

          const stakeInfo: StakeInfo = {
            id: stakeEvent.nftId,
            nftId: stakeEvent.nftId,
            owner: stakeEvent.owner,
            poolId: stakeEvent.poolId,
            stakeTime: new Date(stakeEvent.stakeTime),
            weight,
            stakeDurationMs,
            stakeDurationHours,
            lastEventTime: stakeEvent.eventTime,
            eventType: stakeEvent.eventType,
            displayData,
          };

          stakeInfos.push(stakeInfo);
        } catch (nftError) {
          console.warn(`Error processing NFT ${stakeEvent.nftId}:`, nftError);
          continue;
        }
      }

      stakeInfos.sort((a, b) => b.stakeTime.getTime() - a.stakeTime.getTime());
      return stakeInfos;
    },
    [includeNFTDetails, getStakedNFTData]
  );

  /**
   * Get user stake info from contract for a specific pool
   */
  const getUserStakeInfoFromContract = useCallback(
    async (userAddress: string, poolId: string) => {
      try {
        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: {
            kind: "programmableTransaction",
            inputs: [
              { type: "object", objectId: POOL_SYSTEM },
              { type: "pure", valueType: "address", value: poolId },
              { type: "pure", valueType: "address", value: userAddress },
            ],
            transactions: [
              {
                kind: "moveCall",
                target: `${MER3_PACKAGE_ID}::pool_rewards::get_user_stake_info`,
                arguments: [
                  { kind: "input", index: 0 },
                  { kind: "input", index: 1 },
                  { kind: "input", index: 2 },
                ],
              },
            ],
          },
          sender:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
        });

        if (!result.results?.[0]?.returnValues) {
          return null;
        }

        const [nftCount, totalWeight, pendingSuiRewards, lastRewardClaim] =
          result.results[0].returnValues;

        return {
          nftCount: Number(nftCount),
          totalWeight: Number(totalWeight),
          pendingSuiRewards:
            Number(pendingSuiRewards) / Math.pow(10, SUI_DECIMALS),
          lastRewardClaim: Number(lastRewardClaim),
        };
      } catch (error) {
        console.error(
          `Error fetching user stake info for pool ${poolId}:`,
          error
        );
        return null;
      }
    },
    []
  );

  /**
   * Get pool name from contract
   */
  const getPoolName = useCallback(async (poolId: string): Promise<string> => {
    try {
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: {
          kind: "programmableTransaction",
          inputs: [
            { type: "object", objectId: POOL_SYSTEM },
            { type: "pure", valueType: "address", value: poolId },
          ],
          transactions: [
            {
              kind: "moveCall",
              target: `${MER3_PACKAGE_ID}::pool_rewards::get_pool_info`,
              arguments: [
                { kind: "input", index: 0 },
                { kind: "input", index: 1 },
              ],
            },
          ],
        },
        sender:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (!result.results?.[0]?.returnValues?.[0]) {
        return `Pool ${poolId.slice(0, 8)}...`;
      }

      return String(result.results[0].returnValues[0]);
    } catch (error) {
      console.error(`Error fetching pool name for ${poolId}:`, error);
      return `Pool ${poolId.slice(0, 8)}...`;
    }
  }, []);

  /**
   * Get claimed rewards for a specific pool from RewardsClaimed events
   */
  const getClaimedRewardsForPool = useCallback(
    async (userAddress: string, poolId: string): Promise<number> => {
      try {
        const claimEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${MER3_PACKAGE_ID}::pool_rewards::RewardsClaimed`,
          },
          limit: 1000,
          order: "descending",
        });

        let totalClaimed = 0;

        for (const event of claimEvents.data) {
          if (event.parsedJson && typeof event.parsedJson === "object") {
            const eventData = event.parsedJson as any;

            if (
              eventData.user === userAddress &&
              eventData.pool_id === poolId
            ) {
              totalClaimed +=
                Number(eventData.sui_amount) / Math.pow(10, SUI_DECIMALS);
            }
          }
        }

        return totalClaimed;
      } catch (error) {
        console.error(
          `Error fetching claimed rewards for pool ${poolId}:`,
          error
        );
        return 0;
      }
    },
    []
  );

  /**
   * Calculate energy earned based on staking duration and NFT properties
   */
  const calculateEnergyEarned = useCallback(
    (poolStakes: StakeInfo[]): number => {
      let totalEnergy = 0;

      for (const stake of poolStakes) {
        const baseEnergy = BASE_ENERGY_PER_HOUR * stake.stakeDurationHours;
        const itemCount = stake.displayData?.item_ids?.length || 0;
        const multiplier = 1 + itemCount * ENERGY_MULTIPLIER_PER_ITEM;

        totalEnergy += baseEnergy * multiplier;
      }

      return Math.floor(totalEnergy);
    },
    []
  );

  /**
   * Get reward stats for a specific pool
   */
  const getPoolRewardStats = useCallback(
    async (
      userAddress: string,
      poolId: string,
      poolStakes: StakeInfo[]
    ): Promise<PoolStats> => {
      try {
        const [userStakeInfo, poolName, claimedRewards] = await Promise.all([
          getUserStakeInfoFromContract(userAddress, poolId),
          getPoolName(poolId),
          getClaimedRewardsForPool(userAddress, poolId),
        ]);

        const energyEarned = calculateEnergyEarned(poolStakes);

        const currentTime = Date.now();
        const lastClaimTime = userStakeInfo?.lastRewardClaim || 0;
        const timeUntilNextClaim = Math.max(
          0,
          REWARD_UPDATE_INTERVAL - (currentTime - lastClaimTime)
        );

        return {
          poolId,
          poolName,
          nftCount: poolStakes.length,
          totalWeight: poolStakes.reduce((sum, stake) => sum + stake.weight, 0),
          pendingSuiRewards: userStakeInfo?.pendingSuiRewards || 0,
          claimedSuiRewards: claimedRewards,
          energyEarned,
          canClaimNow: timeUntilNextClaim === 0,
          timeUntilNextClaim,
        };
      } catch (error) {
        console.error(`Error getting pool reward stats for ${poolId}:`, error);
        return {
          poolId,
          poolName: `Pool ${poolId.slice(0, 8)}...`,
          nftCount: poolStakes.length,
          totalWeight: poolStakes.reduce((sum, stake) => sum + stake.weight, 0),
          pendingSuiRewards: 0,
          claimedSuiRewards: 0,
          energyEarned: 0,
          canClaimNow: false,
          timeUntilNextClaim: 0,
        };
      }
    },
    [
      getUserStakeInfoFromContract,
      getPoolName,
      getClaimedRewardsForPool,
      calculateEnergyEarned,
    ]
  );

  /**
   * Calculate comprehensive stake statistics including SUI rewards
   */
  const calculateStakeStats = useCallback(
    async (
      userAddress: string,
      stakeInfos: StakeInfo[]
    ): Promise<StakeStats> => {
      if (stakeInfos.length === 0) {
        return {
          totalStakes: 0,
          totalStakingHours: 0,
          avgStakingHours: 0,
          totalWeight: 0,
          totalPendingSuiRewards: 0,
          totalClaimedSuiRewards: 0,
          totalSuiEarned: 0,
          totalEnergyEarned: 0,
          dailyEnergyRate: 0,
          poolBreakdown: [],
        };
      }

      setRewardsLoading(true);

      try {
        // Basic staking stats
        const totalStakes = stakeInfos.length;
        const totalStakingHours = stakeInfos.reduce(
          (sum, stake) => sum + stake.stakeDurationHours,
          0
        );
        const totalWeight = stakeInfos.reduce(
          (sum, stake) => sum + stake.weight,
          0
        );
        const avgStakingHours = totalStakingHours / totalStakes;

        // Time-based metrics
        const stakeTimes = stakeInfos
          .map((s) => s.stakeTime)
          .sort((a, b) => a.getTime() - b.getTime());
        const oldestStake = stakeTimes[0];
        const newestStake = stakeTimes[stakeTimes.length - 1];

        // Get unique pools and calculate pool-specific stats
        const uniquePoolIds = [
          ...new Set(stakeInfos.map((stake) => stake.poolId)),
        ];

        const poolBreakdownPromises = uniquePoolIds.map(async (poolId) => {
          const poolStakes = stakeInfos.filter(
            (stake) => stake.poolId === poolId
          );
          return await getPoolRewardStats(userAddress, poolId, poolStakes);
        });

        const poolBreakdown = await Promise.all(poolBreakdownPromises);

        // Aggregate reward stats from all pools
        const totalPendingSuiRewards = poolBreakdown.reduce(
          (sum, pool) => sum + pool.pendingSuiRewards,
          0
        );
        const totalClaimedSuiRewards = poolBreakdown.reduce(
          (sum, pool) => sum + pool.claimedSuiRewards,
          0
        );
        const totalSuiEarned = totalPendingSuiRewards + totalClaimedSuiRewards;

        // Energy stats
        const totalEnergyEarned = poolBreakdown.reduce(
          (sum, pool) => sum + pool.energyEarned,
          0
        );
        const dailyEnergyRate =
          totalStakes > 0 ? totalEnergyEarned / (totalStakingHours / 24) : 0;

        return {
          totalStakes,
          totalStakingHours,
          avgStakingHours: Math.round(avgStakingHours * 100) / 100,
          totalWeight,
          oldestStake,
          newestStake,
          totalPendingSuiRewards,
          totalClaimedSuiRewards,
          totalSuiEarned,
          totalEnergyEarned,
          dailyEnergyRate: Math.round(dailyEnergyRate * 100) / 100,
          poolBreakdown,
        };
      } catch (error) {
        console.error("Error calculating stake stats:", error);
        // Return basic stats without rewards on error
        const totalStakes = stakeInfos.length;
        const totalStakingHours = stakeInfos.reduce(
          (sum, stake) => sum + stake.stakeDurationHours,
          0
        );
        const totalWeight = stakeInfos.reduce(
          (sum, stake) => sum + stake.weight,
          0
        );
        const stakeTimes = stakeInfos
          .map((s) => s.stakeTime)
          .sort((a, b) => a.getTime() - b.getTime());

        return {
          totalStakes,
          totalStakingHours,
          avgStakingHours:
            Math.round((totalStakingHours / totalStakes) * 100) / 100,
          totalWeight,
          oldestStake: stakeTimes[0],
          newestStake: stakeTimes[stakeTimes.length - 1],
          totalPendingSuiRewards: 0,
          totalClaimedSuiRewards: 0,
          totalSuiEarned: 0,
          totalEnergyEarned: 0,
          dailyEnergyRate: 0,
          poolBreakdown: [],
        };
      } finally {
        setRewardsLoading(false);
      }
    },
    [getPoolRewardStats]
  );

  /**
   * Main fetch function
   */
  const fetchStakeInfos = useCallback(async () => {
    if (!walletAddress) {
      setError(new Error("No wallet address available"));
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const events = await fetchUserStakeEvents(walletAddress, poolId);
      const currentlyStakedMap = determineCurrentlyStakedNFTs(events);
      const stakeInfosList = await convertEventsToStakeInfos(
        currentlyStakedMap
      );

      setStakeInfos(stakeInfosList);
      setLastFetchTime(new Date());

      return stakeInfosList;
    } catch (err) {
      console.error("Error fetching stake infos:", err);
      const error =
        err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      toast.error(`Error fetching stake information: ${error.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    walletAddress,
    poolId,
    fetchUserStakeEvents,
    determineCurrentlyStakedNFTs,
    convertEventsToStakeInfos,
  ]);

  /**
   * Fetch stake infos for a specific address
   */
  const fetchStakeInfosForAddress = useCallback(
    async (address: string): Promise<StakeInfo[]> => {
      try {
        setLoading(true);
        setError(null);

        const events = await fetchUserStakeEvents(address, poolId);
        const currentlyStakedMap = determineCurrentlyStakedNFTs(events);
        const result = await convertEventsToStakeInfos(currentlyStakedMap);

        return result;
      } catch (err) {
        console.error("Error fetching stake infos for address:", err);
        throw err instanceof Error ? err : new Error("Unknown error occurred");
      } finally {
        setLoading(false);
      }
    },
    [
      poolId,
      fetchUserStakeEvents,
      determineCurrentlyStakedNFTs,
      convertEventsToStakeInfos,
    ]
  );

  // Computed values with useMemo for performance
  const stakeStats = useMemo((): StakeStats | null => {
    if (!calculateRewards || !walletAddress || stakeInfos.length === 0) {
      // Return basic stats without rewards
      if (stakeInfos.length === 0) {
        return {
          totalStakes: 0,
          totalStakingHours: 0,
          avgStakingHours: 0,
          totalWeight: 0,
          totalPendingSuiRewards: 0,
          totalClaimedSuiRewards: 0,
          totalSuiEarned: 0,
          totalEnergyEarned: 0,
          dailyEnergyRate: 0,
          poolBreakdown: [],
        };
      }

      const totalStakingHours = stakeInfos.reduce(
        (sum, stake) => sum + stake.stakeDurationHours,
        0
      );
      const totalWeight = stakeInfos.reduce(
        (sum, stake) => sum + stake.weight,
        0
      );
      const stakeTimes = stakeInfos
        .map((s) => s.stakeTime)
        .sort((a, b) => a.getTime() - b.getTime());

      return {
        totalStakes: stakeInfos.length,
        totalStakingHours,
        avgStakingHours:
          Math.round((totalStakingHours / stakeInfos.length) * 100) / 100,
        totalWeight,
        oldestStake: stakeTimes[0],
        newestStake: stakeTimes[stakeTimes.length - 1],
        totalPendingSuiRewards: 0,
        totalClaimedSuiRewards: 0,
        totalSuiEarned: 0,
        totalEnergyEarned: 0,
        dailyEnergyRate: 0,
        poolBreakdown: [],
      };
    }

    return null; // Will be calculated separately with async function
  }, [stakeInfos, calculateRewards, walletAddress]);

  // State for async calculated stats
  const [calculatedStats, setCalculatedStats] = useState<StakeStats | null>(
    null
  );

  // Calculate stats when stakeInfos change and rewards are enabled
  useEffect(() => {
    if (calculateRewards && walletAddress && stakeInfos.length > 0) {
      calculateStakeStats(walletAddress, stakeInfos)
        .then(setCalculatedStats)
        .catch((error) => {
          console.error("Error calculating stake stats:", error);
          // Set basic stats on error
          setCalculatedStats(stakeStats);
        });
    } else {
      setCalculatedStats(stakeStats);
    }
  }, [
    stakeInfos,
    calculateRewards,
    walletAddress,
    calculateStakeStats,
    stakeStats,
  ]);

  // Utility functions
  const getStakeInfoById = useCallback(
    (id: string): StakeInfo | null => {
      return stakeInfos.find((stake) => stake.id === id) || null;
    },
    [stakeInfos]
  );

  const getStakeInfoByNftId = useCallback(
    (nftId: string): StakeInfo | null => {
      return stakeInfos.find((stake) => stake.nftId === nftId) || null;
    },
    [stakeInfos]
  );

  const getStakesByPool = useCallback(
    (targetPoolId: string): StakeInfo[] => {
      return stakeInfos.filter((stake) => stake.poolId === targetPoolId);
    },
    [stakeInfos]
  );

  // Auto-fetch when wallet changes
  useEffect(() => {
    if (walletAddress && autoFetch) {
      fetchStakeInfos();
    }
  }, [walletAddress, autoFetch, fetchStakeInfos]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval && walletAddress && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchStakeInfos();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, walletAddress, fetchStakeInfos]);

  // Real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates && walletAddress) {
      console.log("Real-time updates enabled for stake info");
    }
  }, [enableRealTimeUpdates, walletAddress]);

  return {
    // Data
    stakeInfos,
    loading,
    rewardsLoading,
    error,
    lastFetchTime,
    stakeStats: calculatedStats, // Use calculated stats with rewards

    // Actions
    fetchStakeInfos,
    fetchStakeInfosForAddress,
    refresh: fetchStakeInfos,

    // Utility functions
    getStakeInfoById,
    getStakeInfoByNftId,
    getStakesByPool,

    // Additional utilities
    isStakeInfoLoaded:
      stakeInfos.length > 0 || (!loading && stakeInfos.length === 0),
    hasError: !!error,
    isEmpty: !loading && stakeInfos.length === 0,

    // Reward-specific utilities
    canClaimAnyRewards:
      calculatedStats?.poolBreakdown.some((pool) => pool.canClaimNow) || false,
    totalClaimableRewards:
      calculatedStats?.poolBreakdown
        .filter((pool) => pool.canClaimNow)
        .reduce((sum, pool) => sum + pool.pendingSuiRewards, 0) || 0,

    // Manual refresh for rewards only
    refreshRewards: async () => {
      if (calculateRewards && walletAddress && stakeInfos.length > 0) {
        setRewardsLoading(true);
        try {
          const rewardStats = await calculateStakeStats(
            walletAddress,
            stakeInfos
          );
          setCalculatedStats(rewardStats);
        } catch (error) {
          console.error("Error refreshing rewards:", error);
          toast.error("Error refreshing reward data");
        } finally {
          setRewardsLoading(false);
        }
      }
    },
  };
}
