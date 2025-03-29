"use client";
import ElementItem from "@/components/common/ElementItem";
/* eslint-disable @typescript-eslint/no-explicit-any */
import useApi from "@/hooks/useApi";
import { initBackButton } from "@telegram-apps/sdk";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Define types for our data structure
interface Item {
  id: number;
  handle: string;
  emoji?: string;
  isNew: boolean;
  explore: number;
  reward: number;
  mask: number;
  itemId: number;
}

interface Recipe {
  id: number;
  ingrAId: number;
  ingrBId: number;
  resultId?: number;
  mask: number;
  ingredientA: Item;
  ingredientB: Item;
  result?: Item;
}

export const RecipeDetail = ({ item }: { item: Item }) => {
  const [backButton] = initBackButton();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    backButton.show();

    backButton.on("click", () => {
      router.back();
    });
  }, [backButton, router]);

  const getRecipeApi = useApi({
    key: ["getRecipe"],
    method: "GET",
    url: `recipes/item/${item?.itemId}/craftable`,
    enabled: !!item?.itemId,
  }).get;

  const getItemApi = useApi({
    key: ["getItem"],
    method: "GET",
    url: `recipes/item/${item?.itemId}`,
    enabled: !!item?.itemId,
  }).get;

  useEffect(() => {
    if (item?.itemId) {
      getRecipeApi?.refetch();
      getItemApi?.refetch();
    }
  }, [item?.itemId]);

  // Process the recipes once data is loaded
  useEffect(() => {
    if (getRecipeApi?.data?.recipes) {
      const recipes = getRecipeApi.data.recipes.filter(
        (recipe: Recipe) => recipe.result
      );

      // Limit to 15 recipes for display
      setFilteredRecipes(recipes.slice(0, 15));
    }
  }, [getRecipeApi?.data]);

  // Helper function to display item with emoji if available
  const renderItem = (item?: Item) => {
    if (!item) return <div>Unknown</div>;

    return (
      <ElementItem
        id={item.id.toString()}
        handle={item.handle}
        emoji={item.emoji || ""}
        amount={undefined}
      />
    );
  };

  return (
    <div className="flex flex-col items-start h-full gap-4 mt-4 overflow-y-auto">
      <div className="self-stretch inline-flex flex-col justify-start items-start gap-4">
        {getRecipeApi?.isPending && (
          <div className="text-white text-center w-full">
            Loading recipes...
          </div>
        )}

        {filteredRecipes.length === 0 && !getRecipeApi?.isPending && (
          <div className="text-white text-center w-full">
            No recipes found for this item
          </div>
        )}

        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          {filteredRecipes.map((recipe, index) => (
            <div
              key={recipe.id}
              className="self-stretch inline-flex justify-start items-center gap-1"
            >
              <div className="justify-start text-white font-normal font-['Sora'] leading-normal">
                {index + 1}.
              </div>

              {renderItem(recipe.ingredientA)}
              <div className="justify-start text-white font-normal font-['Sora'] leading-normal">
                +
              </div>

              {renderItem(recipe.ingredientB)}
              <div className="justify-start text-white font-normal font-['Sora'] leading-normal">
                =
              </div>

              {renderItem(recipe.result)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
