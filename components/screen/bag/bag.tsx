"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OffchainBagScreen } from "./offchain";
import { OnchainBagScreen } from "./onchain";
export function BagScreen() {
  return (
    <Tabs defaultValue="off-chain" className="w-full h-full flex-1">
      <TabsList className="flex justify-center gap-6 bg-transparent">
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
      <TabsContent value="off-chain" className="h-full">
        <OffchainBagScreen />
      </TabsContent>
      <TabsContent value="on-chain">
        <OnchainBagScreen />
      </TabsContent>
    </Tabs>
  );
}
