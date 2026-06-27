import type { ShareAsset } from '@/types/shares';

/**
 * Fallback offerings — mirror the seeded `shares_assets` rows. Used only when
 * Supabase is unreachable so the Shares tab always renders something (same
 * resilience pattern as seed-listings.ts). `id` is the symbol here; the live
 * rows carry real UUIDs used for on-chain RPC calls.
 */
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_373qi3JTSvYmXjqMPJT9idOjFt7';

export const SHARES_SEED: ShareAsset[] = [
  {
    id: 'PALM-V1', symbol: 'PALM-V1', listingReference: 'IC-1003',
    name: 'Signature Villa, Palm Jumeirah', city: 'Dubai', community: 'Palm Jumeirah',
    propertyType: 'villa', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003721_84f0c343-e903-4323-a3da-3cc2b40e1caf.png`,
    propertyValueAed: 22500000, tokenPriceAed: 500, totalTokens: 45000, tokensSold: 17100,
    grossYieldPct: 6.5, netYieldPct: 5.6, appreciationPct: 9, fundingDeadline: '2026-09-30',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0143', minTokens: 1,
    highlights: ['Beachfront plot', 'Private pool & beach', 'DLD-tokenized title'],
  },
  {
    id: 'DIFC-O1', symbol: 'DIFC-O1', listingReference: 'IC-1008',
    name: 'Index Tower Office, DIFC', city: 'Dubai', community: 'DIFC',
    propertyType: 'office', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003803_581d9c91-c1f7-4d15-82a0-fbf278dda5c2.png`,
    propertyValueAed: 18500000, tokenPriceAed: 500, totalTokens: 37000, tokensSold: 26640,
    grossYieldPct: 8.5, netYieldPct: 7.4, appreciationPct: 6, fundingDeadline: '2026-08-31',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0211', minTokens: 1,
    highlights: ['Grade-A commercial', 'Blue-chip tenant', 'High net yield'],
  },
  {
    id: 'CREEK-P1', symbol: 'CREEK-P1', listingReference: 'IC-1007',
    name: 'Penthouse, Dubai Creek Harbour', city: 'Dubai', community: 'Dubai Creek Harbour',
    propertyType: 'penthouse', completion: 'off_plan',
    coverImageUrl: `${CDN}/hf_20260617_003758_9cd1e39c-34f7-4254-b957-2794b4fd56b3.png`,
    propertyValueAed: 12800000, tokenPriceAed: 500, totalTokens: 25600, tokensSold: 14080,
    grossYieldPct: 7, netYieldPct: 6.1, appreciationPct: 11, fundingDeadline: '2026-12-31',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0298', minTokens: 1,
    highlights: ['Emaar off-plan', 'Skyline & creek views', 'High appreciation'],
  },
  {
    id: 'HILLS-T1', symbol: 'HILLS-T1', listingReference: 'IC-1005',
    name: 'Townhouse, Dubai Hills Estate', city: 'Dubai', community: 'Dubai Hills Estate',
    propertyType: 'townhouse', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003744_5e42a364-7075-48e6-b157-892501c6d8fd.png`,
    propertyValueAed: 4350000, tokenPriceAed: 500, totalTokens: 8700, tokensSold: 7917,
    grossYieldPct: 6.8, netYieldPct: 5.9, appreciationPct: 8, fundingDeadline: '2026-09-15',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0156', minTokens: 1,
    highlights: ['Family community', 'Park & golf access', 'Strong rental demand'],
  },
  {
    id: 'BAY-R1', symbol: 'BAY-R1', listingReference: 'IC-1016',
    name: 'Retail Unit, Business Bay', city: 'Dubai', community: 'Business Bay',
    propertyType: 'retail', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_003911_5c9fdb4b-ac4a-4cae-9f3a-f3d494dd6bfc.png`,
    propertyValueAed: 4200000, tokenPriceAed: 500, totalTokens: 8400, tokensSold: 8400,
    grossYieldPct: 9, netYieldPct: 7.9, appreciationPct: 6, fundingDeadline: '2026-07-31',
    status: 'funded', dldDeedRef: 'DLD-T-2026-0102', minTokens: 1,
    highlights: ['Fully funded', 'Long-lease tenant', 'Top-tier yield'],
  },
  {
    id: 'DT-A1', symbol: 'DT-A1', listingReference: 'IC-1001',
    name: 'Burj Vista Apartment, Downtown', city: 'Dubai', community: 'Downtown Dubai',
    propertyType: 'apartment', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_002543_e188c27d-1f7f-41a3-9c26-76506147c6bc.png`,
    propertyValueAed: 3200000, tokenPriceAed: 500, totalTokens: 6400, tokensSold: 2944,
    grossYieldPct: 6.5, netYieldPct: 5.7, appreciationPct: 8, fundingDeadline: '2026-10-31',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0177', minTokens: 1,
    highlights: ['Burj Khalifa view', 'Prime Downtown', 'Airbnb-ready'],
  },
  {
    id: 'MAR-A1', symbol: 'MAR-A1', listingReference: 'IC-1002',
    name: 'Marina Gate Apartment, Dubai Marina', city: 'Dubai', community: 'Dubai Marina',
    propertyType: 'apartment', completion: 'ready',
    coverImageUrl: `${CDN}/hf_20260617_002613_eb69892f-76ef-47ca-a325-f100e334818b.png`,
    propertyValueAed: 1850000, tokenPriceAed: 500, totalTokens: 3700, tokensSold: 3071,
    grossYieldPct: 7.2, netYieldPct: 6.3, appreciationPct: 7, fundingDeadline: '2026-08-15',
    status: 'funding', dldDeedRef: 'DLD-T-2026-0188', minTokens: 1,
    highlights: ['Waterfront living', 'High occupancy', 'Entry-level ticket'],
  },
  {
    id: 'YAS-A1', symbol: 'YAS-A1', listingReference: 'IC-1013',
    name: 'Yas Park Views, Yas Island', city: 'Abu Dhabi', community: 'Yas Island',
    propertyType: 'apartment', completion: 'off_plan',
    coverImageUrl: `${CDN}/hf_20260617_003839_2eff0b07-0f63-4bf6-aeb9-c6f2d09df01e.png`,
    propertyValueAed: 1490000, tokenPriceAed: 500, totalTokens: 2980, tokensSold: 805,
    grossYieldPct: 7.5, netYieldPct: 6.6, appreciationPct: 9, fundingDeadline: '2026-11-30',
    status: 'funding', dldDeedRef: 'ADGM-T-2026-0044', minTokens: 1,
    highlights: ['Aldar off-plan', 'Abu Dhabi growth corridor', 'Low entry point'],
  },
];
