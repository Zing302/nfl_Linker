import { GameCategory, type Game } from './types';

interface EasternTime {
  month: number;
  day: number;
  weekday: string;
  hour: number;
}

/**
 * Convert a UTC kickoff to US/Eastern parts. NFL scheduling slots are defined
 * in ET, and UTC dates roll over (a Thursday 20:20 ET kickoff is Friday in
 * UTC), so categorization must happen in this zone.
 */
function toEastern(isoDate: string): EasternTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(isoDate));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday'),
    // Intl emits "24" for midnight with hour12: false in some engines.
    hour: Number(get('hour')) % 24,
  };
}

function isThanksgiving(et: EasternTime): boolean {
  // Thanksgiving is the 4th Thursday of November: days 22–28.
  return et.month === 11 && et.weekday === 'Thursday' && et.day >= 22 && et.day <= 28;
}

export function categorize(game: Game): GameCategory {
  if (game.seasonType === 3) return GameCategory.PLAYOFF;

  const et = toEastern(game.date);

  if (et.month === 12 && et.day === 25) return GameCategory.CHRISTMAS;
  if (isThanksgiving(et)) return GameCategory.THANKSGIVING;

  switch (et.weekday) {
    case 'Thursday':
      return GameCategory.THURSDAY_NIGHT;
    case 'Monday':
      return GameCategory.MONDAY_NIGHT;
    case 'Sunday':
      if (et.hour >= 19) return GameCategory.SUNDAY_NIGHT;
      // Morning ET kickoffs are international-series games (London, etc.).
      if (et.hour < 12) return GameCategory.INTERNATIONAL;
      return GameCategory.SUNDAY_DAY;
    default:
      // Saturday late-season games and other irregular slots.
      return GameCategory.OTHER;
  }
}

/** A special event is anything outside the normal Sunday-afternoon slate. */
export function isSpecialEvent(category: GameCategory): boolean {
  return category !== GameCategory.SUNDAY_DAY;
}

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  [GameCategory.SUNDAY_DAY]: 'Sunday',
  [GameCategory.SUNDAY_NIGHT]: 'SNF',
  [GameCategory.THURSDAY_NIGHT]: 'TNF',
  [GameCategory.MONDAY_NIGHT]: 'MNF',
  [GameCategory.THANKSGIVING]: 'Thanksgiving',
  [GameCategory.CHRISTMAS]: 'Christmas',
  [GameCategory.INTERNATIONAL]: 'International',
  [GameCategory.PLAYOFF]: 'Playoff',
  [GameCategory.OTHER]: 'Special',
};
