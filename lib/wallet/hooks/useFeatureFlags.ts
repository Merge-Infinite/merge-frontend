import { useSelector } from "react-redux";
import { FeatureFlagNetwork, FeatureFlagRes } from "../api";
import { RootState } from "../store";
import defaultFeatureFlags from "../store/feature-flag/default-feature-flags.json";
export function useFeatureFlags(): FeatureFlagRes {
  const featureFlag = useSelector((state: RootState) => state.featureFlag);
  return featureFlag.flags || defaultFeatureFlags;
}

/**
 * useFeatureFlags for the active network
 */
export function useFeatureFlagsWithNetwork(): FeatureFlagNetwork {
  const appContext = useSelector((state: RootState) => state.appContext);
  const featureFlags = useFeatureFlags();
  return (
    featureFlags?.networks[appContext.networkId] ||
    defaultFeatureFlags.networks["mainnet"]
  );
}

// for provider
// export function useAutoLoadFeatureFlags() {
//   const dispatch = useDispatch();
//   const data = defaultFeatureFlags;

//   useEffect(() => {
//     if (data) {
//       dispatch(updateFeatureFlag(data));
//     }
//   }, [data]);

//   return data;
// }
