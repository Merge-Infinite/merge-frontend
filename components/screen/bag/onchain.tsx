"use client";

import TagSkeleton from "@/components/common/ElementSkeleton";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
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
import { Transaction } from "@mysten/sui/transactions";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { CardItem } from "./onchain-item";
export function OnchainBagScreen() {
  const apiClient = useApiClient();
  const { user, refetch } = useUser();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const [searchQuery, setSearchQuery] = useState("");
  const [openAuthDialog, setOpenAuthDialog] = useState(false);

  const { nfts, loading, error, refresh } = useNFTList({
    walletAddress: address,
    refreshInterval: undefined,
    autoFetch: true,
  });

  useEffect(() => {
    if (!authed) {
      setOpenAuthDialog(true);
    } else if (appContext.accountId) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [authed, appContext.accountId]);

  const createKioskApi = useApi({
    key: ["create-kiosk"],
    method: "POST",
    url: "marketplace/kiosk/create",
  }).post;

  const handleCreateKiosk = async () => {
    try {
      if (!address || !network) {
        return;
      }

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
          refetch();

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
    }
  };

  useEffect(() => {
    console.log("user", user);
    if (user && !user.kiosk && authed) {
      handleCreateKiosk();
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Search Bar */}
      <div className="self-stretch h-10 rounded-3xl flex-col justify-start items-start gap-1 flex">
        <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-start gap-4 inline-flex">
          <Image src="/images/search.svg" alt="search" width={24} height={24} />
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
          <TagSkeleton />
        ) : (
          nfts.map((card, index) => (
            <CardItem
              key={index}
              element={card.name}
              amount={card.amount}
              emoji={card.emoji}
              itemId={card.itemId}
              id={card.id}
            />
          ))
        )}
      </div>
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
        onSuccess={async () => {
          await refresh();
        }}
      />
    </div>
  );
}
