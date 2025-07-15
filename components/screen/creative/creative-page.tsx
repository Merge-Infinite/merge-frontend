"use client";
import { useUniversalApp } from "@/app/context/UniversalAppContext";
import ElementItem from "@/components/common/ElementItem";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import FeatureCard from "@/components/screen/creative/feature-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
import { useCurrentAccount, useSignTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress, MIST_PER_SUI } from "@mysten/sui/utils";
import { AlertTriangle, Plus, Search, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

// Recipe type definition
interface RecipeItem {
  itemId: number;
  quantity: number;
  availableAmount?: number;
  itemHandle?: string;
  itemEmoji?: string;
}

interface Recipe {
  head?: RecipeItem[];
  body?: RecipeItem[];
  environment?: RecipeItem[];
  hand?: RecipeItem[];
  leg?: RecipeItem[];
  material?: RecipeItem[];
  style?: RecipeItem[];
}

const CreatureCustomizer = () => {
  const params = useSearchParams();
  const recipeParam = params.get("recipe");
  const apiClient = useApiClient();
  const { isLoading, startLoading, stopLoading } = useLoading();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState("");
  const [elementDialog, setElementDialog] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [topic, setTopic] = useState("all");
  const [creatureName, setCreatureName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [debouncedText] = useDebounce(searchText, 500);
  const [mintBottomSheetOpen, setMintBottomSheetOpen] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [missingItems, setMissingItems] = useState<{
    [key: string]: RecipeItem[];
  }>({});

  const [filteredElements, setFilteredElements] = useState<any[]>([]);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const { data: balance } = useSuiBalance(address);
  const account = useCurrentAccount();
  // Get inventory data from useUser hook
  const { inventory } = useUser(debouncedText);
  const { isTelegram, suiBalance } = useUniversalApp();
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
  const { mutateAsync: signTransaction } = useSignTransaction();

  const { mutateAsync: mint, isPending } = creativeApi.mint.useMutation();

  const [contentParts, setContentParts] = useState<any[]>([]);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const contentRef = useRef(null);
  const [creationMethod, setCreationMethod] = useState("prompt");
  const [textInputDialog, setTextInputDialog] = useState(false);
  const [pendingTextInput, setPendingTextInput] = useState("");
  // Insert element at cursor position
  const insertElement = (element: any, qty = 1) => {
    const newElement = { ...element, quantity: qty };

    if (cursorPosition !== null) {
      const newParts = [...contentParts];
      newParts.splice(cursorPosition, 0, {
        type: "element",
        element: newElement,
      });
      setContentParts(newParts);
      setCursorPosition(cursorPosition + 1);
    } else {
      setContentParts((prev) => [
        ...prev,
        { type: "element", element: newElement },
      ]);
    }

    setSelectedElement(null);
    setQuantity("1");
  };

  // Remove element
  const removePromptElement = (index: number) => {
    const newParts = contentParts.filter((_, i) => i !== index);
    setContentParts(newParts);
  };

  // Handle text editing
  const startEditingText = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  const saveTextEdit = () => {
    if (editingIndex !== null) {
      const newParts = [...contentParts];
      newParts[editingIndex] = { type: "text", content: editingText };
      setContentParts(newParts);
      setEditingIndex(null);
      setEditingText("");
    }
  };

  const cancelTextEdit = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  // Add text at cursor position
  const addTextAtCursor = () => {
    setPendingTextInput(""); // Reset the input
    setTextInputDialog(true); // Open the dialog
  };

  const getAllElements = () => {
    return contentParts
      .filter((part) => part.type === "element")
      .map((part) => part.element);
  };

  // Parse recipe from URL parameter
  useEffect(() => {
    if (recipeParam) {
      try {
        const parsedRecipe = JSON.parse(decodeURIComponent(recipeParam));
        setRecipe(parsedRecipe);
      } catch (error) {
        console.error("Failed to parse recipe:", error);
        toast.error("Invalid recipe format");
      }
    }
  }, [recipeParam]);

  // Auto-fill recipe when inventory is loaded
  useEffect(() => {
    if (recipe && inventory && inventory.length > 0) {
      fillRecipeElements();
    }
  }, [recipe, inventory]);

  // Function to find inventory item by itemId
  const findInventoryItem = (itemId: number) => {
    return inventory?.find((item) => item.itemId === itemId);
  };

  // Function to fill recipe elements and check for missing items
  const fillRecipeElements = () => {
    if (!recipe || !inventory) return;

    const newSelectedElements: { [key: string]: any[] } = {
      Style: [],
      Material: [],
      Head: [],
      Body: [],
      Hand: [],
      Leg: [],
      Environment: [],
    };

    const newMissingItems: { [key: string]: RecipeItem[] } = {};

    // Map recipe keys to feature names
    const keyMapping = {
      style: "Style",
      material: "Material",
      head: "Head",
      body: "Body",
      hand: "Hand",
      leg: "Leg",
      environment: "Environment",
    };

    // Track total usage across all features to prevent double allocation
    const totalUsageTracker: { [itemId: number]: number } = {};

    Object.entries(recipe).forEach(([key, items]) => {
      const featureName = keyMapping[key as keyof typeof keyMapping];
      if (!featureName || !items) return;

      const missingForFeature: RecipeItem[] = [];

      items.forEach((recipeItem: RecipeItem) => {
        const inventoryItem = findInventoryItem(recipeItem.itemId);

        if (inventoryItem) {
          // Calculate how much is already allocated
          const alreadyAllocated = totalUsageTracker[recipeItem.itemId] || 0;
          const availableAmount = inventoryItem.amount - alreadyAllocated;
          const requestedAmount = recipeItem.quantity;

          if (availableAmount >= requestedAmount) {
            // User has enough, add to selected elements
            const elementToAdd = {
              ...inventoryItem,
              quantity: requestedAmount,
              displayQuantity: `(${requestedAmount})`,
            };
            newSelectedElements[featureName].push(elementToAdd);

            // Track the allocation
            totalUsageTracker[recipeItem.itemId] =
              alreadyAllocated + requestedAmount;
          } else {
            // User doesn't have enough after previous allocations
            missingForFeature.push({
              ...recipeItem,
              availableAmount,
              itemHandle: inventoryItem.handle,
              itemEmoji: inventoryItem.emoji,
            });
            console.log(
              `Missing ${inventoryItem.handle}: need ${requestedAmount}, have ${availableAmount} (${inventoryItem.amount} total, ${alreadyAllocated} already allocated)`
            );
          }
        } else {
          // Item not found in inventory
          missingForFeature.push({
            ...recipeItem,
            availableAmount: 0,
            itemHandle: undefined,
            itemEmoji: undefined,
          });
          console.log(`Item ${recipeItem.itemId} not found in inventory`);
        }
      });

      if (missingForFeature.length > 0) {
        newMissingItems[featureName] = missingForFeature;
      }
    });

    setSelectedElements(newSelectedElements);
    setMissingItems(newMissingItems);

    // Show toast if there are missing items
    const totalMissing = Object.values(newMissingItems).flat().length;
    const totalAdded = Object.values(newSelectedElements).flat().length;

    if (totalAdded > 0) {
      toast.success(`Added ${totalAdded} items from recipe to form`);
    }

    if (totalMissing > 0) {
      toast.error(`Missing ${totalMissing} required items for this recipe`);
    }
  };

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
    const validation =
      creationMethod === "manual"
        ? validateMintRequirements()
        : { isValid: true, missingFields: [] };
    const hasMissingItems = Object.keys(missingItems).length > 0;
    return validation.isValid && !isLoading && !isPending && !hasMissingItems;
  };

  // Get missing items for a specific feature
  const getMissingItemsForFeature = (feature: string) => {
    return missingItems[feature] || [];
  };

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
    const validation =
      creationMethod === "manual"
        ? validateMintRequirements()
        : creatureName.trim() === ""
        ? { isValid: false, missingFields: ["Creature Name"] }
        : { isValid: true, missingFields: [] };

    if (!validation.isValid) {
      const missingText = validation.missingFields.join(", ");
      toast.error(`Please complete the following: ${missingText}`);
      return;
    }

    if (Object.keys(missingItems).length > 0) {
      toast.error(
        "Cannot mint: You have missing required items for this recipe"
      );
      return;
    }

    setMintBottomSheetOpen(true);
  };

  const handleMintClick = async () => {
    try {
      // Double-check validation before proceeding
      const selectedElementsCopy =
        creationMethod === "manual"
          ? selectedElements
          : {
              material: contentParts
                .filter((part) => part.type === "element")
                .map((part) => ({
                  itemId: part.element.itemId,
                  amount: part.element.quantity,
                })),
            };
      const elementInfos =
        creationMethod === "manual"
          ? Object.values(selectedElementsCopy)
              .flat()
              .map((element) => ({
                itemId: element.itemId,
                itemName: element.handle,
                amount: element.quantity || 0,
              }))
          : contentParts
              .filter((part) => part.type === "element")
              .map((part) => ({
                itemId: part.element.itemId,
                itemName: part.element.handle,
                amount: part.element.quantity || 0,
              }));
      const validation =
        creationMethod === "manual"
          ? validateMintRequirements()
          : { isValid: true, missingFields: [] };
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
          topic: topic,
          creatureName: creatureName,
          selectedElements: selectedElementsCopy,
          elementInfos,
          prompt: creationMethod === "prompt" ? contentParts : "",
          data: {
            transactionBlockBytes:
              (response as any).transactionBlockBytes ||
              (response as any).bytes,
            signature: (response as any).signature,
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

  const getTotalUsedAmount = (elementId: number) => {
    let totalUsed = 0;
    Object.values(selectedElements).forEach((featureElements) => {
      featureElements.forEach((element) => {
        // Use itemId instead of id for comparison
        if (element.itemId === elementId) {
          totalUsed += element.quantity || 1;
        }
      });
    });
    return totalUsed;
  };

  // Fixed confirmElementSelection function
  const confirmElementSelection = () => {
    if (!selectedElement) return;

    // Use itemId instead of id
    const totalUsed = getTotalUsedAmount(selectedElement.itemId);
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

  const confirmTextAddition = () => {
    if (pendingTextInput.trim() === "") {
      toast.error("Please enter some text");
      return;
    }

    if (cursorPosition !== null) {
      const newParts = [...contentParts];
      newParts.splice(cursorPosition, 0, {
        type: "text",
        content: pendingTextInput,
      });
      setContentParts(newParts);
      setCursorPosition(cursorPosition + 1);
    } else {
      setContentParts((prev) => [
        ...prev,
        { type: "text", content: pendingTextInput },
      ]);
    }

    setTextInputDialog(false);
    setPendingTextInput("");
  };

  return (
    <div className="w-full flex flex-col gap-2 relative bg-black">
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
      />

      {/* Recipe Status Banner */}
      {recipe && (
        <div
          className={`w-full p-3 rounded-lg border ${
            Object.keys(missingItems).length > 0
              ? "bg-red-900/20 border-red-500"
              : "bg-green-900/20 border-green-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {Object.keys(missingItems).length > 0 ? (
              <>
                <AlertTriangle className="text-red-400" size={16} />
                <span className="text-red-400 text-sm font-medium">
                  Recipe loaded with missing items
                </span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-green-400 rounded-full" />
                <span className="text-green-400 text-sm font-medium">
                  Recipe loaded successfully
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Name Input */}
      <Input
        value={creatureName}
        onChange={(e) => setCreatureName(e.target.value)}
        placeholder="Enter creature name"
        className="bg-[#141414] text-white border-[#333333] rounded-[32px] font-bold"
      />

      <div className="w-full space-y-3 ">
        <RadioGroup
          value={creationMethod}
          onValueChange={setCreationMethod}
          className="flex flex-row justify-start items-center"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="manual" id="manual" />
            <Label htmlFor="manual" className="text-white text-sm">
              Manual
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="prompt" id="prompt" />
            <Label htmlFor="prompt" className="text-white text-sm">
              Prompt
            </Label>
          </div>
        </RadioGroup>
      </div>

      {creationMethod === "manual" && (
        <div className="w-full flex flex-col gap-2">
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
              missingItems={getMissingItemsForFeature("Style")}
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
              missingItems={getMissingItemsForFeature("Material")}
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
              missingItems={getMissingItemsForFeature("Head")}
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
              missingItems={getMissingItemsForFeature("Body")}
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
              missingItems={getMissingItemsForFeature("Hand")}
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
              missingItems={getMissingItemsForFeature("Leg")}
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
              missingItems={getMissingItemsForFeature("Environment")}
            />
          </div>
        </div>
      )}

      {creationMethod === "prompt" && (
        <Card className="rounded-2xl border-[#1f1f1f] w-full">
          <CardContent className="space-y-4 w-full p-3">
            <div
              ref={contentRef}
              className="min-h-[120px] w-[300px] max-w-[400px] bg-muted/30 rounded-lg  border-dashed border-muted-foreground/20 cursor-text hover:border-muted-foreground/40 transition-colors w-full"
              onClick={() => setCursorPosition(contentParts.length)}
            >
              <div className="flex flex-wrap items-start gap-1 leading-relaxed break-words w-fulls">
                {cursorPosition === 0 && (
                  <div className="w-0.5 h-6 bg-primary animate-pulse flex-shrink-0"></div>
                )}

                {contentParts.map((part: any, index: number) => (
                  <React.Fragment key={index}>
                    {part.type === "text" ? (
                      editingIndex === index ? (
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={saveTextEdit}
                          onKeyPress={(e) =>
                            e.key === "Enter" && saveTextEdit()
                          }
                          onKeyDown={(e) =>
                            e.key === "Escape" && cancelTextEdit()
                          }
                          className="inline-block resize-none border-0 border-b-2 border-primary bg-transparent focus-visible:ring-0 focus:outline-none p-1 w-32 min-h-[24px] text-sm leading-tight overflow-hidden break-words text-white"
                          autoFocus
                          rows={1}
                        />
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingText(index, part.content);
                          }}
                          className="hover:bg-muted/50 px-1 rounded cursor-text transition-colors inline-block break-words max-w-full text-white"
                        >
                          {part.content || "\u00A0"}
                        </span>
                      )
                    ) : (
                      <Badge
                        variant="default"
                        className="inline-flex items-center gap-2 mx-1 rounded-2xl bg-transparent border border-white px-4 py-1"
                      >
                        {part.element?.emoji}
                        <span className="text-xs font-medium text-white">
                          {part.element.handle}
                        </span>
                        {part.element.quantity > 1 && (
                          <span className="text-xs opacity-80">
                            ({part.element.quantity})
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 bg-white rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePromptElement(index);
                          }}
                        >
                          <X className="h-3 w-3 text-black" />
                        </Button>
                      </Badge>
                    )}

                    {/* Cursor after each element */}
                    {cursorPosition === index + 1 && (
                      <div
                        className="w-0.5 h-6 bg-primary animate-pulse mx-1 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      ></div>
                    )}
                  </React.Fragment>
                ))}

                {contentParts.length === 0 && (
                  <div className="w-0.5 h-6 bg-primary animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={addTextAtCursor}
                className="flex items-center gap-1 rounded-2xl"
              >
                <Plus className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setBottomSheetOpen(true);
                }}
                className="flex items-center gap-1 rounded-2xl"
              >
                <Plus className="h-4 w-4" />
                Element
              </Button>
              <div className="flex-1"></div>
              <Badge variant="secondary" className="text-xs">
                {getAllElements().length} elements
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
        {Object.keys(missingItems).length > 0 ? "Missing Items" : "Mint"}
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
              {creationMethod === "manual" ? (
                <div className="text-white text-base font-semibold">
                  {`Select elements for ${selectedFeature} (${getRemainingSlots(
                    selectedFeature
                  )} left)`}
                </div>
              ) : (
                <div className="text-white text-base font-semibold">
                  {`Select elements`}
                </div>
              )}
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

      <Dialog open={textInputDialog} onOpenChange={setTextInputDialog}>
        <DialogContent className="bg-[#1f1f1f] text-white border-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add Text</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="text-white text-sm">Enter text to add:</div>
            <Textarea
              value={pendingTextInput}
              onChange={(e) => setPendingTextInput(e.target.value)}
              placeholder="Type your text here..."
              className="bg-[#141414] text-white border-[#333333] rounded-lg min-h-[100px]"
              autoFocus
            />
            <div className="text-neutral-400 text-xs">
              This text will be added to your prompt at the current cursor
              position.
            </div>
          </div>
          <DialogFooter className="flex gap-2 flex-row">
            <Button
              onClick={confirmTextAddition}
              className="flex-1 bg-[#a668ff] text-neutral-950 rounded-3xl uppercase text-white"
              disabled={pendingTextInput.trim() === ""}
            >
              Add Text
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTextInputDialog(false);
                setPendingTextInput("");
              }}
              className="flex-1 bg-white text-black rounded-3xl uppercase"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Element Dialog */}
      <Dialog open={elementDialog} onOpenChange={setElementDialog}>
        <DialogContent className="bg-[#1f1f1f] text-white border-none rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {creationMethod === "manual"
                ? `Add Element to ${selectedFeature}`
                : `Add Element`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {selectedElement && (
              <Button
                variant="ghost"
                className="px-3 py-1 rounded-3xl border border-white justify-start w-fit"
              >
                <span className="text-white text-xs uppercase flex items-center gap-2">
                  {selectedElement?.emoji.includes("https") ? (
                    <Image
                      src={selectedElement?.emoji}
                      alt={selectedElement?.handle}
                      width={16}
                      height={16}
                    />
                  ) : (
                    selectedElement?.emoji
                  )}
                  {selectedElement?.handle}
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
                        {selectedElement?.emoji.includes("https") ? (
                          <Image
                            src={selectedElement?.emoji}
                            alt={selectedElement?.handle}
                            width={16}
                            height={16}
                          />
                        ) : (
                          selectedElement?.emoji
                        )}
                        {selectedElement?.handle}
                      </span>
                    </Button>
                    <div className="text-neutral-400 text-xs">
                      Available:{" "}
                      {selectedElement.amount -
                        getTotalUsedAmount(selectedElement.itemId)}{" "}
                      / {selectedElement.amount}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2 flex-row">
            <Button
              onClick={() => {
                if (creationMethod === "manual") {
                  confirmElementSelection();
                } else {
                  insertElement(selectedElement, 1);
                  setElementDialog(false);
                }
              }}
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

            {/* <div className="self-stretch p-4 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] inline-flex justify-start items-start gap-4">
              <div className="w-40 h-40 relative bg-[#1f1f1f] rounded-2xl flex justify-center items-center gap-2 overflow-hidden">
                <div className="w-40 h-40" alt="creature preview" />
                <div className="left-[129px] top-[129px] absolute rounded-lg flex justify-start items-start gap-2">
                  <div className="w-6 h-6 relative overflow-hidden">
                    <div className="w-4 h-4 left-[3px] top-[3px] absolute rounded-full outline outline-[1.50px] outline-offset-[-0.75px] outline-neutral-400" />
                  </div>
                </div>
              </div>

              <div className="flex-1 inline-flex flex-col justify-start items-start gap-4"></div>
            </div> */}

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
                    {formatAddress(
                      isTelegram ? address : account?.address || ""
                    )}
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
                    {formatSUI(isTelegram ? balance.balance : suiBalance || 0)}{" "}
                    SUI
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
