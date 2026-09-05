export type ShippingProviderName = 'mock' | 'easyparcel';

export type ShipmentStatus =
  | 'pending'
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export type ShippingAddress = {
  name: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
};

export type ParcelDetails = {
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
};

export type ShipmentRecord = {
  id: string;
  orderId: string;
  businessId: string;
  recipient: ShippingAddress;
  parcel: ParcelDetails;
  courier?: string;
  provider: ShippingProviderName;
  trackingNumber?: string;
  providerReference?: string;
  status: ShipmentStatus;
  idempotencyKey: string;
  shippingCost?: number;
  currency: string;
  webhookEventIds: string[];
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  lastError?: string;
};

export type ShipmentCreateInput = {
  id?: string;
  orderId: string;
  businessId: string;
  recipient: ShippingAddress;
  parcel: ParcelDetails;
  courier?: string;
  provider?: ShippingProviderName;
  idempotencyKey?: string;
  shippingCost?: number;
  currency?: string;
};

export type ShipmentProviderCreateInput = Omit<ShipmentCreateInput, 'id' | 'provider'>;

export type ShipmentProviderResult = {
  trackingNumber?: string;
  providerReference: string;
  status?: ShipmentStatus;
};

export type ShipmentWebhookEvent = {
  id: string;
  provider: ShippingProviderName;
  status: ShipmentStatus | string;
  trackingNumber?: string;
  providerReference?: string;
  occurredAt?: string;
  error?: string;
};

export type ShippingProviderAdapter = {
  name: ShippingProviderName;
  createShipment: (input: ShipmentProviderCreateInput) => Promise<ShipmentProviderResult>;
};

export type ShipmentFinanceLink = {
  shouldReconcile: boolean;
  direction: 'expense';
  category: 'shipping';
  amount: number;
  currency: string;
  referenceId: string;
  orderId: string;
};

export type ShipmentWebhookResult = {
  shipment: ShipmentRecord;
  duplicate: boolean;
};

const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['created', 'failed', 'cancelled'],
  created: ['picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
  picked_up: ['in_transit', 'out_for_delivery', 'failed'],
  in_transit: ['out_for_delivery', 'delivered', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: [],
  failed: [],
  cancelled: [],
};

const FINAL_STATUSES = new Set<ShipmentStatus>(['delivered', 'failed', 'cancelled']);

function now(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStatus(value: string | ShipmentStatus): ShipmentStatus {
  const normalized = value.trim().toLowerCase().replace(/[- ]/g, '_');
  if (normalized === 'pending') return 'pending';
  if (normalized === 'created' || normalized === 'booked') return 'created';
  if (normalized === 'picked_up' || normalized === 'pickedup') return 'picked_up';
  if (normalized === 'in_transit' || normalized === 'transit') return 'in_transit';
  if (normalized === 'out_for_delivery' || normalized === 'outfordelivery') return 'out_for_delivery';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  throw new Error(`Unknown shipment status: ${value}`);
}

export function isValidShipmentTransition(current: ShipmentStatus | string, next: ShipmentStatus | string): boolean {
  const from = normalizeStatus(current);
  const to = normalizeStatus(next);
  return from === to || (!FINAL_STATUSES.has(from) && VALID_TRANSITIONS[from].includes(to));
}

function validateCreateInput(input: ShipmentCreateInput): void {
  if (!input.orderId.trim()) throw new Error('Shipment orderId is required');
  if (!input.businessId.trim()) throw new Error('Shipment businessId is required');
  if (!input.recipient.name.trim() || !input.recipient.address1.trim() || !input.recipient.city.trim() || !input.recipient.postcode.trim() || !input.recipient.country.trim()) {
    throw new Error('Shipment recipient details are incomplete');
  }
  if (!Number.isFinite(input.parcel.weightKg) || input.parcel.weightKg <= 0) {
    throw new Error('Shipment weight must be greater than zero');
  }
  if (input.shippingCost !== undefined && (!Number.isFinite(input.shippingCost) || input.shippingCost < 0)) {
    throw new Error('Shipment shippingCost must be zero or greater');
  }
}

export function createShipmentRecord(input: ShipmentCreateInput, providerResult: ShipmentProviderResult): ShipmentRecord {
  validateCreateInput(input);
  const timestamp = now();
  const status = providerResult.status ? normalizeStatus(providerResult.status) : 'created';
  if (status !== 'created' && status !== 'pending') {
    throw new Error(`Provider cannot create shipment in ${status} status`);
  }

  return {
    id: input.id ?? makeId('ship'),
    orderId: input.orderId,
    businessId: input.businessId,
    recipient: input.recipient,
    parcel: input.parcel,
    courier: input.courier,
    provider: input.provider ?? 'mock',
    trackingNumber: providerResult.trackingNumber,
    providerReference: providerResult.providerReference,
    status,
    idempotencyKey: input.idempotencyKey ?? `${input.orderId}:${input.provider ?? 'mock'}`,
    shippingCost: input.shippingCost,
    currency: input.currency ?? 'MYR',
    webhookEventIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function applyShipmentTransition(shipment: ShipmentRecord, nextStatus: ShipmentStatus | string, overrides: Partial<ShipmentRecord> = {}): ShipmentRecord {
  const normalizedNext = normalizeStatus(nextStatus);
  if (!isValidShipmentTransition(shipment.status, normalizedNext)) {
    throw new Error(`Invalid shipment transition: ${shipment.status} -> ${normalizedNext}`);
  }
  const timestamp = now();
  return {
    ...shipment,
    ...overrides,
    status: normalizedNext,
    updatedAt: timestamp,
    deliveredAt: normalizedNext === 'delivered' ? timestamp : shipment.deliveredAt,
  };
}

export function createShippingService(provider: ShippingProviderAdapter) {
  const shipments = new Map<string, ShipmentRecord>();

  return {
    async createShipment(input: ShipmentCreateInput): Promise<ShipmentRecord> {
      if (input.provider && input.provider !== provider.name) {
        throw new Error(`Provider mismatch: ${input.provider} adapter cannot create ${provider.name} shipment`);
      }
      validateCreateInput(input);
      const idempotencyKey = input.idempotencyKey ?? `${input.orderId}:${provider.name}`;
      const existing = [...shipments.values()].find((shipment) => shipment.idempotencyKey === idempotencyKey);
      if (existing) return existing;
      const created = createShipmentRecord({ ...input, provider: provider.name, idempotencyKey }, await provider.createShipment({ ...input, idempotencyKey }));
      shipments.set(created.id, created);
      return created;
    },

    getShipment(id: string): ShipmentRecord | undefined {
      return shipments.get(id);
    },

    getShipmentsForOrder(orderId: string): ShipmentRecord[] {
      return [...shipments.values()].filter((shipment) => shipment.orderId === orderId);
    },

    handleWebhook(shipmentId: string, event: ShipmentWebhookEvent): ShipmentWebhookResult {
      const shipment = shipments.get(shipmentId);
      if (!shipment) throw new Error(`Shipment not found: ${shipmentId}`);
      if (event.provider !== shipment.provider) throw new Error('Shipment webhook provider mismatch');
      if (shipment.webhookEventIds.includes(event.id)) return { shipment, duplicate: true };
      if (event.providerReference && shipment.providerReference && event.providerReference !== shipment.providerReference) {
        throw new Error('Shipment webhook provider reference mismatch');
      }
      if (event.trackingNumber && shipment.trackingNumber && event.trackingNumber !== shipment.trackingNumber) {
        throw new Error('Shipment webhook tracking number mismatch');
      }
      const updated = applyShipmentTransition(shipment, event.status, {
        trackingNumber: event.trackingNumber ?? shipment.trackingNumber,
        providerReference: event.providerReference ?? shipment.providerReference,
        lastError: event.error,
        webhookEventIds: [...shipment.webhookEventIds, event.id],
      });
      shipments.set(updated.id, updated);
      return { shipment: updated, duplicate: false };
    },
  };
}

export function getMockShippingProvider(): ShippingProviderAdapter {
  return {
    name: 'mock',
    async createShipment(input) {
      const reference = makeId('mock_ref');
      return {
        providerReference: reference,
        trackingNumber: `MOCK-${reference.slice(-8).toUpperCase()}`,
        status: 'created',
      };
    },
  };
}

export function getEasyParcelProvider(): ShippingProviderAdapter {
  return {
    name: 'easyparcel',
    async createShipment() {
      throw new Error('EasyParcel provider is not connected: credentials and live API integration are required');
    },
  };
}

export function reconcileFinanceForShipment(shipment: ShipmentRecord): ShipmentFinanceLink {
  const amount = shipment.shippingCost ?? 0;
  return {
    shouldReconcile: amount > 0 && shipment.status !== 'cancelled' && shipment.status !== 'failed',
    direction: 'expense',
    category: 'shipping',
    amount,
    currency: shipment.currency,
    referenceId: shipment.id,
    orderId: shipment.orderId,
  };
}