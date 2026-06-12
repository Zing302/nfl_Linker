import type { Game } from './types';
import { TEAM_MARKET_PREFIXES } from './marketData';

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

/**
 * Whether the viewer's ZIP falls in either team's home market.
 *
 * Regional CBS/FOX broadcasts air in the participating teams' markets, so
 * that's the approximation used here. With no (or an invalid) ZIP we assume
 * in-market, matching the app's old default behavior.
 */
export function isGameInMarket(game: Game, zip: string): boolean {
  if (!isValidZip(zip)) return true;
  const prefixes = [
    ...(TEAM_MARKET_PREFIXES[game.homeTeam.abbreviation] ?? []),
    ...(TEAM_MARKET_PREFIXES[game.awayTeam.abbreviation] ?? []),
  ];
  return prefixes.some((prefix) => zip.startsWith(prefix));
}
