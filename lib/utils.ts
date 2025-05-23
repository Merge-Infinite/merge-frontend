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
  if (emojiString && emojiString.includes("U+")) {
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
  "0x35ddca38e941e9cc82c6569e2f7a363b764c995962c0cec48798cc9ba363cd6b";
export const POLICY_ID =
  "0xd3e594db219cd3c641b23fefc8745e58fc40c1397d23819f849853f11804d2ef";
export const NFT_MODULE_NAME = "element_nft";

export const MINT_NFT_FEE = 0.05;
export const GENERATION_FEE = 0.01;

export const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as any),
});

export const SELLER_ADDRESS =
  "0x9a1057730e9062b2819c52acc40cd06d7c990d6152a6754a231f1ca1b849521a";
export const MARKET_MINT_FEE =
  "0x5a628d7f62f9d14304239fea905c64399aad30b1244f965b60fc8f1a55f086e4";
export const ADMIN_ADDRESS =
  "0xce1b022dd5633fae11efabc9a48c871637b66c2f3e608929cf8fd4ba7683e205";
export const MARKET_FEE =
  "0x3c6540da727b07eee28b7da498930ad1cc337775079e3424cc6266333179b080";

export const CREATURE_NFT_PACKAGE_ID =
  "0x77e4547a82e270b12216d01a49e58838287202375efe2cd97570223d9b6cdac4";
export const COLLECTION_OBJECT_ID =
  "0x2f53f92e4b0e2700d1239fe6a89090b89578496bece23fc97c03967e57c1cc80";
export const CREATURE_NFT_MODULE_NAME = "creature_nft";
export const CREATURE_NFT_ADMIN_CAP =
  "0xc685660b8eac2fa721f5ebbea59ead30213a28ccbd0ad9ba2043318700bd31f2";

export const FEE_ADDRESS =
  "0x9a1057730e9062b2819c52acc40cd06d7c990d6152a6754a231f1ca1b849521a";
export const kioskClient = new KioskClient({
  client: suiClient as any,
  network: process.env.NEXT_PUBLIC_SUI_NETWORK as Network,
});
