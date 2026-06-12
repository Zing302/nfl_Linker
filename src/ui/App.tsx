import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '../core/types';
import { fetchCurrentWeek, fetchWeek, isMatchupSet, SEASON_TYPES } from '../core/scheduleClient';
import { isGameInMarket } from '../core/marketResolver';
import { WeekSelector } from './WeekSelector';
import { GameCard } from './GameCard';

// The NFL season spans Sep–Feb. Through February we're still in last
// year's season (playoffs); from March on, this year's season is the one
// that matters — even before its schedule is released. Weeks ESPN has no
// data for yet render as "matchups not available", never last season's.
const NOW = new Date();
const SEASON_YEAR = NOW.getMonth() >= 2 ? NOW.getFullYear() : NOW.getFullYear() - 1;
const ZIP_KEY = 'nfl-linker:zip';
// Matchups change (flex scheduling, playoff seeding), so a long-running app
// must re-pull the schedule periodically, not just on load.
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

const dateHeaderFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

function groupByDay(games: Game[]): Array<{ label: string; games: Game[] }> {
  const groups = new Map<string, Game[]>();
  for (const game of [...games].sort((a, b) => a.date.localeCompare(b.date))) {
    const label = dateHeaderFormat.format(new Date(game.date));
    groups.set(label, [...(groups.get(label) ?? []), game]);
  }
  return Array.from(groups, ([label, dayGames]) => ({ label, games: dayGames }));
}

export function App() {
  const [seasonType, setSeasonType] = useState<number>(SEASON_TYPES.REGULAR);
  const [week, setWeek] = useState(1);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [zip, setZip] = useState(() => localStorage.getItem(ZIP_KEY) ?? '');
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const initialized = useRef(false);

  const loadWeek = useCallback(
    (type: number, weekNumber: number, opts: { silent?: boolean } = {}) => {
      if (!opts.silent) {
        setLoading(true);
        setError(null);
      }
      fetchWeek(SEASON_YEAR, type, weekNumber)
        .then((result) => {
          setGames(result);
          if (!opts.silent) setFocusIndex(0);
        })
        .catch((e: Error) => {
          if (!opts.silent) setError(e.message);
        })
        .finally(() => setLoading(false));
    },
    [],
  );

  // First load: let ESPN tell us the current week. In the offseason the
  // no-param scoreboard serves last season's games — reject those and ask
  // for this season's week 1 instead.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchCurrentWeek()
      .then(({ week: currentWeek, games: currentGames }) => {
        if (currentGames.some((g) => g.seasonYear === SEASON_YEAR)) {
          setWeek(currentWeek);
          setGames(currentGames);
          setLoading(false);
        } else {
          loadWeek(SEASON_TYPES.REGULAR, 1);
        }
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [loadWeek]);

  const onWeekChange = useCallback(
    (type: number, weekNumber: number) => {
      setSeasonType(type);
      setWeek(weekNumber);
      loadWeek(type, weekNumber);
    },
    [loadWeek],
  );

  // Keep the schedule fresh: re-pull hourly and whenever the app resumes
  // (TVs leave apps open for days; playoff matchups and flexed games change).
  useEffect(() => {
    const refresh = () => loadWeek(seasonType, week, { silent: true });
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [seasonType, week, loadWeek]);

  const setGamesOnly = useMemo(() => games.filter(isMatchupSet), [games]);
  const grouped = useMemo(() => groupByDay(setGamesOnly), [setGamesOnly]);
  const orderedGames = useMemo(() => grouped.flatMap((g) => g.games), [grouped]);

  // TV-remote navigation: up/down moves card focus, left/right changes week,
  // Enter is handled by the focused card itself.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Let the ZIP field handle its own keys while it's focused.
      if (document.activeElement instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusIndex((i) => Math.min(i + 1, orderedGames.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusIndex((i) => Math.max(i - 1, 0));
          break;
        case 'ArrowRight':
          e.preventDefault();
          onWeekChange(seasonType, week + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (week > 1) onWeekChange(seasonType, week - 1);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [orderedGames.length, seasonType, week, onWeekChange]);

  useEffect(() => {
    cardRefs.current[focusIndex]?.focus();
    cardRefs.current[focusIndex]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusIndex, games]);

  const onZipChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 5);
    setZip(digits);
    localStorage.setItem(ZIP_KEY, digits);
  };

  let cardIndex = -1;

  return (
    <div className="app">
      <header className="app-header">
        <h1>NFL Linker</h1>
        <label className="zip-field">
          ZIP
          <input
            className="zip-input"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 98101"
            value={zip}
            onChange={(e) => onZipChange(e.target.value)}
          />
        </label>
      </header>
      <WeekSelector seasonType={seasonType} week={week} onChange={onWeekChange} />
      {loading && <div className="status">Loading schedule…</div>}
      {error && <div className="status error">Couldn’t load the schedule: {error}</div>}
      {!loading && !error && setGamesOnly.length === 0 && (
        <div className="status">Matchups not available yet for this week.</div>
      )}
      {!loading &&
        grouped.map(({ label, games: dayGames }) => (
          <section key={label}>
            <h2 className="day-header">{label}</h2>
            {dayGames.map((game) => {
              cardIndex += 1;
              const index = cardIndex;
              return (
                <GameCard
                  key={game.id}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  game={game}
                  isUserInMarket={isGameInMarket(game, zip)}
                  focused={index === focusIndex}
                  onFocus={() => setFocusIndex(index)}
                />
              );
            })}
          </section>
        ))}
    </div>
  );
}
