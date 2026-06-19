import type { ExperienceListing } from '@/types/listing';

/**
 * Deterministic behavioural recommender — ported verbatim from the web app's
 * lib/glass/recommender.ts. Every interaction adjusts per-facet affinity scores;
 * a listing's score is the sum of the user's affinity for its facets.
 */

export const SIGNAL_WEIGHTS = {
  view: 4,
  dwell: 20,
  details: 20,
  save: 50,
  share: 40,
  like: 50,
  viewing: 80,
  whatsapp: 70,
  call: 70,
  offer: 100,
  skip: -15,
  dislike: -60,
} as const;

export type SignalType = keyof typeof SIGNAL_WEIGHTS;
export type Affinity = Record<string, number>;

function priceBand(p: number): string {
  if (p < 1_000_000) return '<1M';
  if (p < 2_000_000) return '1-2M';
  if (p < 5_000_000) return '2-5M';
  if (p < 10_000_000) return '5-10M';
  return '10M+';
}

function bedBand(b: number | null): string {
  if (b == null) return 'na';
  if (b === 0) return 'studio';
  if (b >= 4) return '4plus';
  return String(b);
}

/** Stable facet keys describing a listing. */
export function facetsOf(l: ExperienceListing): string[] {
  return [
    `community:${l.community ?? 'na'}`,
    `city:${l.city}`,
    `developer:${l.developerName ?? l.agencyName ?? 'na'}`,
    `type:${l.propertyType}`,
    `beds:${bedBand(l.bedrooms)}`,
    `price:${priceBand(l.priceAed)}`,
    `completion:${l.completion}`,
  ];
}

export function applySignal(affinity: Affinity, listing: ExperienceListing, weight: number): Affinity {
  const next = { ...affinity };
  for (const facet of facetsOf(listing)) next[facet] = (next[facet] ?? 0) + weight;
  return next;
}

export function scoreListing(affinity: Affinity, listing: ExperienceListing): number {
  let score = 0;
  for (const facet of facetsOf(listing)) score += affinity[facet] ?? 0;
  return score;
}

/** Rank not-yet-seen listings by score (with novelty jitter); seen go last. */
export function rankUpcoming(
  listings: ExperienceListing[],
  affinity: Affinity,
  seen: Set<string>,
  dismissed: Set<string>,
): ExperienceListing[] {
  const pool = listings.filter((l) => !dismissed.has(l.reference));
  const unseen = pool.filter((l) => !seen.has(l.reference));
  const seenList = pool.filter((l) => seen.has(l.reference));
  const ranked = unseen
    .map((l) => ({ l, score: scoreListing(affinity, l) + Math.random() * 6 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.l);
  return [...ranked, ...seenList];
}
