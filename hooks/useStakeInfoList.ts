// hooks/useStakeInfoList.ts
import { suiClient } from "@/lib/utils";
import { CREATURE_NFT_MODULE_NAME, MER3_PACKAGE_ID } from "@/utils/constants";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface StakeInfo {
  id: string;
  nftId: string;
  owner: string;
  environment: number;
  environmentName: string;
  stakeTime: Date;
  lastRewardTime: Date;
  stakingDuration: number;
  stakingDays: number;
  canClaimRewards: boolean;
  displayData?: {
    name?: string;
    style?: string;
    image_uri?: string;
  };
}

interface UseStakeInfoListOptions {
  refreshInterval?: number;
  autoFetch?: boolean;
  walletAddress?: string;
  includeNFTDetails?: boolean;
}

export function useStakeInfoList(options: UseStakeInfoListOptions) {
  const [stakeInfos, setStakeInfos] = useState<StakeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default options
  const {
    refreshInterval,
    autoFetch = true,
    walletAddress,
    includeNFTDetails = true,
  } = options;

  // Helper function to get environment name
  const getEnvironmentName = useCallback((code: number): string => {
    switch (code) {
      case 0:
        return "Universe";
      case 1:
        return "Sky";
      case 2:
        return "Seabed";
      default:
        return "Unknown";
    }
  }, []);

  // Helper function to parse raw stake info
  const parseStakeInfo = useCallback(
    (rawData: any, objectId: string): StakeInfo => {
      const fields = rawData.content?.fields;
      if (!fields) throw new Error("Invalid stake info data");

      const environment = parseInt(fields.environment);
      const stakeTime = new Date(parseInt(fields.stake_time));
      const lastRewardTime = new Date(parseInt(fields.last_reward_time));
      const now = new Date();
      const stakingDuration = now.getTime() - stakeTime.getTime();
      const stakingDays = Math.floor(stakingDuration / (1000 * 60 * 60 * 24));

      return {
        id: objectId,
        nftId: fields.nft.fields.id.id,
        owner: fields.owner,
        environment,
        environmentName: getEnvironmentName(environment),
        stakeTime,
        lastRewardTime,
        stakingDuration,
        stakingDays,
        canClaimRewards: stakingDuration > 0, // Can claim if staked for any time
      };
    },
    [getEnvironmentName]
  );

  // Fetch NFT display data for a stake info
  const fetchNFTDisplayData = useCallback(async (nftId: string) => {
    try {
      const { data } = await suiClient.getObject({
        id: nftId,
        options: {
          showDisplay: true,
          showContent: true,
        },
      });

      console.log(data);

      if (!data?.content || data.content.dataType === "package") {
        return null;
      }

      return (data.content.fields as any)?.metadata?.fields || null;
    } catch (err) {
      console.error(`Error fetching NFT display data for ${nftId}:`, err);
      return null;
    }
  }, []);

  // Fetch stake infos owned by the connected wallet
  const fetchStakeInfos = useCallback(async () => {
    if (!walletAddress) {
      setError(new Error("No wallet address or package ID available"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query owned StakeInfo objects
      const { data } = await suiClient.getOwnedObjects({
        owner: walletAddress,
        filter: {
          StructType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::StakeInfo`,
        },
        options: {
          showContent: true,
          showDisplay: true,
          showOwner: true,
        },
      });

      console.log("data", data);

      if (data && data.length > 0) {
        console.log("Raw stake info data:", data);

        // Parse stake infos
        const parsedStakeInfos: StakeInfo[] = [];

        for (const item of data) {
          if (item.data?.content) {
            try {
              const stakeInfo = parseStakeInfo(item.data, item.data.objectId);
              console.log("stakeInfo", item.data?.content);

              // Optionally fetch NFT display data
              if (includeNFTDetails) {
                stakeInfo.displayData = (
                  item.data.content as any
                ).fields.nft.fields.metadata.fields;
              }

              parsedStakeInfos.push(stakeInfo);
            } catch (parseError) {
              console.error("Error parsing stake info:", parseError);
            }
          }
        }

        // Sort by stake time (most recent first)
        parsedStakeInfos.sort(
          (a, b) => b.stakeTime.getTime() - a.stakeTime.getTime()
        );

        setStakeInfos(parsedStakeInfos);
      } else {
        setStakeInfos([]);
      }
    } catch (err) {
      console.error("Error fetching stake infos:", err);
      toast.error("Error fetching stake information");
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setLoading(false);
    }
  }, [walletAddress, parseStakeInfo, includeNFTDetails, fetchNFTDisplayData]);

  // Fetch stake infos for a specific address
  const fetchStakeInfosForAddress = useCallback(
    async (address: string) => {
      const originalAddress = walletAddress;
      // Temporarily override wallet address
      const tempOptions = { ...options, walletAddress: address };

      try {
        setLoading(true);
        setError(null);

        const { data } = await suiClient.getOwnedObjects({
          owner: address,
          filter: {
            StructType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::StakeInfo`,
          },
          options: {
            showContent: true,
            showDisplay: true,
            showOwner: true,
          },
        });

        if (data && data.length > 0) {
          const parsedStakeInfos: StakeInfo[] = [];

          for (const item of data) {
            if (item.data?.content) {
              try {
                const stakeInfo = parseStakeInfo(item.data, item.data.objectId);

                if (includeNFTDetails) {
                  const displayData = await fetchNFTDisplayData(
                    stakeInfo.nftId
                  );
                  if (displayData) {
                    stakeInfo.displayData = displayData;
                  }
                }

                parsedStakeInfos.push(stakeInfo);
              } catch (parseError) {
                console.error("Error parsing stake info:", parseError);
              }
            }
          }

          parsedStakeInfos.sort(
            (a, b) => b.stakeTime.getTime() - a.stakeTime.getTime()
          );
          return parsedStakeInfos;
        }

        return [];
      } catch (err) {
        console.error("Error fetching stake infos for address:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [parseStakeInfo, includeNFTDetails, fetchNFTDisplayData]
  );

  // Auto-fetch when wallet changes if autoFetch is enabled
  useEffect(() => {
    if (walletAddress && autoFetch) {
      fetchStakeInfos();
    }
  }, [walletAddress, autoFetch, fetchStakeInfos]);

  // Set up auto-refresh if interval is specified
  useEffect(() => {
    if (refreshInterval && walletAddress) {
      const intervalId = setInterval(() => {
        fetchStakeInfos();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, walletAddress, fetchStakeInfos]);

  // Find a stake info by its ID
  const getStakeInfoById = useCallback(
    (id: string) => {
      return stakeInfos.find((stake) => stake.id === id) || null;
    },
    [stakeInfos]
  );

  // Find stake info by NFT ID
  const getStakeInfoByNftId = useCallback(
    (nftId: string) => {
      return stakeInfos.find((stake) => stake.nftId === nftId) || null;
    },
    [stakeInfos]
  );

  // Get detailed info for a specific stake
  const getStakeInfoDetails = useCallback(
    async (stakeInfoId: string): Promise<StakeInfo | null> => {
      try {
        const { data } = await suiClient.getObject({
          id: stakeInfoId,
          options: {
            showContent: true,
            showDisplay: true,
            showOwner: true,
          },
        });

        if (!data?.content) return null;

        const stakeInfo = parseStakeInfo(data, stakeInfoId);

        if (includeNFTDetails) {
          const displayData = await fetchNFTDisplayData(stakeInfo.nftId);
          if (displayData) {
            stakeInfo.displayData = displayData;
          }
        }

        return stakeInfo;
      } catch (err) {
        console.error("Error fetching stake info details:", err);
        return null;
      }
    },
    [parseStakeInfo, includeNFTDetails, fetchNFTDisplayData]
  );

  // Get stakes by environment
  const getStakesByEnvironment = useCallback(
    (environment: number) => {
      return stakeInfos.filter((stake) => stake.environment === environment);
    },
    [stakeInfos]
  );

  // Get summary statistics
  const getStakeStats = useCallback(() => {
    const totalStakes = stakeInfos.length;
    const universeStakes = stakeInfos.filter((s) => s.environment === 0).length;
    const skyStakes = stakeInfos.filter((s) => s.environment === 1).length;
    const seabedStakes = stakeInfos.filter((s) => s.environment === 2).length;
    const totalStakingDays = stakeInfos.reduce(
      (sum, stake) => sum + stake.stakingDays,
      0
    );
    const avgStakingDays = totalStakes > 0 ? totalStakingDays / totalStakes : 0;

    return {
      totalStakes,
      universeStakes,
      skyStakes,
      seabedStakes,
      totalStakingDays,
      avgStakingDays: Math.round(avgStakingDays * 100) / 100,
    };
  }, [stakeInfos]);

  return {
    stakeInfos,
    loading,
    error,
    fetchStakeInfos,
    fetchStakeInfosForAddress,
    getStakeInfoById,
    getStakeInfoByNftId,
    getStakeInfoDetails,
    getStakesByEnvironment,
    getStakeStats,
    refresh: fetchStakeInfos,
  };
}
