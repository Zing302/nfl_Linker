import { describe, expect, it } from 'vitest';
import { isGameInMarket, isValidZip } from '../src/core/marketResolver';
import { makeGame } from './helpers';

function gameBetween(home: string, away: string) {
  return makeGame({
    homeTeam: { id: 'h', abbreviation: home, displayName: home },
    awayTeam: { id: 'a', abbreviation: away, displayName: away },
  });
}

describe('isValidZip', () => {
  it('accepts exactly five digits', () => {
    expect(isValidZip('98101')).toBe(true);
    expect(isValidZip('9810')).toBe(false);
    expect(isValidZip('981011')).toBe(false);
    expect(isValidZip('abcde')).toBe(false);
    expect(isValidZip('')).toBe(false);
  });
});

describe('isGameInMarket', () => {
  const dalAtPhi = gameBetween('PHI', 'DAL');

  it("matches the home team's market", () => {
    expect(isGameInMarket(dalAtPhi, '19103')).toBe(true); // Philadelphia
  });

  it("matches the away team's market", () => {
    expect(isGameInMarket(dalAtPhi, '75201')).toBe(true); // Dallas
  });

  it('rejects a ZIP outside both markets', () => {
    expect(isGameInMarket(dalAtPhi, '98101')).toBe(false); // Seattle
  });

  it('matches two-digit metro prefixes', () => {
    expect(isGameInMarket(gameBetween('GB', 'CHI'), '54303')).toBe(true); // Green Bay
    expect(isGameInMarket(gameBetween('NE', 'MIA'), '02101')).toBe(true); // Boston
  });

  it('assumes in-market with no or invalid ZIP (old default behavior)', () => {
    expect(isGameInMarket(dalAtPhi, '')).toBe(true);
    expect(isGameInMarket(dalAtPhi, '123')).toBe(true);
  });

  it('treats unknown teams as out-of-market', () => {
    // Unset playoff slots have no abbreviation to map. Harmless: playoff
    // games are national broadcasts, so the market override never applies.
    expect(isGameInMarket(gameBetween('TBD', 'TBD'), '98101')).toBe(false);
  });
});
