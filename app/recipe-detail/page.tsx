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

export default function RecipeDetail() {
  const [backButton] = initBackButton();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
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
    url: `recipes/item/${id}/craftable`,
  }).get;

  const getItemApi = useApi({
    key: ["getItem"],
    method: "GET",
    url: `recipes/item/${id}`,
  }).get;

  useEffect(() => {
    getRecipeApi?.refetch();
    getItemApi?.refetch();
  }, [getRecipeApi, getItemApi, id]);

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
    <div className="flex flex-col items-start h-full p-4 gap-4">
      <ElementItem
        id={getItemApi?.data?.item?.id.toString()}
        handle={getItemApi?.data?.item?.handle}
        emoji={getItemApi?.data?.item?.emoji || ""}
        amount={undefined}
      />
      <div className="self-stretch inline-flex flex-col justify-start items-start gap-4">
        {filteredRecipes.length === 0 && getRecipeApi?.isLoading && (
          <div className="text-white text-center w-full">
            Loading recipes...
          </div>
        )}

        {filteredRecipes.length === 0 && !getRecipeApi?.isLoading && (
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
              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                {index + 1}.
              </div>

              {renderItem(recipe.ingredientA)}
              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                +
              </div>

              {renderItem(recipe.ingredientB)}
              <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                =
              </div>

              {renderItem(recipe.result)}
            </div>
          ))}

          {/* Render empty placeholder rows if fewer than 15 recipes */}
          {Array.from({ length: Math.max(0, 15 - filteredRecipes.length) }).map(
            (_, index) => (
              <div
                key={`empty-${index}`}
                className="self-stretch inline-flex justify-start items-center gap-1"
              >
                <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                  {filteredRecipes.length + index + 1}.
                </div>
                <div
                  data-size="S"
                  data-states="Default"
                  data-type="Ghost"
                  className="px-3 py-1 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2"
                >
                  <div></div>
                </div>
                <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                  +
                </div>
                <div
                  data-size="S"
                  data-states="Default"
                  data-type="Ghost"
                  className="px-3 py-1 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2"
                >
                  <div></div>
                </div>
                <div className="justify-start text-white text-sm font-normal font-['Sora'] leading-normal">
                  =
                </div>
                <div
                  data-size="S"
                  data-states="Default"
                  data-type="Ghost"
                  className="px-3 py-1 rounded-3xl outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2"
                >
                  <div></div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
