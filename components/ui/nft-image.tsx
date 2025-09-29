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
    const baseURL = "https://aggregator.walrus-mainnet.walrus.space/v1/blobs/";
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
