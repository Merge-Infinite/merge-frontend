"use client";
import ElementItem from "@/components/common/ElementItem";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import FeatureCard from "@/components/screen/creative/feature-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLoading } from "@/hooks/useLoading";
import { useUser } from "@/hooks/useUser";
import creativeApi from "@/lib/api/creative";
import { formatSUI } from "@/lib/wallet/core";
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
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress, MIST_PER_SUI } from "@mysten/sui/utils";
import { Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

const CreatureCustomizer = () => {
  const apiClient = useApiClient();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [elementDialog, setElementDialog] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [topic, setTopic] = useState("");
  const [creatureName, setCreatureName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedText] = useDebounce(searchText, 500);
  const [mintBottomSheetOpen, setMintBottomSheetOpen] = useState(false);

  const [filteredElements, setFilteredElements] = useState<any[]>([]);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const { data: balance } = useSuiBalance(address);

  // Get inventory data from useUser hook
  const { inventory } = useUser(debouncedText);

  // Track selected elements for each feature with restrictions
  const [selectedElements, setSelectedElements] = useState<{
    [key: string]: any[];
  }>({
    Style: [], // Max: 1
    Material: [], // Max: 1
    Head: [], // Max: 2 (host + accessory)
    Body: [], // Max: 2 (host + accessory)
    Hand: [], // Max: 2 (host + accessory)
    Leg: [], // Max: 2 (host + accessory)
    Environment: [], // Max: 1
  });

  const { mutate: mint, isPending } = creativeApi.mint.useMutation();

  // Get remaining slots for a feature
  const getRemainingSlots = (feature: string) => {
    const limits = {
      Style: 1,
      Material: 1,
      Head: 2,
      Body: 2,
      Hand: 2,
      Leg: 2,
      Environment: 1,
    };

    return (
      limits[feature as keyof typeof limits] -
      (selectedElements[feature as keyof typeof selectedElements]?.length || 0)
    );
  };

  // Validation function to check if all required fields are filled
  const validateMintRequirements = () => {
    const missingFields = [];

    // Check if topic is selected
    if (!topic || topic.trim() === "") {
      missingFields.push("Topic");
    }

    // Check if creature name is filled
    if (!creatureName || creatureName.trim() === "") {
      missingFields.push("Creature Name");
    }

    // Check if all required elements are selected
    const requiredFeatures = [
      "Style",
      "Material",
      "Head",
      "Body",
      "Hand",
      "Leg",
      "Environment",
    ];
    const missingFeatures = requiredFeatures.filter((feature) => {
      const selected = selectedElements[feature];
      return !selected || selected.length === 0;
    });

    if (missingFeatures.length > 0) {
      missingFields.push(
        ...missingFeatures.map((feature) => `${feature} element`)
      );
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  // Check if mint button should be enabled
  const isMintEnabled = () => {
    const validation = validateMintRequirements();
    return validation.isValid && !isLoading && !isPending;
  };

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

  // When feature selection button is clicked
  const openElementSelection = (feature: string) => {
    if (getRemainingSlots(feature) <= 0) {
      return;
    }

    setSelectedFeature(feature);
    setBottomSheetOpen(true);
    setSearchText("");
  };

  // When an element is selected
  const selectElement = (element: any) => {
    setSelectedElement(element);
    setBottomSheetOpen(false);

    // Default quantity based on part type
    if (
      selectedFeature === "Head" ||
      selectedFeature === "Body" ||
      selectedFeature === "Hand" ||
      selectedFeature === "Leg"
    ) {
      setQuantity("1");
    } else {
      setQuantity("1");
    }

    setElementDialog(true);
  };

  // Remove element from a feature
  const removeElement = (feature: string, index: number) => {
    setSelectedElements((prev) => {
      const updatedElements = { ...prev };
      if (feature in updatedElements) {
        const featureKey = feature as keyof typeof updatedElements;
        updatedElements[featureKey] = updatedElements[featureKey].filter(
          (_, i) => i !== index
        );
      }
      return updatedElements;
    });
  };

  // Handle mint button click with validation
  const handleMintButtonClick = () => {
    const validation = validateMintRequirements();

    if (!validation.isValid) {
      const missingText = validation.missingFields.join(", ");
      toast.error(`Please complete the following: ${missingText}`);
      return;
    }

    setMintBottomSheetOpen(true);
  };

  const handleMintClick = async () => {
    try {
      // Double-check validation before proceeding
      console.log(selectedElements);
      const elementInfos = Object.values(selectedElements)
        .flat()
        .map((element) => ({
          itemId: element.id,
          amount: element.quantity,
        }));
      console.log(elementInfos);
      const validation = validateMintRequirements();
      if (!validation.isValid) {
        const missingText = validation.missingFields.join(", ");
        toast.error(`Please complete the following: ${missingText}`);
        return;
      }

      startLoading();
      const paymentTx = new Transaction();

      const [mintFeeAmount] = paymentTx.splitCoins(paymentTx.gas, [
        GENERATION_FEE * Number(MIST_PER_SUI),
      ]);

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
        await mint({
          topic: topic,
          creatureName: creatureName,
          selectedElements: selectedElements,
          elementInfos,
          data: {
            transactionBlockBytes: (response as any).transactionBlockBytes,
            signature: (response as any).signature,
          },
        });
        setMintBottomSheetOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to mint creature. Please try again.");
    } finally {
      stopLoading();
    }
  };

  const getTotalUsedAmount = (elementId: string) => {
    let totalUsed = 0;
    Object.values(selectedElements).forEach((featureElements) => {
      featureElements.forEach((element) => {
        if (element.id === elementId) {
          totalUsed += element.quantity || 1;
        }
      });
    });
    return totalUsed;
  };

  const confirmElementSelection = () => {
    if (!selectedElement) return;

    const totalUsed = getTotalUsedAmount(selectedElement.id);
    const requestedQuantity = parseInt(quantity);
    const availableAmount = selectedElement.amount - totalUsed;

    if (requestedQuantity > availableAmount) {
      toast.error(`You only have ${availableAmount} of this element available`);
      return;
    }

    const newElement = {
      ...selectedElement,
      quantity: requestedQuantity,
      displayQuantity: `(${requestedQuantity})`,
    };

    setSelectedElements((prev) => {
      const updatedElements = { ...prev };
      if (selectedFeature in updatedElements) {
        const featureKey = selectedFeature as keyof typeof updatedElements;
        updatedElements[featureKey] = [
          ...(updatedElements[featureKey] || []),
          newElement as any,
        ];
      }
      return updatedElements;
    });

    setElementDialog(false);
  };

  return (
    <div className="w-full flex flex-col gap-2 relative bg-black">
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
      />
      <div className="w-full">
        <Select onValueChange={(value) => setTopic(value)} value={topic}>
          <SelectTrigger className="w-full bg-[#1f1f1f] text-white rounded-2xl border-none">
            <SelectValue className="text-white" placeholder="Select Topic" />
          </SelectTrigger>
          <SelectContent className="bg-[#1f1f1f] text-white border-[#333333]">
            <SelectItem value="brainrot">Brainrot</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Name Input */}
      <Input
        value={creatureName}
        onChange={(e) => setCreatureName(e.target.value)}
        placeholder="Enter creature name"
        className="bg-[#141414] text-white border-[#333333] rounded-[32px] font-bold"
      />

      {/* Feature Cards - Row 1 */}
      <div className="w-full flex gap-2">
        {/* Style Card */}
        <FeatureCard
          title="Style"
          emoji="👽👾🤖"
          description="Add the style you want (only 1)"
          onAddClick={() => openElementSelection("Style")}
          disableAddButton={getRemainingSlots("Style") <= 0}
          selectedItems={selectedElements.Style}
          removeElement={removeElement}
        />

        {/* Material Card */}
        <FeatureCard
          title="Material"
          emoji="🪵"
          description="Choose the material (only 1)"
          onAddClick={() => openElementSelection("Material")}
          disableAddButton={getRemainingSlots("Material") <= 0}
          selectedItems={selectedElements.Material}
          removeElement={removeElement}
        />
      </div>

      {/* Feature Cards - Row 2 */}
      <div className="w-full flex gap-2">
        {/* Head Card */}
        <FeatureCard
          title="Head"
          emoji="🦈"
          description="What would the creature's head look like? 🤔"
          onAddClick={() => openElementSelection("Head")}
          disableAddButton={getRemainingSlots("Head") <= 0}
          selectedItems={selectedElements.Head}
          removeElement={removeElement}
        />

        {/* Body Card */}
        <FeatureCard
          title="Body"
          emoji="🦖"
          description="What would the creature's body look like? 🤔"
          onAddClick={() => openElementSelection("Body")}
          disableAddButton={getRemainingSlots("Body") <= 0}
          selectedItems={selectedElements.Body}
          removeElement={removeElement}
        />
      </div>

      {/* Feature Cards - Row 3 */}
      <div className="w-full flex gap-2">
        {/* Hand Card */}
        <FeatureCard
          title="Hand"
          emoji="✌️"
          description="What would the creature's hand look like? 🤔"
          onAddClick={() => openElementSelection("Hand")}
          disableAddButton={getRemainingSlots("Hand") <= 0}
          selectedItems={selectedElements.Hand}
          removeElement={removeElement}
        />

        {/* Leg Card */}
        <FeatureCard
          title="Leg"
          emoji="🦿"
          description="What would the creature's leg look like? 🤔"
          onAddClick={() => openElementSelection("Leg")}
          disableAddButton={getRemainingSlots("Leg") <= 0}
          selectedItems={selectedElements.Leg}
          removeElement={removeElement}
        />
      </div>

      {/* Environment Card - Full Width */}
      <div className="w-full">
        <FeatureCard
          title="Environment"
          emoji="🏞️"
          description="What will the environment look like? (only 1)"
          onAddClick={() => openElementSelection("Environment")}
          disableAddButton={getRemainingSlots("Environment") <= 0}
          selectedItems={selectedElements.Environment}
          removeElement={removeElement}
        />
      </div>

      {/* Mint Button */}
      <Button
        className={`mt-2 w-full rounded-3xl uppercase ${
          isMintEnabled()
            ? "bg-[#a668ff] text-neutral-950 hover:bg-[#9555e6]"
            : "bg-[#4a4a4a] text-[#888888] cursor-not-allowed"
        }`}
        onClick={handleMintButtonClick}
        disabled={!isMintEnabled()}
      >
        Mint
      </Button>

      {/* Bottom Sheet for Element Selection */}
      <Sheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
        <SheetContent
          side="bottom"
          className="p-0 bg-[#141414] rounded-t-3xl h-96 border-t-0"
        >
          <div className="self-stretch p-4 flex flex-col justify-start items-start gap-2">
            {/* Selection title */}
            <div className="flex w-full justify-between">
              <div className="text-white text-base font-semibold">
                {`Select elements for ${selectedFeature} (${getRemainingSlots(
                  selectedFeature
                )} left)`}
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
                  className="pl-10 bg-[#141414] text-white border-[#333333] rounded-[32px]"
                />
              </div>
            </div>

            {/* Only show element options in normal mode */}
            <>
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
                        onClick={() => selectElement(element)}
                        className="cursor-pointer transition-transform hover:scale-105"
                      >
                        <ElementItem {...element} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          </div>
        </SheetContent>
      </Sheet>

      {/* Element Dialog */}
      <Dialog open={elementDialog} onOpenChange={setElementDialog}>
        <DialogContent className="bg-[#1f1f1f] text-white border-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {`Add Element to ${selectedFeature}`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {selectedElement && (
              <Button
                variant="ghost"
                className="px-3 py-1 rounded-3xl border border-white justify-start w-fit"
              >
                <span className="text-white text-xs uppercase">
                  {selectedElement?.emoji} {selectedElement?.handle}
                </span>
              </Button>
            )}

            {/* Only show quantity for specific body parts */}
            {(selectedFeature === "Head" ||
              selectedFeature === "Body" ||
              selectedFeature === "Hand" ||
              selectedFeature === "Leg") && (
              <>
                <div className="text-white text-sm">Quantity:</div>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;

                    // Allow empty string so users can clear and retype
                    if (inputValue === "") {
                      setQuantity("");
                      return;
                    }

                    const value = parseInt(inputValue);

                    // Handle invalid number input (like non-numeric characters)
                    if (isNaN(value)) {
                      toast.error("Please enter a valid number");
                      return;
                    }

                    const totalUsed = getTotalUsedAmount(selectedElement?.id);
                    const availableAmount = selectedElement?.amount - totalUsed;

                    // Validate that value is greater than 0 and within available amount
                    if (value > 0 && value <= availableAmount) {
                      setQuantity(inputValue);
                    } else if (value <= 0) {
                      toast.error("Quantity must be greater than 0");
                    } else {
                      toast.error(
                        `You only have ${availableAmount} of this element available`
                      );
                    }
                  }}
                  className="bg-[#141414] text-white border-[#333333] rounded-[32px] font-bold w-60"
                />
                <div className="text-neutral-400 text-xs">
                  For example: create a 3-headed dog by setting quantity to 3
                </div>
                {selectedElement && (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="px-3 py-1 rounded-3xl border border-white justify-start w-fit"
                    >
                      <span className="text-white text-xs uppercase">
                        {selectedElement?.emoji} {selectedElement?.handle}
                      </span>
                    </Button>
                    <div className="text-neutral-400 text-xs">
                      Available:{" "}
                      {selectedElement.amount -
                        getTotalUsedAmount(selectedElement.id)}{" "}
                      / {selectedElement.amount}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2 flex-row">
            <Button
              onClick={confirmElementSelection}
              className="flex-1 bg-[#a668ff] text-neutral-950 rounded-3xl uppercase text-white"
            >
              Confirm
            </Button>
            <Button
              variant="secondary"
              onClick={() => setElementDialog(false)}
              className="flex-1 bg-white text-black rounded-3xl uppercase"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mint Bottom Sheet */}
      <Sheet open={mintBottomSheetOpen} onOpenChange={setMintBottomSheetOpen}>
        <SheetContent side="bottom" className="p-0 border-0">
          <div className="w-full px-4 pt-4 pb-10 bg-[#141414] rounded-tl-3xl rounded-tr-3xl inline-flex flex-col justify-start items-center gap-4">
            <div className="w-12 h-1 bg-[#1f1f1f] rounded-sm" />

            {/* Preview Section */}
            <div className="self-stretch p-4 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] inline-flex justify-start items-start gap-4">
              <div className="w-40 h-40 relative bg-[#1f1f1f] rounded-2xl flex justify-center items-center gap-2 overflow-hidden">
                <div className="w-40 h-40" alt="creature preview" />
                <div className="left-[129px] top-[129px] absolute rounded-lg flex justify-start items-start gap-2">
                  <div className="w-6 h-6 relative overflow-hidden">
                    <div className="w-4 h-4 left-[3px] top-[3px] absolute rounded-full outline outline-[1.50px] outline-offset-[-0.75px] outline-neutral-400" />
                  </div>
                </div>
              </div>

              <div className="flex-1 inline-flex flex-col justify-start items-start gap-4">
                {/* Subscription info */}
                <div className="self-stretch justify-start text-neutral-600 text-xs font-normal leading-none">
                  Subscription accounts will get previews and 3 times
                  re-generate images.
                </div>
              </div>
            </div>

            {/* Balance Section */}
            <div className="self-stretch p-4 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] flex flex-col justify-start items-start gap-2">
              <div className="justify-start text-white text-sm font-normal leading-normal">
                Your Balance
              </div>

              {/* Wallet and balance */}
              <div className="inline-flex justify-start items-center gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1 bg-white rounded-3xl flex justify-center items-center gap-2"
                >
                  <div className="justify-start text-black text-xs font-normal uppercase leading-normal">
                    {formatAddress(address)}
                  </div>
                </Button>
                <div className="flex justify-start items-center">
                  <Image
                    src="/images/sui.svg"
                    alt="SUI"
                    width={24}
                    height={24}
                  />
                  <div className="justify-start text-white text-sm font-normal leading-normal">
                    {formatSUI(balance.balance)} SUI
                  </div>
                </div>
              </div>

              {/* Fee info */}
              <div className="inline-flex justify-center items-center gap-2">
                <div className="justify-start text-white text-sm font-normal leading-normal">
                  Fee: {GENERATION_FEE} SUI
                </div>
                <Image src="/images/sui.svg" alt="SUI" width={24} height={24} />
              </div>

              {/* Mint button */}
              <Button
                className="self-stretch px-4 py-2 bg-[#a668ff] rounded-3xl inline-flex justify-center items-center gap-2"
                onClick={handleMintClick}
                disabled={isLoading || isPending}
                isLoading={isLoading || isPending}
              >
                <div className="justify-start text-neutral-950 text-sm font-normal uppercase leading-normal">
                  {isLoading || isPending ? "Minting..." : "Mint"}
                </div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CreatureCustomizer;
