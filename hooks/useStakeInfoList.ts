import { suiClient } from "@/lib/utils";
import {
  MER3_UPGRADED_PACKAGE_ID,
  POOL_REWARDS_MODULE_NAME,
  POOL_SYSTEM,
} from "@/utils/constants";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Enhanced interfaces
export interface StakeInfo {
  id: string;
  nftId: string;
  owner: string;
  poolId: string;
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
  nftCount: number;
  totalWeight: number;
  totalPoolWeight: number;
  pendingSuiRewards: number;
}

interface UseStakeInfoListOptions {
  refreshInterval?: number;
  autoFetch?: boolean;
  walletAddress?: string;
  poolId?: string | null;
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
    async (nftIds: string[]): Promise<StakeInfo[]> => {
      if (!poolId || !walletAddress) {
        return [];
      }
      const stakeInfos: StakeInfo[] = [];

      for (const nftId of nftIds) {
        try {
          let displayData;
          displayData = await getStakedNFTData(poolId, nftId);
          const stakeInfo: StakeInfo = {
            id: nftId,
            nftId: nftId,
            owner: walletAddress,
            poolId: poolId,
            displayData,
          };

          stakeInfos.push(stakeInfo);
        } catch (nftError) {
          console.error(`Error processing NFT ${nftId}:`, nftError);
          continue;
        }
      }

      return stakeInfos;
    },
    [includeNFTDetails, getStakedNFTData, walletAddress, poolId]
  );

  /**
   * Get user stake info from contract for a specific pool
   */
  const getUserStakeInfoFromContract = useCallback(
    async (userAddress: string, poolId: string) => {
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${MER3_UPGRADED_PACKAGE_ID}::${POOL_REWARDS_MODULE_NAME}::get_user_reward_details_dynamic`,
          arguments: [
            tx.object(POOL_SYSTEM),
            tx.pure.id(poolId),
            tx.pure.address(userAddress),
            tx.object("0x6"),
          ],
        });

        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: userAddress,
        });

        console.log("result get_user_stake_info", result);

        if (!result.results?.[0]?.returnValues) {
          return null;
        }

        const [
          userNftCount,
          userWeight,
          totalPoolWeight,
          pendingSuiRewards,
          lastRewardClaim,
        ] = result.results[0].returnValues;

        return {
          nftCount: decodeU64(userNftCount[0]),
          totalWeight: decodeU64(userWeight[0]),
          totalPoolWeight: decodeU64(totalPoolWeight[0]),
          pendingSuiRewards: decodeU64(pendingSuiRewards[0]),
          lastRewardClaim: decodeU64(lastRewardClaim[0]),
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

  const decodeU64 = (bytes: number[]): number => {
    if (!Array.isArray(bytes)) return 0;
    let result = 0;
    for (let i = 0; i < Math.min(bytes.length, 8); i++) {
      result += bytes[i] * Math.pow(256, i);
    }
    return result;
  };

  /**
   * Get reward stats for a specific pool
   */
  const getPoolRewardStats = useCallback(
    async (userAddress: string, poolId: string): Promise<PoolStats> => {
      try {
        const userStakeInfo = await getUserStakeInfoFromContract(
          userAddress,
          poolId
        );

        return {
          poolId,
          nftCount: userStakeInfo?.nftCount || 0,
          totalWeight: userStakeInfo?.totalWeight || 0,
          totalPoolWeight: userStakeInfo?.totalPoolWeight || 0,
          pendingSuiRewards: userStakeInfo?.pendingSuiRewards || 0,
        };
      } catch (error) {
        console.error(`Error getting pool reward stats for ${poolId}:`, error);
        return {
          poolId,
          nftCount: 0,
          totalWeight: 0,
          totalPoolWeight: 0,
          pendingSuiRewards: 0,
        };
      }
    },
    [getUserStakeInfoFromContract]
  );

  const fetchUserStakedNftIds = useCallback(
    async (poolId: string, userAddress: string): Promise<string[]> => {
      try {
        const tx = new Transaction();
        tx.moveCall({
          target: `${MER3_UPGRADED_PACKAGE_ID}::${POOL_REWARDS_MODULE_NAME}::get_user_staked_nft_ids`,
          arguments: [
            tx.object(POOL_SYSTEM),
            tx.pure.id(poolId),
            tx.pure.address(userAddress),
          ],
        });

        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: userAddress,
        });

        if (!result.results?.[0]?.returnValues) {
          return [];
        }

        const returnValue = result.results[0].returnValues[0];
        const nftIds: string[] = parseSuiVectorIds(returnValue[0]);

        return nftIds;
      } catch (error) {
        console.error("Error fetching all staked NFT IDs:", error);
        throw new Error(`Failed to fetch staked NFT IDs: ${error}`);
      }
    },
    []
  );

  const fetchStakeInfos = useCallback(async () => {
    if (!walletAddress) {
      setError(new Error("No wallet address available"));
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const stakedNftIds = await fetchUserStakedNftIds(poolId!, walletAddress);
      const stakeInfosList = await convertEventsToStakeInfos(stakedNftIds);
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
    determineCurrentlyStakedNFTs,
    convertEventsToStakeInfos,
  ]);

  // State for async calculated stats
  const [calculatedStats, setCalculatedStats] = useState<PoolStats | null>(
    null
  );

  // Calculate stats when stakeInfos change and rewards are enabled
  useEffect(() => {
    if (calculateRewards && walletAddress) {
      getPoolRewardStats(walletAddress, poolId!)
        .then((stats) => {
          setCalculatedStats(stats);
        })
        .catch((error) => {
          console.error("Error calculating stake stats:", error);
          // Set basic stats on error
          setCalculatedStats(null);
        });
    } else {
      setCalculatedStats(null);
    }
  }, [calculateRewards, walletAddress]);

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
    if (walletAddress) {
      fetchStakeInfos();
    }
  }, [walletAddress, fetchStakeInfos]);

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
    refresh: fetchStakeInfos,

    // Utility functions
    getStakeInfoById,
    getStakeInfoByNftId,
    getStakesByPool,

    // Manual refresh for rewards only
    refreshRewards: async () => {
      if (calculateRewards && walletAddress && stakeInfos.length > 0) {
        setRewardsLoading(true);
        try {
          const rewardStats = await getPoolRewardStats(walletAddress, poolId!);
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

export function bytesToId(bytes: number[]): string {
  return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function parseSuiVectorIds(rawData: number[]): string[] {
  console.log("=== PARSING SUI VECTOR IDS ===");
  console.log("Raw data length:", rawData.length);
  console.log("First few elements:", rawData.slice(0, 10));

  if (!Array.isArray(rawData) || rawData.length < 1) {
    console.warn("Invalid data format");
    return [];
  }

  // First element is the count
  const count = rawData[0];
  console.log("Number of IDs:", count);

  if (count === 0) {
    console.log("No IDs to parse");
    return [];
  }

  // Each ID is 32 bytes
  const bytesPerID = 32;
  const expectedTotalBytes = 1 + count * bytesPerID; // 1 for count + count * 32 bytes

  console.log("Expected total bytes:", expectedTotalBytes);
  console.log("Actual total bytes:", rawData.length);

  if (rawData.length !== expectedTotalBytes) {
    console.warn(
      `Byte count mismatch. Expected: ${expectedTotalBytes}, Got: ${rawData.length}`
    );
  }

  const ids: string[] = [];

  // Parse each ID
  for (let i = 0; i < count; i++) {
    const startIndex = 1 + i * bytesPerID; // Skip count byte, then i * 32 bytes
    const endIndex = startIndex + bytesPerID;

    console.log(`\n--- Parsing ID ${i + 1} ---`);
    console.log(`Bytes range: ${startIndex} to ${endIndex - 1}`);

    if (endIndex > rawData.length) {
      console.error(`Not enough bytes for ID ${i + 1}`);
      break;
    }

    const idBytes = rawData.slice(startIndex, endIndex);
    console.log(`ID ${i + 1} bytes:`, idBytes);
    console.log(`ID ${i + 1} length:`, idBytes.length);

    // Convert to hex
    const hexString = idBytes
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const id = `0x${hexString}`;

    console.log(`ID ${i + 1} result:`, id);
    ids.push(id);
  }

  console.log("=== FINAL PARSED IDS ===");
  console.log("All IDs:", ids);

  return ids;
}
