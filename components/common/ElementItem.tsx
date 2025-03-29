"use client";

import React from "react";

interface ElementItemProps {
  id: string;
  handle: string;
  emoji: string;
  amount?: number;
  customIcon?: React.ReactNode;
}

const ElementItem: React.FC<ElementItemProps> = ({
  id,
  handle,
  emoji,
  amount,
  customIcon,
}) => {
  return (
    <div className="px-3 py-1  rounded-3xl justify-center items-center gap-2 inline-flex rounded-3xl border border-white text-white text-xs uppercase">
      <span className="">{emoji}</span> {handle}
      {amount && amount > 0 ? `(${amount})` : ""}
      {customIcon && customIcon}
    </div>
  );
};

export default React.memo(ElementItem);
