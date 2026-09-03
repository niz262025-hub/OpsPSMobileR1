import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductStatus = 'ready' | 'preorder';
export type ProductCategory = 'Clothing' | 'Shoes' | 'Other';
export type ProductSize = string;

export type RequestStatus =
  | 'PENDING_AVAILABILITY'
  | 'AVAILABLE'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_REQUESTED'
  | 'PAY_LATER_OFFERED'
  | 'OUT_OF_STOCK'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_RECEIVED'
  | 'PACKING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'PAID'
  | 'RECEIPT_GENERATED'
  | 'ORDER_CONFIRMED'
  | 'CANCELLED';

export type OrderStatus =
  | 'pending'
  | 'payment_received'
  | 'packing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'bank' | 'qr' | string;
export type PaymentStatus =
  | 'pending'
  | 'pending_verification'
  | 'success'
  | 'paid'
  | 'partial'
  | 'pay_later';

export type PaymentMode =
  | 'customer_pays_first'
  | 'ps_buy_first_pay_later'
  | string;

export type FinanceTransactionType = 'income' | 'expense';
export type FinancePaymentMethod = 'bank' | 'cash';
export type PurchaseClassification = 'customer_order' | 'extra_stock';

export type CourierStatus =
  | 'created'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed';

export interface Receipt {
  id: string;
  receiptNumber: string;
  orderId: string;
  productId?: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'PENDING';
  createdAt: string;
}

export interface OrderShipment {
  orderId: string;
  courier: string;
  trackingNumber?: string;
  shipmentId?: string;
  status: CourierStatus;
  shippingStatus?: CourierStatus;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  postcode?: string;
  city?: string;
  state?: string;
  parcelWeight?: number;
  quantity?: number;
  parcelType?: string;
  shippingCost?: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  businessId?: string;
  tripId: string;
  name: string;
  image: string;
  costPrice: number;
  sellingPrice: number;
  status: ProductStatus;
  category: ProductCategory;
  description?: string;
  size?: string;
  stock?: number;
  initialStock?: number;
}

export interface CustomerProfile {
  id: string;
  businessId: string;
  fullName: string;
  phoneNumber: string;
  deliveryAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  businessId?: string;
  productId: string;
  size: ProductSize;
  stock: number;
}

export interface Order {
  id: string;
  businessId?: string;
  tripId: string;
  productId?: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderDate: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  requestStatus?: RequestStatus;
  paymentOption?: 'PAY_NOW' | 'PAY_LATER';
  paymentMode?: PaymentMode;
  payLaterCustomerId?: string;
  paymentRequestedAt?: string;
  paymentCode?: string;
  paymentVerifiedAt?: string;
  availabilityStatus?: 'pending' | 'confirmed' | 'not_available';
  paymentReceipt?: {
    amount: number;
    date: string;
    receiptUri?: string;
    verified: boolean;
  };
  purchase?: {
    productCost: number;
    transport: number;
    parking: number;
    toll: number;
    other: number;
    paymentMethod?: FinancePaymentMethod;
    receiptUri?: string;
    confirmedAt?: string;
  };
  purchaseId?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shipment?: OrderShipment;
  receipt?: Receipt;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  packedQuantity?: number;
}

export interface ExtraStockPurchase {
  id: string;
  tripId: string;
  productId: string;
  productVariantId: string;
  quantity: number;
  cost: number;
  sellingPrice: number;
  purchaseReceiptUri?: string;
  purchaseDate: string;
  financeTransactionId?: string;
}

export type TripExpenseType = 'Transport' | 'Hotel' | 'Parking' | 'Toll' | 'Other';

export interface TripExpense {
  id: string;
  tripId: string;
  amount: number;
  paymentType: TripExpenseType;
  description: string;
  date: string;
  receiptUri?: string;
  createdAt: string;
}

export interface TripCostOfGoods {
  id: string;
  tripId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
}

export interface BuyListItem {
  id: string;
  tripId: string;
  productVariantId?: string;
  itemName?: string;
  quantity: number;
  purchased: boolean;
}

export interface TripRecord {
  id: string;
  businessId?: string;
  name: string;
  destination: string;
  tripDate: string;
  notes: string;
  status: 'planning' | 'open' | 'closed';
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  logoUri?: string;
  phone: string;
  email: string;
  address: string;
  registrationNumber?: string;
}

export interface MarketplaceSettings {
  currency: string;
  defaultProductStatus: ProductStatus;
  defaultMarkup: number;
}

export interface TripSettings {
  defaultTripDate: string;
  destinationType: 'Shopping Mall' | 'Event' | 'Other';
  clothingSizes: string[];
  shoeSizes: string[];
}

export interface ShippingSettings {
  defaultCourier: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  integrationStatus: 'Mock / Not Connected';
}

export interface NotificationSettings {
  paymentConfirmation: boolean;
  orderAvailability: boolean;
  shipping: boolean;
}

export interface UserSettings {
  name: string;
  email: string;
}

export interface PaymentSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentReference: string;
  qrImageUri?: string;
  enabledPaymentMethods: string[];
  bnplEnabled: boolean;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: FinanceTransactionType;
  paymentMethod: FinancePaymentMethod;
  category: string;
  referenceId?: string;
  tripId?: string;
  orderId?: string;
  productId?: string;
  purchaseId?: string;
  isMonthlyExpense?: boolean;
}

export interface MockDatabaseSnapshot {
  trips: TripRecord[];
  products: Product[];
  productVariants: ProductVariant[];
  orders: Order[];
  orderItems: OrderItem[];
  buyListItems: BuyListItem[];
  tripExpenses: TripExpense[];
  tripCostOfGoods: TripCostOfGoods[];
  financeTransactions: FinanceTransaction[];
  paymentSettings: PaymentSettings;
  extraStockPurchases: ExtraStockPurchase[];
  customers: CustomerProfile[];
  businessSettings: BusinessSettings;
  marketplaceSettings: MarketplaceSettings;
  tripSettings: TripSettings;
  shippingSettings: ShippingSettings;
  notificationSettings: NotificationSettings;
  userSettings: UserSettings;
}

const LOW_STOCK_THRESHOLD = 5;
const BUSINESS_DB_PREFIX = '@opsps_business_data_';
const ACTIVE_BUSINESS_KEY = '@opsps_active_business_id';
const DEMO_BUSINESS_ID = '__opsps_demo_seed__';
const DB_CHANGE_EVENT = 'opsps-db-change';
const SHARED_STORE_URL = 'http://localhost:3001';

let idSequence = 0;
let activeBusinessId: string | null = null;
let loadedBusinessId: string | null = null;
const businessSnapshots = new Map<string, MockDatabaseSnapshot>();
const businessMutationVersions = new Map<string, number>();

function bumpBusinessVersion(businessId: string | null) {
  if (!businessId) {
    return;
  }

  const current = businessMutationVersions.get(businessId) ?? 0;
  businessMutationVersions.set(businessId, current + 1);
}

function markBusinessMutation(businessId?: string | null) {
  const normalizedBusinessId = (businessId ?? activeBusinessId ?? '').trim();
  if (!normalizedBusinessId) {
    return;
  }

  if (activeBusinessId !== normalizedBusinessId) {
    activeBusinessId = normalizedBusinessId;
  }

  bumpBusinessVersion(normalizedBusinessId);
  businessSnapshots.set(normalizedBusinessId, clone(state));
}

function readSessionBusinessId(): string | null {
  try {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const activeBusinessIdRaw = window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
      if (activeBusinessIdRaw && activeBusinessIdRaw.trim()) {
        return activeBusinessIdRaw.trim();
      }

      const raw = window.localStorage.getItem('@opsps_session');
      if (!raw) {
        return null;
      }
      const session = JSON.parse(raw) as { businessId?: string } | null;
      return session?.businessId?.trim() || null;
    }
  } catch {
    // ignore localStorage access failures in restricted runtime contexts
  }

  return null;
}

function resolveCurrentBusinessId(): string | null {
  if (activeBusinessId && activeBusinessId.trim()) {
    return activeBusinessId;
  }

  const sessionBusinessId = readSessionBusinessId();
  if (sessionBusinessId && sessionBusinessId !== activeBusinessId) {
    setActiveBusinessScope(sessionBusinessId);
  }
  return activeBusinessId;
}

function resolveOrderBusinessId(orderId: string, fallbackBusinessId?: string | null): string | null {
  const directOrder = state.orders.find((entry) => entry.id === orderId)
    ?? [...businessSnapshots.values()].flatMap((entry) => entry.orders).find((entry) => entry.id === orderId);

  if (directOrder?.businessId) {
    return directOrder.businessId.trim() || null;
  }

  const candidate = (fallbackBusinessId ?? resolveCurrentBusinessId() ?? '').trim();
  return candidate || null;
}

function ensureOrderBusinessScope(orderId: string, fallbackBusinessId?: string | null) {
  const targetBusinessId = resolveOrderBusinessId(orderId, fallbackBusinessId);
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
    return targetBusinessId;
  }
  return null;
}

function ensureBusinessScopeForMutation(businessId?: string | null) {
  const targetBusinessId = (businessId ?? resolveCurrentBusinessId() ?? '').trim();
  if (!targetBusinessId) {
    return;
  }

  if (activeBusinessId !== targetBusinessId) {
    activeBusinessId = targetBusinessId;
    loadedBusinessId = null;
  }

  const cachedSnapshot = businessSnapshots.get(targetBusinessId);
  if (cachedSnapshot) {
    state = clone(cachedSnapshot);
    return;
  }

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(getBusinessStorageKey(targetBusinessId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MockDatabaseSnapshot>;
        const normalized = normalizeSnapshot(parsed);
        businessSnapshots.set(targetBusinessId, clone(normalized));
        state = clone(normalized);
        return;
      }
    } catch {
      // Fall back to the empty/default snapshot below.
    }
  }

  const scopedStateMatchesBusiness = state.orders.some((entry) => entry.businessId === targetBusinessId)
    || state.products.some((entry) => entry.businessId === targetBusinessId)
    || state.trips.some((entry) => entry.businessId === targetBusinessId)
    || state.customers.some((entry) => entry.businessId === targetBusinessId);

  if (scopedStateMatchesBusiness) {
    const normalized = normalizeSnapshot(state);
    businessSnapshots.set(targetBusinessId, clone(normalized));
    state = clone(normalized);
    return;
  }

  const emptyState = createEmptyUATSnapshot();
  businessSnapshots.set(targetBusinessId, clone(emptyState));
  state = clone(emptyState);
}

export const PRODUCT_SIZE_OPTIONS: Record<
  Exclude<ProductCategory, 'Other'>,
  string[]
> = {
  Clothing: [
    'XS',
    'S',
    'M',
    'L',
    'XL',
    '2XL',
    '3XL',
    '4XL',
    '5XL',
    '2Y',
    '3Y',
    '4Y',
    '5Y',
    '6Y',
    '7Y',
    '8Y',
    '9Y',
    '10Y',
    '11Y',
    '12Y',
    '13Y',
    '14Y',
  ],
  Shoes: [
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
  ],
};

const initialTrips: TripRecord[] = [
  {
    id: 'trip-1',
    name: 'Johor Weekend Drop',
    destination: 'Johor Bahru',
    tripDate: '2024-08-10',
    notes: 'Marketplace demo trip',
    status: 'open',
    createdAt: '2024-08-01T09:00:00.000Z',
  },
  {
    id: 'trip-2',
    name: 'KL City Launch',
    destination: 'Kuala Lumpur',
    tripDate: '2024-08-12',
    notes: 'Second demo trip',
    status: 'open',
    createdAt: '2024-08-02T09:00:00.000Z',
  },
  {
    id: 'trip-3',
    name: 'Penang Pop-up',
    destination: 'Penang',
    tripDate: '2024-08-15',
    notes: 'Third demo trip',
    status: 'planning',
    createdAt: '2024-08-03T09:00:00.000Z',
  },
];

const initialProducts: Product[] = [
  {
    id: 'product-1',
    tripId: 'trip-1',
    name: 'Basic Tee',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
    costPrice: 16,
    sellingPrice: 35,
    status: 'ready',
    category: 'Clothing',
  },
  {
    id: 'product-2',
    tripId: 'trip-1',
    name: 'Classic Denim',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    costPrice: 24,
    sellingPrice: 48,
    status: 'ready',
    category: 'Clothing',
  },
  {
    id: 'product-3',
    tripId: 'trip-2',
    name: 'Travel Tote',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    costPrice: 20,
    sellingPrice: 42,
    status: 'preorder',
    category: 'Shoes',
  },
];

const initialVariants: ProductVariant[] = [
  { id: 'variant-1', productId: 'product-1', size: 'S', stock: 2 },
  { id: 'variant-2', productId: 'product-1', size: 'M', stock: 2 },
  { id: 'variant-3', productId: 'product-1', size: 'L', stock: 3 },
  { id: 'variant-4', productId: 'product-2', size: 'M', stock: 4 },
  { id: 'variant-5', productId: 'product-2', size: 'L', stock: 1 },
  { id: 'variant-6', productId: 'product-3', size: 'S', stock: 1 },
  { id: 'variant-7', productId: 'product-3', size: 'M', stock: 0 },
];

const initialOrders: Order[] = [
  {
    id: 'order-1',
    tripId: 'trip-1',
    customerName: 'Aisha Rahman',
    orderDate: '2024-08-08',
    paymentMethod: 'bank',
    paymentStatus: 'paid',
    shippingFee: 8,
    total: 118,
    status: 'packing',
  },
  {
    id: 'order-2',
    tripId: 'trip-1',
    customerName: 'Daniel Low',
    orderDate: '2024-08-09',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    shippingFee: 0,
    total: 70,
    status: 'pending',
  },
  {
    id: 'order-3',
    tripId: 'trip-2',
    customerName: 'Mina Chen',
    orderDate: '2024-08-10',
    paymentMethod: 'qr',
    paymentStatus: 'paid',
    shippingFee: 5,
    total: 94,
    status: 'ready',
  },
  {
    id: 'order-4',
    tripId: 'trip-3',
    customerName: 'Ravi Kumar',
    orderDate: '2024-08-11',
    paymentMethod: 'bank',
    paymentStatus: 'paid',
    shippingFee: 6,
    total: 90,
    status: 'shipped',
  },
];

const initialOrderItems: OrderItem[] = [
  { id: 'order-item-1', orderId: 'order-1', productVariantId: 'variant-2', quantity: 2 },
  { id: 'order-item-2', orderId: 'order-2', productVariantId: 'variant-2', quantity: 5 },
  { id: 'order-item-3', orderId: 'order-3', productVariantId: 'variant-6', quantity: 2 },
  { id: 'order-item-4', orderId: 'order-4', productVariantId: 'variant-4', quantity: 2 },
];

const initialBuyList: BuyListItem[] = [
  { id: 'buy-list-1', tripId: 'trip-1', productVariantId: 'variant-2', quantity: 3, purchased: false },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${idSequence++}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const listeners = new Set<() => void>();

function getBusinessStorageKey(businessId: string) {
  return `${BUSINESS_DB_PREFIX}${businessId}`;
}

function writeBrowserBusinessSnapshot(businessId: string, snapshot: MockDatabaseSnapshot) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getBusinessStorageKey(businessId), JSON.stringify(snapshot));
  } catch {
    // Ignore browser storage write failures in restricted contexts.
  }
}

async function writeSharedBusinessSnapshot(businessId: string, snapshot: MockDatabaseSnapshot): Promise<void> {
  if (!businessId || typeof fetch === 'undefined') {
    return;
  }

  try {
    await fetch(`${SHARED_STORE_URL}/api/mock-db/${encodeURIComponent(businessId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
  } catch {
    // Ignore shared-store write failures in dev environments without the mock server running.
  }
}

async function readSharedBusinessSnapshot(businessId: string): Promise<string | null> {
  if (!businessId || typeof fetch === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(`${SHARED_STORE_URL}/api/mock-db/${encodeURIComponent(businessId)}`);
    if (!response.ok) {
      return null;
    }
    const snapshot = await response.json();
    return snapshot ? JSON.stringify(snapshot) : null;
  } catch {
    return null;
  }
}

function readBrowserBusinessSnapshot(businessId: string): string | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(getBusinessStorageKey(businessId));
  } catch {
    return null;
  }
}

function createDefaultSettings(): Pick<
  MockDatabaseSnapshot,
  | 'paymentSettings'
  | 'businessSettings'
  | 'marketplaceSettings'
  | 'tripSettings'
  | 'shippingSettings'
  | 'notificationSettings'
  | 'userSettings'
> {
  return {
    paymentSettings: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      paymentReference: 'Order ID',
      enabledPaymentMethods: ['Bank Transfer', 'QR Payment'],
      bnplEnabled: true,
    },
    businessSettings: { businessName: '', phone: '', email: '', address: '' },
    marketplaceSettings: { currency: 'RM', defaultProductStatus: 'ready', defaultMarkup: 0 },
    tripSettings: {
      defaultTripDate: new Date().toISOString().slice(0, 10),
      destinationType: 'Shopping Mall',
      clothingSizes: [...PRODUCT_SIZE_OPTIONS.Clothing],
      shoeSizes: [...PRODUCT_SIZE_OPTIONS.Shoes],
    },
    shippingSettings: {
      defaultCourier: 'J&T',
      senderName: '',
      senderPhone: '',
      senderAddress: '',
      integrationStatus: 'Mock / Not Connected',
    },
    notificationSettings: { paymentConfirmation: true, orderAvailability: true, shipping: true },
    userSettings: { name: '', email: '' },
  };
}

function createSeededSnapshot(): MockDatabaseSnapshot {
  return {
    trips: clone(initialTrips),
    products: clone(initialProducts),
    productVariants: clone(initialVariants),
    orders: clone(initialOrders),
    orderItems: clone(initialOrderItems),
    buyListItems: clone(initialBuyList),
    tripExpenses: [],
    tripCostOfGoods: [],
    financeTransactions: [],
    extraStockPurchases: [],
    customers: [],
    ...createDefaultSettings(),
  };
}

function createEmptyUATSnapshot(): MockDatabaseSnapshot {
  return {
    trips: [],
    products: [],
    productVariants: [],
    orders: [],
    orderItems: [],
    buyListItems: [],
    tripExpenses: [],
    tripCostOfGoods: [],
    financeTransactions: [],
    extraStockPurchases: [],
    customers: [],
    ...createDefaultSettings(),
  };
}

function getDemoSeededSnapshot(): MockDatabaseSnapshot {
  const seeded = createSeededSnapshot();
  businessSnapshots.set(DEMO_BUSINESS_ID, clone(seeded));
  return clone(seeded);
}

let state: MockDatabaseSnapshot = createEmptyUATSnapshot();

function syncCurrentBusinessState(snapshot: MockDatabaseSnapshot): MockDatabaseSnapshot {
  const snapshotCopy = clone(snapshot);

  if (activeBusinessId) {
    businessSnapshots.set(activeBusinessId, snapshotCopy);
  }

  state = snapshotCopy;
  return state;
}

function normalizeTripStatus(status: unknown): TripRecord['status'] {
  if (status === 'open' || status === 'planning' || status === 'closed') {
    return status;
  }
  if (status === 'completed') {
    return 'closed';
  }
  return 'planning';
}

function normalizeSnapshot(raw: Partial<MockDatabaseSnapshot> | null | undefined): MockDatabaseSnapshot {
  const snapshot = raw && typeof raw === 'object' ? raw : {};
  const defaultSettings = createDefaultSettings();

  return {
    trips: Array.isArray(snapshot.trips) ? snapshot.trips.map((trip) => ({
      id: String(trip?.id ?? createId('trip')),
      businessId: String(trip?.businessId ?? activeBusinessId ?? 'business-default'),
      name: String(trip?.name ?? 'Trip'),
      destination: String(trip?.destination ?? ''),
      tripDate: String(trip?.tripDate ?? new Date().toISOString().slice(0, 10)),
      notes: String(trip?.notes ?? ''),
      status: normalizeTripStatus(trip?.status),
      createdAt: String(trip?.createdAt ?? new Date().toISOString()),
    })) : [],
    products: Array.isArray(snapshot.products)
      ? snapshot.products.map((product) => ({
          ...product,
          businessId: String(product?.businessId ?? activeBusinessId ?? 'business-default'),
        }))
      : [],
    productVariants: Array.isArray(snapshot.productVariants)
      ? snapshot.productVariants.map((variant) => ({
          ...variant,
          businessId: String(variant?.businessId ?? activeBusinessId ?? 'business-default'),
        }))
      : [],
    orders: Array.isArray(snapshot.orders) ? snapshot.orders : [],
    orderItems: Array.isArray(snapshot.orderItems) ? snapshot.orderItems : [],
    buyListItems: Array.isArray(snapshot.buyListItems) ? snapshot.buyListItems : [],
    tripExpenses: Array.isArray(snapshot.tripExpenses) ? snapshot.tripExpenses : [],
    tripCostOfGoods: Array.isArray(snapshot.tripCostOfGoods) ? snapshot.tripCostOfGoods : [],
    financeTransactions: Array.isArray(snapshot.financeTransactions) ? snapshot.financeTransactions : [],
    paymentSettings: {
      ...defaultSettings.paymentSettings,
      ...(snapshot.paymentSettings ?? {}),
      enabledPaymentMethods: Array.isArray(snapshot.paymentSettings?.enabledPaymentMethods)
        ? snapshot.paymentSettings.enabledPaymentMethods.map(String).filter(Boolean)
        : defaultSettings.paymentSettings.enabledPaymentMethods,
      bnplEnabled: Boolean(snapshot.paymentSettings?.bnplEnabled ?? defaultSettings.paymentSettings.bnplEnabled),
    },
    extraStockPurchases: Array.isArray(snapshot.extraStockPurchases) ? snapshot.extraStockPurchases : [],
    customers: Array.isArray(snapshot.customers) ? snapshot.customers.map((customer) => ({
      id: String(customer?.id ?? createId('customer')),
      businessId: String(customer?.businessId ?? activeBusinessId ?? 'business-default'),
      fullName: String(customer?.fullName ?? ''),
      phoneNumber: String(customer?.phoneNumber ?? ''),
      deliveryAddress: String(customer?.deliveryAddress ?? ''),
      createdAt: String(customer?.createdAt ?? new Date().toISOString()),
      updatedAt: String(customer?.updatedAt ?? new Date().toISOString()),
    })) : [],
    businessSettings: snapshot.businessSettings ?? defaultSettings.businessSettings,
    marketplaceSettings: snapshot.marketplaceSettings ?? defaultSettings.marketplaceSettings,
    tripSettings: snapshot.tripSettings ?? defaultSettings.tripSettings,
    shippingSettings: snapshot.shippingSettings ?? defaultSettings.shippingSettings,
    notificationSettings: snapshot.notificationSettings ?? defaultSettings.notificationSettings,
    userSettings: snapshot.userSettings ?? defaultSettings.userSettings,
  };
}

function emit(businessIdOverride?: string | null) {
  const activeScope = (businessIdOverride ?? activeBusinessId ?? '').trim();
  const targetBusinessId = activeScope || activeBusinessId || null;

  if (targetBusinessId) {
    activeBusinessId = targetBusinessId;
  }

  listeners.forEach((listener) => listener());

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(DB_CHANGE_EVENT, {
      detail: { businessId: targetBusinessId ?? DEMO_BUSINESS_ID },
    }));
  }

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(DB_CHANGE_EVENT, JSON.stringify({
        businessId: targetBusinessId ?? DEMO_BUSINESS_ID,
        timestamp: Date.now(),
      }));
    } catch {
      // Ignore localStorage write failures in non-browser or restricted contexts.
    }
  }

  if (targetBusinessId) {
    const persistedState = clone(state);
    bumpBusinessVersion(targetBusinessId);
    businessSnapshots.set(targetBusinessId, persistedState);
    writeBrowserBusinessSnapshot(targetBusinessId, persistedState);
    void writeSharedBusinessSnapshot(targetBusinessId, persistedState);
    AsyncStorage.setItem(getBusinessStorageKey(targetBusinessId), JSON.stringify(persistedState)).catch(() => undefined);
  }
}

export function setActiveBusinessScope(businessId: string | null) {
  const normalizedBusinessId = businessId?.trim() || null;
  activeBusinessId = normalizedBusinessId;

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      if (normalizedBusinessId) {
        window.localStorage.setItem(ACTIVE_BUSINESS_KEY, normalizedBusinessId);
      } else {
        window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
      }
    } catch {
      // Ignore browser storage write failures in restricted contexts.
    }
  }

  if (!normalizedBusinessId) {
    const demoState = getDemoSeededSnapshot();
    loadedBusinessId = DEMO_BUSINESS_ID;
    state = clone(demoState);
    emit();
    return;
  }

  const cachedSnapshot = businessSnapshots.get(normalizedBusinessId);
  if (cachedSnapshot) {
    state = clone(cachedSnapshot);
    loadedBusinessId = normalizedBusinessId;
    emit();
    return;
  }

  const currentVersion = businessMutationVersions.get(normalizedBusinessId) ?? 0;
  state = createEmptyUATSnapshot();
  loadedBusinessId = null;

  void loadPersistedState(normalizedBusinessId).then((snapshot) => {
    if (activeBusinessId !== normalizedBusinessId) {
      return;
    }

    if ((businessMutationVersions.get(normalizedBusinessId) ?? 0) > currentVersion) {
      return;
    }

    state = clone(snapshot);
    businessSnapshots.set(normalizedBusinessId, clone(snapshot));
    emit();
  });
}

export function clearActiveBusinessScope() {
  activeBusinessId = null;
  loadedBusinessId = DEMO_BUSINESS_ID;

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
    } catch {
      // Ignore browser storage write failures in restricted contexts.
    }
  }

  const demoState = getDemoSeededSnapshot();
  state = clone(demoState);
  emit();
}

export async function loadPersistedState(businessId: string | null = activeBusinessId): Promise<MockDatabaseSnapshot> {
  const resolvedBusinessId = businessId ?? resolveCurrentBusinessId();

  if (!resolvedBusinessId) {
    const demoState = getDemoSeededSnapshot();
    state = clone(demoState);
    loadedBusinessId = DEMO_BUSINESS_ID;
    return clone(state);
  }

  if (activeBusinessId !== resolvedBusinessId) {
    activeBusinessId = resolvedBusinessId;
  }

  const startVersion = businessMutationVersions.get(resolvedBusinessId) ?? 0;

  if (
    resolvedBusinessId === loadedBusinessId &&
    resolvedBusinessId === activeBusinessId &&
    businessSnapshots.has(resolvedBusinessId)
  ) {
    const activeSnapshot = businessSnapshots.get(resolvedBusinessId) ?? state;
    state = clone(activeSnapshot);
    return clone(state);
  }

  if (resolvedBusinessId === DEMO_BUSINESS_ID) {
    const demoState = getDemoSeededSnapshot();
    state = clone(demoState);
    businessSnapshots.set(resolvedBusinessId, clone(demoState));
    loadedBusinessId = resolvedBusinessId;
    emit();
    return clone(state);
  }

  try {
    const key = getBusinessStorageKey(resolvedBusinessId);
    const browserRaw = readBrowserBusinessSnapshot(resolvedBusinessId);
    const sharedRaw = await readSharedBusinessSnapshot(resolvedBusinessId);
    const raw = sharedRaw ?? browserRaw ?? (await AsyncStorage.getItem(key));

    if ((businessMutationVersions.get(resolvedBusinessId) ?? 0) > startVersion) {
      return clone(state);
    }

    if (!raw) {
      const emptyState = createEmptyUATSnapshot();
      businessSnapshots.set(resolvedBusinessId, clone(emptyState));
      if (resolvedBusinessId === activeBusinessId) {
        state = clone(emptyState);
      }
      loadedBusinessId = resolvedBusinessId;
      return clone(emptyState);
    }

    const parsed = JSON.parse(raw) as Partial<MockDatabaseSnapshot>;
    const normalized = normalizeSnapshot(parsed);

    if ((businessMutationVersions.get(resolvedBusinessId) ?? 0) > startVersion) {
      return clone(state);
    }

    if (
      normalized.trips.length === 0 &&
      normalized.products.length === 0 &&
      normalized.orders.length === 0 &&
      normalized.orderItems.length === 0
    ) {
      const emptyState = createEmptyUATSnapshot();
      businessSnapshots.set(resolvedBusinessId, clone(emptyState));
      if (resolvedBusinessId === activeBusinessId) {
        state = clone(emptyState);
      }
      loadedBusinessId = resolvedBusinessId;
      return clone(emptyState);
    }

    businessSnapshots.set(resolvedBusinessId, clone(normalized));
    if (resolvedBusinessId === activeBusinessId) {
      state = clone(normalized);
    }
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      try {
        window.localStorage.setItem(getBusinessStorageKey(resolvedBusinessId), JSON.stringify(normalized));
      } catch {
        // Ignore local storage write failures in restricted environments.
      }
    }
    loadedBusinessId = resolvedBusinessId;
    return clone(normalized);
  } catch {
    const fallback = createEmptyUATSnapshot();
    businessSnapshots.set(resolvedBusinessId, clone(fallback));
    if (resolvedBusinessId === activeBusinessId && (businessMutationVersions.get(resolvedBusinessId) ?? 0) <= startVersion) {
      state = clone(fallback);
    }
    loadedBusinessId = resolvedBusinessId;
    return clone(fallback);
  }
}

export async function hydrateMockDatabase() {
  await loadPersistedState(activeBusinessId);
  return getMockDatabaseSnapshot();
}

export function getMockDatabaseSnapshot(): MockDatabaseSnapshot {
  return clone(state);
}

export function resetMockDatabaseForUAT() {
  state = createEmptyUATSnapshot();
  if (activeBusinessId) {
    AsyncStorage.setItem(getBusinessStorageKey(activeBusinessId), JSON.stringify(state)).catch(() => undefined);
  }
  return getMockDatabaseSnapshot();
}

export function subscribeMockDatabase(listener: () => void) {
  listeners.add(listener);

  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => listeners.delete(listener);
  }

  const handleCustomEvent = () => {
    void loadPersistedState(activeBusinessId).then(() => listener());
  };

  const handleStorageEvent = (event: StorageEvent) => {
    const changedKey = event.key ?? '';
    const seenChange = !changedKey || changedKey.startsWith(BUSINESS_DB_PREFIX) || changedKey === DEMO_BUSINESS_ID || changedKey === DB_CHANGE_EVENT;
    if (!seenChange) {
      return;
    }

    void loadPersistedState(activeBusinessId).then(() => listener());
  };

  window.addEventListener(DB_CHANGE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    listeners.delete(listener);
    window.removeEventListener(DB_CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export function getRequestStatus(order?: Partial<Order>): Order['requestStatus'] {
  if (!order) return 'PENDING_AVAILABILITY';

  if (order.requestStatus) {
    return order.requestStatus;
  }

  if (order.availabilityStatus === 'not_available') {
    return 'OUT_OF_STOCK';
  }

  if (order.status === 'delivered') {
    return 'DELIVERED';
  }

  if (order.status === 'shipped') {
    return 'SHIPPED';
  }

  if (order.status === 'packing' || order.status === 'ready') {
    return 'PACKING';
  }

  if (order.status === 'payment_received') {
    return 'PAYMENT_RECEIVED';
  }

  if (order.paymentStatus === 'pay_later') {
    return 'PAY_LATER_OFFERED';
  }

  if (order.availabilityStatus === 'confirmed') {
    if (order.paymentStatus === 'success' || order.paymentStatus === 'paid' || Boolean(order.receipt)) {
      return 'PAYMENT_RECEIVED';
    }
    if (order.paymentMode === 'ps_buy_first_pay_later') {
      return 'PAY_LATER_OFFERED';
    }
    if (order.paymentMode === 'customer_pays_first') {
      return 'PAYMENT_REQUIRED';
    }
    return 'AVAILABLE';
  }

  if (order.paymentStatus === 'success' || order.paymentStatus === 'paid' || Boolean(order.receipt)) {
    return 'PAYMENT_RECEIVED';
  }

  return 'PENDING_AVAILABILITY';
}

export function useMockDatabase() {
  const [snapshot, setSnapshot] = useState<MockDatabaseSnapshot>(getMockDatabaseSnapshot);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      await loadPersistedState(activeBusinessId);
      if (active) {
        setSnapshot(getMockDatabaseSnapshot());
      }
    };

    void hydrate();

    const unsubscribe = subscribeMockDatabase(() => {
      setSnapshot(getMockDatabaseSnapshot());
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return snapshot;
}

export function normalizeCustomerPhone(value: string) {
  return String(value ?? '').replace(/\D/g, '');
}

export function getCustomerProfileByPhone(phone: string, businessId: string | null = activeBusinessId, snapshot = state) {
  const normalized = normalizeCustomerPhone(phone);
  if (!normalized) {
    return undefined;
  }

  const scope = (businessId ?? activeBusinessId ?? 'business-default').trim() || 'business-default';
  const localMatch = snapshot.customers.find((customer) => customer.businessId === scope && normalizeCustomerPhone(customer.phoneNumber) === normalized);
  if (localMatch) {
    return localMatch;
  }

  return [...businessSnapshots.values()].flatMap((entry) => entry.customers).find(
    (customer) => customer.businessId === scope && normalizeCustomerPhone(customer.phoneNumber) === normalized,
  );
}

export function upsertCustomerProfile(input: { businessId?: string; fullName: string; phoneNumber: string; deliveryAddress: string }) {
  const businessId = (input.businessId ?? activeBusinessId ?? 'business-default').trim() || 'business-default';
  const phoneNumber = String(input.phoneNumber ?? '').trim();
  const fullName = String(input.fullName ?? '').trim();
  const deliveryAddress = String(input.deliveryAddress ?? '').trim();
  const normalizedPhone = normalizeCustomerPhone(phoneNumber);

  if (!normalizedPhone) {
    return null;
  }

  const existing = state.customers.find((customer) => customer.businessId === businessId && normalizeCustomerPhone(customer.phoneNumber) === normalizedPhone);
  const now = new Date().toISOString();

  if (existing) {
    const updated = {
      ...existing,
      fullName: fullName || existing.fullName,
      phoneNumber: phoneNumber || existing.phoneNumber,
      deliveryAddress: deliveryAddress || existing.deliveryAddress,
      updatedAt: now,
    };

    state.customers = state.customers.map((customer) => customer.id === existing.id ? updated : customer);
    markBusinessMutation(businessId);
    emit();
    return updated;
  }

  const profile: CustomerProfile = {
    id: createId('customer-profile'),
    businessId,
    fullName,
    phoneNumber,
    deliveryAddress,
    createdAt: now,
    updatedAt: now,
  };

  state.customers = [...state.customers, profile];
  markBusinessMutation(businessId);
  emit();
  return profile;
}

export function createTrip(input: { name: string; destination: string; tripDate: string; notes?: string; businessId?: string; }) {
  const activeFounderBusinessId = resolveCurrentBusinessId();
  const founderBusinessId = (activeFounderBusinessId ?? input.businessId ?? '').trim();

  if (!founderBusinessId || founderBusinessId === 'business-default' || founderBusinessId === DEMO_BUSINESS_ID) {
    throw new Error('Founder business scope is required before creating a trip.');
  }

  ensureBusinessScopeForMutation(founderBusinessId);
  loadedBusinessId = founderBusinessId;

  const trip: TripRecord = {
    id: createId('trip'),
    businessId: founderBusinessId,
    name: input.name.trim(),
    destination: input.destination.trim(),
    tripDate: input.tripDate.trim(),
    notes: input.notes?.trim() ?? '',
    status: 'planning',
    createdAt: new Date().toISOString(),
  };

  state.trips = [...state.trips, trip];
  businessSnapshots.set(founderBusinessId, clone(state));
  businessMutationVersions.set(founderBusinessId, (businessMutationVersions.get(founderBusinessId) ?? 0) + 1);
  writeBrowserBusinessSnapshot(founderBusinessId, clone(state));
  AsyncStorage.setItem(getBusinessStorageKey(founderBusinessId), JSON.stringify(state)).catch(() => undefined);
  emit();
  return trip;
}

export function closeTrip(tripId: string) {
  state.trips = state.trips.map((trip) =>
    trip.id === tripId ? { ...trip, status: 'closed' } : trip,
  );
  emit();
  return true;
}

export function addTripExpense(input: {
  tripId: string;
  amount: number;
  paymentType: TripExpenseType;
  description: string;
  date?: string;
  receiptUri?: string;
}) {
  const amount = Number(input.amount) || 0;
  if (!input.tripId || amount <= 0) {
    return null;
  }

  const expense: TripExpense = {
    id: createId('trip-expense'),
    tripId: input.tripId,
    amount,
    paymentType: input.paymentType,
    description: input.description.trim(),
    date: input.date ?? new Date().toISOString().slice(0, 10),
    receiptUri: input.receiptUri,
    createdAt: new Date().toISOString(),
  };

  state.tripExpenses = [...state.tripExpenses, expense];

  const financeExists = state.financeTransactions.some(
    (tx) => tx.referenceId === expense.id && tx.category === 'Trip Expense',
  );

  if (!financeExists) {
    addFinanceTransaction({
      description: `${expense.paymentType}: ${expense.description || 'Trip expense'}`,
      amount: expense.amount,
      type: 'expense',
      paymentMethod: 'cash',
      category: 'Trip Expense',
      referenceId: expense.id,
      tripId: expense.tripId,
      date: expense.date,
    });
  }

  emit();
  return expense;
}

export function getTripExpenses(tripId: string, snapshot = state) {
  return snapshot.tripExpenses.filter((expense) => expense.tripId === tripId);
}

export function addTripCostOfGoods(input: {
  tripId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}) {
  const quantity = Number(input.quantity) || 0;
  const unitCost = Number(input.unitCost) || 0;
  const trimmedName = input.productName.trim();

  if (!input.tripId || !trimmedName || quantity <= 0 || unitCost <= 0) {
    return null;
  }

  const totalCost = quantity * unitCost;
  const item: TripCostOfGoods = {
    id: createId('trip-cogs'),
    tripId: input.tripId,
    productName: trimmedName,
    quantity,
    unitCost,
    totalCost,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  state.tripCostOfGoods = [...state.tripCostOfGoods, item];
  emit();
  return item;
}

export function getTripCostOfGoods(tripId: string, snapshot = state) {
  return snapshot.tripCostOfGoods.filter((item) => item.tripId === tripId);
}

export function createProduct(input: {
  name: string;
  category: ProductCategory;
  image: string;
  tripId?: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  size?: string;
  stock?: number;
  businessId?: string;
}) {
  const productId = createId('product');
  const resolvedTripId = input.tripId && input.tripId.trim() ? input.tripId : 'trip-1';
  const businessId = (input.businessId ?? resolveCurrentBusinessId() ?? activeBusinessId ?? 'business-default').trim() || 'business-default';
  ensureBusinessScopeForMutation(businessId);
  const sizeValue = input.size?.trim() || 'Standard';
  const stockValue = Number(input.stock ?? 0);
  const product: Product = {
    id: productId,
    businessId,
    tripId: resolvedTripId,
    name: input.name.trim(),
    image: input.image.trim(),
    costPrice: input.costPrice,
    sellingPrice: input.sellingPrice,
    status: 'ready',
    category: input.category,
    description: input.description?.trim(),
    size: sizeValue,
    stock: Number.isFinite(stockValue) ? Math.max(0, stockValue) : 0,
    initialStock: Number.isFinite(stockValue) ? Math.max(0, stockValue) : 0,
  };
  state.products = [...state.products, product];
  state.productVariants = [
    ...state.productVariants,
    {
      id: createId('variant'),
      businessId,
      productId,
      size: input.size ?? 'Standard',
      stock: input.stock ?? 0,
    },
  ];
  markBusinessMutation(businessId);
  emit();
  return product;
}

export function createBuyListItem(input: { tripId: string; itemName: string; quantity: number }) {
  const item: BuyListItem = {
    id: createId('buy-list'),
    tripId: input.tripId,
    itemName: input.itemName.trim(),
    quantity: Math.max(1, input.quantity),
    purchased: false,
  };
  state.buyListItems = [...state.buyListItems, item];
  emit();
  return item;
}

export function updateBuyListItem(itemId: string, input: { itemName: string; quantity: number }) {
  state.buyListItems = state.buyListItems.map((item) =>
    item.id === itemId ? { ...item, itemName: input.itemName.trim(), quantity: Math.max(1, input.quantity) } : item,
  );
  emit();
  return true;
}

export function deleteBuyListItem(itemId: string) {
  state.buyListItems = state.buyListItems.filter((item) => item.id !== itemId);
  emit();
  return true;
}

export function addFinanceTransaction(input: Omit<FinanceTransaction, 'id' | 'date'> & { date?: string }) {
  const transaction: FinanceTransaction = { ...input, id: createId('txn'), date: input.date ?? new Date().toISOString() };
  state.financeTransactions = [transaction, ...state.financeTransactions];
  emit();
  return transaction;
}

export function addMonthlyExpense(input: { description: string; amount: number; category: string; paymentMethod: FinancePaymentMethod; notes?: string }) {
  return addFinanceTransaction({
    description: input.notes ? `${input.description} - ${input.notes}` : input.description,
    amount: Math.abs(input.amount),
    type: 'expense',
    paymentMethod: input.paymentMethod,
    category: input.category,
    isMonthlyExpense: true,
  });
}

export function updatePaymentSettings(settings: PaymentSettings) {
  state.paymentSettings = {
    ...settings,
    bankName: settings.bankName.trim(),
    accountName: settings.accountName.trim(),
    accountNumber: settings.accountNumber.trim(),
    paymentReference: settings.paymentReference.trim(),
    enabledPaymentMethods: Array.isArray(settings.enabledPaymentMethods)
      ? settings.enabledPaymentMethods.map((method) => String(method).trim()).filter(Boolean)
      : state.paymentSettings.enabledPaymentMethods,
    bnplEnabled: Boolean(settings.bnplEnabled),
  };
  emit();
  return true;
}

export function updateSettings<K extends keyof Pick<MockDatabaseSnapshot, 'businessSettings' | 'marketplaceSettings' | 'tripSettings' | 'shippingSettings' | 'notificationSettings' | 'userSettings'>>(key: K, value: MockDatabaseSnapshot[K]) {
  state[key] = value;
  emit();
  return true;
}

export function isPaymentConfigured(settings: PaymentSettings) {
  const enabledMethods = getConfiguredPaymentMethods(settings);
  return Boolean(settings.bankName.trim() && settings.accountName.trim() && settings.accountNumber.trim() && settings.paymentReference.trim()) || enabledMethods.length > 0;
}

export function updateFinanceTransaction(id: string, input: Partial<Omit<FinanceTransaction, 'id'>>) {
  state.financeTransactions = state.financeTransactions.map((transaction) => transaction.id === id ? { ...transaction, ...input } : transaction);
  emit();
  return true;
}

export function deleteFinanceTransaction(id: string) {
  state.financeTransactions = state.financeTransactions.filter((transaction) => transaction.id !== id);
  emit();
  return true;
}

export function updateTripStatus(tripId: string, status: TripRecord['status']) {
  const trip = state.trips.find((entry) => entry.id === tripId);
  if (!trip) return null;

  state.trips = state.trips.map((entry) =>
    entry.id === tripId ? { ...entry, status } : entry,
  );
  emit();
  return true;
}

export function getTripProducts(tripId: string, snapshot = state) {
  return snapshot.products.filter((product) => product.tripId === tripId);
}

export function getTripOrders(tripId: string, snapshot = state) {
  return snapshot.orders.filter((order) => order.tripId === tripId);
}

export function getTripProfit(tripId: string, snapshot = state) {
  const orders = getTripOrders(tripId, snapshot).filter((order) => order.availabilityStatus !== 'not_available');
  const salesRevenue = orders.reduce((total, order) => total + order.total, 0);
  const costOfGoods = getTripCostOfGoods(tripId, snapshot).reduce((total, item) => total + item.totalCost, 0);
  const moneyOut = snapshot.financeTransactions
    .filter((transaction) => transaction.tripId === tripId && transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const moneyIn = snapshot.financeTransactions
    .filter((transaction) => transaction.tripId === tripId && transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const grossProfit = salesRevenue - costOfGoods;

  return {
    salesRevenue,
    costOfGoods,
    grossProfit,
    moneyIn,
    moneyOut,
    outstandingRevenue: Math.max(0, salesRevenue - moneyIn),
    netProfit: salesRevenue - costOfGoods - moneyOut,
  };
}

export function getTripBuyListItems(tripId: string, snapshot = state) {
  const manualItems = snapshot.buyListItems.filter((item) => item.tripId === tripId);
  const derivedItems: BuyListItem[] = [];

  for (const order of snapshot.orders.filter((entry) => entry.tripId === tripId)) {
    for (const orderItem of snapshot.orderItems.filter((entry) => entry.orderId === order.id)) {
      const variant = getProductVariant(orderItem.productVariantId, snapshot);
      const product = variant ? getProduct(variant.productId, snapshot) : undefined;

      if (!product || !variant) {
        continue;
      }

      derivedItems.push({
        id: `${order.id}-${variant.id}`,
        tripId,
        productVariantId: variant.id,
        itemName: product.name,
        quantity: Math.max(1, orderItem.quantity),
        purchased: false,
      });
    }
  }

  const merged = new Map<string, BuyListItem>();

  for (const item of [...derivedItems, ...manualItems]) {
    const key = item.productVariantId ?? item.itemName ?? item.id;
    const existing = merged.get(key);

    if (existing) {
      merged.set(key, {
        ...existing,
        itemName: existing.itemName ?? item.itemName ?? 'Item',
        quantity: existing.quantity + Math.max(1, item.quantity),
        purchased: existing.purchased || item.purchased,
      });
      continue;
    }

    merged.set(key, {
      ...item,
      itemName: item.itemName ?? 'Item',
      quantity: Math.max(1, item.quantity),
    });
  }

  return [...merged.values()];
}

export function confirmOrderAvailability(orderId: string, available: boolean) {
  const order = state.orders.find((entry) => entry.id === orderId) ?? [...businessSnapshots.values()].flatMap((entry) => entry.orders).find((entry) => entry.id === orderId);
  const targetBusinessId = (order?.businessId ?? resolveCurrentBusinessId() ?? activeBusinessId ?? '').trim();
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  if (!available) {
    state.orders = state.orders.map((order) => order.id === orderId ? {
      ...order,
      availabilityStatus: 'not_available',
      requestStatus: 'OUT_OF_STOCK',
      paymentMode: undefined,
      paymentOption: undefined,
      payLaterCustomerId: undefined,
      paymentStatus: 'pending',
      paymentCode: undefined,
      paymentRequestedAt: undefined,
      status: 'cancelled',
    } : order);
  } else {
    const currentOrder = state.orders.find((entry) => entry.id === orderId);
    state.orders = state.orders.map((entry) => entry.id === orderId ? {
      ...entry,
      availabilityStatus: 'confirmed',
      requestStatus: 'AVAILABLE',
      paymentOption: undefined,
      paymentMode: undefined,
      paymentStatus: 'pending',
      paymentRequestedAt: undefined,
      paymentCode: undefined,
      status: entry.status === 'cancelled' ? 'pending' : entry.status,
    } : entry);
    if (!currentOrder && targetBusinessId) {
      const scopedOrders = businessSnapshots.get(targetBusinessId)?.orders ?? [];
      const scopedOrder = scopedOrders.find((entry) => entry.id === orderId);
      if (scopedOrder) {
        state.orders = state.orders.map((entry) => entry.id === orderId ? { ...entry, ...scopedOrder, availabilityStatus: 'confirmed', requestStatus: 'AVAILABLE', paymentStatus: 'pending', paymentOption: undefined, paymentMode: undefined, paymentRequestedAt: undefined, paymentCode: undefined, status: scopedOrder.status === 'cancelled' ? 'pending' : scopedOrder.status } : entry);
      }
    }
  }
  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId);
  return available;
}

export function setOrderPaymentMode(orderId: string, paymentMode: PaymentMode, payLaterCustomerId?: string) {
  const targetBusinessId = ensureOrderBusinessScope(orderId, activeBusinessId);
  const normalizedMode = paymentMode === 'Buy Now Pay Later'
    ? 'ps_buy_first_pay_later'
    : paymentMode === 'Pay Now'
      ? 'customer_pays_first'
      : paymentMode;

  state.orders = state.orders.map((order) => order.id === orderId ? {
    ...order,
    paymentMode: normalizedMode,
    paymentOption: normalizedMode === 'ps_buy_first_pay_later' ? 'PAY_LATER' : 'PAY_NOW',
    requestStatus: normalizedMode === 'ps_buy_first_pay_later' ? 'PAY_LATER_OFFERED' : 'PAYMENT_REQUIRED',
    payLaterCustomerId: normalizedMode === 'ps_buy_first_pay_later' ? (payLaterCustomerId ?? order.payLaterCustomerId ?? order.customerName) : undefined,
    paymentStatus: normalizedMode === 'ps_buy_first_pay_later' ? 'pay_later' : 'pending',
    paymentRequestedAt: normalizedMode === 'customer_pays_first' ? new Date().toISOString() : undefined,
    paymentCode: order.paymentCode ?? `OPSPS-${String(state.orders.indexOf(order) + 1).padStart(6, '0')}`,
    availabilityStatus: 'confirmed',
    status: order.status === 'cancelled' ? 'pending' : order.status,
  } : order);

  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId);
  return true;
}

export function offerCustomerPaymentOption(orderId: string, option: 'pay_now' | 'pay_later') {
  const order = state.orders.find((entry) => entry.id === orderId) ?? [...businessSnapshots.values()].flatMap((entry) => entry.orders).find((entry) => entry.id === orderId);
  if (!order) {
    return null;
  }

  const targetBusinessId = (order.businessId ?? resolveCurrentBusinessId() ?? activeBusinessId ?? '').trim();
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  const paymentMode = option === 'pay_now' ? 'customer_pays_first' : 'ps_buy_first_pay_later';

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    availabilityStatus: 'confirmed',
    requestStatus: option === 'pay_now' ? 'PAYMENT_REQUIRED' : 'PAY_LATER_OFFERED',
    paymentOption: option === 'pay_now' ? 'PAY_NOW' : 'PAY_LATER',
    paymentMode,
    paymentStatus: option === 'pay_now' ? 'pending' : 'pay_later',
    paymentRequestedAt: option === 'pay_now' ? new Date().toISOString() : undefined,
    payLaterCustomerId: option === 'pay_later' ? (entry.payLaterCustomerId ?? entry.customerName) : undefined,
    status: entry.status === 'cancelled' ? 'pending' : entry.status,
  } : entry);

  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId);
  return state.orders.find((entry) => entry.id === orderId) ?? null;
}

export function recordPayment(orderId: string, amount: number, receiptUri?: string) {
  const targetBusinessId = resolveOrderBusinessId(orderId, activeBusinessId) ?? activeBusinessId ?? '';
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  state.orders = state.orders.map((order) => order.id === orderId ? {
    ...order,
    paymentStatus: 'success',
    requestStatus: 'PAYMENT_RECEIVED',
    status: 'payment_received',
    paymentReceipt: { amount, date: new Date().toISOString(), receiptUri, verified: false },
  } : order);
  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId || null);
  return true;
}

export function verifyPayment(orderId: string) {
  const targetBusinessId = resolveOrderBusinessId(orderId, activeBusinessId) ?? activeBusinessId ?? '';
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  const existingOrder = state.orders.find((order) => order.id === orderId);
  if (!existingOrder?.paymentReceipt || existingOrder.paymentReceipt.verified) return false;
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'success', paymentVerifiedAt: new Date().toISOString(), paymentReceipt: { ...order.paymentReceipt!, verified: true }, requestStatus: 'PAYMENT_RECEIVED', status: 'payment_received' } : order);
  const order = state.orders.find((entry) => entry.id === orderId);
  if (order?.paymentReceipt && !state.financeTransactions.some((item) => item.referenceId === order.id && item.category === 'Customer Payment')) {
    addFinanceTransaction({ description: 'Customer Payment', amount: order.paymentReceipt.amount, type: 'income', paymentMethod: order.paymentMethod === 'cash' ? 'cash' : 'bank', category: 'Customer Payment', referenceId: order.id, tripId: order.tripId, orderId: order.id });
  }
  if (order && !order.receipt) {
    generateOrderReceipt(order.id, order.customerName, order.total, order.paymentMethod.toString());
  }
  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId || null);
  return true;
}

export function generateOrderReceipt(orderId: string, customerName: string, amount: number, paymentMethod: string) {
  const targetBusinessId = resolveOrderBusinessId(orderId, activeBusinessId) ?? activeBusinessId ?? '';
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) return null;

  const orderItem = state.orderItems.find((item) => item.orderId === orderId);
  const variant = orderItem ? getProductVariant(orderItem.productVariantId, state) : undefined;
  const receiptId = createId('receipt');
  const receipt: Receipt = {
    id: receiptId,
    receiptNumber: `RCPT-${new Date().getFullYear()}-${String((state.orders.filter((entry) => entry.receipt).length + 1)).padStart(6, '0')}`,
    orderId,
    productId: variant?.productId ?? order.productId,
    customerName: customerName || order.customerName,
    amount,
    paymentMethod,
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString(),
  };

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    receipt,
    paymentStatus: 'success',
    requestStatus: 'PAYMENT_RECEIVED',
    status: 'payment_received',
    paymentVerifiedAt: entry.paymentVerifiedAt ?? new Date().toISOString(),
  } : entry);
  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId || null);
  return receipt;
}

export function completeCustomerPayment(orderId: string, paymentMethod: string) {
  const targetBusinessId = ensureOrderBusinessScope(orderId, activeBusinessId);
  const order = state.orders.find((entry) => entry.id === orderId) ?? [...businessSnapshots.values()].flatMap((entry) => entry.orders).find((entry) => entry.id === orderId);
  if (!order) return null;

  const orderItem = state.orderItems.find((entry) => entry.orderId === orderId) ?? [...businessSnapshots.values()].flatMap((entry) => entry.orderItems).find((entry) => entry.orderId === orderId);
  const quantityRequested = Math.max(1, Number(orderItem?.quantity ?? 1));
  const variantCandidate = orderItem
    ? getProductVariant(orderItem.productVariantId, state, targetBusinessId)
      ?? (order.productId ? getProductVariantByProduct(order.productId, state, targetBusinessId)[0] : undefined)
    : (order.productId ? getProductVariantByProduct(order.productId, state, targetBusinessId)[0] : undefined);

  if (order.paymentStatus === 'success' || order.requestStatus === 'PAYMENT_RECEIVED' || order.receipt) {
    const existingReceipt = order.receipt ?? generateOrderReceipt(orderId, order.customerName, order.total, paymentMethod || String(order.paymentMethod || 'Bank Transfer'));
    if (!existingReceipt) {
      return null;
    }
    if (!state.financeTransactions.some((transaction) => transaction.referenceId === orderId && transaction.category === 'Customer Payment')) {
      addFinanceTransaction({
        description: 'Customer Payment',
        amount: order.total,
        type: 'income',
        paymentMethod: String(paymentMethod).toLowerCase().includes('qr') ? 'bank' : 'cash',
        category: 'Customer Payment',
        referenceId: orderId,
        tripId: order.tripId,
        orderId: order.id,
      });
    }
    return existingReceipt;
  }

  if (variantCandidate && variantCandidate.stock < quantityRequested) {
    return null;
  }

  if (variantCandidate) {
    reduceStock(variantCandidate.id, quantityRequested);
  }

  const receipt = generateOrderReceipt(orderId, order.customerName, order.total, paymentMethod || String(order.paymentMethod || 'Bank Transfer'));
  if (!receipt) return null;

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    requestStatus: 'PAYMENT_RECEIVED',
    paymentStatus: 'success',
    status: 'payment_received',
  } : entry);

  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }

  emit(targetBusinessId);

  if (!state.financeTransactions.some((transaction) => transaction.referenceId === orderId && transaction.category === 'Customer Payment')) {
    addFinanceTransaction({
      description: 'Customer Payment',
      amount: order.total,
      type: 'income',
      paymentMethod: String(paymentMethod).toLowerCase().includes('qr') ? 'bank' : 'cash',
      category: 'Customer Payment',
      referenceId: orderId,
      tripId: order.tripId,
      orderId: order.id,
    });
  }

  return receipt;
}

export function rejectPayment(orderId: string) {
  const targetBusinessId = resolveOrderBusinessId(orderId, activeBusinessId) ?? activeBusinessId ?? '';
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'pending', paymentReceipt: undefined } : order);
  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId || null);
  return true;
}

export function confirmPayLater(orderId: string) {
  const order = state.orders.find((entry) => entry.id === orderId) ?? [...businessSnapshots.values()].flatMap((entry) => entry.orders).find((entry) => entry.id === orderId);
  if (!order) return null;

  const targetBusinessId = (order.businessId ?? resolveCurrentBusinessId() ?? activeBusinessId ?? '').trim();
  if (targetBusinessId) {
    ensureBusinessScopeForMutation(targetBusinessId);
  }

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    requestStatus: 'PAY_LATER_OFFERED',
    paymentOption: 'PAY_LATER',
    paymentMode: 'ps_buy_first_pay_later',
    paymentStatus: 'pay_later',
    availabilityStatus: 'confirmed',
    status: 'pending',
  } : entry);

  if (targetBusinessId) {
    markBusinessMutation(targetBusinessId);
  }
  emit(targetBusinessId);
  return state.orders.find((entry) => entry.id === orderId) ?? null;
}

export function confirmPurchase(orderId: string, purchase: NonNullable<Order['purchase']>) {
  const existingOrder = state.orders.find((entry) => entry.id === orderId);
  if (existingOrder?.purchase?.confirmedAt) return true;
  if (existingOrder?.paymentMode === 'customer_pays_first' && existingOrder.paymentStatus !== 'success' && existingOrder.paymentStatus !== 'paid') return false;
  const purchaseId = createId('purchase');
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, purchaseId, purchase: { ...purchase, confirmedAt: new Date().toISOString() }, status: 'packing' } : order);
  const order = state.orders.find((entry) => entry.id === orderId);
  if (order) {
    const orderItem = state.orderItems.find((item) => item.orderId === order.id);
    const product = orderItem ? getProduct(getProductVariant(orderItem.productVariantId, state)?.productId ?? '', state) : undefined;
    const purchaseTotal = purchase.productCost + purchase.transport + purchase.parking + purchase.toll + purchase.other;
    if (purchaseTotal > 0) addFinanceTransaction({ description: `Purchase: ${product?.name ?? 'Product'}`, amount: purchaseTotal, type: 'expense', paymentMethod: purchase.paymentMethod ?? 'cash', category: 'Trip Purchase', referenceId: purchaseId, purchaseId, tripId: order.tripId, orderId: order.id, productId: product?.id });
  }
  emit();
  return true;
}

export function startPacking(orderId: string) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) {
    return false;
  }

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    packedAt: new Date().toISOString(),
    status: 'packing',
    requestStatus: 'PACKING',
  } : entry);
  emit();
  return true;
}

export function markOrderPacked(orderId: string) {
  const items = state.orderItems.filter((item) => item.orderId === orderId);
  if (!items.length || items.some((item) => (item.packedQuantity ?? 0) < item.quantity)) return false;
  state.orders = state.orders.map((order) => order.id === orderId ? {
    ...order,
    packedAt: new Date().toISOString(),
    status: 'packing',
    requestStatus: 'PACKING',
  } : order);
  emit();
  return true;
}

export function createOrderShipment(orderId: string, input: {
  courier?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  postcode?: string;
  city?: string;
  state?: string;
  parcelWeight?: number;
  quantity?: number;
  parcelType?: string;
  shippingCost?: number;
}) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) {
    return null;
  }

  const courier = input.courier || order.shipment?.courier || state.shippingSettings.defaultCourier || 'J&T';
  const shipmentId = order.shipment?.shipmentId ?? `mock-shipment-${order.id}`;
  const trackingNumber = order.shipment?.trackingNumber ?? `MOCK-EP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const createdAt = order.shipment?.createdAt ?? new Date().toISOString();

  const shipment: OrderShipment = {
    orderId: order.id,
    courier,
    trackingNumber,
    shipmentId,
    status: 'created',
    shippingStatus: 'created',
    recipientName: input.recipientName ?? order.customerName ?? '',
    recipientPhone: input.recipientPhone ?? order.customerPhone ?? '',
    deliveryAddress: input.deliveryAddress ?? order.deliveryAddress ?? '',
    postcode: input.postcode ?? '',
    city: input.city ?? '',
    state: input.state ?? '',
    parcelWeight: Number(input.parcelWeight ?? 0) || undefined,
    quantity: Number(input.quantity ?? 1) || 1,
    parcelType: input.parcelType ?? 'Parcel',
    shippingCost: Number(input.shippingCost ?? 0) || 0,
    createdAt,
  };

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    shipment,
    status: entry.status === 'delivered' ? 'delivered' : 'packing',
    requestStatus: 'PACKING',
  } : entry);
  emit();
  return shipment;
}

export function submitEasyParcelShipment(orderId: string, input: {
  courier?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  postcode?: string;
  city?: string;
  state?: string;
  parcelWeight?: number;
  quantity?: number;
  parcelType?: string;
  shippingCost?: number;
}) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) {
    return null;
  }

  const courier = input.courier || order.shipment?.courier || state.shippingSettings.defaultCourier || 'J&T';
  const recipientName = (input.recipientName ?? order.customerName ?? '').trim();
  const recipientPhone = (input.recipientPhone ?? order.customerPhone ?? '').trim();
  const deliveryAddress = (input.deliveryAddress ?? order.deliveryAddress ?? '').trim();
  const parcelWeight = Number(input.parcelWeight ?? 0);

  if (!courier || !recipientName || !recipientPhone || !deliveryAddress || !Number.isFinite(parcelWeight) || parcelWeight <= 0) {
    return null;
  }

  const created = createOrderShipment(orderId, input);
  if (!created) {
    return null;
  }

  state.orders = state.orders.map((entry) => entry.id === orderId ? {
    ...entry,
    shippedAt: new Date().toISOString(),
    shipment: {
      ...entry.shipment,
      ...created,
      status: 'shipped',
      shippingStatus: 'shipped',
      createdAt: entry.shipment?.createdAt ?? created.createdAt ?? new Date().toISOString(),
    },
    status: 'shipped',
    requestStatus: 'SHIPPED',
  } : entry);
  emit();
  return state.orders.find((entry) => entry.id === orderId)?.shipment ?? null;
}

export function setOrderItemPacked(orderItemId: string, packed: boolean) {
  state.orderItems = state.orderItems.map((item) => item.id === orderItemId ? { ...item, packedQuantity: packed ? item.quantity : 0 } : item);
  emit();
  return true;
}

export function createMockShipment(orderId: string, courier: string) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order || order.shipment) return Boolean(order?.shipment);
  const shipment: OrderShipment = {
    orderId: order.id,
    courier,
    shipmentId: `mock-shipment-${order.id}`,
    trackingNumber: createId('MOCK'),
    status: 'created',
    shippingStatus: 'created',
    recipientName: order.customerName,
    recipientPhone: order.customerPhone ?? '',
    deliveryAddress: order.deliveryAddress ?? '',
    createdAt: new Date().toISOString(),
  };
  state.orders = state.orders.map((entry) => entry.id === orderId ? { ...entry, shipment } : entry);
  emit();
  return true;
}

export function markOrderShipped(orderId: string, courier: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? {
    ...order,
    shippedAt: new Date().toISOString(),
    shipment: {
      ...order.shipment,
      orderId: order.id,
      courier,
      shipmentId: order.shipment?.shipmentId ?? `mock-shipment-${order.id}`,
      trackingNumber: order.shipment?.trackingNumber ?? createId('MOCK'),
      status: 'shipped',
      shippingStatus: 'shipped',
      recipientName: order.shipment?.recipientName ?? order.customerName,
      recipientPhone: order.shipment?.recipientPhone ?? order.customerPhone ?? '',
      deliveryAddress: order.shipment?.deliveryAddress ?? order.deliveryAddress ?? '',
      createdAt: order.shipment?.createdAt ?? new Date().toISOString(),
    },
    status: 'shipped',
    requestStatus: 'SHIPPED',
  } : order);
  emit();
  return true;
}

export function syncShipmentStatus(orderId: string): CourierStatus | null {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order?.shipment) return null;
  const progression: CourierStatus[] = ['created', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentIndex = progression.indexOf(order.shipment.status);
  const nextStatus = progression[Math.min(currentIndex + 1, progression.length - 1)];
  state.orders = state.orders.map((entry) => entry.id === orderId ? { ...entry, shipment: { ...entry.shipment!, status: nextStatus }, ...(nextStatus === 'delivered' ? { status: 'delivered' as OrderStatus, deliveredAt: entry.deliveredAt ?? new Date().toISOString() } : {}) } : entry);
  emit();
  return nextStatus;
}

export function markOrderDeliveredFromCourier(orderId: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? {
    ...order,
    deliveredAt: new Date().toISOString(),
    shipment: order.shipment ? { ...order.shipment, status: 'delivered' } : undefined,
    status: 'delivered',
    requestStatus: 'DELIVERED',
  } : order);
  emit();
  return true;
}

export function getProductVariant(productVariantId: string, snapshot = state, businessId: string | null = activeBusinessId) {
  const scope = (businessId ?? activeBusinessId ?? '').trim();

  const productMatch = scope
    ? snapshot.products.find((product) => product.id === productVariantId && product.businessId === scope)
    : snapshot.products.find((product) => product.id === productVariantId);

  if (productMatch) {
    const variants = scope
      ? snapshot.productVariants.filter((variant) => variant.productId === productMatch.id && variant.businessId === scope)
      : snapshot.productVariants.filter((variant) => variant.productId === productMatch.id);
    if (variants.length > 0) {
      return variants[0];
    }
  }

  const scopedMatch = scope
    ? snapshot.productVariants.find((variant) => variant.id === productVariantId && variant.businessId === scope)
    : snapshot.productVariants.find((variant) => variant.id === productVariantId);

  if (scopedMatch) {
    return scopedMatch;
  }

  const knownMatches = [...businessSnapshots.values()].filter((entry) => !scope || entry.products.some((product) => product.businessId === scope) || entry.productVariants.some((variant) => variant.businessId === scope));
  const scopedBusinessSnapshot = scope ? knownMatches.find((entry) => entry.productVariants.some((variant) => variant.id === productVariantId && variant.businessId === scope)) : undefined;
  if (scopedBusinessSnapshot) {
    return scopedBusinessSnapshot.productVariants.find((variant) => variant.id === productVariantId && variant.businessId === scope);
  }

  const productFromSnapshots = scope
    ? [...businessSnapshots.values()].find((entry) => entry.products.some((product) => product.id === productVariantId && product.businessId === scope))?.products.find((product) => product.id === productVariantId && product.businessId === scope)
    : [...businessSnapshots.values()].find((entry) => entry.products.some((product) => product.id === productVariantId))?.products.find((product) => product.id === productVariantId);

  if (productFromSnapshots) {
    const variantMatches = scope
      ? [...businessSnapshots.values()].flatMap((entry) => entry.productVariants.filter((variant) => variant.productId === productFromSnapshots.id && variant.businessId === scope))
      : [...businessSnapshots.values()].flatMap((entry) => entry.productVariants.filter((variant) => variant.productId === productFromSnapshots.id));
    if (variantMatches.length > 0) {
      return variantMatches[0];
    }
  }

  return snapshot.productVariants.find((variant) => variant.id === productVariantId)
    ?? [...businessSnapshots.values()].find((entry) => entry.productVariants.some((variant) => variant.id === productVariantId))?.productVariants.find((variant) => variant.id === productVariantId);
}

export function getProduct(productId: string, snapshot = state, businessId: string | null = activeBusinessId) {
  const scope = (businessId ?? activeBusinessId ?? '').trim();
  const scopedMatch = scope
    ? snapshot.products.find((product) => product.id === productId && product.businessId === scope)
    : snapshot.products.find((product) => product.id === productId);

  if (scopedMatch) {
    return scopedMatch;
  }

  const scopedBusinessSnapshot = scope
    ? [...businessSnapshots.values()].find((entry) => entry.products.some((product) => product.id === productId && product.businessId === scope))
    : undefined;
  if (scopedBusinessSnapshot) {
    return scopedBusinessSnapshot.products.find((product) => product.id === productId && product.businessId === scope);
  }

  return snapshot.products.find((product) => product.id === productId)
    ?? [...businessSnapshots.values()].find((entry) => entry.products.some((product) => product.id === productId))?.products.find((product) => product.id === productId);
}

export function getProductVariantByProduct(productId: string, snapshot = state, businessId: string | null = activeBusinessId) {
  const scope = (businessId ?? activeBusinessId ?? '').trim();
  const direct = scope
    ? snapshot.productVariants.filter((variant) => variant.productId === productId && variant.businessId === scope)
    : snapshot.productVariants.filter((variant) => variant.productId === productId);
  if (direct.length > 0) {
    return direct;
  }

  const scopedMatches = scope
    ? [...businessSnapshots.values()].flatMap((entry) => entry.productVariants.filter((variant) => variant.productId === productId && variant.businessId === scope))
    : [...businessSnapshots.values()].flatMap((entry) => entry.productVariants.filter((variant) => variant.productId === productId));
  if (scopedMatches.length > 0) {
    return scopedMatches;
  }

  return [...businessSnapshots.values()].flatMap((entry) => entry.productVariants.filter((variant) => variant.productId === productId));
}

export function getConfiguredPaymentMethods(settings: PaymentSettings = state.paymentSettings) {
  const configured = Array.isArray(settings.enabledPaymentMethods)
    ? settings.enabledPaymentMethods.map((method) => String(method).trim()).filter(Boolean)
    : [];

  if (configured.length > 0) {
    return [...new Set(configured)];
  }

  const fallback: string[] = [];
  if (settings.bankName.trim()) fallback.push('Bank Transfer');
  if (settings.qrImageUri || settings.accountNumber.trim()) fallback.push('QR Payment');
  return fallback;
}

export function createOrder(input: {
  tripId: string;
  productVariantId: string;
  quantity: number;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  shippingFee?: number;
  customerPhone?: string;
  deliveryAddress?: string;
}) {
  const productVariant = getProductVariant(input.productVariantId, state);
  const product = productVariant ? getProduct(productVariant.productId, state) : undefined;

  if (!productVariant || !product) {
    return null;
  }

  const reservedAmount = Math.min(productVariant.stock, input.quantity);
  const shortage = input.quantity - reservedAmount;
  const nextStock = productVariant.stock - reservedAmount;

  state.productVariants = state.productVariants.map((variant) =>
    variant.id === productVariant.id
      ? { ...variant, stock: nextStock }
      : variant,
  );

  const orderId = createId('order');
  const orderItemId = createId('order-item');
  const orderTotal = product.sellingPrice * input.quantity + (input.shippingFee ?? 0);

  const order: Order = {
    id: orderId,
    tripId: input.tripId,
    productId: product.id,
    customerName: input.customerName ?? 'New Customer',
    customerPhone: input.customerPhone,
    deliveryAddress: input.deliveryAddress,
    orderDate: new Date().toISOString(),
    paymentMethod: input.paymentMethod ?? 'cash',
    paymentStatus: input.paymentStatus ?? 'paid',
    requestStatus: input.paymentStatus === 'paid' ? 'PAID' : 'PENDING_AVAILABILITY',
    shippingFee: input.shippingFee ?? 0,
    total: orderTotal,
    status: shortage > 0 ? 'pending' : 'packing',
  };

  state.orders = [...state.orders, order];
  state.orderItems = [
    ...state.orderItems,
    {
      id: orderItemId,
      orderId,
      productVariantId: input.productVariantId,
      quantity: input.quantity,
    },
  ];

  if (shortage > 0) {
    const existingItem = state.buyListItems.find(
      (item) => item.tripId === input.tripId && item.productVariantId === input.productVariantId && !item.purchased,
    );

    if (existingItem) {
      state.buyListItems = state.buyListItems.map((item) =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + shortage }
          : item,
      );
    } else {
      state.buyListItems = [
        ...state.buyListItems,
        {
          id: createId('buy-list'),
          tripId: input.tripId,
          productVariantId: input.productVariantId,
          quantity: shortage,
          purchased: false,
        },
      ];
    }
  }

  emit();
  return order;
}

export function createBuyerOrder(input: { productId: string; quantity: number; customerName: string; productVariantId?: string }) {
  const product = getProduct(input.productId, state);
  if (!product) return null;
  const variant = input.productVariantId ? getProductVariant(input.productVariantId, state) : getProductVariantByProduct(product.id, state)[0];
  if (!variant) return null;

  const order: Order = {
    id: createId('order'),
    tripId: product.tripId,
    productId: product.id,
    customerName: input.customerName.trim() || 'New Customer',
    orderDate: new Date().toISOString(),
    paymentMethod: 'bank',
    paymentStatus: 'pending',
    paymentMode: 'customer_pays_first',
    availabilityStatus: 'pending',
    requestStatus: 'PENDING_AVAILABILITY',
    shippingFee: 0,
    total: product.sellingPrice * Math.max(1, input.quantity),
    status: 'pending',
  };
  state.orders = [...state.orders, order];
  state.orderItems = [...state.orderItems, { id: createId('order-item'), orderId: order.id, productVariantId: variant.id, quantity: Math.max(1, input.quantity) }];
  emit();
  return order;
}

export function getLatestOrderForProduct(productId: string, businessId: string | null = activeBusinessId, snapshot = state) {
  if (!productId) {
    return undefined;
  }

  const scope = (businessId ?? activeBusinessId ?? '').trim();
  const matchingOrders = scope
    ? snapshot.orders.filter((order) => order.productId === productId && order.businessId === scope)
    : snapshot.orders.filter((order) => order.productId === productId);

  if (matchingOrders.length > 0) {
    return [...matchingOrders].sort((left, right) => new Date(right.orderDate).getTime() - new Date(left.orderDate).getTime())[0];
  }

  const scopedMatches = scope
    ? [...businessSnapshots.values()].flatMap((entry) => entry.orders.filter((order) => order.productId === productId && order.businessId === scope))
    : [...businessSnapshots.values()].flatMap((entry) => entry.orders.filter((order) => order.productId === productId));

  if (scopedMatches.length > 0) {
    return [...scopedMatches].sort((left, right) => new Date(right.orderDate).getTime() - new Date(left.orderDate).getTime())[0];
  }

  return undefined;
}

export function getCustomerRequestForProduct(productId: string, customerIdentifier?: string, snapshot = state) {
  if (!productId) {
    return undefined;
  }

  const candidate = (customerIdentifier ?? '').trim();
  const normalizedCandidate = candidate ? normalizeCustomerPhone(candidate) : '';

  const matchingOrders = snapshot.orders.filter((order) => order.productId === productId);

  if (!candidate) {
    return matchingOrders.at(-1);
  }

  return [...matchingOrders].reverse().find((order) => {
    const orderPhone = normalizeCustomerPhone(order.customerPhone ?? '');
    const orderCustomerId = (order.customerId ?? '').trim();
    return (
      orderCustomerId === candidate ||
      orderPhone === normalizedCandidate ||
      order.customerName.toLowerCase() === candidate.toLowerCase()
    );
  });
}

export function submitCustomerOrder(input: { productId: string; productVariantId: string; quantity: number; customerName: string; customerPhone?: string; deliveryAddress?: string; customerId?: string; businessId?: string }) {
  const productLookup = getProduct(input.productId, undefined, input.businessId ?? activeBusinessId ?? null) ?? getProduct(input.productId, state, null) ?? getProduct(input.productId, undefined, null);
  if (!productLookup) {
    return null;
  }

  const businessId = (productLookup.businessId ?? input.businessId ?? activeBusinessId ?? resolveCurrentBusinessId() ?? 'business-default').trim() || 'business-default';
  ensureBusinessScopeForMutation(businessId);

  const product = getProduct(input.productId, state, businessId);
  if (!product) {
    return null;
  }

  const quantity = Math.max(1, input.quantity);
  const customerName = input.customerName.trim() || 'Customer';
  const customerPhone = input.customerPhone?.trim() || 'Not provided';
  const deliveryAddress = input.deliveryAddress?.trim() || 'To be confirmed';
  const customerProfile = upsertCustomerProfile({
    businessId,
    fullName: customerName,
    phoneNumber: customerPhone,
    deliveryAddress,
  });
  const customerKey = input.customerId?.trim() || customerProfile?.id || customerPhone || customerName;

  const order: Order = {
    id: createId('order'),
    businessId,
    tripId: product.tripId,
    productId: input.productId,
    customerName,
    customerId: customerKey,
    customerPhone,
    deliveryAddress,
    orderDate: new Date().toISOString(),
    paymentMethod: 'bank',
    paymentStatus: 'pending',
    availabilityStatus: 'pending',
    requestStatus: 'PENDING_AVAILABILITY',
    shippingFee: 0,
    total: product.sellingPrice * quantity,
    status: 'pending',
  };

  state.orders = [...state.orders, order];
  state.orderItems = [...state.orderItems, { id: createId('order-item'), orderId: order.id, productVariantId: input.productVariantId, quantity }];
  markBusinessMutation(businessId);
  emit(businessId);
  return order;
}

export function getOrder(orderId: string, snapshot = state, businessId: string | null = activeBusinessId) {
  const explicitScope = (businessId ?? activeBusinessId ?? '').trim();
  const actualScope = resolveOrderBusinessId(orderId, explicitScope) ?? explicitScope;
  const resolvedScope = actualScope || '';

  if (resolvedScope) {
    const scopedSnapshot = businessSnapshots.get(resolvedScope) ?? snapshot;
    const scopedMatch = scopedSnapshot.orders.find((order) => order.id === orderId && order.businessId === resolvedScope);
    if (scopedMatch) {
      return scopedMatch;
    }

    const snapshotMatch = snapshot.orders.find((order) => order.id === orderId && order.businessId === resolvedScope);
    if (snapshotMatch) {
      return snapshotMatch;
    }
  }

  const globalMatch = snapshot.orders.find((order) => order.id === orderId)
    ?? [...businessSnapshots.values()].find((entry) => entry.orders.some((order) => order.id === orderId))?.orders.find((order) => order.id === orderId);

  if (!globalMatch) {
    return undefined;
  }

  const ownerBusinessId = (globalMatch.businessId ?? resolvedScope ?? '').trim();
  if (!ownerBusinessId) {
    return globalMatch;
  }

  const ownerSnapshot = businessSnapshots.get(ownerBusinessId) ?? snapshot;
  return ownerSnapshot.orders.find((order) => order.id === orderId && order.businessId === ownerBusinessId) ?? globalMatch;
}

export function isMarketplaceProductVisible(product: Partial<Product> | undefined, snapshot = state) {
  if (!product) {
    return false;
  }

  const trip = snapshot.trips.find((entry) => entry.id === product.tripId);
  if (trip?.status === 'closed') {
    return false;
  }

  const stock = Number(product.stock ?? 0);
  const initialStock = Number(product.initialStock ?? product.stock ?? 0);

  if (stock > 0) {
    return true;
  }

  if (initialStock > 0) {
    return false;
  }

  return true;
}

export function uploadPaymentReceipt(orderId: string, receiptUri: string, amount: number) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'pending_verification', paymentReceipt: { amount, date: new Date().toISOString(), receiptUri, verified: false } } : order);
  emit();
  return true;
}

export function uploadPurchaseReceipt(orderId: string, receiptUri: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, purchase: { ...(order.purchase ?? { productCost: 0, transport: 0, parking: 0, toll: 0, other: 0 }), receiptUri } } : order);
  emit();
  return true;
}

export function markBuyListItemBought(itemId: string) {
  const item = state.buyListItems.find((buyItem) => buyItem.id === itemId);
  if (!item) return null;

  const productVariant = item.productVariantId ? getProductVariant(item.productVariantId, state) : undefined;
  if (!productVariant) {
    state.buyListItems = state.buyListItems.map((buyItem) => buyItem.id === itemId ? { ...buyItem, purchased: true } : buyItem);
    emit();
    return true;
  }

  state.productVariants = state.productVariants.map((variant) =>
    variant.id === item.productVariantId ? { ...variant, stock: variant.stock + item.quantity } : variant,
  );

  state.buyListItems = state.buyListItems.map((buyItem) => buyItem.id === itemId ? { ...buyItem, purchased: true } : buyItem);

  const linkedOrder = state.orders.find((order) => {
    if (order.tripId !== item.tripId || order.status !== 'pending') {
      return false;
    }

    return state.orderItems.some((orderItem) => orderItem.orderId === order.id && orderItem.productVariantId === item.productVariantId);
  });

  if (linkedOrder) {
    state.orders = state.orders.map((order) =>
      order.id === linkedOrder.id ? { ...order, status: 'packing' } : order,
    );
  }

  emit();
  return true;
}

export function confirmExtraStockPurchase(input: { tripId: string; productId: string; productVariantId: string; quantity: number; cost: number; sellingPrice: number; purchaseReceiptUri?: string; paymentMethod: FinancePaymentMethod }) {
  const existing = state.extraStockPurchases.find((purchase) => purchase.productVariantId === input.productVariantId && purchase.purchaseReceiptUri === input.purchaseReceiptUri && purchase.quantity === input.quantity);
  if (existing) return existing;
  const purchase: ExtraStockPurchase = { id: createId('purchase'), tripId: input.tripId, productId: input.productId, productVariantId: input.productVariantId, quantity: Math.max(1, input.quantity), cost: Math.max(0, input.cost), sellingPrice: Math.max(0, input.sellingPrice), purchaseReceiptUri: input.purchaseReceiptUri, purchaseDate: new Date().toISOString() };
  state.extraStockPurchases = [...state.extraStockPurchases, purchase];
  state.productVariants = state.productVariants.map((variant) => variant.id === input.productVariantId ? { ...variant, stock: variant.stock + purchase.quantity } : variant);
  const transaction = addFinanceTransaction({ description: 'Extra Stock Purchase', amount: purchase.cost, type: 'expense', paymentMethod: input.paymentMethod, category: 'Trip Purchase', referenceId: purchase.id, purchaseId: purchase.id, tripId: input.tripId, productId: input.productId });
  purchase.financeTransactionId = transaction.id;
  emit();
  return purchase;
}

export function updateBuyListItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    state.buyListItems = state.buyListItems.filter((item) => item.id !== itemId);
    emit();
    return true;
  }

  state.buyListItems = state.buyListItems.map((item) =>
    item.id === itemId ? { ...item, quantity } : item,
  );

  emit();
  return true;
}

export function addStock(productVariantId: string, amount: number) {
  state.productVariants = state.productVariants.map((variant) =>
    variant.id === productVariantId ? { ...variant, stock: variant.stock + amount } : variant,
  );
  emit();
  return true;
}

export function reduceStock(productVariantId: string, amount: number) {
  state.productVariants = state.productVariants.map((variant) =>
    variant.id === productVariantId
      ? { ...variant, stock: Math.max(0, variant.stock - amount) }
      : variant,
  );
  emit();
  return true;
}

export function getDashboardCounts(snapshot = state) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const grouped = snapshot.orders.reduce(
    (acc, order) => {
      acc[order.status] += 1;
      return acc;
    },
    {
      pending: 0,
      packing: 0,
      ready: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<OrderStatus, number>,
  );

  const salesToday = snapshot.orders
    .filter((order) => order.status !== 'cancelled' && order.orderDate.slice(0, 10) === today)
    .reduce((total, order) => total + order.total, 0);

  const salesThisMonth = snapshot.orders
    .filter((order) => order.status !== 'cancelled' && order.orderDate.slice(0, 10) >= monthStart)
    .reduce((total, order) => total + order.total, 0);

  return {
    totalOrders: snapshot.orders.length,
    pendingPurchase: grouped.pending,
    pendingOrders: grouped.pending,
    packing: grouped.packing,
    readyToShip: grouped.ready,
    shipped: grouped.shipped,
    delivered: grouped.delivered,
    openTrips: snapshot.trips.filter((trip) => trip.status === 'open').length,
    salesToday,
    salesThisMonth,
  };
}

export function getInventorySummary(snapshot = state) {
  const products = snapshot.products;
  const variants = snapshot.productVariants;
  const lowStock = variants.filter((variant) => variant.stock > 0 && variant.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStock = variants.filter((variant) => variant.stock === 0).length;

  return {
    totalProducts: products.length,
    lowStock,
    outOfStock,
  };
}

export function getVariantDisplayInfo(variantId: string, snapshot = state) {
  const variant = getProductVariant(variantId, snapshot);
  const product = variant ? getProduct(variant.productId, snapshot) : undefined;

  return variant && product ? { variant, product } : null;
}
