import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDataSource } from '../services/repository';
import { getSupabaseClient } from '../services/supabaseClient';

vi.mock('../services/supabaseClient', () => ({
  getSupabaseClient: vi.fn(),
}));

type MembershipRow = {
  business_id: string;
  user_id: string;
  role: string;
};

type BusinessScopedClientInput = {
  userId?: string;
  memberships?: MembershipRow[];
  trip?: Record<string, unknown>;
  product?: Record<string, unknown>;
  variant?: Record<string, unknown>;
};

function buildBusinessScopedClient(input: BusinessScopedClientInput = {}) {
  const userId = input.userId ?? 'user-1';
  const memberships = (input.memberships ?? [{ business_id: 'biz-1', user_id: userId, role: 'founder' }]).map((row) => ({ ...row }));
  const trip = input.trip ?? {
    id: 'trip-1',
    business_id: 'biz-1',
    name: 'Trip A',
    destination: 'Kota Baru',
    trip_date: '2026-09-20',
    notes: 'Launch week',
    status: 'planning',
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  };
  const product = input.product ?? {
    id: 'product-1',
    business_id: 'biz-1',
    trip_id: 'trip-1',
    name: 'OpsPS Tee',
    category: 'Clothing',
    description: 'Signature tee',
    image_url: 'https://example.com/product.png',
    cost_price: 10,
    selling_price: 25,
    status: 'ready',
    is_published: false,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  };
  const variant = input.variant ?? {
    id: 'variant-1',
    business_id: 'biz-1',
    product_id: 'product-1',
    size: 'M',
    stock: 12,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
  };

  const state = {
    business_memberships: [...memberships],
    trips: input.trip ? [{ ...trip }] : [],
    products: input.product ? [{ ...product }] : [],
    product_variants: input.variant ? [{ ...variant }] : [],
  };

  const filterRows = (rows: Array<Record<string, unknown>>, filters: Array<[string, unknown]>) =>
    rows.filter((row) => filters.every(([field, value]) => row[field] === value));

  const runQuery = (rows: Array<Record<string, unknown>>, filters: Array<[string, unknown]>) => ({
    data: filterRows(rows, filters),
    error: null,
  });

  const buildTableQuery = (rows: Array<Record<string, unknown>>, tableName?: string) => {
    const filters: Array<[string, unknown]> = [];

    const builder: any = {
      select() {
        return builder;
      },
      eq(field: string, value: unknown) {
        filters.push([field, value]);
        return builder;
      },
      then(resolve: (value: { data: Array<Record<string, unknown>>; error: null }) => unknown) {
        return Promise.resolve(runQuery(rows, filters)).then(resolve);
      },
      maybeSingle() {
        return Promise.resolve({ data: filterRows(rows, filters)[0] ?? null, error: null });
      },
      limit(count: number) {
        return Promise.resolve({ data: filterRows(rows, filters).slice(0, count), error: null });
      },
      single() {
        return Promise.resolve({ data: filterRows(rows, filters)[0] ?? null, error: null });
      },
      insert(payload: Record<string, unknown>) {
        const nextRecord = { ...payload };
        if (!nextRecord.id && tableName) {
          const baseName = tableName.replace(/s$/, '');
          nextRecord.id = `${baseName}-${rows.length + 1}`;
        }
        const idx = rows.findIndex((row) => row.id === nextRecord.id);
        if (idx >= 0) {
          rows[idx] = nextRecord;
        } else {
          rows.push(nextRecord);
        }

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
        const updateRows = () => {
          const matches = filterRows(rows, filters);
          if (!matches.length) {
            return null;
          }

          const updatedRecords = matches.map((row) => ({ ...row, ...payload }));
          for (const updatedRow of updatedRecords) {
            const targetIndex = rows.findIndex((row) => row.id === updatedRow.id);
            if (targetIndex >= 0) {
              rows[targetIndex] = updatedRow;
            }
          }
          return updatedRecords[0] ?? null;
        };

        return {
          eq(field: string, value: unknown) {
            filters.push([field, value]);
            return this;
          },
          select() {
            return {
              single: async () => ({ data: updateRows(), error: null }),
              maybeSingle: async () => ({ data: updateRows(), error: null }),
            };
          },
          single: async () => ({ data: updateRows(), error: null }),
          maybeSingle: async () => ({ data: updateRows(), error: null }),
        };
      },
    };

    return builder;
  };

  const from = vi.fn((table: string) => {
    if (table === 'business_memberships') {
      return buildTableQuery(state.business_memberships as Array<Record<string, unknown>>, table);
    }
    if (table === 'trips') {
      return buildTableQuery(state.trips as Array<Record<string, unknown>>, table);
    }
    if (table === 'products') {
      return buildTableQuery(state.products as Array<Record<string, unknown>>, table);
    }
    if (table === 'product_variants') {
      return buildTableQuery(state.product_variants as Array<Record<string, unknown>>, table);
    }
    return buildTableQuery([] as Array<Record<string, unknown>>, table);
  });

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })),
    },
    from,
  } as any;
}

describe('phase 4a production repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates and reads trips for the authenticated business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient() as any);

    const repo = getDataSource('production');
    const trip = await repo.trips.create({
      businessId: 'biz-1',
      name: 'Trip A',
      destination: 'Kota Baru',
      tripDate: '2026-09-20',
      notes: 'Launch week',
    });

    expect(trip).not.toBeNull();
    expect(trip?.businessId).toBe('biz-1');
    expect(await repo.trips.listForBusiness('biz-1')).toHaveLength(1);
  });

  it('rejects trips for a different business than the authenticated user membership', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({ memberships: [{ business_id: 'biz-1', user_id: 'user-1', role: 'founder' }] }) as any);

    const repo = getDataSource('production');
    await expect(
      repo.trips.create({
        businessId: 'biz-2',
        name: 'Wrong Business Trip',
        destination: 'Kuala Lumpur',
        tripDate: '2026-09-20',
      })
    ).resolves.toBeNull();
  });

  it('creates and reads products and variants within the authenticated business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      trip: {
        id: 'trip-1',
        business_id: 'biz-1',
        name: 'Trip A',
        destination: 'Kota Baru',
        trip_date: '2026-09-20',
        notes: 'Launch week',
        status: 'planning',
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
    }) as any);

    const repo = getDataSource('production');
    const product = await repo.products.create({
      businessId: 'biz-1',
      name: 'OpsPS Tee',
      category: 'Clothing',
      image: 'https://example.com/product.png',
      tripId: 'trip-1',
      description: 'Signature tee',
      costPrice: 10,
      sellingPrice: 25,
      size: 'M',
      stock: 12,
    });

    expect(product).not.toBeNull();
    expect(product?.businessId).toBe('biz-1');
    expect(await repo.products.listForBusiness('biz-1')).toHaveLength(1);
    expect(await repo.products.getProduct('product-1', 'biz-1')).not.toBeNull();
  });

  it('rejects attaching a product to a trip owned by another business', async () => {
    const trip = {
      id: 'trip-2',
      business_id: 'biz-2',
      name: 'Other Trip',
      destination: 'Penang',
      trip_date: '2026-09-20',
      notes: '',
      status: 'planning',
      created_at: '2026-09-01T00:00:00.000Z',
      updated_at: '2026-09-01T00:00:00.000Z',
    };

    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({ trip }) as any);

    const repo = getDataSource('production');
    await expect(
      repo.products.create({
        businessId: 'biz-1',
        name: 'Forbidden item',
        category: 'Clothing',
        image: 'https://example.com/forbidden.png',
        tripId: 'trip-2',
        costPrice: 10,
        sellingPrice: 25,
        size: 'L',
        stock: 5,
      })
    ).resolves.toBeNull();
  });
});
