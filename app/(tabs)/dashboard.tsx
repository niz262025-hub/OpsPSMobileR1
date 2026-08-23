import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { SectionHeader } from '../../components/SectionHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { getDashboardCounts, useMockDatabase } from '../../services/mockDatabase';

function getDashboardOrderStatusLabel(order: { requestStatus?: string; status?: string }) {
  const canonical = order.requestStatus ?? order.status ?? 'PENDING_AVAILABILITY';

  const map: Record<string, string> = {
    PENDING_AVAILABILITY: 'Pending to Buy',
    AVAILABLE: 'Available',
    PENDING_PAYMENT: 'Pending to Pay',
    PAYMENT_REQUESTED: 'Pending to Pay',
    PAY_LATER_OFFERED: 'Pending to Pay',
    OUT_OF_STOCK: 'Out of Stock',
    PAYMENT_REQUIRED: 'Pending to Pay',
    PAYMENT_RECEIVED: 'Pending to Pack',
    PACKING: 'Pending to Ship',
    SHIPPED: 'Pending to Deliver',
    DELIVERED: 'Delivered',
    PAID: 'Delivered',
    RECEIPT_GENERATED: 'Pending to Pack',
    ORDER_CONFIRMED: 'Pending to Pack',
    CANCELLED: 'Cancelled',
    pending: 'Pending to Pay',
    payment_received: 'Pending to Pack',
    packing: 'Pending to Ship',
    ready: 'Pending to Ship',
    shipped: 'Pending to Deliver',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return map[canonical] ?? 'Pending to Pay';
}

function getDashboardBadgeStatus(order: { requestStatus?: string; status?: string }) {
  const canonical = order.requestStatus ?? order.status ?? 'PENDING_AVAILABILITY';

  const map: Record<string, 'pending' | 'payment_received' | 'packing' | 'shipped' | 'delivered'> = {
    PENDING_AVAILABILITY: 'pending',
    AVAILABLE: 'pending',
    PENDING_PAYMENT: 'pending',
    PAYMENT_REQUESTED: 'pending',
    PAY_LATER_OFFERED: 'pending',
    OUT_OF_STOCK: 'pending',
    PAYMENT_REQUIRED: 'pending',
    PAYMENT_RECEIVED: 'payment_received',
    PACKING: 'packing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    PAID: 'delivered',
    RECEIPT_GENERATED: 'payment_received',
    ORDER_CONFIRMED: 'payment_received',
    CANCELLED: 'pending',
    pending: 'pending',
    payment_received: 'payment_received',
    packing: 'packing',
    ready: 'packing',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'pending',
  };

  return map[canonical] ?? 'pending';
}

function formatOrderDate(order: { orderDate?: string; createdAt?: string }) {
  const value = order.orderDate ?? order.createdAt;

  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const db = useMockDatabase();
  const { currentUser } = useAuth();
  const desktop = width >= 900;
  const dashboardWidth = Math.min(Math.max(width - 48, 0), 1240);
  const tableWidth = Math.max(dashboardWidth, 926);
  const counts = getDashboardCounts(db);
  const pendingOrders = db.orders.filter((order) => order.status !== 'delivered').map((order) => ({
    id: order.id,
    customer: order.customerName,
    trip: db.trips.find((trip) => trip.id === order.tripId)?.name ?? 'Trip',
    items: String(db.orderItems.filter((item) => item.orderId === order.id).reduce((total, item) => total + item.quantity, 0)),
    amount: `RM${order.total.toFixed(2)}`,
    statusLabel: getDashboardOrderStatusLabel(order),
    badgeStatus: getDashboardBadgeStatus(order),
    orderDate: formatOrderDate(order),
  }));
  const formatCurrency = (value: number) => `RM${value.toFixed(2)}`;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.dashboard}>
        <Text style={styles.welcome}>{currentUser?.name ? `Welcome back, ${currentUser.name}` : 'Welcome back'}</Text>
        <View style={[styles.summaryRow, !desktop && styles.summaryRowMobile]}>
          <View style={[styles.summaryCard, desktop ? styles.summaryCardDesktop : styles.summaryCardMobile]}>
            <StatCard label="Sales Today" value={formatCurrency(counts.salesToday)} variant="primary" />
          </View>
          <View style={[styles.summaryCard, desktop ? styles.summaryCardDesktop : styles.summaryCardMobile]}>
            <StatCard label="Sales This Month" value={formatCurrency(counts.salesThisMonth)} variant="secondary" />
          </View>
          <View style={[styles.summaryCard, desktop ? styles.summaryCardDesktop : styles.summaryCardMobile]}>
            <StatCard label="Open Trips" value={String(counts.openTrips)} variant="success" />
          </View>
          <View style={[styles.summaryCard, desktop ? styles.summaryCardDesktop : styles.summaryCardMobile]}>
            <StatCard label="Pending Orders" value={String(counts.pendingOrders)} variant="warning" />
          </View>
        </View>

        <View style={styles.ordersSection}>
          <SectionHeader title="Pending Orders — To Deliver" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.table, { width: tableWidth }]}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.headerText, styles.orderColumn]}>Order</Text>
                <Text style={[styles.headerText, styles.customerColumn]}>Customer</Text>
                <Text style={[styles.headerText, styles.tripColumn]}>Trip</Text>
                <Text style={[styles.headerText, styles.itemsColumn]}>Items</Text>
                <Text style={[styles.headerText, styles.amountColumn]}>Amount</Text>
                <Text style={[styles.headerText, styles.statusColumn]}>Status</Text>
                <Text style={[styles.headerText, styles.actionColumn]}>Action</Text>
              </View>

              {pendingOrders.map((order) => (
                <View key={order.id} style={styles.tableRow}>
                  <Text style={[styles.cellText, styles.orderColumn, styles.orderId]}>{order.id}</Text>
                  <View style={[styles.customerColumn, styles.customerCell]}>
                    <Text style={[styles.cellText, styles.customerName]}>{order.customer}</Text>
                    <Text style={styles.dateText}>Date: {order.orderDate}</Text>
                  </View>
                  <Text style={[styles.cellText, styles.tripColumn]}>{order.trip}</Text>
                  <Text style={[styles.cellText, styles.itemsColumn]}>{order.items}</Text>
                  <Text style={[styles.cellText, styles.amountColumn, styles.amount]}>{order.amount}</Text>
                  <View style={styles.statusColumn}>
                    <StatusBadge status={order.badgeStatus} label={order.statusLabel} />
                  </View>
                  <Pressable
                    style={styles.actionColumn}
                    accessibilityRole="button"
                    onPress={() => router.push(`/order/${order.id}`)}
                  >
                    <Text style={styles.viewAction}>View</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F4FB' },
  content: { padding: 24, paddingBottom: 48 },
  dashboard: { width: '100%', maxWidth: 1240, alignSelf: 'center' },
  welcome: { color: '#29243D', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryRowMobile: { flexDirection: 'column' },
  summaryCard: { minWidth: 0 },
  summaryCardDesktop: { width: '24%' },
  summaryCardMobile: { width: '100%' },
  ordersSection: { marginTop: 14 },
  table: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E7E2F0' },
  tableRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: '#EEEAF4' },
  tableHeader: { minHeight: 46, backgroundColor: '#FBFAFD', borderTopWidth: 0 },
  headerText: { color: '#77738D', fontSize: 12, fontWeight: '800' },
  cellText: { color: '#29243D', fontSize: 14 },
  customerCell: { justifyContent: 'center' },
  customerName: { color: '#29243D', fontSize: 14 },
  dateText: { color: '#77738D', fontSize: 11, marginTop: 2 },
  orderId: { fontWeight: '800', color: '#5B2BD9' },
  amount: { fontWeight: '700' },
  orderColumn: { width: 130 },
  customerColumn: { width: 130 },
  tripColumn: { width: 170 },
  itemsColumn: { width: 70 },
  amountColumn: { width: 130 },
  statusColumn: { width: 190 },
  actionColumn: { width: 70 },
  viewAction: { color: '#5B2BD9', fontSize: 14, fontWeight: '800' },
});
