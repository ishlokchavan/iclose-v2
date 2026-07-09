import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

/**
 * User-managed bank accounts + verification documents (multiple each).
 * Documents live in the private `profile-docs` bucket under the user's folder.
 */
const BUCKET = 'profile-docs';

// ---- Bank accounts ------------------------------------------
export interface BankAccount {
  id: string;
  bank_name: string | null;
  account_name: string | null;
  iban: string;
  is_primary: boolean;
  created_at: string;
}

export async function listBankAccounts(): Promise<BankAccount[]> {
  const { data } = await supabase
    .from('bank_accounts')
    .select('id,bank_name,account_name,iban,is_primary,created_at')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
  return (data as BankAccount[]) ?? [];
}

export async function addBankAccount(input: { bank_name?: string | null; account_name?: string | null; iban: string; is_primary?: boolean }): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { count } = await supabase.from('bank_accounts').select('id', { count: 'exact', head: true });
  const { error } = await supabase.from('bank_accounts').insert({
    user_id: auth.user.id,
    bank_name: input.bank_name ?? null,
    account_name: input.account_name ?? null,
    iban: input.iban,
    is_primary: input.is_primary ?? (count ?? 0) === 0, // first account is primary
  });
  if (error) throw new Error(error.message);
}

export async function updateBankAccount(id: string, patch: Partial<Pick<BankAccount, 'bank_name' | 'account_name' | 'iban' | 'is_primary'>>): Promise<void> {
  const { error } = await supabase.from('bank_accounts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setPrimaryBank(id: string): Promise<void> {
  const { error } = await supabase.from('bank_accounts').update({ is_primary: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteBankAccount(id: string): Promise<void> {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Documents ----------------------------------------------
export type DocKind = 'emirates_id' | 'passport' | 'other';
export interface UserDocument {
  id: string;
  kind: DocKind;
  name: string | null;
  path: string;
  mime: string | null;
  created_at: string;
}

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  emirates_id: 'Emirates ID',
  passport: 'Passport',
  other: 'Document',
};

export async function listDocuments(): Promise<UserDocument[]> {
  const { data } = await supabase
    .from('documents')
    .select('id,kind,name,path,mime,created_at')
    .order('created_at', { ascending: false });
  return (data as UserDocument[]) ?? [];
}

export interface PickedFile { uri: string; base64?: string | null; mimeType?: string | null; name?: string | null }

/** Upload a document to the user's folder and record it. Returns the new row's path. */
export async function addDocument(file: PickedFile, kind: DocKind, displayName?: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const b64 = file.base64 ?? (await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' }));
  const buffer = decode(b64);
  const ext = extFor(file.mimeType, file.name);
  const path = `${auth.user.id}/docs/${kind}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.mimeType ?? 'application/octet-stream',
    upsert: true,
  });
  if (upErr) throw new Error(upErr.message);
  const { error } = await supabase.from('documents').insert({
    user_id: auth.user.id,
    kind,
    name: displayName ?? file.name ?? null,
    path,
    mime: file.mimeType ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteDocument(doc: UserDocument): Promise<void> {
  await supabase.storage.from(BUCKET).remove([doc.path]);
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  if (error) throw new Error(error.message);
}

export async function documentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function extFor(mime?: string | null, name?: string | null): string {
  if (name && name.includes('.')) return name.split('.').pop()!.toLowerCase();
  if (mime?.includes('png')) return 'png';
  if (mime?.includes('pdf')) return 'pdf';
  if (mime?.includes('heic')) return 'heic';
  return 'jpg';
}
