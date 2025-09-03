"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import useApi from "@/hooks/useApi";

import { useUser } from "@/hooks/useUser";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { formatSUI } from "@/lib/wallet/core/utils";
import useSuiBalance from "@/lib/wallet/hooks/coin/useSuiBalance";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { OmitToken } from "@/lib/wallet/types";
import { SELLER_ADDRESS } from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { formatAddress, MIST_PER_SUI } from "@mysten/sui/utils";
import { initInvoice } from "@telegram-apps/sdk";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
export const ShopItem = ({ currency = "star" }: { currency?: string }) => {
  const apiClient = useApiClient();
  const { user, refetch } = useUser();
  const { isTelegram, suiBalance } = useUniversalApp();
  const invoice = isTelegram ? initInvoice() : null;
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address } = useAccount(appContext.accountId);
  const account = useCurrentAccount();
  const { data: balance } = useSuiBalance(address);
  const [isLoading, setIsLoading] = useState(false);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const fetchProducts = useApi({
    key: ["products"],
    method: "GET",
    url: `shop/products?currency=${currency}`,
  }).get;
  const suiPrice = useSelector((state: RootState) => state.appContext.suiPrice);

  useEffect(() => {
    fetchProducts?.refetch();
  }, [fetchProducts]);

  const createPurchase = useApi({
    key: ["create-telegram-invoice"],
    url: "shop/create-telegram-invoice",
    method: "POST",
  }).post;

  const processSuiPayment = useApi({
    key: ["process-sui-transaction"],
    url: "shop/process-sui-transaction",
    method: "POST",
  }).post;
  const client = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction({
      execute: async ({ bytes, signature }) =>
        await client.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            showRawEffects: true,
            showObjectChanges: true,
          },
        }),
    });

  const onBuy = useCallback(
    async (item: any) => {
      if (currency === "sui") {
        await onBuyBySui(item.usdPrice ? item.usdPrice / suiPrice : item.price);
      } else {
        const resp = await createPurchase?.mutateAsync({
          productId: item.id,
        });
        if (resp?.invoiceLink) {
          invoice
            .open(resp?.invoiceLink, "url")
            .then(async (status) => {
              if (status === "paid") {
                refetch();
                toast.success("Energy purchased successfully");
              }
            })
            .catch((error) => {
              console.error("Error opening invoice:", error);
            });
        }
      }
    },
    [createPurchase, invoice, currency]
  );

  async function onBuyBySui(suiPrice: number): Promise<void> {
    setIsLoading(true);
    try {
      const txb = new Transaction();
      const coinToTransfer = txb.splitCoins(txb.gas, [
        Number(suiPrice * Number(MIST_PER_SUI)),
      ]);

      // Transfer the split coin to the recipient address
      txb.transferObjects([coinToTransfer], txb.pure.address(SELLER_ADDRESS));

      let response;
      if (isTelegram) {
        response = await apiClient.callFunc<
          SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
          undefined
        >(
          "txn",
          "signAndExecuteTransactionBlock",
          {
            transactionBlock: txb.serialize(),
            context: {
              network,
              walletId: appContext.walletId,
              accountId: appContext.accountId,
            },
          },
          { withAuth: true }
        );
      } else {
        response = await signAndExecuteTransaction({
          transaction: txb.serialize(),
        });
      }

      if (response && response.digest) {
        // Sync with backend
        try {
          await processSuiPayment?.mutateAsync({
            txHash: response.digest,
            productId: product.id,
          });
          refetch();
        } catch (error) {
          console.error("Backend sync error:", error);
        }
      }
    } catch (error: any) {
      if (error.message === "Authentication required") {
        setOpenAuthDialog(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const timeLeft = React.useMemo(() => {
    if (!user?.userBalance?.subscriptionEndDate) {
      return;
    }
    const now = new Date();
    const difference =
      new Date(user?.userBalance?.subscriptionEndDate).getTime() -
      now.getTime();

    if (difference <= 0) {
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    return `${days}d ${hours}h`;
  }, [user?.userBalance?.subscriptionEndDate]);

  return (
    <div className="w-full h-full flex-col justify-start items-start gap-2 inline-flex ">
      {currency === "sui" && (
        <div className="self-stretch px-4 py-2 bg-neutral-950 bg-opacity-60 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#1f1f1f] inline-flex flex-col justify-start items-start gap-2">
          <div className="self-stretch inline-flex justify-center items-center gap-2">
            <div className="flex-1 justify-start text-white text-base font-bold font-['Sora'] leading-normal">
              Hi {user?.username}!!!
            </div>
          </div>
          <div className="inline-flex justify-start items-center gap-2">
            <div
              data-size="S"
              data-states="Default"
              data-type="Secondary"
              className="px-3 py-1 bg-white rounded-3xl flex justify-center items-center gap-2"
            >
              <div>
                {formatAddress(isTelegram ? address : account?.address || "")}
              </div>
              <Image
                src="/images/remove.svg"
                alt="copy"
                width={24}
                height={24}
              />
            </div>
            <div className="flex justify-start items-center">
              <Image src="/images/sui.svg" alt="copy" width={24} height={24} />
              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                {formatSUI(isTelegram ? balance.balance : suiBalance || 0)} SUI
              </div>
            </div>
          </div>
        </div>
      )}
      <Card className=" rounded-2xl border border-[#1f1f1f] flex-col justify-start items-start inline-flex w-full ]">
        <CardHeader className="text-white text-sm font-normal ">
          Energy
        </CardHeader>
        <CardContent className="w-full">
          {fetchProducts?.isPending ? (
            <SkeletonCard />
          ) : (
            fetchProducts?.data
              ?.filter((product) => product.type === "ENERGY")
              .map((product) => (
                <div
                  key={product.id}
                  className="self-stretch py-2 justify-between items-center inline-flex w-full"
                >
                  <div className="justify-start items-center gap-2 flex">
                    <div className="justify-start items-center flex gap-2">
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
                      {currency === "star" ? (
                        <Image
                          src="/images/star.svg"
                          alt="star"
                          width={24}
                          height={24}
                        />
                      ) : (
                        <Image
                          src="/images/sui.svg"
                          alt="star"
                          width={24}
                          height={24}
                        />
                      )}
                      <div className="text-white text-sm font-normal leading-normal">
                        {product.usdPrice
                          ? product.usdPrice / suiPrice
                          : product.price}{" "}
                      </div>
                    </div>
                  </div>
                  <Button
                    className="bg-white rounded-3xl justify-center items-center gap-2 flex w-fit"
                    size={"sm"}
                    disabled={createPurchase?.isPending || isLoading}
                    isLoading={createPurchase?.isPending || isLoading}
                    onClick={async () => {
                      setProduct(product);
                      await onBuy(product);
                    }}
                  >
                    <div className="text-black text-xs font-normal uppercase leading-normal">
                      Buy
                    </div>
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>
      <Card className=" py-2 rounded-2xl border border-[#1f1f1f] flex-col justify-start items-start inline-flex w-full">
        <CardHeader className="flex flex-row justify-between items-center w-full">
          <div className="text-white text-sm font-normal leading-normal">
            Subscription
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <div className="text-[#68ffd1] text-sm font-normal underline leading-normal">
                Benefit
              </div>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="bg-zinc-900 rounded-t-3xl p-0 max-w-none h-72"
            >
              <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <SheetTitle className="text-white text-base m-0">
                    Benefit
                  </SheetTitle>
                </div>

                <div className="self-stretch inline-flex flex-col justify-start items-start gap-1">
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    1. Skip the ad to see the recipe.
                  </div>
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    2. x2 energy when completing task.
                  </div>
                  <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    3. x2 energy recovery per hour.
                  </div>
                  <div className="self-stretch justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                    4. Bonus points for AirDrop token program (Coming soon).
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="w-full">
          {fetchProducts?.isPending ? (
            <SkeletonCard />
          ) : (
            fetchProducts?.data
              ?.filter((product) => product.type === "SUBSCRIPTION")
              .map((product) => (
                <div
                  key={product.id}
                  className="self-stretch py-2 justify-between items-center inline-flex w-full"
                >
                  <div className="justify-start items-center gap-2 flex">
                    <div className="justify-start items-center flex gap-2">
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
                      {currency === "star" ? (
                        <Image
                          src="/images/star.svg"
                          alt="star"
                          width={24}
                          height={24}
                        />
                      ) : (
                        <Image
                          src="/images/sui.svg"
                          alt="star"
                          width={24}
                          height={24}
                        />
                      )}
                      <div className="text-white text-sm font-normal leading-normal">
                        {product.usdPrice
                          ? product.usdPrice / suiPrice
                          : product.price}{" "}
                      </div>
                    </div>
                  </div>
                  <Button
                    className="bg-white rounded-3xl justify-center items-center gap-2 flex w-fit"
                    size={"sm"}
                    disabled={
                      createPurchase?.isPending ||
                      isLoading ||
                      (user?.userBalance?.subscriptionEndDate &&
                        new Date(user?.userBalance?.subscriptionEndDate) >
                          new Date())
                    }
                    isLoading={createPurchase?.isPending || isLoading}
                    onClick={() => onBuy(product)}
                  >
                    <div className="text-black text-xs font-normal uppercase leading-normal">
                      {user?.userBalance?.subscriptionEndDate &&
                      new Date(user?.userBalance?.subscriptionEndDate) >
                        new Date()
                        ? timeLeft
                        : "Subscription"}
                    </div>
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>
      <PasscodeAuthDialog
        open={openAuthDialog}
        setOpen={(open) => setOpenAuthDialog(open)}
        onSuccess={() => onBuy(product)}
      />
    </div>
  );
};

export default React.memo(ShopItem);
