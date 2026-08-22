import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MOCK_ORDERS, MOCK_FINANCE, MOCK_INVENTORY, MOCK_TRIPS } from '../../mockData';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

type ReportType = 'pl' | 'sales' | 'expense' | 'trip' | 'inventory';

export default function ReportsScreen() {
  const [activeTab, setActiveTab] = useState<ReportType>('pl');

  const reportTabs: ReportType[] = ['pl', 'sales', 'expense', 'trip', 'inventory'];
  const tabLabels = {
    pl: 'P&L',
    sales: 'Sales',
    expense: 'Expense',
    trip: 'Trip',
    inventory: 'Inventory',
  };

  const totalSales = MOCK_ORDERS.reduce((sum, order) => sum + order.total, 0);
  const cogs = MOCK_ORDERS.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.unitPrice * 0.5 * item.quantity, 0),
    0
  );
  const expenses = MOCK_FINANCE.filter((record) => record.type === 'expense' || record.category === 'Expense').reduce((sum, record) => sum + record.amount, 0);
  const netProfit = totalSales - cogs - expenses;

  const salesByTrip = MOCK_TRIPS.map((trip) => ({
    name: trip.name,
    orders: trip.orders.length,
    total: trip.orders.reduce((sum, order) => sum + order.total, 0),
  }));

  const expensesByCategory = MOCK_FINANCE.filter((record) => record.type === 'expense' || record.category === 'Expense').reduce(
    (acc, record) => {
      const existing = acc.find((item) => item.category === record.category);
      if (existing) {
        existing.amount += record.amount;
      } else {
        acc.push({ category: record.category, amount: record.amount });
      }
      return acc;
    },
    [] as { category: string; amount: number }[]
  );

  const tripStats = MOCK_TRIPS.map((trip) => ({
    name: trip.name,
    products: trip.products.length,
    orders: trip.orders.length,
    sales: trip.orders.reduce((sum, order) => sum + order.total, 0),
  }));

  const lowStockItems = MOCK_INVENTORY.filter((item) => item.status === 'low-stock' || item.status === 'out-of-stock');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.eyebrow}>Performance</Text>
            <Text style={styles.heroTitle}>Reports</Text>
            <Text style={styles.heroSubtitle}>Inspect growth, margins and stock pressure in one place.</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {reportTabs.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{tabLabels[tab]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'pl' && (
          <View>
            <View style={styles.reportCard}><Text style={styles.reportLabel}>Sales</Text><Text style={[styles.reportValue, { color: THEME.status.success }]}>RM{totalSales.toLocaleString()}</Text></View>
            <View style={styles.reportCard}><Text style={styles.reportLabel}>COGS</Text><Text style={[styles.reportValue, { color: THEME.status.warning }]}>-RM{cogs.toLocaleString()}</Text></View>
            <View style={styles.reportCard}><Text style={styles.reportLabel}>Expenses</Text><Text style={[styles.reportValue, { color: THEME.status.error }]}>-RM{expenses.toLocaleString()}</Text></View>
            <View style={[styles.reportCard, styles.netProfitCard]}><Text style={styles.reportLabel}>Net Profit</Text><Text style={[styles.reportValue, { color: netProfit > 0 ? THEME.status.success : THEME.status.error, fontSize: FONT_SIZES['2xl'] }]}>RM{netProfit.toLocaleString()}</Text></View>
          </View>
        )}

        {activeTab === 'sales' && (
          <View>
            {salesByTrip.map((trip, idx) => (
              <View key={idx} style={styles.reportCard}>
                <Text style={styles.reportLabel}>{trip.name}</Text>
                <View style={styles.reportStats}>
                  <View>
                    <Text style={styles.statSmallLabel}>Orders</Text>
                    <Text style={styles.statSmallValue}>{trip.orders}</Text>
                  </View>
                  <View>
                    <Text style={styles.statSmallLabel}>Total Sales</Text>
                    <Text style={styles.statSmallValue}>RM{trip.total}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'expense' && (
          <View>
            {expensesByCategory.length === 0 ? (
              <Text style={styles.emptyText}>No expenses recorded</Text>
            ) : (
              expensesByCategory.map((category, idx) => (
                <View key={idx} style={styles.reportCard}>
                  <Text style={styles.reportLabel}>{category.category}</Text>
                  <Text style={[styles.reportValue, { color: THEME.status.error }]}>-RM{category.amount.toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'trip' && (
          <View>
            {tripStats.map((trip, idx) => (
              <View key={idx} style={styles.reportCard}>
                <Text style={styles.reportLabel}>{trip.name}</Text>
                <View style={styles.reportGrid}>
                  <View style={styles.reportGridItem}><Text style={styles.statSmallLabel}>Products</Text><Text style={styles.statSmallValue}>{trip.products}</Text></View>
                  <View style={styles.reportGridItem}><Text style={styles.statSmallLabel}>Orders</Text><Text style={styles.statSmallValue}>{trip.orders}</Text></View>
                  <View style={styles.reportGridItem}><Text style={styles.statSmallLabel}>Sales</Text><Text style={styles.statSmallValue}>RM{trip.sales}</Text></View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'inventory' && (
          <View>
            <View style={styles.reportCard}><Text style={styles.reportLabel}>Total Products</Text><Text style={styles.reportValue}>{MOCK_INVENTORY.length}</Text></View>
            <View style={styles.reportCard}><Text style={styles.reportLabel}>Low Stock Items</Text><Text style={[styles.reportValue, { color: THEME.status.warning }]}>{lowStockItems.length}</Text></View>
            {lowStockItems.length > 0 && (
              <View style={[styles.reportCard, styles.warningCard]}>
                <Text style={styles.warningTitle}>Items needing attention</Text>
                {lowStockItems.map((item, idx) => (
                  <View key={idx} style={styles.warningItem}>
                    <Text style={styles.warningLabel}>{item.productName}</Text>
                    <Text style={styles.warningValue}>{item.totalStock} units left</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING['3xl'],
  },
  heroCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...THEME.shadow.medium,
  },
  eyebrow: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    color: THEME.text.primary,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.secondary,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
    ...THEME.shadow.small,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  activeTab: {
    backgroundColor: THEME.primary,
  },
  tabLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: THEME.text.secondary,
  },
  activeTabLabel: {
    color: '#FFFFFF',
  },
  reportCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...THEME.shadow.small,
  },
  netProfitCard: {
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  reportLabel: {
    fontSize: FONT_SIZES.base,
    color: THEME.text.secondary,
    marginBottom: SPACING.sm,
  },
  reportValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: THEME.text.primary,
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  reportGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  reportGridItem: {
    flex: 1,
    alignItems: 'center',
  },
  statSmallLabel: {
    fontSize: FONT_SIZES.xs,
    color: THEME.text.secondary,
    marginBottom: SPACING.xs,
  },
  statSmallValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: THEME.primary,
  },
  warningCard: {
    backgroundColor: '#FFFAEB',
    borderLeftWidth: 4,
    borderLeftColor: THEME.status.warning,
  },
  warningTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: SPACING.md,
  },
  warningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningLabel: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.primary,
  },
  warningValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.status.warning,
  },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: THEME.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING['2xl'],
  },
});
