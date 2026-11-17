import type { SupabaseClient } from '@supabase/supabase-js';
export type MediaKind = 'trips' | 'products';
export type Gallery = { paths: string[]; version: number; legacyImage?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const MEDIA_BUCKET = 'opsps-media';
export function mediaPrefix(kind: MediaKind, businessId: string, entityId: string): string {
  if (!['trips', 'products'].includes(kind) || !UUID.test(businessId) || !UUID.test(entityId)) throw new Error('Invalid image scope.');
  return `business/${businessId}/${kind}/${entityId}/`;
}
export function validateGallery(paths: string[], prefix: string): void {
  if (paths.length > 10 || new Set(paths).size !== paths.length || paths.some(path => !(path === 'legacy' && prefix.includes('/products/')) && (!path.startsWith(prefix) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path.slice(prefix.length))))) throw new Error('Choose at most ten unique images for this record.');
}
export function validateImage(file: Pick<File, 'size' | 'type'>): string {
  if (!TYPES[file.type] || file.size <= 0 || file.size > 5 * 1024 * 1024) throw new Error('Choose JPEG, PNG or WebP images up to 5 MB each.');
  return TYPES[file.type];
}
export async function loadGallery(client: SupabaseClient, kind: MediaKind, businessId: string, entityId: string): Promise<Gallery> {
  const prefix = mediaPrefix(kind, businessId, entityId);
  const { data, error } = await client.from(kind).select(kind === 'products' ? 'gallery_paths,gallery_version,image_url' : 'gallery_paths,gallery_version').eq('id', entityId).eq('business_id', businessId).single<{ gallery_paths: string[]; gallery_version: number; image_url?: string }>();
  if (error || !data) throw new Error('Gallery unavailable. Confirm the gallery migration is installed and your session is active.');
  const paths = data.gallery_paths ?? [];
  validateGallery(paths, prefix);
  return { paths, version: data.gallery_version, ...(data.image_url ? { legacyImage: data.image_url } : {}) };
}
export async function saveGallery(client: SupabaseClient, kind: MediaKind, businessId: string, entityId: string, current: Gallery, paths: string[]): Promise<Gallery> {
  validateGallery(paths, mediaPrefix(kind, businessId, entityId));
  const { data, error } = await client.rpc('opsps_save_gallery', { p_kind: kind, p_business_id: businessId, p_entity_id: entityId, p_version: current.version, p_paths: paths });
  if (error || !data) throw new Error('Gallery was not saved. Reload to check for changes and retry.');
  return data as Gallery;
}
export async function imagePreview(client: SupabaseClient, path: string): Promise<string> {
  const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw new Error('Image preview unavailable. Refresh your session and retry.');
  return data.signedUrl;
}
export async function uploadGalleryImages(client: SupabaseClient, kind: MediaKind, businessId: string, entityId: string, current: Gallery, files: File[], replaceIndex?: number): Promise<Gallery> {
  const prefix = mediaPrefix(kind, businessId, entityId);
  validateGallery(current.paths, prefix);
  if (!files.length || (replaceIndex !== undefined && (files.length !== 1 || replaceIndex < 0 || replaceIndex >= current.paths.length)) || current.paths.length + files.length - (replaceIndex !== undefined ? 1 : 0) > 10) throw new Error('Choose one to ten images; replacement requires one image.');
  const extensions = files.map(validateImage);
  const uploaded: string[] = [];
  // If upload/save fails, retain objects: an interrupted save may have committed.
  // Never delete objects blindly after an unknown write outcome.
  for (let index = 0; index < files.length; index++) {
    const path = `${prefix}${globalThis.crypto.randomUUID()}.${extensions[index]}`;
    const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, files[index], { contentType: files[index].type, upsert: false });
    if (error) throw new Error('Upload interrupted. No existing images were changed. Reload and retry.');
    uploaded.push(path);
  }
  const paths = [...current.paths];
  if (replaceIndex === undefined) paths.push(...uploaded); else paths.splice(replaceIndex, 1, uploaded[0]);
  const saved = await saveGallery(client, kind, businessId, entityId, current, paths);
  // Old/replaced files are deliberately retained privately for recovery. A later
  // owner-run retention job can remove unreferenced objects after a grace period.
  return saved;
}
