"use client";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/hooks/useLoading";
import { useNFTList } from "@/hooks/useNFTList";
import { SendAndExecuteTxParams, TxEssentials } from "@/lib/wallet/core";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import {
  CREATURE_NFT_MODULE_NAME,
  MER3_PACKAGE_ID,
  POOL_REWARDS_MODULE_NAME,
  POOL_SYSTEM,
} from "@/utils/constants";
import { formatAddress } from "@mysten/sui.js";
import { Transaction } from "@mysten/sui/transactions";
import { initBackButton } from "@telegram-apps/sdk";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

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
  const [backButton] = initBackButton();
  const router = useRouter();
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const { data: network } = useNetwork(appContext.networkId);

  useEffect(() => {
    backButton.show();
    backButton.on("click", () => {
      router.back();
    });
  }, []);

  const {
    nfts: creatureNfts,
    loading: creatureNftsLoading,
    refresh,
  } = useNFTList({
    walletAddress: address,
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::${"CreatureNFT"}`,
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

  const handleStakeNFT = useCallback(
    async (nftId: string) => {
      try {
        if (!address && authed) {
          toast.error("No address found");
          return;
        }
        startLoading();

        let tx = new Transaction();

        tx.moveCall({
          target: `${MER3_PACKAGE_ID}::${POOL_REWARDS_MODULE_NAME}::${"stake_nft"}`,
          arguments: [
            tx.object(POOL_SYSTEM),
            tx.object(poolId || ""),
            tx.object(nftId),
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
          await refresh();
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
    [address, authed]
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

const ElementCard = ({
  item,
  handleStakeNFT,
  isLoading,
}: {
  item: InventoryItem;
  handleStakeNFT: (id: string) => void;
  isLoading: boolean;
}) => (
  <div className="w-44 relative flex flex-col items-center gap-2">
    <Card className="w-full h-32 border-neutral-800 rounded-2xl">
      <CardContent className="h-full flex flex-col justify-center items-center p-4">
        <Image
          src={`https://cdn.tusky.io/${item.imageUrl}`}
          alt={item.name}
          width={176}
          height={176}
        />
      </CardContent>
    </Card>

    <div className="text-green-400 text-sm font-normal font-sora underline leading-normal">
      #{formatAddress(item.id)}
    </div>

    <Button
      variant="secondary"
      size="sm"
      className="w-44 h-6 px-4 bg-white text-black hover:bg-gray-200 rounded-3xl text-xs font-normal font-sora uppercase"
    >
      Stake
    </Button>

    {/* Background decoration */}
    <div className="w-28 h-28 absolute left-7 top-3 opacity-5 pointer-events-none">
      <div className="w-24 h-11 absolute left-2 top-2 bg-white" />
      <div className="w-24 h-11 absolute right-2 bottom-2 bg-white rotate-180" />
    </div>
  </div>
);

const NFTCard = ({
  item,
  handleStakeNFT,
  isLoading,
}: {
  item: InventoryItem;
  handleStakeNFT: (id: string) => void;
  isLoading: boolean;
}) => (
  <div className="w-44 flex flex-col items-center gap-2">
    <Card className="w-44 h-44 bg-neutral-800 border-0 rounded-2xl overflow-hidden">
      <CardContent className="p-0 h-full flex justify-center items-center">
        <Image
          className="w-44 h-44 object-cover"
          src={`https://cdn.tusky.io/${item.imageUrl}`}
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
      disabled={isLoading}
      isLoading={isLoading}
    >
      Stake
    </Button>
  </div>
);
