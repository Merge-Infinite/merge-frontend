"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import PlayGame from "@/components/common/MergeArea/PlayGame";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useUniversalApp } from "../context/UniversalAppContext";
export default function Home() {
  const { backButton, isReady, isTelegram } = useUniversalApp();

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.show();
        backButton.on("click", () => {
          router.back();
          dispatch(updateTabMode(TabMode.HOME));
        });
      }
      dispatch(updateTabMode(TabMode.HOME));
    }
  }, [isReady, isTelegram, backButton, dispatch]);

  return (
    <div className="flex flex-col items-center  h-full ">
      <PlayGame />
    </div>
  );
}
