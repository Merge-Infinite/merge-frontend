/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, {
  useCallback,
  useRef,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useDrop, XYCoord } from "react-dnd";
import DraggableBox, { ItemTypes } from "./DraggableBox";

export const MergingArea = ({
  onDrop,
  onDropandMerge,
  mergingBoxes,
  onRemove,
}: {
  onDrop: (item: any, delta: XYCoord, clientOffset: XYCoord) => void;
  onDropandMerge: (targetId: number, droppedItem: any) => void;
  mergingBoxes: { [key: string]: any };
  onRemove: (id: string) => void;
}) => {
  // Memoize the drop handler to prevent unnecessary recreations
  const handleDrop = useCallback(
    (droppedItem: any, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
      const clientOffset = monitor.getClientOffset() as XYCoord;

      onDrop(droppedItem, delta, clientOffset);
      return undefined;
    },
    [onDrop]
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

  // Memoize the handler for box merging
  const handleDropAndMerge = useCallback(
    (targetId: string, droppedItem: any) => {
      onDropandMerge(Number(targetId), droppedItem);
    },
    [onDropandMerge]
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
    return visibleBoxes.map((box: any) => (
      <DraggableBox
        {...box}
        key={box.id}
        isFromInventory={false}
        onDrop={handleDropAndMerge}
        onRemove={handleRemove}
      />
    ));
  }, [visibleBoxes, handleDropAndMerge, handleRemove]);

  return (
    <div ref={drop} className="relative h-full will-change-contents">
      {boxComponents}
    </div>
  );
};

// Custom comparison function to prevent unnecessary rerenders
const areEqual = (prevProps: any, nextProps: any) => {
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
      prevBox.amount !== nextBox.amount
    ) {
      return false;
    }
  }

  return true;
};

export default React.memo(MergingArea, areEqual);
