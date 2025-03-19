"use client";

import useApi from "@/hooks/useApi";
import Image from "next/image";
import { useEffect } from "react";
export default function ChallengeHeader() {
  const fetchPoints = useApi({
    key: ["total-points"],
    method: "GET",
    url: `challenges/total-points`,
  }).get;

  useEffect(() => {
    fetchPoints?.refetch();
  }, [fetchPoints]);

  return (
    <>
      <div className="text-white text-sm font-bold font-['Sora'] leading-normal">
        Challenge
      </div>
      <div className="self-stretch justify-start items-center gap-4 inline-flex">
        <div className="justify-start items-center gap-1 flex">
          <Image src="/images/points.svg" alt="points" width={24} height={24} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            {fetchPoints?.data?.totalPoints.toLocaleString()} Points
          </div>
        </div>
        <div className="justify-start items-start gap-1 flex">
          <Image src="/images/rank.svg" alt="rank" width={24} height={24} />
          <div className="text-center text-[#68ffd1] text-sm font-normal font-['Sora'] underline uppercase leading-normal">
            Rank: ?
          </div>
        </div>
      </div>
    </>
  );
}
