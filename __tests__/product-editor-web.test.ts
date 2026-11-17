import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Product } from '../services/mockDatabase';
const m = vi.hoisted(() => ({ update: vi.fn(), saved: vi.fn() }));
vi.mock('../services/repository', () => ({ getDataSource: () => ({ products: { update: m.update } }) }));
import { ProductEditor } from '../components/ProductEditor';
const product: Product = { id: 'product', businessId: 'business', tripId: 'trip', name: 'Original', description: 'Original description', image: 'private-primary', costPrice: 8, sellingPrice: 20, status: 'ready', category: 'Clothing', isPublished: false };
let root: ReturnType<typeof createRoot> | undefined;
let node: HTMLDivElement;
beforeEach(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; m.update.mockResolvedValue(product); });
afterEach(() => { if (root) act(() => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.clearAllMocks(); });
async function mount(editable = true, businessId = 'business') { node = document.createElement('div'); document.body.append(node); root = createRoot(node); await act(async () => root!.render(React.createElement(ProductEditor, { product, businessId, editable, onSaved: m.saved }))); }
async function click(text: string) { const target = [...node.querySelectorAll('[role="button"]')].find(el => el.textContent === text)!; expect(target).toBeTruthy(); await act(async () => target.dispatchEvent(new MouseEvent('click', { bubbles: true }))); }
async function input(label: string, value: string) { const field = node.querySelector(`[aria-label="${label}"]`) as HTMLInputElement; await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value); field.dispatchEvent(new Event('input', { bubbles: true })); }); }
it('saves metadata without changing publication, gallery or ownership', async () => {
 await mount(); await click('Edit Product'); await input('Product name', 'Edited'); await input('Selling price (RM)', '21.50'); await click('Save product');
 expect(m.update).toHaveBeenCalledWith({ productId: 'product', businessId: 'business', name: 'Edited', description: 'Original description', costPrice: 8, sellingPrice: 21.5, status: 'ready' }); expect(m.saved).toHaveBeenCalledOnce();
});
it('publishes only through an explicit action and does not silently save the draft', async () => {
 await mount(); await click('Edit Product'); await input('Product name', 'Unsaved'); await click('Publish Product');
 expect(m.update).toHaveBeenCalledWith({ productId: 'product', businessId: 'business', isPublished: true });
});
it('blocks invalid prices and reports denied saves without claiming success', async () => {
 await mount(); await click('Edit Product'); await input('Selling price (RM)', '-1'); await click('Save product'); expect(m.update).not.toHaveBeenCalled();
 await input('Selling price (RM)', '20'); m.update.mockResolvedValue(null); await click('Save product'); expect(node.textContent).toContain('not saved'); expect(m.saved).not.toHaveBeenCalled();
});
it('does not expose mutation controls to customers or a different business', async () => {
 await mount(false); expect(node.textContent).toBe('');
 await act(async () => root!.render(React.createElement(ProductEditor, { product, businessId: 'foreign', editable: true, onSaved: m.saved })));
 expect(node.textContent).toBe(''); expect(m.update).not.toHaveBeenCalled();
});
