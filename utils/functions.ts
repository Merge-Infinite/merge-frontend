import { isTMA } from "@tma.js/sdk";

export async function isTelegramEnvironment(): Promise<boolean> {
  const isTMAResult = await isTMA();
  return isTMAResult;
}
