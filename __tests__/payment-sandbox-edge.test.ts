import { describe, expect, it } from 'vitest';

import {
  buildSandboxWebhookPayload,
  createSandboxCheckoutSessionServer,
  hasNoSecretInClientBundle,
  validateSandboxPaymentRequest,
  verifySandboxWebhookEventAsync,
} from '../services/paymentSandboxBoundary';

async function signPayload(payload: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return `sha256=${Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`;
}

describe('sandbox payment backend boundary', () => {
  it('creates a valid sandbox checkout when the request is authorized and matches server-side order data', () => {
    const result = createSandboxCheckoutSessionServer({
      businessId: 'business-1',
      orderId: 'order-1',
      amount: 125,
      currency: 'MYR',
      serverAuthUserId: 'user-1',
      serverHasBusinessMembership: true,
      serverOrderBusinessId: 'business-1',
      serverOrderTotal: 125,
      serverOrderCurrency: 'MYR',
      serverOrderStatus: 'pending',
      idempotencyKey: 'checkout-1',
    });

    expect(result.ok).toBe(true);
    expect(result.checkoutSession?.provider).toBe('stripe');
    expect(result.checkoutSession?.status).toBe('created');
    expect(result.checkoutSession?.checkoutUrl).toContain('session=');
  });

  it('rejects forged client fields that claim a different membership or order state', () => {
    const result = validateSandboxPaymentRequest({
      businessId: 'business-1',
      orderId: 'order-2',
      amount: 50,
      currency: 'MYR',
      serverAuthUserId: 'user-1',
      serverHasBusinessMembership: true,
      serverOrderBusinessId: 'business-1',
      serverOrderTotal: 50,
      serverOrderCurrency: 'MYR',
      serverOrderStatus: 'pending',
      authUserId: 'malicious-user',
      hasBusinessMembership: true,
      orderBusinessId: 'business-2',
      orderTotal: 999,
      orderCurrency: 'USD',
      orderStatus: 'paid',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Client-supplied auth\/business\/order values are not authoritative/i);
    }
  });

  it('rejects order creation when the authenticated user is missing from the server-side JWT', () => {
    const result = validateSandboxPaymentRequest({
      businessId: 'business-1',
      orderId: 'order-2',
      amount: 50,
      currency: 'MYR',
      serverHasBusinessMembership: true,
      serverOrderBusinessId: 'business-1',
      serverOrderTotal: 50,
      serverOrderCurrency: 'MYR',
      serverOrderStatus: 'pending',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Unauthenticated user/i);
    }
  });

  it('rejects requests that do not belong to the target business', () => {
    const result = validateSandboxPaymentRequest({
      businessId: 'business-1',
      orderId: 'order-3',
      amount: 60,
      currency: 'MYR',
      serverAuthUserId: 'user-1',
      serverHasBusinessMembership: true,
      serverOrderBusinessId: 'business-2',
      serverOrderTotal: 60,
      serverOrderCurrency: 'MYR',
      serverOrderStatus: 'pending',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/business/i);
    }
  });

  it('rejects amount mismatch before checkout is created', () => {
    const result = validateSandboxPaymentRequest({
      businessId: 'business-1',
      orderId: 'order-4',
      amount: 100,
      currency: 'MYR',
      serverAuthUserId: 'user-1',
      serverHasBusinessMembership: true,
      serverOrderBusinessId: 'business-1',
      serverOrderTotal: 60,
      serverOrderCurrency: 'MYR',
      serverOrderStatus: 'pending',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/amount/i);
    }
  });

  it('rejects currency mismatches before checkout is created', () => {
    const result = validateSandboxPaymentRequest({
      businessId: 'business-1',
      orderId: 'order-5',
      amount: 80,
      currency: 'MYR',
      serverAuthUserId: 'user-1',
      serverHasBusinessMembership: true,
      serverOrderBusinessId: 'business-1',
      serverOrderTotal: 80,
      serverOrderCurrency: 'USD',
      serverOrderStatus: 'pending',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/currency/i);
    }
  });

  it('rejects a missing or invalid webhook signature', async () => {
    const validation = await verifySandboxWebhookEventAsync({
      eventId: 'evt-invalid-sig',
      provider: 'stripe',
      providerReference: 'ref_123',
      providerPaymentId: 'pay_123',
      providerSessionId: 'cs_123',
      eventType: 'checkout.session.completed',
      status: 'paid',
      amount: 100,
      currency: 'MYR',
      businessId: 'business-1',
      orderId: 'order-10',
      signature: 'sha256=wrong',
      secret: 'sandbox-webhook-secret',
      expectedBusinessId: 'business-1',
      expectedOrderId: 'order-10',
      expectedAmount: 100,
      expectedCurrency: 'MYR',
    });

    expect(validation.ok).toBe(false);
    expect(validation.error).toMatch(/signature/i);
  });

  it('accepts a valid webhook signature and payload', async () => {
    const payload = buildSandboxWebhookPayload({
      eventId: 'evt-valid',
      provider: 'stripe',
      providerReference: 'ref_456',
      providerPaymentId: 'pay_456',
      providerSessionId: 'cs_456',
      eventType: 'checkout.session.completed',
      status: 'paid',
      amount: 150,
      currency: 'MYR',
      businessId: 'business-1',
      orderId: 'order-11',
    });
    const signature = await signPayload(payload, 'sandbox-webhook-secret');

    const validation = await verifySandboxWebhookEventAsync({
      eventId: 'evt-valid',
      provider: 'stripe',
      providerReference: 'ref_456',
      providerPaymentId: 'pay_456',
      providerSessionId: 'cs_456',
      eventType: 'checkout.session.completed',
      status: 'paid',
      amount: 150,
      currency: 'MYR',
      businessId: 'business-1',
      orderId: 'order-11',
      signature,
      secret: 'sandbox-webhook-secret',
      expectedBusinessId: 'business-1',
      expectedOrderId: 'order-11',
      expectedAmount: 150,
      expectedCurrency: 'MYR',
    });

    expect(validation.ok).toBe(true);
    expect(validation.paymentStatus).toBe('paid');
    expect(validation.orderId).toBe('order-11');
  });

  it('rejects duplicate webhook events', async () => {
    const payload = buildSandboxWebhookPayload({
      eventId: 'evt-duplicate',
      provider: 'stripe',
      eventType: 'checkout.session.completed',
      status: 'paid',
      amount: 80,
      currency: 'MYR',
      businessId: 'business-1',
      orderId: 'order-12',
    });
    const signature = await signPayload(payload, 'sandbox-webhook-secret');

    const first = await verifySandboxWebhookEventAsync({
      eventId: 'evt-duplicate',
      provider: 'stripe',
      eventType: 'checkout.session.completed',
      status: 'paid',
      amount: 80,
      currency: 'MYR',
      businessId: 'business-1',
      orderId: 'order-12',
      signature,
      secret: 'sandbox-webhook-secret',
      seenEventIds: new Set<string>(),
      expectedBusinessId: 'business-1',
      expectedOrderId: 'order-12',
      expectedAmount: 80,
      expectedCurrency: 'MYR',
    });

    const second = await verifySandboxWebhookEventAsync({
      eventId: 'evt-duplicate',
      provider: 'stripe',
      eventType: 'checkout.session.completed',
      status: 'paid',
      amount: 80,
      currency: 'MYR',
      businessId: 'business-1',
      orderId: 'order-12',
      signature,
      secret: 'sandbox-webhook-secret',
      seenEventIds: new Set<string>(['evt-duplicate']),
      expectedBusinessId: 'business-1',
      expectedOrderId: 'order-12',
      expectedAmount: 80,
      expectedCurrency: 'MYR',
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/Duplicate webhook event id/i);
  });

  it('does not allow provider secrets or service-role material in the client bundle', () => {
    expect(hasNoSecretInClientBundle('EXPO_PUBLIC_PAYMENT_PROVIDER_API_KEY')).toBe(false);
    expect(hasNoSecretInClientBundle('PAYMENT_PROVIDER_WEBHOOK_SECRET')).toBe(false);
    expect(hasNoSecretInClientBundle('{}')).toBe(true);
  });
});
