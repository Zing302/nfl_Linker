import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeek, parseScoreboard, SEASON_TYPES } from '../src/core/scheduleClient';
import type { EspnScoreboard } from '../src/core/scheduleClient';
import fixture from './fixtures/scoreboard-week1.json';

const scoreboard = fixture as EspnScoreboard;

describe('parseScoreboard', () => {
  const games = parseScoreboard(scoreboard, SEASON_TYPES.REGULAR);

  it('parses every event', () => {
    expect(games).toHaveLength(6);
  });

  it('extracts teams, date, and week from the opener', () => {
    const opener = games[0];
    expect(opener.id).toBe('401772510');
    expect(opener.date).toBe('2025-09-05T00:20Z');
    expect(opener.week).toBe(1);
    expect(opener.seasonType).toBe(2);
    expect(opener.homeTeam.abbreviation).toBe('PHI');
    expect(opener.awayTeam.abbreviation).toBe('DAL');
    expect(opener.shortName).toBe('DAL @ PHI');
  });

  it('separates TV and streaming broadcasts', () => {
    const opener = games[0];
    expect(opener.tvNetworks).toEqual(['NBC']);
    expect(opener.streamingNetworks).toEqual(['Peacock']);
    expect(opener.market).toBe('national');
  });

  it('parses a streaming-only national game (Brazil game on YouTube)', () => {
    const brazil = games[1];
    expect(brazil.tvNetworks).toEqual([]);
    expect(brazil.streamingNetworks).toEqual(['YouTube']);
    expect(brazil.market).toBe('national');
  });

  it('marks regional-only broadcasts as regional', () => {
    const cbsGame = games[2];
    expect(cbsGame.tvNetworks).toEqual(['CBS']);
    expect(cbsGame.market).toBe('regional');
  });

  it('tolerates events with no geoBroadcasts', () => {
    const bare = parseScoreboard(
      { events: [{ id: 'x', date: '2025-09-07T17:00Z' }] },
      SEASON_TYPES.REGULAR,
    );
    expect(bare[0].tvNetworks).toEqual([]);
    expect(bare[0].streamingNetworks).toEqual([]);
    expect(bare[0].market).toBe('regional');
  });
});

describe('fetchWeek', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the right URL and parses the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => scoreboard,
    });
    vi.stubGlobal('fetch', fetchMock);

    const games = await fetchWeek(2025, SEASON_TYPES.REGULAR, 1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2025&seasontype=2&week=1',
    );
    expect(games).toHaveLength(6);
  });

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchWeek(2025, 2, 1)).rejects.toThrow('503');
  });
});
