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
import { ObjectChange, OmitToken, TransactionResponse } from "@/lib/wallet/types";
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
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { MarketItem } from "./market-item";
import { Dropdown, Filter, Search } from "@/components/icons";
import MarketFilterSheet from "./MarketFilterSheet";

type FilterType = "all" | "element" | "creature";

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
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
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
  const [showMarketFilterSheet, setShowMarketFilterSheet] = useState(false);
  const [marketSortBy, setMarketSortBy] = useState<"price_high" | "price_low">("price_low");
  const [showListingOnly, setShowListingOnly] = useState(true);
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
  const { profit, refetchProfit } = useMarketPlace(user?.kiosk?.objectId, {
    pollingInterval: undefined,
  });

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
      const txResponse = response as TransactionResponse;
      if (txResponse?.digest) {
        const createdObjects = txResponse.objectChanges?.filter(
          (change: ObjectChange) => change.type === "created"
        );

        // Find the kiosk and kiosk cap objects
        const kioskObject = createdObjects?.find(
          (obj: ObjectChange) => obj.objectType === "0x2::kiosk::Kiosk"
        );

        const kioskCapObject = createdObjects?.find(
          (obj: ObjectChange) => obj.objectType === "0x2::kiosk::KioskOwnerCap"
        );

        if (kioskObject?.objectId && kioskCapObject?.objectId) {
          await createKioskApi?.mutateAsync({
            objectId: kioskObject.objectId,
            ownerCapId: kioskCapObject.objectId,
          });

          await refetchUser();

          toast.success("Kiosk created successfully!");
        }
      }
    } catch (error: unknown) {
      console.log("Error creating kiosk:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      if (errorMessage === "Authentication required") {
        setOpenAuthDialog(true);
      } else {
        toast.error(errorMessage);
      }
    }
  }, [address, authed, isTelegram]);

  const filteredListings = React.useMemo(() => {
    // If showListingOnly is false, don't show any listings
    if (!showListingOnly) {
      return [];
    }

    const listings = [];

    // Filter element listings
    if (filterType === "all" || filterType === "element") {
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
        });
      listings.push(...elementListings);
    }

    // Filter creature listings
    if (filterType === "all" || filterType === "creature") {
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
        });
      listings.push(...creatureListings);
    }

    // Sort by price
    listings.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      if (marketSortBy === "price_high") {
        return priceB - priceA;
      }
      return priceA - priceB;
    });

    return listings;
  }, [marketplaceListings, marketplaceCreatureListings, searchTerm, filterType, isOwned, user?.kiosk?.objectId, marketSortBy, showListingOnly]);

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
      if (!user) {
        toast.error("User not found");
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
      txb.transferObjects(
        [coin],
        txb.pure.address(isTelegram ? address : account?.address || "")
      );

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
    } catch (error: unknown) {
      console.log(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      if (errorMessage === "Authentication required") {
        setOpenAuthDialog(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoadingClaim(false);
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 mb-8">
      <div className="flex flex-col gap-4">
        {/* Header Row - Wallet Info & Kiosk */}
        <div className="flex items-center justify-between">
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
                className="h-5 w-5"
                width={20}
                height={20}
              />
              <span className="text-white text-sm font-normal font-['Sora']">
                {formatSUI(isTelegram ? balance.balance : suiBalance || 0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 h-8">
            <div className="flex items-center">
              <span className="text-white text-sm font-normal font-['Sora']">
                Kiosk:
              </span>
              <Image
                src="/images/sui.svg"
                alt="Sui Logo"
                width={20}
                height={20}
              />
            </div>
            <span className="text-white text-sm font-normal font-['Sora']">
              {profit || 0}
            </span>
            <Button
              className={cn(
                "h-6 px-2 rounded-3xl text-xs font-normal font-['Sora'] uppercase",
                profit ? "bg-[#a668ff] text-neutral-950" : "bg-[#1f1f1f] text-[#707070]"
              )}
              onClick={claimProfit}
              disabled={loadingClaim || !profit}
            >
              {loadingClaim ? "..." : "Claim"}
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex gap-2 items-center w-full">
          {/* Dropdown Filter */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="w-full bg-[#1f1f1f] rounded-2xl px-3 py-2 flex items-center justify-between"
            >
              <span className="text-white text-sm font-bold font-['Sora']">
                {filterType === "all" ? "All" : filterType === "element" ? "Elements" : "Creatures"}
              </span>
              <Dropdown size={24} color="white" />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f1f1f] rounded-2xl overflow-hidden z-10 border border-[#333333]">
                {(["all", "element", "creature"] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm font-['Sora'] ${
                      filterType === type ? "bg-[#333333] text-white" : "text-[#858585] hover:bg-[#292929]"
                    }`}
                  >
                    {type === "all" ? "All" : type === "element" ? "Elements" : "Creatures"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Icon Button */}
          <button
            onClick={() => setShowMarketFilterSheet(true)}
            className="w-10 h-10 bg-[#141414] border border-[#333333] rounded-full flex items-center justify-center shrink-0"
          >
            <Filter size={24} color="white" />
          </button>

          {/* Search Icon Button / Search Input */}
          {showSearch ? (
            <div className="flex-1 h-10 bg-[#141414] border border-[#333333] rounded-full flex items-center px-3 gap-2">
              <Search size={24} color="white" />
              <Input
                className="flex-1 h-full text-white text-sm font-normal bg-transparent border-none focus:outline-none focus:ring-0"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onBlur={() => {
                  if (!searchTerm) setShowSearch(false);
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-10 h-10 bg-[#141414] border border-[#333333] rounded-full flex items-center justify-center shrink-0"
            >
              <Search size={24} color="white" />
            </button>
          )}
        </div>
      </div>
      {/* Content Area */}
      {!initialized && isTelegram ? (
        <CreateWallet />
      ) : user && !user.kiosk ? (
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="text-white text-2xl font-bold">
            Creating your kiosk...
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {loading || loadingCreature ? (
            <MarketplaceSkeleton />
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <MarketItem
                  key={listing.objectId}
                  element={listing.element}
                  prompt={listing.prompt}
                  id={listing.objectId}
                  imageUrl={listing.imageUrl}
                  materials={listing.materials}
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
      )}
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
        onSuccess={() => {
          refreshElement();
          refreshCreature();
        }}
      />
      <MarketFilterSheet
        open={showMarketFilterSheet}
        onOpenChange={setShowMarketFilterSheet}
        sortBy={marketSortBy}
        onSortByChange={setMarketSortBy}
        showListingOnly={showListingOnly}
        onShowListingOnlyChange={setShowListingOnly}
        onApply={() => {
          // Filter will be applied through the state
        }}
        onClearAll={() => {
          setMarketSortBy("price_low");
          setShowListingOnly(true);
        }}
      />
    </div>
  );
};
