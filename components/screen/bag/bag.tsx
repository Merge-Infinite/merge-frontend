"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OffchainBagScreen } from "./offchain";
import { OnchainBagScreen } from "./onchain";
export function BagScreen() {
  return (
    <div
      className="flex flex-col items-center justify-start"
      style={{
        paddingBottom: 100,
      }}
    >
      <Tabs defaultValue="off-chain" className="w-full h-full">
        <TabsList className="flex justify-center gap-6 bg-transparent sticky ">
          <TabsTrigger
            value="off-chain"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
          >
            Off-chain
          </TabsTrigger>
          <TabsTrigger
            value="on-chain"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 text-sm font-semibold px-4 py-2 rounded-none"
          >
            On-chain
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="off-chain"
          className="overflow-y-auto"
          style={{
            height: "calc(var(--tg-viewport-height) - 180px)",
          }}
        >
          <OffchainBagScreen />
        </TabsContent>
        <TabsContent
          value="on-chain"
          className="overflow-y-auto"
          style={{
            height: "calc(var(--tg-viewport-height) - 180px)",
          }}
        >
          <OnchainBagScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
}
