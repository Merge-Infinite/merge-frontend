import api from "@/lib/api-client";
import { router } from "react-query-kit";

const userApi = router("user", {
  getElements: router.mutation({
    mutationFn: async (variables: { elementIds: number[] }) =>
      api.post(`/user/elements`, variables),
  }),
  getSuiPrice: router.query({
    fetcher: async () => api.get(`/sui/price`),
  }),
});

export default userApi;
