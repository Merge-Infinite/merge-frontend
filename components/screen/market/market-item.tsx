import { useUniversalApp } from "@/app/context/UniversalAppContext";
import Emoji from "@/components/common/Emoji";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { RecipeItem } from "@/components/PoolCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NFTImage } from "@/components/ui/nft-image";
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
      if (materials) {
        fetchItems();
      }
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
      } catch (error: unknown) {
        console.error("Purchase error:", error);
        const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
        if (errorMessage === "Authentication required") {
          setOpenAuthDialog(true);
        } else {
          toast.error(errorMessage);
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
          toast.success("Your NFT has been delisted successfully");
          await onSubmitOnchainComplete?.();
        } else {
          toast.error("Failed to delist NFT. Please try again.");
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
        setLoading(false);
      }
    }

    const handleCopyElements = () => {
      router.push(`/creative?prompt=${encodeURIComponent(prompt || "")}`);
    };

    // Determine if this is an element NFT (has emoji) or creature NFT (has image)
    const isElementNFT = !isCreatureNFT(type);

    return (
      <Card className="w-full bg-transparent border-none transition-all duration-300 gap-2 flex flex-col">
        {/* Image Container */}
        {isElementNFT ? (
          // Element NFT - White background with emoji
          <div className="aspect-square border border-[#1f1f1f] rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white">
            <p className="text-5xl leading-[56px] uppercase w-full">
              <Emoji emoji={emoji} size={48} />
            </p>
            <div className="text-sm leading-6 w-full">
              <p className="mb-0">{element}</p>
              <p>Qty: {items.length || 1}</p>
            </div>
          </div>
        ) : (
          // Creature NFT - Full image with badge overlay
          <div className="relative aspect-square rounded-2xl overflow-hidden">
            <NFTImage
              src={imageUrl}
              alt={element}
              width={177}
              height={177}
              className="w-full h-full object-cover"
            />
            {/* Badge count overlay */}
            <div className="absolute bottom-1.5 left-1.5 bg-[rgba(10,10,10,0.72)] text-white text-xs font-bold px-1.5 py-0 rounded-3xl min-w-[16px] h-[18px] flex items-center justify-center">
              1
            </div>
          </div>
        )}

        {/* NFT ID Link */}
        <div className="flex justify-center">
          <div
            className="text-[#68ffd1] text-sm font-normal font-['Sora'] underline cursor-pointer"
            onClick={handleCopyId}
          >
            #{formatAddress(nftId)}
          </div>
        </div>

        {/* Price and Buy Button Row */}
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            {price && (
              <>
                <Image
                  src="/images/sui.svg"
                  alt="Sui Logo"
                  className="h-6 w-6"
                  width={24}
                  height={24}
                />
                <span className="text-white text-xs font-normal font-['Sora']">
                  {formatSUI(Number(price))} SUI
                </span>
              </>
            )}
          </div>
          {!isOwned ? (
            <Button
              className="bg-[#a768ff] text-neutral-950 h-6 px-4 rounded-3xl text-xs font-normal uppercase"
              onClick={purchaseNFT}
              disabled={
                loading ||
                Number(isTelegram ? balance.balance : suiBalance || 0) <
                  Number(price)
              }
              isLoading={loading}
              size="sm"
            >
              {loading ? "..." : "Buy"}
            </Button>
          ) : (
            <Button
              className="bg-[#a768ff] text-neutral-950 h-6 px-4 rounded-3xl text-xs font-normal uppercase"
              onClick={deListNFT}
              disabled={loading}
              isLoading={loading}
              size="sm"
            >
              Cancel
            </Button>
          )}
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
