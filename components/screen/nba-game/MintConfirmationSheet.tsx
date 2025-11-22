"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLoading } from "@/hooks/useLoading";
import nbaApi from "@/lib/api/nba";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import { ADMIN_ADDRESS, NBA_MINT_FEE } from "@/utils/constants";
import { useCurrentAccount, useSignTransaction } from "@mysten/dapp-kit";
import { MIST_PER_SUI } from "@mysten/sui.js";
import { Transaction } from "@mysten/sui/transactions";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

interface MintConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MintConfirmationSheet({
  open,
  onOpenChange,
}: MintConfirmationSheetProps) {
  const { isTelegram } = useUniversalApp();
  const apiClient = useApiClient();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address } = useAccount(appContext.accountId);
  const { mutateAsync: mint } = nbaApi.mint.useMutation();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [minting, setMinting] = useState(false);
  const account = useCurrentAccount();

  const handleMint = async () => {
    let walletAddress = address;
    if (!isTelegram) {
      walletAddress = account?.address || "";
    }

    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setMinting(true);
      startLoading();

      // Build the transaction
      const tx = new Transaction();

      // Split coins for mint fee (10 SUI)
      const [mintFee] = tx.splitCoins(tx.gas, [
        Number(NBA_MINT_FEE) * Number(MIST_PER_SUI),
      ]);

      // Transfer the fee to admin wallet
      tx.transferObjects([mintFee], ADMIN_ADDRESS);

      // Sign the transaction
      let response;
      if (isTelegram) {
        response = await apiClient.callFunc<
          SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
          undefined
        >(
          "txn",
          "signTransactionBlock",
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
        response = await signTransaction({
          transaction: tx.serialize(),
        });
      }
      console.log(response);
      // Submit to backend
      if ((response as any)?.signature) {
        await mint({
          transactionBlockBytes:
            (response as any).transactionBlockBytes || (response as any).bytes,
          userSignature: (response as any).signature,
        });

        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Mint error:", error);
      toast.error(error?.message || "Failed to mint NFT");
    } finally {
      setMinting(false);
      stopLoading();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showClose={false}
        className="h-auto bg-transparent border-0 p-6"
      >
        <div className="bg-[#1f1f1f] border border-[#292929] rounded-2xl p-6 flex flex-col gap-8 items-center">
          {/* Title */}
          <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider text-center w-full">
            Mint confirmation
          </p>

          {/* NFT Preview Placeholder */}
          <div className="bg-[#333333] rounded-[10px] w-60 h-60 flex items-center justify-center">
            <p className="text-4xl">🏀</p>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={handleMint}
            disabled={minting || isLoading}
            className="bg-[#a768ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-full h-10 disabled:bg-[#141414] disabled:border disabled:border-[#333333] disabled:text-[#707070]"
          >
            <span className="text-sm font-semibold font-['Sora'] uppercase tracking-wider">
              {minting || isLoading ? "Confirming..." : "Confirm in Wallet"}
            </span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
