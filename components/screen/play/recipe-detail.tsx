"use client";
import ElementItem from "@/components/common/ElementItem";
/* eslint-disable @typescript-eslint/no-explicit-any */
import useApi from "@/hooks/useApi";
import { useEffect } from "react";

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
  const getRecipeApi = useApi({
    key: ["getRecipe", item?.id ? item.id.toString() : ""],
    method: "GET",
    url: item?.id
      ? `recipes/item/${item.id}/craftable`
      : "recipes/item/1/craftable",
    enabled: false,
  }).get;

  useEffect(() => {
    if (item?.id) {
      getRecipeApi?.refetch();
    }
  }, [item?.id]);

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

  console.log(getRecipeApi?.isPending);

  return (
    <div className="flex flex-col items-start h-full gap-4 mt-4 ">
      {getRecipeApi?.isPending && (
        <div className="text-white text-center w-full">Loading recipes...</div>
      )}

      {getRecipeApi?.data?.recipes?.length === 0 &&
        !getRecipeApi?.isPending && (
          <div className="text-white text-center w-full">
            No recipes found for this item
          </div>
        )}

      {!getRecipeApi?.isPending && (
        <div
          className="flex flex-col justify-start items-start gap-1 overflow-y-auto"
          style={{
            height: "90%",
          }}
        >
          {getRecipeApi?.data?.recipes?.map((recipe: Recipe, index: number) => (
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
      )}
    </div>
  );
};
