"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ExplorationArea {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  isEnabled: boolean;
}

const explorationAreas: ExplorationArea[] = [
  {
    id: "universe",
    title: "Brainrot",
    subtitle: "Universe 🛸",
    description:
      "Take your pet to explore 🧐 the Brainrot universe 🧭 and earn valuable rewards.",
    icon: "🧠",
    isEnabled: true,
  },
  {
    id: "sky",
    title: "Brainrot",
    subtitle: "Sky ⚡",
    description:
      "Take your pet to explore the skies of Brainrot and earn rewards. Make sure it knows how to fly. 🤖🪽",
    icon: "☁️",
    isEnabled: false,
  },
  {
    id: "seabed",
    title: "Brainrot",
    subtitle: "seabed 🪼",
    description:
      "Is your pet brave enough to explore the seas of Brainrot? Make sure it knows how to swim.🐙",
    icon: "🐋",
    isEnabled: false,
  },
];

export default function BrainrotExplorer() {
  const [backButton] = initBackButton();
  const router = useRouter();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);
  return (
    <div className="w-full h-full bg-black p-4">
      <div className="flex flex-col gap-2">
        {explorationAreas.map((area) => (
          <Card
            key={area.id}
            className="bg-neutral-950/60 rounded-2xl overflow-hidden outline "
          >
            <CardContent className="p-4 pb-6 pt-2 outline-[#1f1f1f]">
              <div className="flex gap-4">
                {/* Icon */}
                <div className="text-7xl leading-none font-normal font-sora uppercase text-white flex-shrink-0">
                  {area.icon}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-2">
                  {/* Title and Description */}
                  <div className="flex flex-col">
                    <h2 className="text-white text-xl font-normal font-sora uppercase leading-7">
                      {area.title}
                      <br />
                      {area.subtitle}
                    </h2>
                    <p className="text-neutral-600 text-xs font-normal font-sora leading-none mt-1">
                      {area.description}
                    </p>
                  </div>

                  {/* Button */}
                  <Button
                    variant={area.isEnabled ? "secondary" : "ghost"}
                    size="sm"
                    disabled={!area.isEnabled}
                    className={`
                        w-14 h-auto px-3 py-1 rounded-3xl text-xs font-normal font-sora uppercase
                        ${
                          area.isEnabled
                            ? "bg-white text-black hover:bg-gray-200"
                            : "bg-neutral-800 text-neutral-700 cursor-not-allowed hover:bg-neutral-800"
                        }
                      `}
                    onClick={() => {
                      router.push(`/universe`);
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
