/* eslint-disable @typescript-eslint/no-explicit-any */
import { convertEmojiCode } from "@/lib/utils";
import Image from "next/image";
import React, { useRef } from "react";
import { useDrag, useDragDropManager, useDrop } from "react-dnd";

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
  isFromInventory,
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
}) => {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: { id, title, emoji, left, top },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [onDrop, left, top, onRemove, isFromInventory]
  );

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop: (item: any, monitor) => {
        if (item.id !== id) {
          onDrop?.(id, item);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [onDrop, left, top, onRemove, isFromInventory]
  );

  //   const dragDropManager = useDragDropManager();
  //   const monitor = dragDropManager.getMonitor();
  //   React.useEffect(
  //     () =>
  //       monitor.subscribeToOffsetChange(() => {
  //         const offset = monitor.getClientOffset();
  //         const initialOffset = monitor.getInitialClientOffset();
  //         const difference = monitor.getDifferenceFromInitialOffset();
  //         const initialSourceOffset = monitor.getInitialSourceClientOffset();
  //         console.log("offset", offset);
  //         console.log("initialOffset", initialOffset);
  //         console.log("difference", difference);
  //         console.log("initialSourceOffset", initialSourceOffset);
  //       }),
  //     [monitor]
  //   );
  //   const [{ handlerId }, drop] = useDrop({
  //     accept: ItemTypes.BOX,
  //     collect(monitor) {
  //       return {
  //         handlerId: monitor.getHandlerId(),
  //       };
  //     },
  //   });
  //   const [{ isDragging }, drag] = useDrag({
  //     type: ItemTypes.BOX,
  //     item: () => {
  //       return { id };
  //     },
  //     collect: (monitor) => ({
  //       isDragging: monitor.isDragging(),
  //     }),
  //   });

  const ref = (element: any) => {
    drag(element);
    drop(element);
  };
  return (
    <div
      ref={ref}
      className="h-8 px-3 py-1 bg-white rounded-3xl justify-center items-center gap-2 inline-flex"
      style={{
        opacity: isDragging ? 0.5 : 1,
        left,
        top,
        position: !isFromInventory ? "absolute" : "static",
      }}
    >
      <div className="text-black text-xs font-normal font-['Sora'] capitalize leading-normal">
        <span className="mr-1">{emoji}</span> {title}
        {amount && amount > 0 ? `(${amount})` : ""}
      </div>
      {!isFromInventory && (
        <Image
          onClick={() => onRemove?.(id)}
          src="/images/remove.svg"
          alt="fire"
          width={24}
          height={24}
        />
      )}
    </div>
  );
};

export default React.memo(DraggableBox);
