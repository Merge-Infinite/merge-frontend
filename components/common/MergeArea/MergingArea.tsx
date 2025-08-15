/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useDroppable } from "@dnd-kit/core";
import React, { useCallback, useMemo, useRef } from "react";
import DraggableBox from "./DragItem";

export interface MergingAreaProps {
  mergingBoxes: { [key: string]: any };
  onRemove: (id: string) => void;
  mergingTarget: { [key: string]: any };
  isMerging: boolean;
  inventory: any[];
}

export const MergingArea = ({
  mergingBoxes,
  onRemove,
  mergingTarget,
  isMerging,
  inventory,
}: MergingAreaProps) => {
  // Reference to the container for dimension calculations
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup droppable area with dnd-kit
  const { setNodeRef, isOver } = useDroppable({
    id: "merging-area",
    data: {
      type: "merging-area",
      accepts: "draggable-box",
    },
  });

  // Memoize the handler for box removal
  const handleRemove = useCallback(
    (id: string) => {
      onRemove(id);
    },
    [onRemove]
  );

  // Memoize box components for better performance
  const boxComponents = useMemo(() => {
    const boxes = Object.values(mergingBoxes);

    return boxes.map((box: any) => {
      // For each box on the board, check if it's from inventory and has limited amount
      let isDisabled = false;

      if (!box.isFromInventory) {
        const originalId = box.originalId;
        const inventoryItem = inventory.find(
          (item) => item.itemId === originalId
        );

        // If this is a non-basic inventory item, check available amount
        if (inventoryItem && !inventoryItem.isBasic) {
          // Count how many of this item are currently on the board
          const itemsOnBoard = boxes.filter(
            (b) =>
              !b.isHidden &&
              (b.originalId === originalId || b.id === originalId)
          ).length;

          // If there are more on the board than in inventory, disable dragging for this one
          isDisabled = itemsOnBoard > inventoryItem.amount;
        }
      }

      return (
        <DraggableBox
          {...box}
          key={box.instanceId}
          isFromInventory={false}
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
  }, [mergingBoxes, inventory, isMerging, mergingTarget, handleRemove]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      className="relative h-full w-full"
      data-merging-area="true"
      style={{
        transform: "translateZ(0)", // Force GPU acceleration for smoother rendering
        willChange: "auto", // Optimize for changes
      }}
    >
      {boxComponents}
    </div>
  );
};

// Optimized comparison function
const areEqual = (prevProps: MergingAreaProps, nextProps: MergingAreaProps) => {
  // Quick reference checks first
  if (prevProps.inventory !== nextProps.inventory) return false;
  if (prevProps.isMerging !== nextProps.isMerging) return false;
  if (prevProps.mergingTarget !== nextProps.mergingTarget) return false;
  if (prevProps.onRemove !== nextProps.onRemove) return false;

  // Check mergingBoxes length first (quick check)
  const prevKeys = Object.keys(prevProps.mergingBoxes);
  const nextKeys = Object.keys(nextProps.mergingBoxes);

  if (prevKeys.length !== nextKeys.length) return false;

  // Deep comparison only if lengths match
  for (const key of prevKeys) {
    if (!nextProps.mergingBoxes[key]) return false;

    const prevBox = prevProps.mergingBoxes[key];
    const nextBox = nextProps.mergingBoxes[key];

    // Compare essential properties only
    if (
      prevBox.left !== nextBox.left ||
      prevBox.top !== nextBox.top ||
      prevBox.title !== nextBox.title ||
      prevBox.emoji !== nextBox.emoji ||
      prevBox.isHidden !== nextBox.isHidden ||
      prevBox.isNew !== nextBox.isNew
    ) {
      return false;
    }
  }

  return true;
};

export default React.memo(MergingArea, areEqual);
