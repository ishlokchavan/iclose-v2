/**
 * Shared list helpers: day-wise grouping (Today / Yesterday / date) and
 * time-period filtering (today, 7d, 30d, custom range) used by every list
 * screen in the app and admin console.
 */

export type Period = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface PeriodState {
  period: Period;
  /** Custom range bounds (inclusive), only when period === 'custom'. */
  from?: Date | null;
  to?: Date | null;
}

export const PERIOD_LABEL: Record<Period, string> = {
  all: 'All time',
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom',
};

export const PERIOD_ORDER: Period[] = ['all', 'today', 'yesterday', '7d', '30d', 'custom'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function inPeriod(iso: string, p: PeriodState): boolean {
  if (p.period === 'all') return true;
  const t = new Date(iso).getTime();
  const today0 = startOfDay(new Date()).getTime();
  const DAY = 86_400_000;
  switch (p.period) {
    case 'today': return t >= today0;
    case 'yesterday': return t >= today0 - DAY && t < today0;
    case '7d': return t >= today0 - 6 * DAY;
    case '30d': return t >= today0 - 29 * DAY;
    case 'custom': {
      const from = p.from ? startOfDay(p.from).getTime() : -Infinity;
      const to = p.to ? startOfDay(p.to).getTime() + DAY : Infinity;
      return t >= from && t < to;
    }
  }
}

/** "Today" / "Yesterday" / "Mon, 6 Jul" / "6 Jul 2025" (older years). */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const day0 = startOfDay(d).getTime();
  const today0 = startOfDay(new Date()).getTime();
  const DAY = 86_400_000;
  if (day0 === today0) return 'Today';
  if (day0 === today0 - DAY) return 'Yesterday';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-GB', sameYear
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Group (already sorted) items into [dayLabel, items[]] preserving order. */
export function groupByDay<T>(items: T[], getDate: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = dayLabel(getDate(it));
    const arr = map.get(k);
    if (arr) arr.push(it);
    else map.set(k, [it]);
  }
  return Array.from(map.entries());
}

export type SortDir = 'newest' | 'oldest';

export function sortByDate<T>(items: T[], getDate: (item: T) => string, dir: SortDir): T[] {
  return [...items].sort((a, b) => {
    const d = +new Date(getDate(a)) - +new Date(getDate(b));
    return dir === 'newest' ? -d : d;
  });
}
