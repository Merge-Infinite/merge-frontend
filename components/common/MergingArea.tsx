/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useCallback, useMemo } from "react";
import { useDrop, XYCoord } from "react-dnd";
import DraggableBox, { ItemTypes } from "./DraggableBox";

export const MergingArea = ({
  onDrop,
  onDropandMerge,
  mergingBoxes,
  onRemove,
  mergingTarget,
  isMerging,
  inventory,
}: {
  onDrop: (item: any, delta: XYCoord, clientOffset: XYCoord) => void;
  onDropandMerge: (
    targetInstanceId: string,
    droppedItem: any,
    isFromInventory: boolean
  ) => void;
  mergingBoxes: { [key: string]: any };
  onRemove: (id: string) => void;
  mergingTarget: { [key: string]: any };
  isMerging: boolean;
  inventory: any[];
}) => {
  const handleDrop = useCallback(
    (droppedItem: any, monitor: any) => {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
      const clientOffset = monitor.getClientOffset() as XYCoord;

      // Check if this is an inventory item and if we have enough amount
      if (droppedItem.isFromInventory) {
        const originalId = droppedItem.originalId;
        const inventoryItem = inventory.find(
          (item) => item.itemId === originalId
        );

        if (!inventoryItem) return undefined;

        // For basic items, we don't need to check amount
        if (!inventoryItem.isBasic) {
          // Count how many we've already used on the board
          const currentUsed = Object.values(mergingBoxes).filter(
            (box: any) =>
              !box.isHidden &&
              (box.originalId === originalId || box.id === originalId)
          ).length;

          // Check if we have enough available
          if (currentUsed >= inventoryItem.amount) {
            return undefined;
          }
        }
      }

      onDrop(droppedItem, delta, clientOffset);
      return undefined;
    },
    [inventory, mergingBoxes, onDrop]
  );

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop: handleDrop,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [handleDrop]
  );

  // Memoize the handler for box removal
  const handleRemove = useCallback(
    (id: string) => {
      onRemove(id);
    },
    [onRemove]
  );

  // Handle drop and merge with inventory checking
  const handleDropAndMerge = useCallback(
    (targetInstanceId: string, droppedItem: any) => {
      // Check if the item being dropped is from inventory and has limited amount
      if (droppedItem.isFromInventory) {
        const originalId = droppedItem.originalId;
        const inventoryItem = inventory.find(
          (item) => item.itemId === originalId
        );

        if (inventoryItem && !inventoryItem.isBasic) {
          // Count how many we've already used
          const currentUsed = Object.values(mergingBoxes).filter(
            (box: any) =>
              !box.isHidden &&
              (box.originalId === originalId || box.id === originalId)
          ).length;

          // Check if we have enough available
          if (currentUsed >= inventoryItem.amount) {
            return;
          }
        }
      }

      onDropandMerge(
        targetInstanceId,
        droppedItem,
        droppedItem.isFromInventory
      );
    },
    [onDropandMerge, inventory, mergingBoxes]
  );

  // Optimized box rendering - memoize the entire list
  const boxComponents = useMemo(() => {
    return Object.values(mergingBoxes).map((box: any) => {
      // Check if this box should be disabled based on inventory limits
      let isDisabled = false;

      if (!box.isFromInventory) {
        const originalId = box.originalId;
        const inventoryItem = inventory.find(
          (item) => item.itemId === originalId
        );

        // If this is a non-basic inventory item, check available amount
        if (inventoryItem && !inventoryItem.isBasic) {
          // Count how many of this item are currently on the board
          const itemsOnBoard = Object.values(mergingBoxes).filter(
            (b: any) =>
              !b.isHidden &&
              (b.originalId === originalId || b.id === originalId)
          ).length;

          // If there are more on the board than in inventory, disable this one
          isDisabled = itemsOnBoard > inventoryItem.amount;
        }
      }

      return (
        <DraggableBox
          {...box}
          key={box.instanceId}
          isFromInventory={false}
          onDrop={handleDropAndMerge}
          onRemove={handleRemove}
          isHidden={box.isHidden}
          isNew={box.isNew}
          originalId={box.originalId}
          isMerging={isMerging}
          mergingTarget={mergingTarget}
          isDisabled={isDisabled}
        />
      );
    });
  }, [
    mergingBoxes,
    inventory,
    isMerging,
    mergingTarget,
    handleDropAndMerge,
    handleRemove,
  ]);

  return (
    <div
      ref={drop}
      className="relative h-full w-full overflow-hidden"
      style={{ contain: "layout style paint" }}
    >
      {boxComponents}
    </div>
  );
};

// Simplified comparison function for better performance
const areEqual = (prevProps: any, nextProps: any) => {
  // Quick shallow comparison of props that most commonly change
  if (
    prevProps.isMerging !== nextProps.isMerging ||
    prevProps.inventory !== nextProps.inventory ||
    Object.keys(prevProps.mergingBoxes).length !==
      Object.keys(nextProps.mergingBoxes).length
  ) {
    return false;
  }

  // Check if mergingTarget changed (only if we're merging)
  if (
    prevProps.isMerging &&
    prevProps.mergingTarget?.instanceId !== nextProps.mergingTarget?.instanceId
  ) {
    return false;
  }

  // Deep comparison of mergingBoxes only if lengths are the same
  for (const key in prevProps.mergingBoxes) {
    const prevBox = prevProps.mergingBoxes[key];
    const nextBox = nextProps.mergingBoxes[key];

    if (
      !nextBox ||
      prevBox.left !== nextBox.left ||
      prevBox.top !== nextBox.top ||
      prevBox.isHidden !== nextBox.isHidden ||
      prevBox.isNew !== nextBox.isNew
    ) {
      return false;
    }
  }

  return true;
};

export default React.memo(MergingArea, areEqual);
