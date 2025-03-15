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
export const walletPath = [
  "/home",
  "/test",
  "/nft",
  "/nft/details",
  "/nft/send",
  "/coin/detail/:coinType",
  "/dapps",
  "/send",
  "/swap",
  "/staking",
  "/transaction/flow",
  "/transaction/detail/:digest",
  "/settings",
  "/settings/wallet",
  "/settings/network",
  "/settings/security/*",
  "/password-confirm",
  "/onboard/welcome",
  "/onboard/create-new-wallet",
  "/onboard/import-wallet",
  "/wallet/create",
  "/wallet/import",
  "/dapp/connect",
  "/dapp/tx-approval",
  "/dapp/sign-msg",
  "*",
];

export const NFT_PACKAGE_ID =
  "0xd193c1d711383f22b026faec8905bfde145f16ed0030e102f65591dea431d245";
export const POLICY_ID =
  "0xc7131ef9b5294036856acedbe80b409997754d4c98ab464977b04ae0fe073021";
export const NFT_MODULE_NAME = "element_nft";
export const MINT_NFT_FEE = 50000000;
export const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as any),
});

export const kioskClient = new KioskClient({
  client: suiClient,
  network: process.env.NEXT_PUBLIC_SUI_NETWORK as Network,
});
