/** UAE emirates and their common communities/districts, for the location picker. */

export const COUNTRY = 'United Arab Emirates';

export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'] as const;
export type Emirate = (typeof EMIRATES)[number];

export const DISTRICTS: Record<Emirate, string[]> = {
  Dubai: [
    'Dubai Marina', 'Downtown Dubai', 'Business Bay', 'Palm Jumeirah', 'Jumeirah Village Circle', 'Jumeirah Lake Towers',
    'Arabian Ranches', 'Dubai Hills Estate', 'Damac Hills', 'Damac Hills 2', 'Emaar Beachfront', 'Dubai Creek Harbour',
    'Mohammed Bin Rashid City', 'Meydan', 'DIFC', 'Jumeirah Beach Residence', 'Bluewaters Island', 'City Walk',
    'Al Barsha', 'Motor City', 'Dubai Sports City', 'Dubailand', 'Town Square', 'Al Furjan', 'Mudon', 'Tilal Al Ghaf',
    'Emirates Hills', 'The Springs', 'The Meadows', 'The Greens', 'Discovery Gardens', 'International City',
    'Dubai Silicon Oasis', 'Jumeirah', 'Umm Suqeim', 'Deira', 'Bur Dubai', 'Al Jaddaf', 'Za’abeel', 'The Valley',
  ],
  'Abu Dhabi': [
    'Yas Island', 'Saadiyat Island', 'Al Reem Island', 'Al Raha Beach', 'Al Maryah Island', 'Corniche',
    'Khalifa City', 'Al Reef', 'Masdar City', 'Mohammed Bin Zayed City', 'Al Ghadeer', 'Al Bateen', 'Al Shamkha',
  ],
  Sharjah: ['Aljada', 'Tilal City', 'Muwaileh', 'Al Majaz', 'Al Khan', 'Maryam Island', 'Al Mamsha', 'Al Nahda'],
  Ajman: ['Al Nuaimiya', 'Al Rashidiya', 'Ajman Corniche', 'Al Zorah', 'Emirates City'],
  'Ras Al Khaimah': ['Al Hamra Village', 'Mina Al Arab', 'Al Marjan Island', 'Al Nakheel'],
  Fujairah: ['Fujairah City', 'Dibba', 'Al Faseel'],
  'Umm Al Quwain': ['Umm Al Quwain Marina', 'Al Salamah', 'Al Raas'],
};
