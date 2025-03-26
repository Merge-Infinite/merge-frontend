import { useEffect } from "react";
import { Button } from "../ui/button";
export function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col flex-1 h-full w-full justify-center items-center gap-10 relative ">
      <div className=" text-white text-center flex items-center justify-center text-[3rem] font-light  uppercase relative">
        The Merges Infinite
      </div>

      <Button
        onClick={() => {
          window.open("https://merg3.xyz", "_blank");
        }}
        className="w-fit px-4 capitalize"
      >
        Go to App
      </Button>
    </div>
  );
}
