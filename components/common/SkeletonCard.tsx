import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {}

export function SkeletonCard({}: SkeletonCardProps) {
  // Show loading skeleton
  return (
    <div className="flex flex-col w-full max-w-sm mx-auto bg-black rounded-2xl py-6 shadow-sm overflow-hidden relative h-full">
      <div className="mt-0 space-y-4">
        <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <Skeleton className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
