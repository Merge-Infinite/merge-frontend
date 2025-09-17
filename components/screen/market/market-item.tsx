import { useUniversalApp } from "@/app/context/UniversalAppContext";
import Emoji from "@/components/common/Emoji";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { RecipeItem } from "@/components/PoolCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { formatSUI } from "@/lib/wallet/core";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import useSuiBalance from "@/lib/wallet/hooks/coin/useSuiBalance";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useFeatureFlags } from "@/lib/wallet/hooks/useFeatureFlags";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import {
  CREATURE_NFT_MODULE_NAME,
  CREATURE_POLICY_ID,
  ELEMENT_POLICY_ID,
  FEE_ADDRESS,
  MER3_PACKAGE_ID,
} from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress } from "@mysten/sui/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

export const MarketItem = React.memo(
  ({
    element,
    prompt,
    price,
    loading: initialLoading,
    imageUrl,
    materials,
    emoji,
    nftId,
    seller_kiosk,
    isOwned,
    onSubmitOnchainComplete,
    type,
  }: {
    element: string;
    prompt?: string;
    id: string;
    price?: string;
    loading?: boolean;
    imageUrl: string;
    materials: number[];
    emoji: string;
    nftId: string;
    seller_kiosk: string;
    isOwned?: boolean;
    onSubmitOnchainComplete?: () => void;
    type: string;
  }) => {
    const { isTelegram, suiBalance } = useUniversalApp();
    const featureFlags = useFeatureFlags();
    const apiClient = useApiClient();
    const { user } = useUser();
    const appContext = useSelector((state: RootState) => state.appContext);
    const authed = useSelector((state: RootState) => state.appContext.authed);
    const { address, fetchAddressByAccountId } = useAccount(
      appContext.accountId
    );
    const [items, setItems] = useState<RecipeItem[]>([]);
    const account = useCurrentAccount();
    const { data: network } = useNetwork(appContext.networkId);
    const [loading, setLoading] = useState(initialLoading || false);
    const [copied, setCopied] = useState(false);
    const [openAuthDialog, setOpenAuthDialog] = useState(false);
    const router = useRouter();
    const { data: balance } = useSuiBalance(address);
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

    const recipesApi = useApi({
      key: ["recipes-items"],
      method: "POST",
      url: "recipes/items",
    }).post;

    useEffect(() => {
      const fetchItems = async () => {
        try {
          const response = await recipesApi?.mutateAsync({
            itemIds: materials,
          });

          if (response.items) {
            setItems(response.items);
          }
        } catch (error) {
          console.error("Error fetching items:", error);
        }
      };

      fetchItems();
    }, []);

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
        if (
          Number(isTelegram ? balance.balance : suiBalance || 0) < Number(price)
        ) {
          toast.error("Insufficient balance");
          return;
        }
        if (!isTelegram && !account?.address) {
          toast.error("Please login to your account");
          return;
        } else if (isTelegram && !address) {
          toast.error("Please connect your wallet");
          return;
        }

        // Show processing toast
        toast.info("Transaction in progress...");

        const txb = new Transaction();
        const paymentCoin = txb.splitCoins(txb.gas, [Number(price)]);

        // Use txb.object instead of txb.pure.id for better compatibility
        const [nft, request] = txb.moveCall({
          target: "0x2::kiosk::purchase",
          arguments: [txb.object(seller_kiosk), txb.object(nftId), paymentCoin],
          typeArguments: [type],
        });

        txb.moveCall({
          target: `0x2::transfer_policy::confirm_request`,
          typeArguments: [type],
          arguments: [txb.object(nftTypeToPolicyId(type)), request],
        });

        txb.transferObjects(
          [nft],
          txb.pure.address(isTelegram ? address : account?.address || "")
        );
        // Calculate 3% fee for the platform owner
        const feeAmount = Math.floor(Number(price) * 0.03);
        const platformOwnerAddress = FEE_ADDRESS;
        if (feeAmount <= 0) return;

        const feeCoin = txb.splitCoins(txb.gas, [feeAmount]);

        txb.transferObjects([feeCoin], txb.pure.address(platformOwnerAddress));

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
          toast.success(`You are now the owner of ${element} ${emoji}`);
        } else {
          toast.error("Failed to purchase NFT. Please try again.");
        }
      } catch (error: any) {
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
        if (!user) {
          toast.error("User not found");
          return;
        }
        let recipient = address;
        if (!isTelegram) {
          recipient = account?.address || "";
        }
        if (!recipient) {
          toast.error("Please connect your wallet");
          return;
        }
        setLoading(true);
        const txb = new Transaction();

        txb.moveCall({
          target: "0x2::kiosk::delist",
          arguments: [
            txb.object(user?.kiosk?.objectId),
            txb.object(user?.kiosk?.ownerCapId),
            txb.pure.address(nftId),
          ],
          typeArguments: [type],
        });
        console.log(nftId);
        const [takenObject] = txb.moveCall({
          target: "0x2::kiosk::take",
          arguments: [
            txb.object(user?.kiosk?.objectId),
            txb.object(user?.kiosk?.ownerCapId),
            txb.pure.id(nftId),
          ],
          typeArguments: [type],
        });
        txb.transferObjects([takenObject], recipient);
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
          toast.success("Your NFT has been delisted successfully");
          await onSubmitOnchainComplete?.();
        } else {
          toast.error("Failed to delist NFT. Please try again.");
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
        setLoading(false);
      }
    }

    const handleCopyElements = () => {
      router.push(`/creative?prompt=${JSON.stringify(prompt)}`);
    };

    return (
      <Card className="w-full sm:w-60 bg-transparent transition-all duration-300 gap-2 flex flex-col">
        <Image
          src={
            imageUrl.includes("https") ? imageUrl : `https://wal.gg/${imageUrl}`
          }
          alt={element}
          width={100}
          height={100}
          className="self-center w-full rounded-2xl border-b border-[#333333]"
        />

        <div className="flex flex-col items-center gap-2">
          <div
            className="text-[#68ffd1] text-sm font-normal font-['Sora'] underline"
            onClick={handleCopyId}
          >
            {formatAddress(nftId)} {copied ? "✓" : ""}
            {isCreatureNFT(type) ? (
              <Image
                src="/images/copy.svg"
                alt="Copy"
                width={20}
                height={20}
                className="inline ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyElements();
                }}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap justify-start items-center gap-1">
            <Image
              src="/images/Info.svg"
              alt="Copy"
              width={15}
              height={15}
              className="inline ml-2"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyElements();
              }}
            />
            <div className="justify-start text-white text-xs font-normal font-sora leading-none">
              Elements:
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap text-center justify-end text-white text-xs font-bold font-sora leading-none"
              >
                <Emoji emoji={item.emoji} size={18} /> {item.handle}
              </div>
            ))}
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
                    {formatSUI(Number(price))} SUI
                  </>
                )}
              </div>
            </div>
            {!isOwned ? (
              <Button
                className=" text-black w-fit uppercase rounded-3xl"
                onClick={purchaseNFT}
                disabled={
                  loading ||
                  Number(isTelegram ? balance.balance : suiBalance || 0) <
                    Number(price)
                }
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

const nftTypeToPolicyId = (type: string) => {
  if (type === `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::CreatureNFT`) {
    return CREATURE_POLICY_ID;
  }
  return ELEMENT_POLICY_ID;
};

const isCreatureNFT = (type: string) => {
  return (
    type === `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::CreatureNFT`
  );
};
