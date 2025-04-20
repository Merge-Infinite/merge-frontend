/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDrag, useDragDropManager, useDrop } from "react-dnd";
import Emoji from "./Emoji";
import MergeLoadingAnimation from "./MergeLoadingAnimation";

// ItemTypes for drag and drop
export const ItemTypes = {
  BOX: "box",
};

// DraggableBox component
const DraggableBox = ({
  id,
  instanceId,
  title,
  emoji,
  left,
  top,
  amount,
  onDrop,
  onRemove,
  isHidden,
  originalId,
  isNew,
  isFromInventory,
  isMerging,
  mergingTarget,
  isDisabled,
}: {
  id: string;
  instanceId?: string;
  title: string;
  emoji: string;
  left?: number;
  top?: number;
  originalId?: string;
  amount?: number;
  onDrop?: (instanceId: string | undefined, item: any) => void;
  onRemove?: (id: string) => void;
  isFromInventory: boolean;
  isHidden?: boolean;
  isNew?: boolean;
  isMerging?: boolean;
  mergingTarget?: { [key: string]: any };
  isDisabled?: boolean;
}) => {
  const item = useMemo(
    () => ({
      id,
      instanceId,
      title,
      emoji,
      left,
      top,
      originalId: originalId || id,
      isFromInventory,
      amount,
    }),
    [
      id,
      instanceId,
      title,
      emoji,
      left,
      top,
      isFromInventory,
      amount,
      originalId,
    ]
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: (monitor) => {
        return item;
      },
      canDrag: !isDisabled && !isMerging,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item, isDisabled, isMerging] // Include isDisabled in dependencies
  );

  // Memoize the drop callback
  const handleDrop = useCallback(
    (dropItem: any) => {
      console.log("handleDrop dropItem", dropItem);
      if (dropItem.instanceId !== instanceId) {
        onDrop?.(instanceId, { ...dropItem, originalId });
      }
    },
    [id, onDrop, instanceId, originalId]
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

  const dragDropManager = useDragDropManager();
  const monitor = dragDropManager.getMonitor();
  const offset = monitor.getSourceClientOffset();
  const [position, setPosition] = useState({
    x: offset?.x || 0,
    y: offset?.y || 0,
  });

  useEffect(() => {
    if (!isDragging) return;

    const updatePosition = () => {
      const offset = monitor.getSourceClientOffset();
      console.log("offset", offset);
      if (offset) {
        setPosition({
          x: offset.x,
          y: offset.y,
        });
      }
    };

    const unsubscribe = monitor.subscribeToOffsetChange(updatePosition);

    return () => {
      unsubscribe();
    };
  }, [isDragging]);

  // Combine drag and drop refs
  const ref = useCallback(
    (element: any) => {
      drag(element);
      drop(element);
    },
    [drag, drop]
  );

  // Memoize the style object
  const style = useMemo(
    () =>
      isDragging
        ? {
            opacity: 0.9,
            position: "fixed" as const,
            left: position.x || 0,
            top: position.y || 0,
            pointerEvents: "none" as const,
            zIndex: 1000,
            willChange: "transform",
            cursor: "grabbing",
          }
        : {
            opacity: isDisabled ? 0.5 : 1,
            position: isFromInventory
              ? ("static" as const)
              : ("absolute" as const),
            left,
            top,
            cursor: isDisabled ? "not-allowed" : "grab",
          },
    [isDragging, isFromInventory, isDisabled, position, left, top]
  );

  // Memoize the remove handler
  const handleRemove = useCallback(() => {
    if (instanceId) {
      onRemove?.(instanceId);
    }
  }, [onRemove, instanceId]);

  return (
    <div
      ref={ref}
      className={cn(
        "px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 inline-flex",
        isMerging && mergingTarget?.instanceId === instanceId && "bg-gray-300",
        isDisabled && "bg-gray-200",
        isHidden && "hidden"
      )}
      style={style}
    >
      <div
        className={cn(
          "text-black text-xs font-normal font-['Sora'] capitalize leading-normal",
          isMerging && mergingTarget?.instanceId === instanceId && "opacity-0",
          isDisabled && "text-gray-500"
        )}
      >
        <Emoji emoji={emoji} size={18} />
        {title}
        {amount && amount > 0 ? `(${amount})` : ""}
      </div>
      {!isFromInventory && !isMerging && (
        <Image
          onClick={handleRemove}
          src="/images/remove.svg"
          alt="fire"
          width={18}
          height={18}
        />
      )}
      {isMerging && mergingTarget?.instanceId === instanceId && (
        <MergeLoadingAnimation />
      )}
    </div>
  );
};

// Use React.memo with a custom comparison function for optimal re-rendering
export default React.memo(
  DraggableBox,
  (prevProps, nextProps) =>
    prevProps.id === nextProps.id &&
    prevProps.instanceId === nextProps.instanceId &&
    prevProps.title === nextProps.title &&
    prevProps.emoji === nextProps.emoji &&
    prevProps.left === nextProps.left &&
    prevProps.top === nextProps.top &&
    prevProps.amount === nextProps.amount &&
    prevProps.isFromInventory === nextProps.isFromInventory &&
    prevProps.isMerging === nextProps.isMerging &&
    prevProps.mergingTarget === nextProps.mergingTarget &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.originalId === nextProps.originalId
);
