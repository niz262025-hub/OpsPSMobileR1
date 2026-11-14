import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), replace: vi.fn(), role: 'founder' }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ ready: true, membership: { business_id: 'business', role: m.role } }) }));
vi.mock('../services/repository', () => ({ getDataSource: () => ({ trips: { getForBusiness: m.get, update: m.update } }) }));
vi.mock('expo-router', () => ({ router: { replace: m.replace, back: vi.fn() }, useLocalSearchParams: () => ({ id: 'trip' }) }));
import EditTrip from '../app/trip/[id]/edit';
let root: ReturnType<typeof createRoot> | undefined;
let node: HTMLDivElement;
beforeEach(() => { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; m.role = 'founder'; m.get.mockResolvedValue({ name: 'Original', destination: 'Mall', tripDate: '2026-11-14', budget: 50, status: 'open' }); m.update.mockResolvedValue({ id: 'trip' }); });
afterEach(() => { if (root) act(() => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.clearAllMocks(); });
async function mount() { node = document.createElement('div'); document.body.append(node); root = createRoot(node); await act(async () => root!.render(React.createElement(EditTrip))); }
async function input(label: string, value: string) {
  const element = node.querySelector(`[aria-label="${label}"]`) as HTMLInputElement;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function click(text: string) { const target = [...node.querySelectorAll('[role="button"]')].find(el => el.textContent === text)!; expect(target).toBeTruthy(); await act(async () => target.dispatchEvent(new MouseEvent('click', { bubbles: true }))); }
it('loads saved fields, saves validated edits and opens the trip detail for a fresh read', async () => {
  await mount(); expect((node.querySelector('[aria-label="Budget (RM)"]') as HTMLInputElement).value).toBe('50');
  await input('Trip name', 'Edited trip'); await input('Destination', 'New mall'); await input('Budget (RM)', '125.50'); await input('Trip date', '2026-11-15');
  await click('Set Completed'); await click('Save trip');
  expect(m.update).toHaveBeenCalledWith({ tripId: 'trip', businessId: 'business', name: 'Edited trip', destination: 'New mall', budget: 125.5, tripDate: '2026-11-15', status: 'closed' });
  expect(m.replace).toHaveBeenCalledWith('/trip/trip');
});
it('shows validation and server-save failures without claiming success', async () => {
  await mount(); await input('Budget (RM)', '-1'); await click('Save trip'); expect(m.update).not.toHaveBeenCalled(); expect(node.textContent).toContain('non-negative');
  await input('Budget (RM)', '0'); m.update.mockResolvedValue(null); await click('Save trip'); expect(node.textContent).toContain('not saved'); expect(m.replace).not.toHaveBeenCalled();
});
it('denies customer editing before a repository request', async () => { m.role = 'customer'; await mount(); expect(node.textContent).toContain('Only an authorized'); expect(m.get).not.toHaveBeenCalled(); });
it('keeps completed trips completed while allowing detail corrections', async () => {
  m.get.mockResolvedValue({ name: 'Done', destination: 'Mall', tripDate: '2026-11-14', budget: 0, status: 'closed' }); await mount();
  expect(node.textContent).not.toContain('Set Active'); await click('Save trip'); expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'closed' }));
});
