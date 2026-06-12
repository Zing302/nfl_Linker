import { describe, expect, it } from 'vitest';
import { categorize, isSpecialEvent } from '../src/core/categorizer';
import { GameCategory } from '../src/core/types';
import { makeGame } from './helpers';

describe('categorize', () => {
  it('classifies a Thursday-night game whose UTC date rolls over to Friday', () => {
    // Thu Sep 4 2025 20:20 ET = Fri Sep 5 00:20 UTC (the 2025 season opener).
    const game = makeGame({ date: '2025-09-05T00:20Z' });
    expect(categorize(game)).toBe(GameCategory.THURSDAY_NIGHT);
  });

  it('classifies a normal Sunday-afternoon game', () => {
    // Sun Sep 7 2025 13:00 ET.
    const game = makeGame({ date: '2025-09-07T17:00Z' });
    expect(categorize(game)).toBe(GameCategory.SUNDAY_DAY);
  });

  it('classifies a late Sunday-afternoon game as SUNDAY_DAY', () => {
    // Sun Sep 7 2025 16:25 ET.
    const game = makeGame({ date: '2025-09-07T20:25Z' });
    expect(categorize(game)).toBe(GameCategory.SUNDAY_DAY);
  });

  it('classifies Sunday Night Football (UTC rolls to Monday)', () => {
    // Sun Sep 7 2025 20:20 ET = Mon 00:20 UTC.
    const game = makeGame({ date: '2025-09-08T00:20Z' });
    expect(categorize(game)).toBe(GameCategory.SUNDAY_NIGHT);
  });

  it('classifies Monday Night Football (UTC rolls to Tuesday)', () => {
    // Mon Sep 8 2025 20:15 ET = Tue 00:15 UTC.
    const game = makeGame({ date: '2025-09-09T00:15Z' });
    expect(categorize(game)).toBe(GameCategory.MONDAY_NIGHT);
  });

  it('classifies a Sunday-morning international game', () => {
    // Sun Oct 5 2025 09:30 ET (London slot) = 13:30 UTC.
    const game = makeGame({ date: '2025-10-05T13:30Z' });
    expect(categorize(game)).toBe(GameCategory.INTERNATIONAL);
  });

  it('classifies Thanksgiving over the Thursday-night slot', () => {
    // Thu Nov 27 2025 12:30 ET.
    const game = makeGame({ date: '2025-11-27T17:30Z' });
    expect(categorize(game)).toBe(GameCategory.THANKSGIVING);
  });

  it('classifies Christmas regardless of weekday', () => {
    // Thu Dec 25 2025 13:00 ET.
    const game = makeGame({ date: '2025-12-25T18:00Z' });
    expect(categorize(game)).toBe(GameCategory.CHRISTMAS);
  });

  it('classifies playoffs by season type even on a Sunday afternoon', () => {
    const game = makeGame({ date: '2026-01-11T18:00Z', seasonType: 3 });
    expect(categorize(game)).toBe(GameCategory.PLAYOFF);
  });

  it('classifies a Friday game (Brazil slot) as OTHER', () => {
    // Fri Sep 5 2025 20:00 ET = Sat 00:00 UTC.
    const game = makeGame({ date: '2025-09-06T00:00Z' });
    expect(categorize(game)).toBe(GameCategory.OTHER);
  });
});

describe('isSpecialEvent', () => {
  it('treats only SUNDAY_DAY as non-special', () => {
    expect(isSpecialEvent(GameCategory.SUNDAY_DAY)).toBe(false);
    expect(isSpecialEvent(GameCategory.THURSDAY_NIGHT)).toBe(true);
    expect(isSpecialEvent(GameCategory.CHRISTMAS)).toBe(true);
    expect(isSpecialEvent(GameCategory.PLAYOFF)).toBe(true);
  });
});
