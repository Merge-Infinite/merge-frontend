"use client";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/hooks/useLoading";
import { useNFTList } from "@/hooks/useNFTList";
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
import { useCallback, useEffect, useMemo, useState } from "react";
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

  console.log("stakeStats", stakeStats);

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
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${MER3_UPGRADED_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::${"CreatureNFT"}`,
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
    let totalSlots = MAX_FREE_SLOTS;

    // If no subscription or invalid subscription months, return only free slots
    if (!subscriptionMonths || subscriptionMonths <= 0) {
      return totalSlots;
    }

    // Add slots based on subscription duration
    if (subscriptionMonths >= 1) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 1 Month tier
    }

    if (subscriptionMonths >= 3) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 3 Month tier
    }

    if (subscriptionMonths >= 6) {
      totalSlots += MAX_SUBSCRIPTION_SLOTS_PER_TIER; // 6 Month tier
    }

    return totalSlots;
  }

  const availableSlots = useMemo(() => {
    const subscriptionEndDate =
      user?.userBalance?.subscriptionEndDate &&
      new Date(user?.userBalance?.subscriptionEndDate);

    const subscriptionMonths =
      subscriptionEndDate &&
      Math.floor(
        (subscriptionEndDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );
    return calculateAvailableSlots(subscriptionMonths);
  }, [user]);

  const handleStakeNFT = useCallback(
    async (nftId: string) => {
      try {
        if (!address && authed && isTelegram) {
          toast.error("No address found");
          return;
        }
        if (!isTelegram && !account?.address) {
          toast.error("No address found");
          return;
        }

        if (availableSlots <= (stakeStats?.nftCount || 0)) {
          toast.error(
            `You have reached the maximum number of NFTs. You can stake ${availableSlots} NFTs.`
          );
          return;
        }
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
          await refresh();
          await refreshRewards();
        }
      } catch (error: any) {
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
      }
    },
    [
      address,
      authed,
      availableSlots,
      stakeStats?.nftCount,
      isTelegram,
      account?.address,
    ]
  );

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto h-[593px]">
        <div className="flex flex-col gap-4 h-full">
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

          {/* Category Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="flex justify-start gap-6 bg-transparent">
              <TabsTrigger
                value="all"
                className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="elements"
                className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
              >
                Elements
              </TabsTrigger>
              <TabsTrigger
                value="nft"
                className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
              >
                NFT
              </TabsTrigger>
            </TabsList>

            {/* All Items */}
            <TabsContent
              value="all"
              className="flex-1 mt-4 grid grid-cols-2 gap-4"
            >
              {creatureNftsLoading ? (
                <SkeletonCard />
              ) : (
                creatureNfts
                  .map(({ data }) => {
                    const metadata = data?.content?.fields.metadata;
                    return {
                      id: data!.objectId,
                      name: metadata?.fields?.name || "Creature NFT",
                      imageUrl: metadata?.fields?.image_uri || "",
                    };
                  })
                  .map((card, index) => (
                    <NFTCard
                      key={index}
                      item={card}
                      handleStakeNFT={handleStakeNFT}
                      isLoading={isLoading}
                      availableSlots={Number(availableSlots)}
                      nftCount={Number(stakeStats?.nftCount)}
                    />
                  ))
              )}
            </TabsContent>

            {/* Elements Only */}
            <TabsContent value="elements" className="flex-1 mt-4"></TabsContent>

            {/* NFTs Only */}
            <TabsContent value="nft" className="flex-1 mt-4"></TabsContent>
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

const NFTCard = ({
  item,
  handleStakeNFT,
  isLoading,
  availableSlots,
  nftCount,
}: {
  item: InventoryItem;
  handleStakeNFT: (id: string) => void;
  isLoading: boolean;
  availableSlots: number;
  nftCount: number | undefined;
}) => {
  return (
    <div className="w-44 flex flex-col items-center gap-2">
      <Card className="w-44 h-44 bg-neutral-800 border-0 rounded-2xl overflow-hidden">
        <CardContent className="p-0 h-full flex justify-center items-center">
          <Image
            className="w-44 h-44 object-cover"
            src={`https://walrus.tusky.io/${item.imageUrl}`}
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
        onClick={() => handleStakeNFT(item.id)}
        disabled={
          isLoading ||
          nftCount === undefined ||
          nftCount === null ||
          availableSlots === undefined ||
          availableSlots === null ||
          (nftCount !== undefined && availableSlots <= nftCount)
        }
        isLoading={isLoading}
      >
        {nftCount !== undefined && availableSlots <= nftCount
          ? "Max Slots Reached"
          : "Stake"}
      </Button>
    </div>
  );
};
