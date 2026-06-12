import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Game } from '../core/types';
import { fetchCurrentWeek, fetchWeek, SEASON_TYPES } from '../core/scheduleClient';
import { WeekSelector } from './WeekSelector';
import { GameCard } from './GameCard';

const SEASON_YEAR = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
const IN_MARKET_KEY = 'nfl-linker:isUserInMarket';

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
  const [isUserInMarket, setIsUserInMarket] = useState(
    () => localStorage.getItem(IN_MARKET_KEY) !== 'false',
  );
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const initialized = useRef(false);

  const loadWeek = useCallback((type: number, weekNumber: number) => {
    setLoading(true);
    setError(null);
    fetchWeek(SEASON_YEAR, type, weekNumber)
      .then((result) => {
        setGames(result);
        setFocusIndex(0);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // First load: let ESPN tell us the current week.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchCurrentWeek()
      .then(({ week: currentWeek, games: currentGames }) => {
        setWeek(currentWeek);
        setGames(currentGames);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onWeekChange = useCallback(
    (type: number, weekNumber: number) => {
      setSeasonType(type);
      setWeek(weekNumber);
      loadWeek(type, weekNumber);
    },
    [loadWeek],
  );

  const grouped = useMemo(() => groupByDay(games), [games]);
  const orderedGames = useMemo(() => grouped.flatMap((g) => g.games), [grouped]);

  // TV-remote navigation: up/down moves card focus, left/right changes week,
  // Enter is handled by the focused card itself.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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

  const toggleMarket = () => {
    setIsUserInMarket((prev) => {
      localStorage.setItem(IN_MARKET_KEY, String(!prev));
      return !prev;
    });
  };

  let cardIndex = -1;

  return (
    <div className="app">
      <header className="app-header">
        <h1>NFL Linker</h1>
        <button className="market-toggle" tabIndex={-1} onClick={toggleMarket}>
          {isUserInMarket ? 'In home market' : 'Out of market'}
        </button>
      </header>
      <WeekSelector seasonType={seasonType} week={week} onChange={onWeekChange} />
      {loading && <div className="status">Loading schedule…</div>}
      {error && <div className="status error">Couldn’t load the schedule: {error}</div>}
      {!loading && !error && games.length === 0 && (
        <div className="status">No games scheduled this week.</div>
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
                  isUserInMarket={isUserInMarket}
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
