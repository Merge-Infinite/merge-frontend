import { Skeleton } from "@/components/ui/skeleton";

interface ApiSkeletonCardProps {}

export function ApiSkeletonCard({}: ApiSkeletonCardProps) {
  // Show loading skeleton
  return (
    <div className="flex flex-col w-full max-w-sm mx-auto bg-black rounded-2xl p-6 shadow-sm overflow-hidden relative h-full">
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="relative h-24 w-24 flex items-center justify-center">
          <Skeleton className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700 opacity-60 animate-pulse" />
        </div>
      </div>

      {/* Add skeleton for card content */}
      <div className="mt-32 space-y-4">
        <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <Skeleton className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
