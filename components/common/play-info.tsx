"use client";

import useAdsgram from "@/hooks/useAdsgram";
import useApi from "@/hooks/useApi";
import { useUser } from "@/hooks/useUser";
import { AppDispatch } from "@/lib/wallet/store";
import { TabMode, updateTabMode } from "@/lib/wallet/store/app-context";
import { ArrowLeftIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RecipeDetail } from "../screen/play/recipe-detail";
import { RecipeList } from "../screen/play/recipe-list";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import ElementItem from "./ElementItem";
interface GamePlayInfoProps {
  explore?: number;
  reward?: number;
  mask?: number;
  dep?: number;
  freq?: number;
}

export default function GamePlayInfo({}: GamePlayInfoProps) {
  const { user } = useUser();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [isRecipeListOpen, setIsRecipeListOpen] = useState(false);
  const [isRecipeDetailOpen, setIsRecipeDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const getUserBagApi = useApi({
    key: ["getUserBag"],
    method: "GET",
    url: "user/mybags",
  }).get;

  const getRecipeApi = useApi({
    key: ["getRecipe"],
    method: "GET",
    url: selectedItem
      ? `recipes/item/${selectedItem.itemId || selectedItem.id}/craftable`
      : "",
    enabled: !!selectedItem,
  }).get;

  const getItemApi = useApi({
    key: ["getItem"],
    method: "GET",
    url: selectedItem
      ? `recipes/item/${selectedItem.itemId || selectedItem.id}`
      : "",
    enabled: !!selectedItem,
  }).get;

  const onReward = useCallback(async () => {
    toast.success("Rewarded");
  }, []);

  const onError = useCallback((result: any) => {
    toast.error(result?.description || "Error");
  }, []);

  const showAd = useAdsgram({
    blockId: "9126",
    onReward,
    onError,
  });

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    getRecipeApi?.refetch();
    getItemApi?.refetch();
    setIsRecipeDetailOpen(true);
    setIsRecipeListOpen(false);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setIsRecipeDetailOpen(false);
    setIsRecipeListOpen(true);
  };

  const toggleRecipeList = () => {
    if (selectedItem) {
      setIsRecipeDetailOpen(true);
      return;
    }
    if (isRecipeDetailOpen) {
      setIsRecipeDetailOpen(false);
      setIsRecipeListOpen(true);
    } else {
      setIsRecipeListOpen(!isRecipeListOpen);
      if (!isRecipeListOpen) {
        getUserBagApi?.refetch();
      }
    }
  };

  return (
    <div className="w-full justify-between items-center inline-flex p-4">
      <div className="justify-start items-center gap-2 flex">
        <div className="p-2 rounded-3xl border border-[#1f1f1f] justify-start items-center gap-2 flex">
          <div className="justify-start items-center flex">
            <Image
              src="/images/energy.svg"
              alt="explore"
              width={24}
              height={24}
            />
            <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
              {user?.userBalance?.energyBalance.toLocaleString()}/48
            </div>
          </div>
          <Image
            src="/images/plus.svg"
            alt="explore"
            width={32}
            height={32}
            onClick={() => {
              dispatch(updateTabMode(TabMode.HOME));
              router.back();
            }}
          />
        </div>
        <Button
          className="p-2 rounded-3xl border border-[#1f1f1f] justify-start items-center gap-2 flex w-fit bg-transparent"
          size="default"
          onClick={showAd}
        >
          <div className="justify-start items-center flex">
            <div className="text-center text-white text-sm font-normal font-['Sora'] leading-normal">
              +5
            </div>
            <Image
              src="/images/energy.svg"
              alt="explore"
              width={24}
              height={24}
            />
          </div>
          <Image src="/images/ad.svg" alt="explore" width={24} height={24} />
        </Button>
      </div>
      <Image
        src="/images/recipe.svg"
        onClick={toggleRecipeList}
        alt="explore"
        width={24}
        height={24}
      />

      <Sheet open={isRecipeListOpen} onOpenChange={setIsRecipeListOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#141414] text-white border-t border-[#333333] h-[70%]"
        >
          <RecipeList onItemClick={handleItemSelect} />
        </SheetContent>
      </Sheet>

      <Sheet open={isRecipeDetailOpen} onOpenChange={setIsRecipeDetailOpen}>
        <SheetContent
          side="bottom"
          className="bg-[#141414] text-white border-t border-[#333333] h-[70%]"
          showClose={false}
        >
          <SheetHeader className="w-[80%] flex flex-row items-center gap-2">
            <ArrowLeftIcon
              className="w-5 h-5 text-white "
              onClick={handleBackToList}
            />
            <SheetTitle className="text-white text-center">
              <ElementItem {...selectedItem} amount={undefined} />
            </SheetTitle>
          </SheetHeader>
          <RecipeDetail item={selectedItem} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
