/** Home "Highlights" carousel + Knowledge Hub video cards. */
import type { LucideIcon } from 'lucide-react-native';
import { Workflow, BadgePercent, HelpCircle } from 'lucide-react-native';

export interface Highlight {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  route?: string;
}

export const HIGHLIGHTS: Highlight[] = [
  { id: 'how', title: 'How iClose works', subtitle: 'From inquiry to closing, in 4 simple steps', icon: Workflow, route: '/tutorial' },
  { id: 'save', title: 'Never pay commission', subtitle: 'See exactly what you pay — and save', icon: BadgePercent, route: '/benefits' },
  { id: 'faq', title: 'Your questions, answered', subtitle: 'Fees, payouts & more', icon: HelpCircle, route: '/faq' },
];

/** Knowledge Hub — short learning videos (samples). */
export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  /** Streamable video URL. When set, the card plays it inline. */
  url?: string;
}

export const VIDEOS: VideoItem[] = [
  { id: 'v1', title: 'How iClose saves you commission', duration: '2:14' },
  { id: 'v2', title: 'Off-plan vs secondary — what to know', duration: '3:40' },
  { id: 'v3', title: 'How brokers keep 100% commission', duration: '1:58' },
  { id: 'v4', title: 'Submitting your first inquiry', duration: '1:20' },
];
