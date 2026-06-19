import { API_BASE_URL } from './config';
import type { ExperienceListing } from '@/types/listing';

/** Calls the existing Next.js backend (/api/glass/*) on the deployed site. */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  /** Live listings feed — mirrors the web ExperienceProvider upgrade. */
  listings: () => get<{ listings: ExperienceListing[] }>('/api/glass/listings'),
  /** AI "why this fits you" explanation for a listing. */
  why: (reference: string) => post<{ reason: string }>('/api/glass/why', { reference }),
  /** Natural-language search parsing into structured filters. */
  searchParse: (query: string) => post<{ filters: Record<string, unknown> }>('/api/glass/search-parse', { query }),
};
