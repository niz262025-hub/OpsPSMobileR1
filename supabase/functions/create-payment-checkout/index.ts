import { createSandboxCheckoutSessionServer } from '../../../services/paymentSandboxBoundary.ts';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function extractJwtUserId(authHeader: string): string | null {
  const header = authHeader.trim();
  if (!header.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length).trim();
  const payloadSegment = token.split('.')[1];
  if (!payloadSegment) return null;

  try {
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    const payload = JSON.parse(decoded);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const serverAuthUserId = extractJwtUserId(authHeader);
    if (!serverAuthUserId) {
      return jsonResponse(401, { ok: false, error: 'Authentication required.' });
    }

    const payload = await req.json().catch(() => ({}));
    const request = {
      businessId: typeof payload.businessId === 'string' ? payload.businessId : '',
      orderId: typeof payload.orderId === 'string' ? payload.orderId : '',
      amount: typeof payload.amount === 'number' ? payload.amount : Number(payload.amount ?? 0),
      currency: typeof payload.currency === 'string' ? payload.currency : 'MYR',
      customerId: typeof payload.customerId === 'string' ? payload.customerId : undefined,
      idempotencyKey: typeof payload.idempotencyKey === 'string' ? payload.idempotencyKey : undefined,
      serverAuthUserId,
      serverUserRole: null,
      serverHasBusinessMembership: true,
      serverOrderBusinessId: null,
      serverOrderTotal: typeof payload.orderTotal === 'number' ? payload.orderTotal : Number(payload.orderTotal ?? 0),
      serverOrderCurrency: typeof payload.orderCurrency === 'string' ? payload.orderCurrency : null,
      serverOrderStatus: typeof payload.orderStatus === 'string' ? payload.orderStatus : null,
      authUserId: undefined,
      userRole: undefined,
      hasBusinessMembership: undefined,
      orderBusinessId: undefined,
      orderTotal: undefined,
      orderCurrency: undefined,
      orderStatus: undefined,
    };

    const validation = createSandboxCheckoutSessionServer(request);
    if (!validation.ok || !validation.checkoutSession) {
      return jsonResponse(400, { ok: false, error: validation.error ?? 'Checkout request rejected.' });
    }

    return jsonResponse(200, {
      ok: true,
      provider: validation.checkoutSession.provider,
      checkoutSessionId: validation.checkoutSession.checkoutSessionId,
      providerReference: validation.checkoutSession.providerReference,
      status: validation.checkoutSession.status,
      checkoutUrl: validation.checkoutSession.checkoutUrl,
      isSandbox: validation.checkoutSession.isSandbox,
    });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected checkout error.',
    });
  }
});