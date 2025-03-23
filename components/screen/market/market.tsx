import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import useApi from "@/hooks/useApi";
import { useMarketPlace } from "@/hooks/useMarketPlace";
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
import { Transaction } from "@mysten/sui/transactions";
import { SearchIcon, ShoppingCart, Wallet } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MarketItem } from "./market-item";

// Card Item component with hover effects and improved visuals

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

// Wallet Connect Banner
const WalletBanner = ({ onConnect }) => (
  <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a1a3a] p-4 rounded-lg mb-4 flex flex-col sm:flex-row items-center justify-between">
    <div className="mb-4 sm:mb-0">
      <h3 className="text-white text-lg font-['Sora'] mb-2">
        Connect Your Wallet
      </h3>
      <p className="text-gray-400 text-sm">
        Connect your wallet to start buying and selling NFTs
      </p>
    </div>
    <Button
      onClick={onConnect}
      className="bg-[#a668ff] hover:bg-[#9655e8] text-black"
    >
      <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
    </Button>
  </div>
);

// Main NFT Marketplace Component
export const NFTMarket = () => {
  const { user } = useUser();
  const apiClient = useApiClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { toast } = useToast();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const { data: network } = useNetwork(appContext.networkId);
  const { data: balance } = useSuiBalance(address);
  const [isOwned, setIsOwned] = useState(false);
  const [isSell, setIsSell] = useState(false);
  const dispatch = useDispatch();
  const {
    items: marketplaceListings,
    loading,
    refetch,
  } = useMarketPlace(isOwned ? user.kiosk.objectId : undefined, {
    pollingInterval: undefined,
  });

  const createKioskApi = useApi({
    key: ["create-kiosk"],
    method: "POST",
    url: "marketplace/kiosk/create",
  }).post;

  const handleCreateKiosk = async () => {
    try {
      toast({
        title: "Creating your kiosk...",
        description: "Please wait while we set up your marketplace kiosk",
      });

      let tx = new Transaction();
      let [kiosk, kioskOwnerCap] = tx.moveCall({
        target: "0x2::kiosk::new",
      });

      tx.transferObjects([kioskOwnerCap], tx.pure.address(address));
      tx.moveCall({
        target: "0x2::transfer::public_share_object",
        arguments: [kiosk],
        typeArguments: ["0x2::kiosk::Kiosk"],
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

          toast({
            title: "Kiosk created successfully!",
            description: "You can now buy and sell NFTs in the marketplace",
            variant: "success",
          });
        }
      }
    } catch (error) {
      console.error("Error creating kiosk:", error);
      toast({
        title: "Error creating kiosk",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const filteredListings = React.useMemo(() => {
    return marketplaceListings
      .filter((listing) => {
        // Apply search filter
        if (
          searchTerm &&
          !listing.element.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !listing.id.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        return b.id.localeCompare(a.id);
      });
  }, [marketplaceListings, searchTerm]);

  useEffect(() => {
    if (user && !user.kiosk) {
      handleCreateKiosk();
    }
  }, [user]);

  // Truncate address for display
  const displayAddress = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : "0xfda4...3368";

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex flex-col gap-4 fixed top-4 left-4 right-4 bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="px-3 py-1 bg-white text-black rounded-3xl"
            >
              <span className="text-xs font-normal font-['Sora'] uppercase">
                {displayAddress}
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
                {formatSUI(balance.balance)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 h-full">
        {!user ? (
          <WalletBanner onConnect={handleCreateKiosk} />
        ) : (
          <div className="w-full h-full">
            <div className="flex justify-between rounded-3xl fixed top-12 left-4 right-4 gap-2">
              <div className="w-full rounded-[32px] inline-flex flex-col justify-start items-start gap-1">
                <div className="self-stretch px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-start items-start gap-4">
                  <Input className="inline-flex h-5 flex-col justify-start items-start overflow-hidden text-white ring-0 px-0 border-none" />
                  <SearchIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <Button
                size="sm"
                className={cn(
                  "rounded-3xl w-fit  px-4 py-1 bg-transparent border border-[#333333]",
                  isOwned && "bg-[#fff] text-black"
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
            <div className="h-full overflow-y-auto mt-20">
              {loading ? (
                <MarketplaceSkeleton />
              ) : filteredListings.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredListings.map((listing) => (
                    <MarketItem
                      key={listing.id}
                      element={listing.item.handle}
                      amount={listing.amount}
                      id={listing.id}
                      itemId={listing.item.id}
                      emoji={listing.item.emoji}
                      price={listing.price}
                      nftId={listing.nftId}
                      loading={purchaseLoading}
                      seller_kiosk={listing.kiosk.objectId}
                      onBuy={refetch}
                      isOwned={isOwned}
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
    </div>
  );
};
