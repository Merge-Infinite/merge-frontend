"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { Bag } from "@/components/icons";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

type MintState = "confirm" | "minting" | "success";

interface MintResult {
  nftId?: string;
  tokenId?: number;
  teamName?: string;
  tier?: number;
  imageUrl?: string;
}

interface SignTransactionResponse {
  signature?: string;
  transactionBlockBytes?: string;
  bytes?: string;
}

interface MintConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MintConfirmationSheet({
  open,
  onOpenChange,
}: MintConfirmationSheetProps) {
  const router = useRouter();
  const { isTelegram } = useUniversalApp();
  const apiClient = useApiClient();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address } = useAccount(appContext.accountId);
  const { mutateAsync: mint } = nbaApi.mint.useMutation();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [mintState, setMintState] = useState<MintState>("confirm");
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const account = useCurrentAccount();

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setMintState("confirm");
      setMintResult(null);
    }
  }, [open]);

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
      setMintState("minting");
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
      let response: SignTransactionResponse | undefined;
      if (isTelegram) {
        response = await apiClient.callFunc<
          SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
          SignTransactionResponse | undefined
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
        const signResult = await signTransaction({
          transaction: tx.serialize(),
        });
        response = signResult as SignTransactionResponse;
      }

      // Submit to backend
      if (response?.signature) {
        const result = await mint({
          transactionBlockBytes:
            response.transactionBlockBytes || response.bytes || "",
          userSignature: response.signature,
        });

        // Set mint result from API response
        setMintResult({
          nftId: result?.nftId,
          tokenId: result?.tokenId,
          teamName: result?.teamName,
          tier: result?.tier,
          imageUrl: result?.imageUrl,
        });

        setMintState("success");
      }
    } catch (error: unknown) {
      console.error("Mint error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mint NFT";
      toast.error(errorMessage);
      setMintState("confirm");
    } finally {
      stopLoading();
    }
  };

  const handleViewOnBag = () => {
    onOpenChange(false);
    router.push("/wallet?tab=nft");
  };

  const handleGoForAnother = () => {
    setMintState("confirm");
    setMintResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Render minting progress state
  if (mintState === "minting") {
    return (
      <Sheet open={open} onOpenChange={() => {}}>
        <SheetContent
          side="bottom"
          showClose={false}
          className="h-auto bg-transparent border-0 p-6"
        >
          <div className="bg-[#1f1f1f] border border-[#292929] rounded-2xl px-4 py-6 flex flex-col gap-8 items-center">
            {/* Content */}
            <div className="flex flex-col gap-2 items-center text-center w-full">
              <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-[1.28px]">
                Your NFT is minting
              </p>
              <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                We&apos;re generating your NFT. This may take a few seconds.
              </p>
            </div>

            {/* Minting Animation */}
            <div className="relative rounded-[10px] w-60 h-60 overflow-hidden">
              <Image
                src="/images/nba_placeholder.svg"
                alt="Minting NFT"
                fill
                className="object-cover animate-pulse"
              />
            </div>

            {/* Minting in Progress Button */}
            <div className="bg-[#141414] border border-[#333333] rounded-3xl w-full h-10 flex items-center justify-center gap-2 px-4">
              {/* Loading Spinner */}
              <svg
                className="animate-spin h-5 w-5 text-[#707070]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-semibold font-['Sora'] text-[#707070] uppercase tracking-[1.12px]">
                Minting in Progress
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Render success state
  if (mintState === "success") {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          showClose={false}
          className="h-auto bg-transparent border-0 p-6"
        >
          <div className="bg-[#1f1f1f] border border-[#292929] rounded-2xl px-4 py-6 flex flex-col gap-8 items-center relative overflow-hidden">
            {/* Confetti Animation Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full mix-blend-screen">
                {/* Animated confetti particles */}
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      backgroundColor: ["#a768ff", "#4CA3FF", "#53CCA7", "#DBA301", "#fff"][
                        Math.floor(Math.random() * 5)
                      ],
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 items-center text-center w-full relative z-10">
              <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-[1.28px]">
                You Got It!
              </p>
              <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                You&apos;ve successfully minted your
                <br />
                NBA Team NFT.
              </p>
            </div>

            {/* NFT Image */}
            <div className="relative border border-[#292929] rounded-[10px] w-60 h-60 shadow-[0px_2px_14px_6px_rgba(0,0,0,0.3)] z-10 overflow-hidden">
              <Image
                src={mintResult?.imageUrl || "/images/nba_placeholder.svg"}
                alt={mintResult?.teamName || "NBA NFT"}
                fill
                className="object-cover"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full relative z-10">
              {/* View on Bag Button */}
              <button
                onClick={handleViewOnBag}
                className="bg-[#141414] border border-[#333333] rounded-3xl w-full h-10 flex items-center justify-center gap-2 px-4 hover:bg-[#1a1a1a] transition-colors"
              >
                <span className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-[1.12px]">
                  View on bag
                </span>
                <Bag size={24} color="white" />
              </button>

              {/* Go for Another Button */}
              <Button
                onClick={handleGoForAnother}
                className="bg-[#a768ff] hover:bg-[#9154e7] text-white rounded-3xl w-full h-10"
              >
                <span className="text-sm font-semibold font-['Sora'] uppercase tracking-[1.12px]">
                  Go for Another
                </span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Render confirm state (default)
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
            disabled={isLoading}
            className="bg-[#a768ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-full h-10 disabled:bg-[#141414] disabled:border disabled:border-[#333333] disabled:text-[#707070]"
          >
            <span className="text-sm font-semibold font-['Sora'] uppercase tracking-wider">
              {isLoading ? "Confirming..." : "Confirm in Wallet"}
            </span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
