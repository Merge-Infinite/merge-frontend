"use client";

import {
  ArrowDirect,
  ArrowLeft,
  Clock,
  Dropdown,
  Lucky,
  SuiLogo,
} from "@/components/icons";
import LuckyRateSheet from "@/components/screen/nba-game/LuckyRateSheet";
import MintConfirmationSheet from "@/components/screen/nba-game/MintConfirmationSheet";
import SeasonMatchesSheet from "@/components/screen/nba-game/SeasonMatchesSheet";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NBA_TEAMS_BY_TIER } from "@/data/nba-teams";
import { useNbaPool } from "@/hooks/useNbaPool";
import nbaApi from "@/lib/api/nba";
import { RootState } from "@/lib/wallet/store";
import { NBA_MINT_FEE, NBA_REWARD_POOL_ID } from "@/utils/constants";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useUniversalApp } from "../context/UniversalAppContext";

// Tier data
const tiers = [
  {
    id: 1,
    name: "Tier 1",
    color: "from-red-900 via-red-600 to-red-900",
    gemColor: "bg-red-600",
    border: "border-red-500",
    image: "/images/tiers/tier-icons/tier-1.png",
    bgEllipse1: "/images/tiers/tier-1-ellipse1.svg",
    bgEllipse2: "/images/tiers/tier-1-ellipse2.svg",
  },
  {
    id: 2,
    name: "Tier 2",
    color: "from-orange-900 via-orange-600 to-orange-900",
    gemColor: "bg-orange-600",
    border: "border-orange-500",
    image: "/images/tiers/tier-icons/tier-2.png",
    bgEllipse1: "/images/tiers/tier-2-ellipse1.svg",
    bgEllipse2: "/images/tiers/tier-2-ellipse2.svg",
  },
  {
    id: 3,
    name: "Tier 3",
    color: "from-yellow-900 via-yellow-500 to-yellow-900",
    gemColor: "bg-yellow-600",
    border: "border-yellow-500",
    image: "/images/tiers/tier-icons/tier-3.png",
    bgEllipse1: "/images/tiers/tier-3-ellipse1.svg",
    bgEllipse2: "/images/tiers/tier-3-ellipse2.svg",
  },
  {
    id: 4,
    name: "Tier 4",
    color: "from-blue-900 via-blue-600 to-blue-900",
    gemColor: "bg-blue-600",
    border: "border-blue-500",
    image: "/images/tiers/tier-icons/tier-4.png",
    bgEllipse1: "/images/tiers/tier-4-ellipse1.svg",
    bgEllipse2: "/images/tiers/tier-4-ellipse2.svg",
  },
  {
    id: 5,
    name: "Tier 5",
    color: "from-green-900 via-green-600 to-green-900",
    gemColor: "bg-green-600",
    border: "border-green-500",
    image: "/images/tiers/tier-icons/tier-5.png",
    bgEllipse1: "/images/tiers/tier-5-ellipse1.svg",
    bgEllipse2: "/images/tiers/tier-5-ellipse2.svg",
  },
  {
    id: 6,
    name: "Tier 6",
    color: "from-gray-800 via-gray-600 to-gray-800",
    gemColor: "bg-gray-600",
    border: "border-gray-500",
    image: "/images/tiers/tier-icons/tier-6.png",
    bgEllipse1: "/images/tiers/tier-6-ellipse1.svg",
    bgEllipse2: "/images/tiers/tier-6-ellipse2.svg",
  },
];

export default function NbaGame() {
  const router = useRouter();
  const { backButton, isTelegram, isReady } = useUniversalApp();
  const [matchesSheetOpen, setMatchesSheetOpen] = useState(false);
  const [luckyRateSheetOpen, setLuckyRateSheetOpen] = useState(false);
  const [mintConfirmationOpen, setMintConfirmationOpen] = useState(false);
  const [tierApi, setTierApi] = useState<CarouselApi>();
  const [currentTier, setCurrentTier] = useState(0);

  // Fetch user's owned NFTs to get ownership counts
  const { data: userNfts } = nbaApi.getUserNfts.useQuery();

  // Fetch user's tier statistics
  const { data: tiersUser } = nbaApi.getTiersUser.useQuery();

  // Get SUI price from Redux store
  const suiPrice = useSelector((state: RootState) => state.appContext.suiPrice);

  // Fetch pool data from blockchain
  const { poolData, isLoading: isLoadingPool } = useNbaPool({
    refreshInterval: 30000,
    suiPrice: suiPrice || undefined,
  });

  // Open pool contract in Sui Vision Explorer
  const openPoolInExplorer = () => {
    window.open(
      `https://suivision.xyz/object/${NBA_REWARD_POOL_ID}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  useEffect(() => {
    if (isReady) {
      if (isTelegram && backButton) {
        backButton.show();
        backButton.on("click", () => {
          router.back();
        });
      }
    }
  }, [isReady, isTelegram, backButton]);

  useEffect(() => {
    if (!tierApi) {
      return;
    }

    setCurrentTier(tierApi.selectedScrollSnap());

    tierApi.on("select", () => {
      setCurrentTier(tierApi.selectedScrollSnap());
    });
  }, [tierApi]);

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-y-auto">
      {/* Top Navigation */}
      <div className="flex items-center h-14 px-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center"
        >
          <ArrowLeft size={24} color="white" />
        </button>
      </div>

      {/* Nav 2 - Season & Tabs */}
      <div className="flex flex-col gap-3 px-4 pb-2 shrink-0">
        {/* Season Selector & Date */}
        <div className="flex gap-2 items-center w-full rounded-2xl">
          <button
            onClick={() => setMatchesSheetOpen(true)}
            className="flex gap-1 items-center flex-1"
          >
            <p className="text-sm font-bold font-['Sora'] text-white">
              Regular Season
            </p>
            <Dropdown size={24} color="white" />
          </button>
          <div className="flex gap-1 items-center justify-center px-2 py-0.5 rounded-md bg-[rgba(255,196,0,0.08)]">
            <Clock size={20} color="#DBA301" />
            <p className="text-sm font-normal font-['Sora'] text-[#DBA301]">
              08:00, 23 Oct 2025
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="w-full h-auto bg-[#141414] p-1 gap-2 rounded-lg">
            <TabsTrigger
              value="game"
              className="flex-1 px-1 py-1.5 rounded-md data-[state=active]:bg-[#292929] data-[state=active]:text-white text-[#858585] font-['Sora'] font-semibold text-sm uppercase tracking-wider"
            >
              Game
            </TabsTrigger>
            <TabsTrigger
              value="tiers"
              className="flex-1 px-1 py-1.5 rounded-md data-[state=active]:bg-[#292929] data-[state=active]:text-white text-[#858585] font-['Sora'] font-semibold text-sm uppercase tracking-wider"
            >
              Tiers
            </TabsTrigger>
            <TabsTrigger
              value="howtoplay"
              className="px-2 py-1.5 rounded-md data-[state=active]:bg-[#292929] data-[state=active]:text-white text-[#858585] font-['Sora'] font-semibold text-sm uppercase tracking-wider"
            >
              How to play
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="game" className="mt-0 overflow-y-hidden">
            <div className="flex flex-col gap-4 overflow-y-auto px-4 pt-3 pb-6">
              {/* Dashboard Cards */}
              <div className="flex flex-col gap-4 w-full">
                {/* Stats Card */}
                <Card className="bg-black border border-[#292929] rounded-2xl p-2">
                  <div className="flex flex-col gap-2">
                    {/* Total Reward */}
                    <button
                      onClick={openPoolInExplorer}
                      className="bg-[#141414] flex flex-col gap-3 pl-3 pr-4 py-4 rounded-xl w-full text-left hover:bg-[#1a1a1a] transition-colors"
                    >
                      <div className="flex gap-1 items-center">
                        <div className="flex items-center justify-center w-10 h-10 shrink-0">
                          <SuiLogo size={24} color="#4CA3FF" />
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1">
                          <div className="flex gap-1 items-center">
                            <p className="text-xs font-normal font-['Sora'] text-white underline">
                              Total reward
                            </p>
                            <ArrowDirect size={18} color="white" />
                          </div>
                          <div className="flex gap-2 items-center uppercase">
                            {isLoadingPool ? (
                              <p className="text-xl font-bold font-['Sora'] text-[#858585] flex-1">
                                Loading...
                              </p>
                            ) : (
                              <>
                                <p className="text-xl font-bold font-['Sora'] text-[#4CA3FF] flex-1">
                                  {poolData?.totalRewardSui?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0"} SUI
                                </p>
                                <p className="text-base font-semibold font-['Sora'] text-[#858585]">
                                  ~ ${poolData?.totalRewardUsd?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "0"}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* NFT Stats */}
                    <div className="bg-[#141414] flex gap-2 p-4 rounded-xl">
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="text-xs font-normal font-['Sora'] text-white">
                          Total NFT minted
                        </p>
                        <p className="text-xl font-bold font-['Sora'] text-[#53CCA7] uppercase">
                          {tiersUser?.overall?.totalMinted?.toLocaleString() ?? "0"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <p className="text-xs font-normal font-['Sora'] text-white">
                          Your own
                        </p>
                        <p className="text-xl font-bold font-['Sora'] text-[#53CCA7] uppercase">
                          {tiersUser?.userNFTs?.totalOwned?.toLocaleString() ?? "0"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Mint NFT Card */}
                <Card className="bg-[#141414] border-0 rounded-2xl p-4">
                  <div className="flex flex-col gap-4">
                    {/* NFT Preview & Description */}
                    <div className="flex gap-4 items-center">
                      <Image
                        src="/images/nba_placeholder.svg"
                        alt="Lakers"
                        width={161}
                        height={161}
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <p className="text-base font-bold font-['Sora'] text-white">
                          Mint Your NFT
                        </p>
                        <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                          Mint Your NFT Get a random NBA Team NFT with unique
                          rarity tiers.
                        </p>
                      </div>
                    </div>

                    {/* Mint Button Section */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => setLuckyRateSheetOpen(true)}
                        className="flex gap-2 items-center px-2"
                      >
                        <p className="text-sm font-normal font-['Sora'] text-white underline underline-offset-2 decoration-wavy flex-1 text-left">
                          Lucky rate
                        </p>
                      </button>
                      <div className="flex items-center">
                        {/* Lucky Rate Badge */}
                        <button className="flex gap-1 items-center justify-center px-2 py-2 rounded-l-full bg-gradient-to-r from-purple-600 to-pink-600 z-10 min-w-[120px]">
                          <Lucky size={20} color="white" />
                          <p className="text-sm font-bold font-['Sora'] text-white">
                            +64%
                          </p>
                        </button>
                        {/* Mint Button */}
                        <button
                          onClick={() => setMintConfirmationOpen(true)}
                          className="flex gap-2 items-center justify-center px-4 py-2 rounded-r-full bg-white flex-1 ml-[-8px]"
                        >
                          <p className="text-sm font-normal font-['Sora'] text-black uppercase">
                            Mint With {NBA_MINT_FEE} SUI
                          </p>
                          <SuiLogo size={22} color="#000000" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Sponsored Section */}
                <div className="flex flex-col gap-2 items-center py-5 rounded-2xl">
                  <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                    sponsored by
                  </p>
                  <div className="flex gap-3 items-center w-full justify-center">
                    <Image
                      src="/images/tiers/partner-logos/Metapool.svg"
                      alt="Meta Pool"
                      width={100}
                      height={100}
                    />
                    <Image
                      src="/images/tiers/partner-logos/HIBT.svg"
                      alt="HIBT"
                      width={100}
                      height={100}
                    />
                    <Image
                      src="/images/tiers/partner-logos/SWEAT.svg"
                      alt="SWEAT"
                      width={100}
                      height={100}
                    />
                    <Image
                      src="/images/tiers/partner-logos/Flowx.svg"
                      alt="SWEAT"
                      width={100}
                      height={100}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tiers" className="mt-0">
            <div className="flex flex-col gap-4 pt-3 pb-8">
              {/* Tier Carousel */}
              <div className="px-4">
                <Carousel setApi={setTierApi} opts={{ loop: true }}>
                  <CarouselContent>
                    {tiers.map((tier) => (
                      <CarouselItem key={tier.id}>
                        <div className="relative h-[148px] rounded-2xl bg-[#141414] overflow-hidden flex items-center justify-center px-4 py-8">
                          {/* Background Ellipse 1 - Large gradient */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[514px] h-[299px]">
                            <Image
                              src={tier.bgEllipse1}
                              alt=""
                              width={514}
                              height={299}
                              className="w-full h-full"
                            />
                          </div>

                          {/* Background Ellipse 2 - Top gradient */}
                          <div className="absolute left-1/2 top-[-49px] -translate-x-1/2 w-[120px] h-[111px]">
                            <Image
                              src={tier.bgEllipse2}
                              alt=""
                              width={120}
                              height={111}
                              className="w-full h-full"
                            />
                          </div>

                          {/* Backdrop blur layer */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[302px] backdrop-blur-[30px] bg-white/[0.01]" />

                          {/* Large background tier badge at 10% opacity */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] h-[310px] opacity-10 rounded-xl">
                            <Image
                              src={tier.image}
                              alt=""
                              width={310}
                              height={310}
                              className="w-full h-full rounded-xl"
                            />
                          </div>

                          {/* Vector overlay with screen blend */}
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mix-blend-screen">
                            <div className="rotate-[354.432deg]">
                              <Image
                                src="/images/tiers/tier-vector.svg"
                                alt=""
                                width={336}
                                height={266}
                                className="w-[336px] h-[266px]"
                              />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            {/* Gem Icon */}
                            <div className="w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
                              <Image
                                src={tier.image}
                                alt={tier.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl"
                              />
                            </div>
                            {/* Tier Name */}
                            <p className="text-xl font-bold font-['Sora'] text-white uppercase tracking-[0.8px]">
                              {tier.name}
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 px-4">
                {tiers.map((tier, index) => (
                  <button
                    key={tier.id}
                    onClick={() => tierApi?.scrollTo(index)}
                    className="flex items-center justify-center"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${
                        currentTier === index
                          ? `${tier.border} border-2 scale-110`
                          : "opacity-40"
                      } transition-all duration-200`}
                    >
                      <Image
                        src={tier.image}
                        alt={tier.name}
                        width={36}
                        height={36}
                        className="w-9 h-9"
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Team List */}
              <div className="flex flex-col gap-3 px-4">
                {(() => {
                  // Get static teams for current tier
                  const staticTierData = NBA_TEAMS_BY_TIER.find((t) => t.tier === currentTier + 1);
                  const staticTeams = staticTierData?.teams ?? [];

                  // Flatten all user's teams from all tiers to search by name
                  const allUserTeams = userNfts?.byTier?.flatMap((t) => t.teams) ?? [];

                  // Merge static team data with user ownership counts (match by team name across all tiers)
                  const teamsWithOwnership = staticTeams.map((team) => {
                    const userTeam = allUserTeams.find(
                      (ut) => ut.name.toLowerCase() === team.name.toLowerCase()
                    );
                    return {
                      ...team,
                      totalMinted: userTeam?.totalMinted ?? 0,
                      count: userTeam?.count ?? 0,
                      logoUrl: userTeam?.logoUrl ?? null,
                    };
                  });

                  return teamsWithOwnership.map((team) => {
                    return (
                      <div
                        key={team.teamId}
                        className="bg-[rgba(136,136,136,0.08)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 flex flex-col gap-3"
                        style={{ minHeight: "116px" }}
                      >
                        {/* Top Row: Logo + Team Name */}
                        <div className="flex items-center gap-3">
                          {/* Team Logo */}
                          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                            {team.logoUrl || team.logo ? (
                              <Image
                                src={team.logoUrl || `/images/tiers/team-logos/${team.logo}`}
                                alt={team.name}
                                width={44}
                                height={44}
                                className="w-11 h-11 object-contain"
                              />
                            ) : (
                              <span className="text-2xl">🏀</span>
                            )}
                          </div>
                          {/* Team Name */}
                          <p className="text-base font-bold font-['Sora'] text-white flex-1">
                            {team.name}
                          </p>
                        </div>

                        {/* Bottom Row: Stats */}
                        <div className="flex items-center justify-between">
                          {/* Rarity */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                              Rarity
                            </p>
                            <p className="text-sm font-semibold font-['Sora'] text-white">
                              {team.rarity}%
                            </p>
                          </div>

                          {/* Minted */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                              Minted
                            </p>
                            <p className="text-sm font-semibold font-['Sora'] text-white">
                              {team.totalMinted}/{team.supplyLimit}
                            </p>
                          </div>

                          {/* You own */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-xs font-normal font-['Sora'] text-[#858585]">
                              You own
                            </p>
                            <p className="text-sm font-semibold font-['Sora'] text-[#00DBB6]">
                              {team.count}
                            </p>
                          </div>

                          {/* Question Mark Icon */}
                          <button className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                            <span className="text-[#858585] text-base font-semibold">?</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="howtoplay" className="mt-0">
            <div className="flex flex-col gap-6 px-4 pt-4 pb-8">
              {/* 1. Get Ready */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  1. Get Ready
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>
                    Make sure your wallet has enough{" "}
                    <span className="text-[#68ffd1]">SUI</span> (5 SUI to mint +
                    a small gas fee).
                  </li>
                  <li>
                    Check your Lucky Rate — it directly affects your chance to
                    mint a rare NFT.
                  </li>
                </ul>
              </div>

              {/* 2. Understand Mint Rate & Rarity */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  2. Understand Mint Rate & Rarity
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>
                    The collection includes 6 tiers (Tier 1 → Tier 6)
                    representing rarity and reward potential.
                  </li>
                  <li>
                    A higher Lucky Rate increases your chance of minting
                    higher-tier NFTs.
                    <br />
                    <span className="text-[#68ffd1] underline decoration-wavy">
                      View Rarity & Tiers
                    </span>
                  </li>
                </ul>
              </div>

              {/* 3. Mint Your NBA Team NFT */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  3. Mint Your NBA Team NFT
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>
                    Tap <span className="text-white">"Mint with 5 SUI"</span> to
                    start.
                  </li>
                  <li>
                    The system will:
                    <br />- Deduct 5 SUI + a small gas fee.
                    <br />- Apply your Lucky Rate to determine the NFT tier.
                    <br />- Randomly assign your NFT to one of 30 NBA teams.
                  </li>
                </ul>
              </div>

              {/* 4. After Minting */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  4. After Minting
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>Your new NFT will appear in "My Bag."</li>
                  <li>
                    You can hold it or trade it anytime on the Marketplace.
                  </li>
                </ul>
              </div>

              {/* 5. Season End & Reward Distribution */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  5. Season End & Reward Distribution
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>
                    When the NBA season ends, the Reward Pool (80% of total mint
                    fees) will be unlocked.
                  </li>
                  <li>
                    Rewards are distributed based on actual team rankings:
                  </li>
                </ul>

                {/* Reward Table */}
                <div className="border border-[#292929] rounded-2xl overflow-hidden mt-2">
                  {/* Header */}
                  <div className="flex items-center h-9 border-b border-[#292929]">
                    <div className="flex-1 px-2 py-1">
                      <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                        Rank
                      </p>
                    </div>
                    <div className="flex-1 px-2 py-1">
                      <p className="text-sm font-normal font-['Sora'] text-[#858585]">
                        Reward share
                      </p>
                    </div>
                  </div>
                  {/* Rows */}
                  {[
                    { rank: "#1", share: "40%" },
                    { rank: "#2", share: "25%" },
                    { rank: "#3", share: "15%" },
                    { rank: "#4", share: "10%" },
                    { rank: "#5", share: "5%" },
                    { rank: "#6", share: "3%" },
                    { rank: "#7", share: "2%" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center h-8 ${
                        index !== 6 ? "border-b border-[#292929]" : ""
                      }`}
                    >
                      <div className="flex-1 px-2 py-1">
                        <p className="text-xs font-normal font-['Sora'] text-white">
                          {item.rank}
                        </p>
                      </div>
                      <div className="flex-1 px-2 py-1">
                        <p className="text-xs font-normal font-['Sora'] text-white">
                          {item.share}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. How the Ranking Works */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  6. How the Ranking Works
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>
                    Team rankings are based on their{" "}
                    <span className="text-white">real-world NBA standings</span>{" "}
                    at the end of the season.
                  </li>
                  <li>
                    The <span className="text-[#68ffd1]">#1 ranked team</span>{" "}
                    gets the highest share (40%), decreasing down to{" "}
                    <span className="text-[#68ffd1]">#7</span> with 2%.
                  </li>
                  <li>
                    NFTs for teams that don&apos;t rank in the top 7 won&apos;t receive
                    rewards from the main pool but retain collectible value.
                  </li>
                </ul>

                {/* Example Calculation */}
                <div className="text-sm font-normal font-['Sora'] text-[#adadad] mt-2 space-y-1">
                  <p>💡 Example: How rewards are calculated</p>
                  <p>
                    Let&apos;s say the total reward pool is
                    <span className="text-[#68ffd1]"> 500,000 SUI.</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      The Oklahoma City Thunder finished
                      <span className="text-[#68ffd1]"> 3rd place</span>, which
                      means their team receives 15% of the pool = 75,000 SUI.
                    </li>
                    <li>
                      However, only
                      <span className="text-[#68ffd1]"> 25</span> out of 100
                      NFTs for this team have been minted.
                    </li>
                  </ul>
                  <p className="text-white pt-2">
                    👉 This means the entire 75,000 SUI reward will be shared
                    only among those 25 NFTs.
                  </p>
                  <p className="pt-2">
                    Each NFT would then be worth
                    <span className="text-white">:</span>
                  </p>
                  <p>
                    <span className="text-white">
                      75,000 ÷ 25 = 3,000 SUI per NFT
                    </span>
                  </p>
                  <p>
                    So, if you minted one Thunder NFT for 5 SUI, its estimated
                    value is 3,000 SUI, giving you a massive potential return if
                    the team ranks high in the final standings.
                  </p>
                </div>
              </div>

              {/* 7. Redeem Your Reward */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  7. Redeem Your Reward
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>Once rewards are available, go to &quot;Claim Reward.&quot;</li>
                  <li>
                    The system will show your{" "}
                    <span className="text-[#68ffd1]">SUI</span> reward based on
                    the NFTs you hold.
                  </li>
                  <li>
                    Tap <span className="text-white">&quot;Claim&quot;</span> to send it
                    directly to your wallet.
                  </li>
                  <li>
                    Your NFT remains yours — keep it for the next season or as a
                    collectible.
                  </li>
                </ul>
              </div>

              {/* 8. Pro Tips */}
              <div className="flex flex-col gap-2">
                <p className="text-base font-semibold font-['Sora'] text-white uppercase tracking-wider">
                  8. Pro Tips
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm font-normal font-['Sora'] text-[#adadad]">
                  <li>
                    <span className="font-bold text-white">Mint early:</span>{" "}
                    fewer NFTs = higher reward share.
                  </li>
                  <li>
                    <span className="font-bold text-white">
                      Diversify teams:
                    </span>{" "}
                    mint or buy multiple teams to boost your win chances.
                  </li>
                  <li>
                    <span className="font-bold text-white">Stay secure:</span>{" "}
                    all NFTs and rewards are linked to your wallet — keep it
                    safe.
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Season Matches Sheet */}
      <SeasonMatchesSheet
        open={matchesSheetOpen}
        onOpenChange={setMatchesSheetOpen}
      />

      {/* Lucky Rate Sheet */}
      <LuckyRateSheet
        open={luckyRateSheetOpen}
        onOpenChange={setLuckyRateSheetOpen}
      />

      {/* Mint Confirmation Sheet */}
      <MintConfirmationSheet
        open={mintConfirmationOpen}
        onOpenChange={setMintConfirmationOpen}
      />
    </div>
  );
}
