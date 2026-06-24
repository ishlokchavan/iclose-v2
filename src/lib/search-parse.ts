/**
 * Natural-language search → structured filters. A client-side port of the
 * deterministic parser in the web app's /api/glass/search-parse route, so the
 * native app needs no backend/Gemini call to understand "2-bed near the marina
 * under 2M with a pool".
 */

const TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'office', 'retail', 'plot'] as const;
const AMENITY_TOKENS = ['pool', 'beach', 'gym', 'maid', 'furnished', 'view', 'garden', 'balcony', 'parking', 'study'] as const;

export interface ParsedFilters {
  completion: 'ready' | 'off_plan' | null;
  types: string[];
  minBeds: number | null;
  maxBeds: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  community: string | null;
  amenities: string[];
  q: string;
}

export function emptyFilters(): ParsedFilters {
  return {
    completion: null,
    types: [],
    minBeds: null,
    maxBeds: null,
    minPrice: null,
    maxPrice: null,
    community: null,
    amenities: [],
    q: '',
  };
}

/** "2m" -> 2_000_000, "800k" -> 800_000, "1.5 million" -> 1_500_000. */
function toAed(raw: string): number {
  const s = raw.toLowerCase().replace(/,/g, '').trim();
  const num = parseFloat(s.replace(/[^\d.]/g, ''));
  if (!isFinite(num)) return 0;
  if (/m|million/.test(s)) return Math.round(num * 1_000_000);
  if (/k|thousand/.test(s)) return Math.round(num * 1_000);
  if (num < 1000) return Math.round(num * 1_000_000);
  return Math.round(num);
}

export function parseSearch(query: string, communities: string[]): ParsedFilters {
  const out = emptyFilters();
  const q = query.toLowerCase();

  if (/(off[\s-]?plan|new launch|under construction|payment plan)/.test(q)) out.completion = 'off_plan';
  else if (/(ready|move[\s-]?in|completed|secondary)/.test(q)) out.completion = 'ready';

  const typeMap: Record<string, string> = {
    apartment: 'apartment', flat: 'apartment', villa: 'villa', townhouse: 'townhouse',
    penthouse: 'penthouse', office: 'office', retail: 'retail', shop: 'retail', plot: 'plot', land: 'plot',
  };
  for (const [word, type] of Object.entries(typeMap)) {
    if (new RegExp(`\\b${word}s?\\b`).test(q) && !out.types.includes(type)) out.types.push(type);
  }

  if (/\bstudio\b/.test(q)) {
    out.minBeds = 0;
    out.maxBeds = 0;
  } else {
    const range = q.match(/(\d+)\s*(?:to|-|–)\s*(\d+)\s*(?:bed|bedroom|br\b)/);
    const plus = q.match(/(\d+)[\s-]*\+?[\s-]*(?:bed|bedroom|br\b)/);
    if (range) {
      out.minBeds = Number(range[1]);
      out.maxBeds = Number(range[2]);
    } else if (plus) {
      const n = Number(plus[1]);
      out.minBeds = n;
      if (!/\+|plus|at least|minimum|or more/.test(q)) out.maxBeds = n;
    }
  }

  const between = q.match(/between\s+([\d.,]+\s*[mk]?)\s+(?:and|to|-|–)\s+([\d.,]+\s*[mk]?)/);
  if (between) {
    out.minPrice = toAed(between[1]);
    out.maxPrice = toAed(between[2]);
  } else {
    const under = q.match(/(?:under|below|less than|up to|max|max\.|maximum|within)\s+([\d.,]+\s*(?:m|k|million|thousand)?)/);
    const over = q.match(/(?:over|above|more than|from|min|minimum|at least)\s+([\d.,]+\s*(?:m|k|million|thousand)?)/);
    if (under) out.maxPrice = toAed(under[1]);
    if (over) out.minPrice = toAed(over[1]);
    if (!under && !over) {
      const bare = q.match(/([\d.,]+\s*(?:m|k|million|thousand|aed)\b)/);
      if (bare && /budget|price|around|aed/.test(q)) out.maxPrice = toAed(bare[1]);
    }
  }

  let best = '';
  for (const c of communities) {
    const cl = c.toLowerCase();
    if (q.includes(cl) && cl.length > best.length) best = c;
  }
  const NICK: Record<string, string> = {
    marina: 'Dubai Marina', downtown: 'Downtown Dubai', palm: 'Palm Jumeirah',
    jbr: 'JBR', jvc: 'JVC', creek: 'Dubai Creek Harbour', hills: 'Dubai Hills Estate',
    'business bay': 'Business Bay',
  };
  if (!best) {
    for (const [nick, canonical] of Object.entries(NICK)) {
      if (q.includes(nick)) {
        const match = communities.find((c) => c.toLowerCase() === canonical.toLowerCase());
        best = match ?? canonical;
        break;
      }
    }
  }
  if (best) out.community = best;

  for (const tok of AMENITY_TOKENS) {
    const synonyms: Record<string, RegExp> = {
      pool: /pool|swimming/, beach: /beach|waterfront|sea|water/, gym: /gym|fitness/,
      maid: /maid|servant/, furnished: /furnished/, view: /view|skyline/,
      garden: /garden|landscap/, balcony: /balcony|terrace/, parking: /parking|garage/, study: /study|home office/,
    };
    if ((synonyms[tok] ?? new RegExp(tok)).test(q)) out.amenities.push(tok);
  }

  return out;
}
