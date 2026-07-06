/** Home "Highlights" carousel + Knowledge Hub tiles — learning content. */

export interface Highlight {
  id: string;
  title: string;
  subtitle: string;
  colors: [string, string];
  route?: string;
}

export const HIGHLIGHTS: Highlight[] = [
  { id: 'how', title: 'How iClose works', subtitle: 'From inquiry to closing, in 4 simple steps', colors: ['#0071e3', '#4aa3ff'], route: '/tutorial' },
  { id: 'save', title: 'Never pay commission', subtitle: 'See exactly what you pay — and save', colors: ['#059669', '#34d399'], route: '/benefits' },
  { id: 'faq', title: 'Your questions, answered', subtitle: 'Fees, payouts, referrals & more', colors: ['#7c3aed', '#a78bfa'], route: '/faq' },
];

/** icon = lucide key mapped in the Home screen. */
export interface HubTile {
  id: string;
  title: string;
  subtitle: string;
  icon: 'video' | 'book' | 'help' | 'calc';
  route?: string;
  soon?: boolean;
}

export const HUB_TILES: HubTile[] = [
  { id: 'videos', title: 'Videos', subtitle: 'Short explainers', icon: 'video', soon: true },
  { id: 'guides', title: 'Guides', subtitle: 'Buying & closing', icon: 'book', route: '/tutorial' },
  { id: 'faq', title: 'FAQ', subtitle: 'Common questions', icon: 'help', route: '/faq' },
  { id: 'benefits', title: 'What you get', subtitle: 'Fees & savings', icon: 'calc', route: '/benefits' },
];
