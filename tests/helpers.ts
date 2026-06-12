import type { Game } from '../src/core/types';

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: '1',
    date: '2025-09-07T17:00Z',
    week: 1,
    seasonType: 2,
    homeTeam: { id: 'h', abbreviation: 'HOM', displayName: 'Home Team' },
    awayTeam: { id: 'a', abbreviation: 'AWY', displayName: 'Away Team' },
    shortName: 'AWY @ HOM',
    tvNetworks: [],
    streamingNetworks: [],
    market: 'national',
    ...overrides,
  };
}
