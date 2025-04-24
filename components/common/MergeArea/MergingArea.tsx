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
import { calculateDistance, getElementCenter } from "./dragUtilities";
import { Coordinates } from "./types"; // Using our custom types

export interface MergingAreaProps {
  onDrop: (item: any, delta: Coordinates, clientOffset: Coordinates) => void;
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
}

export const MergingArea = ({
  onDrop,
  onDropandMerge,
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
  const { setNodeRef } = useDroppable({
    id: "merging-area",
  });

  // Function to find the closest element to a point (used for merging)
  const findClosestElement = useCallback(
    (position: Coordinates, minDistance = 50) => {
      if (!containerRef.current) return null;

      let closestElement: Element | null = null;
      let minDist = minDistance;

      // Get all draggable elements in the container
      const draggableElements = containerRef.current.querySelectorAll(
        '[data-draggable="true"]'
      );

      draggableElements.forEach((element) => {
        const elementCenter = getElementCenter(element as HTMLElement);
        const distance = calculateDistance(position, elementCenter);

        if (distance < minDist) {
          minDist = distance;
          closestElement = element;
        }
      });

      return closestElement
        ? closestElement.getAttribute("data-instance-id")
        : null;
    },
    []
  );

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

  // Update usedItems counter when items are merged
  const handleDropAndMerge = useCallback(
    (targetInstanceId: string, droppedItem: any) => {
      // First check if the item being dropped is from inventory and has limited amount
      if (droppedItem.isFromInventory) {
        const originalId = droppedItem.originalId;
        const inventoryItem = inventory.find(
          (item) => item.itemId === originalId
        );

        if (inventoryItem && !inventoryItem.isBasic) {
          // Calculate how many we've already used
          const currentUsed = usedItems[originalId] || 0;

          // Check if we have enough available
          if (currentUsed >= inventoryItem.amount) {
            return;
          }

          // Update the count of used items
          setUsedItems((prev) => ({
            ...prev,
            [originalId]: (prev[originalId] || 0) + 1,
          }));
        }
      }

      onDropandMerge(
        targetInstanceId,
        droppedItem,
        droppedItem.isFromInventory
      );
    },
    [onDropandMerge, inventory, usedItems]
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
    visibleBoxes,
    inventory,
    isMerging,
    mergingTarget,
    handleRemove,
    handleDropAndMerge,
  ]);

  return (
    <div
      ref={(node) => {
        // Set both refs
        setNodeRef(node);
        containerRef.current = node;
      }}
      className="relative h-full will-change-contents"
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
