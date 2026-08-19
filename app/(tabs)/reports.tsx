import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type FilterKey = 'today' | 'week' | 'month' | 'all';

type OrderRecord = {
  id: string;
  ownerId?: string;
  productId?: string;
  tripId?: string;
  productName?: string;
  tripName?: string;
  totalAmount?: number;
  amount?: number;
  quantity?: number;
  qty?: number;
  orderStatus?: string;
  status?: string;
  createdAt?: any;
};

type ProductRecord = {
  id: string;
  ownerId?: string;
  name?: string;
  costPrice?: number;
  sellingPrice?: number;
  quantity?: number;
  stock?: number;
};

type ReportSummary = {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  salesByProduct: Array<{ name: string; total: number; quantity: number; count: number }>;
  salesByTrip: Array<{ name: string; total: number; count: number }>;
  salesByDate: Array<{ label: string; total: number }>;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  totalProducts: number;
  totalStockUnits: number;
  inventoryCostValue: number;
  inventorySellingValue: number;
  potentialProfit: number;
};

const filterOptions: Array<{ key: FilterKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const EMPTY_SUMMARY: ReportSummary = {
  totalSales: 0,
  totalOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  salesByProduct: [],
  salesByTrip: [],
  salesByDate: [],
  revenue: 0,
  costOfGoodsSold: 0,
  grossProfit: 0,
  operatingExpenses: 0,
  netProfit: 0,
  totalProducts: 0,
  totalStockUnits: 0,
  inventoryCostValue: 0,
  inventorySellingValue: 0,
  potentialProfit: 0,
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

function getOrderAmount(order: OrderRecord) {
  return Number(order.totalAmount ?? order.amount ?? 0) || 0;
}

function getOrderQuantity(order: OrderRecord) {
  return Number(order.quantity ?? order.qty ?? 0) || 0;
}

function getOrderStatus(order: OrderRecord) {
  return String(order.orderStatus ?? order.status ?? 'New');
}

function getDateValue(value: any) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'number') return new Date(value);
  if (value && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
}

function matchesFilter(dateValue: Date | null, filter: FilterKey) {
  if (!dateValue) return true;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') {
    return dateValue >= startOfToday;
  }

  if (filter === 'week') {
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    return dateValue >= startOfWeek;
  }

  if (filter === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return dateValue >= startOfMonth;
  }

  return true;
}

function buildDateLabel(dateValue: Date | null) {
  if (!dateValue) return 'Unknown';
  return dateValue.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Reports() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReportSummary>(EMPTY_SUMMARY);

  useEffect(() => {
    let active = true;

    async function fetchReports() {
      if (!user?.uid) {
        if (active) {
          setSummary(EMPTY_SUMMARY);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [orderSnap, productSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('ownerId', '==', user.uid))),
          getDocs(query(collection(db, 'products'), where('ownerId', '==', user.uid))),
        ]);

        const orders: OrderRecord[] = orderSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<OrderRecord, 'id'>),
        }));

        const products: ProductRecord[] = productSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ProductRecord, 'id'>),
        }));

        const productMap = new Map<string, ProductRecord>();
        products.forEach((product) => {
          productMap.set(product.id, product);
        });

        const filteredOrders = orders.filter((order) => {
          const dateValue = getDateValue(order.createdAt);
          return matchesFilter(dateValue, filter);
        });

        const validOrders = filteredOrders.filter((order) => {
          const status = getOrderStatus(order).toLowerCase();
          return status !== 'cancelled';
        });

        const totalSales = validOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);
        const totalOrders = filteredOrders.length;
        const completedOrders = filteredOrders.filter((order) => getOrderStatus(order).toLowerCase() === 'completed').length;
        const cancelledOrders = filteredOrders.filter((order) => getOrderStatus(order).toLowerCase() === 'cancelled').length;

        const salesByProductMap = new Map<string, { name: string; total: number; quantity: number; count: number }>();
        validOrders.forEach((order) => {
          const key = (order.productName || 'Unknown Product').trim() || 'Unknown Product';
          const entry = salesByProductMap.get(key) ?? { name: key, total: 0, quantity: 0, count: 0 };
          entry.total += getOrderAmount(order);
          entry.quantity += getOrderQuantity(order);
          entry.count += 1;
          salesByProductMap.set(key, entry);
        });

        const salesByTripMap = new Map<string, { name: string; total: number; count: number }>();
        validOrders.forEach((order) => {
          const key = (order.tripName || order.tripId || 'Unassigned Trip').trim() || 'Unassigned Trip';
          const entry = salesByTripMap.get(key) ?? { name: key, total: 0, count: 0 };
          entry.total += getOrderAmount(order);
          entry.count += 1;
          salesByTripMap.set(key, entry);
        });

        const salesByDateMap = new Map<string, number>();
        validOrders.forEach((order) => {
          const dateValue = getDateValue(order.createdAt);
          const label = buildDateLabel(dateValue);
          salesByDateMap.set(label, (salesByDateMap.get(label) || 0) + getOrderAmount(order));
        });

        const revenue = totalSales;
        const costOfGoodsSold = validOrders.reduce((sum, order) => {
          const productId = order.productId;
          if (!productId) return sum;
          const product = productMap.get(productId);
          if (!product) return sum;
          return sum + (Number(product.costPrice ?? 0) * getOrderQuantity(order));
        }, 0);
        const grossProfit = revenue - costOfGoodsSold;
        const operatingExpenses = 0;
        const netProfit = grossProfit - operatingExpenses;

        const purchaseCost = products.reduce((sum, product) => sum + ((Number(product.costPrice ?? 0) || 0) * (Number(product.quantity ?? product.stock ?? 0) || 0)), 0);
        const totalProducts = products.length;
        const totalStockUnits = products.reduce((sum, product) => sum + (Number(product.quantity ?? product.stock ?? 0) || 0), 0);
        const inventoryCostValue = purchaseCost;
        const inventorySellingValue = products.reduce((sum, product) => sum + ((Number(product.sellingPrice ?? 0) || 0) * (Number(product.quantity ?? product.stock ?? 0) || 0)), 0);
        const potentialProfit = inventorySellingValue - inventoryCostValue;

        const salesPaid = validOrders.filter((order) => {
          const status = getOrderStatus(order).toLowerCase();
          return ['completed', 'shipped', 'ready to pack', 'packed', 'pending to ship'].includes(status);
        }).reduce((sum, order) => sum + getOrderAmount(order), 0);
        const salesPayLater = validOrders.filter((order) => getOrderStatus(order).toLowerCase() === 'pending payment').reduce((sum, order) => sum + getOrderAmount(order), 0);
        const salesOutstanding = salesPayLater;

        const nextSummary: ReportSummary = {
          totalSales: revenue,
          totalOrders: totalOrders,
          completedOrders,
          cancelledOrders,
          salesByProduct: Array.from(salesByProductMap.values()).sort((a, b) => b.total - a.total),
          salesByTrip: Array.from(salesByTripMap.values()).sort((a, b) => b.total - a.total),
          salesByDate: Array.from(salesByDateMap.entries())
            .map(([label, total]) => ({ label, total }))
            .sort((a, b) => b.total - a.total),
          revenue,
          costOfGoodsSold,
          grossProfit,
          operatingExpenses,
          netProfit,
          totalProducts,
          totalStockUnits,
          inventoryCostValue,
          inventorySellingValue,
          potentialProfit,
        };

        if (active) setSummary(nextSummary);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load reports.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchReports();

    return () => {
      active = false;
    };
  }, [user?.uid, filter]);

  const salesByProduct = useMemo(() => summary.salesByProduct.slice(0, 5), [summary.salesByProduct]);
  const salesByTrip = useMemo(() => summary.salesByTrip.slice(0, 5), [summary.salesByTrip]);

  if (!user?.uid) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Authentication required</Text>
        <Text style={styles.emptyText}>Sign in to view sales and inventory reports.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>OpsPS</Text>
            <Text style={styles.title}>Reports</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filterOptions.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.filterButton, filter === item.key && styles.filterButtonActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5B2BD9" />
            <Text style={styles.loadingText}>Loading report data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Report unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <StatCard label="Total Sales" value={formatCurrency(summary.totalSales)} accent="#5B2BD9" />
              <StatCard label="Total Orders" value={String(summary.totalOrders)} accent="#EC4C99" />
              <StatCard label="Completed" value={String(summary.completedOrders)} accent="#5B2BD9" />
              <StatCard label="Cancelled" value={String(summary.cancelledOrders)} accent="#EC4C99" />
            </View>

            <Section title="P&L — Profit & Loss">
              <MetricRow label="Revenue / Sales" value={formatCurrency(summary.revenue)} />
              <MetricRow label="Cost of goods sold" value={formatCurrency(summary.costOfGoodsSold)} />
              <MetricRow label="Gross Profit" value={formatCurrency(summary.grossProfit)} highlight />
              <MetricRow label="Operating Expenses" value={formatCurrency(summary.operatingExpenses)} />
              <MetricRow label="Net Profit / Loss" value={formatCurrency(summary.netProfit)} highlight />
            </Section>

            <Section title="Sales Report">
              <MetricRow label="Sales" value={formatCurrency(summary.revenue)} />
              <MetricRow label="Paid" value={formatCurrency(summary.revenue)} />
              <MetricRow label="Partial" value={formatCurrency(0)} />
              <MetricRow label="Pay Later" value={formatCurrency(0)} />
              <MetricRow label="Outstanding" value={formatCurrency(0)} />
            </Section>

            <Section title="Purchase Report">
              <MetricRow label="Purchases" value={formatCurrency(summary.inventoryCostValue)} />
              <MetricRow label="Customer-related purchases" value={formatCurrency(summary.revenue)} />
              <MetricRow label="Stock purchases" value={formatCurrency(summary.inventoryCostValue)} />
              <MetricRow label="Purchase cost" value={formatCurrency(summary.inventoryCostValue)} highlight />
            </Section>

            <Section title="Expense Report">
              <MetricRow label="Expense by category" value={formatCurrency(summary.operatingExpenses)} />
              <MetricRow label="Expense by trip" value={formatCurrency(summary.operatingExpenses)} />
              <MetricRow label="Total expenses" value={formatCurrency(summary.operatingExpenses)} highlight />
            </Section>

            <Section title="Inventory Report">
              <MetricRow label="Stock in" value={String(summary.totalStockUnits)} />
              <MetricRow label="Stock out" value={String(summary.totalOrders)} />
              <MetricRow label="Current stock" value={String(summary.totalStockUnits)} />
              <MetricRow label="Inventory cost / value" value={formatCurrency(summary.inventoryCostValue)} highlight />
            </Section>

            <Section title="Order Report">
              <MetricRow label="Orders" value={String(summary.totalOrders)} />
              <MetricRow label="Pending" value={String(summary.totalOrders - summary.completedOrders - summary.cancelledOrders)} />
              <MetricRow label="Purchased" value={String(summary.completedOrders)} />
              <MetricRow label="Packing" value={String(0)} />
              <MetricRow label="Ready to Ship" value={String(0)} />
              <MetricRow label="Shipped" value={String(0)} />
              <MetricRow label="Completed" value={String(summary.completedOrders)} highlight />
            </Section>

            <Section title="Trip Report">
              {salesByTrip.length === 0 ? (
                <Text style={styles.emptyText}>No trip performance data in this range.</Text>
              ) : (
                salesByTrip.map((item) => (
                  <MetricRow key={item.name} label={item.name} value={`${formatCurrency(item.total)} · ${item.count} order(s)`} />
                ))
              )}
            </Section>

            <Section title="Sales by Product">
              {salesByProduct.length === 0 ? (
                <Text style={styles.emptyText}>No product sales in this date range.</Text>
              ) : (
                salesByProduct.map((item) => (
                  <MetricRow key={item.name} label={item.name} value={`${formatCurrency(item.total)} · ${item.quantity} unit(s)`} />
                ))
              )}
            </Section>

            <Section title="Sales by Date">
              {summary.salesByDate.length === 0 ? (
                <Text style={styles.emptyText}>No sales recorded in this range.</Text>
              ) : (
                summary.salesByDate.map((item) => (
                  <MetricRow key={item.label} label={item.label} value={formatCurrency(item.total)} />
                ))
              )}
            </Section>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={[styles.statCard, { borderColor: accent }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MetricRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricLabel, highlight && styles.highlightText]}>{label}</Text>
      <Text style={[styles.metricValue, highlight && styles.highlightText]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: '#5B2BD9',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#181145',
    fontSize: 30,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E1FB',
  },
  filterButtonActive: {
    backgroundColor: '#5B2BD9',
    borderColor: '#5B2BD9',
  },
  filterText: {
    color: '#4F4768',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statLabel: {
    color: '#6B6B8A',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EEF8',
  },
  metricLabel: {
    color: '#4F4768',
    fontSize: 13,
    flex: 1,
    paddingRight: 12,
  },
  metricValue: {
    color: '#181145',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  highlightText: {
    color: '#5B2BD9',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  loadingText: {
    color: '#4F4768',
    marginTop: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FFF1F5',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F6C8D8',
  },
  errorTitle: {
    color: '#B42318',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  errorText: {
    color: '#7A1B36',
    fontSize: 13,
  },
  emptyTitle: {
    color: '#181145',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptyText: {
    color: '#6B6B8A',
    fontSize: 13,
  },
});
