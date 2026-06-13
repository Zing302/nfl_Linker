import { describe, expect, it } from 'vitest';
import { resolve } from '../src/core/serviceResolver';
import { SERVICES } from '../src/services/registry';
import { makeGame } from './helpers';

const inMarket = { isUserInMarket: true };
const outOfMarket = { isUserInMarket: false };

describe('resolve – streaming-network match (primary signal)', () => {
  it('matches Peacock directly', () => {
    const game = makeGame({ tvNetworks: ['NBC'], streamingNetworks: ['Peacock'] });
    expect(resolve(game, inMarket)).toBe(SERVICES.peacock);
  });

  it('matches Prime Video including the "Amazon Prime Video" variant', () => {
    expect(
      resolve(makeGame({ streamingNetworks: ['Prime Video'] }), inMarket),
    ).toBe(SERVICES.primeVideo);
    expect(
      resolve(makeGame({ streamingNetworks: ['Amazon Prime Video'] }), inMarket),
    ).toBe(SERVICES.primeVideo);
  });

  it('matches Netflix and YouTube', () => {
    expect(resolve(makeGame({ streamingNetworks: ['Netflix'] }), inMarket)).toBe(SERVICES.netflix);
    expect(resolve(makeGame({ streamingNetworks: ['YouTube'] }), inMarket)).toBe(SERVICES.youtube);
  });
});

describe('resolve – TV-network fallback', () => {
  it('maps NBC to Peacock', () => {
    expect(resolve(makeGame({ tvNetworks: ['NBC'] }), inMarket)).toBe(SERVICES.peacock);
  });

  it('maps CBS to Paramount+', () => {
    expect(resolve(makeGame({ tvNetworks: ['CBS'] }), inMarket)).toBe(SERVICES.paramountPlus);
  });

  it('maps FOX to Fox One', () => {
    expect(resolve(makeGame({ tvNetworks: ['FOX'] }), inMarket)).toBe(SERVICES.foxOne);
  });

  it('maps ESPN and ABC to ESPN', () => {
    expect(resolve(makeGame({ tvNetworks: ['ESPN'] }), inMarket)).toBe(SERVICES.espn);
    expect(resolve(makeGame({ tvNetworks: ['ABC'] }), inMarket)).toBe(SERVICES.espn);
  });

  it('maps NFL Network to NFL+', () => {
    expect(resolve(makeGame({ tvNetworks: ['NFL Network'] }), inMarket)).toBe(SERVICES.nflPlus);
  });

  it('prefers the streaming match over the TV fallback', () => {
    const game = makeGame({ tvNetworks: ['CBS'], streamingNetworks: ['Paramount+'] });
    expect(resolve(game, inMarket)).toBe(SERVICES.paramountPlus);
  });
});

describe('resolve – market rule', () => {
  // Sun Sep 7 2025 13:00 ET: a Sunday-afternoon CBS slot (market-restricted).
  // Note: market is left at the makeGame default ('national') on purpose —
  // ESPN tags every game National, so the rule must not depend on it.
  const cbsSunday = makeGame({ date: '2025-09-07T17:00Z', tvNetworks: ['CBS'] });
  const foxSunday = makeGame({ date: '2025-09-07T17:00Z', tvNetworks: ['FOX'] });

  it('keeps the local service for in-market viewers', () => {
    expect(resolve(cbsSunday, inMarket)).toBe(SERVICES.paramountPlus);
    expect(resolve(foxSunday, inMarket)).toBe(SERVICES.foxOne);
  });

  it('routes out-of-market viewers to Sunday Ticket for Sunday CBS/FOX games', () => {
    expect(resolve(cbsSunday, outOfMarket)).toBe(SERVICES.sundayTicket);
    expect(resolve(foxSunday, outOfMarket)).toBe(SERVICES.sundayTicket);
  });

  it('does not restrict national CBS/FOX windows (e.g. Thanksgiving)', () => {
    // Thu Nov 27 2025 12:30 ET: a Thanksgiving CBS game airs nationally,
    // so an out-of-market viewer still watches on Paramount+, not Sunday Ticket.
    const thanksgiving = makeGame({ date: '2025-11-27T17:30Z', tvNetworks: ['CBS'] });
    expect(resolve(thanksgiving, outOfMarket)).toBe(SERVICES.paramountPlus);
  });

  it('only overrides the local-affiliate services (Paramount+/Fox One)', () => {
    // A Sunday-night NBC game streams everywhere on Peacock — never restricted.
    const sundayNight = makeGame({ date: '2025-09-08T00:20Z', tvNetworks: ['NBC'] });
    expect(resolve(sundayNight, outOfMarket)).toBe(SERVICES.peacock);
  });
});

describe('resolve – fallback of last resort', () => {
  it('returns NFL+ when no broadcast info matches', () => {
    expect(resolve(makeGame(), inMarket)).toBe(SERVICES.nflPlus);
  });
});
