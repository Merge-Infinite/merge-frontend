// hooks/useNFTList.ts
import { suiClient } from "@/lib/utils";
import { MER3_UPGRADED_PACKAGE_ID } from "@/utils/constants";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Initialize SUI client

export interface NFT {
  id: string;
  name: string;
  amount: number | string;
  owner?: string;
}

interface UseNFTListOptions {
  structType: string;
  refreshInterval?: number;
  autoFetch?: boolean;
  walletAddress?: string;
}

export function useNFTList(options?: UseNFTListOptions) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Default options
  const { refreshInterval, autoFetch = true, walletAddress } = options || {};

  const getUserStakedNFTs = useCallback(
    async (userAddress: string): Promise<any[]> => {
      try {
        // Get all NFTStaked events for this user
        const stakedEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${MER3_UPGRADED_PACKAGE_ID}::pool_rewards::NFTStaked`,
            Sender: userAddress,
          },
          limit: 1000,
          order: "ascending",
        });

        // Get all NFTUnstaked events for this user
        const unstakedEvents = await suiClient.queryEvents({
          query: {
            MoveEventType: `${MER3_UPGRADED_PACKAGE_ID}::pool_rewards::NFTUnstaked`,
            Sender: userAddress,
          },
          limit: 1000,
          order: "ascending",
        });

        // Create a map of unstaked NFT IDs
        const unstakedNFTIds = new Set<string>();
        for (const event of unstakedEvents.data) {
          if (event.parsedJson && typeof event.parsedJson === "object") {
            const nftId = (event.parsedJson as any).nft_id;
            if (nftId) {
              unstakedNFTIds.add(nftId);
            }
          }
        }

        // Filter out unstaked NFTs and get current staked NFTs
        const currentlyStakedNFTs: any[] = [];
        const currentTime = Date.now();

        for (const event of stakedEvents.data) {
          if (event.parsedJson && typeof event.parsedJson === "object") {
            const eventData = event.parsedJson as any;
            const nftId = eventData.nft_id;

            // Skip if this NFT has been unstaked
            if (unstakedNFTIds.has(nftId)) {
              continue;
            }

            const stakeTime = Number(eventData.stake_time);
            const stakeDurationMs = currentTime - stakeTime;
            const stakeDurationHours = Math.floor(
              stakeDurationMs / (1000 * 60 * 60)
            );

            // Get additional NFT data
            const nftData = await this.getNFTData(nftId);

            const stakedNFT: StakedNFT = {
              id: nftId, // Using nft_id as the main identifier
              nftId: nftId,
              owner: eventData.owner,
              poolId: eventData.pool_id,
              poolName,
              stakeTime,
              weight: stakeDurationHours > 0 ? stakeDurationHours : 1, // Weight calculation from contract
              stakeDurationMs,
              stakeDurationHours,
              nftData,
            };

            currentlyStakedNFTs.push(stakedNFT);
          }
        }

        return currentlyStakedNFTs;
      } catch (error) {
        console.error("Error fetching user staked NFTs:", error);
        throw new Error(`Failed to fetch staked NFTs: ${error}`);
      }
    },
    [walletAddress]
  );

  const fetchNFTs = useCallback(async () => {
    if (!walletAddress || !options?.structType) {
      setError(new Error("No wallet address or struct type available"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query owned objects
      const { data } = await suiClient.getOwnedObjects({
        owner: walletAddress,
        filter: {
          StructType: options?.structType,
        },
        options: {
          showContent: true,
          showDisplay: true,
        },
      });
      if (data && data.length > 0) {
        console.log(data);

        setNfts(data);
      } else {
        setNfts([]);
      }
    } catch (err) {
      console.error("Error fetching NFTs:", err);
      toast.error("Error fetching NFTs");
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Fetch NFTs for a specific address (useful for viewing other wallets)
  const fetchNFTsForAddress = useCallback(
    (address: string) => {
      return fetchNFTs();
    },
    [fetchNFTs]
  );

  // Auto-fetch when wallet changes if autoFetch is enabled
  useEffect(() => {
    if (walletAddress && autoFetch) {
      fetchNFTs();
    }
  }, [walletAddress, autoFetch, fetchNFTs]);

  // Set up auto-refresh if interval is specified
  useEffect(() => {
    if (refreshInterval && walletAddress) {
      const intervalId = setInterval(() => {
        fetchNFTs();
      }, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, walletAddress, fetchNFTs]);

  // Find an NFT by its ID
  const getNFTById = useCallback(
    (id: string) => {
      return nfts.find((nft) => nft.id === id) || null;
    },
    [nfts]
  );

  // Get detailed info for a specific NFT
  const getNFTDetails = useCallback(
    async (nftId: string): Promise<NFT | null> => {
      try {
        const { data } = await suiClient.getObject({
          id: nftId,
          options: {
            showContent: true,
            showDisplay: true,
            showOwner: true,
          },
        });

        if (!data) return null;

        const display = data.display?.data;
        let owner = "";
        if (data.owner && "AddressOwner" in data.owner) {
          owner = data.owner.AddressOwner;
        }

        return {
          id: nftId,
          name: display?.name || "Unnamed NFT",

          owner,
        };
      } catch (err) {
        console.error("Error fetching NFT details:", err);
        return null;
      }
    },
    []
  );

  return {
    nfts,
    loading,
    error,
    fetchNFTs,
    fetchNFTsForAddress,
    getNFTById,
    getNFTDetails,
    refresh: fetchNFTs,
  };
}
