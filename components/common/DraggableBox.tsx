/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useCallback, useMemo } from "react";
import { useDrag, useDrop } from "react-dnd";
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
      item: item,
      canDrag: !isDisabled && !isMerging,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item, isDisabled, isMerging]
  );

  // Memoize the drop callback
  const handleDrop = useCallback(
    (dropItem: any) => {
      if (dropItem.instanceId !== instanceId) {
        onDrop?.(instanceId, { ...dropItem, originalId });
      }
    },
    [instanceId, onDrop, originalId]
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

  // Combine drag and drop refs
  const ref = useCallback(
    (element: any) => {
      drag(element);
      drop(element);
    },
    [drag, drop]
  );

  // Simplified style object - removed complex drag positioning
  const style = useMemo(
    () => ({
      opacity: isDragging ? 0.5 : isDisabled ? 0.5 : 1,
      position: isFromInventory ? ("static" as const) : ("absolute" as const),
      left: !isFromInventory ? left : undefined,
      top: !isFromInventory ? top : undefined,
      cursor: isDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
    }),
    [isDragging, isFromInventory, isDisabled, left, top]
  );

  // Memoize the remove handler
  const handleRemove = useCallback(() => {
    if (instanceId) {
      onRemove?.(instanceId);
    }
  }, [onRemove, instanceId]);

  const isMergingTarget = isMerging && mergingTarget?.instanceId === instanceId;

  return (
    <div
      ref={ref}
      className={cn(
        "px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 inline-flex select-none",
        isMergingTarget && "bg-gray-300",
        isDisabled && "bg-gray-200",
        isHidden && "hidden"
      )}
      style={style}
    >
      <div
        className={cn(
          "text-black text-xs font-normal font-['Sora'] capitalize leading-normal",
          isMergingTarget && "opacity-0",
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
          alt="remove"
          width={18}
          height={18}
          className="cursor-pointer"
        />
      )}
      {isMergingTarget && <MergeLoadingAnimation />}
    </div>
  );
};

// Optimized memo comparison - only check essential props
export default React.memo(DraggableBox, (prevProps, nextProps) => {
  // Quick reference equality checks first
  if (
    prevProps.id === nextProps.id &&
    prevProps.instanceId === nextProps.instanceId &&
    prevProps.title === nextProps.title &&
    prevProps.emoji === nextProps.emoji &&
    prevProps.left === nextProps.left &&
    prevProps.top === nextProps.top &&
    prevProps.amount === nextProps.amount &&
    prevProps.isFromInventory === nextProps.isFromInventory &&
    prevProps.isMerging === nextProps.isMerging &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.originalId === nextProps.originalId
  ) {
    // Only check mergingTarget if isMerging is true
    if (prevProps.isMerging || nextProps.isMerging) {
      return (
        prevProps.mergingTarget?.instanceId ===
        nextProps.mergingTarget?.instanceId
      );
    }
    return true;
  }
  return false;
});
