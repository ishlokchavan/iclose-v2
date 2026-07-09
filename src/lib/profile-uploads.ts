import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const BUCKET = 'profile-docs';

// ---- IBAN ---------------------------------------------------
/** Format for display: uppercase, spaces every 4 chars. */
export function formatIban(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
}

/** Validate a UAE IBAN (AE, 23 chars, mod-97 == 1) and pull its bank code. */
export function validateIban(raw: string): { valid: boolean; bankCode: string | null } {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (!/^AE\d{21}$/.test(s)) return { valid: false, bankCode: null };
  const rearranged = s.slice(4) + s.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  // mod-97 over a long numeric string, in chunks to avoid overflow.
  let rem = 0;
  for (let i = 0; i < numeric.length; i += 7) rem = Number(String(rem) + numeric.slice(i, i + 7)) % 97;
  return { valid: rem === 1, bankCode: s.slice(4, 7) };
}

// ---- Uploads ------------------------------------------------
export interface PickedImage { uri: string; base64?: string | null; mimeType?: string | null }

async function toBuffer(file: PickedImage): Promise<ArrayBuffer> {
  const b64 = file.base64 ?? (await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' }));
  return decode(b64);
}

/** Upload an avatar or ID document to the user's private folder. Returns the path. */
export async function uploadProfileImage(file: PickedImage, kind: 'avatar' | 'id'): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const ext = file.mimeType?.includes('png') ? 'png' : 'jpg';
  const path = `${auth.user.id}/${kind}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, await toBuffer(file), {
    contentType: file.mimeType ?? 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return path;
}

/** Signed URL for a stored private object (1h). */
export async function signedUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
