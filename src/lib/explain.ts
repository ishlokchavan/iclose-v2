import type { Affinity } from './recommender';
import { facetsOf } from './recommender';
import type { ExperienceListing } from '@/types/listing';

/**
 * Human-readable "why this fits you" explanations — ported from the web app's
 * lib/glass/explain.ts. Derived from the same affinity the recommender uses, so
 * it always renders instantly with no AI/backend dependency.
 */

const LABELS: Record<string, (v: string) => string> = {
  community: (v) => `homes in ${v}`,
  city: (v) => `${v}`,
  developer: (v) => `${v} projects`,
  type: (v) => `${pluralType(v)}`,
  beds: (v) => (v === 'studio' ? 'studios' : v === '4plus' ? '4+ bedroom homes' : `${v}-bedroom homes`),
  price: (v) => `homes around the ${v} range`,
  completion: (v) => (v === 'off_plan' ? 'off-plan launches' : 'ready homes'),
};

function pluralType(t: string): string {
  if (t === 'penthouse') return 'penthouses';
  if (t === 'retail') return 'retail units';
  if (t === 'office') return 'offices';
  return `${t}s`;
}

function phrase(facet: string): string {
  const idx = facet.indexOf(':');
  const k = facet.slice(0, idx);
  const v = facet.slice(idx + 1);
  return LABELS[k] ? LABELS[k](v) : v;
}

export function matchingFacets(
  affinity: Affinity,
  listing: ExperienceListing,
): { facet: string; score: number }[] {
  return facetsOf(listing)
    .map((facet) => ({ facet, score: affinity[facet] ?? 0 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function likedPhrases(affinity: Affinity, max = 4): string[] {
  return Object.entries(affinity)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([facet]) => phrase(facet));
}

/** Instant, no-AI explanation. */
export function deterministicReason(affinity: Affinity, listing: ExperienceListing): string {
  const top = matchingFacets(affinity, listing).slice(0, 2);
  if (top.length === 0) {
    return `${listing.hook} in ${listing.community}. Save a few homes you like and your feed will start matching your taste.`;
  }
  const parts = top.map((x) => phrase(x.facet));
  const joined = parts.length === 2 ? `${parts[0]} and ${parts[1]}` : parts[0];
  return `You've been into ${joined} — this one lines up.`;
}
