import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { CONTACT_WHATSAPP, CONTACT_PHONE } from './config';
import { formatAed } from './format';
import type { DealType, UserRole } from './deals';

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
  // Pricing (admin-editable) — iClose charges a flat per-deal fee; buyer
  // secondary deals also carry pass-through transaction costs.
  fee_flat_aed: number;
  conveyance_fee_aed: number;
  vip_trustee_fee_aed: number;
  standard_trustee_aed: number;
  market_commission_pct: number;
}

export const SETTINGS_FALLBACK: AppSettings = {
  whatsapp_number: CONTACT_WHATSAPP,
  call_number: CONTACT_PHONE,
  telegram_username: null,
  support_email: 'hello@iclose.ae',
  fee_flat_aed: 3699,
  conveyance_fee_aed: 8250,
  vip_trustee_fee_aed: 5000,
  standard_trustee_aed: 4200,
  market_commission_pct: 2,
};

let cache: AppSettings | null = null;

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data } = await supabase
    .from('app_settings')
    .select('whatsapp_number,call_number,telegram_username,support_email,fee_flat_aed,conveyance_fee_aed,vip_trustee_fee_aed,standard_trustee_aed,market_commission_pct')
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

/** Friendly opener used when a screen doesn't supply its own message. */
export const DEFAULT_CHAT_GREETING = "Hi iClose 👋 I'd like some help with buying or closing property in the UAE.";

/** Link helpers from the current settings. Both WhatsApp and Telegram open the
 *  chat pre-filled with a friendly greeting (or a screen-supplied message). */
export function whatsappLink(s: AppSettings, text?: string): string {
  const base = `https://wa.me/${s.whatsapp_number.replace(/[^\d]/g, '')}`;
  return `${base}?text=${encodeURIComponent(text ?? DEFAULT_CHAT_GREETING)}`;
}
export function telLink(s: AppSettings): string {
  return `tel:${s.call_number}`;
}
export function telegramLink(s: AppSettings, text?: string): string | null {
  if (!s.telegram_username) return null;
  const base = `https://t.me/${s.telegram_username.replace(/^@/, '')}`;
  return `${base}?text=${encodeURIComponent(text ?? DEFAULT_CHAT_GREETING)}`;
}

// ---- Pricing helpers (all numbers come from live settings) ----
export interface FeeLine { label: string; amount: number; note?: string }

/** What the user actually pays. iClose's fee is always flat; buyer *secondary*
 *  deals also carry pass-through conveyance + VIP trustee transaction costs. */
export function feeLines(s: AppSettings, role: UserRole, dealType: DealType): FeeLine[] {
  const lines: FeeLine[] = [{ label: 'iClose service fee', amount: s.fee_flat_aed, note: 'flat · all-inclusive' }];
  if (role === 'buyer' && dealType === 'secondary') {
    lines.push({ label: 'Conveyance fee', amount: s.conveyance_fee_aed, note: 'standard transaction cost' });
    lines.push({ label: 'VIP Trustee fee', amount: s.vip_trustee_fee_aed, note: `vs ${formatAed(s.standard_trustee_aed)} standard` });
  }
  return lines;
}

export function feeTotal(s: AppSettings, role: UserRole, dealType: DealType): number {
  return feeLines(s, role, dealType).reduce((sum, l) => sum + l.amount, 0);
}

/** Commission a brokerage would otherwise charge on this value (for comparison). */
export function marketCommission(s: AppSettings, amount: number): number {
  return Math.round((amount * s.market_commission_pct) / 100);
}

export async function adminUpdateSettings(patch: Partial<AppSettings>): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', true);
  if (error) throw new Error(error.message);
  cache = cache ? { ...cache, ...patch } : null;
}
