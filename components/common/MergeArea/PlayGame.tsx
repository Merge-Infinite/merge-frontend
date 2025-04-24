/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import TagSkeleton from "@/components/common/ElementSkeleton";
import { Input } from "@/components/ui/input";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Coordinates } from "@dnd-kit/utilities";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import Emoji from "../Emoji";
import GamePlayInfo from "../play-info";
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
}

export default function PlayGame({}: PlayGameProps) {
  const [mergingBoxes, setMergingBoxes] = useState<Record<string, BoxItem>>({});
  const [instanceCounter, setInstanceCounter] = useState(0);
  const [targetBox, setTargetBox] = useState<any>({});
  const [search, setSearch] = useState("");
  const [debouncedText] = useDebounce(search, 1000);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<BoxItem | null>(null);

  const { inventory, refetchInventory, refetch, isLoading } =
    useUser(debouncedText);

  const mergeApi = useApi({
    key: ["craft-word"],
    method: "POST",
    url: "user/craft-word",
  }).post;

  // Configure sensors for both mouse and touch
  // We can use either the built-in sensors or our custom ones
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Require the mouse to move by 5 pixels before activating
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      // Press delay of 250ms, with tolerance of 5px of movement
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // For custom sensors, we would use this pattern:
  // import { CustomMouseSensor, CustomTouchSensor } from './CustomSensors';
  // const sensors = useSensors(
  //   useSensor(CustomMouseSensor, {
  //     activationConstraint: { distance: 5 },
  //   }),
  //   useSensor(CustomTouchSensor, {
  //     activationConstraint: { delay: 250, tolerance: 5 },
  //   })
  // );

  useEffect(() => {
    refetchInventory?.();
  }, [debouncedText]);

  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveItem(active.data.current as BoxItem);
  };

  // Handle drag over event - used for merging items
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    // Prevent self-dropping
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as BoxItem;
    const overData = mergingBoxes[over.id as string];

    if (overData && activeData) {
      // Prepare for merging
      setTargetBox(overData);
    }
  };

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
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

    // Get the client position from the event
    const clientPosition = {
      x:
        event.activatorEvent instanceof MouseEvent
          ? event.activatorEvent.clientX
          : event.activatorEvent instanceof TouchEvent
          ? event.activatorEvent.touches[0].clientX
          : 0,
      y:
        event.activatorEvent instanceof MouseEvent
          ? event.activatorEvent.clientY
          : event.activatorEvent instanceof TouchEvent
          ? event.activatorEvent.touches[0].clientY
          : 0,
    } as Coordinates;

    console.log("Drag end:", {
      activeId: active.id,
      activeData,
      overId: over?.id,
    });

    // If dropped over another specific item (for merging)
    if (over && over.id !== "merging-area" && over.id !== active.id) {
      console.log("Attempting to merge with:", over.id);
      const targetInstanceId = over.id as string;

      if (mergingBoxes[targetInstanceId]) {
        console.log(
          "Found target box in mergingBoxes, calling handleDropToMerge"
        );
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

    // If we get here, handle as a general drop to the area
    console.log("Handling as general drop");
    handleDrop(activeData, delta as any, clientPosition);
  };

  const handleDropToMerge = useCallback(
    async (
      targetInstanceId: string,
      droppedItem: any,
      isFromInventory: boolean
    ) => {
      console.log("handleDropToMerge called with:", {
        targetInstanceId,
        droppedItem,
        isFromInventory,
      });

      // If we have two items in merging area, combine them
      const targetBox = (mergingBoxes as any)[targetInstanceId];
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
    [
      mergingBoxes,
      inventory,
      instanceCounter,
      mergeApi,
      refetchInventory,
      refetch,
    ]
  );

  const handleDrop = useCallback(
    (
      droppedItem: any,
      delta: { x: number; y: number },
      clientOffset: { x: number; y: number }
    ) => {
      if (!droppedItem) return;

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

      // Check if this is a draggable item being moved
      if (
        droppedItem.id !== undefined &&
        droppedItem.id !== null &&
        droppedItem.left !== undefined &&
        droppedItem.top !== undefined &&
        delta &&
        delta.x !== undefined &&
        delta.y !== undefined
      ) {
        // Calculate the new position
        let left = Math.round(droppedItem.left + delta.x);
        let top = Math.round(droppedItem.top + delta.y);

        // Get the merging area container
        const container = document.querySelector('[data-merging-area="true"]');
        if (container) {
          const containerRect = container.getBoundingClientRect();

          // Adjust position to stay within bounds
          const adjustedPosition = adjustPositionWithinBounds(
            { x: left, y: top },
            120, // Estimated element width
            40, // Estimated element height
            containerRect.width,
            containerRect.height,
            10 // Padding from edges
          );

          left = adjustedPosition.x;
          top = adjustedPosition.y;
        }

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
      // This is a new item being added from inventory
      else {
        if (
          clientOffset &&
          clientOffset.x !== undefined &&
          clientOffset.y !== undefined
        ) {
          // For new drops, position relative to the drop area
          const container = document.querySelector(
            '[data-merging-area="true"]'
          );
          let left = Math.round(clientOffset.x - 60);
          let top = Math.round(clientOffset.y - 100);

          if (container) {
            const containerRect = container.getBoundingClientRect();

            // Adjust position to be relative to the container
            left = Math.round(clientOffset.x - containerRect.left - 60);
            top = Math.round(clientOffset.y - containerRect.top - 30);

            // Keep in bounds
            const adjustedPosition = adjustPositionWithinBounds(
              { x: left, y: top },
              120, // Estimated width
              40, // Estimated height
              containerRect.width,
              containerRect.height,
              10 // Padding
            );

            left = adjustedPosition.x;
            top = adjustedPosition.y;
          }

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
    [mergingBoxes, inventory, instanceCounter]
  );

  const handleRemove = useCallback((instanceId: string) => {
    setMergingBoxes((prev: any) => {
      const newBoxes = { ...prev };
      delete newBoxes[instanceId];
      return newBoxes;
    });
  }, []);

  return (
    <div className="w-full h-full">
      <GamePlayInfo />
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        // Customize how items are visually transformed during drag
        modifiers={[
          // This modifier prevents scaling during drag
          ({ transform }) => {
            return {
              ...transform,
              scaleX: 1,
              scaleY: 1,
            };
          },
        ]}
        // Disable DndContext default animations that cause flickering
        measuring={{
          droppable: {
            strategy: "always",
          },
        }}
      >
        <div className="h-[40%] mt-0">
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
        <div className="flex-col justify-start items-start gap-5 inline-flex px-3 py-2 bg-[#141414] rounded-3xl h-[50%] w-full">
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
          <div className="flex-col justify-start items-start gap-1 flex h-full">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Crafted elements:
            </div>
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap overflow-y-auto h-[120px] sm:h-[120px] md:h-[140px] lg:h-[160px] xl:h-[180px]">
              {isLoading ? (
                <TagSkeleton />
              ) : (
                (!isLoading && (inventory as any[]))
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
                  })
              )}
            </div>
          </div>
        </div>

        {/* DragOverlay shows a visual representation of the dragged item */}
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
