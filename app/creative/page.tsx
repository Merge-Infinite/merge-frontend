"use client";
import CreativeCustomizer from "@/components/screen/creative/creative-page";
import Progress from "@/components/screen/creative/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
export const Creative = () => {
  const [backButton] = initBackButton();
  const router = useRouter();
  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);
  return (
    <div
      className="flex flex-col items-center justify-start p-4"
      style={{
        paddingBottom: 100,
      }}
    >
      <Tabs defaultValue="creative" className="w-full h-full">
        <TabsList className="flex justify-center gap-6 bg-transparent">
          <TabsTrigger
            value="creative"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
          >
            Creative
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
          >
            Progress
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="creative"
          className="overflow-y-auto h-[var(--tg-viewport-height) - 100px]"
        >
          <CreativeCustomizer />
        </TabsContent>
        <TabsContent
          value="progress"
          className="overflow-y-auto h-[var(--tg-viewport-height) - 100px]"
        >
          <Progress />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(Creative);
