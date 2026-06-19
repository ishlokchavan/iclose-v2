import type { Listing } from '@/types/listing';

/**
 * Seed listings — a faithful mirror of the web app's lib/portal/seed-listings.
 * Used only as an instant-render fallback until the live Supabase `listings`
 * table loads (or if it's unreachable). Real data always takes precedence.
 */
export const SEED_LISTINGS: Listing[] = [
  {
    id: 'seed-1', reference: 'IC-1001',
    title: '2-bed apartment with Burj Khalifa view', description: 'Bright two-bedroom in the heart of Downtown with floor-to-ceiling windows and a fitted kitchen.',
    purpose: 'sale', completion: 'ready', category: 'residential', propertyType: 'apartment', source: 'owner',
    city: 'Dubai', community: 'Downtown Dubai', building: 'Burj Vista',
    bedrooms: 2, bathrooms: 3, areaSqft: 1340, priceAed: 3200000,
    isVerified: true, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym', 'Concierge Service'], agentName: 'Sarah Al Mansoori', agencyName: 'Skyline Properties', latitude: 25.1972, longitude: 55.2744,
  },
  {
    id: 'seed-2', reference: 'IC-1002',
    title: 'Marina-facing 1-bed, high floor', description: 'High-floor one-bedroom overlooking the marina promenade, walking distance to the tram.',
    purpose: 'sale', completion: 'ready', category: 'residential', propertyType: 'apartment', source: 'developer',
    city: 'Dubai', community: 'Dubai Marina', building: 'Marina Gate',
    bedrooms: 1, bathrooms: 2, areaSqft: 820, priceAed: 1850000,
    isVerified: true, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym', 'Beach access'], agentName: 'James Whitfield', agencyName: 'Marina Estates', latitude: 25.0805, longitude: 55.1403,
  },
  {
    id: 'seed-3', reference: 'IC-1003',
    title: '4-bed signature villa on the Palm', description: 'Beachfront signature villa with private pool and direct sea access on Palm Jumeirah.',
    purpose: 'sale', completion: 'ready', category: 'residential', propertyType: 'villa', source: 'owner',
    city: 'Dubai', community: 'Palm Jumeirah', building: 'Signature Villas',
    bedrooms: 4, bathrooms: 5, areaSqft: 5200, priceAed: 22500000,
    isVerified: true, coverImageUrl: null, amenities: ['Private Pool', 'Beach access', 'Maids Room'], agentName: 'Mikhail Petrov', agencyName: 'Palm Luxury', latitude: 25.1124, longitude: 55.139,
  },
  {
    id: 'seed-4', reference: 'IC-1004',
    title: 'Off-plan studio in JVC', description: 'Smart studio in a new off-plan release with a flexible payment plan and handover in 2027.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'apartment', source: 'developer',
    city: 'Dubai', community: 'Jumeirah Village Circle', building: 'Binghatti Amber',
    bedrooms: 0, bathrooms: 1, areaSqft: 410, priceAed: 620000,
    isVerified: false, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym'], latitude: 25.0585, longitude: 55.209,
    handoverBy: 'Q2 2027', paymentPlan: '70/30', developerName: 'Binghatti', developerLogo: '/images/developers/binghatti.png',
  },
  {
    id: 'seed-5', reference: 'IC-1005',
    title: '3-bed townhouse in Dubai Hills', description: 'Family townhouse facing the park, close to Dubai Hills Mall and the golf course.',
    purpose: 'sale', completion: 'ready', category: 'residential', propertyType: 'townhouse', source: 'owner',
    city: 'Dubai', community: 'Dubai Hills Estate', building: 'Maple',
    bedrooms: 3, bathrooms: 4, areaSqft: 2100, priceAed: 4350000,
    isVerified: true, coverImageUrl: null, amenities: ['View of Landmark', 'Community pool', 'Private Garden'], agentName: 'Priya Nair', agencyName: 'Hills Realty', latitude: 25.103, longitude: 55.249,
  },
  {
    id: 'seed-6', reference: 'IC-1006',
    title: 'Furnished 2-bed with canal views in Business Bay', description: 'Furnished two-bedroom with canal views in the heart of Business Bay.',
    purpose: 'sale', completion: 'ready', category: 'residential', propertyType: 'apartment', source: 'owner',
    city: 'Dubai', community: 'Business Bay', building: 'Peninsula',
    bedrooms: 2, bathrooms: 2, areaSqft: 1100, priceAed: 2450000,
    isVerified: true, coverImageUrl: null, amenities: ['View of Water', 'Shared Gym', 'Furnished'], agentName: 'Omar Haddad', agencyName: 'Skyline Properties', latitude: 25.186, longitude: 55.262,
  },
  {
    id: 'seed-7', reference: 'IC-1007',
    title: 'Penthouse at Dubai Creek Harbour', description: 'Off-plan penthouse with panoramic creek and skyline views; signature tower.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'penthouse', source: 'developer',
    city: 'Dubai', community: 'Dubai Creek Harbour', building: 'Creek Edge',
    bedrooms: 4, bathrooms: 5, areaSqft: 3800, priceAed: 12800000,
    isVerified: false, coverImageUrl: null, amenities: ['View of Landmark', 'Private lift', 'Shared Pool'], latitude: 25.207, longitude: 55.35,
    handoverBy: 'Q4 2027', paymentPlan: '80/20', developerName: 'Emaar', developerLogo: '/images/developers/emaar.svg',
  },
  {
    id: 'seed-8', reference: 'IC-1008',
    title: 'DIFC office for sale, fitted & ready', description: 'Grade-A fitted office floor in DIFC, ready for occupation with covered parking.',
    purpose: 'sale', completion: 'ready', category: 'commercial', propertyType: 'office', source: 'developer',
    city: 'Dubai', community: 'DIFC', building: 'Index Tower',
    bedrooms: null, bathrooms: 2, areaSqft: 3400, priceAed: 18500000,
    isVerified: true, coverImageUrl: null, amenities: ['Fitted', 'Covered Parking', 'Reception'], agentName: 'Li Wei', agencyName: 'Creek Harbour Homes', latitude: 25.213, longitude: 55.281,
  },
  {
    id: 'seed-9', reference: 'IC-1009',
    title: '5-bed villa in Arabian Ranches', description: 'Upgraded five-bedroom family villa on a large plot with a private garden and pool.',
    purpose: 'sale', completion: 'ready', category: 'residential', propertyType: 'villa', source: 'owner',
    city: 'Dubai', community: 'Arabian Ranches', building: 'Alvorada',
    bedrooms: 5, bathrooms: 6, areaSqft: 6100, priceAed: 9750000,
    isVerified: true, coverImageUrl: null, amenities: ['Private Pool', 'Private Garden', 'Maids Room'], agentName: 'Priya Nair', agencyName: 'Hills Realty', latitude: 25.052, longitude: 55.27,
  },
  {
    id: 'seed-10', reference: 'IC-1010',
    title: 'Creek Bay by Emaar', description: 'Waterfront 1–3 bedroom apartments at Dubai Creek Harbour with skyline and creek views.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'apartment', source: 'developer',
    city: 'Dubai', community: 'Dubai Creek Harbour', building: 'Creek Bay',
    bedrooms: 1, bathrooms: 1, areaSqft: 720, priceAed: 1797888,
    isVerified: true, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym', 'View of Water'], latitude: 25.201, longitude: 55.353,
    handoverBy: 'Q1 2028', paymentPlan: '90/10', developerName: 'Emaar', developerLogo: '/images/developers/emaar.svg',
  },
  {
    id: 'seed-11', reference: 'IC-1011',
    title: 'DAMAC Islands', description: 'Off-plan townhouses and villas in a new island community with lagoons and beaches.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'townhouse', source: 'developer',
    city: 'Dubai', community: 'DAMAC Islands', building: 'Islands',
    bedrooms: 4, bathrooms: 5, areaSqft: 2400, priceAed: 2490000,
    isVerified: true, coverImageUrl: null, amenities: ['Lagoon', 'Beach access', 'Clubhouse'], latitude: 24.92, longitude: 55.2,
    handoverBy: 'Q4 2028', paymentPlan: '75/25', developerName: 'Damac', developerLogo: '/images/developers/damac.svg',
  },
  {
    id: 'seed-12', reference: 'IC-1012',
    title: 'The Brooks at Sobha Sanctuary', description: 'Premium off-plan apartments and villas in a green master community.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'apartment', source: 'developer',
    city: 'Dubai', community: 'Sobha Sanctuary', building: 'The Brooks',
    bedrooms: 2, bathrooms: 3, areaSqft: 1250, priceAed: 3995908,
    isVerified: true, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym', 'Park'], latitude: 25.15, longitude: 55.3,
    handoverBy: 'Q2 2029', paymentPlan: '60/40', developerName: 'Sobha', developerLogo: '/images/developers/sobha.svg',
  },
  {
    id: 'seed-13', reference: 'IC-1013',
    title: 'Yas Park Views by Aldar', description: 'Off-plan apartments on Yas Island, Abu Dhabi with island and park views.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'apartment', source: 'developer',
    city: 'Abu Dhabi', community: 'Yas Island', building: 'Yas Park Views',
    bedrooms: 2, bathrooms: 3, areaSqft: 1100, priceAed: 1490000,
    isVerified: true, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym', 'Park'], latitude: 24.498, longitude: 54.607,
    handoverBy: 'Q1 2029', paymentPlan: '60/40', developerName: 'Aldar', developerLogo: 'https://d1fikckodunwer.cloudfront.net/e808f446-2eac-41e3-a0df-3e0849fd64ba',
  },
  {
    id: 'seed-14', reference: 'IC-1014',
    title: 'Aljada by Arada', description: 'Off-plan apartments in Sharjah’s largest mixed-use community, Aljada.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'apartment', source: 'developer',
    city: 'Sharjah', community: 'Aljada', building: 'Aljada',
    bedrooms: 1, bathrooms: 1, areaSqft: 650, priceAed: 700000,
    isVerified: true, coverImageUrl: null, amenities: ['Shared Pool', 'Shared Gym', 'Retail'], latitude: 25.327, longitude: 55.515,
    handoverBy: 'Q4 2027', paymentPlan: '50/50', developerName: 'Arada', developerLogo: 'https://d1fikckodunwer.cloudfront.net/d24498d2-c623-476a-a82f-63ded0bfb59a',
  },
  {
    id: 'seed-15', reference: 'IC-1015',
    title: 'Falcon Island by Al Hamra', description: 'Off-plan beachfront villas on Al Hamra’s Falcon Island, Ras Al Khaimah.',
    purpose: 'sale', completion: 'off_plan', category: 'residential', propertyType: 'villa', source: 'developer',
    city: 'Ras Al Khaimah', community: 'Al Hamra Village', building: 'Falcon Island',
    bedrooms: 4, bathrooms: 5, areaSqft: 3500, priceAed: 2300000,
    isVerified: true, coverImageUrl: null, amenities: ['Beach access', 'Private Pool', 'Marina'], latitude: 25.683, longitude: 55.778,
    handoverBy: 'Q2 2028', paymentPlan: '70/30', developerName: 'Al Hamra', developerLogo: 'https://d1fikckodunwer.cloudfront.net/dc32e8b3-6aef-4397-807c-03616743ff12',
  },
  {
    id: 'seed-16', reference: 'IC-1016',
    title: 'Retail unit for sale in Business Bay', description: 'Ground-floor retail/showroom unit with high footfall on the Business Bay canal.',
    purpose: 'sale', completion: 'ready', category: 'commercial', propertyType: 'retail', source: 'developer',
    city: 'Dubai', community: 'Business Bay', building: 'Bay Square',
    bedrooms: null, bathrooms: 1, areaSqft: 1450, priceAed: 4200000,
    isVerified: true, coverImageUrl: null, amenities: ['Street access', 'Parking', 'Glass frontage'],
    agentName: 'Omar Haddad', agencyName: 'Skyline Properties', latitude: 25.188, longitude: 55.265,
  },
];

/** Lightweight seed filter mirroring the web's filterSeed. */
export function filterSeed(filters: { purpose?: 'sale' | 'rent'; completion?: 'ready' | 'off_plan'; q?: string; limit?: number } = {}): Listing[] {
  let out = SEED_LISTINGS.slice();
  if (filters.purpose) out = out.filter((l) => l.purpose === filters.purpose);
  if (filters.completion) out = out.filter((l) => l.completion === filters.completion);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter((l) => (l.community ?? '').toLowerCase().includes(q));
  }
  return out.slice(0, filters.limit ?? out.length);
}
