import { getSupabaseClient } from './supabaseClient';
import {
  addFinanceTransaction,
  createProduct,
  createTrip,
  deleteFinanceTransaction,
  getMockDatabaseSnapshot,
  getProduct,
  getProductVariant,
  getTripProducts,
  getTripOrders,
  getTripProfit,
  type FinancePaymentMethod,
  type Order,
  type Product,
  type ProductCategory,
  type TripRecord,
  updateFinanceTransaction,
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
  getBySlug(slug: string): Promise<BusinessRecord | null>;
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
  listPublishedForBusiness(businessId: string): Promise<Product[]>;
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
    status?: 'ready' | 'preorder';
    isPublished?: boolean;
  }): Promise<Product | null>;
  update(input: {
    productId: string;
    businessId: string;
    name?: string;
    category?: ProductCategory;
    image?: string;
    tripId?: string;
    description?: string;
    costPrice?: number;
    sellingPrice?: number;
    size?: string;
    stock?: number;
    status?: 'ready' | 'preorder';
    isPublished?: boolean;
  }): Promise<Product | null>;
  getProduct(productId: string, businessId: string): Promise<Product | null>;
  listVariantsForProduct(productId: string, businessId: string): Promise<{ id: string; productId: string; size: string; stock: number }[]>;
  updateVariant(input: {
    variantId: string;
    businessId: string;
    productId?: string;
    size?: string;
    stock?: number;
  }): Promise<{ id: string; productId: string; size: string; stock: number } | null>;
  deleteVariant(variantId: string, businessId: string, productId?: string): Promise<{ id: string; productId: string; size: string; stock: number } | null>;
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

export interface BuyListItemRecord {
  id: string;
  businessId: string;
  tripId?: string;
  orderId: string;
  productId?: string;
  productVariantId: string;
  itemName: string;
  quantity: number;
  purchased: boolean;
}

export type StockCheckResult = {
  orderId: string;
  businessId: string;
  productId?: string;
  available: boolean;
  requestedQuantity: number;
  availableQuantity: number;
  requestStatus: 'AVAILABLE' | 'OUT_OF_STOCK' | 'PENDING_AVAILABILITY';
  availabilityStatus: 'pending' | 'confirmed' | 'not_available';
};

export interface OrderRepository {
  listForBusiness(businessId: string): Promise<OrderRecord[]>;
  getForBusiness(businessId: string, orderId: string): Promise<OrderRecord | null>;
  listItemsForOrder(orderId: string, businessId: string): Promise<OrderItemRecord[]>;
  checkStockAvailability(businessId: string, orderId: string): Promise<StockCheckResult | null>;
  listBuyListForBusiness(businessId: string): Promise<BuyListItemRecord[]>;
  markBuyListItemBought(businessId: string, itemId: string): Promise<BuyListItemRecord | null>;
  startPacking(businessId: string, orderId: string): Promise<OrderRecord | null>;
  setItemPacked(businessId: string, orderId: string, orderItemId: string, packed: boolean): Promise<OrderItemRecord | null>;
  markOrderPacked(businessId: string, orderId: string): Promise<OrderRecord | null>;
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

export type PaymentRepositoryStatus = 'pending' | 'submitted' | 'pending_verification' | 'authorized' | 'success' | 'paid' | 'partial' | 'pay_later' | 'rejected' | 'failed' | 'cancelled' | 'refunded';

export type FinanceTransactionRecord = {
  id: string;
  business_id: string;
  trip_id?: string | null;
  order_id?: string | null;
  product_id?: string | null;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  payment_method?: string | null;
  category?: string | null;
  reference_id?: string | null;
  created_at?: string;
  updated_at?: string;
  is_monthly_expense?: boolean;
};

export interface FinanceRepository {
  listForBusiness(businessId: string): Promise<FinanceTransactionRecord[]>;
  create(input: {
    businessId: string;
    tripId?: string;
    orderId?: string;
    productId?: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    paymentMethod?: string;
    category?: string;
    referenceId?: string;
  }): Promise<FinanceTransactionRecord | null>;
  update(id: string, businessId: string, input: Partial<{
    tripId: string | null;
    orderId: string | null;
    productId: string | null;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    paymentMethod: string | null;
    category: string | null;
    referenceId: string | null;
  }>): Promise<FinanceTransactionRecord | null>;
  delete(id: string, businessId: string): Promise<boolean>;
  getTripSummary(businessId: string, tripId: string): Promise<{ salesRevenue: number; costOfGoods: number; grossProfit: number; moneyIn: number; moneyOut: number; outstandingRevenue: number; netProfit: number }>;
}

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
  verified_at?: string | null;
  verified_by?: string | null;
  submitted_at?: string | null;
  receipt_uri?: string | null;
  customer_id?: string | null;
  customer_payment_reference?: string | null;
  rejection_reason?: string | null;
  payment_instructions_snapshot?: string | null;
  payment_profile_id?: string | null;
  verification_event_id?: string | null;
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
    customerPaymentReference?: string;
    paymentInstructionsSnapshot?: string;
    paymentProfileId?: string;
  }): Promise<PaymentRecordRow | null>;
  getById(paymentId: string, businessId: string): Promise<PaymentRecordRow | null>;
  getByOrder(businessId: string, orderId: string): Promise<PaymentRecordRow | null>;
  listForBusiness(businessId: string): Promise<PaymentRecordRow[]>;
  listPendingForBusiness(businessId: string): Promise<PaymentRecordRow[]>;
  submitDirectQrPayment(input: {
    businessId: string;
    orderId: string;
    amount: number;
    customerId?: string;
    paymentMethod?: string;
    paymentProfileId?: string;
    receiptUri?: string;
    customerPaymentReference?: string;
    paymentInstructionsSnapshot?: string;
    idempotencyKey?: string;
  }): Promise<PaymentRecordRow | null>;
  verifyDirectQrPayment(paymentId: string, businessId: string, verifiedBy?: string, overrides?: {
    orderId?: string;
    rejectionReason?: string;
    paymentProfileId?: string;
    verificationEventId?: string;
  }): Promise<PaymentRecordRow | null>;
  rejectDirectQrPayment(paymentId: string, businessId: string, rejectionReason: string, verifiedBy?: string): Promise<PaymentRecordRow | null>;
  transition(paymentId: string, businessId: string, nextStatus: PaymentRepositoryStatus, overrides?: {
    providerReference?: string;
    providerTransactionId?: string;
    callbackEventId?: string;
    webhookVerified?: boolean;
    verified?: boolean;
    verifiedBy?: string;
    receiptUri?: string;
    customerPaymentReference?: string;
    rejectionReason?: string;
    paymentProfileId?: string;
    verificationEventId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentRecordRow | null>;
  refund(paymentId: string, businessId: string, reason?: string): Promise<PaymentRecordRow | null>;
  cancel(paymentId: string, businessId: string): Promise<PaymentRecordRow | null>;
  reconcileFinanceForPayment(paymentId: string, businessId: string): Promise<Array<Record<string, unknown>>>;
}

export interface ShipmentRecord {
  id: string;
  businessId: string;
  orderId: string;
  courier: string;
  trackingNumber?: string | null;
  shipmentId?: string | null;
  status: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  deliveryAddress?: string | null;
  postcode?: string | null;
  city?: string | null;
  state?: string | null;
  parcelWeight?: number | null;
  quantity?: number | null;
  parcelType?: string | null;
  shippingCost?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingRepository {
  create(input: {
    businessId: string;
    orderId: string;
    courier: string;
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
  }): Promise<ShipmentRecord | null>;
  getForOrder(businessId: string, orderId: string): Promise<ShipmentRecord | null>;
  listForBusiness(businessId: string): Promise<ShipmentRecord[]>;
}

export interface DataSource {
  auth: AuthRepository;
  business: BusinessRepository;
  trips: TripRepository;
  products: ProductRepository;
  orders: OrderRepository;
  shipments: ShippingRepository;
  finance: FinanceRepository;
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
    verified_at: row.verified_at ?? row.verifiedAt ?? null,
    verified_by: row.verified_by ?? row.verifiedBy ?? null,
    submitted_at: row.submitted_at ?? row.submittedAt ?? null,
    receipt_uri: row.receipt_uri ?? row.receiptUri ?? null,
    customer_id: row.customer_id ?? row.customerId ?? null,
    customer_payment_reference: row.customer_payment_reference ?? row.customerPaymentReference ?? null,
    rejection_reason: row.rejection_reason ?? row.rejectionReason ?? null,
    payment_instructions_snapshot: row.payment_instructions_snapshot ?? row.paymentInstructionsSnapshot ?? null,
    payment_profile_id: row.payment_profile_id ?? row.paymentProfileId ?? null,
    verification_event_id: row.verification_event_id ?? row.verificationEventId ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

function mapFinanceTransactionRow(row: any): FinanceTransactionRecord {
  const normalizedType = String(row.type ?? 'expense').toLowerCase() === 'income' ? 'income' : 'expense';
  const category = row.category ?? 'General';
  return {
    id: row.id,
    business_id: row.business_id,
    trip_id: row.trip_id ?? null,
    order_id: row.order_id ?? null,
    product_id: row.product_id ?? null,
    description: row.description ?? 'Finance entry',
    amount: Number(row.amount ?? 0),
    type: normalizedType,
    payment_method: row.payment_method ?? row.paymentMethod ?? 'bank',
    category,
    reference_id: row.reference_id ?? row.referenceId ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    is_monthly_expense: Boolean(row.is_monthly_expense ?? category === 'Monthly Expense'),
  };
}

function mapShipmentRow(row: any): ShipmentRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    orderId: row.order_id,
    courier: row.courier ?? 'J&T',
    trackingNumber: row.tracking_number ?? row.trackingNumber ?? null,
    shipmentId: row.shipment_id ?? row.shipmentId ?? null,
    status: row.status ?? 'created',
    recipientName: row.recipient_name ?? row.recipientName ?? null,
    recipientPhone: row.recipient_phone ?? row.recipientPhone ?? null,
    deliveryAddress: row.delivery_address ?? row.deliveryAddress ?? null,
    postcode: row.postcode ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    parcelWeight: row.parcel_weight !== undefined ? Number(row.parcel_weight ?? 0) : null,
    quantity: row.quantity !== undefined ? Number(row.quantity ?? 0) : null,
    parcelType: row.parcel_type ?? row.parcelType ?? null,
    shippingCost: row.shipping_cost !== undefined ? Number(row.shipping_cost ?? 0) : null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
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
    async getBySlug(slug: string) {
      if (!slug || !slug.trim()) {
        return null;
      }

      return {
        id: 'mock-business',
        name: 'OpsPS Demo',
        slug: slug.trim(),
        email: 'opsps@example.com',
        phone: '+60123456789',
        address: 'Kuala Lumpur',
        status: 'active',
      } satisfies BusinessRecord;
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
    async listPublishedForBusiness(businessId: string) {
      return getMockDatabaseSnapshot().products.filter((product) => product.businessId === businessId && product.status === 'ready');
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
    async update(input) {
      const snapshot = getMockDatabaseSnapshot();
      const product = snapshot.products.find((entry) => entry.id === input.productId && entry.businessId === input.businessId);
      if (!product) {
        return null;
      }
      const updated = {
        ...product,
        name: input.name ?? product.name,
        category: input.category ?? product.category,
        image: input.image ?? product.image,
        tripId: input.tripId ?? product.tripId,
        description: input.description ?? product.description,
        costPrice: input.costPrice ?? product.costPrice,
        sellingPrice: input.sellingPrice ?? product.sellingPrice,
        status: input.status ?? product.status,
        size: input.size ?? product.size,
        stock: input.stock ?? product.stock,
      };
      snapshot.products = snapshot.products.map((entry) => entry.id === product.id ? updated : entry);
      return updated;
    },
    async getProduct(productId, businessId) {
      const product = getProduct(productId, getMockDatabaseSnapshot(), businessId);
      return product ?? null;
    },
    async listVariantsForProduct(productId: string, businessId: string) {
      const variants = getMockDatabaseSnapshot().productVariants.filter((variant) => variant.productId === productId && variant.businessId === businessId);
      return variants.map((variant) => ({ id: variant.id, productId: variant.productId, size: variant.size, stock: variant.stock }));
    },
    async updateVariant(input) {
      const snapshot = getMockDatabaseSnapshot();
      const variant = snapshot.productVariants.find((entry) => entry.id === input.variantId && entry.businessId === input.businessId && (!input.productId || entry.productId === input.productId));
      if (!variant) {
        return null;
      }
      const updated = {
        ...variant,
        size: input.size ?? variant.size,
        stock: input.stock ?? variant.stock,
      };
      snapshot.productVariants = snapshot.productVariants.map((entry) => entry.id === variant.id ? updated : entry);
      return updated;
    },
    async deleteVariant(variantId, businessId, productId) {
      const snapshot = getMockDatabaseSnapshot();
      const variant = snapshot.productVariants.find((entry) => entry.id === variantId && entry.businessId === businessId && (!productId || entry.productId === productId));
      if (!variant) {
        return null;
      }
      snapshot.productVariants = snapshot.productVariants.filter((entry) => entry.id !== variantId || entry.businessId !== businessId || (productId ? entry.productId !== productId : false));
      return {
        id: variant.id,
        productId: variant.productId,
        size: variant.size,
        stock: variant.stock,
      };
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
    async checkStockAvailability(businessId: string, orderId: string) {
      const order = getMockDatabaseSnapshot().orders.find((entry) => entry.businessId === businessId && entry.id === orderId);
      if (!order) {
        return null;
      }

      const items = getMockDatabaseSnapshot().orderItems.filter((entry) => entry.orderId === orderId);
      if (!items.length) {
        return {
          orderId: order.id,
          businessId: order.businessId ?? businessId,
          productId: order.productId,
          available: false,
          requestedQuantity: 0,
          availableQuantity: 0,
          requestStatus: 'PENDING_AVAILABILITY',
          availabilityStatus: 'pending',
        };
      }

      let requestedQuantity = 0;
      let availableQuantity = Number.POSITIVE_INFINITY;
      for (const item of items) {
        const variant = getProductVariant(item.productVariantId, getMockDatabaseSnapshot(), businessId);
        if (!variant || variant.productId !== order.productId) {
          return {
            orderId: order.id,
            businessId: order.businessId ?? businessId,
            productId: order.productId,
            available: false,
            requestedQuantity: requestedQuantity + Number(item.quantity ?? 0),
            availableQuantity: 0,
            requestStatus: 'OUT_OF_STOCK',
            availabilityStatus: 'not_available',
          };
        }

        requestedQuantity += Number(item.quantity ?? 0);
        availableQuantity = Math.min(availableQuantity, Number(variant.stock ?? 0));
      }

      const available = Number.isFinite(availableQuantity) && availableQuantity >= requestedQuantity;
      return {
        orderId: order.id,
        businessId: order.businessId ?? businessId,
        productId: order.productId,
        available,
        requestedQuantity,
        availableQuantity: Number.isFinite(availableQuantity) ? availableQuantity : 0,
        requestStatus: available ? 'AVAILABLE' : 'OUT_OF_STOCK',
        availabilityStatus: available ? 'confirmed' : 'not_available',
      };
    },
    async listBuyListForBusiness(businessId: string) {
      const snapshot = getMockDatabaseSnapshot();
      const entries = new Map<string, BuyListItemRecord>();

      for (const order of snapshot.orders.filter((entry) => entry.businessId === businessId)) {
        for (const item of snapshot.orderItems.filter((entry) => entry.orderId === order.id)) {
          const variant = getProductVariant(item.productVariantId, snapshot, businessId);
          const product = variant ? getProduct(variant.productId, snapshot, businessId) : undefined;
          if (!variant || !product || Number(variant.stock ?? 0) >= Number(item.quantity ?? 0)) {
            continue;
          }

          const key = `${order.id}:${variant.id}`;
          const current = entries.get(key);
          const nextQuantity = Math.max(1, Number(item.quantity ?? 0));
          entries.set(key, {
            id: key,
            businessId,
            tripId: order.tripId,
            orderId: order.id,
            productId: product.id,
            productVariantId: variant.id,
            itemName: product.name,
            quantity: current ? current.quantity + nextQuantity : nextQuantity,
            purchased: false,
          });
        }
      }

      return [...entries.values()];
    },
    async markBuyListItemBought(businessId: string, itemId: string) {
      const snapshot = getMockDatabaseSnapshot();
      const separatorIndex = itemId.lastIndexOf(':');
      if (separatorIndex <= 0 || separatorIndex === itemId.length - 1) {
        return null;
      }

      const orderId = itemId.slice(0, separatorIndex);
      const productVariantId = itemId.slice(separatorIndex + 1);
      const order = snapshot.orders.find((entry) => entry.id === orderId && entry.businessId === businessId);
      const item = snapshot.orderItems.find((entry) => entry.orderId === orderId && entry.productVariantId === productVariantId);
      const variant = getProductVariant(productVariantId, snapshot, businessId);
      if (!order || !item || !variant) {
        return null;
      }

      const product = getProduct(variant.productId, snapshot, businessId);
      const updatedVariant = { ...variant, stock: Number(variant.stock ?? 0) + Number(item.quantity ?? 0) };
      snapshot.productVariants = snapshot.productVariants.map((entry) => entry.id === productVariantId ? updatedVariant : entry);

      return {
        id: itemId,
        businessId,
        tripId: order.tripId,
        orderId: order.id,
        productId: product?.id ?? variant.productId,
        productVariantId: variant.id,
        itemName: product?.name ?? 'Product',
        quantity: Math.max(1, Number(item.quantity ?? 0)),
        purchased: true,
      };
    },
    async startPacking(businessId: string, orderId: string) {
      const snapshot = getMockDatabaseSnapshot();
      const order = snapshot.orders.find((entry) => entry.id === orderId && entry.businessId === businessId);
      if (!order) {
        return null;
      }
      const updated: Order = { ...order, status: 'packing', requestStatus: 'PACKING', packedAt: new Date().toISOString() };
      snapshot.orders = snapshot.orders.map((entry) => entry.id === orderId ? updated : entry);
      return {
        id: updated.id,
        businessId: updated.businessId,
        tripId: updated.tripId,
        productId: updated.productId,
        customerProfileId: updated.customerId ?? null,
        customerId: updated.customerId,
        customerName: updated.customerName,
        customerPhone: updated.customerPhone ?? null,
        deliveryAddress: updated.deliveryAddress ?? null,
        orderDate: updated.orderDate,
        subtotal: Number(updated.total ?? 0),
        shippingFee: Number(updated.shippingFee ?? 0),
        total: Number(updated.total ?? 0),
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus,
        orderStatus: updated.status,
        requestStatus: updated.requestStatus,
        paymentOption: updated.paymentOption,
        paymentMode: updated.paymentMode,
        availabilityStatus: updated.availabilityStatus,
        paymentRequestedAt: updated.paymentRequestedAt,
        paymentVerifiedAt: updated.paymentVerifiedAt,
      };
    },
    async setItemPacked(businessId: string, orderId: string, orderItemId: string, packed: boolean) {
      const snapshot = getMockDatabaseSnapshot();
      const order = snapshot.orders.find((entry) => entry.id === orderId && entry.businessId === businessId);
      const item = snapshot.orderItems.find((entry) => entry.id === orderItemId && entry.orderId === orderId);
      if (!order || !item) {
        return null;
      }
      item.packedQuantity = packed ? item.quantity : 0;
      return {
        id: item.id,
        businessId: order.businessId,
        orderId: item.orderId,
        productVariantId: item.productVariantId,
        quantity: Number(item.quantity ?? 0),
        packedQuantity: Number(item.packedQuantity ?? 0),
      };
    },
    async markOrderPacked(businessId: string, orderId: string) {
      const snapshot = getMockDatabaseSnapshot();
      const order = snapshot.orders.find((entry) => entry.id === orderId && entry.businessId === businessId);
      if (!order) {
        return null;
      }
      const items = snapshot.orderItems.filter((entry) => entry.orderId === orderId);
      if (!items.length || items.some((item) => (item.packedQuantity ?? 0) < item.quantity)) {
        return null;
      }
      const updated: Order = { ...order, status: 'packing', requestStatus: 'PACKING', packedAt: new Date().toISOString() };
      snapshot.orders = snapshot.orders.map((entry) => entry.id === orderId ? updated : entry);
      return {
        id: updated.id,
        businessId: updated.businessId,
        tripId: updated.tripId,
        productId: updated.productId,
        customerProfileId: updated.customerId ?? null,
        customerId: updated.customerId,
        customerName: updated.customerName,
        customerPhone: updated.customerPhone ?? null,
        deliveryAddress: updated.deliveryAddress ?? null,
        orderDate: updated.orderDate,
        subtotal: Number(updated.total ?? 0),
        shippingFee: Number(updated.shippingFee ?? 0),
        total: Number(updated.total ?? 0),
        paymentMethod: updated.paymentMethod,
        paymentStatus: updated.paymentStatus,
        orderStatus: updated.status,
        requestStatus: updated.requestStatus,
        paymentOption: updated.paymentOption,
        paymentMode: updated.paymentMode,
        availabilityStatus: updated.availabilityStatus,
        paymentRequestedAt: updated.paymentRequestedAt,
        paymentVerifiedAt: updated.paymentVerifiedAt,
      };
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

  shipments: ShippingRepository = {
    async create(input) {
      const snapshot = getMockDatabaseSnapshot();
      const order = snapshot.orders.find((entry) => entry.id === input.orderId && entry.businessId === input.businessId);
      if (!order || !['packing', 'ready', 'shipped'].includes(order.status)) {
        return null;
      }
      const paymentApproved = order.paymentStatus === 'success' || order.paymentStatus === 'paid' || order.status === 'payment_received' || order.requestStatus === 'PAYMENT_RECEIVED';
      if (!paymentApproved) {
        return null;
      }

      const trackingNumber = `OPSPS-${Date.now().toString(36).toUpperCase()}`;
      const shipment = {
        id: `shipment-mock-${Date.now()}`,
        businessId: input.businessId,
        orderId: input.orderId,
        courier: input.courier ?? 'J&T',
        trackingNumber,
        shipmentId: `shipment-${Date.now()}`,
        status: 'created',
        recipientName: input.recipientName ?? order.customerName,
        recipientPhone: input.recipientPhone ?? order.customerPhone ?? null,
        deliveryAddress: input.deliveryAddress ?? order.deliveryAddress ?? null,
        postcode: input.postcode ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        parcelWeight: input.parcelWeight ?? null,
        quantity: input.quantity ?? 1,
        parcelType: input.parcelType ?? 'Parcel',
        shippingCost: input.shippingCost ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies ShipmentRecord;

      snapshot.orders = snapshot.orders.map((entry) => entry.id === input.orderId ? {
        ...entry,
        status: 'shipped',
        requestStatus: 'SHIPPED',
        shipment: {
          orderId: entry.id,
          courier: shipment.courier,
          trackingNumber: shipment.trackingNumber,
          shipmentId: shipment.shipmentId,
          status: 'created',
          shippingStatus: 'created',
          recipientName: shipment.recipientName ?? entry.customerName,
          recipientPhone: shipment.recipientPhone ?? entry.customerPhone ?? '',
          deliveryAddress: shipment.deliveryAddress ?? entry.deliveryAddress ?? '',
          postcode: shipment.postcode ?? '',
          city: shipment.city ?? '',
          state: shipment.state ?? '',
          parcelWeight: shipment.parcelWeight ?? 0,
          quantity: Number(shipment.quantity ?? 1),
          parcelType: shipment.parcelType ?? 'Parcel',
          shippingCost: Number(shipment.shippingCost ?? 0),
          createdAt: shipment.createdAt ?? new Date().toISOString(),
        },
      } : entry);

      return shipment;
    },
    async getForOrder(businessId: string, orderId: string) {
      const snapshot = getMockDatabaseSnapshot();
      const order = snapshot.orders.find((entry) => entry.id === orderId && entry.businessId === businessId);
      if (!order?.shipment) {
        return null;
      }
      return {
        id: `${order.id}-shipment`,
        businessId,
        orderId: order.id,
        courier: order.shipment.courier,
        trackingNumber: order.shipment.trackingNumber,
        shipmentId: order.shipment.shipmentId,
        status: order.shipment.status,
        recipientName: order.shipment.recipientName ?? null,
        recipientPhone: order.shipment.recipientPhone ?? null,
        deliveryAddress: order.shipment.deliveryAddress ?? null,
        postcode: order.shipment.postcode ?? null,
        city: order.shipment.city ?? null,
        state: order.shipment.state ?? null,
        parcelWeight: order.shipment.parcelWeight ?? null,
        quantity: order.shipment.quantity ?? null,
        parcelType: order.shipment.parcelType ?? null,
        shippingCost: order.shipment.shippingCost ?? null,
        createdAt: order.shipment.createdAt,
        updatedAt: order.shipment.createdAt,
      };
    },
    async listForBusiness(businessId: string) {
      const snapshot = getMockDatabaseSnapshot();
      return snapshot.orders.filter((order) => order.businessId === businessId && order.shipment).map((order) => ({
        id: `${order.id}-shipment`,
        businessId,
        orderId: order.id,
        courier: order.shipment!.courier,
        trackingNumber: order.shipment!.trackingNumber,
        shipmentId: order.shipment!.shipmentId,
        status: order.shipment!.status,
        recipientName: order.shipment!.recipientName ?? null,
        recipientPhone: order.shipment!.recipientPhone ?? null,
        deliveryAddress: order.shipment!.deliveryAddress ?? null,
        postcode: order.shipment!.postcode ?? null,
        city: order.shipment!.city ?? null,
        state: order.shipment!.state ?? null,
        parcelWeight: order.shipment!.parcelWeight ?? null,
        quantity: order.shipment!.quantity ?? null,
        parcelType: order.shipment!.parcelType ?? null,
        shippingCost: order.shipment!.shippingCost ?? null,
        createdAt: order.shipment!.createdAt,
        updatedAt: order.shipment!.createdAt,
      }));
    },
  };

  finance: FinanceRepository = {
    async listForBusiness(businessId: string) {
      const snapshot = getMockDatabaseSnapshot();
      return snapshot.financeTransactions
        .filter((transaction) => !transaction.tripId || snapshot.trips.some((trip) => trip.id === transaction.tripId && trip.businessId === businessId))
        .map((transaction) => mapFinanceTransactionRow({
          ...transaction,
          business_id: businessId,
          trip_id: transaction.tripId ?? null,
          order_id: transaction.orderId ?? null,
          product_id: transaction.productId ?? null,
        }));
    },
    async create(input) {
      const paymentMethod = (input.paymentMethod ?? 'bank') as FinancePaymentMethod;
      const entity = addFinanceTransaction({
        description: input.description,
        amount: Number(input.amount ?? 0),
        type: input.type,
        paymentMethod,
        category: input.category ?? 'General',
        referenceId: input.referenceId,
        tripId: input.tripId,
        orderId: input.orderId,
        productId: input.productId,
      });
      return mapFinanceTransactionRow({
        id: entity.id,
        business_id: input.businessId,
        trip_id: entity.tripId ?? null,
        order_id: entity.orderId ?? null,
        product_id: entity.productId ?? null,
        description: entity.description,
        amount: Number(entity.amount ?? 0),
        type: entity.type,
        payment_method: entity.paymentMethod ?? 'bank',
        category: entity.category,
        reference_id: entity.referenceId ?? null,
        created_at: entity.date,
        updated_at: entity.date,
        is_monthly_expense: Boolean(entity.isMonthlyExpense ?? entity.category === 'Monthly Expense'),
      });
    },
    async update(id, businessId, input) {
      const snapshot = getMockDatabaseSnapshot();
      const current = snapshot.financeTransactions.find((transaction) => transaction.id === id);
      if (!current) {
        return null;
      }
      const next = {
        ...current,
        description: input.description ?? current.description,
        amount: input.amount ?? current.amount,
        type: input.type ?? current.type,
        paymentMethod: (input.paymentMethod ?? current.paymentMethod) as FinancePaymentMethod,
        category: input.category ?? current.category,
        referenceId: input.referenceId ?? current.referenceId,
        tripId: input.tripId ?? current.tripId,
        orderId: input.orderId ?? current.orderId,
        productId: input.productId ?? current.productId,
      };
      updateFinanceTransaction(id, next);
      return mapFinanceTransactionRow({
        id: next.id,
        business_id: businessId,
        trip_id: next.tripId ?? null,
        order_id: next.orderId ?? null,
        product_id: next.productId ?? null,
        description: next.description,
        amount: Number(next.amount ?? 0),
        type: next.type,
        payment_method: next.paymentMethod ?? 'bank',
        category: next.category,
        reference_id: next.referenceId ?? null,
        created_at: next.date,
        updated_at: next.date,
        is_monthly_expense: Boolean(next.isMonthlyExpense ?? next.category === 'Monthly Expense'),
      });
    },
    async delete(id, businessId) {
      const snapshot = getMockDatabaseSnapshot();
      const current = snapshot.financeTransactions.find((transaction) => transaction.id === id);
      if (!current) {
        return false;
      }
      deleteFinanceTransaction(id);
      return true;
    },
    async getTripSummary(businessId, tripId) {
      const snapshot = getMockDatabaseSnapshot();
      const trip = snapshot.trips.find((entry) => entry.id === tripId && entry.businessId === businessId);
      if (!trip) {
        return { salesRevenue: 0, costOfGoods: 0, grossProfit: 0, moneyIn: 0, moneyOut: 0, outstandingRevenue: 0, netProfit: 0 };
      }
      const result = getTripProfit(tripId, snapshot);
      return { ...result, moneyOut: result.moneyOut, outstandingRevenue: result.outstandingRevenue };
    },
  };

  payments: PaymentRepository = {
    async create(input) {
      const normalizedProvider = (input.provider ?? input.paymentMethod ?? 'mock').toLowerCase();
      const hasProof = Boolean(input.receiptUri && input.receiptUri.trim().length > 0);
      const isDirectQr = normalizedProvider === 'direct_qr' || input.paymentMethod?.toUpperCase() === 'DIRECT_QR';
      const paymentStatus = isDirectQr ? (hasProof || input.customerPaymentReference ? 'submitted' : 'pending') : hasProof ? 'pending_verification' : 'pending';

      return {
        id: `payment-mock-${Date.now()}`,
        business_id: input.businessId,
        order_id: input.orderId,
        payment_method: input.paymentMethod ?? 'bank',
        payment_status: paymentStatus,
        status: paymentStatus,
        amount: Number(input.amount ?? 0),
        currency: input.currency ?? 'MYR',
        provider: normalizedProvider,
        provider_reference: input.providerReference ?? undefined,
        provider_transaction_id: input.providerTransactionId ?? undefined,
        idempotency_key: input.idempotencyKey ?? `${input.orderId}:${input.businessId}`,
        callback_event_id: input.callbackEventId ?? undefined,
        webhook_verified: Boolean(input.webhookVerified ?? false),
        verified: false,
        receipt_uri: input.receiptUri ?? null,
        customer_id: input.customerId ?? null,
        customer_payment_reference: input.customerPaymentReference ?? null,
        payment_instructions_snapshot: input.paymentInstructionsSnapshot ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    async getById(paymentId, businessId) {
      return {
        id: paymentId,
        business_id: businessId,
        order_id: 'order-mock',
        payment_method: 'DIRECT_QR',
        payment_status: 'pending',
        status: 'pending',
        amount: 0,
        currency: 'MYR',
        provider: 'direct_qr',
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
        payment_method: 'DIRECT_QR',
        payment_status: 'pending',
        status: 'pending',
        amount: 0,
        currency: 'MYR',
        provider: 'direct_qr',
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
        payment_method: 'DIRECT_QR',
        payment_status: 'pending',
        status: 'pending',
        amount: 0,
        currency: 'MYR',
        provider: 'direct_qr',
        idempotency_key: `${businessId}-mock`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    },
    async listPendingForBusiness(businessId) {
      return [{
        id: `payment-mock-pending-${businessId}`,
        business_id: businessId,
        order_id: 'order-mock',
        payment_method: 'DIRECT_QR',
        payment_status: 'submitted',
        status: 'submitted',
        amount: 0,
        currency: 'MYR',
        provider: 'direct_qr',
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }];
    },
    async submitDirectQrPayment(input) {
      const amount = Number(input.amount ?? 0);
      return this.create({
        businessId: input.businessId,
        orderId: input.orderId,
        amount,
        currency: 'MYR',
        paymentMethod: input.paymentMethod ?? 'DIRECT_QR',
        provider: 'direct_qr',
        customerId: input.customerId,
        receiptUri: input.receiptUri,
        customerPaymentReference: input.customerPaymentReference,
        paymentInstructionsSnapshot: input.paymentInstructionsSnapshot,
        paymentProfileId: input.paymentProfileId,
        idempotencyKey: input.idempotencyKey ?? `${input.businessId}:${input.orderId}:direct_qr`,
      });
    },
    async verifyDirectQrPayment(paymentId, businessId, verifiedBy, overrides = {}) {
      const existing = await this.getById(paymentId, businessId);
      if (!existing || !['submitted', 'pending_verification', 'rejected'].includes(existing.payment_status ?? '')) {
        return null;
      }
      return this.transition(paymentId, businessId, 'paid', {
        verified: true,
        verifiedBy: verifiedBy ?? undefined,
        verificationEventId: overrides.verificationEventId ?? `verify-${paymentId}`,
      });
    },
    async rejectDirectQrPayment(paymentId, businessId, rejectionReason, verifiedBy) {
      const existing = await this.getById(paymentId, businessId);
      if (!existing || !['submitted', 'pending_verification', 'rejected'].includes(existing.payment_status ?? '')) {
        return null;
      }
      return this.transition(paymentId, businessId, 'rejected', {
        rejectionReason,
        verified: false,
        verifiedBy: verifiedBy ?? undefined,
      });
    },
    async transition(paymentId, businessId, nextStatus, overrides = {}) {
      const normalizedStatus = String(nextStatus).toLowerCase();
      if ((normalizedStatus === 'paid' || normalizedStatus === 'approved' || normalizedStatus === 'success') && overrides.verified !== true) {
        return null;
      }

      const record = {
        id: paymentId,
        business_id: businessId,
        order_id: 'order-mock',
        payment_method: 'DIRECT_QR',
        payment_status: normalizedStatus,
        status: normalizedStatus,
        amount: 0,
        currency: 'MYR',
        provider: 'direct_qr',
        verified: Boolean(overrides.verified ?? false),
        verified_by: overrides.verifiedBy ?? null,
        customer_payment_reference: overrides.customerPaymentReference ?? null,
        rejection_reason: overrides.rejectionReason ?? null,
        receipt_uri: overrides.receiptUri ?? null,
        idempotency_key: `${paymentId}:${businessId}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return record;
    },
    async refund(paymentId, businessId, reason) {
      return this.transition(paymentId, businessId, 'refunded', { rejectionReason: reason });
    },
    async cancel(paymentId, businessId) {
      return this.transition(paymentId, businessId, 'cancelled');
    },
    async reconcileFinanceForPayment(paymentId, businessId) {
      const payment = await this.getById(paymentId, businessId);
      if (!payment || payment.payment_status !== 'paid') {
        return [];
      }
      return [{ id: paymentId, business_id: businessId, order_id: payment.order_id, amount: Number(payment.amount ?? 0), payment_status: payment.payment_status, description: 'Direct QR payment received' }];
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

async function hasBusinessAdminAccess(client: ReturnType<typeof getSupabaseClient>, businessId: string): Promise<boolean> {
  if (!client) {
    return false;
  }

  const userId = await getUserIdFromAuth(client);
  if (!userId || !businessId) {
    return false;
  }

  const { data, error } = await client
    .from('business_memberships')
    .select('business_id, role')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const role = String((data as { role?: string }).role ?? '').toLowerCase();
  return role === 'founder' || role === 'admin';
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
    async getBySlug(slug: string) {
      const client = getSupabaseClient();
      if (!client || !slug.trim()) {
        return null;
      }

      const { data, error } = await client
        .from('businesses')
        .select('*')
        .eq('slug', slug.trim())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name ?? 'OpsPS Business',
        slug: data.slug ?? slug.trim(),
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        status: data.status ?? 'active',
        created_at: data.created_at ?? undefined,
        updated_at: data.updated_at ?? undefined,
      } satisfies BusinessRecord;
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
    async listPublishedForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const { data: productRows, error: productsError } = await client
        .from('products')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_published', true);

      if (productsError || !productRows) {
        return [];
      }

      const { data: variantRows } = await client
        .from('product_variants')
        .select('*')
        .eq('business_id', businessId);

      const variantMap = new Map<string, Array<{ size: string; stock: number }>>();
      if (variantRows) {
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
          status: input.status ?? 'ready',
          is_published: Boolean(input.isPublished ?? false),
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
    async update(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const existing = await this.getProduct(input.productId, input.businessId);
      if (!existing) {
        return null;
      }

      if (input.tripId) {
        const tripMatches = await verifyTripBelongsToBusiness(client, input.businessId, input.tripId);
        if (!tripMatches) {
          return null;
        }
      }

      const payload: Record<string, unknown> = {
        name: input.name ?? existing.name,
        category: input.category ?? existing.category,
        description: input.description ?? existing.description,
        image_url: input.image ?? existing.image,
        trip_id: input.tripId ?? existing.tripId,
        cost_price: Number(input.costPrice ?? existing.costPrice),
        selling_price: Number(input.sellingPrice ?? existing.sellingPrice),
        status: input.status ?? existing.status,
        is_published: typeof input.isPublished === 'boolean' ? input.isPublished : Boolean(existing.status === 'ready'),
      };

      const { data, error } = await client
        .from('products')
        .update(payload)
        .eq('id', input.productId)
        .eq('business_id', input.businessId)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      if (typeof input.stock === 'number' || input.size) {
        const baseVariant = await this.listVariantsForProduct(input.productId, input.businessId);
        const variantToUpdate = baseVariant[0] ?? null;
        if (variantToUpdate) {
          await this.updateVariant({
            variantId: variantToUpdate.id,
            businessId: input.businessId,
            productId: input.productId,
            size: input.size ?? variantToUpdate.size,
            stock: input.stock ?? variantToUpdate.stock,
          });
        }
      }

      return this.getProduct(input.productId, input.businessId);
    },
    async getProduct(productId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
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

      const isMember = await hasMembership(client, businessId);
      if (!productData.is_published && !isMember) {
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

      const isMember = await hasMembership(client, businessId);
      if (!isMember) {
        const { data: productData, error: productError } = await client
          .from('products')
          .select('id, business_id, is_published')
          .eq('id', productId)
          .eq('business_id', businessId)
          .maybeSingle();

        if (productError || !productData || !productData.is_published) {
          return [];
        }
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
    async updateVariant(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const baseQuery = client.from('product_variants').update({
        size: input.size ?? undefined,
        stock: input.stock ?? undefined,
      }).eq('id', input.variantId).eq('business_id', input.businessId);

      if (input.productId) {
        baseQuery.eq('product_id', input.productId);
      }

      const { data, error } = await baseQuery.select('*').single();
      if (error || !data) {
        return null;
      }

      return mapProductVariantRow(data);
    },
    async deleteVariant(variantId, businessId, productId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasBusinessAdminAccess(client, businessId))) {
        return null;
      }

      const { data: existingVariant, error: lookupError } = await client
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (lookupError || !existingVariant) {
        return null;
      }

      if (productId && existingVariant.product_id !== productId) {
        return null;
      }

      let deleteQuery = client.from('product_variants').delete().eq('id', variantId).eq('business_id', businessId);
      if (productId) {
        deleteQuery = deleteQuery.eq('product_id', productId);
      }

      const { error: deleteError } = await deleteQuery;
      if (deleteError) {
        return null;
      }

      return mapProductVariantRow(existingVariant);
    },
    async getProductVariant(productVariantId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const isMember = await hasMembership(client, businessId);
      if (!isMember) {
        const { data: variantData, error: variantError } = await client
          .from('product_variants')
          .select('id, business_id, product_id')
          .eq('id', productVariantId)
          .eq('business_id', businessId)
          .maybeSingle();

        if (variantError || !variantData) {
          return null;
        }

        const { data: productData, error: productError } = await client
          .from('products')
          .select('id, business_id, is_published')
          .eq('id', variantData.product_id)
          .eq('business_id', businessId)
          .maybeSingle();

        if (productError || !productData || !productData.is_published) {
          return null;
        }
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
    async checkStockAvailability(businessId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (orderError || !orderData) {
        return null;
      }

      const order = orderData as any;
      const { data: itemRows, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('business_id', businessId);

      if (itemsError || !itemRows || itemRows.length === 0) {
        return {
          orderId: order.id,
          businessId: order.business_id ?? businessId,
          productId: order.product_id ?? undefined,
          available: false,
          requestedQuantity: 0,
          availableQuantity: 0,
          requestStatus: 'PENDING_AVAILABILITY',
          availabilityStatus: 'pending',
        };
      }

      let requestedQuantity = 0;
      let availableQuantity = Number.POSITIVE_INFINITY;

      for (const item of itemRows as any[]) {
        const { data: variantData, error: variantError } = await client
          .from('product_variants')
          .select('*')
          .eq('id', item.product_variant_id)
          .eq('business_id', businessId)
          .maybeSingle();

        if (variantError || !variantData) {
          return {
            orderId: order.id,
            businessId: order.business_id ?? businessId,
            productId: order.product_id ?? undefined,
            available: false,
            requestedQuantity: requestedQuantity + Number(item.quantity ?? 0),
            availableQuantity: 0,
            requestStatus: 'OUT_OF_STOCK',
            availabilityStatus: 'not_available',
          };
        }

        const variant = variantData as any;
        if (order.product_id && variant.product_id && order.product_id !== variant.product_id) {
          return {
            orderId: order.id,
            businessId: order.business_id ?? businessId,
            productId: order.product_id ?? undefined,
            available: false,
            requestedQuantity: requestedQuantity + Number(item.quantity ?? 0),
            availableQuantity: 0,
            requestStatus: 'OUT_OF_STOCK',
            availabilityStatus: 'not_available',
          };
        }

        requestedQuantity += Number(item.quantity ?? 0);
        availableQuantity = Math.min(availableQuantity, Number(variant.stock ?? 0));
      }

      const available = Number.isFinite(availableQuantity) && availableQuantity >= requestedQuantity;
      return {
        orderId: order.id,
        businessId: order.business_id ?? businessId,
        productId: order.product_id ?? undefined,
        available,
        requestedQuantity,
        availableQuantity: Number.isFinite(availableQuantity) ? availableQuantity : 0,
        requestStatus: available ? 'AVAILABLE' : 'OUT_OF_STOCK',
        availabilityStatus: available ? 'confirmed' : 'not_available',
      };
    },
    async listBuyListForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data: orders, error: ordersError } = await client.from('orders').select('*').eq('business_id', businessId);
      if (ordersError || !orders) {
        return [];
      }

      const buyList = new Map<string, BuyListItemRecord>();

      for (const order of orders as any[]) {
        const { data: items, error: itemsError } = await client.from('order_items').select('*').eq('order_id', order.id).eq('business_id', businessId);
        if (itemsError || !items) {
          continue;
        }

        for (const item of items as any[]) {
          const { data: variantData, error: variantError } = await client
            .from('product_variants')
            .select('*')
            .eq('id', item.product_variant_id)
            .eq('business_id', businessId)
            .maybeSingle();

          if (variantError || !variantData) {
            continue;
          }

          const variant = variantData as any;
          const shortage = Number(variant.stock ?? 0) < Number(item.quantity ?? 0);
          if (!shortage) {
            continue;
          }

          const { data: productData } = await client.from('products').select('*').eq('id', variant.product_id).eq('business_id', businessId).maybeSingle();
          const product = (productData as any) ?? null;
          const key = `${order.id}:${variant.id}`;
          const nextQuantity = Math.max(1, Number(item.quantity ?? 0));
          const existing = buyList.get(key);

          buyList.set(key, {
            id: key,
            businessId,
            tripId: order.trip_id ?? undefined,
            orderId: order.id,
            productId: product?.id ?? variant.product_id,
            productVariantId: variant.id,
            itemName: product?.name ?? 'Product',
            quantity: existing ? existing.quantity + nextQuantity : nextQuantity,
            purchased: false,
          });
        }
      }

      return [...buyList.values()];
    },
    async markBuyListItemBought(businessId: string, itemId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const separatorIndex = itemId.lastIndexOf(':');
      if (separatorIndex <= 0 || separatorIndex === itemId.length - 1) {
        return null;
      }

      const orderId = itemId.slice(0, separatorIndex);
      const productVariantId = itemId.slice(separatorIndex + 1);

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (orderError || !orderData) {
        return null;
      }

      const order = orderData as any;
      const { data: itemData, error: itemError } = await client
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('product_variant_id', productVariantId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (itemError || !itemData) {
        return null;
      }

      const item = itemData as any;
      const { data: variantData, error: variantError } = await client
        .from('product_variants')
        .select('*')
        .eq('id', productVariantId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (variantError || !variantData) {
        return null;
      }

      const variant = variantData as any;
      const nextStock = Number(variant.stock ?? 0) + Number(item.quantity ?? 0);
      const { data: updatedVariant, error: updateError } = await client
        .from('product_variants')
        .update({ stock: nextStock })
        .eq('id', productVariantId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (updateError || !updatedVariant) {
        return null;
      }

      const { data: productData } = await client.from('products').select('*').eq('id', variant.product_id).eq('business_id', businessId).maybeSingle();
      const product = (productData as any) ?? null;

      return {
        id: itemId,
        businessId,
        tripId: order.trip_id ?? undefined,
        orderId: order.id,
        productId: product?.id ?? variant.product_id,
        productVariantId: variant.id,
        itemName: product?.name ?? 'Product',
        quantity: Math.max(1, Number(item.quantity ?? 0)),
        purchased: true,
      };
    },
    async startPacking(businessId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (orderError || !orderData) {
        return null;
      }

      const { data: updated, error: updateError } = await client
        .from('orders')
        .update({
          order_status: 'packing',
          request_status: 'PACKING',
        })
        .eq('id', orderId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (updateError || !updated) {
        return null;
      }

      return mapOrderRow(updated as any);
    },
    async setItemPacked(businessId: string, orderId: string, orderItemId: string, packed: boolean) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (orderError || !orderData) {
        return null;
      }

      const { data: itemData, error: itemError } = await client
        .from('order_items')
        .select('*')
        .eq('id', orderItemId)
        .eq('order_id', orderId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (itemError || !itemData) {
        return null;
      }

      const nextQuantity = packed ? Number((itemData as any).quantity ?? 0) : 0;
      const { data: updated, error: updateError } = await client
        .from('order_items')
        .update({ packed_quantity: nextQuantity })
        .eq('id', orderItemId)
        .eq('order_id', orderId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (updateError || !updated) {
        return null;
      }

      return mapOrderItemRow(updated as any);
    },
    async markOrderPacked(businessId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (orderError || !orderData) {
        return null;
      }

      const { data: items, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .eq('business_id', businessId);

      if (itemsError || !items || items.length === 0) {
        return null;
      }

      const allPacked = (items as any[]).every((item) => Number(item.packed_quantity ?? 0) >= Number(item.quantity ?? 0));
      if (!allPacked) {
        return null;
      }

      const { data: updated, error: updateError } = await client
        .from('orders')
        .update({
          order_status: 'packing',
          request_status: 'PACKING',
        })
        .eq('id', orderId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (updateError || !updated) {
        return null;
      }

      return mapOrderRow(updated as any);
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const cleanedName = String(input.customerName ?? '').trim();
      if (!cleanedName) {
        return null;
      }

      const quantity = Number(input.quantity ?? 1);
      if (!Number.isFinite(quantity) || quantity <= 0) {
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

      if (input.tripId && !product.trip_id) {
        const tripMatches = await verifyTripBelongsToBusiness(client, input.businessId, input.tripId);
        if (!tripMatches) {
          return null;
        }
      }

      const currentUserIsMember = !!(await getUserIdFromAuth(client)) && await hasMembership(client, input.businessId);
      if (!product.is_published && !currentUserIsMember) {
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

      const variant = variantData as any;
      const availableStock = Number(variant.stock ?? 0);
      if (availableStock < quantity) {
        return null;
      }

      const customerProfileId = await ensureCustomerProfile(client, {
        businessId: input.businessId,
        customerName: cleanedName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        customerId: input.customerId,
      });

      const subtotal = Number(product.selling_price ?? 0) * quantity;
      const shippingFee = Number(input.shippingFee ?? 0);
      const total = subtotal + shippingFee;

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .insert({
          business_id: input.businessId,
          trip_id: input.tripId || null,
          product_id: input.productId,
          customer_profile_id: input.customerProfileId ?? customerProfileId ?? null,
          customer_name: cleanedName,
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
        customerId: input.customerId ?? input.customerProfileId ?? customerProfileId ?? null,
      };
    },
    async getForCustomer(customerId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const profileId = await getCurrentProfileId(client);
      const candidates = new Set<string>();
      if (customerId) candidates.add(customerId);
      if (profileId) candidates.add(profileId);

      const results = await Promise.all(
        [...candidates].map(async (candidateId) => {
          const byCustomerId = await client.from('orders').select('*').eq('customer_id', candidateId).eq('id', orderId).maybeSingle();
          if (byCustomerId.data && !byCustomerId.error) {
            return byCustomerId.data;
          }

          const byProfileId = await client.from('orders').select('*').eq('customer_profile_id', candidateId).eq('id', orderId).maybeSingle();
          if (byProfileId.data && !byProfileId.error) {
            return byProfileId.data;
          }

          return null;
        })
      );

      const data = results.find((row) => row) ?? null;
      if (!data) {
        return null;
      }

      return mapOrderRow(data as any);
    },
    async listForCustomer(customerId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const profileId = await getCurrentProfileId(client);
      const candidates = new Set<string>();
      if (customerId) candidates.add(customerId);
      if (profileId) candidates.add(profileId);

      const results = await Promise.all(
        [...candidates].map(async (candidateId) => {
          const byCustomerId = await client.from('orders').select('*').eq('customer_id', candidateId);
          const byProfileId = await client.from('orders').select('*').eq('customer_profile_id', candidateId);
          if (byCustomerId.error || byProfileId.error) {
            return [];
          }
          return [...(byCustomerId.data ?? []), ...(byProfileId.data ?? [])];
        })
      );

      const rows = results.flat();
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

  shipments: ShippingRepository = {
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, input.businessId))) {
        return null;
      }

      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select('id, business_id, payment_status, order_status, request_status')
        .eq('id', input.orderId)
        .eq('business_id', input.businessId)
        .maybeSingle();

      if (orderError || !orderData) {
        return null;
      }

      const paymentStatus = String((orderData as any).payment_status ?? '').toLowerCase();
      const orderStatus = String((orderData as any).order_status ?? '').toLowerCase();
      const requestStatus = String((orderData as any).request_status ?? '').toUpperCase();
      const paymentApproved = ['success', 'paid', 'payment_received'].includes(paymentStatus) || requestStatus === 'PAYMENT_RECEIVED';
      const isShipmentEligible = ['packing', 'ready', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(orderStatus);
      if (!paymentApproved || !isShipmentEligible) {
        return null;
      }

      const { data: existingShipment, error: existingError } = await client
        .from('shipments')
        .select('*')
        .eq('order_id', input.orderId)
        .eq('business_id', input.businessId)
        .maybeSingle();

      if (!existingError && existingShipment) {
        return mapShipmentRow(existingShipment as any);
      }

      const shipmentPayload = {
        business_id: input.businessId,
        order_id: input.orderId,
        courier: input.courier || 'J&T',
        tracking_number: null,
        shipment_id: null,
        status: 'created',
        recipient_name: input.recipientName ?? null,
        recipient_phone: input.recipientPhone ?? null,
        delivery_address: input.deliveryAddress ?? null,
        postcode: input.postcode ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        parcel_weight: input.parcelWeight ?? null,
        quantity: input.quantity ?? 1,
        parcel_type: input.parcelType ?? 'Parcel',
        shipping_cost: input.shippingCost ?? 0,
      };

      const { data, error } = await client
        .from('shipments')
        .insert(shipmentPayload)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      await client
        .from('orders')
        .update({
          order_status: 'shipped',
          request_status: 'SHIPPED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.orderId)
        .eq('business_id', input.businessId);

      return mapShipmentRow(data as any);
    },
    async getForOrder(businessId: string, orderId: string) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client
        .from('shipments')
        .select('*')
        .eq('business_id', businessId)
        .eq('order_id', orderId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return mapShipmentRow(data as any);
    },
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client
        .from('shipments')
        .select('*')
        .eq('business_id', businessId);

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapShipmentRow(row));
    },
  };

  finance: FinanceRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client
        .from('finance_transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapFinanceTransactionRow(row));
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, input.businessId))) {
        return null;
      }

      const { data, error } = await client
        .from('finance_transactions')
        .insert({
          business_id: input.businessId,
          trip_id: input.tripId ?? null,
          order_id: input.orderId ?? null,
          product_id: input.productId ?? null,
          description: input.description,
          amount: Number(input.amount ?? 0),
          type: input.type,
          payment_method: input.paymentMethod ?? 'bank',
          category: input.category ?? 'General',
          reference_id: input.referenceId ?? null,
        })
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapFinanceTransactionRow(data as any);
    },
    async update(id, businessId, input) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const payload: Record<string, string | number | null> = {};
      if (input.tripId !== undefined) payload.trip_id = input.tripId ?? null;
      if (input.orderId !== undefined) payload.order_id = input.orderId ?? null;
      if (input.productId !== undefined) payload.product_id = input.productId ?? null;
      if (input.description !== undefined) payload.description = input.description;
      if (input.amount !== undefined) payload.amount = Number(input.amount ?? 0);
      if (input.type !== undefined) payload.type = input.type;
      if (input.paymentMethod !== undefined) payload.payment_method = input.paymentMethod ?? 'bank';
      if (input.category !== undefined) payload.category = input.category ?? 'General';
      if (input.referenceId !== undefined) payload.reference_id = input.referenceId ?? null;

      if (Object.keys(payload).length === 0) {
        return null;
      }

      const { data, error } = await client
        .from('finance_transactions')
        .update(payload)
        .eq('id', id)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapFinanceTransactionRow(data as any);
    },
    async delete(id, businessId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return false;
      }

      const { error } = await client
        .from('finance_transactions')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);

      return !error;
    },
    async getTripSummary(businessId, tripId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return { salesRevenue: 0, costOfGoods: 0, grossProfit: 0, moneyIn: 0, moneyOut: 0, outstandingRevenue: 0, netProfit: 0 };
      }

      const [{ data: orderRows, error: ordersError }, { data: txRows, error: txError }] = await Promise.all([
        client.from('orders').select('total').eq('business_id', businessId).eq('trip_id', tripId),
        client.from('finance_transactions').select('*').eq('business_id', businessId).eq('trip_id', tripId),
      ]);

      if (ordersError || txError) {
        return { salesRevenue: 0, costOfGoods: 0, grossProfit: 0, moneyIn: 0, moneyOut: 0, outstandingRevenue: 0, netProfit: 0 };
      }

      const salesRevenue = (orderRows ?? []).reduce((total: number, row: any) => total + Number(row.total ?? 0), 0);
      let costOfGoods = 0;
      let moneyIn = 0;
      let moneyOut = 0;
      for (const row of txRows ?? []) {
        const amount = Number(row.amount ?? 0);
        if (String(row.type ?? '').toLowerCase() === 'income') {
          moneyIn += amount;
        } else {
          moneyOut += amount;
        }
        const category = String(row.category ?? '').toLowerCase();
        if (row.type === 'expense' && (category.includes('cogs') || category.includes('product cost') || category.includes('purchase') || category.includes('trip expense') || category.includes('cost'))) {
          costOfGoods += amount;
        }
      }

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
      const hasReference = typeof input.customerPaymentReference === 'string' && input.customerPaymentReference.trim().length > 0;
      const isDirectQr = (input.paymentMethod ?? input.provider ?? '').toString().toUpperCase() === 'DIRECT_QR' || (input.provider ?? '').toString().toLowerCase() === 'direct_qr';
      const nextStatus: PaymentRepositoryStatus = isDirectQr ? (hasProof || hasReference ? 'submitted' : 'pending') : (hasProof ? 'pending_verification' : 'pending');
      const { data, error } = await client.from('payments').insert({
        business_id: input.businessId,
        order_id: input.orderId,
        payment_method: input.paymentMethod ?? 'bank',
        amount: expectedAmount,
        payment_status: nextStatus,
        receipt_uri: input.receiptUri ?? null,
        customer_payment_reference: input.customerPaymentReference ?? null,
        payment_instructions_snapshot: input.paymentInstructionsSnapshot ?? null,
        payment_profile_id: input.paymentProfileId ?? null,
        idempotency_key: input.idempotencyKey ?? `${input.businessId}:${input.orderId}:${input.paymentMethod ?? 'bank'}`,
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
    async listPendingForBusiness(businessId) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client
        .from('payments')
        .select('*')
        .eq('business_id', businessId)
        .in('payment_status', ['submitted', 'pending_verification', 'rejected']);

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapPaymentRow(row));
    },
    async submitDirectQrPayment(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, input.businessId))) {
        return null;
      }

      const orderQuery = await client
        .from('orders')
        .select('id, business_id, total, payment_status, order_status, customer_id, customer_profile_id')
        .eq('id', input.orderId)
        .eq('business_id', input.businessId)
        .maybeSingle();

      if (orderQuery.error || !orderQuery.data) {
        return null;
      }

      const order = orderQuery.data as any;
      const expectedAmount = Number(input.amount ?? order.total ?? 0);
      if (Number(order.total ?? 0) > 0 && Math.abs(expectedAmount - Number(order.total)) > 0.01) {
        return null;
      }

      if (order.order_status === 'cancelled') {
        return null;
      }

      if (input.customerId && order.customer_id && order.customer_id !== input.customerId) {
        return null;
      }

      const existing = await client.from('payments').select('*').eq('order_id', input.orderId).eq('business_id', input.businessId).limit(1);
      if (!existing.error && existing.data && existing.data.length > 0) {
        const first = existing.data[0] as any;
        const currentStatus = String(first.payment_status ?? '').toLowerCase();
        if (['submitted', 'pending_verification', 'rejected'].includes(currentStatus)) {
          return mapPaymentRow(first);
        }
      }

      const paymentMethod = (input.paymentMethod ?? 'DIRECT_QR').toString().toUpperCase();
      const receiptUri = typeof input.receiptUri === 'string' && input.receiptUri.trim().length > 0 ? input.receiptUri : undefined;
      const customerPaymentReference = typeof input.customerPaymentReference === 'string' && input.customerPaymentReference.trim().length > 0 ? input.customerPaymentReference.trim() : undefined;
      const paymentInstructionsSnapshot = input.paymentInstructionsSnapshot ?? 'Direct QR payment instructions provided to the customer.';

      return this.create({
        businessId: input.businessId,
        orderId: input.orderId,
        amount: expectedAmount,
        currency: 'MYR',
        paymentMethod,
        provider: 'direct_qr',
        customerId: input.customerId,
        receiptUri,
        customerPaymentReference,
        paymentInstructionsSnapshot,
        paymentProfileId: input.paymentProfileId,
        idempotencyKey: input.idempotencyKey ?? `${input.businessId}:${input.orderId}:direct_qr`,
      });
    },
    async verifyDirectQrPayment(paymentId, businessId, verifiedBy, overrides = {}) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const payment = await this.getById(paymentId, businessId);
      if (!payment) {
        return null;
      }

      const orderQuery = await client
        .from('orders')
        .select('id, business_id, total, order_status, payment_status')
        .eq('id', payment.order_id)
        .eq('business_id', businessId)
        .maybeSingle();

      if (orderQuery.error || !orderQuery.data) {
        return null;
      }

      const order = orderQuery.data as any;
      const orderStatus = String(order.order_status ?? '').toLowerCase();
      if (orderStatus === 'cancelled') {
        return null;
      }

      const paymentMethod = String(payment.payment_method ?? '').toUpperCase();
      if (paymentMethod !== 'DIRECT_QR') {
        return null;
      }

      if (payment.payment_status && !['submitted', 'pending_verification', 'rejected'].includes(payment.payment_status.toLowerCase())) {
        return null;
      }

      const normalizedAmount = Number(payment.amount ?? 0);
      const orderAmount = Number(order.total ?? 0);
      if (orderAmount > 0 && Math.abs(normalizedAmount - orderAmount) > 0.01) {
        return null;
      }

      const verifiedUserId = verifiedBy || (await getUserIdFromAuth(client)) || undefined;
      if (!verifiedUserId) {
        return null;
      }

      const pendingVerification = await this.transition(paymentId, businessId, 'pending_verification', {
        verified: false,
        customerPaymentReference: payment.customer_payment_reference ?? undefined,
        receiptUri: payment.receipt_uri ?? undefined,
      });

      if (!pendingVerification) {
        return null;
      }

      const updated = await this.transition(paymentId, businessId, 'paid', {
        verified: true,
        verifiedBy: verifiedUserId,
        verificationEventId: overrides.verificationEventId ?? `verify-${paymentId}`,
      });

      if (!updated) {
        return null;
      }

      await client.from('orders').update({
        payment_status: 'paid',
        order_status: 'payment_received',
        payment_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', payment.order_id).eq('business_id', businessId);

      return updated;
    },
    async rejectDirectQrPayment(paymentId, businessId, rejectionReason, verifiedBy) {
      const client = getSupabaseClient();
      if (!client || !(await hasMembership(client, businessId))) {
        return null;
      }

      const payment = await this.getById(paymentId, businessId);
      if (!payment) {
        return null;
      }

      const normalizedReason = String(rejectionReason ?? '').trim();
      if (!normalizedReason) {
        return null;
      }

      const paymentMethod = String(payment.payment_method ?? '').toUpperCase();
      if (paymentMethod !== 'DIRECT_QR') {
        return null;
      }

      const updated = await this.transition(paymentId, businessId, 'rejected', {
        rejectionReason: normalizedReason,
        verified: false,
        verifiedBy: verifiedBy ?? undefined,
      });

      if (!updated) {
        return null;
      }

      return updated;
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
      const allowedStatuses: PaymentRepositoryStatus[] = ['pending', 'submitted', 'pending_verification', 'authorized', 'success', 'paid', 'partial', 'pay_later', 'rejected', 'failed', 'cancelled', 'refunded'];
      if (!allowedStatuses.includes(normalized)) {
        throw new Error(`Invalid payment transition: ${existing.payment_status} -> ${normalized}`);
      }

      if (!allowedStatuses.includes((existing.payment_status ?? 'pending') as PaymentRepositoryStatus)) {
        throw new Error(`Invalid payment transition: ${existing.payment_status} -> ${normalized}`);
      }

      const from = ((existing.payment_status ?? 'pending') as PaymentRepositoryStatus).toLowerCase() as PaymentRepositoryStatus;
      const validList: Record<PaymentRepositoryStatus, PaymentRepositoryStatus[]> = {
        pending: ['submitted', 'pending_verification', 'authorized', 'paid', 'failed', 'cancelled'],
        submitted: ['pending_verification', 'rejected', 'cancelled'],
        pending_verification: ['submitted', 'rejected', 'paid', 'failed', 'cancelled'],
        authorized: ['paid', 'failed', 'cancelled', 'refunded'],
        success: ['paid'],
        paid: ['refunded'],
        partial: ['paid', 'failed', 'cancelled'],
        pay_later: ['paid', 'failed', 'cancelled'],
        rejected: ['submitted', 'pending_verification', 'cancelled'],
        failed: [],
        cancelled: [],
        refunded: [],
      };

      if (from === normalized) {
        return existing;
      }

      if (normalized === 'paid' || normalized === 'success') {
        const serverVerified = overrides.verified === true || existing.verified === true || Boolean(overrides.callbackEventId || overrides.providerTransactionId);
        if (!serverVerified) {
          return null;
        }
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
        verified_at: overrides.verified === true ? new Date().toISOString() : (normalized === 'paid' || normalized === 'success') ? existing.verified_at ?? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      };

      if (overrides.verifiedBy) {
        payload.verified_by = overrides.verifiedBy;
      }

      if (overrides.customerPaymentReference) {
        payload.customer_payment_reference = overrides.customerPaymentReference;
      }

      if (overrides.rejectionReason) {
        payload.rejection_reason = overrides.rejectionReason;
      }

      if (overrides.paymentProfileId) {
        payload.payment_profile_id = overrides.paymentProfileId;
      }

      if (overrides.verificationEventId) {
        payload.verification_event_id = overrides.verificationEventId;
      }

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
