import type { Game, ResolveOptions, StreamingService } from './types';
import { SERVICES } from '../services/registry';

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

/** Services that only carry a game inside its local broadcast market. */
const LOCAL_ONLY_SERVICES = new Set<string>([SERVICES.paramountPlus.key, SERVICES.foxOne.key]);

/**
 * Pick the streaming service that carries a game for this viewer.
 *
 * Paramount+ and Fox One stream the local CBS/FOX affiliate, so they only
 * carry regional games inside the game's market. Out-of-market viewers get
 * NFL Sunday Ticket for those games instead. National broadcasts are
 * unaffected — they stream everywhere.
 */
export function resolve(game: Game, opts: ResolveOptions): StreamingService {
  const service =
    match(game.streamingNetworks, STREAMING_PATTERNS) ??
    match(game.tvNetworks, TV_PATTERNS) ??
    SERVICES.nflPlus;

  const outOfMarketLocalOnly =
    game.market === 'regional' && !opts.isUserInMarket && LOCAL_ONLY_SERVICES.has(service.key);
  return outOfMarketLocalOnly ? SERVICES.sundayTicket : service;
}
