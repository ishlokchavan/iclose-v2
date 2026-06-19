/** Mirrors lib/portal/listing-types.ts + lib/glass/experience-data.ts on the web. */
export interface Listing {
  id: string;
  reference: string;
  title: string;
  description: string;
  purpose: 'sale' | 'rent';
  completion: 'ready' | 'off_plan';
  category: 'residential' | 'commercial';
  propertyType: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'plot' | 'office' | 'retail';
  source: 'owner' | 'developer';
  city: string;
  community: string | null;
  building: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  priceAed: number;
  isVerified: boolean;
  coverImageUrl: string | null;
  amenities: string[];
  latitude?: number | null;
  longitude?: number | null;
  handoverBy?: string | null;
  paymentPlan?: string | null;
  developerName?: string | null;
  developerLogo?: string | null;
  agentName?: string | null;
  agencyName?: string | null;
}

export interface CreditAward {
  pct: number;
  valueAed: number;
  credits: number;
}

export interface ExperienceListing extends Listing {
  cover: string;
  images: string[];
  videos: string[];
  hook: string;
  credit: CreditAward;
}
