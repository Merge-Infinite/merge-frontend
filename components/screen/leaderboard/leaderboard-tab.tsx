"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useApi from "@/hooks/useApi";
import { formatTimeRemaining } from "@/utils/constants";
import Image from "next/image";
import React, { useEffect } from "react";

export const LeaderboardTab = () => {
  const getLeaderboard = useApi({
    key: ["leaderboard-weekly"],
    method: "GET",
    url: `user/leaderboard-weekly`,
  }).get;

  useEffect(() => {
    getLeaderboard?.refetch();
  }, [getLeaderboard]);

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex ">
      <Card className="w-full bg-black border-none">
        <CardHeader className="pb-2 w-full p-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle className="text-white text-sm">Top 50</CardTitle>
              <Sheet>
                <SheetTrigger asChild>
                  <div className="flex items-center gap-1 text-sm text-white cursor-pointer">
                    <span>Prize pool:</span>
                    <Image
                      src="/images/sui.svg"
                      alt="sui"
                      width={20}
                      height={20}
                    />
                    <span className="text-emerald-300 underline">
                      {getLeaderboard?.data?.event?.eventData?.prize || "?"}
                    </span>
                  </div>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="bg-zinc-900 rounded-t-3xl p-0 max-w-none h-72"
                >
                  <div className="p-4 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <SheetTitle className="text-white text-base m-0">
                        Top 50 Detail
                      </SheetTitle>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <RankMedal rank={1} />
                        <span className="text-white text-sm">#1</span>
                        <span className="text-white text-sm">
                          Rewards: 10% Prize pool size
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <RankMedal rank={2} />
                        <span className="text-white text-sm">#2</span>
                        <span className="text-white text-sm">
                          Rewards: 8% Prize pool size
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <RankMedal rank={3} />
                        <span className="text-white text-sm">#3</span>
                        <span className="text-white text-sm">
                          Rewards: 5% Prize pool size
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm">#4-#10</span>
                        <span className="text-white text-sm">
                          Rewards: 21% Prize pool size, 3% for each
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm ">#11-#20</span>
                        <span className="text-white text-sm">
                          Rewards: 20% Prize pool size, 2% for each
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm ">#21-#50</span>
                        <span className="text-white text-sm">
                          Rewards: 36% Prize pool size, 1.2% for each
                        </span>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <span className="text-purple-400 text-sm w-fit">
              {formatTimeRemaining(getLeaderboard?.data?.event.endDate)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4">
              {getLeaderboard?.data?.leaderboard?.map(
                (entry: any, index: number) => (
                  <div key={index} className={`flex items-start gap-2 `}>
                    <RankMedal rank={entry.rank} />
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-sm">
                        {entry.username}
                      </span>
                      <div className="flex gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Image
                            src="/images/points.svg"
                            alt="sui"
                            width={16}
                            height={16}
                          />
                          <span className="text-white">
                            {entry.points} Points
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-white">Reward:</span>
                          <Image
                            src="/images/sui.svg"
                            alt="sui"
                            width={16}
                            height={16}
                          />
                          <span className="text-white">{entry.reward}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

const RankMedal = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return <Image src="/images/top1.svg" alt="medal" width={24} height={24} />;
  } else if (rank === 2) {
    return <Image src="/images/top2.svg" alt="medal" width={24} height={24} />;
  } else if (rank === 3) {
    return <Image src="/images/top3.svg" alt="medal" width={24} height={24} />;
  }
  return <div className="text-white text-sm font-normal">#{rank}</div>;
};

export default React.memo(LeaderboardTab);
