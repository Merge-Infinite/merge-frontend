"use client";

import { PoolInfoSheet } from "@/components/PoolInfoSheet";
import { Button } from "@/components/ui/button";
import useApi from "@/hooks/useApi";
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
      className="w-full p-4 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#292929] flex   justify-start items-start gap-2"
    >
      <img
        className="w-20 h-20 p-2.5 rounded-xl"
        src={pool.imageUrl || "https://placehold.co/80x80"}
        alt={pool.name}
      />
      <div className="flex flex-col justify-start items-start gap-2 w-full flex-1">
        <PoolInfoSheet pool={pool as any} poolRequiredItems={items}>
          <div className="cursor-pointer">
            <div className="self-stretch justify-start text-white text-base font-semibold font-sora uppercase leading-normal break-words hover:text-[#a668ff] transition-colors">
              {pool.name}
            </div>
            <div className="w-full text-[#858585] text-sm font-normal font-sora underline decoration-dotted leading-normal hover:text-white transition-colors">
              {truncateText(pool.description)}
            </div>
          </div>
        </PoolInfoSheet>

        {/* Display items from API */}
        <div className="flex justify-start items-start gap-1.5 flex-wrap content-start">
          <div className="justify-start text-white text-xs font-normal font-sora leading-none">
            *Required Elements:
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 ? (
              items.map((item) => (
                <div
                  key={item.id}
                  className="text-center justify-start text-white text-xs font-bold font-sora leading-none"
                >
                  <Emoji emoji={item.emoji} size={18} /> {item.handle} (1)
                </div>
              ))
            ) : (
              <div className="text-center justify-start text-white text-xs font-bold font-sora leading-none">
                Any 3 elements
              </div>
            )}
          </div>
        </div>

        {/* Fallback to pool requirements if no items from API */}
        {items.length === 0 &&
          pool.requiredElements &&
          pool.requiredElements.length > 0 && (
            <div className="self-stretch inline-flex justify-start items-start gap-1.5 flex-wrap content-start">
              <div className="justify-start text-white text-xs font-normal font-sora leading-none">
                *Required Elements:
              </div>
              {pool.requiredElements.map((req: number, index: number) => (
                <div
                  key={index}
                  className="text-center justify-start text-white text-xs font-bold font-sora leading-none"
                >
                  {req}
                </div>
              ))}
            </div>
          )}

        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={`px-3 py-1 rounded-3xl inline-flex justify-center items-center gap-2 text-xs font-normal font-sora uppercase leading-normal ${stateClass}`}
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
