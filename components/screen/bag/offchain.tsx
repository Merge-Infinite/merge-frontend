"use client";

import ElementItem from "@/components/common/ElementItem";
import TagSkeleton from "@/components/common/ElementSkeleton";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import { FEE_ADDRESS, MINT_NFT_FEE } from "@/utils/constants";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
export function OffchainBagScreen() {
  const apiClient = useApiClient();

  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [mintQuantity, setMintQuantity] = useState<number | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);

  const getUserBagApi = useApi({
    key: ["getUserBag"],
    method: "GET",
    url: "user/mybags",
  }).get;

  const mintNFTsApi = useApi({
    key: ["mintNFTs"],
    method: "POST",
    url: "marketplace/mint",
  }).post;

  const minGasFee = useApi({
    key: ["minGasFee"],
    method: "POST",
    url: "marketplace/mint-gas-fee",
  }).post;

  useEffect(() => {
    if (!address && appContext.authed) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [address, appContext.accountId, appContext.authed]);

  useEffect(() => {
    if (!appContext.authed) {
      setOpenAuthDialog(true);
    }
  }, [appContext.authed]);

  useEffect(() => {
    const fetchItems = async () => {
      setInitialLoading(true);
      try {
        await getUserBagApi?.refetch();
      } finally {
        setInitialLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setMintQuantity(1);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setMintQuantity(1);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = parseInt(e.target.value);
      if (isNaN(value)) {
        setMintQuantity(null);
        return;
      }
      if (value > 0) {
        if (selectedItem && value > (selectedItem as any).amount) {
          setMintQuantity((selectedItem as any).amount);
        } else {
          setMintQuantity(value);
        }
      }
    } catch (error) {
      console.log("error", error);
      setMintQuantity(null);
    }
  };

  const mintNFTs = useCallback(async () => {
    if (!selectedItem || !mintQuantity || mintQuantity <= 0) {
      toast.error("Please select an item and enter a valid quantity");
      return null;
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return null;
    }

    if (mintQuantity > selectedItem.amount) {
      toast.error("You don't have enough items to mint");
      return null;
    }
    setIsMinting(true);

    try {
      const paymentTx = new Transaction();

      const [mintFeeAmount] = paymentTx.splitCoins(
        paymentTx.gas,
        [MINT_NFT_FEE * Number(MIST_PER_SUI)] // Convert to MIST (smallest SUI unit)
      );

      paymentTx.transferObjects([mintFeeAmount], FEE_ADDRESS);

      const response = await apiClient.callFunc<
        SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
        undefined
      >(
        "txn",
        "signTransactionBlock",
        {
          transactionBlock: paymentTx.serialize(),
          context: {
            network,
            walletId: appContext.walletId,
            accountId: appContext.accountId,
          },
        },
        { withAuth: true }
      );

      if (response && (response as any).signature) {
        const result = await mintNFTsApi?.mutateAsync({
          transactionBlockBytes: (response as any).transactionBlockBytes,
          signature: (response as any).signature,
          itemId: selectedItem.itemId,
          amount: mintQuantity,
        });

        getUserBagApi?.refetch();
        handleCloseModal();
        return result;
      }

      return null;
    } catch (error: any) {
      console.log("error", error);
      if (error.message === "Authentication required") {
        setOpenAuthDialog(true);
      } else if (
        error.message !== "Authentication required" &&
        error.code !== "AUTH_REQUIRED" &&
        error.status !== 401
      ) {
        console.error("Error minting NFTs:", error);
        toast.error(error.message || "Please try again later");
      }
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [selectedItem, mintQuantity, network, appContext]);

  // Filter items based on search query
  const filteredItems = getUserBagApi?.data?.filter((item) =>
    item.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total elements count
  const totalElements =
    getUserBagApi?.data?.reduce((acc, item) => acc + item.amount, 0) || 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="self-stretch h-10 rounded-3xl flex-col justify-start items-start gap-1 flex">
        <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-center gap-4 inline-flex">
          <Image src="/images/search.svg" alt="search" width={24} height={24} />
          <Input
            className="grow shrink basis-0 h-full text-white text-sm font-normal leading-normal focus:outline-none border-transparent bg-transparent"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={initialLoading}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-white"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-col justify-start items-start gap-1 flex">
        <div className="flex justify-between items-center w-full">
          <div>
            <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Elements: (
            </span>
            <span className="text-[#68ffd1] text-sm font-normal font-['Sora'] leading-normal">
              {totalElements}
            </span>
            <span className="text-white text-sm font-normal font-['Sora'] leading-normal">
              )
            </span>
          </div>

          {getUserBagApi?.isLoading && !initialLoading && (
            <div className="flex items-center text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Refreshing...
            </div>
          )}
        </div>

        {initialLoading ? (
          <TagSkeleton />
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="flex flex-wrap gap-2 w-full">
            {filteredItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleItemClick(item)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <ElementItem {...item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-64 text-center">
            <div>
              <p className="text-gray-400 mb-2">
                {searchQuery
                  ? "No matching items found"
                  : "No items in your inventory yet"}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
      />
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="p-4 bg-[#1A1A1A] rounded-lg border border-[#333333] w-[90%] max-w-md">
          <DialogHeader className="mb-0">
            <DialogTitle className="text-white text-lg font-medium font-['Sora']">
              Mint NFT
            </DialogTitle>
          </DialogHeader>

          <div className="self-stretch flex-col justify-start items-start gap-4 flex">
            {selectedItem && (
              <div className="flex-col justify-start items-start gap-3 flex w-full">
                <div className="flex items-center justify-start w-full py-2">
                  <div className="px-3 py-1 rounded-3xl border border-white justify-center items-center gap-2 inline-flex">
                    <span className="text-xl">{selectedItem.emoji}</span>
                    <div className="text-white text-xs font-normal font-['Sora'] uppercase leading-normal">
                      {selectedItem.handle} ({selectedItem.amount})
                    </div>
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-white text-sm font-normal font-['Sora'] leading-normal mb-1">
                    Quantity:
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-full h-10 rounded-3xl flex-col justify-start items-start gap-1 flex">
                      <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-center inline-flex w-full">
                        <Input
                          className="grow shrink basis-0 h-6 text-white text-sm font-normal font-['Sora'] leading-normal bg-transparent border-none focus:outline-none"
                          placeholder="Enter qty"
                          type="number"
                          min={0}
                          max={(selectedItem as any).amount || 1}
                          value={mintQuantity || ""}
                          onChange={handleQuantityChange}
                          disabled={isMinting}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
                        Fee: {MINT_NFT_FEE} SUI
                      </div>
                      <Image
                        src="/images/sui.svg"
                        alt="sui"
                        width={20}
                        height={20}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="w-full mt-4">
              <Button
                onClick={mintNFTs}
                disabled={
                  isMinting ||
                  !mintQuantity ||
                  mintQuantity <= 0 ||
                  mintQuantity > selectedItem?.amount
                }
                className="w-full bg-gradient-to-r from-[#9747FF] to-[#7F45E2] hover:from-[#9747FF] hover:to-[#8a4dd4]"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  `Mint ${mintQuantity || ""} NFT${
                    mintQuantity !== 1 ? "s" : ""
                  }`
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
