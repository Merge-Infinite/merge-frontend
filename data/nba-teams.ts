// Static NBA team data organized by tier
// Tier 1: Rarest (top contenders), Tier 6: Most common

export interface NbaTeam {
  teamId: string;
  name: string;
  logo: string;
  rarity: number;
  supplyLimit: number;
}

export interface TierData {
  tier: number;
  teams: NbaTeam[];
}

// All 30 NBA teams organized by tier
export const NBA_TEAMS_BY_TIER: TierData[] = [
  {
    tier: 1,
    teams: [
      { teamId: "BOS", name: "Boston Celtics", logo: "logo.svg", rarity: 0.5, supplyLimit: 50 },
      { teamId: "OKC", name: "Oklahoma City Thunder", logo: "oklahoma-city-thunder-logo.svg", rarity: 0.5, supplyLimit: 50 },
      { teamId: "DEN", name: "Denver Nuggets", logo: "denver-nuggets-logo.svg", rarity: 0.5, supplyLimit: 50 },
      { teamId: "MIL", name: "Milwaukee Bucks", logo: "milwaukee-bucks-logo.svg", rarity: 0.5, supplyLimit: 50 },
      { teamId: "CLE", name: "Cleveland Cavaliers", logo: "caval-lliers.svg", rarity: 0.5, supplyLimit: 50 },
    ],
  },
  {
    tier: 2,
    teams: [
      { teamId: "PHX", name: "Phoenix Suns", logo: "phoenix-suns-logo.svg", rarity: 1.0, supplyLimit: 100 },
      { teamId: "MIN", name: "Minnesota Timberwolves", logo: "minnesota-timberwolves-logo.svg", rarity: 1.0, supplyLimit: 100 },
      { teamId: "DAL", name: "Dallas Mavericks", logo: "dallas-mavericks-logo.svg", rarity: 1.0, supplyLimit: 100 },
      { teamId: "LAC", name: "LA Clippers", logo: "la-clippers-logo.svg", rarity: 1.0, supplyLimit: 100 },
      { teamId: "MIA", name: "Miami Heat", logo: "miami-heat-logo.svg", rarity: 1.0, supplyLimit: 100 },
    ],
  },
  {
    tier: 3,
    teams: [
      { teamId: "NYK", name: "New York Knicks", logo: "knicks.svg", rarity: 2.0, supplyLimit: 200 },
      { teamId: "IND", name: "Indiana Pacers", logo: "indiana-pacers.svg", rarity: 2.0, supplyLimit: 200 },
      { teamId: "LAL", name: "Los Angeles Lakers", logo: "los-angeles-lakers-logo.svg", rarity: 2.0, supplyLimit: 200 },
      { teamId: "NOP", name: "New Orleans Pelicans", logo: "new-orleans-pelicans-logo.svg", rarity: 2.0, supplyLimit: 200 },
      { teamId: "SAC", name: "Sacramento Kings", logo: "sacramento-kings-logo.svg", rarity: 2.0, supplyLimit: 200 },
    ],
  },
  {
    tier: 4,
    teams: [
      { teamId: "PHI", name: "Philadelphia 76ers", logo: "76ers.svg", rarity: 3.5, supplyLimit: 350 },
      { teamId: "GSW", name: "Golden State Warriors", logo: "golden-state-warriors-logo.svg", rarity: 3.5, supplyLimit: 350 },
      { teamId: "ORL", name: "Orlando Magic", logo: "orlando-magic-logo.svg", rarity: 3.5, supplyLimit: 350 },
      { teamId: "CHI", name: "Chicago Bulls", logo: "chicago-bulls.svg", rarity: 3.5, supplyLimit: 350 },
      { teamId: "ATL", name: "Atlanta Hawks", logo: "atlanta-hawks-logo.svg", rarity: 3.5, supplyLimit: 350 },
    ],
  },
  {
    tier: 5,
    teams: [
      { teamId: "HOU", name: "Houston Rockets", logo: "houston-rockets-logo.svg", rarity: 5.0, supplyLimit: 500 },
      { teamId: "BKN", name: "Brooklyn Nets", logo: "nets.svg", rarity: 5.0, supplyLimit: 500 },
      { teamId: "TOR", name: "Toronto Raptors", logo: "toronto-raptors.svg", rarity: 5.0, supplyLimit: 500 },
      { teamId: "MEM", name: "Memphis Grizzlies", logo: "memphis-grizzlies-logo.svg", rarity: 5.0, supplyLimit: 500 },
      { teamId: "UTA", name: "Utah Jazz", logo: "utah-jazz.svg", rarity: 5.0, supplyLimit: 500 },
    ],
  },
  {
    tier: 6,
    teams: [
      { teamId: "SAS", name: "San Antonio Spurs", logo: "san-antonio-spurs-logo.svg", rarity: 8.0, supplyLimit: 800 },
      { teamId: "POR", name: "Portland Trail Blazers", logo: "portland-trail-blazers-logo.svg", rarity: 8.0, supplyLimit: 800 },
      { teamId: "DET", name: "Detroit Pistons", logo: "detroit-pistons.svg", rarity: 8.0, supplyLimit: 800 },
      { teamId: "CHA", name: "Charlotte Hornets", logo: "charlotte-hornets-logo.svg", rarity: 8.0, supplyLimit: 800 },
      { teamId: "WAS", name: "Washington Wizards", logo: "washington-wizards-logo.svg", rarity: 8.0, supplyLimit: 800 },
    ],
  },
];

// Helper to get all teams as a flat array
export function getAllTeams(): NbaTeam[] {
  return NBA_TEAMS_BY_TIER.flatMap((tier) => tier.teams);
}

// Helper to get teams for a specific tier
export function getTeamsByTier(tier: number): NbaTeam[] {
  return NBA_TEAMS_BY_TIER.find((t) => t.tier === tier)?.teams ?? [];
}
