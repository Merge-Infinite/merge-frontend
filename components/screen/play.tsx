/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import Image from "next/image";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useCallback, useEffect, useState } from "react";
import { XYCoord } from "react-dnd";
import { DndProvider } from "react-dnd-multi-backend";
import DraggableBox from "../common/DraggableBox";
import MergingArea from "../common/MergingArea";
import GamePlayInfo from "../common/play-info";

interface PlayGameProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

export default function PlayGame({}: PlayGameProps) {
  const { inventory, refetchInventory, refetch } = useUser();
  const [mergingBoxes, setMergingBoxes] = useState({});
  const [instanceCounter, setInstanceCounter] = useState(0);
  const [targetBox, setTargetBox] = useState({});
  // Track used items to prevent overuse
  const [usedItems, setUsedItems] = useState<Record<string, number>>({});

  // Reset used items when inventory changes
  useEffect(() => {
    setUsedItems({});
  }, [inventory]);

  const mergeApi = useApi({
    key: ["craft-word"],
    method: "POST",
    url: "user/craft-word",
  }).post;

  const handleDropToMerge = useCallback(
    async (targetInstanceId: string, droppedItem: any) => {
      // If we have two items in merging area, combine them
      const targetBox = (mergingBoxes as any)[targetInstanceId];
      if (!targetBox) return;

      // Check if either item is from inventory and has limited amount
      const checkItemAvailability = (item: any) => {
        const originalId = item.originalId || item.id;
        const inventoryItem = (inventory as any[])?.find(
          (element: any) => element.itemId === originalId
        );

        if (inventoryItem && !inventoryItem.isBasic) {
          // Count how many of this item are currently in use
          const countOnBoard = Object.values(mergingBoxes).filter(
            (box: any) =>
              !box.isHidden &&
              (box.originalId === originalId || box.id === originalId)
          ).length;

          // Check if we have enough
          return inventoryItem.amount >= countOnBoard;
        }
        return true; // Basic items or already placed items are always available
      };

      // Verify both items are available
      if (
        !checkItemAvailability(targetBox) ||
        !checkItemAvailability(droppedItem)
      ) {
        console.log("Not enough items available for merging");
        return;
      }

      setTargetBox(targetBox);
      const targetItemId = targetBox.originalId || targetBox.id;
      const droppedItemId = droppedItem.originalId || droppedItem.id;

      setMergingBoxes((prev: any) => {
        const newBoxes = { ...prev };
        const droppedInstanceId = droppedItem.instanceId;

        if (newBoxes[droppedInstanceId]) {
          newBoxes[droppedInstanceId] = {
            ...newBoxes[droppedInstanceId],
            isHidden: true,
          };
        }
        return newBoxes;
      });

      try {
        // Call the API to merge items
        const response: any = await mergeApi?.mutateAsync({
          item1: targetItemId,
          item2: droppedItemId,
        });

        const newInstanceId = `${response.id}_${Date.now()}`;
        const newElement = {
          id: newInstanceId,
          originalId: response.id,
          instanceId: newInstanceId,
          title: response.handle,
          emoji: response.emoji,
          left: droppedItem.left,
          top: droppedItem.top,
          isNew: true,
        };

        setMergingBoxes((prev: any) => {
          const newBoxes = { ...prev };
          delete newBoxes[targetInstanceId];
          delete newBoxes[droppedItem.instanceId];
          return {
            ...newBoxes,
            [newInstanceId]: newElement,
          };
        });

        // After successful merge, reset the used items tracking
        refetchInventory?.();
        refetch?.();
        setUsedItems({});

        setTimeout(() => {
          setMergingBoxes((prev: any) => {
            const newBoxes = { ...prev };
            if (newBoxes[newInstanceId]) {
              newBoxes[newInstanceId] = {
                ...newBoxes[newInstanceId],
                isNew: false,
              };
            }
            return newBoxes;
          });
        }, 1000);
      } catch (error) {
        console.error("Error combining elements:", error);
        setMergingBoxes((prev: any) => {
          const newBoxes = { ...prev };
          if (newBoxes[targetInstanceId]) {
            newBoxes[targetInstanceId] = {
              ...newBoxes[targetInstanceId],
              isHidden: false,
            };
          }
          if (newBoxes[droppedItem.instanceId]) {
            newBoxes[droppedItem.instanceId] = {
              ...newBoxes[droppedItem.instanceId],
              isHidden: false,
            };
          }
          return newBoxes;
        });
      }
    },
    [mergingBoxes, inventory, mergeApi, refetchInventory, refetch]
  );

  const handleDrop = useCallback(
    (droppedItem: any, delta: XYCoord, clientOffset: XYCoord) => {
      // Check if this is a non-basic inventory item that has a limited amount
      if (!droppedItem.isFromInventory) {
        const originalId = droppedItem.originalId || droppedItem.id;
        const inventoryItem = (inventory as any[])?.find(
          (element: any) => element.itemId === originalId && !element.isBasic
        );

        if (inventoryItem) {
          // Count how many of this item are currently in use
          const usedCount = Object.values(mergingBoxes).filter(
            (box: any) =>
              !box.isHidden &&
              (box.originalId === originalId || box.id === originalId)
          ).length;

          // If we've already used all available items, prevent dropping
          if (usedCount >= inventoryItem.amount) {
            console.log("Cannot drop - not enough items available");
            return;
          }
        }
      }

      const instanceId = `${droppedItem.id}_${Date.now()}_${instanceCounter}`;
      setInstanceCounter((prev) => prev + 1);

      if (
        droppedItem.id &&
        droppedItem.left !== undefined &&
        droppedItem.top !== undefined
      ) {
        if (delta && delta.x && delta.y) {
          const left = Math.round(droppedItem.left + delta.x);
          const top = Math.round(droppedItem.top + delta.y);
          const itemId = droppedItem.instanceId || instanceId;

          setMergingBoxes((prev: any) => ({
            ...prev,
            [itemId]: {
              ...droppedItem,
              originalId: droppedItem.id,
              instanceId: itemId,
              left,
              top,
            },
          }));
        }
      } else {
        if (clientOffset && clientOffset.x && clientOffset.y) {
          const left = Math.round(clientOffset.x - 60);
          const top = Math.round(clientOffset.y - 100);

          setMergingBoxes((prev: any) => ({
            ...prev,
            [instanceId]: {
              id: droppedItem.id,
              originalId: droppedItem.id,
              instanceId: instanceId,
              title: droppedItem.title,
              emoji: droppedItem.emoji,
              left: left,
              top: top,
              isFromInventory: droppedItem.isFromInventory,
            },
          }));
        }
      }
    },
    [mergingBoxes, instanceCounter, inventory]
  );

  const handleRemove = useCallback((instanceId: string) => {
    setMergingBoxes((prev: any) => {
      const newBoxes = { ...prev };
      delete newBoxes[instanceId];
      return newBoxes;
    });
  }, []);

  return (
    <DndProvider options={HTML5toTouch}>
      <div className="w-full h-full bg-black">
        <GamePlayInfo />

        <div className="h-[40%] mt-4">
          <MergingArea
            onDrop={handleDrop}
            onDropandMerge={handleDropToMerge}
            mergingBoxes={mergingBoxes}
            onRemove={handleRemove}
            isMerging={mergeApi?.isPending ?? false}
            mergingTarget={targetBox}
            inventory={inventory as any[]}
          />
        </div>
        <div className="flex-col justify-start items-start gap-5 inline-flex px-3 py-2 bg-[#141414] rounded-3xl h-1/2 w-full">
          <div className="self-stretch justify-start items-start gap-6 inline-flex">
            <div className="grow shrink basis-0 rounded-3xl flex-col justify-start items-start gap-1 inline-flex">
              <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-start gap-4 inline-flex">
                <Image
                  src="/images/search.svg"
                  alt="search"
                  width={24}
                  height={24}
                />
                <div className="grow shrink basis-0 h-6 text-[#5c5c5c] text-sm font-normal font-['Sora'] leading-normal">
                  Search items...
                </div>
              </div>
            </div>
          </div>
          <div className="self-stretch flex-col justify-start items-start gap-1 flex">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Infinite elements:
            </div>
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap">
              {(inventory as any[])
                ?.filter((element: any) => element.isBasic)
                .map((element: any) => (
                  <DraggableBox
                    key={element.id}
                    id={element.itemId}
                    title={element.handle}
                    emoji={element.emoji}
                    isFromInventory={true}
                  />
                ))}
            </div>
          </div>
          <div className="self-stretch flex-col justify-start items-start gap-1 flex">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Crafted elements:
            </div>
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap">
              {(inventory as any[])
                ?.filter(
                  (element: any) => !element.isBasic && element.amount > 0
                )
                .map((element: any) => {
                  // Count how many of this item are currently in use
                  const usedCount = Object.values(mergingBoxes).filter(
                    (box: any) =>
                      !box.isHidden &&
                      (box.originalId === element.itemId ||
                        box.id === element.itemId)
                  ).length;

                  // Check if we've used all available items
                  const isDisabled = usedCount >= element.amount;

                  return (
                    <DraggableBox
                      key={element.id}
                      id={element.itemId}
                      title={element.handle}
                      emoji={element.emoji}
                      amount={element.amount}
                      isFromInventory={true}
                      isDisabled={isDisabled}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
