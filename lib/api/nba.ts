import api from "@/lib/api-client";
import { router } from "react-query-kit";

// Types for API responses
export interface TeamData {
  teamId: number;
  name: string;
  tier: number;
  rarity: number;
  supplyLimit: number;
  totalMinted: number;
  remaining: number;
  percentageMinted: number;
  isSoldOut: boolean;
  imageUrl: string | null;
  logoUrl: string | null;
  count: number;
}

export interface TierByData {
  tier: number;
  count: number;
  teams: TeamData[];
}

export interface TeamByData {
  teamId: number;
  teamName: string;
  tier: number;
  count: number;
}

export interface UserNftsData {
  totalOwned: number;
  byTier: TierByData[];
  byTeam: TeamByData[];
}

export interface TiersUserData {
  overall: {
    totalMinted: number;
  };
  userNFTs: {
    totalOwned: number;
  };
}

const nbaApi = router("nba", {
  // Mint NBA NFT
  mint: router.mutation({
    mutationFn: async (variables: {
      transactionBlockBytes: string;
      userSignature: string;
    }) => api.post("/nba/mint", variables),
  }),
  // Get user's owned NFTs
  getUserNfts: router.query({
    fetcher: async () => api.get<UserNftsData>("/nba/user/nfts"),
  }),
  // Get user's tier statistics
  getTiersUser: router.query({
    fetcher: async () => api.get<TiersUserData>("/nba/tiers/user"),
  }),
});

export default nbaApi;
