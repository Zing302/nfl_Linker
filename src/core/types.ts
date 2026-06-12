export interface Team {
  id: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
}

export interface Game {
  id: string;
  /** Kickoff as UTC ISO string, straight from ESPN. */
  date: string;
  week: number;
  /** ESPN season type: 1 = preseason, 2 = regular, 3 = postseason. */
  seasonType: number;
  homeTeam: Team;
  awayTeam: Team;
  shortName: string;
  /** geoBroadcasts with type "TV" (e.g. NBC, CBS, FOX). */
  tvNetworks: string[];
  /** geoBroadcasts with type "Streaming" (e.g. Peacock, Prime Video). */
  streamingNetworks: string[];
  market: 'national' | 'regional';
}

export enum GameCategory {
  SUNDAY_DAY = 'SUNDAY_DAY',
  SUNDAY_NIGHT = 'SUNDAY_NIGHT',
  THURSDAY_NIGHT = 'THURSDAY_NIGHT',
  MONDAY_NIGHT = 'MONDAY_NIGHT',
  THANKSGIVING = 'THANKSGIVING',
  CHRISTMAS = 'CHRISTMAS',
  INTERNATIONAL = 'INTERNATIONAL',
  PLAYOFF = 'PLAYOFF',
  OTHER = 'OTHER',
}

export interface StreamingService {
  key: string;
  label: string;
  /** webOS application id used with the Luna applicationManager launch call. */
  webosAppId: string;
  /** Optional deep-link payload understood by some webOS apps. */
  contentTarget?: string;
  /** Browser fallback when not running on a TV. */
  webUrl: string;
  /** Brand color for the watch button. */
  color: string;
}

export interface LaunchTarget {
  service: StreamingService;
  game: Game;
}

export interface ResolveOptions {
  /** Whether the viewer is in the local broadcast market of the game. */
  isUserInMarket: boolean;
}
