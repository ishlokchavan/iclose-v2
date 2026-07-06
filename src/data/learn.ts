/** Home "Highlights" carousel + Knowledge Hub video cards. */

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
  { id: 'faq', title: 'Your questions, answered', subtitle: 'Fees, payouts & more', colors: ['#7c3aed', '#a78bfa'], route: '/faq' },
];

/** Knowledge Hub — short learning videos (samples). */
export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  colors: [string, string];
}

export const VIDEOS: VideoItem[] = [
  { id: 'v1', title: 'How iClose saves you commission', duration: '2:14', colors: ['#0071e3', '#4aa3ff'] },
  { id: 'v2', title: 'Off-plan vs secondary — what to know', duration: '3:40', colors: ['#7c3aed', '#a78bfa'] },
  { id: 'v3', title: 'How brokers keep 100% commission', duration: '1:58', colors: ['#059669', '#34d399'] },
  { id: 'v4', title: 'Submitting your first inquiry', duration: '1:20', colors: ['#f59e0b', '#fb923c'] },
];
