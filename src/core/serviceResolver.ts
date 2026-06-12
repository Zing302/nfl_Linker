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

/**
 * Pick the streaming service that carries a game for this viewer.
 *
 * Out-of-market regional Sunday-afternoon games aren't available on the
 * local CBS/FOX streaming service — they require NFL Sunday Ticket — so the
 * market rule overrides the broadcast-derived match for that slot only.
 */
export function resolve(game: Game, opts: ResolveOptions): StreamingService {
  const outOfMarketRegional =
    game.market === 'regional' &&
    !opts.isUserInMarket &&
    categorize(game) === GameCategory.SUNDAY_DAY;
  if (outOfMarketRegional) return SERVICES.sundayTicket;

  return (
    match(game.streamingNetworks, STREAMING_PATTERNS) ??
    match(game.tvNetworks, TV_PATTERNS) ??
    SERVICES.nflPlus
  );
}
