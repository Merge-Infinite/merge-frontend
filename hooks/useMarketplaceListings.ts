import { suiClient } from "@/lib/utils";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export interface KioskListing {
  objectId: string;
  kioskId: string;
  price: string;
  priceInSui: number;
  element: string;
  amount: string;
  imageUrl: string;
  itemId: string;
}

interface UseKioskListingsOptions {
  nftType: string;
  kioskId?: string;
  refreshInterval?: number;
  autoFetch?: boolean;
  limit?: number;
}

export function useKioskListings(options: UseKioskListingsOptions) {
  const [listings, setListings] = useState<KioskListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { nftType, refreshInterval, autoFetch = true, limit = 50 } = options;

  const fetchKioskListings = useCallback(async () => {
    if (!nftType) {
      setError(new Error("NFT type is required"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Define event types for our specific NFT type
      const listedEventType = `0x2::kiosk::ItemListed<${nftType}>`;
      const purchasedEventType = `0x2::kiosk::ItemPurchased<${nftType}>`;
      const delistedEventType = `0x2::kiosk::ItemDelisted<${nftType}>`;

      // Fetch all three types of events in parallel
      const [listedEvents, purchasedEvents, delistedEvents] = await Promise.all(
        [
          suiClient.queryEvents({
            query: { MoveEventType: listedEventType },
            limit: limit * 3,
            order: "descending",
          }),
          suiClient.queryEvents({
            query: { MoveEventType: purchasedEventType },
            limit: limit * 2,
            order: "descending",
          }),
          suiClient.queryEvents({
            query: { MoveEventType: delistedEventType },
            limit: limit * 2,
            order: "descending",
          }),
        ]
      );

      console.log(`Found ${listedEvents.data.length} ItemListed events`);
      console.log(`Found ${purchasedEvents.data.length} ItemPurchased events`);
      console.log(`Found ${delistedEvents.data.length} ItemDelisted events`);

      // Create sets of purchased and delisted items for quick lookup
      const purchasedItems = new Set<string>();
      const delistedItems = new Set<string>();

      // Process purchased events
      purchasedEvents.data.forEach((event) => {
        if (event.parsedJson) {
          const eventData = event.parsedJson as {
            id: string;
            kiosk: string;
            price: string;
          };
          purchasedItems.add(eventData.id);
        }
      });

      // Process delisted events
      delistedEvents.data.forEach((event) => {
        if (event.parsedJson) {
          const eventData = event.parsedJson as {
            id: string;
            kiosk: string;
          };
          delistedItems.add(eventData.id);
        }
      });

      console.log(`Found ${purchasedItems.size} purchased items`);
      console.log(`Found ${delistedItems.size} delisted items`);

      const activeListings: KioskListing[] = [];
      const processedItems = new Set<string>();

      // Process listed events and filter out purchased/delisted items
      for (const event of listedEvents.data) {
        if (event.parsedJson) {
          const eventData = event.parsedJson as {
            id: string;
            kiosk: string;
            price: string;
          };

          // Skip if we've already processed this item
          if (processedItems.has(eventData.id)) {
            continue;
          }

          // Skip if item was purchased or delisted
          if (purchasedItems.has(eventData.id)) {
            console.log(`Item ${eventData.id} was purchased - skipping`);
            continue;
          }

          if (delistedItems.has(eventData.id)) {
            console.log(`Item ${eventData.id} was delisted - skipping`);
            continue;
          }

          try {
            console.log(
              `Processing item ${eventData.id} from kiosk ${eventData.kiosk}`
            );
            if (options.kioskId && eventData.kiosk !== options.kioskId) {
              continue;
            }
            // Get the NFT object to verify it's still listed and get its details
            const nftObject = await suiClient.getObject({
              id: eventData.id,
              options: {
                showContent: true,
                showOwner: true,
                showDisplay: true,
              },
            });
            console.log("nftObject", nftObject);
            console.log("eventData", eventData);
            console.log("event", event);
            const content = nftObject?.data?.content as any;
            const display = nftObject?.data?.display?.data;

            const listing: KioskListing = {
              objectId: eventData.id,
              kioskId: eventData.kiosk,
              price: eventData.price,
              priceInSui: parseInt(eventData.price) / Number(MIST_PER_SUI),
              element: content?.fields?.element_name || "Unknown",
              amount: content?.fields?.amount?.toString() || "1",
              imageUrl: content?.fields?.image_url || display?.image_url || "",
              itemId: content?.fields?.item_id || display?.item_id || "",
            };

            activeListings.push(listing);
            processedItems.add(eventData.id);

            console.log(
              `Added listing: ${listing.element} for ${listing.priceInSui} SUI`
            );
          } catch (objError) {
            console.error(
              `Error processing listing ${eventData.id}:`,
              objError
            );
          }

          // Stop if we have enough listings
          if (activeListings.length >= limit) {
            break;
          }
        }
      }

      console.log(
        `Found ${activeListings.length} active listings after filtering`
      );
      setListings(activeListings);
    } catch (err) {
      console.error("Error fetching kiosk listings:", err);
      toast.error("Error fetching marketplace listings");
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setLoading(false);
    }
  }, [nftType, limit, options.kioskId]);

  // Helper function to verify if an item is still listed in a kiosk
  const verifyKioskListing = useCallback(
    async (kioskId: string, itemId: string): Promise<boolean> => {
      try {
        const kioskObject = await suiClient.getObject({
          id: kioskId,
          options: { showContent: true },
        });

        if (kioskObject.data?.content && "fields" in kioskObject.data.content) {
          const kioskFields = kioskObject.data.content.fields as any;

          // Check if the item is in the listings
          if (kioskFields.listings?.fields?.contents) {
            const listing = kioskFields.listings.fields.contents.find(
              (l: any) => l.fields.key === itemId
            );
            return !!listing;
          }
        }

        return false;
      } catch (error) {
        console.error(`Error verifying kiosk listing ${itemId}:`, error);
        return false;
      }
    },
    []
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchKioskListings();
    }
  }, [autoFetch, fetchKioskListings]);

  useEffect(() => {
    if (options.kioskId) {
      fetchKioskListings();
    }
  }, [options.kioskId]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval) {
      const intervalId = setInterval(fetchKioskListings, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, fetchKioskListings]);

  // Utility functions
  const sortByPrice = useCallback(
    (ascending: boolean = true) => {
      return [...listings].sort((a, b) =>
        ascending ? a.priceInSui - b.priceInSui : b.priceInSui - a.priceInSui
      );
    },
    [listings]
  );

  const filterByElement = useCallback(
    (element: string) => {
      return listings.filter(
        (listing) => listing.element.toLowerCase() === element.toLowerCase()
      );
    },
    [listings]
  );

  const filterByPriceRange = useCallback(
    (minSui: number, maxSui: number) => {
      return listings.filter(
        (listing) =>
          listing.priceInSui >= minSui && listing.priceInSui <= maxSui
      );
    },
    [listings]
  );

  const getUniqueElements = useCallback(() => {
    const elements = new Set(listings.map((l) => l.element));
    return Array.from(elements);
  }, [listings]);

  const getCheapestByElement = useCallback(() => {
    const elementMap = new Map<string, KioskListing>();

    listings.forEach((listing) => {
      const existing = elementMap.get(listing.element);
      if (!existing || listing.priceInSui < existing.priceInSui) {
        elementMap.set(listing.element, listing);
      }
    });

    return Array.from(elementMap.values());
  }, [listings]);

  // New function to get marketplace activity (recent purchases/delistings)
  const getMarketplaceActivity = useCallback(
    async (activityLimit: number = 20) => {
      try {
        const purchasedEventType = `0x2::kiosk::ItemPurchased<${nftType}>`;
        const delistedEventType = `0x2::kiosk::ItemDelisted<${nftType}>`;

        const [purchasedEvents, delistedEvents] = await Promise.all([
          suiClient.queryEvents({
            query: { MoveEventType: purchasedEventType },
            limit: activityLimit,
            order: "descending",
          }),
          suiClient.queryEvents({
            query: { MoveEventType: delistedEventType },
            limit: activityLimit,
            order: "descending",
          }),
        ]);

        const activity: Array<{
          type: "purchase" | "delisting";
          itemId: string;
          kioskId: string;
          price?: string;
          priceInSui?: number;
          txDigest: string;
          timestamp: number;
        }> = [];

        // Process purchased events
        purchasedEvents.data.forEach((event) => {
          if (event.parsedJson) {
            const eventData = event.parsedJson as {
              id: string;
              kiosk: string;
              price: string;
            };

            activity.push({
              type: "purchase",
              itemId: eventData.id,
              kioskId: eventData.kiosk,
              price: eventData.price,
              priceInSui: parseInt(eventData.price) / Number(MIST_PER_SUI),
              txDigest: event.id.txDigest,
              timestamp: parseInt(event.timestampMs || "0"),
            });
          }
        });

        // Process delisted events
        delistedEvents.data.forEach((event) => {
          if (event.parsedJson) {
            const eventData = event.parsedJson as {
              id: string;
              kiosk: string;
            };

            activity.push({
              type: "delisting",
              itemId: eventData.id,
              kioskId: eventData.kiosk,
              txDigest: event.id.txDigest,
              timestamp: parseInt(event.timestampMs || "0"),
            });
          }
        });

        // Sort by timestamp (most recent first)
        activity.sort((a, b) => b.timestamp - a.timestamp);

        return activity.slice(0, activityLimit);
      } catch (error) {
        console.error("Error fetching marketplace activity:", error);
        return [];
      }
    },
    [nftType]
  );

  // Get floor price for each element
  const getFloorPrices = useCallback(() => {
    const floorPrices = new Map<string, number>();

    listings.forEach((listing) => {
      const currentFloor = floorPrices.get(listing.element);
      if (!currentFloor || listing.priceInSui < currentFloor) {
        floorPrices.set(listing.element, listing.priceInSui);
      }
    });

    return Object.fromEntries(floorPrices);
  }, [listings]);

  // Get market statistics
  const getMarketStats = useCallback(() => {
    if (listings.length === 0) {
      return {
        totalListings: 0,
        uniqueElements: 0,
        averagePrice: 0,
        medianPrice: 0,
        totalVolume: 0,
      };
    }

    const prices = listings.map((l) => l.priceInSui).sort((a, b) => a - b);
    const uniqueElements = new Set(listings.map((l) => l.element)).size;
    const totalVolume = prices.reduce((sum, price) => sum + price, 0);
    const averagePrice = totalVolume / listings.length;
    const medianPrice =
      prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)];

    return {
      totalListings: listings.length,
      uniqueElements,
      averagePrice: Number(averagePrice.toFixed(2)),
      medianPrice: Number(medianPrice.toFixed(2)),
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }, [listings]);

  return {
    listings,
    loading,
    error,
    refresh: fetchKioskListings,
    sortByPrice,
    filterByElement,
    filterByPriceRange,
    getUniqueElements,
    getCheapestByElement,
    getMarketplaceActivity,
    getFloorPrices,
    getMarketStats,
  };
}
