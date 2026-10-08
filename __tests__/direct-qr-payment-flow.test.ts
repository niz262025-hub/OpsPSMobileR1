import { describe, expect, it, vi } from 'vitest';

import { getDataSource } from '../services/repository';
import { getSupabaseClient } from '../services/supabaseClient';

vi.mock('../services/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

function buildPaymentClient(input: { orders?: Array<Record<string, unknown>>; payments?: Array<Record<string, unknown>> } = {}) {
  const userId = 'customer-1';
  const memberships = [{ business_id: 'biz-1', user_id: userId, role: 'founder' }];
  const orders: Array<Record<string, unknown>> = [{
    id: 'order-1',
    business_id: 'biz-1',
    customer_id: 'customer-1',
    customer_profile_id: 'profile-1',
    total: 150,
    payment_status: 'pending',
    order_status: 'pending',
    created_at: '2026-09-05T00:00:00.000Z',
    updated_at: '2026-09-05T00:00:00.000Z',
  }, ...(input.orders ?? [])];
  const payments: Array<Record<string, unknown>> = [{
    id: 'pay-direct',
    business_id: 'biz-1',
    order_id: 'order-1',
    payment_method: 'DIRECT_QR',
    payment_status: 'submitted',
    status: 'submitted',
    amount: 150,
    currency: 'MYR',
    provider: 'direct_qr',
    verified: false,
    customer_id: 'customer-1',
    receipt_uri: 'https://cdn.example.test/qr-proof.png',
    customer_payment_reference: 'DuitNow-ABC123',
    created_at: '2026-09-05T00:00:00.000Z',
    updated_at: '2026-09-05T00:00:00.000Z',
  }, ...(input.payments ?? [])];

  const filterRows = (rows: Array<Record<string, unknown>>, filters: Array<[string, unknown]>) =>
    rows.filter((row) => filters.every(([field, value]) => row[field] === value));

  const buildTableQuery = (table: string, source: Array<Record<string, unknown>>) => {
    const filters: Array<[string, unknown]> = [];
    const builder: any = {
      select() { return builder; },
      eq(field: string, value: unknown) {
        filters.push([field, value]);
        return builder;
      },
      limit(count: number) {
        return Promise.resolve({ data: filterRows(source, filters).slice(0, count), error: null });
      },
      maybeSingle() {
        return Promise.resolve({ data: filterRows(source, filters)[0] ?? null, error: null });
      },
      single() {
        return Promise.resolve({ data: filterRows(source, filters)[0] ?? null, error: null });
      },
      insert(payload: Record<string, unknown>) {
        const next = { ...payload, id: `${table}-new-${Date.now()}` };
        source.push(next);
        return { select() { return { single: async () => ({ data: next, error: null }), maybeSingle: async () => ({ data: next, error: null }) }; }, single: async () => ({ data: next, error: null }), maybeSingle: async () => ({ data: next, error: null }) };
      },
      update(payload: Record<string, unknown>) {
        const matches = filterRows(source, filters);
        matches.forEach((row) => Object.assign(row, payload));
        const updateBuilder: any = {
          _scope: [...filters],
          eq(field: string, value: unknown) {
            updateBuilder._scope.push([field, value]);
            return updateBuilder;
          },
          select() {
            const scoped = filterRows(source, updateBuilder._scope);
            return {
              single: async () => ({ data: scoped[0] ?? matches[0] ?? null, error: null }),
              maybeSingle: async () => ({ data: scoped[0] ?? matches[0] ?? null, error: null }),
            };
          },
          single: async () => ({ data: filterRows(source, updateBuilder._scope)[0] ?? matches[0] ?? null, error: null }),
          maybeSingle: async () => ({ data: filterRows(source, updateBuilder._scope)[0] ?? matches[0] ?? null, error: null }),
        };
        return updateBuilder;
      },
    };
    return builder;
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })),
    },
    from: vi.fn((table: string) => buildTableQuery(table, {
      business_memberships: memberships,
      orders,
      payments,
      finance_transactions: [],
    }[table] ?? [])),
  } as any;
}

describe('direct qr payment flow', () => {
  it('submits payment proof without allowing customer-side paid transition', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildPaymentClient() as any);

    const repo = getDataSource('production');
    const created = await repo.payments.create({
      businessId: 'biz-1',
      orderId: 'order-1',
      amount: 150,
      currency: 'MYR',
      paymentMethod: 'DIRECT_QR',
      provider: 'direct_qr',
      customerId: 'customer-1',
      receiptUri: 'https://cdn.example.test/qr-proof.png',
      customerPaymentReference: 'DuitNow-ABC123',
    });

    expect(created?.payment_status).toBe('submitted');
    expect(created?.payment_method).toBe('DIRECT_QR');

    const updated = await repo.payments.transition(created!.id, 'biz-1', 'submitted', {
      customerPaymentReference: 'DuitNow-ABC123',
      receiptUri: 'https://cdn.example.test/qr-proof.png',
    });

    expect(updated?.status).toBe('submitted');
    expect(await repo.payments.transition(created!.id, 'biz-1', 'paid', { verified: false })).toBeNull();
  });

  it('allows business verification and rejects invalid proof for direct qr payments', async () => {
    const verifyClient = buildPaymentClient({
      orders: [{
        id: 'order-2',
        business_id: 'biz-1',
        customer_id: 'customer-2',
        customer_profile_id: 'profile-2',
        total: 80,
        payment_status: 'pending',
        order_status: 'pending',
        created_at: '2026-09-06T00:00:00.000Z',
        updated_at: '2026-09-06T00:00:00.000Z',
      }],
      payments: [{
        id: 'pay-direct',
        business_id: 'biz-1',
        order_id: 'order-2',
        payment_method: 'DIRECT_QR',
        payment_status: 'submitted',
        status: 'submitted',
        amount: 80,
        currency: 'MYR',
        provider: 'direct_qr',
        verified: false,
        customer_id: 'customer-2',
        receipt_uri: 'https://cdn.example.test/qr-proof-verify.png',
        customer_payment_reference: 'DuitNow-VERIFY',
        created_at: '2026-09-06T00:00:00.000Z',
        updated_at: '2026-09-06T00:00:00.000Z',
      }],
    });
    vi.mocked(getSupabaseClient).mockReturnValue(verifyClient as any);

    const repo = getDataSource('production');
    const verified = await repo.payments.verifyDirectQrPayment('pay-direct', 'biz-1', 'founder-1');
    expect(verified?.status).toBe('paid');
    expect(verified?.verified).toBe(true);

    const rejectClient = buildPaymentClient({
      orders: [{
        id: 'order-3',
        business_id: 'biz-1',
        customer_id: 'customer-3',
        customer_profile_id: 'profile-3',
        total: 40,
        payment_status: 'pending',
        order_status: 'pending',
        created_at: '2026-09-07T00:00:00.000Z',
        updated_at: '2026-09-07T00:00:00.000Z',
      }],
      payments: [{
        id: 'pay-reject',
        business_id: 'biz-1',
        order_id: 'order-3',
        payment_method: 'DIRECT_QR',
        payment_status: 'submitted',
        status: 'submitted',
        amount: 40,
        currency: 'MYR',
        provider: 'direct_qr',
        verified: false,
        customer_id: 'customer-3',
        receipt_uri: 'https://cdn.example.test/qr-proof-reject.png',
        customer_payment_reference: 'DuitNow-REJECT',
        created_at: '2026-09-07T00:00:00.000Z',
        updated_at: '2026-09-07T00:00:00.000Z',
      }],
    });
    vi.mocked(getSupabaseClient).mockReturnValue(rejectClient as any);

    const rejected = await repo.payments.rejectDirectQrPayment('pay-reject', 'biz-1', 'Incorrect QR proof', 'founder-1');
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.rejection_reason).toBe('Incorrect QR proof');
  });
});
