import api from "@/lib/api-client";
import { router } from "react-query-kit";

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
    fetcher: async () => api.get("/nba/user/nfts"),
  }),
  // Get user's tier statistics
  getTiersUser: router.query({
    fetcher: async () => api.get("/nba/tiers/user"),
  }),
});

export default nbaApi;
