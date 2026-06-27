import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

/**
 * Seller listing submissions — uploads photos + ownership documents to the
 * private `listing-uploads` bucket (per-user folder, RLS-enforced) and records
 * the submission in `listing_submissions`. Everything stays on-platform.
 */

const BUCKET = 'listing-uploads';

export interface SellerIdentity {
  id: string;
  email: string;
  name: string;
  phone: string;
}

export interface PickedPhoto { uri: string; base64?: string | null; mimeType?: string | null }
export interface PickedDoc { uri: string; name?: string | null; mimeType?: string | null; size?: number | null }

export interface ListingForm {
  title: string;
  propertyType: string;
  community: string;
  city: string;
  priceAed: number;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

/** Pull name / email / phone from the signed-in user so we never re-ask. */
export async function getSellerIdentity(): Promise<SellerIdentity | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const md = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const name =
    md.full_name || md.name ||
    [md.given_name, md.family_name].filter(Boolean).join(' ') || '';
  return { id: user.id, email: user.email ?? '', name, phone: user.phone || md.phone || '' };
}

async function toBuffer(file: { uri: string; base64?: string | null }): Promise<ArrayBuffer> {
  const b64 = file.base64 ?? (await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' }));
  return decode(b64);
}

async function uploadOne(path: string, file: { uri: string; base64?: string | null }, contentType: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, await toBuffer(file), { contentType, upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

const extFor = (mime?: string | null) =>
  mime?.includes('png') ? 'png' : mime?.includes('webp') ? 'webp' : mime?.includes('heic') ? 'heic' : 'jpg';

/**
 * Upload everything then insert the submission. Reports coarse progress so the
 * UI can show "Uploading 3 of 8…". Returns the new submission id.
 */
export async function submitListing(
  form: ListingForm,
  photos: PickedPhoto[],
  docs: PickedDoc[],
  onProgress?: (done: number, total: number) => void,
): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) throw new Error('Please sign in to list your property.');

  const draftId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const base = `${user.id}/${draftId}`;
  const total = photos.length + docs.length;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  const photoPaths: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    photoPaths.push(await uploadOne(`${base}/photos/${i}.${extFor(p.mimeType)}`, p, p.mimeType ?? 'image/jpeg'));
    tick();
  }

  const documentPaths: string[] = [];
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const safe = (d.name ?? `document-${i}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    documentPaths.push(await uploadOne(`${base}/documents/${i}_${safe}`, d, d.mimeType ?? 'application/octet-stream'));
    tick();
  }

  const { data: row, error } = await supabase.from('listing_submissions').insert({
    user_id: user.id,
    title: form.title,
    property_type: form.propertyType,
    community: form.community,
    city: form.city,
    price_aed: form.priceAed,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    area_sqft: form.areaSqft,
    description: form.description,
    contact_name: form.contactName,
    contact_email: form.contactEmail,
    contact_phone: form.contactPhone,
    photo_paths: photoPaths,
    document_paths: documentPaths,
  }).select('id').single();
  if (error) throw new Error(error.message);
  return row.id as string;
}
