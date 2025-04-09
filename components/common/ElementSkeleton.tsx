import { Skeleton } from "../ui/skeleton";

const TagSkeleton = () => {
  // Create an array of different width values for more realistic loading appearance
  const tagWidths = [80, 120, 100, 90, 110, 85, 95, 130, 105, 75];

  return (
    <div className="self-stretch inline-flex justify-start items-center gap-2 flex-wrap content-center">
      {tagWidths.map((width, index) => (
        <div
          key={index}
          className={`px-3 py-1 rounded-3xl flex justify-center items-center gap-2 ${
            index < 2 ? "bg-gray-200" : "border border-gray-200"
          }`}
        >
          {/* Show icon placeholder for some tags */}
          {index > 1 && index < 8 && (
            <Skeleton className="w-6 h-6 rounded-sm" />
          )}
          <Skeleton
            className={`h-4 rounded-full`}
            style={{ width: `${width}px` }}
          />
        </div>
      ))}
    </div>
  );
};

export default TagSkeleton;
