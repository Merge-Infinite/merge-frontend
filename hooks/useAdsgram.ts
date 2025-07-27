"use client";
import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdController, ShowPromiseResult } from "../adsgram";
import useApi from "./useApi";

export interface UseAdsgramParams {
  blockId: string;
  onReward: (sid: string, result: ShowPromiseResult) => void;
  onError?: (result: ShowPromiseResult) => void;
}

export interface UseAdsgramReturn {
  showAd: () => Promise<void>;
  isLoading: boolean;
}

export function useAdsgram({
  blockId,
  onReward,
  onError,
}: UseAdsgramParams): UseAdsgramReturn {
  const { isTelegram } = useUniversalApp();
  const AdControllerRef = useRef<AdController | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Your API hooks
  const requestAdChallengeApi = useApi({
    key: ["user", "requestAdChallenge"],
    method: "POST",
    url: "user/create-ad-challenge",
  }).post;

  const adStartedApi = useApi({
    key: ["user", "adStarted"],
    method: "POST",
    url: "user/ad-started",
  }).post;

  useEffect(() => {
    AdControllerRef.current = window.Adsgram?.init({
      blockId,
      debug: false,
      debugBannerType: "FullscreenMedia",
    });
  }, [blockId]);

  const createAdSession = useCallback(async () => {
    try {
      const response = await requestAdChallengeApi?.mutateAsync({});

      if (response?.sessionId) {
        return response.sessionId;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Failed to create ad session:", error);
      return null;
    } finally {
    }
  }, [requestAdChallengeApi]);

  const recordAdStart = useCallback(
    async (sid: string) => {
      try {
        return await adStartedApi?.mutateAsync({
          sessionId: sid,
          isTelegram,
        });
      } catch (error) {
        console.error("Failed to record ad start:", error);
      }
    },
    [adStartedApi, isTelegram]
  );

  const showAd = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Step 1: Create ad session
      const sid = await createAdSession();
      if (!sid) return;

      // Step 2: Show ad
      if (AdControllerRef.current) {
        // Record ad start
        const { success } = await recordAdStart(sid, isTelegram);
        if (isTelegram && success) {
          // Show the ad
          AdControllerRef.current
            .show()
            .then((result: ShowPromiseResult) => {
              onReward(sid, result);
            })
            .catch((result: ShowPromiseResult) => {
              onError?.(result);
            });
        } else if (success) {
          onReward(sid, {
            error: false,
            done: true,
            state: "load",
            description: "Ad shown",
          });
        }
      } else {
        onError?.({
          error: true,
          done: false,
          state: "load",
          description: "Adsgram script not loaded",
        });
      }
    } catch (error) {
      console.error("Error in showAd flow:", error);
      toast.error("Something went wrong");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    createAdSession,
    recordAdStart,
    onReward,
    onError,
    isTelegram,
  ]);

  return {
    showAd,
    isLoading,
  };
}

export default useAdsgram;
