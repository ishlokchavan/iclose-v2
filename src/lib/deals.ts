import { supabase } from './supabase';

/**
 * iClose deal-closing data layer. Users (agents/buyers) submit inquiries and
 * track economics; the internal team (admins) updates status + commission.
 * All access is enforced by RLS — this module is a thin, typed wrapper.
 */

export type UserRole = 'buyer' | 'seller' | 'broker';
export type InquiryKind = 'buy' | 'sell' | 'close';
export type DealStatus = 'submitted' | 'in_discussion' | 'closed_won' | 'closed_lost';
export type CommissionStatus = 'pending' | 'paid' | 'not_applicable';
export type ContactChannel = 'whatsapp' | 'call' | 'telegram';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: ContactChannel | null;
  onboarded: boolean;
  ref_code: string;
  bank_name: string | null;
  bank_account_name: string | null;
  iban: string | null;
}

export type DealType = 'offplan' | 'secondary';

/** Commission model. Off-plan ≈ 5%, secondary/ready ≈ 2%. */
export const COMMISSION_RATE: Record<DealType, number> = { offplan: 5, secondary: 2 };
/** iClose flat fees. */
export const FEES = { broker: 3500, conveyancing: 8250 } as const;

/** Broker take-home: 100% commission minus the AED 3,500 admin fee. */
export function brokerPocket(dealType: DealType, amount: number): { pct: number; gross: number; fee: number; net: number } {
  const pct = COMMISSION_RATE[dealType];
  const gross = Math.round((amount * pct) / 100);
  return { pct, gross, fee: FEES.broker, net: gross - FEES.broker };
}

/** Buyer benefit net of the AED 8,250 conveyancing fee. Secondary = commission
 *  saved (2%); off-plan = estimated credit back (5%). */
export function buyerBenefit(dealType: DealType, amount: number): { label: string; pct: number; gross: number; fee: number; net: number } {
  const pct = dealType === 'secondary' ? 2 : 5;
  const gross = Math.round((amount * pct) / 100);
  return { label: dealType === 'secondary' ? 'You save (net)' : 'Credit back (net)', pct, gross, fee: FEES.conveyancing, net: gross - FEES.conveyancing };
}

/** Estimate commission for an inquiry whose economics aren't set yet. */
export function estimateCommission(dealType: DealType | null, amount: number | null): { pct: number; amount: number } | null {
  if (!amount) return null;
  const pct = COMMISSION_RATE[dealType ?? 'secondary'];
  return { pct, amount: Math.round((amount * pct) / 100) };
}

export interface DealEvent { id: string; deal_id: string; kind: string; label: string; detail: string | null; created_at: string }
export async function getDealEvents(dealId: string): Promise<DealEvent[]> {
  const { data } = await supabase.from('deal_events').select('*').eq('deal_id', dealId).order('created_at', { ascending: false });
  return (data as DealEvent[]) ?? [];
}

/** Property taxonomy for the buying inquiry. */
export const PROPERTY_CATEGORIES = ['Residential', 'Commercial'] as const;
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];
export const PROPERTY_TYPES: Record<PropertyCategory, string[]> = {
  Residential: ['Apartment', 'Villa', 'Townhouse', 'Penthouse'],
  Commercial: ['Office Space', 'Retail', 'Land'],
};

export interface Deal {
  id: string;
  ref_code: string;
  user_id: string;
  kind: InquiryKind;
  is_referral: boolean;
  title: string | null;
  project: string | null;
  area: string | null;
  emirate: string | null;
  deal_type: DealType | null;
  property_type: string | null;
  bedrooms: number | null;
  budget_aed: number | null;
  deal_value_aed: number | null;
  note: string | null;
  status: DealStatus;
  status_note: string | null;
  commission_pct: number | null;
  commission_amount_aed: number | null;
  commission_status: CommissionStatus;
  created_at: string;
  updated_at: string;
}

/** A deal joined with its submitter's profile (admin views). */
export interface DealWithUser extends Deal {
  submitter: Pick<Profile, 'full_name' | 'email' | 'phone' | 'preferred_channel' | 'role'> | null;
}

// ---- Labels -------------------------------------------------
export const STATUS_LABEL: Record<DealStatus, string> = {
  submitted: 'Submitted',
  in_discussion: 'In discussion',
  closed_won: 'Closed',
  closed_lost: 'Not closed',
};
export const COMMISSION_LABEL: Record<CommissionStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  not_applicable: 'N/A',
};
export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  whatsapp: 'WhatsApp',
  call: 'Call',
  telegram: 'Telegram',
};
export const ROLE_LABEL: Record<UserRole, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  broker: 'Broker',
};

// ---- Profile ------------------------------------------------
export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id,role,full_name,email,phone,preferred_channel,onboarded,ref_code,bank_name,bank_account_name,iban')
    .eq('id', auth.user.id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function updateMyProfile(patch: Partial<Pick<Profile, 'role' | 'full_name' | 'phone' | 'preferred_channel' | 'onboarded' | 'bank_name' | 'bank_account_name' | 'iban'>>): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { error } = await supabase.from('profiles').update(patch).eq('id', auth.user.id);
  if (error) throw new Error(error.message);
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
}

// ---- Deals (user) -------------------------------------------
export interface NewInquiry {
  kind: InquiryKind;
  is_referral?: boolean;
  title?: string | null;
  project?: string | null;
  area?: string | null;
  emirate?: string | null;
  deal_type?: DealType | null;
  property_type?: string | null;
  bedrooms?: number | null;
  budget_aed?: number | null;
  deal_value_aed?: number | null;
  note?: string | null;
}

export async function submitInquiry(input: NewInquiry): Promise<{ id: string; ref_code: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Please sign in first.');
  const { data, error } = await supabase
    .from('deals')
    .insert({ ...input, user_id: auth.user.id })
    .select('id,ref_code')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string, ref_code: data.ref_code as string };
}

export async function getMyDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data as Deal[]) ?? [];
}

export async function getDeal(id: string): Promise<Deal | null> {
  const { data } = await supabase.from('deals').select('*').eq('id', id).maybeSingle();
  return (data as Deal) ?? null;
}

/** Withdraw an inquiry that's still 'submitted' (RLS also enforces this). */
export async function withdrawDeal(id: string): Promise<void> {
  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Dashboard KPIs (computed client-side) ------------------
export interface DashboardStats {
  active: number;
  closedCount: number;
  closedValue: number;
  commissionEarned: number;
  commissionPending: number;
}

export function computeStats(deals: Deal[]): DashboardStats {
  const stats: DashboardStats = { active: 0, closedCount: 0, closedValue: 0, commissionEarned: 0, commissionPending: 0 };
  for (const d of deals) {
    if (d.status === 'submitted' || d.status === 'in_discussion') stats.active += 1;
    if (d.status === 'closed_won') {
      stats.closedCount += 1;
      stats.closedValue += d.deal_value_aed ?? 0;
    }
    if (d.commission_status === 'paid') stats.commissionEarned += d.commission_amount_aed ?? 0;
    if (d.commission_status === 'pending' && d.status === 'closed_won') stats.commissionPending += d.commission_amount_aed ?? 0;
  }
  return stats;
}

// ---- Admin --------------------------------------------------
export async function adminGetDeals(): Promise<DealWithUser[]> {
  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !deals) return [];
  const ids = Array.from(new Set((deals as Deal[]).map((d) => d.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id,full_name,email,phone,preferred_channel,role')
    .in('id', ids);
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  return (deals as Deal[]).map((d) => ({
    ...d,
    submitter: (byId.get(d.user_id) as DealWithUser['submitter']) ?? null,
  }));
}

export interface AdminDealPatch {
  status?: DealStatus;
  status_note?: string | null;
  deal_value_aed?: number | null;
  commission_pct?: number | null;
  commission_amount_aed?: number | null;
  commission_status?: CommissionStatus;
}

export async function adminUpdateDeal(id: string, patch: AdminDealPatch): Promise<void> {
  const { error } = await supabase.from('deals').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- FAQ ----------------------------------------------------
export interface Faq { id: string; question: string; answer: string }
export async function getFaqs(): Promise<Faq[]> {
  const { data } = await supabase
    .from('faqs')
    .select('id,question,answer')
    .eq('published', true)
    .order('position', { ascending: true });
  return (data as Faq[]) ?? [];
}
