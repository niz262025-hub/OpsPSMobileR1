import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildReport, type ReportDataset } from '../services/reporting';

const sampleDataset: ReportDataset = {
  orders: [
    {
      id: 'order-1',
      businessId: 'business-1',
      tripId: 'trip-1',
      customerName: 'Alice',
      customerPhone: '111',
      orderDate: '2025-01-05T00:00:00.000Z',
      total: 150,
      shippingFee: 10,
      paymentStatus: 'paid',
      paymentMode: 'bank',
      availabilityStatus: 'confirmed',
      status: 'paid',
      tripName: 'Trip North',
      productName: 'Water Bottle',
      productSize: 'L',
      quantity: 2,
    },
    {
      id: 'order-2',
      businessId: 'business-1',
      tripId: 'trip-1',
      customerName: 'Bob',
      customerPhone: '222',
      orderDate: '2025-01-10T00:00:00.000Z',
      total: 80,
      shippingFee: 5,
      paymentStatus: 'pending',
      paymentMode: 'cash',
      availabilityStatus: 'confirmed',
      status: 'pending',
      tripName: 'Trip North',
      productName: 'Cap',
      productSize: 'M',
      quantity: 1,
    },
    {
      id: 'order-3',
      businessId: 'business-2',
      tripId: 'trip-2',
      customerName: 'Mallory',
      customerPhone: '333',
      orderDate: '2025-01-12T00:00:00.000Z',
      total: 220,
      shippingFee: 8,
      paymentStatus: 'paid',
      paymentMode: 'bank',
      availabilityStatus: 'confirmed',
      status: 'paid',
      tripName: 'Trip South',
      productName: 'Hoodie',
      productSize: 'XL',
      quantity: 3,
    },
  ],
  orderItems: [
    { id: 'oi-1', orderId: 'order-1', productVariantId: 'variant-1', quantity: 2 },
    { id: 'oi-2', orderId: 'order-2', productVariantId: 'variant-2', quantity: 1 },
    { id: 'oi-3', orderId: 'order-3', productVariantId: 'variant-3', quantity: 3 },
  ],
  productVariants: [
    { id: 'variant-1', productId: 'product-1', size: 'L', stock: 12 },
    { id: 'variant-2', productId: 'product-2', size: 'M', stock: 4 },
    { id: 'variant-3', productId: 'product-3', size: 'XL', stock: 7 },
  ],
  products: [
    { id: 'product-1', businessId: 'business-1', tripId: 'trip-1', name: 'Water Bottle', costPrice: 20, sellingPrice: 75, category: 'Accessories' },
    { id: 'product-2', businessId: 'business-1', tripId: 'trip-1', name: 'Cap', costPrice: 15, sellingPrice: 80, category: 'Accessories' },
    { id: 'product-3', businessId: 'business-2', tripId: 'trip-2', name: 'Hoodie', costPrice: 40, sellingPrice: 105, category: 'Apparel' },
  ],
  trips: [
    { id: 'trip-1', businessId: 'business-1', name: 'Trip North', destination: 'Kota Bharu', tripDate: '2025-01-05' },
    { id: 'trip-2', businessId: 'business-2', name: 'Trip South', destination: 'Johor', tripDate: '2025-01-12' },
  ],
  financeTransactions: [
    { id: 'txn-1', business_id: 'business-1', trip_id: 'trip-1', description: 'Trip Purchase', amount: 35, type: 'expense', category: 'Trip Purchase', payment_method: 'bank' },
    { id: 'txn-2', business_id: 'business-1', trip_id: 'trip-1', description: 'Transport', amount: 12, type: 'expense', category: 'Transport', payment_method: 'cash' },
    { id: 'txn-3', business_id: 'business-1', trip_id: 'trip-1', description: 'Customer Payment', amount: 80, type: 'income', category: 'Customer Payment', payment_method: 'bank' },
  ],
  payments: [
    { id: 'pay-1', business_id: 'business-1', order_id: 'order-1', amount: 150, payment_status: 'paid', status: 'paid', payment_method: 'bank', verified: true, created_at: '2025-01-05T10:00:00.000Z' },
    { id: 'pay-2', business_id: 'business-1', order_id: 'order-2', amount: 80, payment_status: 'pending', status: 'pending', payment_method: 'cash', verified: false, created_at: '2025-01-10T11:00:00.000Z' },
  ],
};

describe('Reports dataset calculations', () => {
  it('computes sales totals and item counts from production orders', () => {
    const result = buildReport('sales', sampleDataset, '2025-01-01', '2025-01-31', 'business-1');

    expect(result.summary['Total Sales']).toBe(230);
    expect(result.summary['Total Orders']).toBe(2);
    expect(result.summary['Total Items']).toBe(3);
  });

  it('computes trip-level profit using business-scoped order and transaction records', () => {
    const result = buildReport('trip_profit', sampleDataset, '2025-01-01', '2025-01-31', 'business-1');

    expect(result.rows[0]).toMatchObject({ Trip: 'Trip North' });
    expect(result.summary['Total Sales']).toBe(230);
    expect(result.summary['Net Profit']).toBe(183);
  });

  it('returns a clean empty result for empty business data', () => {
    const result = buildReport('sales', { orders: [], trips: [], financeTransactions: [], payments: [], products: [], productVariants: [], orderItems: [] }, '2025-01-01', '2025-01-31');

    expect(result.rows).toEqual([]);
    expect(result.summary['Rows']).toBe(0);
    expect(result.summary['Total Sales']).toBe(0);
  });

  it('ensures the Reports screen has no mockDatabase dependency', () => {
    const reportScreenPath = join(__dirname, '..', 'app', '(tabs)', 'reports.tsx');
    const contents = readFileSync(reportScreenPath, 'utf8');

    expect(contents).not.toContain('mockDatabase');
    expect(contents).toContain("getDataSource('production')");
  });
});
