"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useApi from "@/hooks/useApi";
import { initInvoice } from "@telegram-apps/sdk";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { toast } from "sonner";
export const ShopItem = ({ currency = "ENERGY" }: { currency?: string }) => {
  const router = useRouter();
  const invoice = initInvoice();

  const fetchProducts = useApi({
    key: ["products"],
    method: "GET",
    url: `shop/products`,
  }).get;

  useEffect(() => {
    fetchProducts?.refetch();
  }, [fetchProducts]);

  const createPurchase = useApi({
    key: ["create-telegram-invoice"],
    url: "shop/create-telegram-invoice",
    method: "POST",
  }).post;

  const onBuy = useCallback(
    async (item: any) => {
      const resp = await createPurchase?.mutateAsync({
        productId: item.id,
      });
      if (resp?.invoiceLink) {
        invoice.open(resp?.invoiceLink, "url").then(async (status) => {
          if (status === "paid") {
            toast.success("Energy purchased successfully");
          }
        });
      }
    },
    [createPurchase, invoice]
  );

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex ">
      <Card className=" rounded-2xl border border-[#1f1f1f] flex-col justify-start items-start inline-flex w-full ]">
        <CardHeader className="text-white text-sm font-normal ">
          Energy
        </CardHeader>
        <CardContent className="w-full">
          {fetchProducts?.data
            ?.filter((product) => product.type === "ENERGY")
            .map((product) => (
              <div
                key={product.id}
                className="self-stretch py-2 justify-between items-center inline-flex w-full"
              >
                <div className="justify-start items-center gap-2 flex">
                  <div className="justify-start items-center flex">
                    <Image
                      src="/images/energy.svg"
                      alt="star"
                      width={24}
                      height={24}
                    />
                    <div className="text-white text-sm font-normal leading-normal">
                      {product.value}
                    </div>
                  </div>
                  <div className="text-white text-sm font-semibold uppercase leading-normal tracking-wide">
                    =
                  </div>
                  <div className="justify-start items-center flex">
                    <Image
                      src="/images/star.svg"
                      alt="star"
                      width={24}
                      height={24}
                    />
                    <div className="text-white text-sm font-normal leading-normal">
                      {product.price}
                    </div>
                  </div>
                </div>
                <Button
                  className="bg-white rounded-3xl justify-center items-center gap-2 flex w-fit"
                  size={"sm"}
                  disabled={createPurchase?.isPending}
                  isLoading={createPurchase?.isPending}
                  onClick={() => onBuy(product)}
                >
                  <div className="text-black text-xs font-normal uppercase leading-normal">
                    Buy
                  </div>
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>
      <Card className=" py-2 rounded-2xl border border-[#1f1f1f] flex-col justify-start items-start inline-flex w-full">
        <CardHeader className="flex flex-row justify-between items-center w-full">
          <div className="text-white text-sm font-normal leading-normal">
            Subscription
          </div>
          <div className="text-[#68ffd1] text-sm font-normal underline leading-normal">
            Benefit
          </div>
        </CardHeader>
        <CardContent className="w-full">
          {fetchProducts?.data
            ?.filter((product) => product.type === "SUBSCRIPTION")
            .map((product) => (
              <div
                key={product.id}
                className="self-stretch py-2 justify-between items-center inline-flex w-full"
              >
                <div className="justify-start items-center gap-2 flex">
                  <div className="justify-start items-center flex">
                    <Image
                      src="/images/vip.svg"
                      alt="star"
                      width={24}
                      height={24}
                    />
                    <div className="text-white text-sm font-normal leading-normal">
                      {product.value} Month
                    </div>
                  </div>
                  <div className="text-white text-sm font-semibold uppercase leading-normal tracking-wide">
                    =
                  </div>
                  <div className="justify-start items-center flex">
                    <Image
                      src="/images/star.svg"
                      alt="star"
                      width={24}
                      height={24}
                    />
                    <div className="text-white text-sm font-normal leading-normal">
                      {product.price}
                    </div>
                  </div>
                </div>
                <Button
                  className="bg-white rounded-3xl justify-center items-center gap-2 flex w-fit"
                  size={"sm"}
                  disabled={createPurchase?.isPending}
                  isLoading={createPurchase?.isPending}
                  onClick={() => onBuy(product)}
                >
                  <div className="text-black text-xs font-normal uppercase leading-normal">
                    Subscription
                  </div>
                </Button>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(ShopItem);
