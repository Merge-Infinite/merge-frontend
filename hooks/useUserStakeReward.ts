import { suiClient } from "@/lib/utils";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import {
  MER3_PACKAGE_ID,
  POOL_REWARDS_MODULE_NAME,
  POOL_SYSTEM,
} from "@/utils/constants";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

export interface UserRewardDetails {
  poolId: string;
  totalRewards: number;
  claimableRewards: number;
  stakedAmount: number;
  isEligible: boolean;
  lastUpdateTime: number;
}

interface UsePoolSystemOptions {
  network?: "mainnet" | "testnet" | "devnet";
  packageId?: string;
  poolSystemId?: string;
  poolId?: string;
  refreshInterval?: number; // in milliseconds
  fetchUserRewards?: boolean; // Option to enable/disable user reward fetching
}

interface UsePoolSystemReturn {
  userRewards: UserRewardDetails[];
  loading: boolean;
  error: string | null;
  getUserRewardDetails: (poolId: string) => UserRewardDetails | undefined;
}

export const useUserStakeReward = (
  options: UsePoolSystemOptions = {}
): UsePoolSystemReturn => {
  const { refreshInterval = 30000, poolId, fetchUserRewards = true } = options;
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const [userRewards, setUserRewards] = useState<UserRewardDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("userRewards", poolId);

  const fetchUserRewardDetails = useCallback(
    async (poolId: string | undefined): Promise<UserRewardDetails | null> => {
      try {
        if (!address || !poolId) {
          return null;
        }

        console.log("fetching user reward details for poolId", poolId);
        const tx = new Transaction();
        tx.moveCall({
          target: `${MER3_PACKAGE_ID}::${POOL_REWARDS_MODULE_NAME}::get_user_reward_details`,
          arguments: [
            tx.object(POOL_SYSTEM),
            tx.object(poolId),
            tx.pure.address(address),
            tx.object("0x6"),
          ],
        });

        const result = await suiClient.devInspectTransactionBlock({
          transactionBlock: tx.serialize(),
          sender: address,
        });

        if (!result.results?.[0]?.returnValues) {
          return null;
        }

        const [
          totalRewards,
          claimableRewards,
          stakedAmount,
          isEligible,
          lastUpdateTime,
        ] = result.results[0].returnValues;

        return {
          poolId,
          totalRewards: Number(totalRewards),
          claimableRewards: Number(claimableRewards),
          stakedAmount: Number(stakedAmount),
          isEligible: Boolean(isEligible),
          lastUpdateTime: Number(lastUpdateTime),
        };
      } catch (err) {
        console.error(`Error fetching user reward details for ${poolId}:`, err);
        return null;
      }
    },
    [suiClient, address, poolId]
  );

  const getUserRewardDetails = useCallback(
    (poolId: string): UserRewardDetails | undefined => {
      return userRewards.find((reward) => reward.poolId === poolId);
    },
    [userRewards]
  );

  // Initial fetch
  useEffect(() => {
    if (poolId) {
      fetchUserRewardDetails(poolId);
    }
  }, [poolId]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchUserRewardDetails, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchUserRewardDetails]);

  return {
    userRewards,
    getUserRewardDetails,
    loading,
    error,
  };
};
