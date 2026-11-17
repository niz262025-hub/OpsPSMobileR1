import { getSupabaseClient } from './supabaseClient';
import { getProductPrimaryImage } from './productGalleryImage';

export type CustomerCatalogProduct = {
  id: string;
  business_id: string;
  name: string;
  selling_price: number;
  image_url: string | null;
};

// RLS still decides visibility. Request only the published storefront fields;
// cost prices, supplier details and stock-management fields are not displayed.
export async function listCustomerCatalog(): Promise<CustomerCatalogProduct[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Products are temporarily unavailable.');
  const { data, error } = await client.from('products')
    .select('id,business_id,name,selling_price,image_url,gallery_paths,gallery_version')
    .eq('is_published', true).order('name').limit(100);
  if (error) throw new Error('Products could not be loaded. Please try again.');
  return Promise.all((data ?? []).map(async row => ({
    id: row.id, business_id: row.business_id, name: row.name,
    selling_price: Number(row.selling_price ?? 0),
    image_url: await getProductPrimaryImage(client, { ...row, image_url: row.image_url ?? undefined }) || null,
  })));
}
