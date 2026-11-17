import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ client: {}, load: vi.fn(), save: vi.fn(), upload: vi.fn(), preview: vi.fn() }));
vi.mock('../services/supabaseClient', () => ({ getSupabaseClient: () => m.client }));
vi.mock('../services/mediaGallery', () => ({ loadGallery: m.load, saveGallery: m.save, uploadGalleryImages: m.upload, imagePreview: m.preview }));
import { MediaGallery } from '../components/MediaGallery';
let root: ReturnType<typeof createRoot> | undefined;
let node: HTMLDivElement;
let state: { paths: string[]; version: number };
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  state = { paths: ['first.png', 'second.png'], version: 1 };
  m.load.mockImplementation(async () => state);
  m.preview.mockImplementation(async (_client, path) => `https://preview.invalid/${path}`);
  m.save.mockImplementation(async (_client, _kind, _business, _entity, _current, paths) => { state = { paths, version: state.version + 1 }; return state; });
  m.upload.mockImplementation(async () => { state = { paths: ['replacement.png', 'second.png'], version: 2 }; return state; });
});
afterEach(() => { if (root) act(() => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.restoreAllMocks(); vi.clearAllMocks(); });
async function mount(editable = true) { node = document.createElement('div'); document.body.append(node); root = createRoot(node); await act(async () => root!.render(React.createElement(MediaGallery, { kind: 'products', businessId: 'business', entityId: 'product', editable }))); }
async function click(label: string) { const button = node.querySelector(`[aria-label="${label}"]`)!; expect(button).toBeTruthy(); await act(async () => button.dispatchEvent(new MouseEvent('click', { bubbles: true }))); }
it('renders ordered previews, changes primary, removes an image and reloads persisted metadata', async () => {
  await mount(); expect(node.querySelectorAll('img')).toHaveLength(2);
  await click('Make image 2 primary'); expect(m.save).toHaveBeenLastCalledWith(m.client, 'products', 'business', 'product', expect.anything(), ['second.png', 'first.png']);
  expect(node.querySelector('img')?.getAttribute('src')).toContain('second.png');
  await click('Remove image 1'); expect(state.paths).toEqual(['first.png']); expect(node.querySelectorAll('img')).toHaveLength(1);
  await click('Reload gallery'); expect(node.querySelectorAll('img')).toHaveLength(1);
});
it('uploads a replacement selected from the web file input', async () => {
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function (this: HTMLInputElement) {
    Object.defineProperty(this, 'files', { configurable: true, value: [new File(['x'], 'replacement.png', { type: 'image/png' })] });
    this.dispatchEvent(new Event('change'));
  });
  await mount(); await click('Replace image 1');
  expect(m.upload).toHaveBeenCalledWith(m.client, 'products', 'business', 'product', expect.anything(), expect.arrayContaining([expect.any(File)]), 0);
  expect(node.querySelector('img')?.getAttribute('src')).toContain('replacement.png');
});
it('does not render mutation controls for a customer', async () => { await mount(false); expect(node.textContent).not.toContain('Add images'); expect(node.textContent).not.toContain('Remove image'); expect(node.querySelectorAll('img')).toHaveLength(2); });
it('shows save failure without removing the displayed gallery', async () => {
  await mount(); m.save.mockRejectedValueOnce(new Error('Reload before saving'));
  await click('Remove image 1'); expect(node.textContent).toContain('Reload before saving'); expect(node.querySelectorAll('img')).toHaveLength(2);
});
