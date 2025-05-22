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
import { Info } from "lucide-react";
import React from "react";

const FeatureCard = ({
  title,
  emoji,
  description,
  onAddClick,
  disableAddButton,
  selectedItems = [],
  removeElement,
}: {
  title: string;
  emoji: string;
  description: string;
  onAddClick: () => void;
  disableAddButton: boolean;
  selectedItems: any[];
  removeElement: (title: string, index: number) => void;
}) => (
  <Card className="flex-1 bg-neutral-950/60 border border-[#1f1f1f] rounded-2xl">
    <CardHeader className="p-2 pb-0">
      <div className="flex justify-between items-center">
        <CardTitle className="text-white text-xl font-normal uppercase">
          {title} {emoji}
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
              <span className="text-white text-xs uppercase mr-1">
                {item.emoji} {item.handle} {item.displayQuantity}
              </span>
              <span className="text-[#ff6868]">×</span>
            </Button>
          ))}
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

export default React.memo(FeatureCard);
