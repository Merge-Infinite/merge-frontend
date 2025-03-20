import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="flex flex-col w-full justify-center items-center gap-2">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="w-full flex flex-col gap-2 items-center">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
