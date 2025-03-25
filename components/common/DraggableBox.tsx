/* eslint-disable @typescript-eslint/no-explicit-any */
import { cn, shortenName } from "@/lib/utils";
import Image from "next/image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDrag, useDragDropManager, useDrop } from "react-dnd";
import MergeLoadingAnimation from "./MergeLoadingAnimation";

// ItemTypes for drag and drop
export const ItemTypes = {
  BOX: "box",
};

// DraggableBox component
const DraggableBox = ({
  id,
  title,
  emoji,
  left,
  top,
  amount,
  onDrop,
  onRemove,
  isHidden,
  isNew,
  isFromInventory,
  isMerging,
  mergingTarget,
}: {
  id: string;
  title: string;
  emoji: string;
  left?: number;
  top?: number;
  amount?: number;
  onDrop?: (id: string, item: any) => void;
  onRemove?: (id: string) => void;
  isFromInventory: boolean;
  isHidden?: boolean;
  isNew?: boolean;
  isMerging?: boolean;
  mergingTarget?: { [key: string]: any };
}) => {
  console.log(isMerging);
  console.log(mergingTarget);
  const item = useMemo(
    () => ({ id, title, emoji, left, top }),
    [id, title, emoji, left, top]
  );

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item] // Only depend on the memoized item
  );

  // Memoize the drop callback
  const handleDrop = useCallback(
    (dropItem: any) => {
      if (dropItem.id !== id) {
        onDrop?.(id, dropItem);
      }
    },
    [id, onDrop]
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
  const [position, setPosition] = useState({ x: left || 0, y: top || 0 });
  const initialPosition = useRef({ x: left || 0, y: top || 0 });
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Update position when left/top props change
  useEffect(() => {
    if (!isDragging) {
      setPosition({ x: left || 0, y: top || 0 });
      initialPosition.current = { x: left || 0, y: top || 0 };
    }
  }, [isDragging, left, top]);

  // Handle dragging with debounced updates
  useEffect(() => {
    if (!isDragging) return;

    let animationFrame: number;
    const monitor = dragDropManager.getMonitor();

    const updatePosition = () => {
      const offset = monitor.getSourceClientOffset();
      if (offset) {
        setPosition({
          x: offset.x + 65,
          y: offset.y + 15,
        });
      }
    };

    const handleOffsetChange = () => {
      // Use requestAnimationFrame to debounce updates
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updatePosition);
    };

    const unsubscribe = monitor.subscribeToOffsetChange(handleOffsetChange);

    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrame);
    };
  }, [isDragging, dragDropManager]);

  // Combine drag and drop refs
  const ref = useCallback(
    (element: any) => {
      elementRef.current = element;
      drag(element);
      drop(element);
    },
    [drag, drop]
  );

  // if (isHidden) {
  //   return null;
  // }

  // Memoize the style object
  const style = useMemo(
    () =>
      isDragging
        ? {
            opacity: 0.9,
            position: "fixed" as const,
            left: position.x,
            top: position.y,
            pointerEvents: "none" as const,
            zIndex: 1000,
            transform: "translate(-50%, -50%)",
            willChange: "transform", // Hint to browser for optimization
          }
        : {
            opacity: 1,
            position: isFromInventory
              ? ("static" as const)
              : ("absolute" as const),
            left,
            top,
          },
    [isDragging, position.x, position.y, isFromInventory, left, top]
  );

  // Memoize the remove handler
  const handleRemove = useCallback(() => onRemove?.(id), [onRemove, id]);

  return (
    <div
      ref={ref}
      className={cn(
        "px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 inline-flex",
        isMerging && mergingTarget?.id === id && "bg-gray-300",
        isHidden && "hidden",
        isNew && "animate-bounce scale-110"
      )}
      style={style}
    >
      <div
        className={cn(
          "text-black text-xs font-normal font-['Sora'] capitalize leading-normal",
          isMerging && mergingTarget?.id === id && "opacity-0"
        )}
      >
        <span className="mr-1">{emoji}</span> {shortenName(title)}
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
      {isMerging && mergingTarget?.id === id && <MergeLoadingAnimation />}
    </div>
  );
};

// Use React.memo with a custom comparison function for optimal re-rendering
export default React.memo(
  DraggableBox,
  (prevProps, nextProps) =>
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.emoji === nextProps.emoji &&
    prevProps.left === nextProps.left &&
    prevProps.top === nextProps.top &&
    prevProps.amount === nextProps.amount &&
    prevProps.isFromInventory === nextProps.isFromInventory &&
    prevProps.isMerging === nextProps.isMerging &&
    prevProps.mergingTarget === nextProps.mergingTarget &&
    prevProps.isNew === nextProps.isNew &&
    prevProps.isHidden === nextProps.isHidden
);
