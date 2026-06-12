import { SEASON_TYPES } from '../core/scheduleClient';

interface WeekSelectorProps {
  seasonType: number;
  week: number;
  onChange: (seasonType: number, week: number) => void;
}

const WEEKS_BY_TYPE: Record<number, number> = {
  [SEASON_TYPES.PRESEASON]: 4,
  [SEASON_TYPES.REGULAR]: 18,
  [SEASON_TYPES.POSTSEASON]: 5,
};

const TYPE_LABELS: Record<number, string> = {
  [SEASON_TYPES.PRESEASON]: 'Preseason',
  [SEASON_TYPES.REGULAR]: 'Regular Season',
  [SEASON_TYPES.POSTSEASON]: 'Playoffs',
};

export function WeekSelector({ seasonType, week, onChange }: WeekSelectorProps) {
  const weekCount = WEEKS_BY_TYPE[seasonType] ?? 18;
  const weeks = Array.from({ length: weekCount }, (_, i) => i + 1);

  return (
    <div className="week-selector">
      <div className="season-type-row">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <button
            key={type}
            tabIndex={-1}
            className={`season-type-button${Number(type) === seasonType ? ' active' : ''}`}
            onClick={() => onChange(Number(type), 1)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="week-row">
        {weeks.map((w) => (
          <button
            key={w}
            tabIndex={-1}
            className={`week-button${w === week ? ' active' : ''}`}
            onClick={() => onChange(seasonType, w)}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}
