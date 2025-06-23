"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePoolSystem } from "@/hooks/usePool";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUniversalApp } from "../context/UniversalAppContext";

interface ExplorationArea {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  isEnabled: boolean;
}

export default function BrainrotExplorer() {
  const router = useRouter();
  const { pools } = usePoolSystem({
    refreshInterval: 30000,
  });
  const { backButton, isTelegram, isReady } = useUniversalApp();

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.show();
        backButton.on("click", () => {
          router.back();
        });
      }
    }
  }, [isReady, isTelegram, backButton]);

  return (
    <div className="w-full h-full bg-black p-4">
      <div className="flex flex-col gap-2">
        {pools.map((area) => (
          <Card
            key={area.id}
            className="bg-neutral-950/60 rounded-2xl overflow-hidden outline "
          >
            <CardContent className="p-4 pb-6 pt-2 outline-[#1f1f1f]">
              <div className="flex gap-4">
                {/* Icon */}
                <Image
                  src={area.imageUrl}
                  alt={area.name}
                  width={100}
                  height={100}
                />

                {/* Content */}
                <div className="flex-1 flex flex-col gap-2">
                  {/* Title and Description */}
                  <div className="flex flex-col">
                    <h2 className="text-white text-xl font-normal font-sora uppercase leading-7">
                      {area.name}
                    </h2>
                    <p className="text-neutral-600 text-xs font-normal font-sora leading-none mt-1">
                      {area.description}
                    </p>
                  </div>

                  {/* Button */}
                  <Button
                    variant={area.isActive ? "secondary" : "ghost"}
                    size="sm"
                    disabled={!area.isActive}
                    className={`
                        w-14 h-auto px-3 py-1 rounded-3xl text-xs font-normal font-sora uppercase
                        ${
                          area.isActive
                            ? "bg-white text-black hover:bg-gray-200"
                            : "bg-neutral-800 text-neutral-700 cursor-not-allowed hover:bg-neutral-800"
                        }
                      `}
                    onClick={() => {
                      router.push(`/universe?poolId=${area.id}`);
                    }}
                  >
                    Go
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
