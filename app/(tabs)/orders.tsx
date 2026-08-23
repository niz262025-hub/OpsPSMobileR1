import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMockDatabase } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

function getOrderDisplayStatus(order: { requestStatus?: string; status?: string; paymentStatus?: string; availabilityStatus?: string }) {
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

  if (map[canonical]) {
    return map[canonical];
  }

  if (order.availabilityStatus === 'confirmed') {
    return order.paymentStatus === 'success' || order.paymentStatus === 'paid' ? 'Payment Received' : 'Pending Payment';
  }

  return 'Pending Availability';
}

export default function OrdersScreen() {
  const db = useMockDatabase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Review customer requests and fulfilment status.</Text>

        {db.orders.map((order) => {
          const orderItem = db.orderItems.find((item) => item.orderId === order.id);
          const variant = orderItem ? db.productVariants.find((item) => item.id === orderItem.productVariantId) : undefined;
          const product = variant ? db.products.find((item) => item.id === variant.productId) : undefined;
          const trip = db.trips.find((item) => item.id === order.tripId);
          const statusLabel = getOrderDisplayStatus(order);

          return (
            <Pressable key={order.id} style={styles.card} onPress={() => router.push(`/order/${order.id}`)}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text style={styles.order}>{order.id}</Text>
                  <Text style={styles.customer}>{order.customerName}</Text>
                  <Text style={styles.meta}>{product?.name ?? 'Product'} · {trip?.name ?? 'Trip'}</Text>
                </View>

                <View style={styles.amountColumn}>
                  <Text style={styles.amount}>RM{order.total.toFixed(2)}</Text>
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text style={styles.status}>{statusLabel}</Text>
                </View>
              </View>

              <Pressable style={styles.viewButton} onPress={(event) => {
                event.stopPropagation();
                router.push(`/order/${order.id}`);
              }}>
                <Text style={styles.viewButtonText}>View</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800' },
  subtitle: { color: THEME.text.secondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: THEME.border, padding: SPACING.lg, marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1, marginRight: SPACING.md },
  order: { color: THEME.primary, fontWeight: '800' },
  customer: { color: THEME.text.primary, fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: SPACING.xs },
  meta: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  amountColumn: { alignItems: 'flex-end' },
  amount: { color: THEME.text.primary, fontWeight: '800', textAlign: 'right' },
  statusLabel: { color: THEME.text.secondary, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm },
  status: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700', textAlign: 'right', marginTop: SPACING.xs },
  viewButton: { marginTop: SPACING.md, alignSelf: 'flex-end', backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  viewButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
