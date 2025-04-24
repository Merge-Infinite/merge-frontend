/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import React, { useCallback, useMemo } from "react";
import Emoji from "../Emoji";
import MergeLoadingAnimation from "../MergeLoadingAnimation";

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
  // Create the item data to be passed during drag
  const itemData = useMemo(
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

  // Setup draggable with dnd-kit
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: instanceId || id,
      data: itemData,
      disabled: isDisabled || isMerging,
    });

  // Memoize the style object
  const style = useMemo(() => {
    // Base styles that apply to both dragging and non-dragging states
    const baseStyle: React.CSSProperties = {
      opacity: isDisabled ? 0.5 : 1,
      position: isFromInventory ? "static" : "absolute",
      left,
      top,
      cursor: isDisabled ? "not-allowed" : "grab",
      zIndex: isDragging ? 1000 : undefined,
      touchAction: "none", // Required by dnd-kit to work correctly with touch devices
    };

    // Apply transform only when dragging
    if (isDragging && transform) {
      return {
        ...baseStyle,
        transform: CSS.Transform.toString(transform),
        opacity: 0.9,
      };
    }

    return baseStyle;
  }, [isDragging, isFromInventory, isDisabled, transform, left, top]);

  // Memoize the remove handler
  const handleRemove = useCallback(() => {
    if (instanceId) {
      onRemove?.(instanceId);
    }
  }, [onRemove, instanceId]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 inline-flex",
        isMerging && mergingTarget?.instanceId === instanceId && "bg-gray-300",
        isDisabled && "bg-gray-200",
        isHidden && "hidden"
      )}
      style={style}
      data-draggable="true"
      data-instance-id={instanceId}
      {...listeners}
      {...attributes}
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
