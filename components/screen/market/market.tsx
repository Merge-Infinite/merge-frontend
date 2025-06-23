"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import CreateWallet from "@/components/common/CreateWallet";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useApi from "@/hooks/useApi";
import { useMarketPlace } from "@/hooks/useMarketPlace";
import { useKioskListings } from "@/hooks/useMarketplaceListings";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { formatSUI } from "@/lib/wallet/core";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import useSuiBalance from "@/lib/wallet/hooks/coin/useSuiBalance";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { OmitToken } from "@/lib/wallet/types";
import {
  CREATURE_NFT_MODULE_NAME,
  ELEMENT_NFT_MODULE_NAME,
  MER3_PACKAGE_ID,
} from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress, MIST_PER_SUI } from "@mysten/sui/utils";
import { SearchIcon, ShoppingCart } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { MarketItem } from "./market-item";

// Empty state component
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 mt-10 border border-dashed border-gray-700 rounded-lg">
    <ShoppingCart className="h-12 w-12 text-gray-500 mb-4" />
    <p className="text-gray-400 mb-4">{message}</p>
  </div>
);

// Loading skeleton for marketplace items
const MarketplaceSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    {Array(8)
      .fill(0)
      .map((_, i) => (
        <Card
          key={i}
          className="w-full sm:w-60 bg-transparent border border-[#1f1f1f]"
        >
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 bg-gray-800" />
            <Skeleton className="h-4 w-1/2 bg-gray-800 mt-2" />
          </CardContent>
          <div className="flex flex-col items-center gap-2 px-4 pb-4">
            <Skeleton className="w-24 h-24 bg-gray-800 rounded-md" />
            <Skeleton className="h-4 w-20 bg-gray-800" />
            <div className="w-full flex justify-between items-center mt-2">
              <Skeleton className="h-4 w-10 bg-gray-800" />
              <Skeleton className="h-8 w-16 bg-gray-800 rounded-3xl" />
            </div>
          </div>
        </Card>
      ))}
  </div>
);

// Main NFT Marketplace Component
export const NFTMarket = () => {
  const { isTelegram, suiBalance } = useUniversalApp();
  const { user, refetch: refetchUser } = useUser();
  const apiClient = useApiClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const { data: network } = useNetwork(appContext.networkId);
  const { data: balance } = useSuiBalance(address);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const initialized = useSelector(
    (state: RootState) => state.appContext.initialized
  );
  const [isOwned, setIsOwned] = useState(false);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const account = useCurrentAccount();
  const dispatch = useDispatch();
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

  const [loadingClaim, setLoadingClaim] = useState(false);
  const { profit, refetchProfit } = useMarketPlace(
    isOwned ? user?.kiosk?.objectId : undefined,
    {
      pollingInterval: undefined,
    }
  );

  const {
    listings: marketplaceListings,
    loading,
    refresh: refreshElement,
  } = useKioskListings({
    kioskId: isOwned ? user?.kiosk?.objectId : undefined,
    nftType: `${MER3_PACKAGE_ID}::${ELEMENT_NFT_MODULE_NAME}::CreativeElementNFT`,
    autoFetch: true,
    refreshInterval: 60000,
    limit: 20,
  });

  const {
    listings: marketplaceCreatureListings,
    loading: loadingCreature,
    refresh: refreshCreature,
  } = useKioskListings({
    kioskId: isOwned ? user?.kiosk?.objectId : undefined,
    nftType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::CreatureNFT`,
    autoFetch: true,
    refreshInterval: 60000,
    limit: 20,
  });

  useEffect(() => {
    if (user) {
      refetchUser();
    }
  }, [user]);

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

  const createKioskApi = useApi({
    key: ["create-kiosk"],
    method: "POST",
    url: "marketplace/kiosk/create",
  }).post;

  const handleCreateKiosk = useCallback(async () => {
    try {
      let tx = new Transaction();
      let [kiosk, kioskOwnerCap] = tx.moveCall({
        target: "0x2::kiosk::new",
      });

      tx.transferObjects(
        [kioskOwnerCap],
        tx.pure.address(isTelegram ? address : account?.address || "")
      );
      tx.moveCall({
        target: "0x2::transfer::public_share_object",
        arguments: [kiosk],
        typeArguments: ["0x2::kiosk::Kiosk"],
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
        const createdObjects = (response as any).objectChanges?.filter(
          (change: any) => change.type === "created"
        );

        // Find the kiosk and kiosk cap objects
        const kioskObject = createdObjects?.find(
          (obj: any) =>
            "objectType" in obj && obj.objectType === "0x2::kiosk::Kiosk"
        );

        const kioskCapObject = createdObjects?.find(
          (obj: any) =>
            "objectType" in obj &&
            obj.objectType === "0x2::kiosk::KioskOwnerCap"
        );

        if (
          kioskObject &&
          kioskCapObject &&
          "objectId" in kioskObject &&
          "objectId" in kioskCapObject
        ) {
          await createKioskApi?.mutateAsync({
            objectId: kioskObject.objectId,
            ownerCapId: kioskCapObject.objectId,
          });

          await refetchUser();

          toast.success("Kiosk created successfully!");
        }
      }
    } catch (error: any) {
      console.log("Error creating kiosk:", error);

      if (error.message === "Authentication required") {
        setOpenAuthDialog(true);
      } else {
        toast.error(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      }
    }
  }, [address, authed, isTelegram]);

  const filteredListings = React.useMemo(() => {
    const listings = [];
    const elementListings = marketplaceListings
      .filter((listing) =>
        isOwned
          ? listing.kioskId === user?.kiosk?.objectId
          : listing.kioskId !== user?.kiosk?.objectId
      )
      .filter((listing) => {
        if (
          searchTerm &&
          !listing.element.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !listing.objectId.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        return b.objectId.localeCompare(a.objectId);
      });

    const creatureListings = marketplaceCreatureListings
      .filter((listing) =>
        isOwned
          ? listing.kioskId === user?.kiosk?.objectId
          : listing.kioskId !== user?.kiosk?.objectId
      )
      .filter((listing) => {
        if (
          searchTerm &&
          !listing.element.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !listing.objectId.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        return b.objectId.localeCompare(a.objectId);
      });

    listings.push(...elementListings, ...creatureListings);

    return listings;
  }, [marketplaceListings, marketplaceCreatureListings, searchTerm]);

  useEffect(() => {
    if (
      user &&
      !user.kiosk &&
      ((authed && address) || (!isTelegram && account?.address))
    ) {
      handleCreateKiosk();
    }
  }, [user, authed, address, isTelegram, account?.address]);

  async function claimProfit(): Promise<void> {
    try {
      if (!profit) {
        toast.error("No profit to claim");
        return;
      }
      setLoadingClaim(true);
      const txb = new Transaction();
      const amtArg = txb.moveCall({
        target: "0x1::option::some",
        arguments: [txb.pure.u64(profit * Number(MIST_PER_SUI))],
        typeArguments: ["u64"],
      });
      const coin = txb.moveCall({
        target: "0x2::kiosk::withdraw",
        arguments: [
          txb.object(user.kiosk.objectId),
          txb.object(user.kiosk.ownerCapId),
          amtArg,
        ],
      });
      txb.transferObjects([coin], txb.pure.address(address));

      let response;
      if (isTelegram) {
        response = await apiClient.callFunc<
          SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
          undefined
        >(
          "txn",
          "signAndExecuteTransactionBlock",
          {
            transactionBlock: txb.serialize(),
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
          transaction: txb.serialize(),
        });
      }

      if (response && response.digest) {
        // Sync with backend
        try {
          toast.success("Profit claimed successfully");
          refetchProfit();
        } catch (error) {
          console.error("Backend sync error:", error);
        }
      } else {
        toast.error("Failed to claim profit. Please try again.");
      }
    } catch (error: any) {
      console.log(error);
      if (error.message === "Authentication required") {
        setOpenAuthDialog(true);
      } else {
        toast.error(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      }
    } finally {
      setLoadingClaim(false);
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div
        className={`flex flex-col gap-4 fixed ${
          isTelegram ? " top-4 left-4 right-4 bg-black  z-10" : "w-2/5"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="px-3 py-1 bg-white text-black rounded-3xl"
            >
              <span className="text-xs font-normal font-['Sora'] uppercase">
                {formatAddress(isTelegram ? address : account?.address || "")}
              </span>
            </Badge>

            <div className="flex items-center">
              <Image
                src="/images/sui.svg"
                alt="Sui Logo"
                className="h-4 w-4 mr-1 text-orange-500"
                width={16}
                height={16}
              />
              <span className="text-white text-sm font-normal font-['Sora']">
                {formatSUI(isTelegram ? balance.balance : suiBalance || 0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex-1 justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
              Kiosk:
            </div>
            <div className="flex justify-start items-start gap-1">
              <Image
                src="/images/sui.svg"
                alt="Sui Logo"
                width={20}
                height={20}
              />
              <div className="text-center justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                {profit || 0}
              </div>
            </div>
            <Button
              className="bg-[#a668ff] flex justify-center items-center gap-2 w-fit px-1 py-1 h-fit"
              onClick={claimProfit}
              disabled={loadingClaim || !profit}
            >
              <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
                {loadingClaim ? "Claiming..." : "Claim"}
              </div>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 gap-2  bg-black z-10 pb-2">
          <div className="w-full rounded-[32px] inline-flex flex-col justify-start items-start gap-1">
            <div className="self-stretch px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-start items-start gap-4">
              <Input className="inline-flex h-5 flex-col justify-start items-start overflow-hidden text-white ring-0 px-0 border-none" />
              <SearchIcon className="w-5 h-5 text-white" />
            </div>
          </div>
          <Button
            size="sm"
            className={cn(
              "rounded-3xl w-fit  px-4 py-1  border border-[#333333]",
              isOwned ? "bg-primary text-black" : "bg-[#141414] text-white"
            )}
            onClick={() => setIsOwned((prev) => !prev)}
          >
            Owned
          </Button>
          <Button
            size="sm"
            className={cn(
              "rounded-3xl w-fit py-1 px-4 bg-transparent border border-[#333333]"
            )}
            onClick={() => {
              dispatch(updateTabMode(TabMode.BAG));
            }}
          >
            Sell
          </Button>
        </div>
      </div>
      <div className="flex flex-1 h-full mt-10">
        {!initialized && isTelegram ? (
          <CreateWallet />
        ) : user && !user.kiosk ? (
          <div className="flex flex-col gap-4 w-full h-full mt-4 ">
            <div className="text-white text-2xl font-bold">
              Creating your kiosk...
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            <div className="h-full overflow-y-auto " style={{ marginTop: 80 }}>
              {loading ? (
                <MarketplaceSkeleton />
              ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredListings.map((listing) => (
                    <MarketItem
                      key={listing.objectId}
                      element={listing.element}
                      recipe={listing.recipe}
                      id={listing.objectId}
                      imageUrl={listing.imageUrl}
                      emoji={listing.element}
                      price={listing.price}
                      nftId={listing.objectId}
                      loading={purchaseLoading}
                      seller_kiosk={listing.kioskId}
                      onSubmitOnchainComplete={() => {
                        refreshElement();
                        refreshCreature();
                      }}
                      isOwned={isOwned}
                      type={listing.type}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="No listings found matching your criteria" />
              )}
            </div>
          </div>
        )}
      </div>
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
        onSuccess={() => {
          refreshElement();
          refreshCreature();
        }}
      />
    </div>
  );
};
