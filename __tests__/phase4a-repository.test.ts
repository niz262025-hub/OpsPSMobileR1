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
  orders?: Array<Record<string, unknown>>;
  orderItems?: Array<Record<string, unknown>>;
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
    orders: input.orders ? input.orders.map((row) => ({ ...row })) : [],
    order_items: input.orderItems ? input.orderItems.map((row) => ({ ...row })) : [],
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
    if (table === 'orders') {
      return buildTableQuery(state.orders as Array<Record<string, unknown>>, table);
    }
    if (table === 'order_items') {
      return buildTableQuery(state.order_items as Array<Record<string, unknown>>, table);
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

  it('updates product and variant data within the same business tenant', async () => {
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
      product: {
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
      },
      variant: {
        id: 'variant-1',
        business_id: 'biz-1',
        product_id: 'product-1',
        size: 'M',
        stock: 12,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
    }) as any);

    const repo = getDataSource('production');
    const updatedProduct = await repo.products.update({
      productId: 'product-1',
      businessId: 'biz-1',
      name: 'OpsPS Tee Updated',
      sellingPrice: 30,
      stock: 9,
      status: 'ready',
      isPublished: true,
    });

    expect(updatedProduct?.name).toBe('OpsPS Tee Updated');
    expect(updatedProduct?.sellingPrice).toBe(30);

    const refreshedProduct = await repo.products.getProduct('product-1', 'biz-1');
    expect(refreshedProduct?.sellingPrice).toBe(30);

    expect(await repo.products.listVariantsForProduct('product-1', 'biz-1')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ size: 'M', stock: 9 }),
      ])
    );
  });

  it('returns only published products for marketplace listing', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      product: {
        id: 'product-1',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        name: 'Published Item',
        category: 'Clothing',
        description: 'Ready to sell',
        image_url: 'https://example.com/published.png',
        cost_price: 15,
        selling_price: 39,
        status: 'ready',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
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
      variant: {
        id: 'variant-1',
        business_id: 'biz-1',
        product_id: 'product-1',
        size: 'M',
        stock: 15,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
    }) as any);

    const repo = getDataSource('production');
    const published = await repo.products.listPublishedForBusiness('biz-1');

    expect(published).toHaveLength(1);
    expect(published[0].name).toBe('Published Item');
    expect(published[0].businessId).toBe('biz-1');
  });

  it('checks order stock availability against the correct business variant and quantity', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      product: {
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
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-1',
        business_id: 'biz-1',
        product_id: 'product-1',
        size: 'M',
        stock: 12,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-1',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        product_id: 'product-1',
        customer_profile_id: 'profile-1',
        customer_name: 'Alex',
        customer_phone: '0123456789',
        delivery_address: 'Kuala Lumpur',
        order_date: '2026-09-10T08:00:00.000Z',
        subtotal: 50,
        shipping_fee: 0,
        total: 50,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-1',
        business_id: 'biz-1',
        order_id: 'order-1',
        product_variant_id: 'variant-1',
        quantity: 4,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const result = await repo.orders.checkStockAvailability('biz-1', 'order-1');

    expect(result).toMatchObject({
      orderId: 'order-1',
      businessId: 'biz-1',
      productId: 'product-1',
      available: true,
      requestedQuantity: 4,
      availableQuantity: 12,
      requestStatus: 'AVAILABLE',
      availabilityStatus: 'confirmed',
    });
  });

  it('prevents stock availability checks from crossing business or variant ownership', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      product: {
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
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-1',
        business_id: 'biz-1',
        product_id: 'product-1',
        size: 'M',
        stock: 2,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-2',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        product_id: 'product-1',
        customer_profile_id: 'profile-1',
        customer_name: 'Alex',
        customer_phone: '0123456789',
        delivery_address: 'Kuala Lumpur',
        order_date: '2026-09-10T08:00:00.000Z',
        subtotal: 50,
        shipping_fee: 0,
        total: 50,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-2',
        business_id: 'biz-1',
        order_id: 'order-2',
        product_variant_id: 'variant-1',
        quantity: 5,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const result = await repo.orders.checkStockAvailability('biz-1', 'order-2');

    expect(result).toMatchObject({
      orderId: 'order-2',
      businessId: 'biz-1',
      productId: 'product-1',
      available: false,
      requestedQuantity: 5,
      availableQuantity: 2,
      requestStatus: 'OUT_OF_STOCK',
      availabilityStatus: 'not_available',
    });
  });

  it('generates buy list entries only for insufficient-stock orders in the active business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      product: {
        id: 'product-1',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        name: 'OpsPS Tee',
        category: 'Clothing',
        description: 'Ready to sell',
        image_url: 'https://example.com/product.png',
        cost_price: 10,
        selling_price: 25,
        status: 'ready',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-1',
        business_id: 'biz-1',
        product_id: 'product-1',
        size: 'M',
        stock: 2,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-buy-1',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        product_id: 'product-1',
        customer_profile_id: 'profile-1',
        customer_name: 'Alex',
        customer_phone: '0123456789',
        delivery_address: 'Kuala Lumpur',
        order_date: '2026-09-10T08:00:00.000Z',
        subtotal: 50,
        shipping_fee: 0,
        total: 50,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-3',
        business_id: 'biz-1',
        order_id: 'order-buy-1',
        product_variant_id: 'variant-1',
        quantity: 5,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const buyList = await repo.orders.listBuyListForBusiness('biz-1');

    expect(buyList).toHaveLength(1);
    expect(buyList[0]).toMatchObject({
      orderId: 'order-buy-1',
      productVariantId: 'variant-1',
      quantity: 5,
      itemName: 'OpsPS Tee',
      purchased: false,
    });
  });

  it('does not include sufficient-stock orders in the buy list', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      product: {
        id: 'product-1',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        name: 'OpsPS Tee',
        category: 'Clothing',
        description: 'Ready to sell',
        image_url: 'https://example.com/product.png',
        cost_price: 10,
        selling_price: 25,
        status: 'ready',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-1',
        business_id: 'biz-1',
        product_id: 'product-1',
        size: 'M',
        stock: 10,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-buy-2',
        business_id: 'biz-1',
        trip_id: 'trip-1',
        product_id: 'product-1',
        customer_profile_id: 'profile-2',
        customer_name: 'Bala',
        customer_phone: '0123456788',
        delivery_address: 'Johor',
        order_date: '2026-09-11T08:00:00.000Z',
        subtotal: 30,
        shipping_fee: 0,
        total: 30,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-4',
        business_id: 'biz-1',
        order_id: 'order-buy-2',
        product_variant_id: 'variant-1',
        quantity: 1,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const buyList = await repo.orders.listBuyListForBusiness('biz-1');

    expect(buyList).toEqual([]);
  });

  it('keeps buy list data isolated to the authenticated business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      memberships: [{ business_id: 'biz-1', user_id: 'user-1', role: 'founder' }],
      product: {
        id: 'product-2',
        business_id: 'biz-2',
        trip_id: 'trip-2',
        name: 'Competing Product',
        category: 'Clothing',
        description: 'Other business',
        image_url: 'https://example.com/other.png',
        cost_price: 9,
        selling_price: 18,
        status: 'ready',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-2',
        business_id: 'biz-2',
        product_id: 'product-2',
        size: 'L',
        stock: 1,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-biz-2',
        business_id: 'biz-2',
        trip_id: 'trip-2',
        product_id: 'product-2',
        customer_profile_id: 'profile-9',
        customer_name: 'Guest',
        customer_phone: '0123456787',
        delivery_address: 'Penang',
        order_date: '2026-09-10T08:00:00.000Z',
        subtotal: 18,
        shipping_fee: 0,
        total: 18,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-5',
        business_id: 'biz-2',
        order_id: 'order-biz-2',
        product_variant_id: 'variant-2',
        quantity: 3,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const buyList = await repo.orders.listBuyListForBusiness('biz-1');
    expect(buyList).toEqual([]);
  });

  it('marks an insufficient-stock buy list item as bought and replenishes the variant stock', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      product: {
        id: 'product-3',
        business_id: 'biz-1',
        trip_id: 'trip-3',
        name: 'OpsPS Hoodie',
        category: 'Clothing',
        description: 'Warm layer',
        image_url: 'https://example.com/hoodie.png',
        cost_price: 22,
        selling_price: 49,
        status: 'ready',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-3',
        business_id: 'biz-1',
        product_id: 'product-3',
        size: 'L',
        stock: 2,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-buy-3',
        business_id: 'biz-1',
        trip_id: 'trip-3',
        product_id: 'product-3',
        customer_profile_id: 'profile-3',
        customer_name: 'Chloe',
        customer_phone: '0123456783',
        delivery_address: 'KL',
        order_date: '2026-09-12T08:00:00.000Z',
        subtotal: 98,
        shipping_fee: 0,
        total: 98,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-6',
        business_id: 'biz-1',
        order_id: 'order-buy-3',
        product_variant_id: 'variant-3',
        quantity: 4,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const marked = await repo.orders.markBuyListItemBought('biz-1', 'order-buy-3:variant-3');

    expect(marked).toMatchObject({
      orderId: 'order-buy-3',
      productVariantId: 'variant-3',
      quantity: 4,
      purchased: true,
    });
    expect(await repo.orders.listBuyListForBusiness('biz-1')).toEqual([]);
  });

  it('rejects bought-state updates outside the authenticated business', async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(buildBusinessScopedClient({
      memberships: [{ business_id: 'biz-1', user_id: 'user-1', role: 'founder' }],
      product: {
        id: 'product-4',
        business_id: 'biz-2',
        trip_id: 'trip-4',
        name: 'Other Stock',
        category: 'Clothing',
        description: 'Not in this business',
        image_url: 'https://example.com/other-stock.png',
        cost_price: 14,
        selling_price: 29,
        status: 'ready',
        is_published: true,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      variant: {
        id: 'variant-4',
        business_id: 'biz-2',
        product_id: 'product-4',
        size: 'S',
        stock: 1,
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z',
      },
      orders: [{
        id: 'order-buy-4',
        business_id: 'biz-2',
        trip_id: 'trip-4',
        product_id: 'product-4',
        customer_profile_id: 'profile-4',
        customer_name: 'Dana',
        customer_phone: '0123456784',
        delivery_address: 'Johor',
        order_date: '2026-09-13T08:00:00.000Z',
        subtotal: 29,
        shipping_fee: 0,
        total: 29,
        payment_status: 'pending',
        order_status: 'pending',
        request_status: 'PENDING_AVAILABILITY',
        payment_option: 'bank',
        payment_mode: 'bank',
        availability_status: 'pending',
      }],
      orderItems: [{
        id: 'order-item-7',
        business_id: 'biz-2',
        order_id: 'order-buy-4',
        product_variant_id: 'variant-4',
        quantity: 3,
        packed_quantity: 0,
      }],
    }) as any);

    const repo = getDataSource('production');
    const result = await repo.orders.markBuyListItemBought('biz-1', 'order-buy-4:variant-4');
    expect(result).toBeNull();
  });
});
