import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getDataSource } from '../../services/repository';
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
  const { user, profile, membership, business, role } = useAuth();
  const [orders, setOrders] = useState<Array<{ id: string; customerName: string; total: number; requestStatus?: string; status?: string; tripId?: string; productId?: string; businessId?: string }>>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const repo = getDataSource('production');
      try {
        let rows: Array<{ id: string; customerName: string; total: number; requestStatus?: string; status?: string; tripId?: string; productId?: string; businessId?: string }> = [];

        if (role === 'customer' || !membership?.business_id) {
          const customerId = profile?.id ?? user?.id ?? undefined;
          const result = customerId ? await repo.orders.listForCustomer(customerId) : [];
          rows = result;
        } else if (membership.business_id) {
          rows = await repo.orders.listForBusiness(membership.business_id);
        } else if (business?.id) {
          rows = await repo.orders.listForBusiness(business.id);
        }

        if (active) {
          setOrders(rows);
        }
      } catch {
        if (active) {
          setOrders([]);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [business?.id, membership?.business_id, profile?.id, role, user?.id]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={THEME.gradientWarm} style={styles.hero}>
          <Text style={styles.eyebrow}>OPSPS ORDER HUB</Text>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Review customer requests and fulfilment status.</Text>
        </LinearGradient>

        {orders.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.empty}>No orders found for this account.</Text></View>
        ) : orders.map((order) => {
          const statusLabel = getOrderDisplayStatus(order);

          return (
            <Pressable key={order.id} style={styles.card} onPress={() => router.push(`/order/${order.id}`)}>
              <View style={styles.topRow}>
                <View style={styles.info}>
                  <Text style={styles.order}>{order.id}</Text>
                  <Text style={styles.customer}>{order.customerName}</Text>
                  <Text style={styles.meta}>Order · {order.productId ?? 'Product'}</Text>
                </View>

                <View style={styles.amountColumn}>
                  <Text style={styles.amount}>RM{Number(order.total ?? 0).toFixed(2)}</Text>
                  <View style={styles.statusChip}><Text style={styles.status}>{statusLabel}</Text></View>
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
  hero: { borderRadius: 24, padding: 18, marginBottom: 18, ...THEME.shadow.medium },
  eyebrow: { color: '#FDE7F3', fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginBottom: 6 },
  title: { color: '#FFFFFF', fontSize: FONT_SIZES['2xl'], fontWeight: '800' },
  subtitle: { color: '#F8E7FF', marginTop: SPACING.xs, marginBottom: SPACING.sm },
  card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: THEME.border, padding: SPACING.lg, marginBottom: SPACING.md, ...THEME.shadow.small },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  info: { flex: 1, marginRight: SPACING.md },
  order: { color: THEME.primary, fontWeight: '800' },
  customer: { color: THEME.text.primary, fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: SPACING.xs },
  meta: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  amountColumn: { alignItems: 'flex-end' },
  amount: { color: THEME.text.primary, fontWeight: '800', textAlign: 'right' },
  statusChip: { marginTop: SPACING.xs, backgroundColor: '#F3F0FF', borderRadius: 999, paddingHorizontal: SPACING.sm, paddingVertical: 6 },
  status: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700', textAlign: 'right' },
  viewButton: { marginTop: SPACING.md, alignSelf: 'flex-end', backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  viewButtonText: { color: '#FFFFFF', fontWeight: '700' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: THEME.border },
  empty: { color: THEME.text.secondary, marginTop: SPACING.md },
});
