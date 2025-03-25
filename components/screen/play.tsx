/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTelegramDevice } from "@/hooks/use-device";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import Image from "next/image";
import { useCallback, useState } from "react";
import { DndProvider, XYCoord } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import DraggableBox from "../common/DraggableBox";
import MergingArea from "../common/MergingArea";
import GamePlayInfo from "../common/play-info";
interface PlayGameProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

export default function PlayGame({}: PlayGameProps) {
  const { inventory, refetchInventory } = useUser();
  const [mergingBoxes, setMergingBoxes] = useState({});
  const { isMobile } = useTelegramDevice();
  const [targetBox, setTargetBox] = useState({});
  const mergeApi = useApi({
    key: ["craft-word"],
    method: "POST",
    url: "user/craft-word",
  }).post;
  const handleDropToMerge = useCallback(
    async (targetId: number, droppedItem: any) => {
      // If we have two items in merging area, combine them
      const targetBox = (mergingBoxes as any)[targetId];
      if (!targetBox) return;
      setTargetBox(targetBox);
      setMergingBoxes((prev: any) => {
        const newBoxes = { ...prev };

        if (newBoxes[droppedItem.id]) {
          newBoxes[droppedItem.id] = {
            ...newBoxes[droppedItem.id],
            isHidden: true,
          };
        }
        return newBoxes;
      });
      try {
        // Simulate API call
        const response: any = await mergeApi?.mutateAsync({
          item1: targetId,
          item2: droppedItem.id,
        });
        const newElement = {
          id: response.id,
          title: response.handle,
          emoji: response.emoji,
          left: droppedItem.left,
          top: droppedItem.top,
        };

        setMergingBoxes((prev: any) => {
          const newBoxes = { ...prev };
          delete newBoxes[targetId];
          delete newBoxes[droppedItem.id];
          return {
            ...newBoxes,
            [newElement.id]: newElement,
          };
        });
        await refetchInventory?.();
        setTimeout(() => {
          setMergingBoxes((prev: any) => {
            const newBoxes = { ...prev };
            if (newBoxes[newElement.id]) {
              newBoxes[newElement.id] = {
                ...newBoxes[newElement.id],
                isNew: false,
              };
            }
            return newBoxes;
          });
        }, 1000);
      } catch (error) {
        console.error("Error combining elements:", error);
        setMergingBoxes((prev: any) => {
          const newBoxes = { ...prev };
          if (newBoxes[targetId]) {
            newBoxes[targetId] = {
              ...newBoxes[targetId],
              isHidden: false,
            };
          }
          if (newBoxes[droppedItem.id]) {
            newBoxes[droppedItem.id] = {
              ...newBoxes[droppedItem.id],
              isHidden: false,
            };
          }
          return newBoxes;
        });
      }
    },
    [mergingBoxes]
  );

  const handleDrop = useCallback(
    (droppedItem: any, delta: XYCoord, clientOffset: XYCoord) => {
      console.log(droppedItem);
      if (
        droppedItem.id &&
        droppedItem.left !== undefined &&
        droppedItem.top !== undefined
      ) {
        if (delta && delta.x && delta.y) {
          const left = Math.round(droppedItem.left + delta.x);
          const top = Math.round(droppedItem.top + delta.y);

          setMergingBoxes((prev: any) => ({
            ...prev,
            [droppedItem.id]: {
              id: droppedItem.id,
              title: droppedItem.title,
              emoji: droppedItem.emoji,
              left,
              top,
            },
          }));
        }
      } else {
        if (clientOffset && clientOffset.x && clientOffset.y) {
          const left = Math.round(clientOffset.x - 60);
          const top = Math.round(clientOffset.y - 100);

          setMergingBoxes((prev: any) => ({
            ...prev,
            [droppedItem.id]: {
              id: droppedItem.id,
              title: droppedItem.title,
              emoji: droppedItem.emoji,
              left: left,
              top: top,
            },
          }));
        }
      }
    },
    [mergingBoxes]
  );

  const handleRemove = useCallback(
    (id: string) => {
      setMergingBoxes((prev: any) => {
        const newBoxes = { ...prev };
        delete newBoxes[id];
        return newBoxes;
      });
    },
    [mergingBoxes]
  );
  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend}>
      <div className="w-full h-full bg-black">
        <GamePlayInfo />

        <div className="h-[40%] mt-4">
          <MergingArea
            onDrop={handleDrop}
            onDropandMerge={handleDropToMerge}
            mergingBoxes={mergingBoxes}
            onRemove={handleRemove}
            isMerging={mergeApi?.isPending ?? false}
            mergingTarget={targetBox}
          ></MergingArea>
        </div>
        <div className="flex-col justify-start items-start gap-5 inline-flex px-3 py-2 bg-[#141414] rounded-3xl h-1/2 w-full">
          <div className="self-stretch justify-start items-start gap-6 inline-flex">
            <div className="grow shrink basis-0 rounded-3xl flex-col justify-start items-start gap-1 inline-flex">
              <div className="self-stretch px-3 py-2 bg-[#141414] rounded-3xl border border-[#333333] justify-start items-start gap-4 inline-flex">
                <Image
                  src="/images/search.svg"
                  alt="search"
                  width={24}
                  height={24}
                />
                <div className="grow shrink basis-0 h-6 text-[#5c5c5c] text-sm font-normal font-['Sora'] leading-normal">
                  Search items...
                </div>
              </div>
            </div>
          </div>
          <div className="self-stretch flex-col justify-start items-start gap-1 flex">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Infinite elements:
            </div>
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap">
              {(inventory as any[])
                ?.filter((element: any) => element.isBasic)
                .map((element: any) => (
                  <DraggableBox
                    key={element.id}
                    id={element.itemId}
                    title={element.handle}
                    emoji={element.emoji}
                    isFromInventory={true}
                  />
                ))}
            </div>
          </div>
          <div className="self-stretch flex-col justify-start items-start gap-1 flex">
            <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
              Crafted elements:
            </div>
            <div className="relative justify-start items-center gap-2 inline-flex flex-wrap">
              {(inventory as any[])
                ?.filter(
                  (element: any) => !element.isBasic && element.amount > 0
                )
                .map((element: any) => (
                  <DraggableBox
                    key={element.id}
                    id={element.itemId}
                    title={element.handle}
                    emoji={element.emoji}
                    amount={element.amount}
                    isFromInventory={true}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
