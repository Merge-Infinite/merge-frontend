import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { ShareBottomSheet } from "@/components/common/ShareBottomSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
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
import {
  CREATURE_NFT_MODULE_NAME,
  ELEMENT_NFT_MODULE_NAME,
  MER3_UPGRADED_PACKAGE_ID,
} from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress, MIST_PER_SUI } from "@mysten/sui/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import React, { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

export const CreativeOnchainItem = React.memo(
  ({
    id,
    name,
    imageUrl,
    prompt,
    onListingComplete,
  }: {
    id: string;
    name: string;
    imageUrl: string;
    prompt: string;
    onListingComplete?: () => void;
  }) => {
    const apiClient = useApiClient();

    const burnNFT = useApi({
      key: ["burnNFT"],
      method: "POST",
      url: "marketplace/use-nft",
    }).post;
    const { isTelegram } = useUniversalApp();
    const appContext = useSelector((state: RootState) => state.appContext);
    const { data: network } = useNetwork(appContext.networkId);
    const { user } = useUser();
    const { address } = useAccount(appContext.accountId);
    const [listingPrice, setListingPrice] = useState<string>("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState<
      "idle" | "submitting" | "syncing" | "success" | "error"
    >("idle");
    const [transactionDigest, setTransactionDigest] = useState<string | null>(
      null
    );
    const account = useCurrentAccount();
    const [priceError, setPriceError] = useState<string>("");
    const [openAuthDialog, setOpenAuthDialog] = useState(false);
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
    // Reset states when dialog closes
    useEffect(() => {
      if (!dialogOpen) {
        setListingPrice("");
        setTransactionStatus("idle");
        setTransactionDigest(null);
        setPriceError("");
      }
    }, [dialogOpen]);

    // Validate price input
    const validatePrice = (value: string) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        setPriceError("Please enter a valid number");
        return false;
      }
      if (numValue <= 0) {
        setPriceError("Price must be greater than 0");
        return false;
      }
      if (numValue > 100000) {
        setPriceError("Price is too high");
        return false;
      }
      setPriceError("");
      return true;
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setListingPrice(value);
      validatePrice(value);
    };

    async function listNFTOnKiosk(): Promise<void> {
      if (!validatePrice(listingPrice)) {
        toast.error("Please enter a valid price");
        return;
      }

      try {
        setTransactionStatus("submitting");
        // Ensure user has kiosk data
        if (!user?.kiosk?.objectId || !user?.kiosk?.ownerCapId) {
          toast.error(
            "Kiosk information not found. Please refresh and try again."
          );
          setTransactionStatus("error");
          return;
        }

        const numericPrice = parseFloat(listingPrice);
        const txb = new Transaction();
        txb.moveCall({
          target: "0x2::kiosk::place",
          arguments: [
            txb.object(user.kiosk.objectId),
            txb.object(user.kiosk.ownerCapId),
            txb.object(id),
          ],
          typeArguments: [
            `${MER3_UPGRADED_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::CreatureNFT`,
          ],
        });
        txb.moveCall({
          target: "0x2::kiosk::list",
          arguments: [
            txb.object(user.kiosk.objectId),
            txb.object(user.kiosk.ownerCapId),
            txb.pure.address(id),
            txb.pure.u64(numericPrice * Number(MIST_PER_SUI)),
          ],
          typeArguments: [
            `${MER3_UPGRADED_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::CreatureNFT`,
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
          setTransactionStatus("success");
          await onListingComplete?.();
          setTimeout(() => setDialogOpen(false), 1000);
        } else {
          setTransactionStatus("error");
          toast.error("Failed to list NFT. Please try again.");
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        if (error.message === "Authentication required") {
          setOpenAuthDialog(true);
        } else {
          setTransactionStatus("error");
          toast.error(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        }
      } finally {
      }
    }

    async function onBurn(): Promise<void> {
      try {
        setTransactionStatus("submitting");

        const txb = new Transaction();
        txb.moveCall({
          target: `${MER3_UPGRADED_PACKAGE_ID}::${ELEMENT_NFT_MODULE_NAME}::${"burn"}`,
          arguments: [txb.object(id)],
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
          setTransactionDigest(response.digest);
          setTransactionStatus("syncing");

          // Sync with backend
          try {
            await burnNFT?.mutateAsync({
              itemId: Number(id),
              nftId: id,
              transactionDigest: response.digest,
              ownerAddress: isTelegram ? address : account?.address || "",
              amount: Number(1),
            });

            setTransactionStatus("success");
            toast.success("Your NFT has been used successfully");
          } catch (error) {
            console.error("Backend sync error:", error);
            setTransactionStatus("error");
            toast.error(
              "Transaction was successful but we couldn't sync with our servers. Please try again or contact support."
            );
          }
        } else {
          setTransactionStatus("error");
          toast.error("Failed to list NFT. Please try again.");
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        if (error.message === "Authentication required") {
          setOpenAuthDialog(true);
        } else {
          setTransactionStatus("error");
          toast.error(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        }
      } finally {
      }
    }

    const getStatusMessage = () => {
      switch (transactionStatus) {
        case "submitting":
          return "Submitting transaction to blockchain...";
        case "syncing":
          return "Transaction successful! Syncing with marketplace...";
        case "success":
          return "NFT successfully listed on marketplace!";
        case "error":
          return "Error occurred during the process.";
        default:
          return "";
      }
    };

    const isProcessing = ["submitting", "syncing"].includes(transactionStatus);

    return (
      <Fragment>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Card className="w-44 bg-transparent border-none">
            <CardContent className="p-0 flex flex-col items-center gap-2">
              {/* Image Container */}
              <Image
                src={
                  imageUrl.includes("https")
                    ? imageUrl
                    : `https://wal.gg/${imageUrl}`
                }
                alt="Project preview"
                width={176}
                height={176}
                className="rounded-2xl"
              />

              <ShareBottomSheet
                prompt={prompt}
                trigger={
                  <div className="text-[#68ffd1] text-sm font-normal font-['Sora'] underline cursor-pointer">
                    #{formatAddress(id)}
                  </div>
                }
                blobId={imageUrl}
                name={name}
                nftId={id}
              />
              <div className="text-white text-sm font-normal leading-normal text-center">
                {name}
              </div>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-44 h-6 px-4 bg-white hover:bg-gray-100 text-black rounded-3xl text-xs font-normal uppercase leading-normal"
                >
                  Sell
                </Button>
              </DialogTrigger>
            </CardContent>
          </Card>

          <DialogContent className="bg-[#1f1f1f] border-0 text-white p-6 w-[90%] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white mb-4">
                Sell Your NFT
              </DialogTitle>
            </DialogHeader>

            {transactionStatus === "success" ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="rounded-full bg-green-500/20 p-3 mb-4">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="#4ADE80"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Listed Successfully!
                </h3>
                <p className="text-gray-300 mb-4">
                  Your NFT is now available on the marketplace
                </p>
                {transactionDigest && (
                  <Button
                    variant="link"
                    className="text-[#68ffd1] underline"
                    onClick={() =>
                      window.open(
                        `https://suiscan.xyz/mainnet/tx/${transactionDigest}`,
                        "_blank"
                      )
                    }
                  >
                    View Transaction
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="text-sm font-medium">Element Name:</div>
                    <Badge
                      variant="outline"
                      className="rounded-3xl border-white p-2 text-white text-xs uppercase"
                    >
                      {name}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium">Listing price:</div>
                    <div className="text-sm font-normal">Fee: 3%</div>
                  </div>

                  <div className="relative">
                    <Input
                      placeholder="0.00"
                      className={`rounded-3xl h-10 bg-[#141414] border-[#333333] text-white !pl-10 ${
                        priceError ? "border-red-500" : ""
                      }`}
                      onChange={handlePriceChange}
                      value={listingPrice}
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={isProcessing}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Image
                        src={`/images/sui.svg`}
                        alt="SUI"
                        width={24}
                        height={24}
                      />
                    </div>
                  </div>
                  {priceError && (
                    <p className="text-red-500 text-xs mt-1">{priceError}</p>
                  )}

                  {isProcessing && (
                    <div className="flex items-center justify-center space-x-2 mt-4 p-3 bg-[#2a2a2a] rounded-lg">
                      <Loader2 className="h-5 w-5 animate-spin text-[#a668ff]" />
                      <p className="text-sm text-gray-300">
                        {getStatusMessage()}
                      </p>
                    </div>
                  )}

                  {transactionStatus === "error" && (
                    <div className="bg-red-900/20 p-3 rounded-lg text-red-300 text-sm mt-2">
                      An error occurred. Please try again or contact support if
                      the problem persists.
                    </div>
                  )}
                </div>

                <DialogFooter className="flex flex-row gap-2 sm:justify-start pt-2">
                  <Button
                    variant="outline"
                    className="bg-white text-black rounded-3xl uppercase border-0 h-10 hover:bg-gray-200 transition-colors"
                    onClick={() => setDialogOpen(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#a668ff] text-neutral-950 rounded-3xl uppercase h-10 hover:bg-[#9152e0] transition-colors"
                    onClick={listNFTOnKiosk}
                    disabled={isProcessing || !listingPrice || !!priceError}
                    isLoading={isProcessing}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <PasscodeAuthDialog
          open={openAuthDialog}
          setOpen={(open) => setOpenAuthDialog(open)}
          onSuccess={listNFTOnKiosk}
        />
      </Fragment>
    );
  }
);

CreativeOnchainItem.displayName = "CreativeOnchainItem";
