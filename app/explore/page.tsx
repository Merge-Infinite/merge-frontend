"use client";

import PoolCard from "@/components/PoolCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePoolSystem } from "@/hooks/usePool";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useUniversalApp } from "../context/UniversalAppContext";

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

  // Separate pools into active and inactive
  const { activePools, inactivePools } = useMemo(() => {
    const active = pools
      .filter((pool) => pool.isActive && pool.endTime > Date.now())
      .sort((a, b) => b.startTime - a.startTime);
    const inactive = pools.filter(
      (pool) => !pool.isActive || pool.endTime < Date.now()
    );
    return { activePools: active, inactivePools: inactive };
  }, [pools]);

  return (
    <div className="w-full h-full bg-black p-4">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full h-full gap-4 mb-4">
          <TabsTrigger
            value="active"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
          >
            Active Pools ({activePools.length})
          </TabsTrigger>
          <TabsTrigger
            value="inactive"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2 uppercase"
          >
            Inactive Pools ({inactivePools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <div className="flex flex-col gap-4">
            {activePools.length > 0 ? (
              activePools.map((pool) => <PoolCard key={pool.id} pool={pool} />)
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 font-sora">
                  No active pools available
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="mt-0">
          <div className="flex flex-col gap-4">
            {inactivePools.length > 0 ? (
              inactivePools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 font-sora">No inactive pools</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
