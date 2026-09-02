import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import {
  clearActiveBusinessScope,
  completeCustomerPayment,
  confirmOrderAvailability,
  confirmPayLater,
  createMockShipment,
  getConfiguredPaymentMethods,
  getOrder,
  getProduct,
  getProductVariant,
  isPaymentConfigured,
  markOrderPacked,
  markOrderShipped,
  markOrderDeliveredFromCourier,
  startPacking,
  offerCustomerPaymentOption,
  rejectPayment,
  setActiveBusinessScope,
  setOrderPaymentMode,
  submitEasyParcelShipment,
  syncShipmentStatus,
  uploadPaymentReceipt,
  useMockDatabase,
  verifyPayment,
} from '../../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../../theme';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  React.useEffect(() => {
    try {
      const activeBusinessIdFromStorage =
        typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
          ? window.localStorage.getItem('@opsps_active_business_id') ||
            (() => {
              const rawSession = window.localStorage.getItem('@opsps_session');
              if (!rawSession) {
                return null;
              }
              const session = JSON.parse(rawSession) as { businessId?: string } | null;
              return session?.businessId?.trim() || null;
            })()
          : null;

      if (activeBusinessIdFromStorage) {
        setActiveBusinessScope(activeBusinessIdFromStorage);
        return;
      }
    } catch {
      // Ignore storage access errors; the page will still render the default business scope.
    }

    clearActiveBusinessScope();
  }, []);

  const db = useMockDatabase();
  const order = id ? getOrder(id, db) : undefined;
  const item = order ? db.orderItems.find((entry) => entry.orderId === order.id) : undefined;
  const variant = item ? getProductVariant(item.productVariantId, db, order?.businessId ?? null) : undefined;
  const product = order?.productId ? getProduct(order.productId, db, order.businessId ?? null) : undefined;
  const resolvedProduct = product ?? (variant ? getProduct(variant.productId, db) : undefined);
  const paymentMethods = getConfiguredPaymentMethods(db.paymentSettings);
  const [shipmentFormVisible, setShipmentFormVisible] = React.useState(false);
  const [shipmentError, setShipmentError] = React.useState('');
  const [shipmentForm, setShipmentForm] = React.useState({
    courier: db.shippingSettings.defaultCourier || 'J&T',
    recipientName: order?.customerName ?? '',
    recipientPhone: order?.customerPhone ?? '',
    deliveryAddress: order?.deliveryAddress ?? '',
    postcode: '',
    city: '',
    state: '',
    parcelWeight: '1',
    quantity: '1',
    parcelType: 'Parcel',
    shippingCost: '0',
  });

  React.useEffect(() => {
    setShipmentForm((current) => ({
      ...current,
      courier: db.shippingSettings.defaultCourier ?? current.courier ?? 'J&T',
      recipientName: order?.customerName ?? current.recipientName ?? '',
      recipientPhone: order?.customerPhone ?? current.recipientPhone ?? '',
      deliveryAddress: order?.deliveryAddress ?? current.deliveryAddress ?? '',
    }));
  }, [db.shippingSettings.defaultCourier, order?.customerName, order?.customerPhone, order?.deliveryAddress]);

  const updateShipmentField = <K extends keyof typeof shipmentForm>(field: K, value: string) => {
    setShipmentForm((current) => ({ ...current, [field]: value }));
  };

  const openShipmentForm = () => {
    if (!order) return;

    setShipmentForm({
      courier: db.shippingSettings.defaultCourier || 'J&T',
      recipientName: order.customerName ?? '',
      recipientPhone: order.customerPhone ?? '',
      deliveryAddress: order.deliveryAddress ?? '',
      postcode: '',
      city: '',
      state: '',
      parcelWeight: '1',
      quantity: String(item?.quantity ?? 1),
      parcelType: 'Parcel',
      shippingCost: '0',
    });
    setShipmentError('');
    setShipmentFormVisible(true);
  };

  const submitShipment = () => {
    if (!order) return;

    const trimmedRecipientName = shipmentForm.recipientName.trim();
    const trimmedRecipientPhone = shipmentForm.recipientPhone.trim();
    const trimmedDeliveryAddress = shipmentForm.deliveryAddress.trim();
    const parcelWeight = Number(shipmentForm.parcelWeight);

    if (!shipmentForm.courier.trim()) {
      setShipmentError('Please choose a courier.');
      return;
    }

    if (!trimmedRecipientName || !trimmedRecipientPhone || !trimmedDeliveryAddress) {
      setShipmentError('Recipient name, phone number and delivery address are required.');
      return;
    }

    if (!Number.isFinite(parcelWeight) || parcelWeight <= 0) {
      setShipmentError('Parcel weight must be greater than 0.');
      return;
    }

    const result = submitEasyParcelShipment(order.id, {
      courier: shipmentForm.courier,
      recipientName: trimmedRecipientName,
      recipientPhone: trimmedRecipientPhone,
      deliveryAddress: trimmedDeliveryAddress,
      postcode: shipmentForm.postcode.trim(),
      city: shipmentForm.city.trim(),
      state: shipmentForm.state.trim(),
      parcelWeight,
      quantity: Number(shipmentForm.quantity) || 1,
      parcelType: shipmentForm.parcelType.trim() || 'Parcel',
      shippingCost: Number(shipmentForm.shippingCost) || 0,
    });

    if (!result) {
      setShipmentError('Unable to create the shipment. Please complete the required shipment details and try again.');
      return;
    }

    setShipmentError('');
    setShipmentFormVisible(false);
    Alert.alert('Shipment Created', `Tracking: ${result.trackingNumber ?? 'Pending'}`);
  };

  if (!order || !resolvedProduct) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const productImage = resolvedProduct.image?.trim() ? resolvedProduct.image : undefined;

  const awaitingAvailability = !order.availabilityStatus || order.availabilityStatus === 'pending';
  const paymentRequired = order.availabilityStatus === 'confirmed' && !order.paymentMode;
  const canShowPaymentRequest = order.availabilityStatus === 'confirmed' && !!order.paymentMode && order.paymentStatus !== 'success' && order.paymentStatus !== 'paid';
  const customerPaymentOffer = order.availabilityStatus === 'confirmed' && (
    order.requestStatus === 'AVAILABLE' ||
    order.requestStatus === 'PENDING_PAYMENT' ||
    order.requestStatus === 'PAYMENT_REQUESTED' ||
    order.requestStatus === 'PAYMENT_REQUIRED' ||
    order.requestStatus === 'PAY_LATER_OFFERED'
  );
  const orderStatusLabel = (() => {
    const canonical = order.requestStatus ?? order.status ?? 'PENDING_AVAILABILITY';
    const map: Record<string, string> = {
      PENDING_AVAILABILITY: 'Pending Availability',
      AVAILABLE: 'Available',
      PENDING_PAYMENT: 'Pending Payment',
      PAYMENT_REQUESTED: 'Payment Requested',
      PAY_LATER_OFFERED: 'Pay Later Offered',
      OUT_OF_STOCK: 'Out of Stock',
      PAYMENT_REQUIRED: 'Payment Required',
      PAYMENT_RECEIVED: 'Payment Received',
      PACKING: 'Packing',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      PAID: 'Paid',
      RECEIPT_GENERATED: 'Receipt Generated',
      ORDER_CONFIRMED: 'Order Confirmed',
      CANCELLED: 'Cancelled',
      pending: 'Pending',
      payment_received: 'Payment Received',
      packing: 'Packing',
      ready: 'Ready',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };

    return map[canonical] ?? 'Pending';
  })();

  const selectPaymentMethod = (method: string) => {
    setOrderPaymentMode(order.id, method, order.customerName);
  };

  const sendPaymentOffer = (option: 'pay_now' | 'pay_later') => {
    const updated = offerCustomerPaymentOption(order.id, option);
    if (!updated) {
      Alert.alert('Payment Offer', 'Unable to send the payment offer to the customer.');
    }
  };

  const completePayment = () => {
    const result = completeCustomerPayment(order.id, order.paymentMode ? String(order.paymentMode) : paymentMethods[0] || 'Bank Transfer');
    if (!result) {
      Alert.alert('Payment Error', 'No payment could be completed for this order.');
      return;
    }

    Alert.alert('Payment Successful', `Receipt generated: ${result.receiptNumber}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color={THEME.primary} />
          <Text style={styles.backText}>Orders</Text>
        </Pressable>

        <Text style={styles.title}>{order.id}</Text>

        <View style={styles.card}>
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ShoppingBag size={32} color={THEME.text.light} />
              <Text style={styles.placeholderText}>No product image</Text>
            </View>
          )}
          <Text style={styles.productName}>{resolvedProduct.name}</Text>
          <Text style={styles.meta}>Selling Price: RM{resolvedProduct.sellingPrice.toFixed(2)}</Text>
          <Text style={styles.meta}>Size: {variant?.size ?? 'Standard'} · Quantity: {item?.quantity ?? 0}</Text>
          <Text style={styles.meta}>Trip: {db.trips.find((trip) => trip.id === order.tripId)?.name ?? order.tripId}</Text>
          <Text style={styles.total}>Total: RM{order.total.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Customer</Text>
          <Text style={styles.meta}>{order.customerName}</Text>
          <Text style={styles.meta}>{order.customerPhone ?? 'Phone not provided'}</Text>
          <Text style={styles.meta}>{order.deliveryAddress ?? 'Address not provided'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Availability</Text>
          <Text style={styles.status}>
            {order.availabilityStatus === 'not_available'
              ? 'Not Available / Cancelled'
              : order.availabilityStatus === 'confirmed'
                ? 'Available'
                : 'Waiting for Availability Check'}
          </Text>

          {awaitingAvailability && (
            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={() => confirmOrderAvailability(order.id, true)}>
                <Text style={styles.primaryText}>Check Availability</Text>
              </Pressable>
              <Pressable style={styles.danger} onPress={() => confirmOrderAvailability(order.id, false)}>
                <Text style={styles.dangerText}>Out of Stock</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Order Status</Text>
          <Text style={styles.status}>{orderStatusLabel}</Text>
          <Text style={styles.meta}>Payment: {order.paymentStatus ?? 'pending'}</Text>
          {order.receipt && <Text style={styles.meta}>Receipt: {order.receipt.receiptNumber}</Text>}

          {order.status === 'payment_received' && (
            <Pressable
              style={styles.primary}
              onPress={() => {
                const updated = startPacking(order.id);
                if (!updated) {
                  Alert.alert('Unable to start packing.', 'Please try again.');
                  return;
                }
              }}
            >
              <Text style={styles.primaryText}>Start Packing</Text>
            </Pressable>
          )}

          {order.status === 'packing' && !order.shipment && (
            <Pressable style={styles.primary} onPress={openShipmentForm}>
              <Text style={styles.primaryText}>Prepare Shipment</Text>
            </Pressable>
          )}

          {order.status === 'shipped' && (
            <Pressable style={styles.primary} onPress={() => { markOrderDeliveredFromCourier(order.id); }}>
              <Text style={styles.primaryText}>Mark as Delivered</Text>
            </Pressable>
          )}
        </View>

        {customerPaymentOffer && (
          <View style={styles.card}>
            <Text style={styles.section}>Product Available</Text>
            <Text style={styles.successBadge}>Product Available ✓</Text>
            <Text style={styles.meta}>Customer: {order.customerName}</Text>
            <Text style={styles.meta}>Product: {resolvedProduct.name}</Text>
            <Text style={styles.meta}>Size: {variant?.size ?? 'Standard'}</Text>
            <Text style={styles.meta}>Quantity: {item?.quantity ?? 0}</Text>
            <Text style={styles.total}>Total: RM{order.total.toFixed(2)}</Text>

            {order.requestStatus !== 'PENDING_PAYMENT' && order.requestStatus !== 'PAYMENT_REQUESTED' && order.requestStatus !== 'PAYMENT_REQUIRED' && order.requestStatus !== 'PAY_LATER_OFFERED' && (
              <>
                <Text style={styles.section}>Choose Customer Payment Option:</Text>
                <View style={styles.actions}>
                  <Pressable style={styles.primary} onPress={() => sendPaymentOffer('pay_now')}>
                    <Text style={styles.primaryText}>Pay Now</Text>
                  </Pressable>
                  <Pressable style={styles.secondary} onPress={() => sendPaymentOffer('pay_later')}>
                    <Text style={styles.secondaryText}>Pay Later</Text>
                  </Pressable>
                </View>
              </>
            )}

            {(order.requestStatus === 'PENDING_PAYMENT' || order.requestStatus === 'PAYMENT_REQUESTED' || order.requestStatus === 'PAYMENT_REQUIRED') && (
              <Text style={styles.meta}>Payment Option: Pay Now</Text>
            )}

            {order.requestStatus === 'PAY_LATER_OFFERED' && (
              <Text style={styles.meta}>Payment Option: Pay Later</Text>
            )}
          </View>
        )}

        {paymentRequired && (
          <View style={styles.card}>
            <Text style={styles.section}>Select Payment Method</Text>
            {paymentMethods.length === 0 ? (
              <Text style={styles.meta}>No payment methods are configured in Settings.</Text>
            ) : (
              <View style={styles.actions}>
                {paymentMethods.map((method) => (
                  <Pressable key={method} style={styles.option} onPress={() => selectPaymentMethod(method)}>
                    <Text style={styles.optionText}>{method}</Text>
                  </Pressable>
                ))}
                {db.paymentSettings.bnplEnabled && (
                  <Pressable style={styles.option} onPress={() => selectPaymentMethod('Buy Now Pay Later')}>
                    <Text style={styles.optionText}>Buy Now Pay Later</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {canShowPaymentRequest && (
          <View style={styles.card}>
            <Text style={styles.section}>Payment Request</Text>
            <Text style={styles.instructions}>{`Product: ${resolvedProduct.name}
Payment Method: ${String(order.paymentMode ?? 'Bank Transfer')}
Amount: RM${order.total.toFixed(2)}`}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={completePayment}>
                <Text style={styles.primaryText}>Payment Success</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => rejectPayment(order.id)}>
                <Text style={styles.secondaryText}>Reject Payment</Text>
              </Pressable>
            </View>
          </View>
        )}

        {order.receipt && (
          <View style={styles.card}>
            <Text style={styles.section}>Receipt</Text>
            <Text style={styles.instructions}>{`Receipt No: ${order.receipt.receiptNumber}
Date: ${new Date(order.receipt.createdAt).toLocaleString()}
Total: RM${order.receipt.amount.toFixed(2)}
Payment: ${order.receipt.paymentMethod}`}</Text>
          </View>
        )}

        {order.status === 'ready' && !order.shipment && (
          <Pressable style={styles.primary} onPress={() => createMockShipment(order.id, 'J&T (EasyParcel mock)')}>
            <Text style={styles.primaryText}>Create Mock Shipment</Text>
          </Pressable>
        )}

        {order.status === 'ready' && order.shipment && (
          <Pressable style={styles.primary} onPress={() => markOrderShipped(order.id, order.shipment?.courier ?? 'J&T (EasyParcel mock)')}>
            <Text style={styles.primaryText}>Mark as Shipped</Text>
          </Pressable>
        )}

        {shipmentFormVisible && (
          <View style={styles.card}>
            <Text style={styles.section}>EasyParcel Shipment</Text>
            <Text style={styles.meta}>Customer details are prefilled from the order. Complete any missing shipment details before submitting.</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Courier</Text>
              <TextInput value={shipmentForm.courier} onChangeText={(value: string) => updateShipmentField('courier', value)} style={styles.input} placeholder="J&T" placeholderTextColor={THEME.text.light} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Recipient Name</Text>
              <TextInput value={shipmentForm.recipientName} onChangeText={(value: string) => updateShipmentField('recipientName', value)} style={styles.input} placeholder="Recipient name" placeholderTextColor={THEME.text.light} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Recipient Phone</Text>
              <TextInput value={shipmentForm.recipientPhone} onChangeText={(value: string) => updateShipmentField('recipientPhone', value)} style={styles.input} keyboardType="phone-pad" placeholder="Recipient phone" placeholderTextColor={THEME.text.light} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Delivery Address</Text>
              <TextInput value={shipmentForm.deliveryAddress} onChangeText={(value: string) => updateShipmentField('deliveryAddress', value)} style={[styles.input, styles.textArea]} multiline placeholder="Delivery address" placeholderTextColor={THEME.text.light} />
            </View>

            <View style={styles.inlineRow}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Postcode</Text>
                <TextInput value={shipmentForm.postcode} onChangeText={(value: string) => updateShipmentField('postcode', value)} style={styles.input} placeholder="Postcode" placeholderTextColor={THEME.text.light} />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>City</Text>
                <TextInput value={shipmentForm.city} onChangeText={(value: string) => updateShipmentField('city', value)} style={styles.input} placeholder="City" placeholderTextColor={THEME.text.light} />
              </View>
            </View>

            <View style={styles.inlineRow}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>State</Text>
                <TextInput value={shipmentForm.state} onChangeText={(value: string) => updateShipmentField('state', value)} style={styles.input} placeholder="State" placeholderTextColor={THEME.text.light} />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput value={shipmentForm.parcelWeight} onChangeText={(value: string) => updateShipmentField('parcelWeight', value)} style={styles.input} keyboardType="decimal-pad" placeholder="1" placeholderTextColor={THEME.text.light} />
              </View>
            </View>

            <View style={styles.inlineRow}>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput value={shipmentForm.quantity} onChangeText={(value: string) => updateShipmentField('quantity', value)} style={styles.input} keyboardType="numeric" placeholder="1" placeholderTextColor={THEME.text.light} />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.label}>Shipping Cost</Text>
                <TextInput value={shipmentForm.shippingCost} onChangeText={(value: string) => updateShipmentField('shippingCost', value)} style={styles.input} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={THEME.text.light} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Parcel Type</Text>
              <TextInput value={shipmentForm.parcelType} onChangeText={(value: string) => updateShipmentField('parcelType', value)} style={styles.input} placeholder="Parcel" placeholderTextColor={THEME.text.light} />
            </View>

            {!!shipmentError && <Text style={styles.errorText}>{shipmentError}</Text>}

            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={submitShipment}>
                <Text style={styles.primaryText}>Create Shipment</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => setShipmentFormVisible(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {order.shipment && (
          <View style={styles.card}>
            <Text style={styles.section}>Shipment</Text>
            <Text style={styles.instructions}>Courier: {order.shipment.courier}
Tracking Number: {order.shipment.trackingNumber}
Shipment Status: {order.shipment.status}</Text>
            {order.status === 'shipped' && order.shipment.status !== 'delivered' && (
              <Pressable style={styles.secondary} onPress={() => syncShipmentStatus(order.id)}>
                <Text style={styles.secondaryText}>Refresh Mock Courier Status</Text>
              </Pressable>
            )}
          </View>
        )}

        {!isPaymentConfigured(db.paymentSettings) && (
          <Text style={styles.error}>Payment settings are not configured yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  back: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  backText: { color: THEME.primary, fontWeight: '700' },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginVertical: SPACING.lg },
  card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: THEME.border },
  image: { width: '100%', height: 220, backgroundColor: '#F3F4F6', borderRadius: BORDER_RADIUS.md },
  imagePlaceholder: { width: '100%', height: 220, backgroundColor: '#F3F4F6', borderRadius: BORDER_RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: THEME.text.light, fontSize: FONT_SIZES.sm, marginTop: SPACING.sm },
  productName: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.md },
  meta: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  total: { color: THEME.primary, fontSize: FONT_SIZES.xl, fontWeight: '800', marginTop: SPACING.md },
  section: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.sm },
  status: { color: THEME.primary, fontWeight: '700', marginBottom: SPACING.md },
  successBadge: { color: THEME.primary, fontWeight: '800', marginBottom: SPACING.md },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZES.xs },
  secondary: { backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  secondaryText: { color: THEME.primary, fontWeight: '800', fontSize: FONT_SIZES.xs },
  danger: { backgroundColor: '#FEE2E2', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  dangerText: { color: '#B91C1C', fontWeight: '800', fontSize: FONT_SIZES.xs },
  instructions: { color: THEME.text.secondary, lineHeight: 20 },
  option: { backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  optionText: { color: THEME.primary, fontWeight: '800' },
  error: { padding: SPACING['2xl'], color: THEME.status.error },
  fieldGroup: { marginTop: SPACING.md },
  label: { color: THEME.text.primary, fontWeight: '700', marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: THEME.text.primary, backgroundColor: '#FFFFFF' },
  textArea: { minHeight: 96, textAlignVertical: 'top' },
  inlineRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  inlineField: { flex: 1 },
  errorText: { color: THEME.status.error, marginTop: SPACING.md, fontWeight: '700' },
});
