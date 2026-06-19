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

export interface EnquiryInput {
  reference: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
}

export interface ListingDraft {
  title: string;
  purpose: 'sale' | 'rent';
  propertyType: string;
  community: string;
  city: string;
  priceAed: number;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  description: string;
  contactName: string;
  contactPhone: string;
}

export const api = {
  /** Live listings feed — mirrors the web ExperienceProvider upgrade. */
  listings: () => get<{ listings: ExperienceListing[] }>('/api/glass/listings'),
  /** AI "why this fits you" explanation for a listing. */
  why: (reference: string) => post<{ reason: string }>('/api/glass/why', { reference }),
  /** Natural-language search parsing into structured filters. */
  searchParse: (query: string) =>
    post<{ filters: SearchFilters }>('/api/glass/search-parse', { query }),
  /** Submit a buyer enquiry / lead for a listing. */
  enquire: (input: EnquiryInput) => post<{ ok: boolean }>('/api/glass/enquire', input),
  /** Submit a new owner listing (commission-free). */
  createListing: (draft: ListingDraft) =>
    post<{ ok: boolean; reference?: string }>('/api/listing', draft),
};

/** Structured filters the NL search parser can return. */
export interface SearchFilters {
  query?: string;
  completion?: 'ready' | 'off_plan';
  propertyType?: string;
  community?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
}
