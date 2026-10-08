import { verifySandboxWebhookEventAsync } from '../../../services/paymentSandboxBoundary.ts';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json().catch(() => ({}));
    const signature = req.headers.get('x-provider-signature') ?? req.headers.get('stripe-signature') ?? '';
    const secret = Deno.env.get('PAYMENT_PROVIDER_WEBHOOK_SECRET') ?? '';

    if (!secret) {
      return jsonResponse(500, { ok: false, error: 'Webhook secret is not configured on the server.' });
    }

    const validation = await verifySandboxWebhookEventAsync({
      eventId: typeof payload.eventId === 'string' ? payload.eventId : '',
      provider: typeof payload.provider === 'string' ? payload.provider : 'stripe',
      providerReference: typeof payload.providerReference === 'string' ? payload.providerReference : undefined,
      providerPaymentId: typeof payload.providerPaymentId === 'string' ? payload.providerPaymentId : undefined,
      providerSessionId: typeof payload.providerSessionId === 'string' ? payload.providerSessionId : undefined,
      eventType: typeof payload.eventType === 'string' ? payload.eventType : undefined,
      status: typeof payload.status === 'string' ? payload.status : 'pending',
      amount: typeof payload.amount === 'number' ? payload.amount : Number(payload.amount ?? 0),
      currency: typeof payload.currency === 'string' ? payload.currency : 'MYR',
      businessId: typeof payload.businessId === 'string' ? payload.businessId : undefined,
      orderId: typeof payload.orderId === 'string' ? payload.orderId : undefined,
      signature,
      secret,
      seenEventIds: new Set<string>(),
      expectedBusinessId: typeof payload.expectedBusinessId === 'string' ? payload.expectedBusinessId : undefined,
      expectedOrderId: typeof payload.expectedOrderId === 'string' ? payload.expectedOrderId : undefined,
      expectedAmount: typeof payload.expectedAmount === 'number' ? payload.expectedAmount : Number(payload.expectedAmount ?? 0),
      expectedCurrency: typeof payload.expectedCurrency === 'string' ? payload.expectedCurrency : undefined,
    });

    if (!validation.ok) {
      return jsonResponse(400, { ok: false, error: validation.error ?? 'Webhook rejected.' });
    }

    return jsonResponse(200, {
      ok: true,
      eventId: validation.eventId,
      paymentStatus: validation.paymentStatus,
      orderId: validation.orderId,
      businessId: validation.businessId,
      amount: validation.amount,
      currency: validation.currency,
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected webhook error.',
    });
  }
});
