import type { ExperienceListing } from '@/types/listing';

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_373qi3JTSvYmXjqMPJT9idOjFt7';

function mk(p: Partial<ExperienceListing> & Pick<ExperienceListing,
  'reference' | 'title' | 'community' | 'priceAed' | 'cover' | 'hook' | 'credit'>): ExperienceListing {
  return {
    id: p.reference,
    description: p.description ?? '',
    purpose: 'sale',
    completion: p.completion ?? 'ready',
    category: 'residential',
    propertyType: p.propertyType ?? 'apartment',
    source: p.source ?? 'developer',
    city: 'Dubai',
    building: null,
    bedrooms: p.bedrooms ?? 2,
    bathrooms: p.bathrooms ?? 2,
    areaSqft: p.areaSqft ?? 1100,
    isVerified: true,
    coverImageUrl: p.cover,
    amenities: p.amenities ?? ['Pool', 'Gym', 'Parking'],
    latitude: p.latitude ?? 25.08,
    longitude: p.longitude ?? 55.14,
    developerName: p.developerName ?? null,
    images: p.images ?? [p.cover],
    videos: p.videos ?? [],
    ...p,
  } as ExperienceListing;
}

/** Instant-render seed. Live data replaces this once /api/glass/listings loads. */
export const SEED_LISTINGS: ExperienceListing[] = [
  mk({
    reference: 'IC-1001', title: 'Marina-view 2BR with floor-to-ceiling glass',
    community: 'Dubai Marina', priceAed: 2_650_000, bedrooms: 2, areaSqft: 1180,
    cover: `${CDN}/hf_20260617_002543_e188c27d-1f7f-41a3-9c26-76506147c6bc.png`,
    developerName: 'Emaar', completion: 'ready',
    hook: 'Wake up over the yachts — and skip the 2% commission.',
    credit: { pct: 2, valueAed: 53_000, credits: 53_000 },
  }),
  mk({
    reference: 'IC-1003', title: 'Off-plan penthouse, payment plan to 2027',
    community: 'Business Bay', priceAed: 4_900_000, bedrooms: 3, areaSqft: 2100,
    propertyType: 'penthouse', cover: `${CDN}/hf_20260617_003721_84f0c343-e903-4323-a3da-3cc2b40e1caf.png`,
    developerName: 'Damac', completion: 'off_plan',
    hook: 'Earn 294K credits back on this launch.',
    credit: { pct: 6, valueAed: 294_000, credits: 294_000 },
  }),
  mk({
    reference: 'IC-1005', title: 'Beachfront villa, private pool',
    community: 'Palm Jumeirah', priceAed: 12_500_000, bedrooms: 4, areaSqft: 5200,
    propertyType: 'villa', cover: `${CDN}/hf_20260617_003744_5e42a364-7075-48e6-b157-892501c6d8fd.png`,
    developerName: 'Sobha', completion: 'ready',
    hook: 'The Palm address, none of the brokerage fees.',
    credit: { pct: 2, valueAed: 250_000, credits: 250_000 },
  }),
  mk({
    reference: 'IC-1008', title: 'Downtown 1BR steps from the fountain',
    community: 'Downtown Dubai', priceAed: 1_850_000, bedrooms: 1, areaSqft: 720,
    cover: `${CDN}/hf_20260617_003803_581d9c91-c1f7-4d15-82a0-fbf278dda5c2.png`,
    developerName: 'Emaar', completion: 'ready',
    hook: 'Burj views on a starter budget.',
    credit: { pct: 2, valueAed: 37_000, credits: 37_000 },
  }),
  mk({
    reference: 'IC-1011', title: 'Off-plan townhouse in a gated community',
    community: 'Arabian Ranches', priceAed: 3_400_000, bedrooms: 3, areaSqft: 2400,
    propertyType: 'townhouse', cover: `${CDN}/hf_20260617_003825_03c046dc-5c3c-4edc-ad64-c1bee05bdc1d.png`,
    developerName: 'Arada', completion: 'off_plan',
    hook: 'Family living with 170K credits back.',
    credit: { pct: 5, valueAed: 170_000, credits: 170_000 },
  }),
  mk({
    reference: 'IC-1014', title: 'Sky-collection 2BR, branded residence',
    community: 'Dubai Hills Estate', priceAed: 3_100_000, bedrooms: 2, areaSqft: 1340,
    cover: `${CDN}/hf_20260617_003850_49dffc4f-2d9d-438f-8cd6-9e5722f8377e.png`,
    developerName: 'Meraas', completion: 'off_plan',
    hook: 'Golf-course frontage, 170K credits.',
    credit: { pct: 5.5, valueAed: 170_500, credits: 170_500 },
  }),
];
