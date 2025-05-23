/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn } from "@/lib/utils";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import Image from "next/image";
import React, { useCallback, useMemo, useRef } from "react";
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
  onRemove,
  isHidden,
  originalId,
  isFromInventory,
  isMerging,
  mergingTarget,
  isDisabled,
  isNew,
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
  const elementRef = useRef<HTMLDivElement>(null);

  // Create the item data to be passed during drag - memoized for performance
  const itemData = useMemo(
    () => ({
      id,
      instanceId: instanceId || id,
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
      originalId,
      isFromInventory,
      amount,
    ]
  );

  // Setup draggable with dnd-kit - optimized for performance
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
    },
    disabled: isDisabled || isMerging,
  });

  // Setup droppable - only for items that can receive drops
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: instanceId || id,
    disabled: isFromInventory || isDisabled || isMerging,
    data: {
      accepts: "draggable-box",
      instanceId: instanceId || id,
    },
  });

  // Combine refs efficiently
  const setNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node;
      setDragNodeRef(node);
      setDropNodeRef(node);
    },
    [setDragNodeRef, setDropNodeRef]
  );

  // Optimized style calculation with better performance
  const style = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      position: isFromInventory ? "static" : "absolute",
      left: left,
      top: top,
      cursor: isDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
      touchAction: "none",
      willChange: isDragging ? "transform" : "auto",
      backfaceVisibility: "hidden", // Prevents flickering
      WebkitBackfaceVisibility: "hidden",
    };

    // Handle dragging state with hardware acceleration
    if (isDragging && transform) {
      return {
        ...baseStyle,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: 0.6,
        zIndex: 1000,
        transition: "none",
      };
    }

    // Handle opacity states
    if (isDisabled) {
      baseStyle.opacity = 0.5;
    } else if (isHidden) {
      baseStyle.opacity = 0;
      baseStyle.pointerEvents = "none";
    } else {
      baseStyle.opacity = 1;
    }

    // Smooth transitions when not dragging
    if (!isDragging) {
      baseStyle.transition =
        "opacity 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease";
    }

    return baseStyle;
  }, [isDragging, isFromInventory, isDisabled, isHidden, transform, left, top]);

  // Optimized class calculation
  const className = useMemo(() => {
    const classes = [
      "px-3 py-1 rounded-3xl justify-center items-center flex h-fit relative",
      "select-none", // Prevent text selection during drag
    ];

    // Background colors
    if (isMerging && mergingTarget?.instanceId === instanceId) {
      classes.push("bg-gray-300");
    } else if (isDisabled) {
      classes.push("bg-gray-200");
    } else {
      classes.push("bg-white");
    }

    // Visibility
    if (isHidden) {
      classes.push("invisible");
    }

    // Hover and interaction states
    if (isOver && !isFromInventory && !isDisabled && !isMerging) {
      classes.push("ring-2 ring-blue-400 shadow-lg");
    }

    // New item animation
    if (isNew && !isDragging) {
      classes.push("animate-pulse");
    }

    return cn(...classes);
  }, [
    isMerging,
    mergingTarget?.instanceId,
    instanceId,
    isDisabled,
    isHidden,
    isOver,
    isFromInventory,
    isNew,
    isDragging,
  ]);

  // Optimized text class calculation
  const textClassName = useMemo(() => {
    const classes = [
      "text-xs font-normal font-['Sora'] capitalize leading-normal flex items-center gap-1",
    ];

    if (isMerging && mergingTarget?.instanceId === instanceId) {
      classes.push("opacity-0");
    } else if (isDisabled) {
      classes.push("text-gray-500");
    } else {
      classes.push("text-black");
    }

    return cn(...classes);
  }, [isMerging, mergingTarget?.instanceId, instanceId, isDisabled]);

  // Memoized event handlers
  const handleRemove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (instanceId && onRemove) {
        onRemove(instanceId);
      }
    },
    [onRemove, instanceId]
  );

  // Prevent context menu during drag
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    },
    [isDragging]
  );

  // Don't render if hidden (better performance than CSS)
  if (isHidden) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      onContextMenu={handleContextMenu}
      data-draggable="true"
      data-droppable={
        !isFromInventory && !isDisabled && !isMerging ? "true" : "false"
      }
      data-instance-id={instanceId}
      {...listeners}
      {...attributes}
    >
      <div className={textClassName}>
        <Emoji emoji={emoji} size={18} />
        <span>
          {title}
          {amount && amount > 0 && ` (${amount})`}
        </span>
      </div>

      {/* Remove button - only show for items in merging area */}
      {!isFromInventory && !isMerging && (
        <button
          type="button"
          className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 touch-manipulation"
          onClick={handleRemove}
          onTouchEnd={handleRemove}
          aria-label="Remove item"
          tabIndex={-1} // Prevent tab focus during drag operations
        >
          <Image
            src="/images/remove.svg"
            alt=""
            width={16}
            height={16}
            className="pointer-events-none"
            loading="lazy"
          />
        </button>
      )}

      {/* Merge loading animation */}
      {isMerging && mergingTarget?.instanceId === instanceId && (
        <div className="absolute inset-0 flex items-center justify-center">
          <MergeLoadingAnimation />
        </div>
      )}
    </div>
  );
};

// Highly optimized comparison function
const arePropsEqual = (prevProps: any, nextProps: any) => {
  // Quick reference checks first (most likely to change)
  if (prevProps.isDragging !== nextProps.isDragging) return false;
  if (prevProps.isOver !== nextProps.isOver) return false;
  if (prevProps.isMerging !== nextProps.isMerging) return false;
  if (prevProps.isHidden !== nextProps.isHidden) return false;
  if (prevProps.isNew !== nextProps.isNew) return false;
  if (prevProps.isDisabled !== nextProps.isDisabled) return false;

  // Position checks (common during drag)
  if (prevProps.left !== nextProps.left) return false;
  if (prevProps.top !== nextProps.top) return false;

  // Identity checks
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.instanceId !== nextProps.instanceId) return false;
  if (prevProps.originalId !== nextProps.originalId) return false;

  // Content checks (less likely to change)
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.emoji !== nextProps.emoji) return false;
  if (prevProps.amount !== nextProps.amount) return false;
  if (prevProps.isFromInventory !== nextProps.isFromInventory) return false;

  // Reference checks (functions/objects)
  if (prevProps.onRemove !== nextProps.onRemove) return false;
  if (
    prevProps.mergingTarget?.instanceId !== nextProps.mergingTarget?.instanceId
  )
    return false;

  return true;
};

export default React.memo(DraggableBox, arePropsEqual);
