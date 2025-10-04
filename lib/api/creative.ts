import api from "@/lib/api-client";
import { router } from "react-query-kit";

const creativeApi = router("creative", {
  // Get verification types (Step 1)
  mint: router.mutation({
    mutationFn: async (variables: {
      topic: string;
      creatureName: string;
      selectedElements: Record<string, any[]>;
      elementInfos: {
        itemId: string;
        amount: number;
      }[];
      prompt: any;
      data: {
        transactionBlockBytes: string;
        signature: string;
        coinType: string;
      };
    }) => api.post("/creative/generate-nft", variables),
  }),
  getNftJob: router.query({
    fetcher: async () => api.get("/creative/nft-jobs"),
  }),
  updateNftName: router.mutation({
    mutationFn: async (variables: { jobId: number; name: string }) =>
      api.post("/creative/update-nft-name", variables),
  }),
  updateNftPrompt: router.mutation({
    mutationFn: async (variables: { jobId: number; prompt: string }) =>
      api.post("/creative/update-nft-prompt", variables),
  }),
  getSupportedTokens: router.query({
    fetcher: async () => api.get("/creative/supported-tokens"),
  }),
});

export default creativeApi;
