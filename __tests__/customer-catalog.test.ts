import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ client: null as any, from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({ getSupabaseClient: () => m.client }));
import { listCustomerCatalog } from '../services/customerCatalog';
beforeEach(() => {
  vi.clearAllMocks();
  m.client = { from: m.from };
  const query = { select: m.select, eq: m.eq, order: m.order, limit: m.limit };
  m.from.mockReturnValue(query); m.select.mockReturnValue(query); m.eq.mockReturnValue(query); m.order.mockReturnValue(query);
});
describe('published customer catalog', () => {
  it('uses the authenticated RLS client and requests only public storefront fields', async () => {
    const product = { id: 'published', business_id: 'merchant-a', name: 'UAT product', selling_price: 10, image_url: null };
    m.limit.mockResolvedValue({ data: [product], error: null });
    expect(await listCustomerCatalog()).toEqual([product]);
    expect(m.from).toHaveBeenCalledWith('products');
    expect(m.select).toHaveBeenCalledWith('id,business_id,name,selling_price,image_url,gallery_paths,gallery_version');
    expect(m.eq).toHaveBeenCalledWith('is_published', true);
    expect(m.limit).toHaveBeenCalledWith(100);
  });
  it('reports database failures instead of pretending the catalog is empty', async () => {
    m.limit.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    await expect(listCustomerCatalog()).rejects.toThrow('Products could not be loaded.');
  });
  it('reports a missing configured client', async () => {
    m.client = null;
    await expect(listCustomerCatalog()).rejects.toThrow('Products are temporarily unavailable.');
    expect(m.from).not.toHaveBeenCalled();
  });
});
