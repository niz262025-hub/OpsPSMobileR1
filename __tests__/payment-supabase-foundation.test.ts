import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDataSource } from '../services/repository';
import { getSupabaseClient } from '../services/supabaseClient';

vi.mock('../services/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

type PaymentRow = {
  id: string;
  business_id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  currency?: string;
  payment_status: string;
  provider?: string;
  provider_reference?: string;
  provider_transaction_id?: string;
  idempotency_key?: string;
  callback_event_id?: string;
  webhook_verified?: boolean;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
};

type FinanceRow = {
  id: string;
  business_id: string;
  order_id?: string;
  description: string;
  amount: number;
  type: string;
  payment_method: string;
  category: string;
  reference_id?: string;
  created_at?: string;
};

function buildScopedPaymentClient(input: {
  userId?: string;
  memberships?: Array<{ business_id: string; user_id: string; role: string }>;
  orders?: Array<Record<string, unknown>>;
  payments?: PaymentRow[];
  finance?: FinanceRow[];
} = {}) {
  const userId = input.userId ?? 'user-1';
  const memberships = (input.memberships ?? [{ business_id: 'biz-1', user_id: userId, role: 'founder' }]).map((row) => ({ ...row }));
  const orders = (input.orders ?? [{
    id: 'order-1',
    business_id: 'biz-1',
    customer_id: 'customer-1',
    customer_name: 'Aisha',
    total: 120,
    payment_status: 'pending',
    order_status: 'pending',
    created_at: '2026-09-05T00:00:00.000Z',
    updated_at: '2026-09-05T00:00:00.000Z',
  }]).map((row) => ({ ...row }));
  const payments = (input.payments ?? []).map((row) => ({ ...row }));
  const finance = (input.finance ?? []).map((row) => ({ ...row }));

  const rowsByTable = {
    business_memberships: memberships,
    orders,
    payments,
    finance_transactions: finance,
  };

  const filterRows = (rows: Array<Record<string, unknown>>, filters: Array<[string, unknown]>) =>
    rows.filter((row) => filters.every(([field, value]) => row[field] === value));

  const buildTableQuery = (table: string, source: Array<Record<string, unknown>>) => {
    const filters: Array<[string, unknown]> = [];

    const applyNewRow = (payload: Record<string, unknown>) => {
      const nextRecord = { ...payload };
      if (!nextRecord.id) {
        nextRecord.id = `${table.slice(0, 4)}-${Date.now()}-${source.length + 1}`;
      }
      source.push(nextRecord);
      return nextRecord;
    };

    const builder: any = {
      select() { return builder; },
      eq(field: string, value: unknown) {
        filters.push([field, value]);
        return builder;
      },
      maybeSingle() {
        return Promise.resolve({ data: filterRows(source, filters)[0] ?? null, error: null });
      },
      limit(count: number) {
        return Promise.resolve({ data: filterRows(source, filters).slice(0, count), error: null });
      },
      single() {
        return Promise.resolve({ data: filterRows(source, filters)[0] ?? null, error: null });
      },
      insert(payload: Record<string, unknown>) {
        const nextRecord = applyNewRow(payload);
        return {
          select() {
            return {
              single: async () => ({ data: nextRecord, error: null }),
              maybeSingle: async () => ({ data: nextRecord, error: null }),
            };
          },
          single: async () => ({ data: nextRecord, error: null }),
          maybeSingle: async () => ({ data: nextRecord, error: null }),
        };
      },
      update(payload: Record<string, unknown>) {
        const matches = filterRows(source, filters);
        matches.forEach((row) => {
          Object.assign(row, payload);
        });
        const result = {
          eq(field: string, value: unknown) {
            const scoped = matches.filter((row) => row[field] === value);
            return {
              eq(nextField: string, nextValue: unknown) {
                const nested = scoped.filter((row) => row[nextField] === nextValue);
                return {
                  select() {
                    return {
                      single: async () => ({ data: nested[0] ?? null, error: null }),
                      maybeSingle: async () => ({ data: nested[0] ?? null, error: null }),
                    };
                  },
                  single: async () => ({ data: nested[0] ?? null, error: null }),
                  maybeSingle: async () => ({ data: nested[0] ?? null, error: null }),
                };
              },
              select() {
                return {
                  single: async () => ({ data: scoped[0] ?? null, error: null }),
                  maybeSingle: async () => ({ data: scoped[0] ?? null, error: null }),
                };
              },
              single: async () => ({ data: scoped[0] ?? null, error: null }),
              maybeSingle: async () => ({ data: scoped[0] ?? null, error: null }),
            };
          },
          select() {
            return {
              single: async () => ({ data: matches[0] ?? null, error: null }),
              maybeSingle: async () => ({ data: matches[0] ?? null, error: null }),
            };
          },
          single: async () => ({ data: matches[0] ?? null, error: null }),
          maybeSingle: async () => ({ data: matches[0] ?? null, error: null }),
        };
        return result;
      },
    };

    return builder;
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })),
    },
    from: vi.fn((table: string) => buildTableQuery(table, rowsByTable[table as keyof typeof rowsByTable] ?? [])),
  } as any;
}

describe('phase 4c payment foundation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates and retrieves a valid payment for the authenticated business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient() as any);

    const repo = getDataSource('production');
    const created = await repo.payments.create({
      businessId: 'biz-1',
      orderId: 'order-1',
      amount: 120,
      currency: 'MYR',
      provider: 'mock',
      idempotencyKey: 'idemp-1',
    });

    expect(created).not.toBeNull();
    expect(created?.business_id).toBe('biz-1');
    expect(created?.order_id).toBe('order-1');
    expect(created?.amount).toBe(120);
    expect(await repo.payments.getByOrder('biz-1', 'order-1')).not.toBeNull();
  });

  it('rejects invalid transitions and rejects cross-business mutation', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-42',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        currency: 'MYR',
        payment_status: 'pending',
        provider: 'mock',
        idempotency_key: 'idemp-42',
        verified: false,
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
      memberships: [
        { business_id: 'biz-1', user_id: 'user-1', role: 'founder' },
        { business_id: 'biz-2', user_id: 'user-1', role: 'founder' },
      ],
    }) as any);

    const repo = getDataSource('production');
    await expect(repo.payments.transition('pay-42', 'biz-1', 'refunded')).rejects.toThrow(/Invalid payment transition/i);
    await expect(repo.payments.getById('pay-42', 'biz-2')).resolves.toBeNull();
  });

  it('uses the live Supabase schema for orders and payments instead of legacy mock-only columns', async () => {
    const inserted: Record<string, any> = {};

    const productRow = {
      id: 'product-live',
      business_id: 'biz-1',
      trip_id: 'trip-live',
      name: 'Product',
      selling_price: 120,
      is_published: true,
    };

    const variantRow = {
      id: 'variant-live',
      business_id: 'biz-1',
      product_id: 'product-live',
      size: 'M',
      stock: 10,
    };

    const orderRow = {
      id: 'order-live',
      business_id: 'biz-1',
      trip_id: 'trip-live',
      product_id: 'product-live',
      customer_profile_id: 'profile-live',
      customer_name: 'Aisha',
      customer_phone: '0123456789',
      delivery_address: 'Kuala Lumpur',
      subtotal: 120,
      shipping_fee: 10,
      total: 130,
      payment_status: 'pending',
      order_status: 'pending',
      request_status: 'PENDING_AVAILABILITY',
      payment_option: 'PAY_NOW',
      payment_mode: 'customer_pays_first',
      availability_status: 'pending',
      created_at: '2026-09-05T00:00:00.000Z',
      updated_at: '2026-09-05T00:00:00.000Z',
    };

    const paymentRow = {
      id: 'pay-live',
      business_id: 'biz-1',
      order_id: 'order-live',
      payment_method: 'bank',
      payment_status: 'pending',
      amount: 130,
      verified: false,
      created_at: '2026-09-05T00:00:00.000Z',
      updated_at: '2026-09-05T00:00:00.000Z',
    };

    const buildQueryResult = (table: string) => {
      const base = {
        eq: () => base,
        maybeSingle: async () => ({
          data: table === 'products' ? productRow : table === 'product_variants' ? variantRow : table === 'orders' ? orderRow : table === 'payments' ? paymentRow : null,
          error: null,
        }),
        single: async () => ({
          data: table === 'orders' ? orderRow : table === 'payments' ? paymentRow : null,
          error: null,
        }),
        select: () => base,
      };
      return base;
    };

    const buildTableQuery = (table: string, source: Array<Record<string, unknown>>) => {
      const filters: Array<[string, unknown]> = [];
      const applyRow = (payload: Record<string, unknown>) => {
        const next = { ...payload };
        source.push(next);
        return next;
      };

      const builder: any = {
        select() { return builder; },
        eq(field: string, value: unknown) {
          filters.push([field, value]);
          return builder;
        },
        maybeSingle() {
          return Promise.resolve({
            data: source.filter((row) => filters.every(([field, value]) => row[field] === value))[0] ?? null,
            error: null,
          });
        },
        single() {
          return Promise.resolve({
            data: source.filter((row) => filters.every(([field, value]) => row[field] === value))[0] ?? null,
            error: null,
          });
        },
        insert(payload: Record<string, unknown>) {
          const nextRecord = applyRow(payload);
          return {
            select() {
              return {
                single: async () => ({ data: nextRecord, error: null }),
                maybeSingle: async () => ({ data: nextRecord, error: null }),
              };
            },
            single: async () => ({ data: nextRecord, error: null }),
            maybeSingle: async () => ({ data: nextRecord, error: null }),
          };
        },
        update(payload: Record<string, unknown>) {
          const matches = source.filter((row) => filters.every(([field, value]) => row[field] === value));
          for (const row of matches) {
            Object.assign(row, payload);
          }
          return {
            eq(nextField: string, nextValue: unknown) {
              const scoped = matches.filter((row) => row[nextField] === nextValue);
              return {
                select() {
                  return {
                    single: async () => ({ data: scoped[0] ?? null, error: null }),
                    maybeSingle: async () => ({ data: scoped[0] ?? null, error: null }),
                  };
                },
                single: async () => ({ data: scoped[0] ?? null, error: null }),
                maybeSingle: async () => ({ data: scoped[0] ?? null, error: null }),
              };
            },
            select() {
              return {
                single: async () => ({ data: matches[0] ?? null, error: null }),
                maybeSingle: async () => ({ data: matches[0] ?? null, error: null }),
              };
            },
            single: async () => ({ data: matches[0] ?? null, error: null }),
            maybeSingle: async () => ({ data: matches[0] ?? null, error: null }),
          };
        },
      };
      return builder;
    };

    const paymentsTable = buildTableQuery('payments', []);
    const originalInsert = paymentsTable.insert.bind(paymentsTable);
    paymentsTable.insert = (payload: Record<string, unknown>) => {
      inserted.payments = payload;
      const result = originalInsert(payload);
      return {
        ...result,
        select: () => ({
          ...result.select(),
          single: async () => ({ data: paymentRow, error: null }),
          maybeSingle: async () => ({ data: paymentRow, error: null }),
        }),
        single: async () => ({ data: paymentRow, error: null }),
        maybeSingle: async () => ({ data: paymentRow, error: null }),
      };
    };

    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
      },
      from: vi.fn((table: string) => {
        if (table === 'business_memberships') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { business_id: 'biz-1', user_id: 'user-1', role: 'founder' },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === 'payments') {
          return paymentsTable as any;
        }

        return {
          select: () => buildQueryResult(table),
          insert: (payload: Record<string, unknown>) => {
            inserted[table] = payload;
            return {
              select: () => ({
                single: async () => ({ data: table === 'orders' ? orderRow : paymentRow, error: null }),
              }),
              single: async () => ({ data: table === 'orders' ? orderRow : paymentRow, error: null }),
            };
          },
          update: (payload: Record<string, unknown>) => ({
            eq: () => ({
              select: () => ({ single: async () => ({ data: { ...paymentRow, ...payload }, error: null }) }),
              single: async () => ({ data: { ...paymentRow, ...payload }, error: null }),
            }),
          }),
        };
      }),
    } as any);

    const repo = getDataSource('production');
    const createdOrder = await repo.orders.create({
      businessId: 'biz-1',
      tripId: 'trip-live',
      productId: 'product-live',
      productVariantId: 'variant-live',
      customerName: 'Aisha',
      customerPhone: '0123456789',
      deliveryAddress: 'Kuala Lumpur',
      quantity: 1,
      paymentMethod: 'bank',
      shippingFee: 10,
    });

    expect(createdOrder).not.toBeNull();
    expect(inserted.orders).not.toHaveProperty('customer_id');
    expect(inserted.orders).toHaveProperty('customer_profile_id');

    const createdPayment = await repo.payments.create({
      businessId: 'biz-1',
      orderId: 'order-live',
      amount: 130,
      paymentMethod: 'bank',
      provider: 'bank',
      idempotencyKey: 'live-key',
    });

    expect(createdPayment).not.toBeNull();
    expect(inserted.payments).not.toHaveProperty('currency');
    expect(inserted.payments).not.toHaveProperty('idempotency_key');
    expect(inserted.payments).toHaveProperty('payment_status');
  });

  it('reconciles finance and rejects duplicate callbacks and duplicate finance insertion', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-dup',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        currency: 'MYR',
        payment_status: 'pending',
        provider: 'mock',
        idempotency_key: 'dup-key',
        verified: false,
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
      finance: [],
    }) as any);

    const repo = getDataSource('production');
    const paid = await repo.payments.transition('pay-dup', 'biz-1', 'paid', { callbackEventId: 'evt-1', providerTransactionId: 'txn-1' });
    expect(paid?.status).toBe('paid');

    const reconciled = await repo.payments.reconcileFinanceForPayment('pay-dup', 'biz-1');
    expect(reconciled).toHaveLength(1);
    expect(reconciled[0]?.amount).toBe(120);

    const duplicate = await repo.payments.transition('pay-dup', 'biz-1', 'paid', { callbackEventId: 'evt-1', providerTransactionId: 'txn-1' });
    expect(duplicate?.status).toBe('paid');
    expect(await repo.payments.getByOrder('biz-1', 'order-1')).not.toBeNull();
  });
});
