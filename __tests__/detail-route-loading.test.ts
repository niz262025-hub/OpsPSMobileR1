import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  ready: true,
  routeId: 'trip',
  membership: { business_id: 'business' },
  business: { id: 'business' },
  user: { id: 'user', user_metadata: { full_name: 'Demo User' } },
  profile: { id: 'user', full_name: 'Demo User', phone: '0123456789', address: 'Test address' },
  role: 'founder',
  getTrip: vi.fn(),
  getOrder: vi.fn(),
  listTripProducts: vi.fn(),
  listTripOrders: vi.fn(),
  listFinance: vi.fn(),
  tripSummary: vi.fn(),
  listOrderItems: vi.fn(),
  getProduct: vi.fn(),
  checkStockAvailability: vi.fn(),
  listVariants: vi.fn(),
  listBuyList: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    ready: m.ready,
    membership: m.membership,
    business: m.business,
    profile: m.profile,
    user: m.user,
    role: m.role,
  }),
}));

vi.mock('../services/repository', () => ({
  getDataSource: () => ({
    trips: {
      getForBusiness: m.getTrip,
      closeTrip: vi.fn(),
    },
    orders: {
      getForBusiness: m.getOrder,
      getForCustomer: vi.fn(),
      listItemsForOrder: m.listOrderItems,
      checkStockAvailability: m.checkStockAvailability,
      startPacking: vi.fn(),
      listBuyListForBusiness: m.listBuyList,
    },
    products: {
      listForBusiness: m.listTripProducts,
      listVariantsForProduct: m.listVariants,
      getProduct: m.getProduct,
      getProductVariant: vi.fn(),
    },
    finance: {
      listForBusiness: m.listFinance,
      getTripSummary: m.tripSummary,
      create: vi.fn(),
    },
  }),
}));

vi.mock('expo-router', () => ({
  router: { back: vi.fn(), push: vi.fn() },
  useLocalSearchParams: () => ({ id: m.routeId, businessId: 'business' }),
}));

vi.mock('lucide-react-native', () => ({
  ArrowLeft: () => null,
  Package: () => null,
  ShoppingBag: () => null,
}));

vi.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

vi.mock('../../../components/StatusBadge', () => ({
  StatusBadge: ({ label }: { label: string }) => React.createElement('span', null, label),
}));

import TripDetail from '../app/trip/[id]/index';
import OrderDetail from '../app/order/[id]/index';

let root: ReturnType<typeof createRoot> | undefined;

afterEach(() => {
  if (root) act(() => root.unmount());
  root = undefined;
  document.body.innerHTML = '';
  vi.clearAllMocks();
  m.ready = true;
  m.role = 'founder';
  m.routeId = 'trip';
  m.membership = { business_id: 'business' };
  m.business = { id: 'business' };
});

it('trip detail waits for the fetch to settle before showing a missing record', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let resolve!: (value: null) => void;
  m.getTrip.mockReturnValue(new Promise<null>((done) => { resolve = done; }));
  m.listTripProducts.mockResolvedValue([]);
  m.listFinance.mockResolvedValue([]);
  m.tripSummary.mockResolvedValue({ salesRevenue: 0, costOfGoods: 0, grossProfit: 0, moneyIn: 0, moneyOut: 0, outstandingRevenue: 0, netProfit: 0 });

  m.routeId = 'trip';
  const node = document.createElement('div');
  document.body.append(node);
  root = createRoot(node);

  await act(async () => root!.render(React.createElement(TripDetail)));
  expect(node.textContent).toContain('Loading trip');
  expect(node.textContent).not.toContain('Trip not found');

  await act(async () => resolve(null));
  expect(node.textContent).toContain('Trip not found');
  expect(node.textContent).not.toContain('Loading trip');
});

it('order detail waits for the fetch to settle before showing a missing record', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  let resolve!: (value: null) => void;
  m.getOrder.mockReturnValue(new Promise<null>((done) => { resolve = done; }));
  m.listOrderItems.mockResolvedValue([]);
  m.routeId = 'order';

  const node = document.createElement('div');
  document.body.append(node);
  root = createRoot(node);

  await act(async () => root!.render(React.createElement(OrderDetail)));
  expect(node.textContent).toContain('Loading order');
  expect(node.textContent).not.toContain('Order not found');

  await act(async () => resolve(null));
  expect(node.textContent).toContain('Order not found');
  expect(node.textContent).not.toContain('Loading order');
});
