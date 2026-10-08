import { createSandboxCheckoutSession, getPaymentProvider, normalizePaymentState } from './payment';

export type SandboxPaymentServerRequest = {
  businessId: string;
  orderId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  idempotencyKey?: string;
  serverAuthUserId?: string | null;
  serverUserRole?: string | null;
  serverHasBusinessMembership?: boolean;
  serverOrderBusinessId?: string | null;
  serverOrderTotal?: number | null;
  serverOrderCurrency?: string | null;
  serverOrderStatus?: string | null;
  authUserId?: string | null;
  userRole?: string | null;
  hasBusinessMembership?: boolean;
  orderBusinessId?: string | null;
  orderTotal?: number | null;
  orderCurrency?: string | null;
  orderStatus?: string | null;
};

export type SandboxPaymentServerResult = {
  ok: boolean;
  checkoutSession?: {
    provider: 'stripe' | 'sandbox';
    checkoutSessionId: string;
    providerReference: string;
    status: 'created' | 'pending' | 'paid' | 'failed';
    checkoutUrl?: string;
    isSandbox: boolean;
  };
  error?: string;
};

export type SandboxWebhookValidationResult = {
  ok: boolean;
  eventId?: string;
  paymentStatus?: string;
  orderId?: string;
  businessId?: string;
  amount?: number;
  currency?: string;
  error?: string;
};

function asNumber(value: unknown, fallback = 0): number {
  const candidate = Number(value ?? fallback);
  return Number.isFinite(candidate) ? candidate : fallback;
}

export function buildSandboxWebhookPayload(input: {
  eventId: string;
  provider: string;
  providerReference?: string;
  providerPaymentId?: string;
  providerSessionId?: string;
  eventType?: string;
  status: string;
  amount?: number;
  currency?: string;
  businessId?: string;
  orderId?: string;
}): string {
  const normalizedStatus = normalizePaymentState(input.status);
  return JSON.stringify({
    eventId: input.eventId,
    provider: input.provider,
    providerReference: input.providerReference,
    providerPaymentId: input.providerPaymentId,
    providerSessionId: input.providerSessionId,
    eventType: input.eventType,
    status: normalizedStatus,
    amount: input.amount,
    currency: input.currency,
    businessId: input.businessId,
    orderId: input.orderId,
  });
}

export function validateSandboxPaymentRequest(input: SandboxPaymentServerRequest): { ok: true; value: SandboxPaymentServerRequest } | { ok: false; error: string } {
  const clientSuppliedTrustedFields = [
    input.authUserId,
    input.userRole,
    input.hasBusinessMembership,
    input.orderBusinessId,
    input.orderTotal,
    input.orderCurrency,
    input.orderStatus,
  ];

  if (clientSuppliedTrustedFields.some((value) => value !== undefined && value !== null)) {
    return { ok: false, error: 'Client-supplied auth/business/order values are not authoritative. Use server-side JWT/database values only.' };
  }

  if (!input.businessId || !input.orderId) {
    return { ok: false, error: 'Missing businessId or orderId.' };
  }

  const amount = asNumber(input.amount, 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Amount must be a positive number.' };
  }

  const serverAuthUserId = typeof input.serverAuthUserId === 'string' ? input.serverAuthUserId : '';
  if (!serverAuthUserId) {
    return { ok: false, error: 'Unauthenticated user.' };
  }

  const serverHasBusinessMembership = Boolean(input.serverHasBusinessMembership);
  if (!serverHasBusinessMembership) {
    return { ok: false, error: 'User does not belong to the target business.' };
  }

  if (input.serverOrderBusinessId && input.serverOrderBusinessId !== input.businessId) {
    return { ok: false, error: 'Order does not belong to the specified business.' };
  }

  const orderTotal = asNumber(input.serverOrderTotal, 0);
  if (orderTotal > 0 && Math.abs(orderTotal - amount) > 0.01) {
    return { ok: false, error: 'Payment amount does not match the order total.' };
  }

  const requestedCurrency = String(input.currency ?? 'MYR').trim().toUpperCase();
  const orderCurrency = String(input.serverOrderCurrency ?? requestedCurrency).trim().toUpperCase();
  if (orderCurrency && requestedCurrency && orderCurrency !== requestedCurrency) {
    return { ok: false, error: 'Currency mismatch between payment request and order.' };
  }

  if (input.serverOrderStatus && ['cancelled', 'failed', 'refunded'].includes(String(input.serverOrderStatus).toLowerCase())) {
    return { ok: false, error: 'Order is not in a payable state.' };
  }

  return {
    ok: true,
    value: {
      ...input,
      serverAuthUserId,
      serverHasBusinessMembership,
      currency: requestedCurrency || 'MYR',
    },
  };
}

export function createSandboxCheckoutSessionServer(input: SandboxPaymentServerRequest): SandboxPaymentServerResult {
  const validation = validateSandboxPaymentRequest(input);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const checkout = createSandboxCheckoutSession({
    orderId: validation.value.orderId,
    businessId: validation.value.businessId,
    amount: Number(validation.value.amount),
    currency: validation.value.currency ?? 'MYR',
    customerId: validation.value.customerId,
    provider: 'stripe',
    metadata: {
      businessId: validation.value.businessId,
      orderId: validation.value.orderId,
      customerId: validation.value.customerId ?? 'anonymous',
      authUserId: validation.value.serverAuthUserId ?? 'unknown',
      idempotencyKey: validation.value.idempotencyKey ?? `${validation.value.orderId}:${validation.value.businessId}`,
    },
  });

  const provider = checkout.provider === 'stripe' || checkout.provider === 'sandbox' ? checkout.provider : 'sandbox';

  return {
    ok: true,
    checkoutSession: {
      provider,
      checkoutSessionId: checkout.checkoutSessionId,
      providerReference: checkout.providerReference,
      status: checkout.status,
      checkoutUrl: checkout.checkoutUrl,
      isSandbox: checkout.isSandbox,
    },
  };
}

export async function verifySandboxWebhookEvent(input: {
  eventId: string;
  provider: string;
  providerReference?: string;
  providerPaymentId?: string;
  providerSessionId?: string;
  eventType?: string;
  status: string;
  amount?: number;
  currency?: string;
  businessId?: string;
  orderId?: string;
  signature?: string;
  secret?: string;
  seenEventIds?: Set<string>;
  expectedBusinessId?: string | null;
  expectedOrderId?: string | null;
  expectedAmount?: number | null;
  expectedCurrency?: string | null;
}): Promise<SandboxWebhookValidationResult> {
  return verifySandboxWebhookEventAsync(input);
}

export async function verifySandboxWebhookEventAsync(input: {
  eventId: string;
  provider: string;
  providerReference?: string;
  providerPaymentId?: string;
  providerSessionId?: string;
  eventType?: string;
  status: string;
  amount?: number;
  currency?: string;
  businessId?: string;
  orderId?: string;
  signature?: string;
  secret?: string;
  seenEventIds?: Set<string>;
  expectedBusinessId?: string | null;
  expectedOrderId?: string | null;
  expectedAmount?: number | null;
  expectedCurrency?: string | null;
  expectedProviderPaymentId?: string | null;
  expectedProviderSessionId?: string | null;
}): Promise<SandboxWebhookValidationResult> {
  return (async () => {
    const normalizedStatus = normalizePaymentState(input.status);
    const payload = buildSandboxWebhookPayload({
      eventId: input.eventId,
      provider: input.provider,
      providerReference: input.providerReference,
      providerPaymentId: input.providerPaymentId,
      providerSessionId: input.providerSessionId,
      eventType: input.eventType,
      status: input.status,
      amount: input.amount,
      currency: input.currency,
      businessId: input.businessId,
      orderId: input.orderId,
    });

    if (!input.eventId) {
      return { ok: false, error: 'Webhook missing event id.' };
    }

    if (input.seenEventIds && input.seenEventIds.has(input.eventId)) {
      return { ok: false, error: 'Duplicate webhook event id.' };
    }

    if (!input.secret || !input.signature) {
      return { ok: false, error: 'Missing webhook signature secret.' };
    }

    const provider = getPaymentProvider('stripe');
    const signatureValid = await provider.verifySignature({
      payload,
      signature: input.signature,
      secret: input.secret,
      provider: 'stripe',
    });

    if (!signatureValid) {
      return { ok: false, error: 'Invalid webhook signature.' };
    }

    if (input.expectedBusinessId && input.businessId && input.expectedBusinessId !== input.businessId) {
      return { ok: false, error: 'Webhook business mismatch.' };
    }

    if (input.expectedOrderId && input.orderId && input.expectedOrderId !== input.orderId) {
      return { ok: false, error: 'Webhook order mismatch.' };
    }

    const expectedAmount = asNumber(input.expectedAmount, 0);
    const resolvedAmount = asNumber(input.amount, 0);
    if (expectedAmount > 0 && Math.abs(expectedAmount - resolvedAmount) > 0.01) {
      return { ok: false, error: 'Webhook amount mismatch.' };
    }

    const expectedCurrency = String(input.expectedCurrency ?? 'MYR').trim().toUpperCase();
    const resolvedCurrency = String(input.currency ?? expectedCurrency).trim().toUpperCase();
    if (expectedCurrency && resolvedCurrency && expectedCurrency !== resolvedCurrency) {
      return { ok: false, error: 'Webhook currency mismatch.' };
    }

    return {
      ok: true,
      eventId: input.eventId,
      paymentStatus: normalizedStatus,
      orderId: input.orderId,
      businessId: input.businessId,
      amount: resolvedAmount,
      currency: resolvedCurrency,
    };
  })();
}

export function hasNoSecretInClientBundle(bundleText = ''): boolean {
  const text = String(bundleText || '');
  return !/(PAYMENT_PROVIDER_API_KEY|PAYMENT_PROVIDER_PRIVATE_KEY|PAYMENT_PROVIDER_WEBHOOK_SECRET|STRIPE_SECRET_KEY|sk_live|rk_live|pk_live)/i.test(text);
}
