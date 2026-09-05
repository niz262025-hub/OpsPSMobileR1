import { describe, expect, it } from 'vitest';

import {
  applyShipmentTransition,
  createShippingService,
  getMockShippingProvider,
  isValidShipmentTransition,
  reconcileFinanceForShipment,
} from '../services/shipping';

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
});