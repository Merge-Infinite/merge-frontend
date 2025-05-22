// hooks/useNFTList.ts
import { suiClient } from "@/lib/utils";
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

  // Fetch NFTs owned by the connected wallet
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
