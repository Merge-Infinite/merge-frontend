import Image from "next/image";
import { useMemo } from "react";

export const NFTImage = ({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
}) => {
  const srcUrl = useMemo(() => {
    const baseURL =
      "https://54xhw07cv6xbe8nydu02e9it6g4nz219j26wyd0x2jkmmwpoud.walcdn.io/";
    const blobId = src.includes("https") ? src.split("/").pop() : src;
    if (blobId) {
      return `${baseURL}${blobId}`;
    }
    return src;
  }, [src]);
  return (
    <Image
      className={className}
      src={srcUrl}
      alt={alt}
      width={width}
      height={height}
    />
  );
};
