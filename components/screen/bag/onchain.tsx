"use client";

import { useUniversalApp } from "@/app/context/UniversalAppContext";
import CreateWallet from "@/components/common/CreateWallet";
import { PasscodeAuthDialog } from "@/components/common/PasscodeAuthenticate";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { Dropdown, Filter, Search } from "@/components/icons";
import { Input } from "@/components/ui/input";
import NbaFilterSheet from "./NbaFilterSheet";
import useApi from "@/hooks/useApi";
import { useNFTList } from "@/hooks/useNFTList";
import { useUser } from "@/hooks/useUser";
import {
  SendAndExecuteTxParams,
  TxEssentials,
} from "@/lib/wallet/core/api/txn";
import { useAccount } from "@/lib/wallet/hooks/useAccount";
import { useApiClient } from "@/lib/wallet/hooks/useApiClient";
import { useNetwork } from "@/lib/wallet/hooks/useNetwork";
import { RootState } from "@/lib/wallet/store";
import { ObjectChange, OmitToken, TransactionResponse } from "@/lib/wallet/types";
import {
  CREATURE_NFT_MODULE_NAME,
  ELEMENT_NFT_MODULE_NAME,
  MER3_PACKAGE_ID,
  NBA_PACKAGE_ID,
} from "@/utils/constants";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { CreativeOnchainItem } from "./creative-onchain-item";
import { CardItem } from "./onchain-item";

type FilterType = "all" | "element" | "creature" | "nba";

export function OnchainBagScreen() {
  const { isTelegram } = useUniversalApp();
  const apiClient = useApiClient();
  const { user, refetch } = useUser();
  const appContext = useSelector((state: RootState) => state.appContext);
  const { data: network } = useNetwork(appContext.networkId);
  const { address, fetchAddressByAccountId } = useAccount(appContext.accountId);
  const authed = useSelector((state: RootState) => state.appContext.authed);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  const [showNbaFilterSheet, setShowNbaFilterSheet] = useState(false);
  const [selectedNbaTeams, setSelectedNbaTeams] = useState<string[]>([]);
  const [nbaSortBy, setNbaSortBy] = useState<"newest" | "oldest">("newest");
  const initialized = useSelector(
    (state: RootState) => state.appContext.initialized
  );
  const account = useCurrentAccount();
  const client = useSuiClient();
  const callingKiosk = useRef(false);
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

  const {
    nfts,
    loading,
    refresh: nftsRefresh,
  } = useNFTList({
    walletAddress: isTelegram ? address : account?.address,
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${MER3_PACKAGE_ID}::${ELEMENT_NFT_MODULE_NAME}::${"CreativeElementNFT"}`,
  });

  const {
    nfts: creatureNfts,
    loading: creatureNftsLoading,
    refresh: creatureNftsRefresh,
  } = useNFTList({
    walletAddress: isTelegram ? address : account?.address,
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${MER3_PACKAGE_ID}::${CREATURE_NFT_MODULE_NAME}::${"CreatureNFT"}`,
  });

  const {
    nfts: nbaNfts,
    loading: nbaNftsLoading,
    refresh: nbaNftsRefresh,
  } = useNFTList({
    walletAddress: isTelegram ? address : account?.address,
    refreshInterval: undefined,
    autoFetch: true,
    structType: `${NBA_PACKAGE_ID}::${"nba_nft"}::${"NBANft"}`,
  });

  // Calculate team counts for filter sheet
  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nbaNfts.forEach(({ data }) => {
      const teamId = data?.content?.fields?.team_id;
      if (teamId) {
        counts[teamId] = (counts[teamId] || 0) + 1;
      }
    });
    return counts;
  }, [nbaNfts]);

  useEffect(() => {
    if (isTelegram && !authed) {
      setOpenAuthDialog(true);
    }
  }, [authed, appContext.accountId, isTelegram]);

  useEffect(() => {
    if (isTelegram && !address && authed) {
      fetchAddressByAccountId(appContext.accountId);
    }
  }, [address, authed, isTelegram]);

  const createKioskApi = useApi({
    key: ["create-kiosk"],
    method: "POST",
    url: "marketplace/kiosk/create",
  }).post;

  const handleCreateKiosk = useCallback(async () => {
    if (callingKiosk.current) return;
    callingKiosk.current = true;
    try {
      if (isTelegram && !address && authed) {
        toast.error("No address found");
        return;
      }
      if (!isTelegram && !account?.address) {
        toast.error("wallet is not connected");
        return;
      }

      let tx = new Transaction();
      let [kiosk, kioskOwnerCap] = tx.moveCall({
        target: "0x2::kiosk::new",
      });

      tx.transferObjects(
        [kioskOwnerCap],
        tx.pure.address(isTelegram ? address : account?.address || "")
      );
      tx.moveCall({
        target: "0x2::transfer::public_share_object",
        arguments: [kiosk],
        typeArguments: ["0x2::kiosk::Kiosk"],
      });
      let response;
      if (isTelegram) {
        response = await apiClient.callFunc<
          SendAndExecuteTxParams<string, OmitToken<TxEssentials>>,
          undefined
        >(
          "txn",
          "signAndExecuteTransactionBlock",
          {
            transactionBlock: tx.serialize(),
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
          transaction: tx.serialize(),
        });
      }
      const txResponse = response as TransactionResponse;
      if (txResponse?.digest) {
        const createdObjects = txResponse.objectChanges?.filter(
          (change: ObjectChange) => change.type === "created"
        );

        // Find the kiosk and kiosk cap objects
        const kioskObject = createdObjects?.find(
          (obj: ObjectChange) =>
            obj.objectType === "0x2::kiosk::Kiosk"
        );

        const kioskCapObject = createdObjects?.find(
          (obj: ObjectChange) =>
            obj.objectType === "0x2::kiosk::KioskOwnerCap"
        );

        if (
          kioskObject?.objectId &&
          kioskCapObject?.objectId
        ) {
          await createKioskApi?.mutateAsync({
            objectId: kioskObject.objectId,
            ownerCapId: kioskCapObject.objectId,
          });
          await refetch();

          toast.success("Kiosk created successfully!");
        }
      }
    } catch (error: unknown) {
      console.error("Error creating kiosk:", error);
      const errorMessage = error instanceof Error ? error.message : "Error creating kiosk";
      if (errorMessage === "Authentication required") {
        setOpenAuthDialog(true);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      callingKiosk.current = false;
    }
  }, [address, authed, isTelegram, account?.address]);

  useEffect(() => {
    if (
      user &&
      !user.kiosk &&
      ((authed && address) || (!isTelegram && account?.address))
    ) {
      handleCreateKiosk();
    }
  }, [user, authed, address, isTelegram, account?.address]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {!initialized && isTelegram ? (
        <CreateWallet />
      ) : user && !user.kiosk ? (
        <div className="flex flex-col gap-4 w-full h-full">
          <div className="text-white text-2xl font-bold">
            Creating your kiosk...
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full h-full">
          {/* Filter Row */}
          <div className="flex gap-2 items-center w-full">
            {/* Dropdown Filter */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="w-full bg-[#1f1f1f] rounded-2xl px-3 py-2 flex items-center justify-between"
              >
                <span className="text-white text-sm font-bold font-['Sora']">
                  {filterType === "all" ? "All" : filterType === "element" ? "Elements" : filterType === "creature" ? "Creatures" : "NBA"}
                </span>
                <Dropdown size={24} color="white" />
              </button>
              {showFilterDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f1f1f] rounded-2xl overflow-hidden z-10 border border-[#333333]">
                  {(["all", "element", "creature", "nba"] as FilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm font-['Sora'] ${
                        filterType === type ? "bg-[#333333] text-white" : "text-[#858585] hover:bg-[#292929]"
                      }`}
                    >
                      {type === "all" ? "All" : type === "element" ? "Elements" : type === "creature" ? "Creatures" : "NBA"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filter Icon Button */}
            <button
              onClick={() => setShowNbaFilterSheet(true)}
              className="w-10 h-10 bg-[#141414] border border-[#333333] rounded-full flex items-center justify-center shrink-0"
            >
              <Filter size={24} color="white" />
            </button>

            {/* Search Icon Button / Search Input */}
            {showSearch ? (
              <div className="flex-1 h-10 bg-[#141414] border border-[#333333] rounded-full flex items-center px-3 gap-2">
                <Search size={24} color="white" />
                <Input
                  className="flex-1 h-full text-white text-sm font-normal bg-transparent border-none focus:outline-none focus:ring-0"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setShowSearch(false);
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-10 h-10 bg-[#141414] border border-[#333333] rounded-full flex items-center justify-center shrink-0"
              >
                <Search size={24} color="white" />
              </button>
            )}
          </div>

          {/* NFT Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Element NFTs */}
            {(filterType === "all" || filterType === "element") && (
              <>
                {loading ? (
                  <SkeletonCard />
                ) : (
                  nfts
                    .map((nft) => {
                      const display = nft?.data?.display?.data;
                      return {
                        id: nft!.data.objectId,
                        name: display?.name || "Element NFT",
                        amount: display?.amount || 0,
                        itemId: Number(display?.item_id),
                        imageUrl: display?.image_url,
                      };
                    })
                    .filter((card) =>
                      searchQuery
                        ? card.name.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .map((card) => (
                      <CardItem
                        key={card.id}
                        element={card.name}
                        amount={card.amount}
                        itemId={card.itemId}
                        imageUrl={card.imageUrl}
                        id={card.id}
                        onListingComplete={nftsRefresh}
                      />
                    ))
                )}
              </>
            )}

            {/* Creature NFTs */}
            {(filterType === "all" || filterType === "creature") && (
              <>
                {creatureNftsLoading ? (
                  <SkeletonCard />
                ) : (
                  creatureNfts
                    .map(({ data }) => {
                      const metadata = data?.content?.fields.metadata;
                      return {
                        id: data!.objectId,
                        name: metadata?.fields?.name || "Creature NFT",
                        imageUrl: metadata?.fields?.image_uri || "",
                        prompt: metadata?.fields?.prompt || "",
                      };
                    })
                    .filter((card) =>
                      searchQuery
                        ? card.name.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .map((card) => (
                      <CreativeOnchainItem
                        key={card.id}
                        id={card.id}
                        name={card.name}
                        imageUrl={card.imageUrl}
                        prompt={card.prompt}
                        onListingComplete={creatureNftsRefresh}
                      />
                    ))
                )}
              </>
            )}

            {/* NBA NFTs */}
            {(filterType === "all" || filterType === "nba") && (
              <>
                {nbaNftsLoading ? (
                  <SkeletonCard />
                ) : (
                  nbaNfts
                    .map(({ data }) => {
                      const metadata = data?.content?.fields;
                      return {
                        id: data!.objectId,
                        name: metadata?.team_name || "NBA NFT",
                        teamId: metadata?.team_id || "",
                        imageUrl: metadata?.url || "",
                        prompt: "",
                      };
                    })
                    .filter((card) =>
                      searchQuery
                        ? card.name.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                    )
                    .filter((card) =>
                      selectedNbaTeams.length > 0
                        ? selectedNbaTeams.includes(card.teamId)
                        : true
                    )
                    .sort((a, b) => {
                      // Sort by objectId as proxy for mint order (newer IDs are lexicographically greater)
                      if (nbaSortBy === "newest") {
                        return b.id.localeCompare(a.id);
                      }
                      return a.id.localeCompare(b.id);
                    })
                    .map((card) => (
                      <CreativeOnchainItem
                        key={card.id}
                        id={card.id}
                        name={card.name}
                        imageUrl={card.imageUrl}
                        prompt={card.prompt}
                        onListingComplete={nbaNftsRefresh}
                      />
                    ))
                )}
              </>
            )}
          </div>
        </div>
      )}
      {isTelegram && (
        <PasscodeAuthDialog
          open={openAuthDialog}
          setOpen={(open) => setOpenAuthDialog(open)}
          onSuccess={async () => {
            await nftsRefresh();
            await creatureNftsRefresh();
          }}
        />
      )}
      <NbaFilterSheet
        open={showNbaFilterSheet}
        onOpenChange={setShowNbaFilterSheet}
        selectedTeams={selectedNbaTeams}
        onSelectedTeamsChange={setSelectedNbaTeams}
        sortBy={nbaSortBy}
        onSortByChange={setNbaSortBy}
        teamCounts={teamCounts}
        onApply={() => {
          // Filter will be applied through the state
        }}
        onClearAll={() => {
          setSelectedNbaTeams([]);
          setNbaSortBy("newest");
        }}
      />
    </div>
  );
}
