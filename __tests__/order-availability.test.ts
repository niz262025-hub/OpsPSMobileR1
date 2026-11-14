import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
const m = vi.hoisted(() => ({ role: 'founder', get: vi.fn(), check: vi.fn(), confirm: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ ready: true, role: m.role, user: { id: 'owner' }, profile: { id: 'profile' }, membership: { business_id: 'business' } }) }));
vi.mock('lucide-react-native', () => ({ ArrowLeft: () => null }));
vi.mock('expo-router', () => ({ useLocalSearchParams: () => ({ id: 'order' }), router: { back: vi.fn(), push: vi.fn() } }));
vi.mock('../components/OrderPaymentPanel', () => ({ default: () => React.createElement('div', null, 'PAYMENT_PANEL') }));
vi.mock('../services/repository', () => ({ getDataSource: () => ({ orders: { getForBusiness: m.get, getForCustomer: m.get, listItemsForOrder: async () => [], checkStockAvailability: m.check, confirmAvailability: m.confirm } }) }));
import OrderDetail from '../app/order/[id]/index';
let root: ReturnType<typeof createRoot> | undefined;
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; document.body.innerHTML = ''; vi.clearAllMocks(); m.role = 'founder'; });
const pending = { id: 'order', businessId: 'business', customerName: 'UAT', total: 15, requestStatus: 'PENDING_AVAILABILITY', orderStatus: 'pending', paymentStatus: 'pending', availabilityStatus: 'pending' };
async function render(order = pending) { (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; m.get.mockResolvedValue(order); const node = document.createElement('div'); document.body.append(node); root = createRoot(node); await act(async () => root!.render(React.createElement(OrderDetail))); return node; }
describe('explicit merchant availability', () => {
 it('opening a pending order does not auto-confirm stock or request payment', async () => { const node = await render(); expect(m.check).not.toHaveBeenCalled(); expect(node.textContent).toContain('PENDING_AVAILABILITY'); expect(node.textContent).toContain('Confirm Availability'); expect(node.textContent).not.toContain('PAYMENT_PANEL'); });
 it('a customer cannot see merchant controls or payment before confirmation', async () => { m.role = 'customer'; const node = await render(); expect(node.textContent).not.toContain('Confirm Availability'); expect(node.textContent).not.toContain('PAYMENT_PANEL'); expect(m.confirm).not.toHaveBeenCalled(); });
 it('only an explicit merchant choice confirms availability', async () => { const node = await render(); m.confirm.mockResolvedValue(pending); const button = [...node.querySelectorAll('[role="button"]')].find(el => el.textContent === 'Customer Pay First'); await act(async () => button!.dispatchEvent(new MouseEvent('click', { bubbles: true }))); expect(m.confirm).toHaveBeenCalledWith('business', 'order', 'PAY_NOW'); });
 it('confirmed pay-later does not request payment prematurely', async () => { const node = await render({ ...pending, availabilityStatus: 'confirmed', requestStatus: 'PAY_LATER_OFFERED', paymentStatus: 'pay_later' }); expect(node.textContent).toContain('no payment is requested yet'); expect(node.textContent).not.toContain('PAYMENT_PANEL'); });
 it('shows payment evidence after an actual confirmed payment request', async () => { const node = await render({ ...pending, availabilityStatus: 'confirmed', paymentRequestedAt: '2026-11-15T00:00:00Z' } as typeof pending); expect(node.textContent).toContain('PAYMENT_PANEL'); });
});
