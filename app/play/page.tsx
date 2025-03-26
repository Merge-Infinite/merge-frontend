"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import PlayGame from "@/components/screen/play";
import { initBackButton } from "@telegram-apps/sdk";

import { SkeletonCard } from "@/components/common/SkeletonCard";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const [backButton] = initBackButton();
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);

  if (!user) {
    return <SkeletonCard />;
  }

  return (
    <div className="flex flex-col items-center  h-full">
      <PlayGame />
    </div>
  );
}
