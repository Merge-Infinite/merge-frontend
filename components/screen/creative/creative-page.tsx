"use client";
import { useUniversalApp } from "@/app/context/UniversalAppContext";
import ElementItem from "@/components/common/ElementItem";
import Emoji from "@/components/common/Emoji";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useLoading } from "@/hooks/useLoading";
import { useUser } from "@/hooks/useUser";
import creativeApi from "@/lib/api/creative";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import useSuiBalance from "@/lib/wallet/hooks/coin/useSuiBalance";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import { FEE_ADDRESS, GENERATION_FEE } from "@/utils/constants";
import { useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

const CreatureCustomizer = () => {
  const searchParams = useSearchParams();
  const apiClient = useApiClient();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [creatureName, setCreatureName] = useState("");
  const suiPrice = useSelector((state: RootState) => state.appContext.suiPrice);

  // Parse prompt from URL params if available
  const promptParam = searchParams.get("prompt");
  const initialPrompt = promptParam || "";
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedPromptElements, setSelectedPromptElements] = useState<any[]>(
    []
  );
  const [searchText, setSearchText] = useState("");
  const [debouncedText] = useDebounce(searchText, 500);
  const [mintBottomSheetOpen, setMintBottomSheetOpen] = useState(false);
  const [filteredElements, setFilteredElements] = useState<any[]>([]);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const { data: balance } = useSuiBalance(address);
  const { inventory } = useUser(debouncedText);
  const { isTelegram, suiBalance } = useUniversalApp();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: mint, isPending } = creativeApi.mint.useMutation();
  const { data: supportedTokens } = creativeApi.getSupportedTokens.useQuery();

  console.log(supportedTokens);

  useEffect(() => {
    if (!address && appContext.authed && isTelegram) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [address, appContext.accountId, appContext.authed, isTelegram]);

  useEffect(() => {
    if (!appContext.authed && isTelegram) {
      setOpenAuthDialog(true);
    }
  }, [appContext.authed, isTelegram]);

  // Filter elements based on search text
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      if (searchText.trim() === "") {
        setFilteredElements(inventory.filter((element) => !element.isBasic));
      } else {
        const filtered = inventory
          .filter((element) =>
            element.handle.toLowerCase().includes(searchText.toLowerCase())
          )
          .filter((element) => !element.isBasic);
        setFilteredElements(filtered);
      }
    }
  }, [inventory, searchText]);

  const regularElements = inventory
    ? inventory.filter((element) => !element.isBasic)
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e?.target?.value || "");
  };

  // Check if mint button should be enabled
  const isMintEnabled = () => {
    // Check if all fields are filled and at least 3 elements match the prompt
    if (creatureName.trim() === "") return false;
    if (prompt.trim() === "") return false;
    if (selectedPromptElements.length < 3) return false;

    // Check if selected elements match keywords in the prompt
    const promptLower = prompt.toLowerCase();
    const matchingElements = selectedPromptElements.filter((element) =>
      promptLower.includes(element.handle.toLowerCase())
    );

    return matchingElements.length >= 3 && !isLoading && !isPending;
  };

  // Handle mint button click with validation
  const handleMintButtonClick = () => {
    if (creatureName.trim() === "") {
      toast.error("Please enter an NFT name");
      return;
    }

    if (prompt.trim() === "") {
      toast.error("Please enter a description for your NFT");
      return;
    }

    if (selectedPromptElements.length < 3) {
      toast.error(
        `Please select at least 3 elements (currently have ${selectedPromptElements.length})`
      );
      return;
    }

    const promptLower = prompt.toLowerCase();
    const matchingElements = selectedPromptElements.filter((element) =>
      promptLower.includes(element.handle.toLowerCase())
    );

    if (matchingElements.length < 3) {
      toast.error(
        `Your prompt must contain at least 3 element keywords. Currently matching: ${matchingElements.length}`
      );
      return;
    }

    setMintBottomSheetOpen(true);
  };

  const handleMintClick = async () => {
    try {
      const selectedElementsCopy = {
        material: selectedPromptElements.map((element) => ({
          itemId: element.itemId,
          amount: 1,
        })),
      };

      const elementInfos = selectedPromptElements.map((element) => ({
        itemId: element.itemId,
        itemName: element.handle,
        amount: 1,
      }));

      startLoading();
      const paymentTx = new Transaction();

      const [mintFeeAmount] = paymentTx.splitCoins(paymentTx.gas, [
        GENERATION_FEE * Number(MIST_PER_SUI),
      ]);

      paymentTx.transferObjects([mintFeeAmount], FEE_ADDRESS);
      let response;
      if (isTelegram) {
        response = await apiClient.callFunc<
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
      } else {
        response = await signTransaction({
          transaction: paymentTx.serialize(),
        });
      }
      if (response && (response as any).signature) {
        await mint({
          topic: "all",
          creatureName: creatureName,
          selectedElements: selectedElementsCopy,
          elementInfos,
          prompt: prompt,
          data: {
            transactionBlockBytes:
              (response as any).transactionBlockBytes ||
              (response as any).bytes,
            signature: (response as any).signature,
            coinType: selectedToken?.coinType || "0x2::sui::SUI",
          },
        }).then(() => {
          setMintBottomSheetOpen(false);
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === "Authentication required") {
        setOpenAuthDialog(true);
      }
    } finally {
      stopLoading();
    }
  };

  // Count matching keywords
  const getMatchingCount = () => {
    const promptLower = prompt.toLowerCase();
    return selectedPromptElements.filter((element) =>
      promptLower.includes(element.handle.toLowerCase())
    ).length;
  };

  return (
    <div className="w-full flex flex-col gap-2 relative bg-black">
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
      />

      {/* Step 1: Name Input */}
      <div className="px-4 py-2.5 bg-neutral-950/60 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] flex flex-col gap-2">
        <div className="text-white text-base font-normal">
          Step 1 : Name your NFT
        </div>
        <div className="w-full px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333]">
          <Input
            value={creatureName}
            onChange={(e) => setCreatureName(e.target.value)}
            placeholder="Enter NFT name"
            className={`bg-transparent border-0 text-base p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#666666] ${
              creatureName ? "text-white font-bold" : "text-[#666666]"
            }`}
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Step 2: Build Prompt */}
      <div className="px-4 py-2.5 bg-neutral-950/60 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] flex flex-col gap-2">
        <div className="text-white text-base font-normal">
          Step 2 : Build your prompt
        </div>
        <div className="text-[#858585] text-xs font-normal">
          Tell us how your NFT should look and feel. Be bold, be creative
        </div>
        <div className="min-h-20 max-h-52 px-3 py-2 bg-[#141414] rounded-xl outline outline-1 outline-offset-[-1px] outline-[#333333] overflow-hidden">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A powerful superhero with a muscular body and sharp mask..."
            className={`bg-transparent border-0 text-base p-0 min-h-[76px] max-h-[200px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#666666] ${
              prompt ? "text-white font-normal" : "text-[#666666]"
            }`}
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Step 3: Add Elements */}
      <div className="px-4 py-2.5 bg-neutral-950/60 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] flex flex-col gap-2">
        <div className="text-white text-base font-normal">
          Step 3 : Add elements
        </div>
        <div className="text-[#858585] text-xs font-normal">
          Choose{" "}
          <span className="text-white font-bold">at least 3 elements</span>.
          These will be the required keywords your prompt needs to contain.
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedPromptElements.map((element, idx) => {
            const promptLower = prompt.toLowerCase();
            const isMatching = promptLower.includes(
              element.handle.toLowerCase()
            );

            return (
              <div
                key={idx}
                className={`pl-3 pr-1 py-1 rounded-3xl outline outline-1 outline-offset-[-1px] ${
                  isMatching ? "outline-[#68ffd1]" : "outline-[#ff6868]"
                } flex items-center gap-2`}
              >
                <span
                  className={`text-xs uppercase ${
                    isMatching ? "text-[#68ffd1]" : "text-[#ff6868]"
                  }`}
                >
                  <Emoji emoji={element.emoji} size={18} />
                  {element.handle}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setSelectedPromptElements((prev) =>
                      prev.filter((_, i) => i !== idx)
                    );
                  }}
                >
                  <X className="h-5 w-5 text-white" />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setBottomSheetOpen(true);
          }}
          className="w-fit px-3 py-1 bg-[#a668ff] rounded-3xl"
        >
          <span className="text-white text-sm font-bold">+ Add Element</span>
        </Button>
      </div>

      {/* Bottom Sheet for Element Selection */}
      <Sheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
        <SheetContent
          side="bottom"
          className="p-0 bg-[#141414] rounded-t-3xl h-96 border-t-0"
        >
          <div className="self-stretch p-4 flex flex-col justify-start items-start gap-2">
            {/* Selection title */}
            <div className="flex w-full justify-between">
              <div className="space-y-1">
                <div className="text-white text-base font-semibold">
                  Select Elements
                </div>
                <div className="text-neutral-400 text-xs">
                  Choose elements to add to your NFT (minimum 3 required)
                </div>
              </div>
            </div>

            {/* Search input */}
            <div className="self-stretch">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-white opacity-95" />
                <Input
                  value={searchText}
                  onChange={handleSearchChange}
                  placeholder="Search elements..."
                  className="pl-10 bg-[#141414] text-white border-[#333333] rounded-[32px] text-base"
                  style={{ fontSize: "16px" }}
                />
              </div>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="self-stretch flex justify-center items-center py-4">
                <div className="text-white">Loading elements...</div>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && (!inventory || inventory.length === 0) && (
              <div className="self-stretch flex justify-center items-center py-4">
                <div className="text-white">No elements found</div>
              </div>
            )}

            {!isLoading && regularElements.length > 0 && (
              <div className="w-full flex flex-col justify-start items-start gap-1">
                <div className="text-white text-sm">
                  Elements: (
                  <span className="text-[#68ffd1]">
                    {regularElements.length}
                  </span>
                  )
                </div>
                <div className="self-stretch flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                  {(searchText.trim() !== ""
                    ? filteredElements
                    : regularElements
                  ).map((element, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        // Add to prompt elements
                        if (selectedPromptElements.length < 10) {
                          setSelectedPromptElements((prev) => [
                            ...prev,
                            element,
                          ]);
                          setBottomSheetOpen(false);
                        } else {
                          toast.error("Maximum 10 elements allowed");
                        }
                      }}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <ElementItem {...element} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mint Bottom Sheet */}
      <Sheet open={mintBottomSheetOpen} onOpenChange={setMintBottomSheetOpen}>
        <SheetContent side="bottom" className="p-0 border-0 bg-[#141414]">
          <div className="w-full bg-[#141414] rounded-tl-3xl rounded-tr-3xl inline-flex flex-col justify-start items-center gap-4">
            <div className="self-stretch h-11 px-4 pt-4 inline-flex justify-between items-center">
              <div className="justify-start text-white text-sm font-semibold uppercase leading-normal tracking-wide">
                Select Token
              </div>
            </div>
            <div className="self-stretch px-4 pb-2 flex flex-col justify-start items-start gap-5 overflow-hidden">
              <div className="self-stretch inline-flex justify-center items-start gap-1">
                <div className="flex-1 justify-start text-white text-base font-semibold leading-normal tracking-wider">
                  Fee:
                </div>
                <div className="flex justify-start items-center gap-2">
                  <div className="justify-start text-white text-base font-semibold leading-normal tracking-wider">
                    {GENERATION_FEE} SUI
                  </div>
                  <div className="justify-start text-[#858585] text-base font-semibold uppercase leading-normal tracking-wider">
                    ~ ${suiPrice.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col justify-start items-start gap-2 overflow-hidden max-h-60 overflow-y-auto">
                {supportedTokens?.map((token: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedToken(token)}
                    className={`self-stretch px-4 py-2.5 bg-[#292929] rounded-2xl outline outline-1 outline-offset-[-1px] ${
                      selectedToken?.coinType === token.coinType
                        ? "outline-[#53cca7]"
                        : "outline-transparent"
                    } inline-flex justify-start items-center gap-2 overflow-hidden cursor-pointer hover:outline-[#53cca7] transition-all`}
                  >
                    <div className="size-8 relative rounded-xs">
                      <Image
                        src={token.imgUrl || "/images/sui.svg"}
                        alt={token.coinSymbol}
                        width={32}
                        height={32}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-start">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-1">
                          <div className="text-white text-sm font-normal leading-normal">
                            {token.coinSymbol}
                          </div>
                        </div>
                        <div className="text-[#858585] text-xs font-normal">
                          ${token.price?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full px-4 pt-4 pb-8 bg-[#141414] rounded-tl-2xl rounded-tr-2xl flex flex-col justify-start items-start gap-2">
              <Button
                className="self-stretch px-4 py-2 bg-[#a668ff] rounded-3xl inline-flex justify-center items-center gap-2"
                onClick={handleMintClick}
                disabled={isLoading || isPending}
                isLoading={isLoading || isPending}
              >
                <div className="justify-start text-white text-sm font-bold leading-normal">
                  {isLoading || isPending ? "Minting..." : "Confirm"}
                </div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mint Button */}
      <div className="w-full pt-4 pb-8 bg-[#141414] rounded-tl-2xl rounded-tr-2xl px-4 flex flex-col gap-2">
        {getMatchingCount() >= 3 ? (
          <div className="text-center text-[#5cb91a] text-xs">
            {getMatchingCount()}/3 matching keywords
          </div>
        ) : (
          <div className="text-center text-[#ff6868] text-xs">
            {getMatchingCount()}/3 matching keywords (need{" "}
            {3 - getMatchingCount()} more)
          </div>
        )}
        <Button
          className={`w-full rounded-3xl py-2 ${
            isMintEnabled()
              ? "bg-[#a668ff] text-white hover:bg-[#9555e6]"
              : "bg-[#4a4a4a] text-[#888888] cursor-not-allowed"
          }`}
          onClick={handleMintButtonClick}
          disabled={!isMintEnabled()}
        >
          <span className="text-sm font-bold uppercase">Mint</span>
        </Button>
      </div>
    </div>
  );
};

export default CreatureCustomizer;
