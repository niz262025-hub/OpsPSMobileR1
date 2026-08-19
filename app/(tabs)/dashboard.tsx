import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type SummaryState = {
  todayProfit: number;
  monthProfit: number;
  pendingOrders: number;
};

type PendingOrder = {
  id: string;
  orderNo?: string;
  status?: string;
  customerName?: string;
  createdAt?: any;
  total?: number;
};

const currencyFormatter = new Intl.NumberFormat('en-MY', {
  style: 'currency',
  currency: 'MYR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function asNumber(value: any) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getDateValue(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function isInRange(dateValue: Date | null, period: 'today' | 'month') {
  if (!dateValue) return false;
  const now = new Date();

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return dateValue >= start;
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return dateValue >= start;
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<SummaryState>({
    todayProfit: 0,
    monthProfit: 0,
    pendingOrders: 0,
  });

  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setStats({ todayProfit: 0, monthProfit: 0, pendingOrders: 0 });
      setPendingOrders([]);
      return;
    }

    const ordersQuery = query(collection(db, 'orders'), where('ownerId', '==', user.uid));
    const financeQuery = query(collection(db, 'financeTransactions'), where('ownerId', '==', user.uid));

    let todayProfit = 0;
    let monthProfit = 0;
    let pendingOrdersCount = 0;

    const updateStats = () => {
      setStats({
        todayProfit,
        monthProfit,
        pendingOrders: pendingOrdersCount,
      });
    };

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orders: PendingOrder[] = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Partial<PendingOrder>),
        }))
        .filter((order) => {
          const status = String(order.status || 'pending');
          const normalized = status.toLowerCase();
          return normalized !== 'completed' && normalized !== 'cancelled' && normalized !== 'shipped';
        })
        .sort((a, b) => {
          const aDate = getDateValue(a.createdAt)?.getTime?.() ?? 0;
          const bDate = getDateValue(b.createdAt)?.getTime?.() ?? 0;
          return bDate - aDate;
        });

      pendingOrdersCount = orders.length;
      setPendingOrders(orders);
      updateStats();
    });

    const unsubscribeFinance = onSnapshot(financeQuery, (snapshot) => {
      const rows = snapshot.docs.map((docSnap) => docSnap.data());
      const todayIncome = rows.filter((row) => row.type === 'income' && isInRange(getDateValue(row.date || row.createdAt), 'today'))
        .reduce((sum, row) => sum + asNumber(row.amount), 0);
      const monthIncome = rows.filter((row) => row.type === 'income' && isInRange(getDateValue(row.date || row.createdAt), 'month'))
        .reduce((sum, row) => sum + asNumber(row.amount), 0);
      const todayExpenses = rows.filter((row) => (row.type === 'expense' || row.type === 'purchase' || row.type === 'withdrawal') && isInRange(getDateValue(row.date || row.createdAt), 'today'))
        .reduce((sum, row) => sum + asNumber(row.amount), 0);
      const monthExpenses = rows.filter((row) => (row.type === 'expense' || row.type === 'purchase' || row.type === 'withdrawal') && isInRange(getDateValue(row.date || row.createdAt), 'month'))
        .reduce((sum, row) => sum + asNumber(row.amount), 0);

      todayProfit = todayIncome - todayExpenses;
      monthProfit = monthIncome - monthExpenses;
      updateStats();
    });

    return () => {
      unsubscribeOrders();
      unsubscribeFinance();
    };
  }, [user?.uid]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Profit Today</Text>
            <Text style={styles.money}>{formatCurrency(stats.todayProfit)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Profit This Month</Text>
            <Text style={styles.money}>{formatCurrency(stats.monthProfit)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Pending Orders</Text>
            <Text style={styles.number}>{stats.pendingOrders}</Text>
          </View>
        </View>

        <View style={styles.pendingContainer}>
          <Text style={styles.pendingTitle}>Pending Orders</Text>
          {pendingOrders.length === 0 ? (
            <Text style={styles.emptyText}>No pending orders</Text>
          ) : (
            pendingOrders.map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderLabel}>{order.orderNo || `Order ${order.id.slice(0, 6)}`}</Text>
                  <Text style={styles.orderStatus}>{order.status || 'Pending'}</Text>
                </View>

                <View style={styles.orderMetaRight}>
                  <Text style={styles.orderCustomer}>{order.customerName || 'Customer'}</Text>
                  <Text style={styles.orderAmount}>{formatCurrency(asNumber(order.total))}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },

  card: {
    flex: 1,
    minWidth: 180,
    minHeight: 110,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAEAF3',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  money: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#181145',
  },

  number: {
    marginTop: 10,
    fontSize: 26,
    fontWeight: '900',
    color: '#181145',
  },

  pendingContainer: {
    width: '100%',
  },

  pendingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#181145',
    marginBottom: 12,
  },

  orderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  orderMeta: {
    flex: 1,
    paddingRight: 12,
  },

  orderMetaRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  orderLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#181145',
  },

  orderStatus: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  orderCustomer: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '700',
  },

  orderAmount: {
    marginTop: 4,
    fontSize: 13,
    color: '#181145',
    fontWeight: '900',
  },

  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 8,
  },
});