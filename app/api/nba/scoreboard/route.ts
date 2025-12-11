import { NextRequest, NextResponse } from "next/server";

// Required for Cloudflare Pages edge runtime
export const runtime = "edge";

// NBA CDN URL for today's scoreboard
const NBA_TODAY_URL =
  "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json";

// NBA stats API for historical/future dates (format: YYYY-MM-DD)
function getNbaScheduleUrl(date: string): string {
  return `https://stats.nba.com/stats/scoreboardv3?GameDate=${date}&LeagueID=00`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date"); // Format: YYYY-MM-DD

    let url: string;
    let headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (date) {
      // Use stats API for specific dates
      url = getNbaScheduleUrl(date);
      // Stats API requires these headers
      headers = {
        ...headers,
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.nba.com/",
        Origin: "https://www.nba.com",
      };
    } else {
      // Use CDN for today's live scoreboard
      url = NBA_TODAY_URL;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: date ? 300 : 30 }, // Cache 5min for historical, 30s for today
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch NBA scoreboard" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform stats API response to match CDN format if needed
    if (date && data.scoreboard) {
      // Stats API v3 already returns similar format
      return NextResponse.json(data);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("NBA API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch NBA scoreboard" },
      { status: 500 }
    );
  }
}
