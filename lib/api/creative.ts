import api from "@/lib/api-client";
import { router } from "react-query-kit";

const creativeApi = router("creative", {
  // Get verification types (Step 1)
  mint: router.mutation({
    mutationFn: async (variables: {
      topic: string;
      creatureName: string;
      selectedElements: Record<string, any[]>;
      data: {
        transactionBlockBytes: string;
        signature: string;
      };
    }) => api.post("/creative/generate-nft", variables),
  }),
  getNftJob: router.query({
    fetcher: async () => api.get("/creative/nft-jobs"),
  }),
});

export default creativeApi;
