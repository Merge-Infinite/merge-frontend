import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import {
  MARKET_FEE,
  mists_to_sui,
  NFT_MODULE_NAME,
  NFT_PACKAGE_ID,
  POLICY_ID,
} from "@/lib/utils";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useFeatureFlags } from "@/lib/wallet/hooks/useFeatureFlags";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress } from "@mysten/sui/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

export const MarketItem = React.memo(
  ({
    element,
    amount,
    price,
    loading: initialLoading,
    itemId,
    emoji,
    onBuy,
    nftId,
    seller_kiosk,
    id,
    isOwned,
  }: {
    element: string;
    amount: string | number;
    id: string;
    price?: string;
    onBuy?: () => void;
    loading?: boolean;
    itemId: string;
    emoji: string;
    nftId: string;
    seller_kiosk: string;
    isOwned?: boolean;
  }) => {
    const featureFlags = useFeatureFlags();
    const apiClient = useApiClient();
    const { user } = useUser();
    const appContext = useSelector((state: RootState) => state.appContext);
    const authed = useSelector((state: RootState) => state.appContext.authed);
    const { address, fetchAddressByAccountId } = useAccount(
      appContext.accountId
    );
    const { data: network } = useNetwork(appContext.networkId);
    const [loading, setLoading] = useState(initialLoading || false);
    const [copied, setCopied] = useState(false);
    const [openAuthDialog, setOpenAuthDialog] = useState(false);
    const jsonContent = `{
        "p": "sui-20",
        "element": "${element}", 
        "amt": "${amount}",
    }`;

    const purchasesApi = useApi({
      key: ["purchases"],
      method: "POST",
      url: "marketplace/purchases",
    }).post;

    const marketplaceDeListings = useApi({
      key: ["syncUserBag"],
      method: "POST",
      url: "marketplace/delist",
    }).post;

    const handleCopyId = () => {
      const currentNetworkConfig = featureFlags.networks[appContext.networkId];
      window.open(
        currentNetworkConfig.explorer_url + "/object/" + nftId,
        "_blank"
      );
      // setCopied(true);
      // toast.success("NFT ID copied to clipboard");
      // setTimeout(() => setCopied(false), 2000);
    };

    async function purchaseNFT(): Promise<void> {
      try {
        setLoading(true);

        // Show processing toast
        toast.info("Transaction in progress...");

        const txb = new Transaction();
        const paymentCoin = txb.splitCoins(txb.gas, [Number(price)]);

        // Use txb.object instead of txb.pure.id for better compatibility
        const [nft, request] = txb.moveCall({
          target: "0x2::kiosk::purchase",
          arguments: [txb.object(seller_kiosk), txb.object(nftId), paymentCoin],
          typeArguments: [`${NFT_PACKAGE_ID}::${NFT_MODULE_NAME}::ElementNFT`],
        });

        txb.moveCall({
          target: `0x2::transfer_policy::confirm_request`,
          typeArguments: [`${NFT_PACKAGE_ID}::${NFT_MODULE_NAME}::ElementNFT`],
          arguments: [txb.object(POLICY_ID), request],
        });

        txb.transferObjects([nft], txb.pure.address(address));
        // Calculate 3% fee for the platform owner
        const feeAmount = Math.floor(Number(price) * 0.03);
        const platformOwnerAddress = MARKET_FEE;
        if (feeAmount <= 0) return;

        const feeCoin = txb.splitCoins(txb.gas, [feeAmount]);

        txb.transferObjects([feeCoin], txb.pure.address(platformOwnerAddress));

        const response = await apiClient.callFunc<
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

        if (response && response.digest) {
          // Show transaction submitted toast
          toast.success("Transaction Submitted");

          // Sync with backend
          try {
            await purchasesApi?.mutateAsync({
              listingId: id,
              transactionDigest: response.digest,
            });

            // Success message
            toast.success(`You are now the owner of ${element} ${emoji}`);

            if (onBuy) {
              onBuy();
            }
          } catch (error) {
            console.error("Backend sync error:", error);
            toast.error(
              "Purchase completed but we couldn't update our records. Your NFT is in your wallet."
            );
          }
        } else {
          toast.error("Failed to purchase NFT. Please try again.");
        }
      } catch (error) {
        console.error("Purchase error:", error);
        if (error.message === "Authentication required") {
          setOpenAuthDialog(true);
        } else {
          toast.error(
            error.message || "Something went wrong. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    useEffect(() => {
      if (!address && authed) {
        fetchAddressByAccountId(appContext.accountId);
      }
    }, [address, authed]);

    async function deListNFT(): Promise<void> {
      try {
        setLoading(true);
        const txb = new Transaction();

        txb.moveCall({
          target: "0x2::kiosk::delist",
          arguments: [
            txb.object(user.kiosk.objectId),
            txb.object(user.kiosk.ownerCapId),
            txb.pure.address(id),
          ],
          typeArguments: [`${NFT_PACKAGE_ID}::${NFT_MODULE_NAME}::ElementNFT`],
        });

        const response = await apiClient.callFunc<
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

        if (response && response.digest) {
          // Sync with backend
          try {
            await marketplaceDeListings?.mutateAsync({
              kioskId: user.kiosk.objectId,
              nftId: id,
              transactionDigest: response.digest,
            });

            toast.success("Your NFT has been delisted successfully");
          } catch (error) {
            console.error("Backend sync error:", error);
            toast.error(
              "Transaction was successful but we couldn't sync with our servers. Please try again or contact support."
            );
          }
        } else {
          toast.error("Failed to delist NFT. Please try again.");
        }
      } catch (error: any) {
        if (error.message === "Authentication required") {
          setOpenAuthDialog(true);
        } else {
          toast.error(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        }
      } finally {
        setLoading(false);
      }
    }

    return (
      <Card className="w-full sm:w-60 bg-transparent border-none transition-all duration-300 gap-2 flex flex-col">
        <CardContent className="p-4  border border-[#1f1f1f] rounded-2xl">
          <pre className="text-white text-sm font-normal font-['Sora'] whitespace-pre-wrap">
            {jsonContent}
          </pre>
        </CardContent>

        <div className="flex flex-col items-center gap-2">
          <div
            className="text-[#68ffd1] text-sm font-normal font-['Sora'] underline"
            onClick={handleCopyId}
          >
            {formatAddress(nftId)} {copied ? "✓" : ""}
          </div>
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className="text-white text-xs font-normal font-['Sora']">
                {price && (
                  <>
                    <Image
                      src="/images/sui.svg"
                      alt="Sui Logo"
                      className="h-3 w-3 inline mr-1"
                      width={16}
                      height={16}
                    />
                    {mists_to_sui(Number(price))} SUI
                  </>
                )}
              </div>
            </div>
            {!isOwned ? (
              <Button
                className=" text-black w-fit uppercase rounded-3xl"
                onClick={purchaseNFT}
                disabled={loading}
                isLoading={loading}
                size="sm"
              >
                {loading ? (
                  <div className="flex items-center gap-1">
                    <span>Buying</span>
                  </div>
                ) : (
                  "Buy"
                )}
              </Button>
            ) : (
              <Button
                className=" text-black w-fit uppercase rounded-3xl"
                onClick={deListNFT}
                disabled={loading}
                isLoading={loading}
                size="sm"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
        <PasscodeAuthDialog
          open={openAuthDialog}
          setOpen={(open) => setOpenAuthDialog(open)}
          onSuccess={deListNFT}
        />
      </Card>
    );
  }
);
