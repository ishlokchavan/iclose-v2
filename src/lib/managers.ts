import { supabase } from './supabase';
import { pickManager as pickStatic } from '@/data/managers';

/**
 * Account managers — now DB-backed (public.account_managers), admin-managed.
 * Each user gets one: their explicitly-assigned manager if set, otherwise a
 * deterministic pick from the active pool (stable per user). Falls back to the
 * bundled static pool if the table is empty / offline.
 */
export interface AccountManager {
  id: string;
  name: string;
  title: string;
  photo: string | null;
  whatsapp: string | null;
  call: string | null;
  active: boolean;
  position: number;
}

function deterministicIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return len ? h % len : 0;
}

function mapRow(m: Record<string, unknown>): AccountManager {
  return {
    id: m.id as string,
    name: m.name as string,
    title: (m.title as string) ?? 'Your account manager',
    photo: (m.photo_url as string) ?? null,
    whatsapp: (m.whatsapp_number as string) ?? null,
    call: (m.call_number as string) ?? null,
    active: (m.active as boolean) ?? true,
    position: (m.position as number) ?? 0,
  };
}

export async function listActiveManagers(): Promise<AccountManager[]> {
  const { data } = await supabase
    .from('account_managers')
    .select('id,name,title,photo_url,whatsapp_number,call_number,active,position')
    .eq('active', true)
    .order('position', { ascending: true });
  return (data ?? []).map(mapRow);
}

/** Resolve the manager shown to a given user. */
export async function getMyManager(userId?: string | null, assignedId?: string | null): Promise<{ name: string; title: string; photo: string | null }> {
  const list = await listActiveManagers();
  if (!list.length) {
    const s = pickStatic(userId);
    return { name: s.name, title: s.title, photo: s.photo };
  }
  if (assignedId) {
    const found = list.find((m) => m.id === assignedId);
    if (found) return { name: found.name, title: found.title, photo: found.photo };
  }
  return list[deterministicIndex(userId ?? '', list.length)];
}
