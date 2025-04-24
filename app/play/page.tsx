"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import PlayGame from "@/components/common/MergeArea/PlayGame";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
export default function Home() {
  const [backButton] = initBackButton();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
      dispatch(updateTabMode(TabMode.HOME));
    });
  }, []);

  return (
    <div className="flex flex-col items-center  h-full">
      <PlayGame />
    </div>
  );
}
