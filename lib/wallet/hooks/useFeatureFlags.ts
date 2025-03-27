import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FeatureFlagNetwork, FeatureFlagRes } from "../api";
import { RootState } from "../store";
import { updateFeatureFlag } from "../store/feature-flag";
import defaultFeatureFlags from "../store/feature-flag/default-feature-flags.json";

export function useFeatureFlags(): FeatureFlagRes {
  const featureFlag = useSelector((state: RootState) => state.featureFlag);
  return featureFlag.flags;
}

/**
 * useFeatureFlags for the active network
 */
export function useFeatureFlagsWithNetwork(): FeatureFlagNetwork {
  const appContext = useSelector((state: RootState) => state.appContext);
  const featureFlags = useFeatureFlags();
  return featureFlags?.networks[appContext.networkId];
}

// for provider
export function useAutoLoadFeatureFlags() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (defaultFeatureFlags) {
      // update redux store
      dispatch(updateFeatureFlag(defaultFeatureFlags));
    }
  }, [defaultFeatureFlags]);

  return defaultFeatureFlags;
}
