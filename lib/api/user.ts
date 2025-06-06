import api from "@/lib/api-client";
import { router } from "react-query-kit";

const userApi = router("user", {
  getElements: router.mutation({
    mutationFn: async (variables: { elementIds: number[] }) =>
      api.post(`/user/elements`, variables),
  }),
});

export default userApi;
