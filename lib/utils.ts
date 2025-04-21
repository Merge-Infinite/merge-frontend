import { KioskClient, Network } from "@mysten/kiosk";
import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { BigNumber as BN } from "bignumber.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertEmojiCode = (emojiString: string) => {
  if (emojiString.includes("U+")) {
    return emojiString
      .split("_")
      .map((codePoint) => {
        const hex = codePoint.replace("U+", "");
        return String.fromCodePoint(parseInt(hex, 16));
      })
      .join("");
  }

  return emojiString;
};

export function mists_to_sui(balance: number) {
  return BN(balance).dividedBy(MIST_PER_SUI.toString()).toString();
}

export function shortenName(name: string = "", start = 4, end = 2) {
  return name?.slice(0, start) + "..." + name?.slice(-end);
}

export const emojiToString = (emoji: string): string => {
  const codePoints = Array.from(emoji)
    .map((char) => {
      return `U+${char
        .codePointAt(0)
        ?.toString(16)
        .toUpperCase()
        .padStart(4, "0")}`;
    })
    .join("_");
  return codePoints;
};

export const NFT_PACKAGE_ID =
  "0x68b908a526f3114d0f74f54deb86832ff9d8764800c724f1e49fe7047116407e";
export const POLICY_ID =
  "0x7df619fa1d3681dcbea68af6d5fb4bb24a724861ccc128255e434347b0e51389";
export const NFT_MODULE_NAME = "element_nft";
export const MINT_NFT_FEE = 0.05;
export const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as any),
});
export const SELLER_ADDRESS =
  "0x9a1057730e9062b2819c52acc40cd06d7c990d6152a6754a231f1ca1b849521a";
export const MARKET_MINT_FEE =
  "0x5a628d7f62f9d14304239fea905c64399aad30b1244f965b60fc8f1a55f086e4";
export const MARKET_FEE =
  "0x3c6540da727b07eee28b7da498930ad1cc337775079e3424cc6266333179b080";
export const kioskClient = new KioskClient({
  client: suiClient,
  network: process.env.NEXT_PUBLIC_SUI_NETWORK as Network,
});
