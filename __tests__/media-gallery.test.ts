import { describe, expect, it, vi } from 'vitest';
import { imagePreview, loadGallery, mediaPrefix, saveGallery, uploadGalleryImages, validateGallery, validateImage } from '../services/mediaGallery';
import { getProductPrimaryImage } from '../services/productGalleryImage';
import { validateTripEdit } from '../services/tripEdit';
const business = '20000000-0000-4000-8000-000000000001';
const entity = '40000000-0000-4000-8000-000000000001';
const prefix = mediaPrefix('products', business, entity);
const path = `${prefix}90000000-0000-4000-8000-000000000001.png`;
function fixture() {
  let row = { gallery_paths: [] as string[], gallery_version: 0 };
  const objects = new Set<string>();
  const upload = vi.fn(async (name: string) => { objects.add(name); return { error: null }; });
  const storage = { upload, createSignedUrl: vi.fn(async (name: string) => ({ data: { signedUrl: `https://signed.invalid/${name}` }, error: null })) };
  const client: any = {
    storage: { from: vi.fn(() => storage) },
    from: vi.fn(() => { const query: any = { select: () => query, eq: () => query, single: async () => ({ data: row, error: null }) }; return query; }),
    rpc: vi.fn(async (_name: string, input: any) => {
      if (input.p_version !== row.gallery_version || input.p_paths.some((entry: string) => !objects.has(entry))) return { data: null, error: { message: 'denied' } };
      row = { gallery_paths: [...input.p_paths], gallery_version: row.gallery_version + 1 };
      return { data: { paths: row.gallery_paths, version: row.gallery_version }, error: null };
    }),
  };
  return { client, upload, storage };
}
describe('private gallery transport', () => {
  it.each(['trips', 'products'] as const)('uploads 1 then 10 %s images and reloads the persisted order', async kind => {
    const { client, upload } = fixture();
    const file = () => new File(['synthetic image bytes'], 'photo.png', { type: 'image/png' });
    const first = await uploadGalleryImages(client, kind, business, entity, { paths: [], version: 0 }, [file()]);
    expect(first.paths).toHaveLength(1);
    const full = await uploadGalleryImages(client, kind, business, entity, first, Array.from({ length: 9 }, file));
    expect(full.paths).toHaveLength(10);
    expect(await loadGallery(client, kind, business, entity)).toEqual(full);
    expect(upload.mock.calls.every(call => String(call[0]).startsWith(mediaPrefix(kind, business, entity)))).toBe(true);
    await expect(uploadGalleryImages(client, kind, business, entity, full, [file()])).rejects.toThrow('ten');
    expect(upload).toHaveBeenCalledTimes(10);
    const reordered = await saveGallery(client, kind, business, entity, full, [...full.paths].reverse());
    const replaced = await uploadGalleryImages(client, kind, business, entity, reordered, [file()], 0);
    expect(replaced.paths[0]).not.toBe(reordered.paths[0]);
    const removed = await saveGallery(client, kind, business, entity, replaced, replaced.paths.slice(1));
    expect((await loadGallery(client, kind, business, entity)).paths).toEqual(removed.paths);
    expect(removed.paths).toHaveLength(9);
    await expect(saveGallery(client, kind, business, entity, first, [])).rejects.toThrow('not saved');
  });
  it('rejects bad types, oversized files, foreign paths and duplicates before upload', async () => {
    const { client, upload } = fixture();
    expect(() => validateImage({ size: 1, type: 'image/svg+xml' })).toThrow('JPEG');
    expect(() => validateImage({ size: 5242881, type: 'image/png' })).toThrow('5 MB');
    expect(() => validateImage({ size: 0, type: 'image/png' })).toThrow();
    expect(() => validateGallery([path, path], prefix)).toThrow('unique');
    expect(() => validateGallery([path.replace(business, entity)], prefix)).toThrow();
    await expect(uploadGalleryImages(client, 'products', business, entity, { paths: [], version: 0 }, [new File(['x'], 'x.svg', { type: 'image/svg+xml' })])).rejects.toThrow();
    expect(upload).not.toHaveBeenCalled();
  });
  it('counts the preserved original image towards ten and supports removing it', async () => {
    const { client, upload } = fixture();
    validateGallery(['legacy'], prefix);
    expect(() => validateGallery(['legacy'], mediaPrefix('trips', business, entity))).toThrow();
    const full = { paths: ['legacy', ...Array.from({ length: 9 }, (_, index) => `${prefix}90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}.png`)], version: 0 };
    await expect(uploadGalleryImages(client, 'products', business, entity, full, [new File(['x'], 'x.png', { type: 'image/png' })])).rejects.toThrow('ten');
    expect(upload).not.toHaveBeenCalled();
    expect(await getProductPrimaryImage(client, { id: entity, business_id: business, image_url: 'original', gallery_paths: ['legacy'] })).toBe('original');
    expect(await getProductPrimaryImage(client, { id: entity, business_id: business, image_url: 'original', gallery_paths: [], gallery_version: 1 })).toBe('');
  });
  it('does not publish metadata or overwrite previous objects after upload failure', async () => {
    const { client, upload } = fixture();
    upload.mockResolvedValueOnce({ error: { message: 'offline' } } as any);
    await expect(uploadGalleryImages(client, 'products', business, entity, { paths: [], version: 0 }, [new File(['x'], 'x.png', { type: 'image/png' })])).rejects.toThrow('interrupted');
    expect(client.rpc).not.toHaveBeenCalled();
  });
  it('uses expiring signed previews and preserves the legacy image when the gallery is absent', async () => {
    const { client, storage } = fixture();
    expect(await getProductPrimaryImage(client, { id: entity, business_id: business, image_url: 'legacy', gallery_paths: [] })).toBe('legacy');
    expect(await getProductPrimaryImage(client, { id: entity, business_id: business, image_url: 'legacy', gallery_paths: [path] })).toContain('signed.invalid');
    expect(storage.createSignedUrl).toHaveBeenCalledWith(path, 300);
    storage.createSignedUrl.mockResolvedValueOnce({ data: null, error: {} } as any);
    await expect(imagePreview(client, path)).rejects.toThrow('unavailable');
  });
});
describe('trip edit validation', () => {
  const valid = { name: ' UAT trip ', destination: ' Mall ', tripDate: '2026-11-14', budget: '125.50', status: 'open' };
  it('normalizes a valid persisted budget/date/status edit', () => {
    expect(validateTripEdit(valid)).toEqual({ name: 'UAT trip', destination: 'Mall', tripDate: '2026-11-14', budget: 125.5, status: 'open' });
    expect(validateTripEdit({ ...valid, status: 'closed' }).status).toBe('closed');
  });
  it.each([{ name: '' }, { destination: '' }, { tripDate: '2026-02-30' }, { budget: '-1' }, { budget: 'NaN' }, { budget: '1.234' }, { status: 'invented' }])('rejects malformed fields %j', patch => {
    expect(() => validateTripEdit({ ...valid, ...patch })).toThrow();
  });
});
