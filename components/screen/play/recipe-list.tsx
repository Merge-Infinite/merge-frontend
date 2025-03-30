"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { initBackButton } from "@telegram-apps/sdk";

import ElementItem from "@/components/common/ElementItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetHeader } from "@/components/ui/sheet";
import useAdsgram from "@/hooks/useAdsgram";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { Loader2, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

export const RecipeList = ({
  onItemClick,
}: {
  onItemClick: (item: any) => void;
}) => {
  const [backButton] = initBackButton();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { user } = useUser();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [debouncedText] = useDebounce(search, 1000);
  const selectedItemRef = useRef<any>(null);

  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, []);

  const getUserBagApi = useApi({
    key: ["getUserBag"],
    method: "GET",
    url: `recipes/suggest?search=${debouncedText}`,
  }).get;

  useEffect(() => {
    getUserBagApi?.refetch();
  }, [debouncedText]);

  useEffect(() => {
    selectedItemRef.current = selectedItem;
  }, [selectedItem]);

  const handleReward = useCallback(
    (sid: string, result: any) => {
      if (selectedItemRef.current) {
        onItemClick(selectedItemRef.current);
      } else {
        toast.error("No item selected");
      }
    },
    [onItemClick]
  );

  const { showAd, isLoading } = useAdsgram({
    blockId: "9126",
    onReward: handleReward,
    onError: (e: any) => {
      toast.error(e?.description || "Error");
    },
  });

  const handleItemClick = useCallback(
    (item: any) => {
      setSelectedItem(item);
      selectedItemRef.current = item;
      if (!shouldDisable) {
        showAd();
      } else {
        onItemClick(item);
      }
    },
    [showAd]
  );

  const shouldDisable = useMemo(() => {
    return (
      user?.userBalance?.subscriptionEndDate &&
      new Date(user?.userBalance?.subscriptionEndDate) > new Date()
    );
  }, [user?.userBalance?.subscriptionEndDate]);

  return (
    <div className="flex flex-col items-start gap-4  h-full">
      <SheetHeader className="w-[80%]">
        <div className="self-stretch px-3 py-2 bg-[#141414] rounded-[32px] outline outline-1 outline-offset-[-1px] outline-[#333333] inline-flex justify-start items-start gap-4">
          <SearchIcon className="w-5 h-5 text-white" />
          <Input
            className="inline-flex h-5 flex-col justify-start items-start overflow-hidden text-white ring-0 px-0 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </SheetHeader>
      <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
        1.Find the recipe for anything you want.
        <br />
        2.Skip the video to get the recipe:
      </div>
      <Button
        className="flex justify-center items-center gap-2 w-fit px-4 py-2"
        disabled={shouldDisable}
        onClick={() => {
          dispatch(updateTabMode(TabMode.SHOP));
          router.push("/");
        }}
        size="lg"
      >
        <Image
          src="/images/vip.svg"
          alt="subscription"
          width={24}
          height={24}
        />
        <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Sora'] uppercase leading-normal">
          Subscription
        </div>
      </Button>
      <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
        Recipe:
      </div>
      <div className="flex justify-start items-center gap-2 flex-wrap content-center overflow-y-auto">
        {getUserBagApi?.isPending ? (
          <div className="flex flex-col items-center justify-center w-full h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#68ffd1] mb-2" />
            <p className="text-gray-400">Loading inventory...</p>
          </div>
        ) : getUserBagApi?.data &&
          getUserBagApi?.data?.length > 0 &&
          !getUserBagApi.isPending ? (
          <div className="flex flex-wrap gap-2 w-full h-full">
            {getUserBagApi?.data?.map((item, index) => (
              <div
                key={index}
                onClick={() => handleItemClick(item)}
                className={`cursor-pointer transition-transform hover:scale-105 ${
                  selectedItem?.id === item?.id && isLoading
                    ? "opacity-50 px-10 py-1 rounded-3xl justify-center items-center gap-2 inline-flex rounded-3xl border border-white text-white "
                    : ""
                }`}
              >
                {selectedItem?.id === item?.id && isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ElementItem
                    {...item}
                    customIcon={
                      !user?.userBalance?.subscriptionEndDate && (
                        <Image
                          src="/images/ad.svg"
                          alt="subscription"
                          width={24}
                          height={24}
                        />
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-64">
            <p className="text-gray-400">No recipe found</p>
          </div>
        )}
      </div>
    </div>
  );
};
