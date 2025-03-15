"use client";

import React from "react";

interface ElementItemProps {
  id: string;
  handle: string;
  emoji: string;
  amount?: number;
}

const ElementItem: React.FC<ElementItemProps> = ({
  id,
  handle,
  emoji,
  amount,
}) => {
  console.log(emoji.toString());
  return (
    <div className="px-3 py-1  rounded-3xl justify-center items-center gap-2 inline-flex rounded-3xl border border-white">
      <div className="text-white text-xs font-normal capitalize leading-normal">
        <span className="mr-1">{emoji}</span> {handle}
        {amount && amount > 0 ? `(${amount})` : ""}
      </div>
    </div>
  );
};

export default React.memo(ElementItem);
