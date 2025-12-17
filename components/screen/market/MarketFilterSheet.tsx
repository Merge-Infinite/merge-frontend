"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Close, Dropdown } from "@/components/icons";
import { useState } from "react";

type SortOption = "price_high" | "price_low";

interface MarketFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  showListingOnly: boolean;
  onShowListingOnlyChange: (show: boolean) => void;
  onApply: () => void;
  onClearAll: () => void;
}

export default function MarketFilterSheet({
  open,
  onOpenChange,
  sortBy,
  onSortByChange,
  showListingOnly,
  onShowListingOnlyChange,
  onApply,
  onClearAll,
}: MarketFilterSheetProps) {
  const [showSortSection, setShowSortSection] = useState(true);

  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  const handleClearAll = () => {
    onClearAll();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showClose={false} className="h-[80vh] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 h-11">
          <p className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
            Filters
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center"
          >
            <Close size={24} color="#858585" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 px-4 pt-3 h-[calc(100%-44px-88px)] overflow-y-auto">
          {/* Sort By Section */}
          <div className="flex flex-col gap-2">
            {/* Accordion Header */}
            <button
              onClick={() => setShowSortSection(!showSortSection)}
              className="flex items-center justify-between w-full"
            >
              <p className="text-sm font-bold font-['Sora'] text-white">
                Sort by
              </p>
              <Dropdown
                size={24}
                color="white"
                className={`transition-transform duration-200 ${
                  showSortSection ? "" : "rotate-180"
                }`}
              />
            </button>

            {showSortSection && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onSortByChange("price_high")}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm font-['Sora'] ${
                    sortBy === "price_high"
                      ? "bg-[#a768ff]/20 text-[#a768ff]"
                      : "bg-[#1f1f1f] text-[#adadad]"
                  }`}
                >
                  Price (Highest – Lowest)
                </button>
                <button
                  onClick={() => onSortByChange("price_low")}
                  className={`w-full px-3 py-2 rounded-lg text-left text-sm font-['Sora'] ${
                    sortBy === "price_low"
                      ? "bg-[#a768ff]/20 text-[#a768ff]"
                      : "bg-[#1f1f1f] text-[#adadad]"
                  }`}
                >
                  Price (Lowest - Highest)
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#292929]" />

          {/* Listing Toggle Section */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold font-['Sora'] text-white">
              Listing
            </p>
            <button
              onClick={() => onShowListingOnlyChange(!showListingOnly)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                showListingOnly ? "bg-[#53cca7]" : "bg-[#333333]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  showListingOnly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 px-4 pb-8 pt-4">
          <button
            onClick={handleClearAll}
            className="flex-1 h-10 bg-[#141414] border border-[#333333] rounded-3xl flex items-center justify-center"
          >
            <span className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
              Clear all
            </span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-10 bg-[#a768ff] border border-[#292929] rounded-3xl flex items-center justify-center"
          >
            <span className="text-sm font-semibold font-['Sora'] text-white uppercase tracking-wider">
              Apply
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
