import { getSupabaseClient } from './supabaseClient';
import {
  createProduct,
  createTrip,
  getMockDatabaseSnapshot,
  getProduct,
  getProductVariant,
  getTripProducts,
  getTripOrders,
  getTripProfit,
  type Product,
  type ProductCategory,
  type TripRecord,
} from './mockDatabase';

export type OpspsRole = 'founder' | 'customer' | 'admin' | 'support';

export type BusinessRecord = {
  id: string;
  name: string;
  slug?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfileRecord = {
  id: string;
  business_id?: string | null;
  auth_user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: OpspsRole;
};

export type MembershipRecord = {
  id: string;
  business_id: string;
  user_id: string;
  role: OpspsRole;
};

export interface AuthRepository {
  registerFounder(input: {
    email: string;
    password: string;
    name: string;
    businessName?: string;
    phone?: string;
    address?: string;
  }): Promise<{ ok: boolean; businessId?: string; userId?: string; error?: string }>;
  login(input: { email: string; password: string; role: OpspsRole }): Promise<{ ok: boolean; businessId?: string; userId?: string; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<{ email: string; name: string; role: OpspsRole; businessId?: string } | null>;
}

export interface BusinessRepository {
  getCurrentBusinessIdForUser(userId: string): Promise<string | null>;
  createBusinessForFounder(input: {
    founderUserId: string;
    founderName: string;
    businessName: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<{ businessId: string } | null>;
}

export interface TripRepository {
  listForBusiness(businessId: string): Promise<TripRecord[]>;
  getForBusiness(businessId: string, tripId: string): Promise<TripRecord | null>;
  create(input: { businessId: string; name: string; destination: string; tripDate: string; notes?: string }): Promise<TripRecord | null>;
  update(input: { tripId: string; businessId: string; name?: string; destination?: string; tripDate?: string; notes?: string; status?: TripRecord['status'] }): Promise<TripRecord | null>;
  closeTrip(tripId: string, businessId: string): Promise<TripRecord | null>;
}

export interface ProductRepository {
  listForBusiness(businessId: string): Promise<Product[]>;
  create(input: {
    businessId: string;
    name: string;
    category: ProductCategory;
    image: string;
    tripId?: string;
    description?: string;
    costPrice: number;
    sellingPrice: number;
    size?: string;
    stock?: number;
  }): Promise<Product | null>;
  getProduct(productId: string, businessId: string): Promise<Product | null>;
  listVariantsForProduct(productId: string, businessId: string): Promise<{ id: string; productId: string; size: string; stock: number }[]>;
  getProductVariant(productVariantId: string, businessId: string): Promise<{ id: string; productId: string; size: string; stock: number } | null>;
}

export interface OrderRecord {
  id: string;
  businessId?: string;
  tripId?: string;
  productId?: string;
  customerProfileId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  orderDate: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  orderStatus: string;
  requestStatus?: string;
  paymentOption?: string;
  paymentMode?: string;
  availabilityStatus?: string;
  paymentRequestedAt?: string;
  paymentVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemRecord {
  id: string;
  businessId?: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  packedQuantity: number;
}

export interface OrderRepository {
  listForBusiness(businessId: string): Promise<OrderRecord[]>;
  getForBusiness(businessId: string, orderId: string): Promise<OrderRecord | null>;
  listItemsForOrder(orderId: string, businessId: string): Promise<OrderItemRecord[]>;
  create(input: {
    businessId: string;
    tripId: string;
    productId: string;
    productVariantId: string;
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: string;
    quantity: number;
    customerId?: string;
    customerProfileId?: string | null;
    paymentMethod?: string;
    shippingFee?: number;
  }): Promise<OrderRecord | null>;
  getForCustomer(customerId: string, orderId: string): Promise<OrderRecord | null>;
  listForCustomer(customerId: string): Promise<OrderRecord[]>;
}

export type PaymentRepositoryStatus = 'pending' | 'pending_verification' | 'authorized' | 'success' | 'paid' | 'partial' | 'pay_later' | 'failed' | 'cancelled' | 'refunded';

export type PaymentRecordRow = {
  id: string;
  business_id: string;
  order_id: string;
  payment_method?: string;
  payment_status?: string;
  status?: string;
  amount: number;
  currency?: string;
  provider?: string;
  provider_reference?: string;
  provider_transaction_id?: string;
  idempotency_key?: string;
  callback_event_id?: string;
  webhook_verified?: boolean;
  verified?: boolean;
  receipt_uri?: string | null;
  customer_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface PaymentRepository {
  create(input: {
    businessId: string;
    orderId: string;
    amount: number;
    currency?: string;
    provider?: string;
    paymentMethod?: string;
    providerReference?: string;
    providerTransactionId?: string;
    idempotencyKey?: string;
    callbackEventId?: string;
    webhookVerified?: boolean;
    customerId?: string;
    receiptUri?: string;
  }): Promise<PaymentRecordRow | null>;
  getById(paymentId: string, businessId: string): Promise<PaymentRecordRow | null>;
  getByOrder(businessId: string, orderId: string): Promise<PaymentRecordRow | null>;
  listForBusiness(businessId: string): Promise<PaymentRecordRow[]>;
  transition(paymentId: string, businessId: string, nextStatus: PaymentRepositoryStatus, overrides?: {
    providerReference?: string;
    providerTransactionId?: string;
    callbackEventId?: string;
    webhookVerified?: boolean;
    verified?: boolean;
    receiptUri?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentRecordRow | null>;
  refund(paymentId: string, businessId: string, reason?: string): Promise<PaymentRecordRow | null>;
  cancel(paymentId: string, businessId: string): Promise<PaymentRecordRow | null>;
  reconcileFinanceForPayment(paymentId: string, businessId: string): Promise<Array<Record<string, unknown>>>;
}

export interface DataSource {
  auth: AuthRepository;
  business: BusinessRepository;
  trips: TripRepository;
  products: ProductRepository;
  orders: OrderRepository;
  payments: PaymentRepository;
}

function slugify(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'opsps-business';
}

function mapTripRow(row: any): TripRecord {
  return {
    id: row.id,
    businessId: row.business_id ?? undefined,
    name: row.name,
    destination: row.destination,
    tripDate: row.trip_date ?? new Date().toISOString().slice(0, 10),
    notes: row.notes ?? '',
    status: (row.status === 'open' || row.status === 'planning' || row.status === 'closed') ? row.status : 'planning',
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapProductRow(row: any, fallbackVariants: Array<{ size: string; stock: number }> = []): Product {
  const variantStock = fallbackVariants.reduce((total, variant) => total + Number(variant.stock ?? 0), 0);
  const primaryVariant = fallbackVariants[0];

  return {
    id: row.id,
    businessId: row.business_id ?? undefined,
    tripId: row.trip_id ?? '',
    name: row.name,
    image: row.image_url ?? '',
    costPrice: Number(row.cost_price ?? 0),
    sellingPrice: Number(row.selling_price ?? 0),
    status: row.status === 'preorder' ? 'preorder' : 'ready',
    category: (row.category as ProductCategory) ?? 'Other',
    description: row.description ?? undefined,
    size: primaryVariant?.size ?? undefined,
    stock: variantStock > 0 ? variantStock : undefined,
    initialStock: variantStock > 0 ? variantStock : undefined,
  };
}

function mapProductVariantRow(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size ?? 'Standard',
    stock: Number(row.stock ?? 0),
  };
}

function mapOrderRow(row: any): OrderRecord {
  return {
    id: row.id,
    businessId: row.business_id ?? undefined,
    tripId: row.trip_id ?? undefined,
    productId: row.product_id ?? undefined,
    customerProfileId: row.customer_profile_id ?? row.customer_id ?? null,
    customerId: row.customer_id ?? row.customer_profile_id ?? null,
    customerName: row.customer_name ?? 'Customer',
    customerPhone: row.customer_phone ?? null,
    deliveryAddress: row.delivery_address ?? null,
    orderDate: row.order_date ?? row.created_at ?? new Date().toISOString(),
    subtotal: Number(row.subtotal ?? 0),
    shippingFee: Number(row.shipping_fee ?? 0),
    total: Number(row.total ?? 0),
    paymentMethod: row.payment_method ?? row.paymentMode ?? undefined,
    paymentStatus: row.payment_status ?? 'pending',
    orderStatus: row.order_status ?? 'pending',
    requestStatus: row.request_status ?? undefined,
    paymentOption: row.payment_option ?? undefined,
    paymentMode: row.payment_mode ?? undefined,
    availabilityStatus: row.availability_status ?? undefined,
    paymentRequestedAt: row.payment_requested_at ?? undefined,
    paymentVerifiedAt: row.payment_verified_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapOrderItemRow(row: any): OrderItemRecord {
  return {
    id: row.id,
    businessId: row.business_id ?? undefined,
    orderId: row.order_id,
    productVariantId: row.product_variant_id,
    quantity: Number(row.quantity ?? 0),
    packedQuantity: Number(row.packed_quantity ?? 0),
  };
}

function mapPaymentRow(row: any): PaymentRecordRow {
  const paymentStatus = row.payment_status ?? row.status ?? 'pending';
  return {
    id: row.id,
    business_id: row.business_id,
    order_id: row.order_id,
    payment_method: row.payment_method ?? 'bank',
    payment_status: paymentStatus,
    status: paymentStatus,
    amount: Number(row.amount ?? 0),
    currency: row.currency ?? 'MYR',
    provider: row.provider ?? 'mock',
    provider_reference: row.provider_reference ?? undefined,
    provider_transaction_id: row.provider_transaction_id ?? undefined,
    idempotency_key: row.idempotency_key ?? undefined,
    callback_event_id: row.callback_event_id ?? undefined,
    webhook_verified: Boolean(row.webhook_verified ?? false),
    verified: Boolean(row.verified ?? false),
    receipt_uri: row.receipt_uri ?? row.receiptUri ?? null,
    customer_id: row.customer_id ?? row.customerId ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

class MockDataSource implements DataSource {
  auth: AuthRepository = {
    async registerFounder() {
      return { ok: true };
    },
    async login() {
      return { ok: true };
    },
    async logout() {
      return;
    },
    async getCurrentUser() {
      return null;
    },
  };

  business: BusinessRepository = {
    async getCurrentBusinessIdForUser() {
      return null;
    },
    async createBusinessForFounder() {
      return { businessId: 'mock-business' };
    },
  };

  trips: TripRepository = {
    async listForBusiness(businessId: string) {
      return getMockDatabaseSnapshot().trips.filter((trip) => trip.businessId === businessId);
    },
    async getForBusiness(businessId: string, tripId: string) {
      return getMockDatabaseSnapshot().trips.find((trip) => trip.businessId === businessId && trip.id === tripId) ?? null;
    },
    async create(input) {
      return createTrip({
        name: input.name,
        destination: input.destination,
        tripDate: input.tripDate,
        notes: input.notes,
        businessId: input.businessId,
      });
    },
    async update(input) {
      const trip = getMockDatabaseSnapshot().trips.find((entry) => entry.businessId === input.businessId && entry.id === input.tripId);
      if (!trip) {
        return null;
      }
      const updated = {
        ...trip,
        name: input.name ?? trip.name,
        destination: input.destination ?? trip.destination,
        tripDate: input.tripDate ?? trip.tripDate,
        notes: input.notes ?? trip.notes,
        status: input.status ?? trip.status,
      };
      const snapshot = getMockDatabaseSnapshot();
      snapshot.trips = snapshot.trips.map((entry) => entry.id === trip.id ? updated : entry);
      return updated;
    },
    async closeTrip(tripId: string, businessId: string) {
      const trip = getMockDatabaseSnapshot().trips.find((entry) => entry.businessId === businessId && entry.id === tripId);
      if (!trip) {
        return null;
      }
      const updated = { ...trip, status: 'closed' as const };
      const snapshot = getMockDatabaseSnapshot();
      snapshot.trips = snapshot.trips.map((entry) => entry.id === trip.id ? updated : entry);
      return updated;
    },
  };

  products: ProductRepository = {
    async listForBusiness(businessId: string) {
      return getMockDatabaseSnapshot().products.filter((product) => product.businessId === businessId);
    },
    async create(input) {
      return createProduct({
        name: input.name,
        category: input.category,
        image: input.image,
        tripId: input.tripId,
        description: input.description,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        size: input.size,
        stock: input.stock,
        businessId: input.businessId,
      });
    },
    async getProduct(productId, businessId) {
      const product = getProduct(productId, getMockDatabaseSnapshot(), businessId);
      return product ?? null;
    },
    async listVariantsForProduct(productId: string, businessId: string) {
      const variants = getMockDatabaseSnapshot().productVariants.filter((variant) => variant.productId === productId && variant.businessId === businessId);
      return variants.map((variant) => ({ id: variant.id, productId: variant.productId, size: variant.size, stock: variant.stock }));
    },
    async getProductVariant(productVariantId, businessId) {
      const variant = getProductVariant(productVariantId, getMockDatabaseSnapshot(), businessId);
      if (!variant) {
        return null;
      }
      return {
        id: variant.id,
        productId: variant.productId,
        size: variant.size,
        stock: variant.stock,
      };
    },
  };

  orders: OrderRepository = {
    async listForBusiness(businessId: string) {
      return getMockDatabaseSnapshot().orders.filter((order) => order.businessId === businessId).map((order) => ({
        id: order.id,
        businessId: order.businessId,
        tripId: order.tripId,
        productId: order.productId,
        customerProfileId: order.customerId ?? null,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        orderDate: order.orderDate,
        subtotal: Number(order.total ?? 0),
        shippingFee: Number(order.shippingFee ?? 0),
        total: Number(order.total ?? 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        requestStatus: order.requestStatus,
        paymentOption: order.paymentOption,
        paymentMode: order.paymentMode,
        availabilityStatus: order.availabilityStatus,
        paymentRequestedAt: order.paymentRequestedAt,
        paymentVerifiedAt: order.paymentVerifiedAt,
      }));
    },
    async getForBusiness(businessId: string, orderId: string) {
      const order = getMockDatabaseSnapshot().orders.find((entry) => entry.businessId === businessId && entry.id === orderId);
      if (!order) {
        return null;
      }
      return {
        id: order.id,
        businessId: order.businessId,
        tripId: order.tripId,
        productId: order.productId,
        customerProfileId: order.customerId ?? null,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        orderDate: order.orderDate,
        subtotal: Number(order.total ?? 0),
        shippingFee: Number(order.shippingFee ?? 0),
        total: Number(order.total ?? 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        requestStatus: order.requestStatus,
        paymentOption: order.paymentOption,
        paymentMode: order.paymentMode,
        availabilityStatus: order.availabilityStatus,
        paymentRequestedAt: order.paymentRequestedAt,
        paymentVerifiedAt: order.paymentVerifiedAt,
      };
    },
    async listItemsForOrder(orderId: string, businessId: string) {
      return getMockDatabaseSnapshot().orderItems.filter((entry) => entry.orderId === orderId && getMockDatabaseSnapshot().orders.find((order) => order.id === entry.orderId)?.businessId === businessId).map((entry) => ({
        id: entry.id,
        businessId: getMockDatabaseSnapshot().orders.find((order) => order.id === entry.orderId)?.businessId,
        orderId: entry.orderId,
        productVariantId: entry.productVariantId,
        quantity: entry.quantity,
        packedQuantity: entry.packedQuantity ?? 0,
      }));
    },
    async create(input) {
      const product = getProduct(input.productId, getMockDatabaseSnapshot(), input.businessId);
      const variant = getProductVariant(input.productVariantId, getMockDatabaseSnapshot(), input.businessId);
      if (!product || !variant || variant.productId !== input.productId || product.tripId !== input.tripId) {
        return null;
      }
      const order = {
        id: `order-${Date.now()}`,
        businessId: input.businessId,
        tripId: input.tripId,
        productId: input.productId,
        customerName: input.customerName,
        customerId: input.customerId ?? null,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        orderDate: new Date().toISOString(),
        paymentMethod: input.paymentMethod ?? 'bank',
        paymentStatus: 'pending',
        requestStatus: 'PENDING_AVAILABILITY',
        shippingFee: input.shippingFee ?? 0,
        total: Number(product.sellingPrice) * Math.max(1, input.quantity),
        status: 'pending',
      } as any;
      const snapshot = getMockDatabaseSnapshot();
      snapshot.orders = [...snapshot.orders, order];
      snapshot.orderItems = [...snapshot.orderItems, {
        id: `order-item-${Date.now()}`,
        orderId: order.id,
        productVariantId: input.productVariantId,
        quantity: input.quantity,
        packedQuantity: 0,
      }];
      return {
        id: order.id,
        businessId: order.businessId,
        tripId: order.tripId,
        productId: order.productId,
        customerProfileId: input.customerProfileId ?? input.customerId ?? null,
        customerId: input.customerId ?? null,
        customerName: order.customerName,
        customerPhone: order.customerPhone ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        orderDate: order.orderDate,
        subtotal: Number(order.total ?? 0),
        shippingFee: Number(order.shippingFee ?? 0),
        total: Number(order.total ?? 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        requestStatus: order.requestStatus,
      };
    },
    async getForCustomer(customerId: string, orderId: string) {
      const order = getMockDatabaseSnapshot().orders.find((entry) => entry.id === orderId && entry.customerId === customerId);
      if (!order) {
        return null;
      }
      return {
        id: order.id,
        businessId: order.businessId,
        tripId: order.tripId,
        productId: order.productId,
        customerProfileId: order.customerId ?? null,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        orderDate: order.orderDate,
        subtotal: Number(order.total ?? 0),
        shippingFee: Number(order.shippingFee ?? 0),
        total: Number(order.total ?? 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        requestStatus: order.requestStatus,
      };
    },
    async listForCustomer(customerId: string) {
      return getMockDatabaseSnapshot().orders.filter((order) => order.customerId === customerId).map((order) => ({
        id: order.id,
        businessId: order.businessId,
        tripId: order.tripId,
        productId: order.productId,
        customerProfileId: order.customerId ?? null,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone ?? null,
        deliveryAddress: order.deliveryAddress ?? null,
        orderDate: order.orderDate,
        subtotal: Number(order.total ?? 0),
        shippingFee: Number(order.shippingFee ?? 0),
        total: Number(order.total ?? 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        requestStatus: order.requestStatus,
      }));
    },
  };

  payments: PaymentRepository = {
    async create(input) {
      return {
        id: `payment-mock-${Date.now()}`,
        business_id: input.businessId,
        order_id: input.orderId,
        payment_method: input.paymentMethod ?? 'bank',
        payment_status: 'pending',
        status: 'pending',
        amount: Number(input.amount ?? 0),
        currency: input.currency ?? 'MYR',
        provider: input.provider ?? 'mock',
        provider_reference: input.providerReference ?? undefined,
        provider_transaction_id: input.providerTransactionId ?? undefined,
        idempotency_key: input.idempotencyKey ?? `${input.orderId}:${input.businessId}`,
        callback_event_id: input.callbackEventId ?? undefined,
        webhook_verified: Boolean(input.webhookVerified ?? false),
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    async getById(paymentId, businessId) {
      return {
        id: paymentId,
        business_id: businessId,
        order_id: 'order-mock',
        payment_method: 'bank',
        payment_status: 'pending',
        status: 'pending',
        amount: 0,
        currency: 'MYR',
        provider: 'mock',
        idempotency_key: `${paymentId}:${businessId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    async getByOrder(businessId, orderId) {
      return {
        id: `payment-mock-${orderId}`,
        business_id: businessId,
        order_id: orderId,
        payment_method: 'bank',
        payment_status: 'pending',
        status: 'pending',
        amount: 0,
        currency: 'MYR',
        provider: 'mock',
        idempotency_key: `${orderId}:${businessId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    async listForBusiness(businessId) {
      return [{
        id: `payment-mock-${businessId}`,
        business_id: businessId,
        order_id: 'order-mock',
        payment_method: 'bank',
        payment_status: 'pending',
        status: 'pending',
        amount: 0,
        currency: 'MYR',
        provider: 'mock',
        idempotency_key: `${businessId}-mock`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    },
    async transition(paymentId, businessId, nextStatus) {
      return {
        id: paymentId,
        business_id: businessId,
        order_id: 'order-mock',
        payment_method: 'bank',
        payment_status: nextStatus,
        status: nextStatus,
        amount: 0,
        currency: 'MYR',
        provider: 'mock',
        idempotency_key: `${paymentId}:${businessId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    async refund(paymentId, businessId, reason) {
      return this.transition(paymentId, businessId, 'refunded');
    },
    async cancel(paymentId, businessId) {
      return this.transition(paymentId, businessId, 'cancelled');
    },
    async reconcileFinanceForPayment() {
      return [];
    },
  };
}

async function getUserIdFromAuth(client: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return data.user.id ?? null;
}

async function hasMembership(client: ReturnType<typeof getSupabaseClient>, businessId: string): Promise<boolean> {
  if (!client) {
    return false;
  }

  const userId = await getUserIdFromAuth(client);
  if (!userId || !businessId) {
    return false;
  }

  const { data, error } = await client
    .from('business_memberships')
    .select('business_id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .maybeSingle();

  const membership = data as { business_id?: string } | null;
  return !error && !!membership && membership.business_id === businessId;
}

async function getCurrentProfileId(client: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  if (!client) {
    return null;
  }

  const userId = await getUserIdFromAuth(client);
  if (!userId) {
    return null;
  }

  const { data, error } = await client
    .from('profiles')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as { id?: string }).id ?? null;
}

async function ensureCustomerProfile(client: ReturnType<typeof getSupabaseClient>, input: { businessId: string; customerName: string; customerPhone?: string; deliveryAddress?: string; customerId?: string }) {
  if (!client) {
    return null;
  }

  const existingProfileId = await getCurrentProfileId(client);
  if (existingProfileId) {
    return existingProfileId;
  }

  const userId = await getUserIdFromAuth(client);
  if (!userId) {
    return null;
  }

  const profileEmail = `${userId}@customer.opsps.local`;
  const { data, error } = await client
    .from('profiles')
    .insert({
      business_id: input.businessId,
      auth_user_id: userId,
      full_name: input.customerName,
      email: profileEmail,
      phone: input.customerPhone ?? null,
      address: input.deliveryAddress ?? null,
      role: 'customer',
    })
    .select('id')
    .single();

  if (error || !data) {
    return null;
  }

  return (data as { id?: string }).id ?? null;
}

async function verifyTripBelongsToBusiness(client: ReturnType<typeof getSupabaseClient>, businessId: string, tripId: string): Promise<boolean> {
  if (!client || !tripId || !businessId) {
    return false;
  }

  const { data, error } = await client
    .from('trips')
    .select('id, business_id')
    .eq('id', tripId)
    .maybeSingle();

  const trip = data as { business_id?: string } | null;
  return !error && !!trip && trip.business_id === businessId;
}

class SupabaseDataSource implements DataSource {
  auth: AuthRepository = {
    async registerFounder(input) {
      const client = getSupabaseClient();
      if (!client) {
        return { ok: false, error: 'Supabase is not configured.' };
      }

      const { data: authData, error: signUpError } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.name,
            role: 'founder',
          },
        },
      });

      if (signUpError || !authData.user) {
        return { ok: false, error: signUpError?.message ?? 'Unable to create Supabase Auth user.' };
      }

      const repo = new SupabaseDataSource();
      const business = await repo.business.createBusinessForFounder({
        founderUserId: authData.user.id,
        founderName: input.name,
        businessName: input.businessName || `${input.name}'s Business`,
        email: input.email,
        phone: input.phone,
        address: input.address,
      });

      if (!business) {
        return { ok: false, error: 'Unable to create business after signup.' };
      }

      return { ok: true, businessId: business.businessId, userId: authData.user.id };
    },
    async login(input) {
      const client = getSupabaseClient();
      if (!client) {
        return { ok: false, error: 'Supabase is not configured.' };
      }

      const { data: authData, error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error || !authData.user) {
        return { ok: false, error: error?.message ?? 'Login failed.' };
      }

      const repo = new SupabaseDataSource();
      const businessId = await repo.business.getCurrentBusinessIdForUser(authData.user.id);
      return { ok: true, businessId: businessId ?? undefined, userId: authData.user.id };
    },
    async logout() {
      const client = getSupabaseClient();
      if (!client) {
        return;
      }
      await client.auth.signOut();
    },
    async getCurrentUser() {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        return null;
      }

      const [{ data: profileData }, { data: membershipData }] = await Promise.all([
        client.from('profiles').select('*').eq('auth_user_id', user.id).maybeSingle(),
        client.from('business_memberships').select('business_id, role').eq('user_id', user.id).limit(1),
      ]);

      const role = (profileData?.role as OpspsRole) ?? (membershipData?.[0]?.role as OpspsRole) ?? 'customer';
      return {
        email: user.email ?? profileData?.email ?? '',
        name: profileData?.full_name ?? user.user_metadata?.full_name ?? user.email ?? 'User',
        role,
        businessId: membershipData?.[0]?.business_id ?? undefined,
      };
    },
  };

  business: BusinessRepository = {
    async getCurrentBusinessIdForUser(userId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client
        .from('business_memberships')
        .select('business_id')
        .eq('user_id', userId)
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0]?.business_id ?? null;
    },
    async createBusinessForFounder(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const slug = slugify(input.businessName);
      const { data: businessData, error: businessError } = await client
        .from('businesses')
        .insert({
          name: input.businessName,
          slug,
          email: input.email,
          phone: input.phone,
          address: input.address,
          status: 'active',
        })
        .select('id')
        .single();

      if (businessError || !businessData) {
        return null;
      }

      const { error: membershipError } = await client.from('business_memberships').insert({
        business_id: businessData.id,
        user_id: input.founderUserId,
        role: 'founder',
      });

      if (membershipError) {
        return null;
      }

      const { error: profileError } = await client.from('profiles').insert({
        business_id: businessData.id,
        auth_user_id: input.founderUserId,
        full_name: input.founderName,
        email: input.email ?? `${input.founderUserId}@local.opsps`,
        phone: input.phone,
        address: input.address,
        role: 'founder',
      });

      if (profileError) {
        return null;
      }

      return { businessId: businessData.id };
    },
  };

  trips: TripRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const hasAccess = await hasMembership(client, businessId);
      if (!hasAccess) {
        return [];
      }

      const { data, error } = await client.from('trips').select('*').eq('business_id', businessId);
      if (error || !data) {
        return [];
      }
      return (data as any[]).map((row) => mapTripRow(row));
    },
    async getForBusiness(businessId: string, tripId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client.from('trips').select('*').eq('business_id', businessId).eq('id', tripId).maybeSingle();
      if (error || !data) {
        return null;
      }
      return mapTripRow(data);
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, input.businessId))) {
        return null;
      }

      const { data, error } = await client
        .from('trips')
        .insert({
          business_id: input.businessId,
          name: input.name,
          destination: input.destination,
          trip_date: input.tripDate,
          notes: input.notes,
          status: 'planning',
        })
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapTripRow(data);
    },
    async update(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const existingTrip = await this.getForBusiness(input.businessId, input.tripId);
      if (!existingTrip) {
        return null;
      }

      const payload: Record<string, string | Date | null> = {
        name: input.name ?? existingTrip.name,
        destination: input.destination ?? existingTrip.destination,
        trip_date: input.tripDate ?? existingTrip.tripDate,
        notes: input.notes ?? existingTrip.notes,
      };

      if (input.status) {
        payload.status = input.status;
      }

      const { data, error } = await client
        .from('trips')
        .update(payload)
        .eq('id', input.tripId)
        .eq('business_id', input.businessId)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapTripRow(data);
    },
    async closeTrip(tripId: string, businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const existingTrip = await this.getForBusiness(businessId, tripId);
      if (!existingTrip) {
        return null;
      }

      const { data, error } = await client
        .from('trips')
        .update({ status: 'closed' })
        .eq('id', tripId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapTripRow(data);
    },
  };

  products: ProductRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data: productRows, error: productsError } = await client.from('products').select('*').eq('business_id', businessId);
      if (productsError || !productRows) {
        return [];
      }

      const { data: variantRows, error: variantsError } = await client
        .from('product_variants')
        .select('*')
        .eq('business_id', businessId);

      const variantMap = new Map<string, Array<{ size: string; stock: number }>>();
      if (!variantsError && variantRows) {
        for (const row of variantRows as any[]) {
          const key = row.product_id;
          const existing = variantMap.get(key) ?? [];
          existing.push({ size: row.size ?? 'Standard', stock: Number(row.stock ?? 0) });
          variantMap.set(key, existing);
        }
      }

      return (productRows as any[]).map((row) => mapProductRow(row, variantMap.get(row.id) ?? []));
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const hasBusiness = await hasMembership(client, input.businessId);
      if (!hasBusiness) {
        return null;
      }

      if (input.tripId) {
        const tripMatches = await verifyTripBelongsToBusiness(client, input.businessId, input.tripId);
        if (!tripMatches) {
          return null;
        }
      }

      const { data, error } = await client
        .from('products')
        .insert({
          business_id: input.businessId,
          trip_id: input.tripId ?? null,
          name: input.name,
          category: input.category,
          description: input.description,
          image_url: input.image,
          cost_price: Number(input.costPrice || 0),
          selling_price: Number(input.sellingPrice || 0),
          status: 'ready',
          is_published: false,
        })
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      const variantRow = {
        business_id: input.businessId,
        product_id: data.id,
        size: input.size ?? 'Standard',
        stock: Number(input.stock ?? 0),
      };

      const { error: variantError } = await client.from('product_variants').insert(variantRow);
      if (variantError) {
        return null;
      }

      return mapProductRow(data, [{ size: variantRow.size, stock: variantRow.stock }]);
    },
    async getProduct(productId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data: productData, error: productError } = await client
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (productError || !productData) {
        return null;
      }

      const { data: variantRows } = await client
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('business_id', businessId);

      return mapProductRow(productData, (variantRows ?? []).map((row: any) => ({ size: row.size ?? 'Standard', stock: Number(row.stock ?? 0) })));
    },
    async listVariantsForProduct(productId: string, businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('business_id', businessId);

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapProductVariantRow(row));
    },
    async getProductVariant(productVariantId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client
        .from('product_variants')
        .select('*')
        .eq('id', productVariantId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return mapProductVariantRow(data);
    },
  };

  orders: OrderRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client.from('orders').select('*').eq('business_id', businessId);
      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapOrderRow(row));
    },
    async getForBusiness(businessId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client.from('orders').select('*').eq('business_id', businessId).eq('id', orderId).maybeSingle();
      if (error || !data) {
        return null;
      }

      return mapOrderRow(data);
    },
    async listItemsForOrder(orderId: string, businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client.from('order_items').select('*').eq('order_id', orderId).eq('business_id', businessId);
      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapOrderItemRow(row));
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data: productData, error: productError } = await client.from('products').select('*').eq('id', input.productId).maybeSingle();
      if (productError || !productData) {
        return null;
      }

      const product = productData as any;
      if (product.business_id !== input.businessId) {
        return null;
      }

      if (input.tripId && product.trip_id && product.trip_id !== input.tripId) {
        return null;
      }

      const { data: variantData, error: variantError } = await client
        .from('product_variants')
        .select('*')
        .eq('id', input.productVariantId)
        .eq('product_id', input.productId)
        .eq('business_id', input.businessId)
        .maybeSingle();

      if (variantError || !variantData) {
        return null;
      }

      const isFounder = await hasMembership(client, input.businessId);
      if (!isFounder && !product.is_published) {
        return null;
      }

      const customerProfileId = await ensureCustomerProfile(client, {
        businessId: input.businessId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        customerId: input.customerId,
      });

      if (!customerProfileId && !isFounder) {
        return null;
      }

      const quantity = Math.max(1, Number(input.quantity ?? 1));
      const subtotal = Number(product.selling_price ?? 0) * quantity;
      const shippingFee = Number(input.shippingFee ?? 0);
      const total = subtotal + shippingFee;

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .insert({
          business_id: input.businessId,
          trip_id: input.tripId,
          product_id: input.productId,
          customer_profile_id: customerProfileId,
          customer_name: input.customerName,
          customer_phone: input.customerPhone ?? null,
          delivery_address: input.deliveryAddress ?? null,
          order_date: new Date().toISOString(),
          subtotal,
          shipping_fee: shippingFee,
          total,
          payment_status: 'pending',
          order_status: 'pending',
          request_status: 'PENDING_AVAILABILITY',
          payment_option: input.paymentMethod ?? 'bank',
          payment_mode: input.paymentMethod ?? 'bank',
          availability_status: 'pending',
        })
        .select('*')
        .single();

      if (orderError || !orderData) {
        return null;
      }

      const { error: itemsError } = await client.from('order_items').insert({
        business_id: input.businessId,
        order_id: orderData.id,
        product_variant_id: input.productVariantId,
        quantity,
        packed_quantity: 0,
      });

      if (itemsError) {
        return null;
      }

      return {
        ...mapOrderRow(orderData),
        customerId: input.customerId ?? customerProfileId ?? null,
      };
    },
    async getForCustomer(customerId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const profileId = await getCurrentProfileId(client);
      const queryByCustomerId = customerId ? client.from('orders').select('*').eq('customer_id', customerId).eq('id', orderId).maybeSingle() : Promise.resolve({ data: null, error: null });
      const queryByProfileId = profileId ? client.from('orders').select('*').eq('customer_profile_id', profileId).eq('id', orderId).maybeSingle() : Promise.resolve({ data: null, error: null });

      const [customerResult, profileResult] = await Promise.all([queryByCustomerId, queryByProfileId]);
      const data = customerResult.data ?? profileResult.data;
      if (customerResult.error || profileResult.error || !data) {
        return null;
      }

      return mapOrderRow(data);
    },
    async listForCustomer(customerId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const profileId = await getCurrentProfileId(client);
      const [customerResult, profileResult] = await Promise.all([
        customerId ? client.from('orders').select('*').eq('customer_id', customerId) : Promise.resolve({ data: [], error: null }),
        profileId ? client.from('orders').select('*').eq('customer_profile_id', profileId) : Promise.resolve({ data: [], error: null }),
      ]);

      if (customerResult.error || profileResult.error) {
        return [];
      }

      const rows = [...(customerResult.data ?? []), ...(profileResult.data ?? [])];
      const seen = new Set<string>();
      return rows.filter((row: any) => {
        const key = row?.id;
        if (!key || seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      }).map((row: any) => mapOrderRow(row));
    },
  };

  payments: PaymentRepository = {
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, input.businessId))) {
        return null;
      }

      const orderQuery = await client
        .from('orders')
        .select('id, business_id, total, payment_status, customer_id, customer_profile_id')
        .eq('id', input.orderId)
        .eq('business_id', input.businessId)
        .maybeSingle();

      if (orderQuery.error || !orderQuery.data) {
        return null;
      }

      const orderData = orderQuery.data as any;
      const expectedAmount = Number(input.amount ?? orderData.total ?? 0);
      if (Number(orderData.total ?? 0) > 0 && Math.abs(expectedAmount - Number(orderData.total)) > 0.01) {
        return null;
      }

      if (input.customerId && orderData.customer_id && orderData.customer_id !== input.customerId && orderData.customer_profile_id && orderData.customer_profile_id !== input.customerId) {
        return null;
      }

      const existing = await client.from('payments').select('*').eq('order_id', input.orderId).eq('business_id', input.businessId).maybeSingle();
      if (!existing.error && existing.data) {
        return mapPaymentRow(existing.data);
      }

      const hasProof = typeof input.receiptUri === 'string' && input.receiptUri.trim().length > 0;
      const { data, error } = await client.from('payments').insert({
        business_id: input.businessId,
        order_id: input.orderId,
        payment_method: input.paymentMethod ?? 'bank',
        amount: expectedAmount,
        payment_status: hasProof ? 'pending_verification' : 'pending',
        receipt_uri: input.receiptUri ?? null,
        verified: false,
      }).select('*').single();

      if (error || !data) {
        return null;
      }

      return mapPaymentRow(data);
    },
    async getById(paymentId, businessId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client.from('payments').select('*').eq('id', paymentId).eq('business_id', businessId).maybeSingle();
      if (error || !data) {
        return null;
      }

      return mapPaymentRow(data);
    },
    async getByOrder(businessId, orderId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client.from('payments').select('*').eq('order_id', orderId).eq('business_id', businessId).maybeSingle();
      if (error || !data) {
        return null;
      }

      return mapPaymentRow(data);
    },
    async listForBusiness(businessId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client.from('payments').select('*').eq('business_id', businessId);
      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapPaymentRow(row));
    },
    async transition(paymentId, businessId, nextStatus, overrides = {}) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const existing = await this.getById(paymentId, businessId);
      if (!existing) {
        return null;
      }

      const normalized = nextStatus.toLowerCase() as PaymentRepositoryStatus;
      if (!['pending', 'pending_verification', 'authorized', 'success', 'paid', 'partial', 'pay_later', 'failed', 'cancelled', 'refunded'].includes(normalized)) {
        throw new Error(`Invalid payment transition: ${existing.payment_status} -> ${normalized}`);
      }

      if (!['pending', 'pending_verification', 'authorized', 'success', 'paid', 'partial', 'pay_later', 'failed', 'cancelled', 'refunded'].includes(existing.payment_status ?? 'pending')) {
        throw new Error(`Invalid payment transition: ${existing.payment_status} -> ${normalized}`);
      }

      const from = ((existing.payment_status ?? 'pending') as PaymentRepositoryStatus).toLowerCase() as PaymentRepositoryStatus;
      const validList: Record<PaymentRepositoryStatus, PaymentRepositoryStatus[]> = {
        pending: ['pending_verification', 'authorized', 'paid', 'failed', 'cancelled'],
        pending_verification: ['paid', 'failed', 'cancelled'],
        authorized: ['paid', 'failed', 'cancelled', 'refunded'],
        success: ['paid'],
        paid: ['refunded'],
        partial: ['paid', 'failed', 'cancelled'],
        pay_later: ['paid', 'failed', 'cancelled'],
        failed: [],
        cancelled: [],
        refunded: [],
      };

      if (from === normalized) {
        return existing;
      }

      if (!validList[from]?.includes(normalized)) {
        throw new Error(`Invalid payment transition: ${from} -> ${normalized}`);
      }

      if (overrides.callbackEventId && existing.callback_event_id === overrides.callbackEventId) {
        return existing;
      }

      const payload: Record<string, unknown> = {
        payment_status: normalized,
        verified: overrides.verified ?? ((normalized === 'paid' || normalized === 'success') || existing.verified),
        verified_at: overrides.verified ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      };

      if (overrides.receiptUri) {
        payload.receipt_uri = overrides.receiptUri;
      }

      const { data, error } = await client.from('payments').update(payload).eq('id', paymentId).eq('business_id', businessId).select('*').single();
      if (error || !data) {
        return null;
      }

      if (normalized === 'paid' || normalized === 'refunded') {
        await this.reconcileFinanceForPayment(paymentId, businessId);
      }

      return mapPaymentRow(data);
    },
    async refund(paymentId, businessId, reason) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const payment = await this.getById(paymentId, businessId);
      if (!payment) {
        return null;
      }

      try {
        return await this.transition(paymentId, businessId, 'refunded', { metadata: { refundReason: reason ?? 'Refund requested' } });
      } catch {
        return null;
      }
    },
    async cancel(paymentId, businessId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      try {
        return await this.transition(paymentId, businessId, 'cancelled');
      } catch {
        return null;
      }
    },
    async reconcileFinanceForPayment(paymentId, businessId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return [];
      }

      const payment = await this.getById(paymentId, businessId);
      if (!payment) {
        return [];
      }

      if (payment.payment_status === 'paid' || payment.payment_status === 'success') {
        const category = 'Payment Received';
        const { data: existingRows } = await client.from('finance_transactions').select('id').eq('business_id', businessId).eq('reference_id', paymentId).eq('category', category).limit(1);
        if (!existingRows || existingRows.length > 0) {
          return existingRows ?? [];
        }

        const { data, error } = await client.from('finance_transactions').insert({
          business_id: businessId,
          order_id: payment.order_id,
          description: category,
          amount: Number(payment.amount ?? 0),
          type: 'income',
          payment_method: payment.payment_method ?? 'bank',
          category,
          reference_id: paymentId,
        }).select('*');

        if (error || !data) {
          return [];
        }
        return data as Record<string, unknown>[];
      }

      if (payment.payment_status === 'refunded') {
        const category = 'Payment Refunded';
        const { data: existingRows } = await client.from('finance_transactions').select('id').eq('business_id', businessId).eq('reference_id', paymentId).eq('category', category).limit(1);
        if (!existingRows || existingRows.length > 0) {
          return existingRows ?? [];
        }

        const { data, error } = await client.from('finance_transactions').insert({
          business_id: businessId,
          order_id: payment.order_id,
          description: category,
          amount: Number(payment.amount ?? 0),
          type: 'expense',
          payment_method: payment.payment_method ?? 'bank',
          category,
          reference_id: paymentId,
        }).select('*');

        if (error || !data) {
          return [];
        }
        return data as Record<string, unknown>[];
      }

      return [];
    },
  };
}

export function getDataSource(mode: 'mock' | 'production' = 'production'): DataSource {
  if (mode === 'mock') {
    return new MockDataSource();
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured for production.');
  }

  return new SupabaseDataSource();
}
