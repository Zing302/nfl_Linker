import { GameCategory, type Game, type ResolveOptions, type StreamingService } from './types';
import { SERVICES } from '../services/registry';
import { categorize } from './categorizer';

/** Case-insensitive substring patterns → registry entry. Order matters:
 * more specific names first (e.g. "youtube tv" before "youtube"). */
const STREAMING_PATTERNS: Array<[string, StreamingService]> = [
  ['peacock', SERVICES.peacock],
  ['prime video', SERVICES.primeVideo],
  ['amazon', SERVICES.primeVideo],
  ['netflix', SERVICES.netflix],
  ['paramount', SERVICES.paramountPlus],
  ['fox one', SERVICES.foxOne],
  ['espn+', SERVICES.espn],
  ['espn', SERVICES.espn],
  ['sunday ticket', SERVICES.sundayTicket],
  ['youtube tv', SERVICES.sundayTicket],
  ['youtube', SERVICES.youtube],
  ['nfl+', SERVICES.nflPlus],
];

const TV_PATTERNS: Array<[string, StreamingService]> = [
  ['nbc', SERVICES.peacock],
  ['cbs', SERVICES.paramountPlus],
  ['fox', SERVICES.foxOne],
  ['espn', SERVICES.espn],
  ['abc', SERVICES.espn],
  ['nfl network', SERVICES.nflPlus],
  ['nfl net', SERVICES.nflPlus],
];

function match(
  names: string[],
  patterns: Array<[string, StreamingService]>,
): StreamingService | undefined {
  for (const name of names) {
    const lower = name.toLowerCase();
    for (const [pattern, service] of patterns) {
      if (lower.includes(pattern)) return service;
    }
  }
  return undefined;
}

/** Services that stream only the local CBS/FOX affiliate. */
const LOCAL_ONLY_SERVICES = new Set<string>([SERVICES.paramountPlus.key, SERVICES.foxOne.key]);

/**
 * Whether a game's broadcast is restricted to the local market.
 *
 * ESPN's geoBroadcasts `market` field reads "National" for every game when
 * queried without a viewer location, so it can't be trusted here. Instead we
 * use the structural rule: the market-restricted games are the Sunday-
 * afternoon CBS/FOX broadcasts — exactly what NFL Sunday Ticket carries.
 * National windows (SNF, TNF, MNF, Thanksgiving, Christmas, playoffs) air
 * everywhere, so they're never restricted even when they're on CBS/FOX.
 */
function isMarketRestricted(game: Game, service: StreamingService): boolean {
  return categorize(game) === GameCategory.SUNDAY_DAY && LOCAL_ONLY_SERVICES.has(service.key);
}

/**
 * Pick the streaming service that carries a game for this viewer.
 *
 * Paramount+ and Fox One stream the local CBS/FOX affiliate, so for a
 * market-restricted game an out-of-market viewer can't watch there — they
 * need NFL Sunday Ticket instead.
 */
export function resolve(game: Game, opts: ResolveOptions): StreamingService {
  const service =
    match(game.streamingNetworks, STREAMING_PATTERNS) ??
    match(game.tvNetworks, TV_PATTERNS) ??
    SERVICES.nflPlus;

  if (isMarketRestricted(game, service) && !opts.isUserInMarket) {
    return SERVICES.sundayTicket;
  }
  return service;
}
