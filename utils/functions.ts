// Utility function to detect if running in Telegram
export function isTelegramEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Telegram WebApp
  return !!(
    (window as any).Telegram?.WebApp ||
    window.navigator.userAgent.includes("Telegram") ||
    window.location.search.includes("tgWebAppPlatform") ||
    // Check for Telegram-specific parameters
    new URLSearchParams(window.location.search).has("tgWebAppStartParam")
  );
}
