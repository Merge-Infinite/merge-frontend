"use client";

import { Input } from "@/components/ui/input";
import { useNFTList } from "@/hooks/useNFTList";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { RootState } from "@/lib/wallet/store";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";
import { CardItem } from "./onchain-item";
export function OnchainBagScreen() {
  const appContext = useSelector((state: RootState) => state.appContext);
  const { address } = useAccount(appContext.accountId);
  const [searchQuery, setSearchQuery] = useState("");
  const { nfts, loading, error, refresh } = useNFTList({
    walletAddress: address,
    refreshInterval: 5000,
    autoFetch: true,
  });

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
        {nfts.map((card, index) => (
          <CardItem
            key={index}
            element={card.name}
            amount={card.amount}
            emoji={card.emoji}
            itemId={card.itemId}
            id={card.id}
          />
        ))}
      </div>
    </div>
  );
}
