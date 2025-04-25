/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useDroppable } from "@dnd-kit/core";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  // Track items that have been used from inventory to prevent overuse
  const [usedItems, setUsedItems] = useState<Record<string, number>>({});

  // Reset used items when inventory changes (e.g., after a successful merge)
  useEffect(() => {
    setUsedItems({});
  }, [inventory]);

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
      // When removing an item, we need to update our usedItems count
      const box = mergingBoxes[id];
      if (box) {
        const originalId = box.originalId;

        // If this is a non-basic item from inventory, decrement the used count
        const inventoryItem = inventory.find(
          (item) => item.itemId === originalId
        );
        if (inventoryItem && !inventoryItem.isBasic) {
          setUsedItems((prev) => ({
            ...prev,
            [originalId]: Math.max(0, (prev[originalId] || 0) - 1),
          }));
        }
      }

      onRemove(id);
    },
    [onRemove, mergingBoxes, inventory]
  );

  // Convert mergingBoxes object to array only when it changes
  const boxesArray = useMemo(() => Object.values(mergingBoxes), [mergingBoxes]);

  // Pre-render boxes for immediate display during transitions
  const [visibleBoxes, setVisibleBoxes] = useState(boxesArray);

  useEffect(() => {
    // Use requestAnimationFrame to smooth out updates to the DOM
    const animationId = requestAnimationFrame(() => {
      setVisibleBoxes(boxesArray);
    });

    return () => cancelAnimationFrame(animationId);
  }, [boxesArray]);

  // Cache box components for better performance
  const boxComponents = useMemo(() => {
    return visibleBoxes.map((box: any) => {
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
          const itemsOnBoard = visibleBoxes.filter(
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
  }, [visibleBoxes, inventory, isMerging, mergingTarget, handleRemove]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      className="relative h-full will-change-contents"
      data-merging-area="true"
    >
      {boxComponents}
    </div>
  );
};

// Custom comparison function to prevent unnecessary rerenders
const areEqual = (prevProps: any, nextProps: any) => {
  // Check if inventory changed
  if (prevProps.inventory !== nextProps.inventory) return false;

  // Only re-render when mergingBoxes actually changes
  if (
    Object.keys(prevProps.mergingBoxes).length !==
    Object.keys(nextProps.mergingBoxes).length
  ) {
    return false;
  }

  // Check if any box properties have changed
  for (const key in prevProps.mergingBoxes) {
    if (!nextProps.mergingBoxes[key]) return false;

    const prevBox = prevProps.mergingBoxes[key];
    const nextBox = nextProps.mergingBoxes[key];

    // Compare essential properties that affect rendering
    if (
      prevBox.left !== nextBox.left ||
      prevBox.top !== nextBox.top ||
      prevBox.title !== nextBox.title ||
      prevBox.emoji !== nextBox.emoji ||
      prevBox.amount !== nextBox.amount ||
      prevBox.isHidden !== nextBox.isHidden ||
      prevBox.isNew !== nextBox.isNew ||
      prevBox.isMerging !== nextBox.isMerging ||
      prevBox.mergingTarget !== nextBox.mergingTarget
    ) {
      return false;
    }
  }

  return true;
};

export default React.memo(MergingArea, areEqual);
