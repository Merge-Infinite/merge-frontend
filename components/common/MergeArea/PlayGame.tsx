/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MeasuringStrategy,
  MouseSensor,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SearchIcon } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import GamePlayInfo from "../../common/play-info";
import Emoji from "../Emoji";
import DraggableBox from "./DragItem";
import { adjustPositionWithinBounds, createUniqueId } from "./dragUtilities";
import MergingArea from "./MergingArea";

interface PlayGameProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

// Type for our box item
interface BoxItem {
  id: string;
  originalId: string;
  instanceId: string;
  title: string;
  emoji: string;
  left: number;
  top: number;
  isFromInventory?: boolean;
  isHidden?: boolean;
  isNew?: boolean;
  amount?: number;
}

export default function PlayGame({}: PlayGameProps) {
  const [mergingBoxes, setMergingBoxes] = useState<Record<string, BoxItem>>({});
  const [instanceCounter, setInstanceCounter] = useState(0);
  const [targetBox, setTargetBox] = useState<any>({});
  const [search, setSearch] = useState("");
  const [debouncedText] = useDebounce(search, 1000);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<BoxItem | null>(null);
  const [currentPointer, setCurrentPointer] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const { inventory, refetchInventory, refetch, isLoading } =
    useUser(debouncedText);

  const mergeApi = useApi({
    key: ["craft-word"],
    method: "POST",
    url: "user/craft-word",
  }).post;

  // Track mouse/touch position globally
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCurrentPointer({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setCurrentPointer({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchmove", handleTouchMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Optimized sensors with better activation constraints
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3, // Reduced from 5 for better responsiveness
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 3, // Reduced from 5 for better responsiveness
      },
    })
  );

  useEffect(() => {
    refetchInventory?.();
  }, [debouncedText]);

  // Handle drag start event
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveItem(active.data.current as BoxItem);
  }, []);

  // Handle drag over event - used for merging items
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;

      // Prevent self-dropping
      if (!over || active.id === over.id) return;

      const activeData = active.data.current as BoxItem;
      const overData = mergingBoxes[over.id as string];

      if (overData && activeData) {
        // Prepare for merging
        setTargetBox(overData);
      }
    },
    [mergingBoxes]
  );

  // Handle drag end event
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over, delta } = event;

      // Reset active states
      setActiveId(null);
      setActiveItem(null);

      if (!active) return;

      // Get data from active item
      const activeData = active.data.current as any;

      if (!activeData) {
        console.error("No data found in active item");
        return;
      }

      const isFromInventory = activeData.isFromInventory;

      // If dropped over another specific item (for merging)
      if (over && over.id !== "merging-area" && over.id !== active.id) {
        const targetInstanceId = over.id as string;

        if (mergingBoxes[targetInstanceId]) {
          // Call merge function with fully filled activeData
          handleDropToMerge(
            targetInstanceId,
            {
              ...activeData,
              id: activeData.id || active.id,
              instanceId: activeData.instanceId || active.id,
              isFromInventory: !!isFromInventory,
            },
            !!isFromInventory
          );
          return; // Exit early after merge attempt
        }
      }

      // For items dropped on the merging area, calculate position from current pointer
      if (over && over.id === "merging-area") {
        const container = document.querySelector('[data-merging-area="true"]');
        if (!container) return;

        const containerRect = container.getBoundingClientRect();

        let dropPosition = { x: 50, y: 50 }; // Default fallback

        // Use current pointer position for inventory items
        if (activeData.isFromInventory) {
          dropPosition = {
            x: Math.max(
              10,
              Math.min(
                containerRect.width - 114,
                currentPointer.x - containerRect.left - 52
              )
            ),
            y: Math.max(
              10,
              Math.min(
                containerRect.height - 36,
                currentPointer.y - containerRect.top - 13
              )
            ),
          };
        }
        // Use delta for existing items being moved
        else if (
          delta &&
          activeData.left !== undefined &&
          activeData.top !== undefined
        ) {
          dropPosition = {
            x: Math.max(
              10,
              Math.min(containerRect.width - 114, activeData.left + delta.x)
            ),
            y: Math.max(
              10,
              Math.min(containerRect.height - 36, activeData.top + delta.y)
            ),
          };
        }

        handleDrop(activeData, dropPosition);
      }
    },
    [mergingBoxes, currentPointer]
  );

  const handleDropToMerge = useCallback(
    async (
      targetInstanceId: string,
      droppedItem: any,
      isFromInventory: boolean
    ) => {
      // If we have two items in merging area, combine them
      const targetBox = mergingBoxes[targetInstanceId];
      if (!targetBox) {
        console.error("Target box not found:", targetInstanceId);
        return;
      }

      // Check if either item is from inventory and has limited amount
      const checkItemAvailability = (item: any) => {
        const originalId = item.originalId;
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
        console.error("Item availability check failed");
        return;
      }

      setTargetBox(targetBox);

      const targetItemId =
        typeof targetBox.id === "string"
          ? Number(targetBox.id.split("_")[0])
          : targetBox.id;
      const droppedItemId =
        typeof droppedItem.id === "string"
          ? Number(droppedItem.id.split("_")[0])
          : droppedItem.id;

      // Hide the dropped item immediately
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

        // Use the utility function to create a unique ID for the new element
        const newInstanceId = createUniqueId(response.id, instanceCounter);
        setInstanceCounter((prev) => prev + 1);

        const newElement = {
          id: newInstanceId,
          originalId: response.id,
          instanceId: newInstanceId,
          title: response.handle,
          emoji: response.emoji,
          left: targetBox.left, // Use target box position
          top: targetBox.top,
          isNew: true,
        };

        // Update state in one operation with batched changes
        setMergingBoxes((prev: any) => {
          const newBoxes = { ...prev };
          delete newBoxes[targetInstanceId];
          delete newBoxes[droppedItem.instanceId];
          return {
            ...newBoxes,
            [newInstanceId]: newElement,
          };
        });

        // Use startTransition to prevent layout shifts from these updates
        React.startTransition(() => {
          refetchInventory?.();
          refetch?.();
        });

        // Use requestAnimationFrame instead of setTimeout for smoother transitions
        requestAnimationFrame(() => {
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
        });
      } catch (error) {
        console.error("Error combining elements:", error);
        // Restore items on error
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
    [mergingBoxes, inventory, instanceCounter]
  );

  const handleDrop = useCallback(
    (droppedItem: any, position: { x: number; y: number }) => {
      if (!droppedItem) return;

      // Check inventory availability for non-inventory items
      if (!droppedItem.isFromInventory) {
        const originalId = droppedItem.originalId;
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
          if (usedCount > inventoryItem.amount) {
            return;
          }
        }
      }

      // Use the utility function to create a unique ID
      const instanceId = createUniqueId(droppedItem.id, instanceCounter);
      setInstanceCounter((prev) => prev + 1);

      // Get the merging area container for bounds checking
      const container = document.querySelector('[data-merging-area="true"]');
      let { x: left, y: top } = position;

      if (container) {
        const containerRect = container.getBoundingClientRect();

        // Adjust position to stay within bounds
        const adjustedPosition = adjustPositionWithinBounds(
          { x: left, y: top },
          104, // Estimated element width
          26, // Estimated element height
          containerRect.width,
          containerRect.height,
          10 // Padding from edges
        );

        left = adjustedPosition.x;
        top = adjustedPosition.y;
      }

      // Handle existing item movement vs new item creation
      if (droppedItem.instanceId && mergingBoxes[droppedItem.instanceId]) {
        // Moving existing item
        const itemId = droppedItem.instanceId;
        setMergingBoxes((prev: any) => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            left,
            top,
          },
        }));
      } else {
        // Creating new item from inventory
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
    },
    [mergingBoxes, inventory, instanceCounter]
  );

  const handleRemove = useCallback((instanceId: string) => {
    setMergingBoxes((prev: any) => {
      const newBoxes = { ...prev };
      delete newBoxes[instanceId];
      return newBoxes;
    });
  }, []);

  // Memoize filtered inventory items for better performance
  const basicElements = useMemo(
    () => (inventory as any[])?.filter((element: any) => element.isBasic) || [],
    [inventory]
  );

  const craftedElements = useMemo(
    () =>
      (inventory as any[])?.filter(
        (element: any) => !element.isBasic && element.amount > 0
      ) || [],
    [inventory]
  );

  return (
    <div className="w-full h-full">
      <GamePlayInfo />
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.BeforeDragging,
          },
        }}
      >
        <div className="h-[40%] mt-0 relative">
          <MergingArea
            mergingBoxes={mergingBoxes}
            onRemove={handleRemove}
            isMerging={mergeApi?.isPending ?? false}
            mergingTarget={targetBox}
            inventory={inventory as any[]}
          />
        </div>
        <div className="flex-col flex-1 justify-start items-start gap-5 inline-flex px-3 py-2 bg-[#141414] rounded-xl h-[47%] w-full relative">
          <div className="w-full px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-start items-start gap-4">
            <SearchIcon className="w-5 h-5 text-white" />
            <Input
              className="inline-flex h-5 flex-col justify-start items-start overflow-hidden text-white ring-0 px-0 border-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-col justify-start items-start gap-1 flex">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Infinite elements:
            </div>
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap">
              {basicElements.map((element: any) => (
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
          <div className="flex-col justify-start items-start gap-1 flex h-full w-full">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Crafted elements:
            </div>
            <div className={`flex justify-start items-start gap-2 flex-wrap overflow-y-auto ${
              craftedElements.length > 0 || isLoading 
                ? "h-[170px] sm:h-[150px] md:h-[170px] lg:h-[200px] xl:h-[230px]" 
                : "h-auto"
            }`}>
              {isLoading ? (
                // Skeleton elements that match the actual DragItem height
                <>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="px-3 py-1 rounded-3xl bg-gray-200 animate-pulse h-fit"
                      style={{ width: `${80 + index * 15}px` }}
                    >
                      <div className="h-[18px]" />
                    </div>
                  ))}
                </>
              ) : (
                craftedElements.map((element: any) => {
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
                })
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && activeItem ? (
            <div className="px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 inline-flex opacity-90">
              <div className="text-black text-xs font-normal font-['Sora'] capitalize leading-normal">
                <Emoji emoji={activeItem.emoji} size={18} />
                {activeItem.title}
                {activeItem.amount && activeItem.amount > 0
                  ? `(${activeItem.amount})`
                  : ""}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
