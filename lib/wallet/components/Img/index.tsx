import { Extendable } from "../../types";
import ImgError from "../../assets/icons/img-error.png";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import classNames from "classnames";
import Image from "next/image";

export type ImageProps = Extendable & {
  src: string | undefined;
  thumbnail?: string;
  fallback?: string;
  alt?: string;
  width?: number;
  height?: number;
};

const ImgSkeleton = (props: Extendable) => {
  return (
    <Skeleton
      className={classNames("w-[full] h-[full] ", props.className)}
      style={props.style}
    />
  );
};

export const Img = (props: ImageProps) => {
  const { src, fallback = ImgError, alt = "image" } = props;

  const [loading, setLoading] = useState(true);
  const [imgSource, setImgSource] = useState(props.thumbnail);

  useEffect(() => {
    if (!src) {
      setImgSource(fallback);
      setLoading(false);
      return;
    }
    const img = new Image();
    img.onload = (ev) => {
      setImgSource(src);
      setLoading(false);
    };
    img.onerror = (event) => {
      setImgSource(fallback);
      setLoading(false);
    };
    img.src = src;
  }, [src]);

  if (loading) {
    return <ImgSkeleton className={props.className} style={props.style} />;
  }
  return (
    <Image
      src={imgSource}
      alt={alt}
      className={classNames(props.className)}
      style={props.style}
      width={props.width || 40}
      height={props.height || 40}
    />
  );
};

export default Img;
