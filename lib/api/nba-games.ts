import axios from "axios";

// Game status enum for type safety
export enum GameStatus {
  SCHEDULED = 1,
  IN_PROGRESS = 2,
  FINAL = 3,
}

// Types for NBA API responses
export interface NbaTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
  seed?: number;
  inBonus?: string;
  timeoutsRemaining?: number;
  periods: { period: number; periodType: string; score: number }[];
}

export interface NbaGameLeader {
  personId: number;
  name: string;
  jerseyNum: string;
  position: string;
  teamTricode: string;
  playerSlug: string | null;
  points: number;
  rebounds: number;
  assists: number;
}

export interface NbaGame {
  gameId: string;
  gameCode: string;
  gameStatus: GameStatus;
  gameStatusText: string;
  period: number;
  gameClock: string;
  gameTimeUTC: string;
  gameEt: string;
  regulationPeriods: number;
  ifNecessary: boolean;
  seriesGameNumber: string;
  seriesText: string;
  homeTeam: NbaTeam;
  awayTeam: NbaTeam;
  gameLeaders?: {
    homeLeaders: NbaGameLeader;
    awayLeaders: NbaGameLeader;
  };
  pointsLeaders?: NbaGameLeader[];
}

export interface NbaScoreboardResponse {
  meta: {
    version: number;
    request: string;
    time: string;
    code: number;
  };
  scoreboard: {
    gameDate: string;
    leagueId: string;
    leagueName: string;
    games: NbaGame[];
  };
}

// Transformed game data for the UI
export interface TransformedGame {
  id: string;
  homeTeam: string;
  homeTricode: string;
  homeRecord: string;
  homeScore: number;
  awayTeam: string;
  awayTricode: string;
  awayRecord: string;
  awayScore: number;
  date: string;
  time: string;
  gameStatus: GameStatus;
  gameStatusText: string;
  period: number;
  gameClock: string;
}

// NBA Team colors for styling
export const NBA_TEAM_COLORS: Record<
  string,
  { primary: string; secondary: string }
> = {
  ATL: { primary: "#E03A3E", secondary: "#C1D32F" },
  BOS: { primary: "#007A33", secondary: "#BA9653" },
  BKN: { primary: "#000000", secondary: "#FFFFFF" },
  CHA: { primary: "#1D1160", secondary: "#00788C" },
  CHI: { primary: "#CE1141", secondary: "#000000" },
  CLE: { primary: "#860038", secondary: "#FDBB30" },
  DAL: { primary: "#00538C", secondary: "#002B5E" },
  DEN: { primary: "#0E2240", secondary: "#FEC524" },
  DET: { primary: "#C8102E", secondary: "#1D42BA" },
  GSW: { primary: "#1D428A", secondary: "#FFC72C" },
  HOU: { primary: "#CE1141", secondary: "#000000" },
  IND: { primary: "#002D62", secondary: "#FDBB30" },
  LAC: { primary: "#C8102E", secondary: "#1D428A" },
  LAL: { primary: "#552583", secondary: "#FDB927" },
  MEM: { primary: "#5D76A9", secondary: "#12173F" },
  MIA: { primary: "#98002E", secondary: "#F9A01B" },
  MIL: { primary: "#00471B", secondary: "#EEE1C6" },
  MIN: { primary: "#0C2340", secondary: "#236192" },
  NOP: { primary: "#0C2340", secondary: "#C8102E" },
  NYK: { primary: "#006BB6", secondary: "#F58426" },
  OKC: { primary: "#007AC1", secondary: "#EF3B24" },
  ORL: { primary: "#0077C0", secondary: "#C4CED4" },
  PHI: { primary: "#006BB6", secondary: "#ED174C" },
  PHX: { primary: "#1D1160", secondary: "#E56020" },
  POR: { primary: "#E03A3E", secondary: "#000000" },
  SAC: { primary: "#5A2D81", secondary: "#63727A" },
  SAS: { primary: "#C4CED4", secondary: "#000000" },
  TOR: { primary: "#CE1141", secondary: "#000000" },
  UTA: { primary: "#002B5C", secondary: "#00471B" },
  WAS: { primary: "#002B5C", secondary: "#E31837" },
};

// Helper to format date for display
function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  };
  return date.toLocaleDateString("en-US", options);
}

// Helper to format time for display
function formatGameTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

// Transform NBA API response to UI-friendly format
function transformGames(games: NbaGame[]): TransformedGame[] {
  return games.map((game) => ({
    id: game.gameId,
    homeTeam: game.homeTeam.teamName,
    homeTricode: game.homeTeam.teamTricode,
    homeRecord: `${game.homeTeam.wins}-${game.homeTeam.losses}`,
    homeScore: game.homeTeam.score,
    awayTeam: game.awayTeam.teamName,
    awayTricode: game.awayTeam.teamTricode,
    awayRecord: `${game.awayTeam.wins}-${game.awayTeam.losses}`,
    awayScore: game.awayTeam.score,
    date: formatGameDate(game.gameTimeUTC),
    time: formatGameTime(game.gameTimeUTC),
    gameStatus: game.gameStatus,
    gameStatusText: game.gameStatusText,
    period: game.period,
    gameClock: game.gameClock,
  }));
}

// Format date as YYYY-MM-DD for API
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Check if date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Fetch scoreboard via local API proxy (avoids CORS)
// If date is provided and not today, fetches for that specific date
export async function fetchScoreboard(date?: Date): Promise<TransformedGame[]> {
  const params = date && !isToday(date) ? `?date=${formatDateForApi(date)}` : "";
  const response = await axios.get<NbaScoreboardResponse>(
    `/api/nba/scoreboard${params}`
  );
  return transformGames(response.data.scoreboard.games);
}

// Fetch today's scoreboard (convenience function)
export async function fetchTodaysScoreboard(): Promise<TransformedGame[]> {
  return fetchScoreboard();
}

// Get the raw scoreboard date from NBA API
export async function fetchScoreboardDate(): Promise<string> {
  const response = await axios.get<NbaScoreboardResponse>("/api/nba/scoreboard");
  return response.data.scoreboard.gameDate;
}
