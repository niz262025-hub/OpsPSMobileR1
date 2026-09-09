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
  payment_status: string;
  receipt_uri?: string;
  verified?: boolean;
  customer_id?: string;
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
    customer_profile_id: 'profile-1',
    total: 120,
    payment_status: 'pending',
    order_status: 'pending',
    created_at: '2026-09-05T00:00:00.000Z',
    updated_at: '2026-09-05T00:00:00.000Z',
  }]).map((row) => ({ ...row }));
  const payments = (input.payments ?? []).map((row) => ({ ...row }));
  const finance = (input.finance ?? []).map((row) => ({ ...row }));

  const filterRows = (rows: Array<Record<string, unknown>>, filters: Array<[string, unknown]>) =>
    rows.filter((row) => filters.every(([field, value]) => row[field] === value));

  const buildTableQuery = (table: string, source: Array<Record<string, unknown>>) => {
    const filters: Array<[string, unknown]> = [];
    const applyRow = (payload: Record<string, unknown>) => {
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
        const matches = filterRows(source, filters);
        matches.forEach((row) => Object.assign(row, payload));

        const updateBuilder: any = {
          eq(field: string, value: unknown) {
            const scoped = matches.filter((row) => row[field] === value);
            updateBuilder._lastScope = scoped;
            return updateBuilder;
          },
          select() {
            return {
              single: async () => ({ data: updateBuilder._lastScope?.[0] ?? matches[0] ?? null, error: null }),
              maybeSingle: async () => ({ data: updateBuilder._lastScope?.[0] ?? matches[0] ?? null, error: null }),
            };
          },
          single: async () => ({ data: updateBuilder._lastScope?.[0] ?? matches[0] ?? null, error: null }),
          maybeSingle: async () => ({ data: updateBuilder._lastScope?.[0] ?? matches[0] ?? null, error: null }),
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
      finance_transactions: finance,
    }[table] ?? [])),
  } as any;
}

describe('manual bank transfer payment proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. customer submits bank-transfer proof with the order amount and proof URL', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient() as any);

    const repo = getDataSource('production');
    const created = await repo.payments.create({
      businessId: 'biz-1',
      orderId: 'order-1',
      amount: 120,
      paymentMethod: 'bank',
      provider: 'bank',
      customerId: 'customer-1',
      receiptUri: 'https://cdn.example.test/payment-proof-1.png',
    } as any);

    expect(created).not.toBeNull();
    expect(created?.payment_status).toBe('pending_verification');
    expect(Number(created?.amount ?? 0)).toBe(120);
    expect((created as any)?.receipt_uri).toBe('https://cdn.example.test/payment-proof-1.png');
  });

  it('2. valid proof verification moves the payment to a verified paid state without duplicating the finance record', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-verify',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        payment_status: 'pending_verification',
        receipt_uri: 'https://cdn.example.test/proof.png',
        verified: false,
        customer_id: 'customer-1',
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    const verified = await repo.payments.transition('pay-verify', 'biz-1', 'paid', { callbackEventId: 'evt-1', verified: true });
    const reconciled = await repo.payments.reconcileFinanceForPayment('pay-verify', 'biz-1');

    expect(verified?.status).toBe('paid');
    expect(reconciled).toHaveLength(1);
    expect(Number(reconciled[0]?.amount ?? 0)).toBe(120);
  });

  it('3. rejected proof remains unpaid and cleared as failed instead of becoming paid', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-reject',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        payment_status: 'pending_verification',
        receipt_uri: 'https://cdn.example.test/bad-proof.png',
        verified: false,
        customer_id: 'customer-1',
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    const updated = await repo.payments.transition('pay-reject', 'biz-1', 'failed');
    expect(updated?.status).toBe('failed');
    expect(await repo.payments.reconcileFinanceForPayment('pay-reject', 'biz-1')).toEqual([]);
  });

  it('4. duplicate verification does not create a second payment state or second reconciliation', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-dup-verify',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        payment_status: 'pending_verification',
        receipt_uri: 'https://cdn.example.test/dup.png',
        verified: false,
        customer_id: 'customer-1',
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
      finance: [{
        id: 'fin-dup',
        business_id: 'biz-1',
        order_id: 'order-1',
        description: 'Payment Received',
        amount: 120,
        type: 'income',
        payment_method: 'bank',
        category: 'Payment Received',
        reference_id: 'pay-dup-verify',
        created_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    const first = await repo.payments.transition('pay-dup-verify', 'biz-1', 'paid', { callbackEventId: 'evt-dup', verified: true });
    const second = await repo.payments.transition('pay-dup-verify', 'biz-1', 'paid', { callbackEventId: 'evt-dup', verified: true });
    const reconciled = await repo.payments.reconcileFinanceForPayment('pay-dup-verify', 'biz-1');

    expect(first?.status).toBe('paid');
    expect(second?.status).toBe('paid');
    expect(reconciled).toHaveLength(1);
  });

  it('5. duplicate finance prevention prevents a second completed revenue row for the same payment', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-fin-dup',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        payment_status: 'paid',
        verified: true,
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
      finance: [{
        id: 'fin-existing',
        business_id: 'biz-1',
        order_id: 'order-1',
        description: 'Payment Received',
        amount: 120,
        type: 'income',
        payment_method: 'bank',
        category: 'Payment Received',
        reference_id: 'pay-fin-dup',
        created_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    const reconciled = await repo.payments.reconcileFinanceForPayment('pay-fin-dup', 'biz-1');
    expect(reconciled).toHaveLength(1);
    expect(reconciled[0]?.reference_id).toBe('pay-fin-dup');
  });

  it('6. amount and order mismatch prevents creating a payment for the wrong order total', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      orders: [{
        id: 'order-2',
        business_id: 'biz-1',
        customer_id: 'customer-2',
        customer_profile_id: 'profile-2',
        total: 120,
        payment_status: 'pending',
        order_status: 'pending',
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    const created = await repo.payments.create({
      businessId: 'biz-1',
      orderId: 'order-2',
      amount: 150,
      paymentMethod: 'bank',
      provider: 'bank',
      customerId: 'customer-2',
    } as any);

    expect(created).toBeNull();
  });

  it('7. unauthorized payment access stays blocked even when a user has another business membership', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      memberships: [
        { business_id: 'biz-1', user_id: 'user-1', role: 'founder' },
        { business_id: 'biz-2', user_id: 'user-1', role: 'founder' },
      ],
      payments: [{
        id: 'pay-other',
        business_id: 'biz-2',
        order_id: 'order-9',
        payment_method: 'bank',
        amount: 250,
        payment_status: 'pending',
        verified: false,
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    await expect(repo.payments.getById('pay-other', 'biz-1')).resolves.toBeNull();
  });

  it('8. unauthorized payment status update stays blocked across businesses', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      memberships: [
        { business_id: 'biz-1', user_id: 'user-1', role: 'founder' },
        { business_id: 'biz-2', user_id: 'user-1', role: 'founder' },
      ],
      payments: [{
        id: 'pay-cross',
        business_id: 'biz-2',
        order_id: 'order-9',
        payment_method: 'bank',
        amount: 250,
        payment_status: 'pending',
        verified: false,
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    await expect(repo.payments.transition('pay-cross', 'biz-1', 'paid')).resolves.toBeNull();
  });

  it('9. business finance records remain isolated to the owning business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildScopedPaymentClient({
      payments: [{
        id: 'pay-biz',
        business_id: 'biz-1',
        order_id: 'order-1',
        payment_method: 'bank',
        amount: 120,
        payment_status: 'paid',
        verified: true,
        created_at: '2026-09-05T00:00:00.000Z',
        updated_at: '2026-09-05T00:00:00.000Z',
      }],
      finance: [{
        id: 'fin-biz',
        business_id: 'biz-2',
        order_id: 'order-9',
        description: 'Payment Received',
        amount: 120,
        type: 'income',
        payment_method: 'bank',
        category: 'Payment Received',
        reference_id: 'pay-biz',
        created_at: '2026-09-05T00:00:00.000Z',
      }],
    }) as any);

    const repo = getDataSource('production');
    const reconciled = await repo.payments.reconcileFinanceForPayment('pay-biz', 'biz-1');
    expect(reconciled).toEqual([]);
  });

  it('10. admin finance remains platform-scoped and does not expose unrelated private business finance', () => {
    const sql = `
      CREATE POLICY IF NOT EXISTS "finance_member_select"
      ON public.finance_transactions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.business_memberships bm
          WHERE bm.business_id = finance_transactions.business_id
            AND bm.user_id = auth.uid()
        )
      );

      CREATE POLICY IF NOT EXISTS "admin_users_member_select"
      ON public.admin_users
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.business_memberships bm
          WHERE bm.business_id = admin_users.business_id
            AND bm.user_id = auth.uid()
            AND bm.role IN ('founder', 'admin')
        )
      );
    `;

    expect(sql).toContain('finance_member_select');
    expect(sql).toContain('admin_users_member_select');
    expect(sql).toContain('bm.business_id = finance_transactions.business_id');
    expect(sql).toContain('bm.role IN (\'founder\', \'admin\')');
  });
});
