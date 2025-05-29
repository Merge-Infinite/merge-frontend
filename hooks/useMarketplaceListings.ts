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
  listedAt?: Date;
  eventId?: string;
}

interface UseKioskListingsOptions {
  nftType: string;
  refreshInterval?: number;
  autoFetch?: boolean;
  limit?: number;
}

export function useKioskListings(options: UseKioskListingsOptions) {
  const [listings, setListings] = useState<KioskListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { nftType, refreshInterval, autoFetch = true, limit = 50 } = options;

  // Method 1: Fetch via Events (Most Reliable)
  const fetchListingsViaEvents = useCallback(async () => {
    if (!nftType) {
      setError(new Error("NFT type is required"));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query ItemListed events
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: "0x2::kiosk::ItemListed",
        },
        limit: limit * 2, // Get more events to account for sold items
        order: "descending",
      });

      const activeListings: KioskListing[] = [];
      const processedItems = new Set<string>();

      for (const event of events.data) {
        if (event.parsedJson && !processedItems.has(event.parsedJson.item_id)) {
          const eventData = event.parsedJson as any;

          // Check if this event is for our NFT type
          if (eventData.item_type === nftType) {
            try {
              // Verify the item is still listed by checking its current state
              const nftObject = await suiClient.getObject({
                id: eventData.item_id,
                options: {
                  showContent: true,
                  showOwner: true,
                  showDisplay: true,
                },
              });

              // Only include if still owned by a kiosk (not sold)
              if (
                nftObject.data?.owner &&
                "ObjectOwner" in nftObject.data.owner
              ) {
                const kioskId = nftObject.data.owner.ObjectOwner;

                // Double-check it's still listed in the kiosk
                const isStillListed = await verifyKioskListing(
                  kioskId,
                  eventData.item_id
                );

                if (isStillListed) {
                  const content = nftObject.data.content as any;
                  const display = nftObject.data.display?.data;

                  activeListings.push({
                    objectId: eventData.item_id,
                    kioskId,
                    price: eventData.price || isStillListed.price,
                    priceInSui:
                      parseInt(eventData.price || isStillListed.price) /
                      Number(MIST_PER_SUI),
                    element: content?.fields?.element || "Unknown",
                    amount: content?.fields?.amount?.toString() || "1",
                    imageUrl:
                      content?.fields?.image_url || display?.image_url || "",
                    listedAt: new Date(parseInt(event.timestampMs)),
                    eventId: event.id.eventSeq,
                  });

                  processedItems.add(eventData.item_id);
                }
              }
            } catch (objError) {
              console.error(
                `Error processing listing ${eventData.item_id}:`,
                objError
              );
            }
          }
        }

        // Stop if we have enough listings
        if (activeListings.length >= limit) break;
      }

      setListings(activeListings);
    } catch (err) {
      console.error("Error fetching kiosk listings via events:", err);
      toast.error("Error fetching marketplace listings");
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setLoading(false);
    }
  }, [nftType, limit]);

  // Helper function to verify if an item is still listed in a kiosk
  const verifyKioskListing = useCallback(
    async (
      kioskId: string,
      itemId: string
    ): Promise<{ price: string } | null> => {
      try {
        const kioskObject = await suiClient.getObject({
          id: kioskId,
          options: { showContent: true },
        });

        if (kioskObject.data?.content && "fields" in kioskObject.data.content) {
          const kioskFields = kioskObject.data.content.fields as any;

          if (kioskFields.listings?.fields?.contents) {
            const listing = kioskFields.listings.fields.contents.find(
              (l: any) => l.fields.key === itemId
            );

            return listing ? { price: listing.fields.value } : null;
          }
        }

        return null;
      } catch (error) {
        console.error(`Error verifying kiosk listing ${itemId}:`, error);
        return null;
      }
    },
    []
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchListingsViaEvents();
    }
  }, [autoFetch, fetchListingsViaEvents]);

  // Set up auto-refresh
  useEffect(() => {
    if (refreshInterval) {
      const intervalId = setInterval(fetchListingsViaEvents, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, fetchListingsViaEvents]);

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

  return {
    listings,
    loading,
    error,
    refresh: fetchListingsViaEvents,
    sortByPrice,
    filterByElement,
    filterByPriceRange,
  };
}
