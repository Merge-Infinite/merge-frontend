import { CSSProperties, ElementType, ReactNode } from "react";
import { Extendable } from "../../../types";

import classNames from "classnames";
import Image from "next/image";
import { nftImgUrl } from "../../../utils/nft";
import * as imgs from "./imgs";

export type IconProps = Extendable & {
  icon: {
    src: string;
    width?: number;
    height?: number;
  };
  alt?: string;
  onClick?: (e: any) => void;
  elClassName?: string;
  elStyle?: CSSProperties;
  width?: string;
  height?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
};

export type AvailableIcon =
  | "Add"
  | "Up"
  | "Down"
  | "Txn"
  | "Mint"
  | "Swap"
  | "Coin"
  | "Object"
  | "Sui"
  | "History"
  | "Close"
  | "HashTag"
  | "Time"
  | "Wallet"
  | "Copy"
  | "Trash"
  | "Warning";

export type IconType = AvailableIcon | "ReactNode" | "External" | "Unknown";
const iconMap = new Map<AvailableIcon, ElementType>(
  Object.entries(imgs) as any
);

export function isExternalIcon(icon: string): boolean {
  return icon.startsWith("http") || icon.startsWith("data:image");
}

export function iconType(icon: string | ReactNode): IconType {
  if (!icon) return "Unknown";
  if (typeof icon !== "string") return "ReactNode";
  if (isExternalIcon(icon)) return "External";
  if (iconMap.has(icon as AvailableIcon)) return icon as AvailableIcon;
  return "Unknown";
}

/**
 * Support built-in icons, remote url and ReactNode
 * with the essential dom properties: onClick, className, style...
 * @constructor
 */
const Icon = (props: IconProps) => {
  const { icon, alt = "icon" } = props;

  const renderIcon = () => {
    switch (iconType(icon)) {
      case "Unknown":
        return null;
      case "ReactNode":
        return (
          <Image
            src={icon.src}
            alt={alt}
            width={icon.width || 24}
            height={icon.height || 24}
            className={props.elClassName}
          />
        );
      case "External":
        return (
          <Image
            src={nftImgUrl(icon as string) as string}
            alt={alt}
            className={classNames("w-[36px] h-[36px]", props.elClassName)}
            style={props.elStyle}
          />
        );
      default:
        const IconReactNode: any = iconMap.get(icon as AvailableIcon) ?? <></>;
        return (
          <IconReactNode
            className={props.elClassName}
            style={Object.assign(
              {
                width: props.width,
                height: props.height,
                stroke: props.stroke,
                fill: props.fill,
                strokeWidth: props.strokeWidth,
              },
              props.elStyle
            )}
          />
        );
    }
  };

  return (
    <div
      onClick={props.onClick}
      className={props.className}
      style={props.style}
    >
      {renderIcon()}
      {/* <Image
        src={icon.src}
        alt={alt}
        width={icon.width || 24}
        height={icon.height || 24}
        className={props.elClassName}
      /> */}
    </div>
  );
};

export default Icon;
