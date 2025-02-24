import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertEmojiCode = (code: string) => {
  try {
    return String.fromCodePoint(parseInt(code));
  } catch (error) {
    console.error("Error converting emoji code:", error);
    return "⚠️"; // Return warning emoji as fallback
  }
};
