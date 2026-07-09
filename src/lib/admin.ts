import { supabase } from './supabase';
import type { UserRole, DealStatus, CommissionStatus, ContactChannel } from './deals';

/**
 * Admin console data layer. All access is RLS-gated to admins (is_admin()).
 * Mutations write an audit_log entry so the admin trail reflects every change.
 */

// ---- Audit --------------------------------------------------
export interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export async function writeAudit(action: string, entity: string, entity_id: string | null, summary: string, meta?: Record<string, unknown>): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  await supabase.from('audit_log').insert({
    actor_id: auth.user?.id ?? null,
    actor_email: auth.user?.email ?? null,
    action, entity, entity_id, summary, meta: meta ?? null,
  });
}

export async function adminListAudit(limit = 100): Promise<AuditEntry[]> {
  const { data } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
  return (data as AuditEntry[]) ?? [];
}

// ---- Users --------------------------------------------------
export interface AdminUser {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: ContactChannel | null;
  onboarded: boolean;
  ref_code: string;
  account_manager_id: string | null;
  created_at: string;
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id,role,full_name,email,phone,preferred_channel,onboarded,ref_code,account_manager_id,created_at')
    .order('created_at', { ascending: false });
  return (data as AdminUser[]) ?? [];
}

export async function adminUpdateUser(id: string, patch: Partial<Pick<AdminUser, 'role' | 'account_manager_id'>>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  await writeAudit('update', 'user', id, `Updated user ${Object.keys(patch).join(', ')}`, patch as Record<string, unknown>);
}

// ---- Account managers --------------------------------------
export interface ManagerRow {
  id: string;
  name: string;
  title: string;
  photo_url: string | null;
  whatsapp_number: string | null;
  call_number: string | null;
  active: boolean;
  position: number;
}

export async function adminListManagers(): Promise<ManagerRow[]> {
  const { data } = await supabase.from('account_managers').select('*').order('position', { ascending: true });
  return (data as ManagerRow[]) ?? [];
}

export async function adminUpsertManager(row: Partial<ManagerRow> & { name: string }): Promise<void> {
  if (row.id) {
    const { error } = await supabase.from('account_managers').update(row).eq('id', row.id);
    if (error) throw new Error(error.message);
    await writeAudit('update', 'account_manager', row.id, `Updated manager ${row.name}`);
  } else {
    const { data, error } = await supabase.from('account_managers').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    await writeAudit('create', 'account_manager', data?.id ?? null, `Added manager ${row.name}`);
  }
}

export async function adminDeleteManager(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('account_managers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await writeAudit('delete', 'account_manager', id, `Removed manager ${name}`);
}

// ---- FAQ ----------------------------------------------------
export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  audience: 'all' | 'buyer' | 'broker' | 'seller';
  position: number;
  published: boolean;
}

export async function adminListFaqs(): Promise<FaqRow[]> {
  const { data } = await supabase.from('faqs').select('id,question,answer,audience,position,published').order('audience').order('position');
  return (data as FaqRow[]) ?? [];
}

export async function adminUpsertFaq(row: Partial<FaqRow> & { question: string; answer: string }): Promise<void> {
  if (row.id) {
    const { error } = await supabase.from('faqs').update(row).eq('id', row.id);
    if (error) throw new Error(error.message);
    await writeAudit('update', 'faq', row.id, 'Updated FAQ');
  } else {
    const { data, error } = await supabase.from('faqs').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    await writeAudit('create', 'faq', data?.id ?? null, 'Added FAQ');
  }
}

export async function adminDeleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await writeAudit('delete', 'faq', id, 'Deleted FAQ');
}

// ---- Email log ----------------------------------------------
export interface EmailLogRow {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  audience: string | null;
  status: string;
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export async function adminListEmails(limit = 100): Promise<EmailLogRow[]> {
  const { data } = await supabase
    .from('email_outbox')
    .select('id,to_email,to_name,subject,audience,status,error,created_at,sent_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as EmailLogRow[]) ?? [];
}

// ---- Dashboard stats ----------------------------------------
export interface AdminStats {
  users: number;
  deals: number;
  active: number;
  closed: number;
  commissionPaid: number;
  commissionPending: number;
  byStatus: Record<DealStatus, number>;
  byCommission: Record<CommissionStatus, number>;
}

export async function adminGetStats(): Promise<AdminStats> {
  const [{ count: users }, { data: deals }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('deals').select('status,commission_status,commission_amount_aed,deal_value_aed'),
  ]);
  const stats: AdminStats = {
    users: users ?? 0,
    deals: deals?.length ?? 0,
    active: 0,
    closed: 0,
    commissionPaid: 0,
    commissionPending: 0,
    byStatus: { submitted: 0, in_discussion: 0, closed_won: 0, closed_lost: 0 },
    byCommission: { pending: 0, paid: 0, not_applicable: 0 },
  };
  for (const d of deals ?? []) {
    const s = d.status as DealStatus;
    const c = d.commission_status as CommissionStatus;
    stats.byStatus[s] = (stats.byStatus[s] ?? 0) + 1;
    stats.byCommission[c] = (stats.byCommission[c] ?? 0) + 1;
    if (s === 'submitted' || s === 'in_discussion') stats.active += 1;
    if (s === 'closed_won') stats.closed += 1;
    if (c === 'paid') stats.commissionPaid += Number(d.commission_amount_aed ?? 0);
    if (c === 'pending' && s === 'closed_won') stats.commissionPending += Number(d.commission_amount_aed ?? 0);
  }
  return stats;
}
