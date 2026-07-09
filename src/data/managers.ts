/**
 * Account-manager pool. Each user is assigned one manager deterministically
 * (stable per user). Names are generic placeholders — not real people.
 */
import { IMAGES } from './images';

export interface Manager {
  name: string;
  title: string;
  photo: string;
}

export const MANAGERS: Manager[] = [
  { name: 'Layla Rahman', title: 'Your account manager', photo: IMAGES.managerA },
  { name: 'Adam Kessler', title: 'Your account manager', photo: IMAGES.managerB },
  { name: 'Sara Malik', title: 'Your account manager', photo: IMAGES.managerC },
];

/** Deterministically pick a manager for a user (stable across sessions). */
export function pickManager(seed?: string | null): Manager {
  if (!seed) return MANAGERS[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MANAGERS[h % MANAGERS.length];
}
