"use client";

import UserInfo from "../../common/user-info";
import ChallengeGrid from "./ChallengeGrid";

export function GameScreen() {
  return (
    <div className="w-full h-full  flex-col justify-start items-start gap-2 inline-flex">
      <UserInfo />
      <div className="flex-col justify-start items-start gap-4 inline-flex w-full">
        <ChallengeGrid category="Trend" />
      </div>
    </div>
  );
}
