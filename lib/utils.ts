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

export const generateNFTImage = (
  element: string,
  amount: number,
  emoji: string
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve("");
      return;
    }

    // Set canvas size
    canvas.width = 260;
    canvas.height = 340;

    // Create gradient background
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#1a1a1a");
    gradient.addColorStop(1, "#2d2d2d");

    // Fill background with gradient and rounded corners
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, 15);
    ctx.fill();

    // Draw emoji
    ctx.font = "80px Arial";
    ctx.textAlign = "center";
    ctx.fillText(emoji, canvas.width / 2, 120);

    // Draw element name
    ctx.fillStyle = "white";
    ctx.font =
      "bold 24px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(
      element.charAt(0).toUpperCase() + element.slice(1),
      canvas.width / 2,
      180
    );

    // Draw amount
    ctx.font = "18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(`amt: ${amount}`, canvas.width / 2, 220);

    // Convert to base64
    const base64 = canvas.toDataURL("image/png");
    resolve(base64);
  });
};

// Add rounded rectangle support for older browsers
if (
  typeof window !== "undefined" &&
  !CanvasRenderingContext2D.prototype.roundRect
) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

export function formatTimeRemaining(endDateString: string): string {
  // Parse the end date
  const endDate = new Date(endDateString);

  // Get current date
  const currentDate = new Date();

  // Calculate the time difference in milliseconds
  let timeDiff = endDate.getTime() - currentDate.getTime();

  // If the end date has passed, return a message indicating it's ended
  if (timeDiff <= 0) {
    return "Ended";
  }

  // Calculate days, hours, and minutes
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  timeDiff -= days * (1000 * 60 * 60 * 24);

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  timeDiff -= hours * (1000 * 60 * 60);

  const minutes = Math.floor(timeDiff / (1000 * 60));

  // Format the string
  return `${days}D ${hours}H ${minutes}M`;
}

export const suiClient = new SuiClient({
  url: getFullnodeUrl(process.env.NEXT_PUBLIC_SUI_NETWORK as any),
});

export const kioskClient = new KioskClient({
  client: suiClient as any,
  network: process.env.NEXT_PUBLIC_SUI_NETWORK as Network,
});
