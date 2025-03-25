import { useEffect, useState } from "react";

export const useTelegramDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    platform: "unknown",
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to detect device type
    const detectDevice = () => {
      // Check if Telegram WebApp is available
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        // Get platform info
        const platform = tg.platform;

        // Determine device type based on Telegram's platform info
        const isMobile = platform === "android" || platform === "ios";
        const isTablet = platform === "android" || platform === "ios"; // Telegram doesn't differentiate tablets
        const isDesktop =
          platform === "tdesktop" || platform === "weba" || platform === "webk";

        setDeviceInfo({
          isMobile,
          isTablet,
          isDesktop,
          platform,
        });
      } else {
        // Fallback detection if Telegram WebApp is not available
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile =
          /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            userAgent
          );
        const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
        const isDesktop = !isMobile && !isTablet;

        setDeviceInfo({
          isMobile,
          isTablet,
          isDesktop,
          platform: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
        });
      }

      setIsLoading(false);
    };

    detectDevice();
  }, []);

  return { ...deviceInfo, isLoading };
};
