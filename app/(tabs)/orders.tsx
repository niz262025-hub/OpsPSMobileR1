import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { router } from 'expo-router';
import { db } from '../../firebase';

type Status =
  | 'New'
  | 'Pending Payment'
  | 'Ready to Pack'
  | 'Packed'
  | 'Pending to Ship'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled';

type Order = {
  id: string;

  customer?: string;
  customerName?: string;

  phone?: string;
  customerContact?: string;

  address?: string;
  customerAddress?: string;

  product?: string;
  productName?: string;

  qty?: number;
  quantity?: number;

  unitPrice?: number;

  amount?: number;
  totalAmount?: number;

  status?: Status;
  orderStatus?: Status;
  paymentStatus?: string;
  shippingStatus?: string;
  shippingMethod?: string;

  createdAt?: any;
};

const FILTERS: Array<'All' | Status> = [
  'All',
  'New',
  'Pending Payment',
  'Ready to Pack',
  'Packed',
  'Pending to Ship',
  'Shipped',
  'Completed',
  'Cancelled',
];

function getOrderStatus(order: Order): Status {
  return order.status || order.orderStatus || 'New';
}

function getCustomer(order: Order): string {
  return (
    order.customer ||
    order.customerName ||
    'Customer'
  );
}

function getProduct(order: Order): string {
  return (
    order.product ||
    order.productName ||
    'Product'
  );
}

function getQuantity(order: Order): number {
  return order.qty ?? order.quantity ?? 0;
}

function getAmount(order: Order): number {
  return order.amount ?? order.totalAmount ?? 0;
}

function getOrderDate(order: Order): string {
  if (!order.createdAt) return 'No date';
  if (typeof order.createdAt.toDate === 'function') {
    return order.createdAt.toDate().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (typeof order.createdAt === 'string') {
    return new Date(order.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (order.createdAt?.seconds) {
    return new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return 'No date';
}

function getPaymentStatus(order: Order): string {
  return order.paymentStatus || 'Pending';
}

function getShippingStatus(order: Order): string {
  return order.shippingStatus || 'Not assigned';
}

export default function OrdersScreen() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [query, setQuery] =
    useState('');

  const [filter, setFilter] =
    useState<'All' | Status>('All');

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const result: Order[] =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<
              Order,
              'id'
            >),
          }));

        result.sort((a, b) => {
          const aTime =
            a.createdAt?.seconds || 0;

          const bTime =
            b.createdAt?.seconds || 0;

          return bTime - aTime;
        });

        setOrders(result);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Orders Firestore error:',
          error
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const data = useMemo(() => {
    return orders.filter((order) => {
      const status =
        getOrderStatus(order);

      const matchesFilter =
        filter === 'All' ||
        status === filter;

      const q =
        query.trim().toLowerCase();

      const matchesQuery =
        q.length === 0 ||
        order.id
          .toLowerCase()
          .includes(q) ||
        getCustomer(order)
          .toLowerCase()
          .includes(q) ||
        getProduct(order)
          .toLowerCase()
          .includes(q);

      return (
        matchesFilter &&
        matchesQuery
      );
    });
  }, [orders, query, filter]);

  const getStatusStyle = (
    status: Status
  ) => {
    if (
      status === 'New' ||
      status === 'Pending Payment'
    ) {
      return styles.pending;
    }

    if (
      status === 'Ready to Pack' ||
      status === 'Packed'
    ) {
      return styles.packing;
    }

    if (
      status === 'Pending to Ship' ||
      status === 'Shipped'
    ) {
      return styles.shipped;
    }

    if (
      status === 'Completed'
    ) {
      return styles.delivered;
    }

    return styles.cancelled;
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#5B2BE0"
        />

        <Text
          style={styles.loadingText}
        >
          Loading orders...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Manage customer orders</Text>
        </View>

        <TouchableOpacity
          style={styles.newOrderButton}
          onPress={() => router.push('/order-form')}
        >
          <Text style={styles.newOrderText}>+ New Order</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search order, customer or product"
        placeholderTextColor="#9CA3AF"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() =>
              setFilter(f)
            }
            style={[
              styles.filterChip,
              filter === f &&
                styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f &&
                  styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>

      {data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Customer orders will appear here automatically.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/order-form')}>
            <Text style={styles.emptyButtonText}>Create Order</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: 30,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = getOrderStatus(item);
            const paymentStatus = getPaymentStatus(item);
            const shippingStatus = getShippingStatus(item);

            return (
              <Pressable
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/order-detail',
                    params: { orderId: item.id },
                  })
                }
              >
                <View style={styles.row}>
                  <Text style={styles.orderId}>#{item.id.slice(-8)}</Text>
                  <Text style={styles.amount}>RM {Number(getAmount(item)).toFixed(2)}</Text>
                </View>

                <Text style={styles.product}>{getProduct(item)}</Text>
                <Text style={styles.customer}>{getCustomer(item)}</Text>
                <Text style={styles.metaText}>{getOrderDate(item)}</Text>

                <View style={styles.summaryRow}>
                  <View style={[styles.badge, getStatusStyle(status)]}>
                    <Text style={styles.badgeText}>{status}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{paymentStatus}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{shippingStatus}</Text>
                  </View>
                </View>

                <View style={styles.bottomRow}>
                  <Text style={styles.quantity}>Qty: {getQuantity(item)}</Text>
                  <Text style={styles.viewText}>View →</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 20,
    paddingTop: 18,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },

  headerTextWrap: {
    flex: 1,
  },

  newOrderButton: {
    backgroundColor: '#5B2BE0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  newOrderText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6FA',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 5,
    color: '#6B7280',
    fontSize: 13,
  },

  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },

  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  filterChipActive: {
    backgroundColor: '#5B2BE0',
    borderColor: '#5B2BE0',
  },

  filterText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAF3',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B2BE0',
  },

  product: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  customer: {
    marginTop: 4,
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },

  metaText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },

  metaBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  metaBadgeText: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '700',
  },

  bottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    paddingTop: 10,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  pending: {
    backgroundColor: '#FEF3C7',
  },

  packing: {
    backgroundColor: '#DBEAFE',
  },

  shipped: {
    backgroundColor: '#E0F2FE',
  },

  delivered: {
    backgroundColor: '#DCFCE7',
  },

  cancelled: {
    backgroundColor: '#FEE2E2',
  },

  badgeText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 11,
  },

  quantity: {
    color: '#6B7280',
    fontSize: 12,
  },

  viewText: {
    marginLeft: 'auto',
    color: '#5B2BE0',
    fontWeight: '800',
    fontSize: 12,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EAEAF3',
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },

  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  emptyButton: {
    backgroundColor: '#5B2BE0',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 18,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
