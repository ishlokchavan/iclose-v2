import type { ShareAsset } from '@/types/shares';

/**
 * Fallback offerings — mirror the seeded `shares_assets` rows. Used only when
 * Supabase is unreachable so the Shares tab always renders something (same
 * resilience pattern as seed-listings.ts). Token model: total_tokens =
 * area_sqft × 1,000; token_price = property_value ÷ total_tokens.
 */
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_373qi3JTSvYmXjqMPJT9idOjFt7';

export const SHARES_SEED: ShareAsset[] = [
  {
    id: 'PALM-V1', symbol: 'PALM-V1', listingReference: 'IC-1003',
    name: 'Signature Villa, Palm Jumeirah', city: 'Dubai', community: 'Palm Jumeirah',
    propertyType: 'villa', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003721_84f0c343-e903-4323-a3da-3cc2b40e1caf.png`,
    propertyValueAed: 22500000, tokenPriceAed: 4.33, totalTokens: 5200000, tokensSold: 1976000,
    grossYieldPct: 6.5, netYieldPct: 5.6, appreciationPct: 9, fundingDeadline: '2026-09-30',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0143', minTokens: 115,
    highlights: ['Beachfront plot', 'Private pool & beach', 'DLD-tokenized title'],
    marketValueAed: 25875000, discountPct: 0, investorCount: 47,
  },
  {
    id: 'DIFC-O1', symbol: 'DIFC-O1', listingReference: 'IC-1008',
    name: 'Index Tower Office, DIFC', city: 'Dubai', community: 'DIFC',
    propertyType: 'office', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003803_581d9c91-c1f7-4d15-82a0-fbf278dda5c2.png`,
    propertyValueAed: 18500000, tokenPriceAed: 5.44, totalTokens: 3400000, tokensSold: 2448000,
    grossYieldPct: 8.5, netYieldPct: 7.4, appreciationPct: 6, fundingDeadline: '2026-08-31',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0211', minTokens: 91,
    highlights: ['Grade-A commercial', 'Blue-chip tenant', 'High net yield'],
    marketValueAed: 20350000, discountPct: 5, investorCount: 63,
  },
  {
    id: 'CREEK-P1', symbol: 'CREEK-P1', listingReference: 'IC-1007',
    name: 'Penthouse, Dubai Creek Harbour', city: 'Dubai', community: 'Dubai Creek Harbour',
    propertyType: 'penthouse', completion: 'off_plan',
    coverImageUrl: `${CDN}/hf_20260617_003758_9cd1e39c-34f7-4254-b957-2794b4fd56b3.png`,
    propertyValueAed: 12800000, tokenPriceAed: 3.37, totalTokens: 3800000, tokensSold: 2090000,
    grossYieldPct: 7, netYieldPct: 6.1, appreciationPct: 11, fundingDeadline: '2026-12-31',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0298', minTokens: 148,
    highlights: ['Emaar off-plan', 'Skyline & creek views', 'High appreciation'],
    marketValueAed: 15616000, discountPct: 10, investorCount: 38,
  },
  {
    id: 'HILLS-T1', symbol: 'HILLS-T1', listingReference: 'IC-1005',
    name: 'Townhouse, Dubai Hills Estate', city: 'Dubai', community: 'Dubai Hills Estate',
    propertyType: 'townhouse', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003744_5e42a364-7075-48e6-b157-892501c6d8fd.png`,
    propertyValueAed: 4350000, tokenPriceAed: 2.07, totalTokens: 2100000, tokensSold: 1911000,
    grossYieldPct: 6.8, netYieldPct: 5.9, appreciationPct: 8, fundingDeadline: '2026-09-15',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0156', minTokens: 241,
    highlights: ['Family community', 'Park & golf access', 'Strong rental demand'],
    marketValueAed: 4959000, discountPct: 0, investorCount: 91,
  },
  {
    id: 'BAY-R1', symbol: 'BAY-R1', listingReference: 'IC-1016',
    name: 'Retail Unit, Business Bay', city: 'Dubai', community: 'Business Bay',
    propertyType: 'retail', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003911_5c9fdb4b-ac4a-4cae-9f3a-f3d494dd6bfc.png`,
    propertyValueAed: 4200000, tokenPriceAed: 2.90, totalTokens: 1450000, tokensSold: 1450000,
    grossYieldPct: 9, netYieldPct: 7.9, appreciationPct: 6, fundingDeadline: '2026-07-31',
    status: 'funded', dldDeedRef: 'DLD-T-2026-0102', minTokens: 172,
    highlights: ['Fully funded', 'Long-lease tenant', 'Top-tier yield'],
    marketValueAed: 4578000, discountPct: 0, investorCount: 120,
  },
  {
    id: 'DT-A1', symbol: 'DT-A1', listingReference: 'IC-1001',
    name: 'Burj Vista Apartment, Downtown', city: 'Dubai', community: 'Downtown Dubai',
    propertyType: 'apartment', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_002543_e188c27d-1f7f-41a3-9c26-76506147c6bc.png`,
    propertyValueAed: 3200000, tokenPriceAed: 2.39, totalTokens: 1340000, tokensSold: 616400,
    grossYieldPct: 6.5, netYieldPct: 5.7, appreciationPct: 8, fundingDeadline: '2026-10-31',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0177', minTokens: 209,
    highlights: ['Burj Khalifa view', 'Prime Downtown', 'Airbnb-ready'],
    marketValueAed: 3776000, discountPct: 10, investorCount: 24,
  },
  {
    id: 'MAR-A1', symbol: 'MAR-A1', listingReference: 'IC-1002',
    name: 'Marina Gate Apartment, Dubai Marina', city: 'Dubai', community: 'Dubai Marina',
    propertyType: 'apartment', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_002613_eb69892f-76ef-47ca-a325-f100e334818b.png`,
    propertyValueAed: 1850000, tokenPriceAed: 2.26, totalTokens: 820000, tokensSold: 680600,
    grossYieldPct: 7.2, netYieldPct: 6.3, appreciationPct: 7, fundingDeadline: '2026-08-15',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0188', minTokens: 221,
    highlights: ['Waterfront living', 'High occupancy', 'Entry-level ticket'],
    marketValueAed: 2053500, discountPct: 5, investorCount: 56,
  },
  {
    id: 'YAS-A1', symbol: 'YAS-A1', listingReference: 'IC-1013',
    name: 'Yas Park Views, Yas Island', city: 'Abu Dhabi', community: 'Yas Island',
    propertyType: 'apartment', completion: 'off_plan',
    coverImageUrl: `${CDN}/hf_20260617_003839_2eff0b07-0f63-4bf6-aeb9-c6f2d09df01e.png`,
    propertyValueAed: 1490000, tokenPriceAed: 1.35, totalTokens: 1100000, tokensSold: 297000,
    grossYieldPct: 7.5, netYieldPct: 6.6, appreciationPct: 9, fundingDeadline: '2026-11-30',
    status: 'funding', dldDeedRef: 'ADGM-T-2026-0044', minTokens: 370,
    highlights: ['Aldar off-plan', 'Abu Dhabi growth corridor', 'Low entry point'],
    marketValueAed: 1788000, discountPct: 10, investorCount: 12,
  },
];
