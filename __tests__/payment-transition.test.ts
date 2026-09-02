import { beforeEach, describe, expect, it, vi } from 'vitest';

const asyncStorageMock = {
  setItem: vi.fn(async () => undefined),
  getItem: vi.fn(async () => null),
  removeItem: vi.fn(async () => undefined),
};

const storageMap = new Map<string, string>();

beforeEach(() => {
  asyncStorageMock.setItem.mockClear();
  asyncStorageMock.getItem.mockClear();
  asyncStorageMock.removeItem.mockClear();
  storageMap.clear();

  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: {
        getItem: (key: string) => storageMap.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storageMap.set(key, String(value));
        },
        removeItem: (key: string) => {
          storageMap.delete(key);
        },
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    configurable: true,
  });

  Object.defineProperty(globalThis, 'AsyncStorage', {
    value: asyncStorageMock,
    configurable: true,
  });
});

describe('customer payment transition', () => {
  it('stores the founder pay-now action as payment required for the customer flow', async () => {
    const db = await import('../services/mockDatabase');
    const businessId = 'business-payment-required';

    db.setActiveBusinessScope(businessId);

    const product = db.createProduct({
      name: 'Payment Required Tee',
      category: 'Clothing',
      image: 'https://example.com/tee.png',
      tripId: 'trip-1',
      costPrice: 20,
      sellingPrice: 45,
      size: 'M',
      stock: 8,
      businessId,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 1,
      customerName: 'Customer Payment QA',
      customerPhone: '0123456789',
      deliveryAddress: '45 Browser Street',
      businessId,
    });

    expect(order).not.toBeNull();

    const orderId = order!.id;

    db.confirmOrderAvailability(orderId, true);
    const updatedOrder = db.offerCustomerPaymentOption(orderId, 'pay_now');

    expect(updatedOrder?.requestStatus).toBe('PAYMENT_REQUIRED');
    expect(updatedOrder?.paymentMode).toBe('customer_pays_first');
    expect(db.getOrder(orderId, db.getMockDatabaseSnapshot(), businessId)?.requestStatus).toBe('PAYMENT_REQUIRED');
  });

  it('deducts the exact ordered quantity once on successful payment', async () => {
    const db = await import('../services/mockDatabase');
    const businessId = 'business-payment-stock-deduct';

    db.setActiveBusinessScope(businessId);
    const product = db.createProduct({
      name: 'Stock Deduct Tee',
      category: 'Clothing',
      image: 'https://example.com/stock.png',
      tripId: 'trip-1',
      costPrice: 20,
      sellingPrice: 45,
      size: 'L',
      stock: 8,
      businessId,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 3,
      customerName: 'Customer Stock QA',
      customerPhone: '0123456789',
      deliveryAddress: '99 Stock Street',
      businessId,
    });
    expect(order).not.toBeNull();

    const orderId = order!.id;
    db.confirmOrderAvailability(orderId, true);
    db.offerCustomerPaymentOption(orderId, 'pay_now');

    const beforeVariant = db.getProductVariant(product.id, db.getMockDatabaseSnapshot(), businessId);
    expect(beforeVariant?.stock).toBe(8);

    const receipt = db.completeCustomerPayment(orderId, 'Bank Transfer');

    expect(receipt).not.toBeNull();
    const updatedOrder = db.getOrder(orderId, db.getMockDatabaseSnapshot(), businessId);
    expect(updatedOrder?.requestStatus).toBe('PAYMENT_RECEIVED');
    expect(updatedOrder?.paymentStatus).toBe('success');

    const variantAfter = db.getProductVariant(product.id, db.getMockDatabaseSnapshot(), businessId);
    expect(variantAfter?.stock).toBe(5);
    expect(db.getMockDatabaseSnapshot().financeTransactions.filter((tx) => tx.referenceId === orderId && tx.category === 'Customer Payment')).toHaveLength(1);
  });

  it('prevents duplicate payment confirmation from deducting stock twice', async () => {
    const db = await import('../services/mockDatabase');
    const businessId = 'business-payment-duplicate';

    db.setActiveBusinessScope(businessId);
    const product = db.createProduct({
      name: 'Duplicate Payment Tee',
      category: 'Clothing',
      image: 'https://example.com/duplicate.png',
      tripId: 'trip-1',
      costPrice: 18,
      sellingPrice: 38,
      size: 'M',
      stock: 6,
      businessId,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 2,
      customerName: 'Customer Duplicate QA',
      customerPhone: '0123456788',
      deliveryAddress: '11 Duplicate Road',
      businessId,
    });
    expect(order).not.toBeNull();

    const orderId = order!.id;
    db.confirmOrderAvailability(orderId, true);
    db.offerCustomerPaymentOption(orderId, 'pay_now');

    const first = db.completeCustomerPayment(orderId, 'QR Payment');
    const second = db.completeCustomerPayment(orderId, 'QR Payment');

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const variant = db.getProductVariant(product.id, db.getMockDatabaseSnapshot(), businessId);
    expect(variant?.stock).toBe(4);
    expect(db.getMockDatabaseSnapshot().financeTransactions.filter((tx) => tx.referenceId === orderId && tx.category === 'Customer Payment')).toHaveLength(1);
  });

  it('rejects payment safely when inventory is insufficient', async () => {
    const db = await import('../services/mockDatabase');
    const businessId = 'business-payment-insufficient';

    db.setActiveBusinessScope(businessId);
    const product = db.createProduct({
      name: 'Insufficient Stock Tee',
      category: 'Clothing',
      image: 'https://example.com/insufficient.png',
      tripId: 'trip-1',
      costPrice: 17,
      sellingPrice: 35,
      size: 'S',
      stock: 1,
      businessId,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 2,
      customerName: 'Customer Insufficient QA',
      customerPhone: '0123456787',
      deliveryAddress: '33 Low Stock Street',
      businessId,
    });
    expect(order).not.toBeNull();

    const orderId = order!.id;
    db.confirmOrderAvailability(orderId, true);
    db.offerCustomerPaymentOption(orderId, 'pay_now');

    const receipt = db.completeCustomerPayment(orderId, 'Bank Transfer');

    expect(receipt).toBeNull();
    const updatedOrder = db.getOrder(orderId, db.getMockDatabaseSnapshot(), businessId);
    expect(updatedOrder?.paymentStatus).toBe('pending');
    expect(updatedOrder?.requestStatus).toBe('PAYMENT_REQUIRED');
    const variant = db.getProductVariant(product.id, db.getMockDatabaseSnapshot(), businessId);
    expect(variant?.stock).toBe(1);
  });
});
