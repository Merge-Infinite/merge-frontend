"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import CreateWallet from "@/components/common/CreateWallet";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import { useNFTList } from "@/hooks/useNFTList";
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
  MER3_PACKAGE_ID,
} from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { CreativeOnchainItem } from "./creative-onchain-item";
import { CardItem } from "./onchain-item";

export function OnchainBagScreen() {
  const { isTelegram } = useUniversalApp();
  const apiClient = useApiClient();
  const { user, refetch } = useUser();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const initialized = useSelector(
    (state: RootState) => state.appContext.initialized
  );
  const client = useSuiClient();

  const account = useCurrentAccount();
  const callingKiosk = useRef(false);
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

  const {
    nfts,
    loading,
    error,
    refresh: nftsRefresh,
  } = useNFTList({
    walletAddress: isTelegram ? address : account?.address,
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${MER3_PACKAGE_ID}::${ELEMENT_NFT_MODULE_NAME}::${"CreativeElementNFT"}`,
  });

  const {
    nfts: creatureNfts,
    loading: creatureNftsLoading,
    error: creatureNftsError,
    refresh: creatureNftsRefresh,
  } = useNFTList({
    walletAddress: isTelegram ? address : account?.address,
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::${"CreatureNFT"}`,
  });

  useEffect(() => {
    if (isTelegram && !authed) {
      setOpenAuthDialog(true);
    }
  }, [authed, appContext.accountId, isTelegram]);

  useEffect(() => {
    if (isTelegram && !address && authed) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [address, authed, isTelegram]);

  const createKioskApi = useApi({
    key: ["create-kiosk"],
    method: "POST",
    url: "marketplace/kiosk/create",
  }).post;

  const handleCreateKiosk = useCallback(async () => {
    if (callingKiosk.current) return;
    callingKiosk.current = true;
    try {
      if (isTelegram && !address && authed) {
        toast.error("No address found");
        return;
      }
      if (!account?.address) {
        toast.error("wallet is not connected");
        return;
      }

      let tx = new Transaction();
      let [kiosk, kioskOwnerCap] = tx.moveCall({
        target: "0x2::kiosk::new",
      });

      tx.transferObjects(
        [kioskOwnerCap],
        tx.pure.address(isTelegram ? address : account?.address)
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
        console.log(response);
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
          await refetch();

          toast.success("Kiosk created successfully!");
        }
      }
    } catch (error: any) {
      console.error("Error creating kiosk:", error);
      if (error.message === "Authentication required") {
        setOpenAuthDialog(true);
      } else {
        toast.error(error.message || "Error creating kiosk");
      }
    } finally {
      callingKiosk.current = false;
    }
  }, [address, authed, isTelegram, account?.address]);

  useEffect(() => {
    if (
      user &&
      !user.kiosk &&
      ((authed && address) || (!isTelegram && account?.address))
    ) {
      handleCreateKiosk();
    }
  }, [user, authed, address, isTelegram, account?.address]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {!initialized && isTelegram ? (
        <CreateWallet />
      ) : user && !user.kiosk ? (
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="text-white text-2xl font-bold">
            Creating your kiosk...
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="self-stretch h-10 rounded-3xl flex-col justify-start items-start gap-1 flex">
            <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-start gap-4 inline-flex">
              <Image
                src="/images/search.svg"
                alt="search"
                width={24}
                height={24}
              />
              <Input
                className="grow shrink basis-0 h-full text-white text-sm font-normal leading-normal focus:outline-none border-transparent"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <SkeletonCard />
            ) : (
              nfts
                .map((nft) => {
                  const display = nft?.data?.display?.data;
                  console.log("nft", nft);
                  return {
                    id: nft!.data.objectId,
                    name: display?.name || "Element NFT",
                    amount: display?.amount || 0,
                    itemId: Number(display?.item_id),
                    imageUrl: display?.image_url,
                  };
                })
                .map((card, index) => (
                  <CardItem
                    key={index}
                    element={card.name}
                    amount={card.amount}
                    itemId={card.itemId}
                    imageUrl={card.imageUrl}
                    id={card.id}
                    onListingComplete={nftsRefresh}
                  />
                ))
            )}

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
                  <CreativeOnchainItem
                    key={index}
                    id={card.id}
                    name={card.name}
                    imageUrl={card.imageUrl}
                    onListingComplete={creatureNftsRefresh}
                  />
                ))
            )}
          </div>
        </div>
      )}
      {isTelegram && (
        <PasscodeAuthDialog
          open={openAuthDialog}
          setOpen={(open) => setOpenAuthDialog(open)}
          onSuccess={async () => {
            await nftsRefresh();
            await creatureNftsRefresh();
          }}
        />
      )}
    </div>
  );
}
