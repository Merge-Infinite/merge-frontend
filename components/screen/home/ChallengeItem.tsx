"use client";

import { STYLES } from "@/utils/constants";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
export default function ChallengeItem({
  number,
  isActive,
  isPassed,
}: {
  number: number;
  isActive: boolean;
  isPassed: boolean;
}) {
  const router = useRouter();
  // Using styles from constants with added support for highlighting today
  const itemStyle = useMemo(() => {
    if (isActive) return STYLES.item.active;
    if (isPassed) return STYLES.item.highlighted;
    return STYLES.item.default;
  }, [isActive, isPassed]);

  // Destructure the style string
  const [bgClass, textClass] = itemStyle.split(" ", 2);
  const remainingClasses = itemStyle.split(" ").slice(2).join(" ");

  return (
    <div
      className={`px-3 py-1 rounded-3xl justify-center items-center gap-2 flex ${bgClass} ${remainingClasses} border border-[#333333]`}
      onClick={() => {
        if (!isActive) return;
        router.push(`/challenges?type=trend`);
      }}
    >
      <div
        className={`text-center ${textClass} text-xs font-normal font-['Sora'] uppercase leading-normal`}
      >
        {number}
      </div>
    </div>
  );
}
