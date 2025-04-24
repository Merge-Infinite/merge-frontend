/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import { useDraggable, useDroppable } from "@dnd-kit/core";
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
  const {
    attributes,
    listeners,
    setNodeRef: setDragNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: instanceId || id,
    data: {
      ...itemData,
      type: "draggable-box",
      instanceId: instanceId || id,
      isFromInventory,
    },
    disabled: isDisabled || isMerging,
  });

  // Setup droppable as well - but only for items that aren't from inventory and aren't disabled
  const { setNodeRef: setDropNodeRef, over } = useDroppable({
    id: instanceId || id,
    disabled: isFromInventory || isDisabled || isMerging,
    data: {
      accepts: "draggable-box",
      instanceId: instanceId || id,
    },
  });

  // Use both refs
  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      setDragNodeRef(node);
      setDropNodeRef(node);
    },
    [setDragNodeRef, setDropNodeRef]
  );

  // Check if something is being dragged over this item
  const isOver = !!over;

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

      transition: isDragging ? "none" : "box-shadow 0.2s ease",
      touchAction: "none",
    };

    // Apply transform only when dragging, but don't scale
    if (isDragging && transform) {
      return {
        ...baseStyle,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, // Simplified transform without scale
        opacity: 0.5, // Make the original more transparent while dragging
      };
    }

    // Add highlight effect when being dragged over (only for droppable items)
    if (isOver && !isFromInventory && !isDisabled && !isMerging) {
      return {
        ...baseStyle,
        boxShadow: "0 0 0 2px #3498db",
        borderColor: "#3498db",
      };
    }

    return baseStyle;
  }, [
    isDragging,
    isFromInventory,
    isDisabled,
    transform,
    left,
    top,
    isOver,
    isMerging,
  ]);

  // Memoize the remove handler
  const handleRemove = useCallback(() => {
    if (instanceId) {
      onRemove?.(instanceId);
    }
  }, [onRemove, instanceId]);

  // Stop propagation of touch events on the remove button to prevent conflicts with draggable
  const handleRemoveTouch = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      if (instanceId) {
        onRemove?.(instanceId);
      }
    },
    [onRemove, instanceId]
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "px-3 py-1 bg-white rounded-3xl justify-center items-center gap-1 flex h-fit",
        isMerging && mergingTarget?.instanceId === instanceId && "bg-gray-300",
        isDisabled && "bg-gray-200",
        isHidden && "hidden",
        isOver &&
          !isFromInventory &&
          !isDisabled &&
          !isMerging &&
          "ring-2 ring-blue-500"
      )}
      style={style}
      data-draggable="true"
      data-droppable={
        !isFromInventory && !isDisabled && !isMerging ? "true" : "false"
      }
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
        <div
          className="p-2 flex items-center justify-center"
          onClick={handleRemove}
          onTouchEnd={handleRemoveTouch}
          style={{
            cursor: "pointer",
            touchAction: "manipulation",
            minWidth: "44px",
            minHeight: "44px",
            margin: "-12px", // Negative margin to maintain visual size while increasing hit area
          }}
        >
          <Image
            src="/images/remove.svg"
            alt="Remove"
            width={18}
            height={18}
            style={{ pointerEvents: "none" }}
          />
        </div>
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
