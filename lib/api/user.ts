import api from "@/lib/api-client";
import { router } from "react-query-kit";

const userApi = router("user", {
  getElement: router.query({
    fetcher: async (variables: { itemId: number }) =>
      api.get(`/user/element/${variables.itemId}`),
  }),
});

export default userApi;
