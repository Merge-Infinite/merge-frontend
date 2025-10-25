"use client";

import { PoolInfoSheet } from "@/components/PoolInfoSheet";
import { Button } from "@/components/ui/button";
import useApi from "@/hooks/useApi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Emoji from "./common/Emoji";

interface Pool {
  id: string;
  tokenType: string;
  name: string;
  description: string;
  imageUrl?: string;
  startTime: number;
  endTime: number;
  requiredElements?: number[];
  participantCount?: number;
  totalStakedCount?: number;
  totalPrize?: string;
}

interface PoolCardProps {
  pool: Pool;
}

export interface RecipeItem {
  id: number;
  handle: string;
  emoji: string;
  isNew: boolean;
  explore: number;
  reward: number;
  mask: number;
  dep: null | number;
  freq: number;
  isBasic: boolean;
}

function truncateText(text: string, maxLength: number = 70): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function PoolCard({ pool }: PoolCardProps) {
  const router = useRouter();
  const [items, setItems] = useState<RecipeItem[]>([]);

  const recipesApi = useApi({
    key: ["recipes-items"],
    method: "POST",
    url: "recipes/items",
  }).post;

  const currentTime = Date.now();
  const startTime = pool.startTime;
  const endTime = pool.endTime;

  let poolState = "active";
  let stateText = "Go";
  let stateClass = "bg-white text-black hover:bg-gray-200";
  let disabled = false;

  if (startTime > currentTime) {
    poolState = "coming-soon";
    stateText = "Coming soon";
    stateClass =
      "bg-[#1f1f1f] text-white outline outline-1 outline-offset-[-1px] outline-[#292929]";
    disabled = true;
  } else if (currentTime > endTime) {
    poolState = "ended";
    stateText = "Ended.";
    stateClass = "bg-neutral-800 text-white";
    disabled = false;
  }

  // Fetch recipes/items data using your API
  useEffect(() => {
    const fetchItems = async () => {
      if (!pool.id) return;

      try {
        const response = await recipesApi?.mutateAsync({
          itemIds: pool.requiredElements,
        });

        if (response.items) {
          setItems(response.items);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  return (
    <div
      key={pool.id}
      data-property-2="SUI"
      data-type={poolState === "coming-soon" ? "Coming soon" : poolState}
      className="w-full p-3 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#292929] inline-flex justify-start items-start gap-2.5 overflow-hidden"
    >
      <Image
        className="w-36 h-full max-w-36 max-h-36 rounded-xl"
        src={pool.imageUrl || "https://placehold.co/80x80"}
        alt={pool.name}
        width={144}
        height={144}
      />
      <div className="flex-1 inline-flex flex-col justify-start items-start gap-2">
        <PoolInfoSheet pool={pool as any} poolRequiredItems={items}>
          <div className="cursor-pointer">
            <div className="self-stretch justify-start text-white text-base font-semibold font-sora uppercase leading-6 tracking-wider line-clamp-2 break-words hover:text-[#a668ff] transition-colors">
              {pool.name}
            </div>
            <div className="self-stretch justify-start text-[#858585] text-sm font-normal font-sora underline leading-6 line-clamp-1 hover:text-white transition-colors">
              {truncateText(pool.description)}
            </div>
          </div>
        </PoolInfoSheet>

        {/* Display items from API */}
        <div className="self-stretch inline-flex justify-start items-start gap-1.5 flex-wrap content-start">
          <div className="justify-start text-white text-xs font-normal font-sora leading-4">
            *Required Elements:
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="text-center justify-start text-white text-xs font-bold font-sora leading-4"
                >
                  <Emoji emoji={item.emoji} size={18} /> {item.handle} (1)
                </div>
              ))
            ) : (
              <div className="text-center justify-start text-white text-xs font-bold font-sora leading-4">
                Any 3 elements
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`w-14 px-3 py-1 rounded-3xl inline-flex justify-center items-center gap-2 text-xs font-normal font-sora uppercase leading-6 ${stateClass}`}
          onClick={() => {
            if (!disabled) {
              router.push(
                `/universe?poolId=${pool.id}&coinType=${pool.tokenType}`
              );
            }
          }}
        >
          {stateText}
        </Button>
      </div>
    </div>
  );
}
