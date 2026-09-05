export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentProviderName = 'mock' | 'stripe' | 'fpx' | 'paynet';

export type PaymentAmountCurrency = 'MYR' | 'USD' | 'SGD' | 'IDR' | string;

export type PaymentRecord = {
  id: string;
  orderId: string;
  businessId: string;
  customerId?: string;
  subscriptionId?: string;
  amount: number;
  currency: PaymentAmountCurrency;
  provider: PaymentProviderName;
  providerReference?: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  idempotencyKey?: string;
  callbackEventId?: string;
  webhookVerified?: boolean;
  signatureValid?: boolean;
  financeReconciled?: boolean;
  metadata?: Record<string, string | number | boolean | undefined>;
  createdAt: string;
  updatedAt: string;
  authorizedAt?: string;
  paidAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  lastError?: string;
};

export type PaymentTransition = {
  from: PaymentStatus;
  to: PaymentStatus;
};

export type PaymentCreateInput = {
  id?: string;
  orderId: string;
  businessId: string;
  customerId?: string;
  amount: number;
  currency?: PaymentAmountCurrency;
  provider?: PaymentProviderName;
  subscriptionId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
};

export type PaymentWebhookEvent = {
  id: string;
  provider: PaymentProviderName;
  providerReference?: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  amount?: number;
  currency?: PaymentAmountCurrency;
  subscriptionId?: string;
  eventType?: string;
  occurredAt?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
  signature?: string;
  rawBody?: string;
};

export type PaymentSignatureInput = {
  payload: string | Record<string, unknown>;
  signature: string;
  secret?: string;
  provider?: PaymentProviderName;
};

export type PaymentFinanceReconciliation = {
  shouldReconcile: boolean;
  category: string;
  direction: 'income' | 'refund';
  amount: number;
  referenceId: string;
  subscriptionId?: string;
};

export type PaymentProviderAdapter = {
  name: PaymentProviderName;
  createPayment: (input: PaymentCreateInput) => Promise<PaymentRecord>;
  verifySignature: (input: PaymentSignatureInput) => Promise<boolean>;
  handleWebhook: (payment: PaymentRecord, event: PaymentWebhookEvent) => Promise<PaymentRecord>;
  refundPayment: (payment: PaymentRecord, reason?: string) => Promise<PaymentRecord>;
};

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['authorized', 'paid', 'failed', 'cancelled'],
  authorized: ['paid', 'failed', 'cancelled', 'refunded'],
  paid: ['refunded'],
  failed: [],
  cancelled: [],
  refunded: [],
};

const ALLOWED_FINAL_STATES = new Set<PaymentStatus>(['failed', 'cancelled', 'refunded']);

const processingCallbacks = new Map<string, Set<string>>();

function toIsoString(value?: string): string {
  return value ?? new Date().toISOString();
}

function safeJsonStringify(input: string | Record<string, unknown>) {
  if (typeof input === 'string') return input;
  return JSON.stringify(input);
}

async function computeHmac256Hex(payload: string, secret: string): Promise<string> {
  if (typeof globalThis.crypto !== 'undefined' && 'subtle' in globalThis.crypto) {
    const encoder = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  if (typeof require === 'function') {
    const { createHmac } = await import('node:crypto');
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  throw new Error('No compatible crypto implementation detected for signature verification');
}

export function normalizePaymentState(value?: string | null): PaymentStatus {
  const normalized = (value ?? '').trim().toLowerCase();

  if (normalized === 'pending') return 'pending';
  if (normalized === 'authorized') return 'authorized';
  if (normalized === 'paid') return 'paid';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'refunded') return 'refunded';

  return 'pending';
}

export function isValidPaymentTransition(currentState: string | PaymentStatus, nextState: string | PaymentStatus): boolean {
  const from = normalizePaymentState(currentState);
  const to = normalizePaymentState(nextState);

  if (from === to) {
    return true;
  }

  if (ALLOWED_FINAL_STATES.has(from)) {
    return false;
  }

  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function createPaymentRecord(input: PaymentCreateInput): PaymentRecord {
  const now = new Date().toISOString();
  const provider = input.provider ?? 'mock';
  const id = input.id ?? `pay_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    orderId: input.orderId,
    businessId: input.businessId,
    customerId: input.customerId,
    subscriptionId: input.subscriptionId,
    amount: Number(input.amount) || 0,
    currency: input.currency ?? 'MYR',
    provider,
    providerReference: `ref_${id}`,
    providerTransactionId: undefined,
    status: 'pending',
    idempotencyKey: input.idempotencyKey ?? `${input.orderId}:${id}`,
    metadata: input.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

export function applyPaymentTransition(
  payment: PaymentRecord,
  nextStatus: PaymentStatus | string,
  overrides: Partial<PaymentRecord> = {}
): PaymentRecord {
  const normalizedNext = normalizePaymentState(nextStatus);

  if (!isValidPaymentTransition(payment.status, normalizedNext)) {
    throw new Error(`Invalid payment transition: ${payment.status} -> ${normalizedNext}`);
  }

  const nextAt = new Date().toISOString();

  return {
    ...payment,
    status: normalizedNext,
    updatedAt: nextAt,
    authorizedAt: normalizedNext === 'authorized' ? nextAt : payment.authorizedAt,
    paidAt: normalizedNext === 'paid' ? nextAt : payment.paidAt,
    failedAt: normalizedNext === 'failed' ? nextAt : payment.failedAt,
    cancelledAt: normalizedNext === 'cancelled' ? nextAt : payment.cancelledAt,
    refundedAt: normalizedNext === 'refunded' ? nextAt : payment.refundedAt,
    metadata: {
      ...(payment.metadata ?? {}),
      ...(overrides.metadata ?? {}),
    },
    ...overrides,
  };
}

export async function verifyPaymentSignature({
  payload,
  signature,
  secret,
  provider = 'mock',
}: PaymentSignatureInput): Promise<boolean> {
  const normalizedSignature = (signature ?? '').trim();
  const normalizedSecret = (secret ?? '').trim();

  if (!normalizedSignature || !normalizedSecret) {
    return false;
  }

  const raw = safeJsonStringify(payload);
  const expected = await computeHmac256Hex(raw, normalizedSecret);
  const candidate = normalizedSignature.replace(/^sha256=/i, '');

  if (provider === 'mock') {
    return candidate === expected || candidate === normalizedSecret;
  }

  return candidate === expected;
}

export function isDuplicatePaymentCallback(payment: PaymentRecord, callbackEventId?: string): boolean {
  if (!callbackEventId) {
    return false;
  }

  const seen = processingCallbacks.get(payment.id) ?? new Set<string>();
  if (seen.has(callbackEventId)) {
    return true;
  }

  seen.add(callbackEventId);
  processingCallbacks.set(payment.id, seen);
  return false;
}

export function linkSubscriptionToPayment(
  payment: PaymentRecord,
  subscriptionId: string,
  plan?: string
): PaymentRecord {
  return {
    ...payment,
    subscriptionId,
    metadata: {
      ...(payment.metadata ?? {}),
      plan: plan ?? payment.metadata?.plan ?? 'unknown',
      subscriptionLinkedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function reconcileFinanceForPayment(payment: Partial<PaymentRecord>): PaymentFinanceReconciliation {
  const amount = Number(payment.amount ?? 0);
  const referenceId = payment.id ?? payment.providerReference ?? 'unlinked-payment';

  if (payment.status === 'paid') {
    return {
      shouldReconcile: true,
      category: 'Payment Received',
      direction: 'income',
      amount,
      referenceId,
      subscriptionId: payment.subscriptionId,
    };
  }

  if (payment.status === 'refunded') {
    return {
      shouldReconcile: true,
      category: 'Payment Refunded',
      direction: 'refund',
      amount,
      referenceId,
      subscriptionId: payment.subscriptionId,
    };
  }

  return {
    shouldReconcile: false,
    category: 'Payment Pending',
    direction: 'income',
    amount: 0,
    referenceId,
    subscriptionId: payment.subscriptionId,
  };
}

export async function handlePaymentWebhook(
  payment: PaymentRecord,
  event: PaymentWebhookEvent,
  secret?: string
): Promise<PaymentRecord & { duplicate?: boolean; signatureValid?: boolean; webhookVerified?: boolean; }> {
  const duplicate = isDuplicatePaymentCallback(payment, event.id);
  if (duplicate) {
    return {
      ...payment,
      callbackEventId: event.id,
      duplicate: true,
      signatureValid: false,
      webhookVerified: false,
    };
  }

  const signatureValid = event.signature
    ? await verifyPaymentSignature({
        payload: event.rawBody ?? event,
        signature: event.signature,
        secret,
        provider: event.provider,
      })
    : Boolean(!secret);

  if (!signatureValid) {
    return {
      ...payment,
      callbackEventId: event.id,
      signatureValid: false,
      webhookVerified: false,
      lastError: 'Invalid payment webhook signature',
    };
  }

  const nextStatus = normalizePaymentState(event.status);
  const updated = applyPaymentTransition(payment, nextStatus, {
    providerReference: event.providerReference ?? payment.providerReference,
    providerTransactionId: event.providerTransactionId ?? payment.providerTransactionId,
    callbackEventId: event.id,
    webhookVerified: true,
    signatureValid: true,
    metadata: {
      ...(payment.metadata ?? {}),
      ...(event.metadata ?? {}),
      providerEventType: event.eventType ?? 'webhook',
      providerTransactionId: event.providerTransactionId ?? payment.providerTransactionId,
      subscriptionId: event.subscriptionId ?? payment.subscriptionId,
      lastWebhookAt: toIsoString(event.occurredAt),
    },
  });

  return {
    ...updated,
    duplicate: false,
    signatureValid: true,
    webhookVerified: true,
  };
}

export function refundPaymentRecord(payment: PaymentRecord, reason = 'Refund requested'): PaymentRecord {
  const next = applyPaymentTransition(payment, 'refunded', {
    metadata: {
      ...(payment.metadata ?? {}),
      refundReason: reason,
    },
    lastError: undefined,
  });

  return {
    ...next,
    status: 'refunded',
    refundedAt: next.refundedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getMockPaymentProvider(): PaymentProviderAdapter {
  return {
    name: 'mock',
    createPayment: async (input) => {
      const payment = createPaymentRecord({
        ...input,
        provider: 'mock',
      });
      return payment;
    },
    verifySignature: async ({ payload, signature, secret }) => {
      return verifyPaymentSignature({
        payload,
        signature,
        secret,
        provider: 'mock',
      });
    },
    handleWebhook: async (payment, event) => {
      const withEvent = await handlePaymentWebhook(payment, event, 'mock-provider-secret');
      return withEvent as PaymentRecord;
    },
    refundPayment: async (payment, reason) => refundPaymentRecord(payment, reason),
  };
}

export function getPaymentProvider(name: PaymentProviderName = 'mock'): PaymentProviderAdapter {
  if (name === 'mock') {
    return getMockPaymentProvider();
  }

  return getMockPaymentProvider();
}
