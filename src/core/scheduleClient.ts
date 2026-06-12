import type { Game, Team } from './types';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

export const SEASON_TYPES = { PRESEASON: 1, REGULAR: 2, POSTSEASON: 3 } as const;

/* Minimal shapes for the parts of the ESPN scoreboard response we read. */
interface EspnTeam {
  id?: string;
  abbreviation?: string;
  displayName?: string;
  logo?: string;
}

interface EspnCompetitor {
  homeAway?: string;
  team?: EspnTeam;
}

interface EspnGeoBroadcast {
  type?: { shortName?: string };
  market?: { type?: string };
  media?: { shortName?: string };
}

interface EspnEvent {
  id?: string;
  date?: string;
  shortName?: string;
  week?: { number?: number };
  season?: { type?: number; year?: number };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    geoBroadcasts?: EspnGeoBroadcast[];
  }>;
}

export interface EspnScoreboard {
  week?: { number?: number };
  events?: EspnEvent[];
}

function parseTeam(competitor: EspnCompetitor | undefined): Team {
  const team = competitor?.team ?? {};
  // Playoff slots that aren't set yet come back without team data.
  return {
    id: team.id ?? '',
    abbreviation: team.abbreviation ?? 'TBD',
    displayName: team.displayName ?? 'TBD',
    logo: team.logo,
  };
}

export function parseEvent(event: EspnEvent, fallbackSeasonType: number): Game {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const broadcasts = competition?.geoBroadcasts ?? [];

  const names = (typeName: string) =>
    broadcasts
      .filter((b) => b.type?.shortName === typeName)
      .map((b) => b.media?.shortName ?? '')
      .filter(Boolean);

  return {
    id: event.id ?? '',
    date: event.date ?? '',
    week: event.week?.number ?? 0,
    seasonType: event.season?.type ?? fallbackSeasonType,
    seasonYear: event.season?.year ?? 0,
    homeTeam: parseTeam(competitors.find((c) => c.homeAway === 'home')),
    awayTeam: parseTeam(competitors.find((c) => c.homeAway === 'away')),
    shortName: event.shortName ?? '',
    tvNetworks: names('TV'),
    streamingNetworks: names('Streaming'),
    market: broadcasts.some((b) => b.market?.type === 'National') ? 'national' : 'regional',
  };
}

export function parseScoreboard(data: EspnScoreboard, seasonType: number): Game[] {
  return (data.events ?? []).map((event) => parseEvent(event, seasonType));
}

/**
 * ESPN pre-creates playoff events with literal "TBD @ TBD" matchups and no
 * broadcasts. Those aren't watchable games — the UI hides them and reports
 * the matchups as not available yet.
 */
export function isMatchupSet(game: Game): boolean {
  return game.homeTeam.displayName !== 'TBD' && game.awayTeam.displayName !== 'TBD';
}

export async function fetchWeek(year: number, seasonType: number, week: number): Promise<Game[]> {
  const url = `${BASE_URL}?dates=${year}&seasontype=${seasonType}&week=${week}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN scoreboard request failed: ${response.status}`);
  }
  const data = (await response.json()) as EspnScoreboard;
  return parseScoreboard(data, seasonType);
}

/** Current week per ESPN (no-param scoreboard reports the live week). */
export async function fetchCurrentWeek(): Promise<{ week: number; games: Game[] }> {
  const response = await fetch(BASE_URL);
  if (!response.ok) {
    throw new Error(`ESPN scoreboard request failed: ${response.status}`);
  }
  const data = (await response.json()) as EspnScoreboard;
  return {
    week: data.week?.number ?? 1,
    games: parseScoreboard(data, SEASON_TYPES.REGULAR),
  };
}
