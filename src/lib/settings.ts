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
  // Pricing (admin-editable). iClose charges a flat per-deal fee (separate for
  // buyers vs brokers); buyer secondary deals also carry pass-through costs.
  buyer_fee_aed: number;
  broker_fee_aed: number;
  conveyance_fee_aed: number;
  vip_trustee_fee_aed: number;
  standard_trustee_aed: number;
  market_commission_pct: number;
  broker_split_pct: number;      // typical commission split a broker gives up
  offplan_cashback_pct: number;  // off-plan buyer cashback, % of deal value
}

export const SETTINGS_FALLBACK: AppSettings = {
  whatsapp_number: CONTACT_WHATSAPP,
  call_number: CONTACT_PHONE,
  telegram_username: null,
  support_email: 'hello@iclose.ae',
  buyer_fee_aed: 3699,
  broker_fee_aed: 3699,
  conveyance_fee_aed: 8250,
  vip_trustee_fee_aed: 5000,
  standard_trustee_aed: 4200,
  market_commission_pct: 2,
  broker_split_pct: 50,
  offplan_cashback_pct: 1,
};

let cache: AppSettings | null = null;

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data } = await supabase
    .from('app_settings')
    .select('whatsapp_number,call_number,telegram_username,support_email,buyer_fee_aed,broker_fee_aed,conveyance_fee_aed,vip_trustee_fee_aed,standard_trustee_aed,market_commission_pct,broker_split_pct,offplan_cashback_pct')
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

const num = (v: number) => Number(v) || 0; // numeric columns can arrive as strings
const trimPct = (v: number) => { const n = num(v); return Number.isInteger(n) ? String(n) : n.toFixed(1); };

/** What the user actually pays. iClose's fee is a flat per-role fee; buyer
 *  *secondary* deals add pass-through conveyance + VIP trustee costs. Any fee
 *  set to 0 is dropped entirely (not shown, not counted). */
export function feeLines(s: AppSettings, role: UserRole, dealType: DealType): FeeLine[] {
  const base = role === 'broker' ? num(s.broker_fee_aed) : num(s.buyer_fee_aed);
  const lines: FeeLine[] = [];
  if (base > 0) lines.push({ label: 'iClose service fee', amount: base, note: 'flat · all-inclusive' });
  if (role === 'buyer' && dealType === 'secondary') {
    if (num(s.conveyance_fee_aed) > 0) lines.push({ label: 'Conveyance fee', amount: num(s.conveyance_fee_aed), note: 'standard transaction cost' });
    if (num(s.vip_trustee_fee_aed) > 0) {
      lines.push({ label: 'VIP Trustee fee', amount: num(s.vip_trustee_fee_aed), note: num(s.standard_trustee_aed) > 0 ? `vs ${formatAed(num(s.standard_trustee_aed))} standard` : undefined });
    }
  }
  return lines;
}

export function feeTotal(s: AppSettings, role: UserRole, dealType: DealType): number {
  return feeLines(s, role, dealType).reduce((sum, l) => sum + l.amount, 0);
}

/** Commission a brokerage would otherwise charge on this value (for comparison). */
export function marketCommission(s: AppSettings, amount: number): number {
  return Math.round((amount * num(s.market_commission_pct)) / 100);
}

/** The headline "what you gain" for the deal, framed by role & type:
 *  - broker  → keeps more than a typical commission split
 *  - buyer + off-plan → earns cashback
 *  - buyer + secondary → saves vs an agent commission */
export interface SavingInfo { label: string; amount: number; sub: string }
export function savingInfo(s: AppSettings, role: UserRole, dealType: DealType, amount: number): SavingInfo | null {
  if (!amount) return null;
  const commission = marketCommission(s, amount);

  if (role === 'broker') {
    const split = num(s.broker_split_pct);
    const extra = Math.round((commission * split) / 100) - num(s.broker_fee_aed);
    if (extra <= 0) return null;
    return { label: 'You keep', amount: extra, sub: `more than a ${trimPct(split)}/${trimPct(100 - split)} commission split` };
  }
  if (dealType === 'offplan') {
    const cash = Math.round((amount * num(s.offplan_cashback_pct)) / 100);
    if (cash <= 0) return null;
    return { label: 'You earn', amount: cash, sub: 'cashback credited back on off-plan' };
  }
  const save = commission - num(s.buyer_fee_aed);
  if (save <= 0) return null;
  return { label: 'You save', amount: save, sub: `vs a ~${trimPct(s.market_commission_pct)}% agent commission` };
}

export async function adminUpdateSettings(patch: Partial<AppSettings>): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', true);
  if (error) throw new Error(error.message);
  cache = cache ? { ...cache, ...patch } : null;
}
