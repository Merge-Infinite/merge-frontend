"use client";

import { useMemo } from "react";
import ChallengeItem from "./ChallengeItem";

export default function ChallengeGrid({ category }: { category: string }) {
  // Get the current month's days
  const [daysInMonth, currentMonthDays] = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate(); // Last day of current month

    // Create array of day objects with their date info
    const days = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        dayNumber: i + 1,
        dayOfWeek: date.getDay(), // 0-6 (Sunday-Saturday)
        isToday: today.getDate() === i + 1,
        date,
      };
    });

    return [daysCount, days];
  }, []);

  const activeItem = useMemo(() => {
    const today = new Date();
    return (
      currentMonthDays.find((day) => day.isToday)?.dayNumber || today.getDate()
    );
  }, []);

  return (
    <>
      <div className="text-white text-sm font-normal font-['Sora'] leading-normal">
        {category}
      </div>
      <div className="self-stretch justify-start items-center gap-2 inline-flex flex-wrap">
        {currentMonthDays.map((day) => (
          <ChallengeItem
            key={`${category}-${day.dayNumber}`}
            number={day.dayNumber}
            isActive={day.dayNumber === activeItem}
            isPassed={day.dayNumber < activeItem}
          />
        ))}
      </div>
    </>
  );
}
