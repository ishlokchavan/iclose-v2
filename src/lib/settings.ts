import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CONTACT_WHATSAPP, CONTACT_PHONE } from './config';

/**
 * Global, admin-editable contact settings (public.app_settings singleton).
 * Screens read contacts through here so the WhatsApp / call / Telegram
 * numbers can be changed from the admin console without a redeploy.
 * Falls back to the compiled-in config defaults until the row loads.
 */
export interface AppSettings {
  whatsapp_number: string;
  call_number: string;
  telegram_username: string | null;
  support_email: string;
}

export const SETTINGS_FALLBACK: AppSettings = {
  whatsapp_number: CONTACT_WHATSAPP,
  call_number: CONTACT_PHONE,
  telegram_username: null,
  support_email: 'hello@iclose.ae',
};

let cache: AppSettings | null = null;

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data } = await supabase
    .from('app_settings')
    .select('whatsapp_number,call_number,telegram_username,support_email')
    .eq('id', true)
    .maybeSingle();
  cache = data ? { ...SETTINGS_FALLBACK, ...data } : SETTINGS_FALLBACK;
  return cache;
}

/** Reactive settings hook (returns cached/fallback immediately, then refreshes). */
export function useAppSettings(): AppSettings {
  const [s, setS] = useState<AppSettings>(cache ?? SETTINGS_FALLBACK);
  useEffect(() => {
    let alive = true;
    fetchAppSettings().then((v) => alive && setS(v)).catch(() => {});
    return () => { alive = false; };
  }, []);
  return s;
}

/** Link helpers from the current settings. */
export function whatsappLink(s: AppSettings, text?: string): string {
  const base = `https://wa.me/${s.whatsapp_number.replace(/[^\d]/g, '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
export function telLink(s: AppSettings): string {
  return `tel:${s.call_number}`;
}
export function telegramLink(s: AppSettings): string | null {
  return s.telegram_username ? `https://t.me/${s.telegram_username.replace(/^@/, '')}` : null;
}

export async function adminUpdateSettings(patch: Partial<AppSettings>): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', true);
  if (error) throw new Error(error.message);
  cache = cache ? { ...cache, ...patch } : null;
}
