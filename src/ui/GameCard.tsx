import { forwardRef, useState } from 'react';
import type { Game } from '../core/types';
import { categorize, isSpecialEvent, CATEGORY_LABELS } from '../core/categorizer';
import { resolve } from '../core/serviceResolver';
import { resolveAndLaunch } from '../appLinker';

interface GameCardProps {
  game: Game;
  isUserInMarket: boolean;
  focused: boolean;
  onFocus: () => void;
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

export const GameCard = forwardRef<HTMLDivElement, GameCardProps>(function GameCard(
  { game, isUserInMarket, focused, onFocus },
  ref,
) {
  const [error, setError] = useState<string | null>(null);
  const category = categorize(game);
  const service = resolve(game, { isUserInMarket });

  const launch = () => {
    setError(null);
    resolveAndLaunch(game, { isUserInMarket }).catch((e: Error) => setError(e.message));
  };

  return (
    <div
      ref={ref}
      className={`game-card${focused ? ' focused' : ''}`}
      tabIndex={-1}
      onMouseEnter={onFocus}
      onClick={launch}
      onKeyDown={(e) => {
        if (e.key === 'Enter') launch();
      }}
    >
      <div className="game-card-time">{timeFormat.format(new Date(game.date))}</div>
      <div className="game-card-teams">
        <span>{game.awayTeam.displayName}</span>
        <span className="game-card-at">@</span>
        <span>{game.homeTeam.displayName}</span>
      </div>
      {isSpecialEvent(category) && (
        <span className={`badge badge-${category.toLowerCase()}`}>{CATEGORY_LABELS[category]}</span>
      )}
      <button
        className="watch-button"
        style={{ backgroundColor: service.color }}
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          launch();
        }}
      >
        Watch on {service.label}
      </button>
      {error && <div className="game-card-error">{error}</div>}
    </div>
  );
});
