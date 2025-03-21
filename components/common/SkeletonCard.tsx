import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useEffect, useState } from "react";

export function SkeletonCard() {
  const [shimmerPosition, setShimmerPosition] = useState(0);

  // Create a shimmer animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShimmerPosition((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 20);

    return () => clearInterval(interval);
  }, []);

  // Custom shimmer style
  const shimmerStyle = {
    background: `linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) ${shimmerPosition - 15}%,
      rgba(255, 255, 255, 0.1) ${shimmerPosition}%,
      rgba(255, 255, 255, 0.05) ${shimmerPosition + 15}%,
      rgba(255, 255, 255, 0) 100%
    )`,
  };

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto bg-black rounded-2xl p-6 shadow-sm overflow-hidden relative h-full">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 z-10" style={shimmerStyle}></div>

      {/* Centered Logo */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="relative h-24 w-24 flex items-center justify-center">
          <Skeleton className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700 opacity-60" />
          <div className="relative z-30 flex items-center justify-center">
            <Image
              src="/images/logo.svg"
              alt="logo"
              width={164}
              height={164}
              className="dark:invert"
            />
          </div>
        </div>
      </div>

      {/* Main content area (blurred in background) */}
      <div className="opacity-40">
        <Skeleton className="h-[180px] w-full rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />

        {/* Text content */}
        <div className="w-full flex flex-col gap-3 mb-6">
          <Skeleton className="h-5 w-4/5 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-5 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-5 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Footer with avatar and content */}
        <div className="flex items-center gap-4 mt-2">
          <div className="relative">
            <Skeleton className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          <div className="flex-1">
            <Skeleton className="h-4 w-24 rounded-md bg-gray-200 dark:bg-gray-700 mb-2" />
            <Skeleton className="h-3 w-32 rounded-md bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
