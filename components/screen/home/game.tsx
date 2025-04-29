"use client";

import UserInfo from "../../common/user-info";
import ChallengeGrid from "./ChallengeGrid";
import ChallengeHeader from "./ChallengeHeader";

export function GameScreen() {
  return (
    <div className="w-full h-full  flex-col justify-start items-start gap-2 inline-flex">
      <UserInfo />
      <div className="flex-col justify-start items-start gap-4 inline-flex">
        <ChallengeHeader />
        <ChallengeGrid category="Trend" />
      </div>
    </div>
  );
}
