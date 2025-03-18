"use client";

import Image from "next/image";
export default function ChallengeHeader() {
  return (
    <>
      <div className="text-white text-sm font-bold font-['Sora'] leading-normal">
        Challenge
      </div>
      <div className="self-stretch justify-start items-center gap-4 inline-flex">
        <div className="justify-start items-start gap-1 flex">
          <Image src="/images/points.svg" alt="points" width={24} height={24} />
          <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
            280 Points
          </div>
        </div>
        <div className="justify-start items-start gap-1 flex">
          <Image src="/images/rank.svg" alt="rank" width={24} height={24} />
          <div className="text-center text-[#68ffd1] text-sm font-normal font-['Sora'] underline uppercase leading-normal">
            Rank: 29
          </div>
        </div>
      </div>
    </>
  );
}
