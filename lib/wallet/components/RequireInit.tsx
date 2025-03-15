import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useEffectAdjustInitializedStatus } from "../hooks/useEffectAdjustInitializedStatus";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { AppDispatch, RootState } from "../store";
import { updateNetworkId } from "../store/app-context";
import { isNonEmptyArray } from "../utils/check";

function RequireInit({ children }: any) {
  const appContext = useSelector((state: RootState) => state.appContext);
  const dispatch = useDispatch<AppDispatch>();
  const featureFlags = useFeatureFlags();
  const adjustCurrentNetworkId = useCallback(async () => {
    console.log("featureFlags", featureFlags);
    const defaultNetwork = featureFlags?.default_network ?? "testnet";

    if (!appContext.networkId) {
      await dispatch(updateNetworkId(defaultNetwork));
      return;
    }

    // if current network is not in featureFlags.available_networks, switch to default network
    if (
      featureFlags &&
      isNonEmptyArray(featureFlags?.available_networks) &&
      !featureFlags.available_networks.includes(appContext.networkId)
    ) {
      await dispatch(updateNetworkId(defaultNetwork));
    }
  }, [featureFlags, appContext]);

  useEffectAdjustInitializedStatus(appContext);
  useEffect(() => {
    adjustCurrentNetworkId();
  }, [appContext.networkId, featureFlags]);

  return appContext.initialized ? (
    children
  ) : (
    <Navigate to={"/onboard"} replace />
  );
}

export default RequireInit;
