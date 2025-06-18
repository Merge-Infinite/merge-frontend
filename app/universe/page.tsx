"use client";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/hooks/useLoading";
import { Pool, usePoolSystem } from "@/hooks/usePool";
import { StakeInfo, useStakeInfoList } from "@/hooks/useStakeInfoList";
import { useUser } from "@/hooks/useUser";
import { formatTimeRemaining } from "@/lib/utils";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import {
  MER3_PACKAGE_ID,
  POOL_REWARDS_MODULE_NAME,
  POOL_SYSTEM,
} from "@/utils/constants";
import { formatAddress, MIST_PER_SUI } from "@mysten/sui.js";
import { Transaction } from "@mysten/sui/transactions";
import { initBackButton } from "@telegram-apps/sdk";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

interface StatsItem {
  icon: React.ReactNode;
  value: number;
}

interface PetSlot {
  id: string;
  isEnabled: boolean;
  isOccupied: boolean;
  stakeInfo?: StakeInfo;
  slotIndex: number;
}

interface SubscriptionTier {
  duration: string;
  slots: PetSlot[];
}

const MAX_FREE_SLOTS = 3;
const MAX_SUBSCRIPTION_SLOTS_PER_TIER = 3;

export default function PetExplorerDashboard() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const poolId = searchParams.get("poolId");
  const [backButton] = initBackButton();
  const router = useRouter();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const [pool, setPool] = useState<Pool | null>(null);
  const { getPoolById, pools } = usePoolSystem({
    refreshInterval: 30000,
  });

  const { stakeInfos, loading, error, stakeStats, refresh } = useStakeInfoList({
    walletAddress: address,
    poolId: poolId || undefined,
    includeNFTDetails: true,
    refreshInterval: undefined,
  });

  useEffect(() => {
    if (!authed) {
      setOpenAuthDialog(true);
    }
  }, [authed, appContext.accountId]);

  useEffect(() => {
    if (!address && authed) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [address, authed]);

  useEffect(() => {
    backButton.show();
    backButton.on("click", () => {
      router.back();
    });
  }, []);

  useEffect(() => {
    if (!pool && poolId) {
      const foundPool = getPoolById(poolId);
      if (foundPool) {
        setPool(foundPool);
      }
    }
  }, [pool, poolId, pools]);

  const participationStats: StatsItem[] = [
    {
      icon: (
        <Image src="/images/friend.svg" alt="User" width={24} height={24} />
      ),
      value: pool?.participantCount || 0,
    },
    {
      icon: <Image src="/images/nft.svg" alt="User" width={24} height={24} />,
      value: pool?.totalStakedCount || 0,
    },
  ];

  const rewardStats: StatsItem[] = [
    {
      icon: <Image src="/images/sui.svg" alt="User" width={24} height={24} />,
      value:
        (
          (Number(stakeStats?.totalWeight) /
            Number(pool?.totalStakedCount || 0)) *
          ((Number(pool?.suiRewards) / Number(MIST_PER_SUI)) * 2.78)
        ).toFixed(4) || 0,
    },
    {
      icon: <Image src="/images/m3r8.svg" alt="User" width={24} height={24} />,
      value:
        (
          ((Number(stakeStats?.totalWeight) /
            Number(pool?.totalStakedCount || 0)) *
            ((Number(pool?.suiRewards) / Number(MIST_PER_SUI)) *
              2.78 *
              5 *
              30)) /
          100 /
          0.03
        ).toFixed(4) || 0,
    },
    {
      icon: (
        <Image src="/images/energy.svg" alt="User" width={24} height={24} />
      ),
      value:
        (
          ((Number(stakeStats?.totalWeight) /
            Number(pool?.totalStakedCount || 0)) *
            ((Number(pool?.suiRewards) / Number(MIST_PER_SUI)) * 2.78 * 5)) /
          2 /
          0.05
        ).toFixed(4) || 0,
    },
  ];

  // Create free pet slots with stake info
  const freePetSlots: PetSlot[] = useMemo(() => {
    const slots: PetSlot[] = [];

    for (let i = 0; i < MAX_FREE_SLOTS; i++) {
      const stakeInfo = stakeInfos[i] || null;
      slots.push({
        id: `free-${i + 1}`,
        isEnabled: true,
        isOccupied: !!stakeInfo,
        stakeInfo: stakeInfo,
        slotIndex: i,
      });
    }

    return slots;
  }, [stakeInfos]);

  // Create subscription tier slots
  const subscriptionTiers: SubscriptionTier[] = useMemo(() => {
    const remainingStakes = stakeInfos.slice(MAX_FREE_SLOTS);
    let stakeIndex = 0;
    const subscriptionEndDate =
      user?.userBalance?.subscriptionEndDate &&
      new Date(user?.userBalance?.subscriptionEndDate);

    const subscriptionMonths =
      subscriptionEndDate &&
      Math.floor(
        (subscriptionEndDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );

    return [
      {
        duration: "1 Month",
        slots: Array.from(
          { length: MAX_SUBSCRIPTION_SLOTS_PER_TIER },
          (_, i) => {
            const stakeInfo = remainingStakes[stakeIndex] || null;
            if (stakeInfo) stakeIndex++;

            return {
              id: `1m-${i + 1}`,
              isEnabled: subscriptionMonths >= 1,
              isOccupied: !!stakeInfo,
              stakeInfo: stakeInfo,
              slotIndex: MAX_FREE_SLOTS + i,
            };
          }
        ),
      },
      {
        duration: "3 Month",
        slots: Array.from(
          { length: MAX_SUBSCRIPTION_SLOTS_PER_TIER },
          (_, i) => {
            const stakeInfo = remainingStakes[stakeIndex] || null;
            if (stakeInfo) stakeIndex++;

            return {
              id: `3m-${i + 1}`,
              isEnabled: subscriptionMonths >= 3,
              isOccupied: !!stakeInfo,
              stakeInfo: stakeInfo,
              slotIndex: MAX_FREE_SLOTS + MAX_SUBSCRIPTION_SLOTS_PER_TIER + i,
            };
          }
        ),
      },
      {
        duration: "6 Month",
        slots: Array.from(
          { length: MAX_SUBSCRIPTION_SLOTS_PER_TIER },
          (_, i) => {
            const stakeInfo = remainingStakes[stakeIndex] || null;
            if (stakeInfo) stakeIndex++;

            return {
              id: `6m-${i + 1}`,
              isEnabled: subscriptionMonths >= 6,
              isOccupied: !!stakeInfo,
              stakeInfo: stakeInfo,
              slotIndex:
                MAX_FREE_SLOTS + MAX_SUBSCRIPTION_SLOTS_PER_TIER * 2 + i,
            };
          }
        ),
      },
      {
        duration: "12 Month",
        slots: Array.from(
          { length: MAX_SUBSCRIPTION_SLOTS_PER_TIER },
          (_, i) => {
            const stakeInfo = remainingStakes[stakeIndex] || null;
            if (stakeInfo) stakeIndex++;

            return {
              id: `12m-${i + 1}`,
              isEnabled: false,
              isOccupied: !!stakeInfo,
              stakeInfo: stakeInfo,
              slotIndex:
                MAX_FREE_SLOTS + MAX_SUBSCRIPTION_SLOTS_PER_TIER * 3 + i,
            };
          }
        ),
      },
    ];
  }, [stakeInfos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-4 flex items-center justify-center">
        <div className="text-white">Loading your pets...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto">
        <div className="flex flex-col gap-4">
          {/* Event Info Card */}
          <Card className="bg-black rounded-2xl">
            <CardContent className="p-2 space-y-2 outline outline-[#141414] rounded-2xl">
              {/* Prize and Time Info */}
              <div className="space-y-0">
                <div className="flex">
                  <span className="text-white text-xl font-normal font-sora uppercase leading-7">
                    💰 Total Prize:
                  </span>
                  <span className="text-green-400 text-xl font-normal font-sora uppercase leading-7">
                    {(
                      (Number(pool?.suiRewards) / Number(MIST_PER_SUI)) *
                      2.78 *
                      5
                    ).toFixed(2)}
                    $
                  </span>
                </div>
                <div className="flex">
                  <span className="text-white text-xl font-normal font-sora uppercase leading-7">
                    ⏳ Event time:
                  </span>
                  <span className="text-purple-400 text-xl font-normal font-sora uppercase leading-7">
                    {pool?.endTime ? formatTimeRemaining(pool?.endTime) : "N/A"}
                  </span>
                </div>
              </div>

              {/* Participation Stats */}
              <Card className="bg-neutral-900 border-0 rounded-2xl bg-[#141414]">
                <CardContent className="p-2">
                  <div className="text-white text-sm font-normal font-sora leading-normal tracking-wide mb-2">
                    Number of players and pets participating in the exploration.
                  </div>
                  <div className="flex gap-4">
                    {participationStats.map((stat, index) => (
                      <div
                        key={index}
                        className="flex-1 flex items-center gap-1"
                      >
                        {stat.icon}
                        <span className="text-white text-sm font-normal font-sora">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Stats */}
              <Card className="bg-neutral-900 border-0 rounded-2xl bg-[#141414]">
                <CardContent className="p-2">
                  <div className="text-white text-sm font-normal font-sora leading-normal tracking-wide mb-2">
                    🤑 You have earned rewards by environment:
                  </div>
                  <div className="flex justify-between">
                    {rewardStats.map((stat, index) => (
                      <div key={index} className="flex items-center gap-1">
                        {stat.icon}
                        <span className="text-white text-sm font-normal font-sora">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="nfts" className="w-full">
            <TabsList className="flex justify-start gap-6 bg-transparent">
              <TabsTrigger
                value="nfts"
                className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
              >
                NFTs ({stakeStats?.totalStakes || 0})
              </TabsTrigger>
              <TabsTrigger
                value="reward"
                className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
              >
                Reward
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nfts" className="space-y-4 mt-4 w-full">
              {/* Free Pet Slots */}
              <div className="flex flex-col gap-2">
                <div className="text-white text-sm font-normal font-sora leading-normal tracking-wide">
                  Take your pet to explore 🧐 (
                  {freePetSlots.filter((slot) => slot.isOccupied).length}/
                  {MAX_FREE_SLOTS} occupied)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {freePetSlots.map((slot) => (
                    <PetSlotCard
                      key={slot.id}
                      slot={slot}
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              </div>

              {/* Subscription Tiers */}
              {subscriptionTiers.map((tier) => (
                <div key={tier.duration} className="space-y-2">
                  <div className="text-white text-sm font-normal font-sora leading-normal tracking-wide">
                    Activate {tier.duration} Subscription <br />
                    to open slots (
                    {tier.slots.filter((slot) => slot.isOccupied).length}/
                    {MAX_SUBSCRIPTION_SLOTS_PER_TIER} occupied)
                  </div>
                  <div className="flex gap-2">
                    {tier.slots.map((slot) => (
                      <PetSlotCard
                        key={slot.id}
                        slot={slot}
                        onRefresh={refresh}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="reward" className="mt-4">
              <div className="space-y-4">
                <div className="text-white text-lg font-semibold">
                  Staking Rewards Summary
                </div>

                {stakeInfos.length > 0 ? (
                  <div className="space-y-3">
                    {stakeInfos.map((stakeInfo) => (
                      <Card
                        key={stakeInfo.id}
                        className="bg-[#141414] border-neutral-800"
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-white font-medium">
                                {stakeInfo.displayData?.name ||
                                  `NFT ${stakeInfo.nftId.slice(-8)}`}
                              </div>
                              <div className="text-sm text-neutral-400">
                                Environment: {stakeInfo.environmentName}
                              </div>
                              <div className="text-sm text-neutral-400">
                                Staked: {stakeInfo.stakingDays} days
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-medium">
                                {stakeInfo.canClaimRewards
                                  ? "Ready!"
                                  : "Accumulating..."}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-white text-sm font-normal font-sora text-center py-8">
                    No staked NFTs found. Stake some NFTs to start earning
                    rewards!
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
        onSuccess={async () => {
          await refresh();
        }}
      />
    </div>
  );
}

const PetSlotCard = ({
  slot,
  onRefresh,
}: {
  slot: PetSlot;
  onRefresh: () => void;
}) => {
  const searchParams = useSearchParams();
  const poolId = searchParams.get("poolId");
  const { isLoading, startLoading, stopLoading } = useLoading();
  const apiClient = useApiClient();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const router = useRouter();
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const { data: network } = useNetwork(appContext.networkId);

  const handleSlotClick = () => {
    router.push(`/nft?poolId=${poolId}`);
  };

  const handleUnstakeClick = useCallback(
    async (stakeInfoId: string) => {
      try {
        if (!address && authed) {
          toast.error("No address found");
          return;
        }

        startLoading();

        let tx = new Transaction();

        tx.moveCall({
          target: `${MER3_PACKAGE_ID}::${POOL_REWARDS_MODULE_NAME}::${"unstake_nft"}`,
          arguments: [
            tx.object(POOL_SYSTEM),
            tx.object(poolId || ""),
            tx.object(stakeInfoId),
            tx.object("0x6"),
          ],
        });
        const response = await apiClient.callFunc<
          SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
          undefined
        >(
          "txn",
          "signAndExecuteTransactionBlock",
          {
            transactionBlock: tx.serialize(),
            context: {
              network,
              walletId: appContext.walletId,
              accountId: appContext.accountId,
            },
          },
          { withAuth: true }
        );

        if (response && (response as any).digest) {
          toast.success("NFT staked successfully!");
          await onRefresh();
        }
      } catch (error: any) {
        console.error("Error creating kiosk:", error);
        if (error.message === "Authentication required") {
        } else {
          toast.error(error.message || "Error creating kiosk");
        }
      } finally {
        stopLoading();
      }
    },
    [address, authed]
  );

  return (
    <div className="inline-flex flex-col justify-start items-center cursor-pointer w-full">
      {slot.isOccupied && slot.stakeInfo ? (
        <Card
          className="self-stretch bg-neutral-950/60 rounded-2xl"
          style={{ height: 210 }}
        >
          <CardContent className="inline-flex flex-col justify-start gap-1 h-full w-full p-0">
            <Image
              className="w-full h-[100px] object-cover rounded-2xl"
              src={`https://walrus.tusky.io/${slot.stakeInfo.displayData?.image_uri}`}
              alt={slot.stakeInfo.displayData?.name || "NFT"}
              width={112}
              height={80}
            />

            <div className="justify-start text-[#68ffd1] text-sm font-normal font-sora underline leading-normal">
              #{formatAddress(slot.stakeInfo.nftId)}
            </div>

            {/* NFT Name */}
            <div className="justify-start text-white text-sm font-normal font-sora leading-normal text-center">
              {slot.stakeInfo.displayData?.name ||
                `Pet ${slot.stakeInfo.nftId.slice(-6)}`}
            </div>

            <Button
              onClick={() => handleUnstakeClick(slot.stakeInfo?.id || "")}
              variant="secondary"
              size="sm"
              className="self-stretch h-6 px-4 bg-white rounded-3xl inline-flex justify-center items-center gap-2 hover:bg-gray-200 mx-auto w-full"
              disabled={isLoading}
              isLoading={isLoading}
            >
              <div className="text-center justify-start text-black text-xs font-normal font-sora uppercase leading-normal">
                Unstake
              </div>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card
          className="self-stretch bg-neutral-950/60 rounded-2xl border border-[#1f1f1f]"
          style={{ height: 190 }}
        >
          <CardContent className="px-4 pt-2 pb-6 inline-flex flex-col justify-center items-center gap-2 h-full w-full">
            <Button
              onClick={handleSlotClick}
              disabled={!slot.isEnabled}
              variant="secondary"
              size="sm"
              className="w-14 px-3 py-1 bg-white rounded-3xl inline-flex justify-center items-center gap-2 hover:bg-gray-200 disabled:bg-neutral-800 disabled:text-neutral-700"
            >
              <div className="justify-start text-black text-xs font-normal font-sora uppercase leading-normal disabled:text-neutral-700">
                +
              </div>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
