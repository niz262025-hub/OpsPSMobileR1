import type { SupabaseClient } from '@supabase/supabase-js';
import { imagePreview, mediaPrefix, validateGallery } from './mediaGallery';
export async function getProductPrimaryImage(client: SupabaseClient, row: { id: string; business_id: string; image_url?: string; gallery_paths?: string[]; gallery_version?: number }): Promise<string> {
  if (!row.gallery_paths?.length) return row.gallery_version ? '' : row.image_url ?? '';
  if (row.gallery_paths[0] === 'legacy') return row.image_url ?? '';
  try {
    validateGallery(row.gallery_paths, mediaPrefix('products', row.business_id, row.id));
    return await imagePreview(client, row.gallery_paths[0]);
  } catch {
    // Legacy image remains untouched; never persist a short-lived signed URL.
    return row.image_url ?? '';
  }
}
