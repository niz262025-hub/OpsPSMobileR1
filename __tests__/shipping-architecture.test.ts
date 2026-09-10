import { describe, expect, it } from 'vitest';

import {
  applyShipmentTransition,
  createShippingService,
  getMockShippingProvider,
  isValidShipmentTransition,
  reconcileFinanceForShipment,
} from '../services/shipping';
import * as dbModule from '../services/mockDatabase';

const input = {
  orderId: 'order-1',
  businessId: 'business-1',
  recipient: {
    name: 'Siti Customer',
    phone: '0123456789',
    address1: '1 Jalan Test',
    city: 'Kuala Lumpur',
    postcode: '50000',
    country: 'MY',
  },
  parcel: { weightKg: 1.2, lengthCm: 20, widthCm: 15, heightCm: 10 },
  courier: 'J&T Express',
  shippingCost: 8,
  idempotencyKey: 'order-1-shipment-1',
};

describe('shipping provider architecture', () => {
  it('creates a shipment with tracking and provider reference', async () => {
    const service = createShippingService(getMockShippingProvider());
    const shipment = await service.createShipment(input);

    expect(shipment.status).toBe('created');
    expect(shipment.provider).toBe('mock');
    expect(shipment.trackingNumber).toMatch(/^MOCK-/);
    expect(shipment.providerReference).toMatch(/^mock_ref_/);
  });

  it('accepts valid and rejects invalid state transitions', async () => {
    const shipment = await createShippingService(getMockShippingProvider()).createShipment(input);

    expect(isValidShipmentTransition('created', 'in_transit')).toBe(true);
    expect(isValidShipmentTransition('delivered', 'in_transit')).toBe(false);
    const delivered = applyShipmentTransition(shipment, 'delivered');
    expect(() => applyShipmentTransition(delivered, 'in_transit')).toThrow(/Invalid shipment transition/i);
  });

  it('returns the existing shipment for a duplicate idempotency key', async () => {
    const service = createShippingService(getMockShippingProvider());
    const first = await service.createShipment(input);
    const second = await service.createShipment(input);

    expect(second.id).toBe(first.id);
    expect(service.getShipmentsForOrder(input.orderId)).toHaveLength(1);
  });

  it('protects against duplicate webhooks and handles delivered status', async () => {
    const service = createShippingService(getMockShippingProvider());
    const created = await service.createShipment(input);
    const event = {
      id: 'event-delivered-1',
      provider: 'mock' as const,
      status: 'delivered' as const,
      trackingNumber: created.trackingNumber,
      providerReference: created.providerReference,
    };

    const first = service.handleWebhook(created.id, event);
    const second = service.handleWebhook(created.id, event);

    expect(first.duplicate).toBe(false);
    expect(first.shipment.status).toBe('delivered');
    expect(first.shipment.deliveredAt).toBeDefined();
    expect(second.duplicate).toBe(true);
    expect(service.getShipment(created.id)?.status).toBe('delivered');
  });

  it('links shipments to orders and exposes finance reconciliation metadata', async () => {
    const service = createShippingService(getMockShippingProvider());
    const shipment = await service.createShipment(input);
    const finance = reconcileFinanceForShipment(shipment);

    expect(service.getShipmentsForOrder('order-1')).toEqual([shipment]);
    expect(finance.shouldReconcile).toBe(true);
    expect(finance.direction).toBe('expense');
    expect(finance.referenceId).toBe(shipment.id);
  });

  it('keeps the mock provider compatible without making external calls', async () => {
    const provider = getMockShippingProvider();
    const shipment = await createShippingService(provider).createShipment({ ...input, provider: 'mock' });

    expect(provider.name).toBe('mock');
    expect(shipment.orderId).toBe('order-1');
  });

  it('requires a paid order before packing and shipping can proceed', async () => {
    const db = dbModule;
    const sourceBusinessId = 'shipping-audit-paid-gating';
    db.setActiveBusinessScope(sourceBusinessId);

    const product = db.createProduct({
      name: 'Shipping Audit Tee',
      category: 'Clothing',
      image: 'https://example.com/shipping-audit.png',
      tripId: 'trip-1',
      costPrice: 20,
      sellingPrice: 45,
      size: 'M',
      stock: 10,
      businessId: sourceBusinessId,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 1,
      customerName: 'Shipping Audit Customer',
      customerPhone: '0123456781',
      deliveryAddress: '9 Audit Avenue',
      businessId: sourceBusinessId,
    });

    expect(db.startPacking(order!.id)).toBe(false);
    expect(db.createOrderShipment(order!.id, {
      courier: 'J&T Express',
      recipientName: order!.customerName,
      recipientPhone: order!.customerPhone ?? '',
      deliveryAddress: order!.deliveryAddress ?? '',
      postcode: '50000',
      city: 'Kuala Lumpur',
      parcelWeight: 1,
      quantity: 1,
      shippingCost: 10,
    })).toBeNull();

    db.completeCustomerPayment(order!.id, 'Bank Transfer');
    expect(db.startPacking(order!.id)).toBe(true);

    const shipped = db.submitEasyParcelShipment(order!.id, {
      courier: 'J&T Express',
      recipientName: order!.customerName,
      recipientPhone: order!.customerPhone ?? '',
      deliveryAddress: order!.deliveryAddress ?? '',
      postcode: '50000',
      city: 'Kuala Lumpur',
      parcelWeight: 1,
      quantity: 1,
      shippingCost: 10,
    });

    expect(shipped).not.toBeNull();
    expect(db.getOrder(order!.id, db.getMockDatabaseSnapshot(), sourceBusinessId)?.status).toBe('shipped');
  });

  it('keeps shipment creation idempotent for the same order within its business scope', async () => {
    const db = dbModule;
    const businessA = 'shipping-scope-a';
    db.setActiveBusinessScope(businessA);

    const product = db.createProduct({
      name: 'Scope Guard Tee',
      category: 'Clothing',
      image: 'https://example.com/scope-guard.png',
      tripId: 'trip-1',
      costPrice: 18,
      sellingPrice: 40,
      size: 'L',
      stock: 9,
      businessId: businessA,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 1,
      customerName: 'Scope Guard Customer',
      customerPhone: '0123456782',
      deliveryAddress: '20 Guard Lane',
      businessId: businessA,
    });

    db.completeCustomerPayment(order!.id, 'Bank Transfer');
    db.startPacking(order!.id);

    const first = db.createOrderShipment(order!.id, {
      courier: 'J&T Express',
      recipientName: order!.customerName,
      recipientPhone: order!.customerPhone ?? '',
      deliveryAddress: order!.deliveryAddress ?? '',
      postcode: '50000',
      city: 'Kuala Lumpur',
      parcelWeight: 1,
      quantity: 1,
      shippingCost: 10,
    });
    const second = db.createOrderShipment(order!.id, {
      courier: 'J&T Express',
      recipientName: order!.customerName,
      recipientPhone: order!.customerPhone ?? '',
      deliveryAddress: order!.deliveryAddress ?? '',
      postcode: '50000',
      city: 'Kuala Lumpur',
      parcelWeight: 1,
      quantity: 1,
      shippingCost: 10,
    });

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second?.trackingNumber).toBe(first?.trackingNumber);
    expect(second?.shipmentId).toBe(first?.shipmentId);
  });

  it('accepts the shipped lifecycle step in the correct business scope', async () => {
    const db = dbModule;

    expect(isValidShipmentTransition('created', 'shipped')).toBe(true);

    const businessId = 'shipping-scope-b-source';
    db.setActiveBusinessScope(businessId);

    const product = db.createProduct({
      name: 'Shipping Scope Guard L',
      category: 'Clothing',
      image: 'https://example.com/shipping-scope-guard.png',
      tripId: 'trip-1',
      costPrice: 22,
      sellingPrice: 55,
      size: 'L',
      stock: 8,
      businessId,
    });

    const order = db.submitCustomerOrder({
      productId: product.id,
      productVariantId: product.id,
      quantity: 1,
      customerName: 'Correct Business Shipping',
      customerPhone: '0123456788',
      deliveryAddress: '21 Scope Avenue',
      businessId,
    });

    db.completeCustomerPayment(order!.id, 'Bank Transfer');
    db.startPacking(order!.id);

    const shipment = db.createOrderShipment(order!.id, {
      courier: 'J&T Express',
      recipientName: order!.customerName,
      recipientPhone: order!.customerPhone ?? '',
      deliveryAddress: order!.deliveryAddress ?? '',
      postcode: '50000',
      city: 'Kuala Lumpur',
      parcelWeight: 1,
      quantity: 1,
      shippingCost: 10,
    });

    expect(shipment).not.toBeNull();
    expect(shipment?.status).toBe('created');
    expect(db.getOrder(order!.id, db.getMockDatabaseSnapshot(), businessId)?.shipment?.trackingNumber).toMatch(/^MOCK-EP-/);
  });
});