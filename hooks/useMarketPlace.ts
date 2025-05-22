import { suiClient } from "@/lib/utils";
import { KioskItem } from "@mysten/kiosk";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useCallback, useEffect, useState } from "react";
import useApi from "./useApi";

// Types for our hook
export interface KioskItemWithMetadata extends KioskItem {
  kioskId: string;
  fetchedAt: number;
}

interface UseKioskItemsOptions {
  pollingInterval?: number;
}

export function useMarketPlace(
  kioskId?: string,
  options: UseKioskItemsOptions = {}
) {
  const [items, setItems] = useState<any[]>([]);
  const [profit, setProfit] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const marketplaceListingsApi = useApi({
    key: ["fetchMarketplaceListings"],
    method: "GET",
    url: `marketplace/listings?kiosId=${kioskId || ""}`,
  }).get;
  // Default options
  const { pollingInterval = 0 } = options;

  // Function to fetch items from kiosks
  const fetchItems = useCallback(async () => {
    setError(null);

    try {
      const response = await marketplaceListingsApi?.refetch();

      setItems((response?.data as any[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
    }
  }, [kioskId]);

  const fetchKioskProfit = async () => {
    try {
      if (!kioskId) {
        return;
      }
      const kioskObject = await suiClient.getObject({
        id: kioskId,
        options: { showContent: true },
      });

      if (!kioskObject || !kioskObject.data || !kioskObject.data.content) {
        throw new Error("Kiosk not found or invalid response");
      }

      const kioskContent = kioskObject.data.content;

      const profitValue = kioskContent.fields?.profits;

      if (profitValue) {
        const profitInSui = Number(profitValue) / Number(MIST_PER_SUI);
        setProfit(profitInSui);
      } else {
      }
    } catch (err) {
      console.error("Error fetching kiosk profit:", err);
    } finally {
    }
  };

  // Effect to fetch items on mount and when kioskIds changes (if watchKioskChanges is true)
  useEffect(() => {
    fetchItems();
    fetchKioskProfit();
  }, [kioskId]);

  // Effect to set up polling if pollingInterval is specified
  useEffect(() => {
    if (!pollingInterval) return;

    const intervalId = setInterval(fetchItems, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [pollingInterval, fetchItems]);

  return {
    items,
    loading: marketplaceListingsApi?.isFetching,
    error,
    profit,
    refetchProfit: fetchKioskProfit,
    refetch: fetchItems,
  };
}
