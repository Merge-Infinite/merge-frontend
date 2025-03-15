import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import useApi from "@/hooks/useApi";
import { useMarketPlace } from "@/hooks/useMarketPlace";
import { useUser } from "@/hooks/useUser";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import { Transaction } from "@mysten/sui/transactions";
import { SearchIcon, ShoppingCart, Wallet } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MarketItem } from "./market-item";

// Card Item component with hover effects and improved visuals

// Empty state component
const EmptyState = ({ message, action }) => (
  <div className="flex flex-col items-center justify-center p-8 mt-10 border border-dashed border-gray-700 rounded-lg">
    <ShoppingCart className="h-12 w-12 text-gray-500 mb-4" />
    <p className="text-gray-400 mb-4">{message}</p>
    {action && (
      <Button variant="outline" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
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
  const [activeTab, setActiveTab] = useState("browse");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const { toast } = useToast();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const { data: network } = useNetwork(appContext.networkId);

  const {
    items: marketplaceListings,
    loading,
    refetch,
  } = useMarketPlace(undefined, {
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

        // Apply category filter
        if (selectedFilter === "rare" && Number(listing.amount) < 100)
          return false;
        if (selectedFilter === "common" && Number(listing.amount) >= 100)
          return false;

        return true;
      })
      .sort((a, b) => {
        // Apply sorting
        if (sortOption === "price-asc")
          return Number(a.amount) - Number(b.amount);
        if (sortOption === "price-desc")
          return Number(b.amount) - Number(a.amount);
        // Default: newest first (using id as proxy for time since we don't have timestamp)
        return b.id.localeCompare(a.id);
      });
  }, [marketplaceListings, searchTerm, selectedFilter, sortOption]);

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
                3,300 ~ $11,550
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex items-center gap-2">
          <div className="relative flex-grow">
            <Input
              className="h-10 px-10 py-2 bg-[#141414] border-[#333333] rounded-3xl text-white placeholder:text-[#5c5c5c]"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 h-full mt-20">
        {!user ? (
          <WalletBanner onConnect={handleCreateKiosk} />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-full bg-black"
          >
            <TabsList className="grid grid-cols-2 bg-[#141414] rounded-3xl p-1 fixed top-28 left-4 right-4">
              <TabsTrigger
                value="browse"
                className="rounded-3xl data-[state=active]:bg-[#a668ff] data-[state=active]:text-black py-2"
              >
                Browse
              </TabsTrigger>
              <TabsTrigger
                value="owned"
                className="rounded-3xl data-[state=active]:bg-[#a668ff] data-[state=active]:text-black py-2"
              >
                My NFTs
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="browse"
              className="h-full overflow-y-auto mt-20"
            >
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
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No listings found matching your criteria"
                  action={{
                    label: "Clear Filters",
                    onClick: () => {
                      setSearchTerm("");
                      setSelectedFilter("all");
                      setSortOption("newest");
                    },
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="owned">
              {filteredListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
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
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="You don't own any NFTs yet"
                  action={{
                    label: "Browse Marketplace",
                    onClick: () => setActiveTab("browse"),
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
