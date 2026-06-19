import { API_BASE_URL } from './config';

/** Calls the existing Next.js backend on the deployed site. */
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return (await res.json()) as T;
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
  /** Submit a new owner listing (commission-free) — same /api/listing route as web. */
  createListing: (draft: ListingDraft) =>
    post<{ ok: boolean; reference?: string }>('/api/listing', draft),
};
