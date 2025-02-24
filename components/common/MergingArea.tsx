/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useCallback, useRef } from "react";
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
  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop: (droppedItem: any, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
        const clientOffset = monitor.getClientOffset() as XYCoord;

        onDrop(droppedItem, delta, clientOffset);

        return undefined;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [mergingBoxes]
  );

  return (
    <div ref={drop} className={`relative h-full`}>
      {Object.values(mergingBoxes).map((box: any) => (
        <DraggableBox
          {...box}
          key={box.id}
          isFromInventory={false}
          onDrop={onDropandMerge}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

export default React.memo(MergingArea);
