"use client";

import Image from "next/image";
import React from "react";

interface EmojiProps {
  emoji: string;
  size?: number;
  className?: string;
}

const Emoji: React.FC<EmojiProps> = ({ emoji, size = 18, className = "" }) => {
  // Check if emoji is a URL (starts with https)
  const isUrl = emoji?.startsWith("https");

  return (
    <span className={className}>
      {isUrl ? (
        <Image
          src={emoji}
          alt="emoji"
          width={size}
          height={size}
          className="inline-block"
        />
      ) : (
        emoji
      )}
    </span>
  );
};

export default React.memo(Emoji);
