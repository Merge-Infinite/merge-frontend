import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/hooks/useUser";
import userApi from "@/lib/api/user";
import { QueryClient } from "@tanstack/react-query";
import { AlertTriangle, Info } from "lucide-react";
import Image from "next/image";
import React from "react";

interface MissingItem {
  itemId: number;
  quantity: number;
  availableAmount?: number;
  itemHandle?: string;
  itemEmoji?: string;
}
const queryClient = new QueryClient();

const FeatureCard = ({
  title,
  emoji,
  description,
  onAddClick,
  disableAddButton,
  selectedItems = [],
  removeElement,
  missingItems = [],
}: {
  title: string;
  emoji: string;
  description: string;
  onAddClick: () => void;
  disableAddButton: boolean;
  selectedItems: any[];
  removeElement: (title: string, index: number) => void;
  missingItems?: MissingItem[];
}) => {
  const { inventory } = useUser();

  return (
    <Card
      className={`flex-1 bg-neutral-950/60 border rounded-2xl ${
        missingItems.length > 0 ? "border-red-500" : "border-[#1f1f1f]"
      }`}
    >
      <CardHeader className="p-2 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white text-xl font-normal uppercase">
            {title} {emoji}
            {missingItems.length > 0 && (
              <AlertTriangle className="inline ml-2 h-4 w-4 text-red-400" />
            )}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="w-6 h-6 p-0">
                  <Info className="h-4 w-4 text-neutral-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {title === "Style" ||
                title === "Material" ||
                title === "Environment"
                  ? `Only 1 ${title.toLowerCase()} can be added`
                  : `Only 2 elements (1 host, 1 accessory) can be added to ${title.toLowerCase()}`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-neutral-600 text-xs">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 pb-6">
        {/* Display selected elements */}
        {selectedItems.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {selectedItems.map((item: any, idx: number) => (
              <Button
                key={`${title}-${idx}`}
                variant="ghost"
                size="sm"
                className="px-2 py-0.5 rounded-3xl border border-white h-6"
                onClick={() => removeElement(title, idx)}
              >
                <span className="text-white text-xs uppercase mr-1 flex items-center gap-2">
                  {item.emoji.includes("https") ? (
                    <Image
                      src={item.emoji}
                      alt={item.handle}
                      width={16}
                      height={16}
                    />
                  ) : (
                    item.emoji
                  )}
                  {item.handle}
                  {item.displayQuantity && (
                    <span className="text-[#68ffd1]">
                      {item.displayQuantity}
                    </span>
                  )}
                </span>
                <span className="text-[#ff6868]">×</span>
              </Button>
            ))}
          </div>
        )}

        {/* Display missing items */}
        {missingItems.length > 0 && (
          <div className="mb-2 p-2 bg-red-900/20 border border-red-500 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-1">
              <AlertTriangle size={12} />
              <span className="font-medium">Missing required items:</span>
            </div>
            <div className="space-y-1">
              {missingItems.map(async (missingItem, idx) => {
                let item = inventory?.find(
                  (i) => i.itemId === missingItem.itemId
                );
                if (!item) {
                  item = await userApi.getElement.fetcher({
                    itemId: missingItem.itemId,
                  });
                }
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-red-300 flex items-center gap-1">
                      {item.itemEmoji && (
                        <>
                          {item.itemEmoji.includes("https") ? (
                            <Image
                              src={item.itemEmoji}
                              alt={item.itemHandle || `Item ${item.itemId}`}
                              width={12}
                              height={12}
                            />
                          ) : (
                            <span>{item.itemEmoji}</span>
                          )}
                        </>
                      )}
                      <span>{item.itemHandle || `Item ${item.itemId}`}</span>
                    </span>
                    <span className="text-red-400 text-xs">
                      Need: {item.quantity}, Have: {item.availableAmount || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add element button */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={`w-14 h-6 rounded-3xl ${
              disableAddButton ? "bg-neutral-700" : "bg-white"
            } text-black px-3 py-1`}
            onClick={onAddClick}
            disabled={disableAddButton}
          >
            <span className="text-xs uppercase">+</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(FeatureCard);
