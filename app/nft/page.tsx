"use client";
import Emoji from "@/components/common/Emoji";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NFTImage } from "@/components/ui/nft-image";
import useApi from "@/hooks/useApi";
import { useLoading } from "@/hooks/useLoading";
import { useNFTList } from "@/hooks/useNFTList";
import { Pool, usePoolSystem } from "@/hooks/usePool";
import { useStakeInfoList } from "@/hooks/useStakeInfoList";
import { useUser } from "@/hooks/useUser";
import { SendAndExecuteTxParams, TxEssentials } from "@/lib/wallet/core";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import {
  CREATURE_NFT_MODULE_NAME,
  MER3_PACKAGE_ID,
  MER3_UPGRADED_PACKAGE_ID,
  POOL_REWARDS_MODULE_NAME,
  POOL_SYSTEM,
} from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { formatAddress } from "@mysten/sui.js";
import { Transaction } from "@mysten/sui/transactions";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useUniversalApp } from "../context/UniversalAppContext";
import {
  MAX_FREE_SLOTS,
  MAX_SUBSCRIPTION_SLOTS_PER_TIER,
} from "../universe/page";

interface InventoryItem {
  id: string;
  name: string;
  imageUrl: string;
}

export default function InventoryStakingInterface() {
  const searchParams = useSearchParams();
  const poolId = searchParams.get("poolId");
  const { getPoolById, pools } = usePoolSystem({
    refreshInterval: 3000,
  });

  const { isLoading, startLoading, stopLoading } = useLoading();
  const apiClient = useApiClient();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const router = useRouter();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const { data: network } = useNetwork(appContext.networkId);
  const account = useCurrentAccount();

  const { backButton, isTelegram, isReady } = useUniversalApp();
  const { stakeStats, refreshRewards } = useStakeInfoList({
    walletAddress: isTelegram ? address : account?.address || "",
    poolId: poolId || undefined,
    includeNFTDetails: true,
    refreshInterval: undefined,
  });

  const firstRender = useRef(false);
  // Track pending stakes to prevent concurrent staking beyond limit
  const [pendingStakes, setPendingStakes] = useState<Set<string>>(new Set());
  const [optimisticStakeCount, setOptimisticStakeCount] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);

  // Sync optimistic count with actual count when stakeStats updates
  useEffect(() => {
    if (stakeStats?.nftCount !== undefined) {
      setOptimisticStakeCount(stakeStats.nftCount);
      // Clear pending stakes when we get fresh data from the contract
      setPendingStakes(new Set());
    }
  }, [stakeStats?.nftCount]);

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.show();
        backButton.on("click", () => {
          router.back();
        });
      }
    }
  }, [isReady, isTelegram, backButton]);

  const { user } = useUser();
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction({
      execute: async ({ bytes, signature }) =>
        await client.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showRawEffects: true,
            showObjectChanges: true,
          },
        }),
    });
  const {
    nfts: creatureNfts,
    loading: creatureNftsLoading,
    refresh,
  } = useNFTList({
    walletAddress: isTelegram ? address : account?.address || "",
    refreshInterval: 3000,
    autoFetch: true,
    structType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::${"CreatureNFT"}`,
  });

  useEffect(() => {
    if (!authed && isTelegram) {
      setOpenAuthDialog(true);
    }
  }, [authed, appContext.accountId, isTelegram]);

  useEffect(() => {
    if (!address && authed && isTelegram) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [address, authed, isTelegram]);

  function calculateAvailableSlots(
    subscriptionMonths: number | null | undefined
  ): number {
    // Base free slots are always available
    console.log("subscriptionMonths", subscriptionMonths);
    let totalSlots = MAX_FREE_SLOTS;

    if (!subscriptionMonths || subscriptionMonths <= 0) {
      return totalSlots;
    }

    // Add slots based on subscription duration
    if (subscriptionMonths > 0 && subscriptionMonths <= 1) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 1 Month tier
    }

    if (subscriptionMonths > 1 && subscriptionMonths <= 3) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 3 Month tier
    }

    if (subscriptionMonths > 3 && subscriptionMonths <= 6) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 6 Month tier
    }
    if (subscriptionMonths > 6 && subscriptionMonths <= 12) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 12 Month tier
    }

    return totalSlots;
  }

  const recipesApi = useApi({
    key: ["recipes-items"],
    method: "POST",
    url: "recipes/items",
  }).post;

  useEffect(() => {
    const fetchItems = async () => {
      if (!poolId) return;
      const poolInfo = poolId ? getPoolById(poolId) : undefined;
      if (!poolInfo) return;

      try {
        const response = await recipesApi?.mutateAsync({
          itemIds: poolInfo?.requiredElements,
        });

        if (response.items) {
          setItems(response.items);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
    firstRender.current = true;
  }, [pools]);

  const availableSlots = useMemo(() => {
    const subscriptionEndDate =
      user?.userBalance?.subscriptionEndDate &&
      new Date(user?.userBalance?.subscriptionEndDate);

    const subscriptionMonths =
      subscriptionEndDate &&
      (subscriptionEndDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24 * 30);
    return calculateAvailableSlots(subscriptionMonths);
  }, [user]);

  const handleStakeNFT = useCallback(
    async (
      nftId: string,
      nftElements: number[],
      poolInfo: Pool | undefined
    ) => {
      try {
        // Check if this NFT is already being staked
        if (pendingStakes.has(nftId)) {
          toast.error("This NFT is already being staked. Please wait.");
          return;
        }

        if (!address && authed && isTelegram) {
          toast.error("No address found");
          return;
        }
        if (!isTelegram && !account?.address) {
          toast.error("No address found");
          return;
        }

        if (
          poolInfo?.requiredElements &&
          !poolInfo.requiredElements.every((element) =>
            nftElements.includes(element)
          )
        ) {
          toast.error("NFT does not contain all required elements.");
          return;
        }

        // Use optimistic count for limit check
        const currentCount = Math.max(
          optimisticStakeCount,
          stakeStats?.nftCount || 0
        );
        if (availableSlots <= currentCount) {
          toast.error(
            `You have reached the maximum number of NFTs. You can stake ${availableSlots} NFTs.`
          );
          return;
        }

        // Add to pending stakes and update optimistic count
        setPendingStakes((prev) => new Set(prev).add(nftId));
        setOptimisticStakeCount((prev) => prev + 1);

        startLoading();

        let tx = new Transaction();

        tx.moveCall({
          target: `${MER3_UPGRADED_PACKAGE_ID}::${POOL_REWARDS_MODULE_NAME}::${"stake_nft"}`,
          arguments: [
            tx.object(POOL_SYSTEM),
            tx.object(poolId || ""),
            tx.object(nftId),
            tx.object("0x6"),
          ],
        });
        let response;
        if (isTelegram) {
          response = await apiClient.callFunc<
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
        } else {
          response = await signAndExecuteTransaction({
            transaction: tx.serialize(),
          });
        }

        if (response && (response as any).digest) {
          toast.success("NFT staked successfully!");
          await refreshRewards();
        }
      } catch (error: any) {
        // Revert optimistic updates on error
        setPendingStakes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nftId);
          return newSet;
        });
        setOptimisticStakeCount((prev) => Math.max(0, prev - 1));

        if (error.message.includes('Some("validate_nft_requirements") }, 12')) {
          toast.error("NFT is not containing the required elements");
          return;
        }
        console.error("Error creating kiosk:", error);
        if (error.message === "Authentication required") {
          setOpenAuthDialog(true);
        } else {
          toast.error(error.message || "Error creating kiosk");
        }
      } finally {
        stopLoading();
        // Remove from pending stakes after operation completes
        setPendingStakes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(nftId);
          return newSet;
        });
      }
    },
    [
      address,
      authed,
      availableSlots,
      stakeStats?.nftCount,
      optimisticStakeCount,
      pendingStakes,
      isTelegram,
      account?.address,
    ]
  );

  const filteredNfts = useMemo(
    () =>
      creatureNfts
        .map(({ data }) => {
          const metadata = data?.content?.fields.metadata;
          const poolInfo = poolId ? getPoolById(poolId) : undefined;
          return {
            id: data!.objectId,
            name: metadata?.fields?.name || "Creature NFT",
            imageUrl: metadata?.fields?.image_uri || "",
            elements: metadata?.fields?.material_items.map((item: any) =>
              Number(item.fields.item_id)
            ),
            poolInfo,
          };
        })
        .filter(
          (card) =>
            card.poolInfo?.requiredElements &&
            card.poolInfo.requiredElements.every((element) =>
              card.elements.includes(element)
            )
        ),
    [creatureNfts, poolId]
  );

  return (
    <div className="min-h-screen bg-black p-4 w-full">
      <div className="flex flex-col gap-4 h-full w-full">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <Search className="w-5 h-5 text-white opacity-95" />
          </div>
          <Input
            placeholder="Search items..."
            className="h-10 pl-12 pr-3 bg-neutral-900 border-neutral-700 rounded-[32px] text-neutral-500 placeholder:text-neutral-500 font-sora text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {creatureNftsLoading && !firstRender.current ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredNfts.length === 0 ? (
          <div className="self-stretch inline-flex flex-col justify-center items-center gap-2">
            <Image
              src="/images/empty.svg"
              alt="No NFT"
              width={64}
              height={64}
            />
            <div className="self-stretch inline-flex flex-col justify-center items-center gap-2">
              <div className="self-stretch text-center justify-start text-[#858585] text-sm font-bold font-['Sora'] leading-normal">
                You dont have any eligible NFTs
              </div>
              <div className="self-stretch text-center justify-center items-center text-[#858585] text-sm font-normal font-['Sora'] leading-normal">
                Make sure you own at least one NFT that includes these required
                elements:{" "}
                <div className="flex gap-2 justify-center">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="text-center justify-start text-white text-xs font-bold font-sora leading-none"
                    >
                      <Emoji emoji={item.emoji} size={18} /> {item.handle} (1)
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
            {filteredNfts.map((card, index) => (
              <NFTCard
                key={index}
                item={card}
                nftElements={card.elements}
                poolInfo={card.poolInfo}
                handleStakeNFT={handleStakeNFT}
                isLoading={isLoading}
                availableSlots={Number(availableSlots)}
                nftCount={Number(stakeStats?.nftCount)}
                optimisticStakeCount={optimisticStakeCount}
                isPending={pendingStakes.has(card.id)}
              />
            ))}
          </div>
        )}
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

const NFTCard = ({
  item,
  handleStakeNFT,
  isLoading,
  availableSlots,
  nftCount,
  optimisticStakeCount,
  isPending,
  nftElements,
  poolInfo,
}: {
  item: InventoryItem;
  handleStakeNFT: (
    id: string,
    nftElements: number[],
    poolInfo: Pool | undefined
  ) => void;
  isLoading: boolean;
  availableSlots: number;
  nftCount: number | undefined;
  optimisticStakeCount: number;
  isPending: boolean;
  nftElements: number[];
  poolInfo: Pool | undefined;
}) => {
  return (
    <div className="w-44 flex flex-col items-center gap-2">
      <Card className="w-44 h-44 bg-neutral-800 border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-0 h-full flex justify-center items-center">
          <NFTImage
            className="w-44 h-44 object-cover"
            src={item.imageUrl}
            alt={item.name}
            width={176}
            height={176}
          />
        </CardContent>
      </Card>

      <div className="text-green-400 text-sm font-normal font-sora underline leading-normal">
        #{formatAddress(item.id)}
      </div>

      <div className="text-white text-sm font-normal font-sora leading-normal text-center">
        {item.name}
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="w-44 h-6 px-4 bg-white text-black hover:bg-gray-200 rounded-3xl text-xs font-normal font-sora uppercase"
        onClick={() => handleStakeNFT(item.id, nftElements, poolInfo)}
        disabled={
          isLoading ||
          isPending ||
          nftCount === undefined ||
          nftCount === null ||
          availableSlots === undefined ||
          availableSlots === null ||
          (nftCount !== undefined &&
            availableSlots <= Math.max(nftCount, optimisticStakeCount))
        }
        isLoading={isLoading || isPending}
      >
        {isPending
          ? "Staking..."
          : nftCount !== undefined &&
            availableSlots <= Math.max(nftCount, optimisticStakeCount)
          ? "Max Slots Reached"
          : "Stake"}
      </Button>
    </div>
  );
};
