"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import Image from "next/image";
import React from "react";
import ShopItem from "./shop-item";
export const Shop = () => {
  const { isTelegram } = useUniversalApp();
  return (
    <div
      className="flex flex-col items-center justify-start"
      style={{
        paddingBottom: 100,
      }}
    >
      <Tabs
        defaultValue={isTelegram ? "star" : "sui"}
        className="w-full h-full"
      >
        <TabsList className="flex justify-center gap-6 bg-transparent">
          {isTelegram && (
            <TabsTrigger
              value="star"
              className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2"
            >
              <Image src="/images/star.svg" alt="star" width={24} height={24} />
              Star
            </TabsTrigger>
          )}
          <TabsTrigger
            value="sui"
            className="data-[state=active]:text-white data-[state=active]:border-b-white data-[state=active]:border-b-2"
          >
            <Image src="/images/sui.svg" alt="sui" width={24} height={24} />
            SUI
          </TabsTrigger>
        </TabsList>
        {isTelegram && (
          <TabsContent
            value="star"
            className="overflow-y-auto h-[var(--tg-viewport-height) - 100px]"
          >
            <ShopItem currency="star" />
          </TabsContent>
        )}
        <TabsContent
          value="sui"
          className="overflow-y-auto h-[var(--tg-viewport-height) - 100px]"
        >
          <ShopItem currency="sui" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(Shop);
