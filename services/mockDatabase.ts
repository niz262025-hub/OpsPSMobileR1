import { useEffect, useState } from 'react';

export type ProductStatus = 'ready' | 'preorder';
export type ProductCategory = 'Clothing' | 'Shoes' | 'Other';
export type ProductSize = string;
export type OrderStatus = 'pending' | 'packing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank' | 'qr';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'pay_later';
export type PaymentMode = 'customer_pays_first' | 'ps_buy_first_pay_later';
export type FinanceTransactionType = 'income' | 'expense';
export type FinancePaymentMethod = 'bank' | 'cash';

export interface Product {
  id: string;
  tripId: string;
  name: string;
  image: string;
  costPrice: number;
  sellingPrice: number;
  status: ProductStatus;
  category: ProductCategory;
  description?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: ProductSize;
  stock: number;
}

export interface Order {
  id: string;
  tripId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderDate: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMode?: PaymentMode;
  payLaterCustomerId?: string;
  paymentRequestedAt?: string;
  paymentVerifiedAt?: string;
  availabilityStatus?: 'pending' | 'confirmed' | 'not_available';
  paymentReceipt?: { amount: number; date: string; receiptUri?: string; verified: boolean };
  purchase?: { productCost: number; transport: number; parking: number; toll: number; other: number; paymentMethod?: FinancePaymentMethod; receiptUri?: string; confirmedAt?: string };
  purchaseId?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shipment?: { courier: string; trackingNumber?: string; shipmentId?: string; status: 'mock_created' | 'shipped' | 'delivered' };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
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
  name: string;
  destination: string;
  tripDate: string;
  notes: string;
  status: 'planning' | 'open' | 'completed';
  createdAt: string;
}

export interface MockDatabaseSnapshot {
  trips: TripRecord[];
  products: Product[];
  productVariants: ProductVariant[];
  orders: Order[];
  orderItems: OrderItem[];
  buyListItems: BuyListItem[];
  financeTransactions: FinanceTransaction[];
  paymentSettings: PaymentSettings;
}

export interface PaymentSettings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentReference: string;
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

const LOW_STOCK_THRESHOLD = 5;

export const PRODUCT_SIZE_OPTIONS: Record<Exclude<ProductCategory, 'Other'>, string[]> = {
  Clothing: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '11Y', '12Y', '13Y', '14Y'],
  Shoes: ['22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
};

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

const initialTrips: TripRecord[] = [
  { id: 'trip-1', name: 'Bangkok Shopping', destination: 'Bangkok, Thailand', tripDate: '2024-08-12', notes: '', status: 'open', createdAt: '2024-08-01' },
  { id: 'trip-2', name: 'Vietnam Essentials', destination: 'Ho Chi Minh City, Vietnam', tripDate: '2024-08-20', notes: '', status: 'open', createdAt: '2024-07-20' },
  { id: 'trip-3', name: 'Singapore Weekend', destination: 'Singapore', tripDate: '2024-07-05', notes: '', status: 'completed', createdAt: '2024-07-01' },
];

let state: MockDatabaseSnapshot = {
  trips: initialTrips,
  products: initialProducts,
  productVariants: initialVariants,
  orders: initialOrders,
  orderItems: initialOrderItems,
  buyListItems: initialBuyList,
  financeTransactions: [],
  paymentSettings: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    paymentReference: 'Order ID',
  },
};

const listeners = new Set<() => void>();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getMockDatabaseSnapshot(): MockDatabaseSnapshot {
  return clone(state);
}

export function subscribeMockDatabase(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function createTrip(input: {
  name: string;
  destination: string;
  tripDate: string;
  notes?: string;
}) {
  const trip: TripRecord = {
    id: `trip-${Date.now()}`,
    name: input.name.trim(),
    destination: input.destination.trim(),
    tripDate: input.tripDate.trim(),
    notes: input.notes?.trim() ?? '',
    status: 'planning',
    createdAt: new Date().toISOString(),
  };

  state.trips = [...state.trips, trip];
  emit();
  return trip;
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
}) {
  const productId = `product-${Date.now()}`;
  const product: Product = {
    id: productId,
    tripId: input.tripId ?? '',
    name: input.name.trim(),
    image: input.image.trim(),
    costPrice: input.costPrice,
    sellingPrice: input.sellingPrice,
    status: 'ready',
    category: input.category,
    description: input.description?.trim(),
  };
  state.products = [...state.products, product];
  state.productVariants = [
    ...state.productVariants,
    {
      id: `variant-${Date.now()}`,
      productId,
      size: input.size ?? 'Standard',
      stock: input.stock ?? 0,
    },
  ];
  emit();
  return product;
}

export function createBuyListItem(input: { tripId: string; itemName: string; quantity: number }) {
  const item: BuyListItem = {
    id: `buy-list-${Date.now()}`,
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
  state.buyListItems = state.buyListItems.map((item) => item.id === itemId ? { ...item, itemName: input.itemName.trim(), quantity: Math.max(1, input.quantity) } : item);
  emit();
  return true;
}

export function deleteBuyListItem(itemId: string) {
  state.buyListItems = state.buyListItems.filter((item) => item.id !== itemId);
  emit();
  return true;
}

export function addFinanceTransaction(input: Omit<FinanceTransaction, 'id' | 'date'> & { date?: string }) {
  const transaction: FinanceTransaction = { ...input, id: `txn-${Date.now()}`, date: input.date ?? new Date().toISOString() };
  state.financeTransactions = [transaction, ...state.financeTransactions];
  emit();
  return transaction;
}

export function addMonthlyExpense(input: { description: string; amount: number; category: string; paymentMethod: FinancePaymentMethod; notes?: string }) {
  return addFinanceTransaction({ description: input.notes ? `${input.description} - ${input.notes}` : input.description, amount: Math.abs(input.amount), type: 'expense', paymentMethod: input.paymentMethod, category: input.category, isMonthlyExpense: true });
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
    entry.id === tripId ? { ...entry, status } : entry
  );
  emit();
  return true;
}

export function useMockDatabase() {
  const [snapshot, setSnapshot] = useState<MockDatabaseSnapshot>(getMockDatabaseSnapshot);

  useEffect(() => {
    const unsubscribe = subscribeMockDatabase(() => {
      setSnapshot(getMockDatabaseSnapshot());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return snapshot;
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
  const moneyOut = snapshot.financeTransactions
    .filter((transaction) => transaction.tripId === tripId && transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const moneyIn = snapshot.financeTransactions
    .filter((transaction) => transaction.tripId === tripId && transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    salesRevenue,
    moneyIn,
    moneyOut,
    outstandingRevenue: Math.max(0, salesRevenue - moneyIn),
    netProfit: salesRevenue - moneyOut,
  };
}

export function getTripBuyListItems(tripId: string, snapshot = state) {
  return snapshot.buyListItems.filter((item) => item.tripId === tripId);
}

export function confirmOrderAvailability(orderId: string, available: boolean) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, availabilityStatus: available ? 'confirmed' : 'not_available', status: available ? 'pending' : 'cancelled' } : order);
  emit();
  return available;
}

export function setOrderPaymentMode(orderId: string, paymentMode: PaymentMode, payLaterCustomerId?: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? {
    ...order,
    paymentMode,
    payLaterCustomerId,
    paymentStatus: paymentMode === 'ps_buy_first_pay_later' ? 'pay_later' : 'pending',
    paymentRequestedAt: paymentMode === 'customer_pays_first' ? new Date().toISOString() : undefined,
  } : order);
  emit();
  return true;
}

export function recordPayment(orderId: string, amount: number, receiptUri?: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'paid', paymentReceipt: { amount, date: new Date().toISOString(), receiptUri, verified: false } } : order);
  emit();
  return true;
}

export function verifyPayment(orderId: string) {
  const existingOrder = state.orders.find((order) => order.id === orderId);
  if (!existingOrder?.paymentReceipt || existingOrder.paymentReceipt.verified) return false;
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'paid', paymentVerifiedAt: new Date().toISOString(), paymentReceipt: { ...order.paymentReceipt!, verified: true } } : order);
  const order = state.orders.find((entry) => entry.id === orderId);
  if (order?.paymentReceipt && !state.financeTransactions.some((item) => item.referenceId === order.id && item.category === 'Customer Payment')) {
    addFinanceTransaction({ description: 'Customer Payment', amount: order.paymentReceipt.amount, type: 'income', paymentMethod: order.paymentMethod === 'cash' ? 'cash' : 'bank', category: 'Customer Payment', referenceId: order.id, tripId: order.tripId, orderId: order.id });
  }
  emit();
  return true;
}

export function rejectPayment(orderId: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'pending', paymentReceipt: undefined } : order);
  emit();
  return true;
}

export function confirmPurchase(orderId: string, purchase: NonNullable<Order['purchase']>) {
  const existingOrder = state.orders.find((entry) => entry.id === orderId);
  if (existingOrder?.purchase?.confirmedAt) return true;
  if (existingOrder?.paymentMode === 'customer_pays_first' && existingOrder.paymentStatus !== 'paid') return false;
  const purchaseId = `purchase-${Date.now()}`;
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

export function markOrderPacked(orderId: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, packedAt: new Date().toISOString(), status: 'ready' } : order);
  emit();
  return true;
}

export function createMockShipment(orderId: string, courier: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, shipment: { courier, shipmentId: `mock-shipment-${order.id}`, trackingNumber: `MOCK-${Date.now()}`, status: 'mock_created' } } : order);
  emit();
  return true;
}

export function markOrderShipped(orderId: string, courier: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, shippedAt: new Date().toISOString(), shipment: { courier, shipmentId: order.shipment?.shipmentId ?? `mock-shipment-${order.id}`, trackingNumber: order.shipment?.trackingNumber ?? `MOCK-${Date.now()}`, status: 'shipped' }, status: 'shipped' } : order);
  emit();
  return true;
}

export function markOrderDeliveredFromCourier(orderId: string) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, deliveredAt: new Date().toISOString(), shipment: order.shipment ? { ...order.shipment, status: 'delivered' } : undefined, status: 'delivered' } : order);
  emit();
  return true;
}

export function getProductVariant(productVariantId: string, snapshot = state) {
  return snapshot.productVariants.find((variant) => variant.id === productVariantId);
}

export function getProduct(productId: string, snapshot = state) {
  return snapshot.products.find((product) => product.id === productId);
}

export function getProductVariantByProduct(productId: string, snapshot = state) {
  return snapshot.productVariants.filter((variant) => variant.productId === productId);
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
      : variant
  );

  const orderId = `order-${Date.now()}`;
  const orderItemId = `order-item-${Date.now()}`;
  const orderTotal = product.sellingPrice * input.quantity + (input.shippingFee ?? 0);

  const order: Order = {
    id: orderId,
    tripId: input.tripId,
    customerName: input.customerName ?? 'New Customer',
    customerPhone: input.customerPhone,
    deliveryAddress: input.deliveryAddress,
    orderDate: new Date().toISOString(),
    paymentMethod: input.paymentMethod ?? 'cash',
    paymentStatus: input.paymentStatus ?? 'paid',
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
      (item) => item.tripId === input.tripId && item.productVariantId === input.productVariantId && !item.purchased
    );

    if (existingItem) {
      state.buyListItems = state.buyListItems.map((item) =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + shortage }
          : item
      );
    } else {
      state.buyListItems = [
        ...state.buyListItems,
        {
          id: `buy-list-${Date.now()}`,
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
    id: `order-${Date.now()}`,
    tripId: product.tripId,
    customerName: input.customerName.trim() || 'New Customer',
    orderDate: new Date().toISOString(),
    paymentMethod: 'bank',
    paymentStatus: 'pending',
    paymentMode: 'customer_pays_first',
    availabilityStatus: 'pending',
    shippingFee: 0,
    total: product.sellingPrice * Math.max(1, input.quantity),
    status: 'pending',
  };
  state.orders = [...state.orders, order];
  state.orderItems = [...state.orderItems, { id: `order-item-${Date.now()}`, orderId: order.id, productVariantId: variant.id, quantity: Math.max(1, input.quantity) }];
  emit();
  return order;
}

export function submitCustomerOrder(input: { productId: string; productVariantId: string; quantity: number; customerName: string; customerPhone: string; deliveryAddress: string }) {
  const product = getProduct(input.productId, state);
  if (!product) return null;
  const quantity = Math.max(1, input.quantity);
  const order: Order = { id: `order-${Date.now()}`, tripId: product.tripId, customerName: input.customerName.trim(), customerPhone: input.customerPhone.trim(), deliveryAddress: input.deliveryAddress.trim(), orderDate: new Date().toISOString(), paymentMethod: 'bank', paymentStatus: 'pending', availabilityStatus: 'pending', shippingFee: 0, total: product.sellingPrice * quantity, status: 'pending' };
  state.orders = [...state.orders, order];
  state.orderItems = [...state.orderItems, { id: `order-item-${Date.now()}`, orderId: order.id, productVariantId: input.productVariantId, quantity }];
  const variant = getProductVariant(input.productVariantId, state);
  const shortage = Math.max(0, quantity - (variant?.stock ?? 0));
  if (shortage > 0 && variant) {
    const existingItem = state.buyListItems.find((item) => item.tripId === product.tripId && item.productVariantId === variant.id && !item.purchased);
    if (existingItem) {
      existingItem.quantity += shortage;
    } else {
      state.buyListItems = [...state.buyListItems, { id: `buy-list-${Date.now()}`, tripId: product.tripId, productVariantId: variant.id, quantity: shortage, purchased: false }];
    }
  }
  emit();
  return order;
}

export function getOrder(orderId: string, snapshot = state) { return snapshot.orders.find((order) => order.id === orderId); }

export function uploadPaymentReceipt(orderId: string, receiptUri: string, amount: number) {
  state.orders = state.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: 'partial', paymentReceipt: { amount, date: new Date().toISOString(), receiptUri, verified: false } } : order);
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
    variant.id === item.productVariantId ? { ...variant, stock: variant.stock + item.quantity } : variant
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
      order.id === linkedOrder.id ? { ...order, status: 'packing' } : order
    );
  }

  emit();
  return true;
}

export function updateBuyListItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    state.buyListItems = state.buyListItems.filter((item) => item.id !== itemId);
    emit();
    return true;
  }

  state.buyListItems = state.buyListItems.map((item) =>
    item.id === itemId ? { ...item, quantity } : item
  );

  emit();
  return true;
}

export function addStock(productVariantId: string, amount: number) {
  state.productVariants = state.productVariants.map((variant) =>
    variant.id === productVariantId ? { ...variant, stock: variant.stock + amount } : variant
  );
  emit();
  return true;
}

export function reduceStock(productVariantId: string, amount: number) {
  state.productVariants = state.productVariants.map((variant) =>
    variant.id === productVariantId
      ? { ...variant, stock: Math.max(0, variant.stock - amount) }
      : variant
  );
  emit();
  return true;
}

export function getDashboardCounts(snapshot = state) {
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
    } as Record<OrderStatus, number>
  );

  return {
    totalOrders: snapshot.orders.length,
    pendingPurchase: grouped.pending,
    packing: grouped.packing,
    readyToShip: grouped.ready,
    shipped: grouped.shipped,
    delivered: grouped.delivered,
    openTrips: snapshot.trips.filter((trip) => trip.status === 'open').length,
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
