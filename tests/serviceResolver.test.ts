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
  // Sun Sep 7 2025 13:00 ET: a regional Sunday-afternoon slot.
  const regionalSunday = makeGame({
    date: '2025-09-07T17:00Z',
    market: 'regional',
    tvNetworks: ['CBS'],
  });

  it('keeps the local service for in-market viewers', () => {
    expect(resolve(regionalSunday, inMarket)).toBe(SERVICES.paramountPlus);
  });

  it('routes out-of-market viewers to Sunday Ticket', () => {
    expect(resolve(regionalSunday, outOfMarket)).toBe(SERVICES.sundayTicket);
  });

  it('does not apply Sunday Ticket to national games', () => {
    const national = makeGame({
      date: '2025-09-07T17:00Z',
      market: 'national',
      tvNetworks: ['FOX'],
    });
    expect(resolve(national, outOfMarket)).toBe(SERVICES.foxOne);
  });

  it('does not apply Sunday Ticket to regional games outside the Sunday-day slot', () => {
    // Thursday-night kickoff: Sunday Ticket carries Sunday-afternoon games only.
    const thursday = makeGame({
      date: '2025-09-05T00:20Z',
      market: 'regional',
      tvNetworks: ['NBC'],
    });
    expect(resolve(thursday, outOfMarket)).toBe(SERVICES.peacock);
  });
});

describe('resolve – fallback of last resort', () => {
  it('returns NFL+ when no broadcast info matches', () => {
    expect(resolve(makeGame(), inMarket)).toBe(SERVICES.nflPlus);
  });
});
