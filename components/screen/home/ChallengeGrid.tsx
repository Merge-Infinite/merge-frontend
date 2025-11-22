"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function ChallengeGrid({ category }: { category: string }) {
  const router = useRouter();
  const user = useUser();
  // // Get the current month's days
  // const [daysInMonth, currentMonthDays] = useMemo(() => {
  //   const today = new Date();
  //   const year = today.getFullYear();
  //   const month = today.getMonth();
  //   const daysCount = new Date(year, month + 1, 0).getDate(); // Last day of current month

  //   // Create array of day objects with their date info
  //   const days = Array.from({ length: daysCount }, (_, i) => {
  //     const date = new Date(year, month, i + 1);
  //     return {
  //       dayNumber: i + 1,
  //       dayOfWeek: date.getDay(), // 0-6 (Sunday-Saturday)
  //       isToday: today.getDate() === i + 1,
  //       date,
  //     };
  //   });

  //   return [daysCount, days];
  // }, []);

  // const activeItem = useMemo(() => {
  //   const today = new Date();
  //   return (
  //     currentMonthDays.find((day) => day.isToday)?.dayNumber || today.getDate()
  //   );
  // }, []);

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Row 1: Explore & Creative */}
        <div className="flex flex-row sm:flex-row gap-2 w-full">
          {/* Explore Card */}
          <Card className="w-full bg-neutral-950/60 border border-[#1f1f1f] rounded-2xl">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-bold font-['Sora'] text-white">
                🪐 Explore
              </CardTitle>
              <CardDescription className="text-sm font-normal font-['Sora'] text-white">
                Explore the worlds of MI & earn rewards.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-2 pb-6">
              <Button
                onClick={() => {
                  router.push("/explore");
                }}
                className="bg-[#a668ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-fit"
              >
                <span className="text-sm font-normal font-['Sora'] uppercase">
                  GO
                </span>
              </Button>
            </CardFooter>
          </Card>

          {/* Creative Card */}
          <Card className="w-full bg-neutral-950/60 border border-[#1f1f1f] rounded-2xl">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-bold font-['Sora'] text-white">
                👾 Creative
              </CardTitle>
              <CardDescription className="text-sm font-normal font-['Sora'] text-white">
                Create your own universe.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-2">
              <Button
                onClick={() => {
                  router.push("/creative");
                }}
                className="bg-[#a668ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-fit"
              >
                <span className="text-sm font-normal font-['Sora'] uppercase">
                  GO
                </span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Row 2: NBA Game & MI Assistant */}
        <div className="flex flex-row sm:flex-row gap-2 w-full">
          {/* NBA Game Card */}
          {user.user?.isWhitelisted && (
            <Card className="w-full bg-neutral-950/60 border border-[#1f1f1f] rounded-2xl">
              <CardHeader className="p-4 pb-0">
                <CardTitle className="text-base font-bold font-['Sora'] text-white">
                  🏀 NBA Game
                </CardTitle>
                <CardDescription className="text-sm font-normal font-['Sora'] text-white">
                  Lorem Ipsum is simply dummy text
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-2 pb-6">
                <Button
                  onClick={() => {
                    router.push("/nba-game");
                  }}
                  className="bg-[#a668ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-fit"
                >
                  <span className="text-sm font-normal font-['Sora'] uppercase">
                    GO
                  </span>
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* MI Assistant Card */}
          {/* <Card className="w-full bg-neutral-950/60 border border-[#1f1f1f] rounded-2xl">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-bold font-['Sora'] text-white flex items-center gap-1">
                <span className="text-base">✨</span> MI Assistant
              </CardTitle>
              <CardDescription className="text-sm font-normal font-['Sora'] text-white">
                Explore the worlds of MI & earn rewards.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-2">
              <Button
                onClick={() => {
                  router.push("/mi-assistant");
                }}
                className="bg-[#a668ff] hover:bg-[#9154e7] text-neutral-950 rounded-3xl w-fit"
              >
                <span className="text-sm font-normal font-['Sora'] uppercase">
                  GO
                </span>
              </Button>
            </CardFooter>
          </Card> */}
        </div>
      </div>
    </>
  );
}
