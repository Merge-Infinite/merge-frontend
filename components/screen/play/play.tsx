/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { SearchIcon } from "lucide-react";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import { useCallback, useEffect, useState } from "react";
import { XYCoord } from "react-dnd";
import { DndProvider } from "react-dnd-multi-backend";
import { useDebounce } from "use-debounce";
import DraggableBox from "../../common/DraggableBox";
import MergingArea from "../../common/MergingArea";
import GamePlayInfo from "../../common/play-info";

interface PlayGameProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

export default function PlayGame({}: PlayGameProps) {
  const [mergingBoxes, setMergingBoxes] = useState({});
  const [instanceCounter, setInstanceCounter] = useState(0);
  const [targetBox, setTargetBox] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedText] = useDebounce(search, 1000);
  const { inventory, refetchInventory, refetch } = useUser(debouncedText);
  const mergeApi = useApi({
    key: ["craft-word"],
    method: "POST",
    url: "user/craft-word",
  }).post;

  useEffect(() => {
    refetchInventory?.();
  }, [debouncedText]);

  const handleDropToMerge = useCallback(
    async (
      targetInstanceId: string,
      droppedItem: any,
      isFromInventory: boolean
    ) => {
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
      if (isFromInventory) return;
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

        refetchInventory?.();
        refetch?.();

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
    [mergingBoxes, inventory]
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
          <div className="self-stretch px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-start items-start gap-4">
            <SearchIcon className="w-5 h-5 text-white" />
            <Input
              className="inline-flex h-5 flex-col justify-start items-start overflow-hidden text-white ring-0 px-0 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap  overflow-y-auto">
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
