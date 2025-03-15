import { KioskItem } from "@mysten/kiosk";
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

/**
 * React hook to fetch items from multiple Sui kiosks
 *
 * @param kioskIds Array of kiosk object IDs to fetch items from
 * @param options Configuration options for the hook
 * @returns Object containing items, loading state, error state, and refetch function
 */
export function useMarketPlace(
  kioskId?: string,
  options: UseKioskItemsOptions = {}
) {
  const [items, setItems] = useState<any[]>([]);

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

  // Effect to fetch items on mount and when kioskIds changes (if watchKioskChanges is true)
  useEffect(() => {
    fetchItems();
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
    refetch: fetchItems,
  };
}
