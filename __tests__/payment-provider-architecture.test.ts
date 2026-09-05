import { describe, expect, it } from 'vitest';

import {
  applyPaymentTransition,
  createPaymentRecord,
  getMockPaymentProvider,
  handlePaymentWebhook,
  isDuplicatePaymentCallback,
  isValidPaymentTransition,
  linkSubscriptionToPayment,
  reconcileFinanceForPayment,
  refundPaymentRecord,
  verifyPaymentSignature,
} from '../services/payment';

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

describe('payment provider architecture', () => {
  it('allows a valid payment transition', () => {
    const payment = createPaymentRecord({
      orderId: 'order-1',
      businessId: 'business-1',
      amount: 100,
      provider: 'mock',
    });

    const updated = applyPaymentTransition(payment, 'authorized');
    expect(isValidPaymentTransition(payment.status, 'authorized')).toBe(true);
    expect(updated.status).toBe('authorized');
  });

  it('rejects an invalid transition', () => {
    const payment = createPaymentRecord({
      orderId: 'order-2',
      businessId: 'business-1',
      amount: 100,
      provider: 'mock',
    });

    expect(() => applyPaymentTransition(payment, 'refunded')).toThrow(/Invalid payment transition/i);
  });

  it('rejects invalid webhook signatures', async () => {
    const payment = createPaymentRecord({
      orderId: 'order-3',
      businessId: 'business-1',
      amount: 100,
      provider: 'mock',
    });

    const payload = JSON.stringify({ event: 'payment.paid', orderId: payment.orderId });
    const result = await handlePaymentWebhook(
      payment,
      {
        id: 'evt-invalid-sig',
        provider: 'mock',
        status: 'paid',
        providerReference: 'ref-123',
        providerTransactionId: 'txn-123',
        rawBody: payload,
        signature: 'sha256=wrong',
      },
      'mock-provider-secret'
    );

    expect(result.signatureValid).toBe(false);
    expect(result.webhookVerified).toBe(false);
  });

  it('protects against duplicate callbacks', async () => {
    const payment = createPaymentRecord({
      orderId: 'order-4',
      businessId: 'business-1',
      amount: 100,
      provider: 'mock',
    });

    const payload = JSON.stringify({ event: 'payment.paid', orderId: payment.orderId });
    const signature = await signPayload(payload, 'mock-provider-secret');

    const first = await handlePaymentWebhook(
      payment,
      {
        id: 'evt-dup-1',
        provider: 'mock',
        status: 'paid',
        providerReference: 'ref-456',
        providerTransactionId: 'txn-456',
        rawBody: payload,
        signature,
      },
      'mock-provider-secret'
    );

    const second = await handlePaymentWebhook(
      payment,
      {
        id: 'evt-dup-1',
        provider: 'mock',
        status: 'paid',
        providerReference: 'ref-456',
        providerTransactionId: 'txn-456',
        rawBody: payload,
        signature,
      },
      'mock-provider-secret'
    );

    expect(first.status).toBe('paid');
    expect(second.duplicate).toBe(true);
    expect(isDuplicatePaymentCallback(payment, 'evt-dup-1')).toBe(true);
  });

  it('handles refund transitions correctly', () => {
    const payment = createPaymentRecord({
      orderId: 'order-5',
      businessId: 'business-1',
      amount: 80,
      provider: 'mock',
    });

    const paid = applyPaymentTransition(payment, 'paid');
    const refunded = refundPaymentRecord(paid, 'customer requested refund');
    expect(refunded.status).toBe('refunded');
  });

  it('links subscription payments without pretending payment completion', () => {
    const payment = createPaymentRecord({
      orderId: 'order-6',
      businessId: 'business-1',
      amount: 49,
      provider: 'mock',
      subscriptionId: 'sub-1',
    });

    const linked = linkSubscriptionToPayment(payment, 'sub-1', 'standard-monthly');
    expect(linked.subscriptionId).toBe('sub-1');
    expect(linked.metadata?.plan).toBe('standard-monthly');
  });

  it('reconciles finance entries for paid and refunded payments', () => {
    const paid = reconcileFinanceForPayment({ id: 'pay-1', amount: 120, status: 'paid', subscriptionId: 'sub-1' });
    const refunded = reconcileFinanceForPayment({ id: 'pay-2', amount: 40, status: 'refunded', subscriptionId: 'sub-1' });

    expect(paid.shouldReconcile).toBe(true);
    expect(paid.direction).toBe('income');
    expect(refunded.shouldReconcile).toBe(true);
    expect(refunded.direction).toBe('refund');
  });

  it('keeps the mock provider compatible with the provider-agnostic interface', async () => {
    const provider = getMockPaymentProvider();
    const created = await provider.createPayment({
      orderId: 'order-7',
      businessId: 'business-1',
      amount: 99,
    });

    const payload = JSON.stringify({ event: 'payment.authorized', orderId: created.orderId });
    const signature = await signPayload(payload, 'mock-provider-secret');
    const verified = await verifyPaymentSignature({
      payload,
      signature,
      secret: 'mock-provider-secret',
      provider: 'mock',
    });

    expect(created.status).toBe('pending');
    expect(created.provider).toBe('mock');
    expect(verified).toBe(true);
  });
});
