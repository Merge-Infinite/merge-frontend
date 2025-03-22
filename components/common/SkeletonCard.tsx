import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useEffect } from "react";

export function SkeletonCard() {
  // Create a shimmer animation effect
  useEffect(() => {}, []);

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto bg-black rounded-2xl p-6 shadow-sm overflow-hidden relative h-full">
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
    </div>
  );
}
