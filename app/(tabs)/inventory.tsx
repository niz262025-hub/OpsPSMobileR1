import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, ChevronUp, Package2 } from 'lucide-react-native';
import { useMockDatabase, addStock, reduceStock, getInventorySummary } from '../../services/mockDatabase';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';

export default function InventoryScreen() {
  const db = useMockDatabase();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [adjustment, setAdjustment] = useState<Record<string, string>>({});

  const inventorySummary = useMemo(() => getInventorySummary(db), [db]);
  const inventoryItems = useMemo(() => db.products.map((product) => ({
    product,
    variants: db.productVariants.filter((variant) => variant.productId === product.id),
  })), [db]);

  const toggleExpanded = (productId: string) => {
    setExpandedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.eyebrow}>Stock control</Text>
            <Text style={styles.heroTitle}>Inventory</Text>
            <Text style={styles.heroSubtitle}>Review product availability and adjust stock levels in seconds.</Text>
          </View>
          <View style={styles.heroIcon}>
            <Package2 size={24} color={THEME.primary} />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <StatCard label="Total Products" value={inventorySummary.totalProducts.toString()} variant="primary" />
          <StatCard label="Low Stock" value={inventorySummary.lowStock.toString()} variant="warning" />
          <StatCard label="Out of Stock" value={inventorySummary.outOfStock.toString()} />
        </View>

        <View style={styles.itemsContainer}>
          {inventoryItems.map(({ product, variants }) => {
            const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
            const status = totalStock === 0 ? 'out-of-stock' : totalStock <= 5 ? 'low-stock' : 'in-stock';
            const expanded = expandedItems.includes(product.id);

            return (
              <View key={product.id} style={styles.itemCard}>
                <TouchableOpacity style={styles.itemHeader} onPress={() => toggleExpanded(product.id)}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{product.name}</Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemStock}>Total: {totalStock} units</Text>
                      <StatusBadge status={status as any} />
                    </View>
                  </View>
                  {expanded ? (
                    <ChevronUp size={20} color={THEME.primary} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={20} color={THEME.primary} strokeWidth={2} />
                  )}
                </TouchableOpacity>

                {expanded && (
                  <View style={styles.itemDetails}>
                    <View style={styles.sizeHeader}>
                      <Text style={styles.sizeLabel}>Size</Text>
                      <Text style={styles.sizeLabel}>Qty</Text>
                    </View>
                    {variants.map((variant) => (
                      <View key={variant.id} style={styles.sizeRow}>
                        <Text style={styles.sizeText}>{variant.size}</Text>
                        <View style={styles.stockActions}>
                          <Text style={styles.sizeText}>{variant.stock}</Text>
                          <TextInput
                            style={styles.qtyInput}
                            keyboardType="numeric"
                            value={adjustment[variant.id] ?? '1'}
                            onChangeText={(value) => setAdjustment((prev) => ({ ...prev, [variant.id]: value }))}
                            placeholderTextColor={THEME.text.light}
                          />
                          <TouchableOpacity
                            style={styles.smallButton}
                            onPress={() => {
                              const amount = Number(adjustment[variant.id] ?? '1');
                              addStock(variant.id, amount);
                            }}
                          >
                            <Text style={styles.smallButtonText}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.smallButton}
                            onPress={() => {
                              const amount = Number(adjustment[variant.id] ?? '1');
                              reduceStock(variant.id, amount);
                            }}
                          >
                            <Text style={styles.smallButtonText}>-</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...THEME.shadow.medium,
  },
  eyebrow: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
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
  heroIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#F5F3FF',
  },
  statsContainer: {
    marginBottom: SPACING.lg,
  },
  itemsContainer: {
    marginBottom: SPACING.xl,
  },
  itemCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...THEME.shadow.medium,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.text.primary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  itemStock: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.secondary,
  },
  itemDetails: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  sizeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.secondary,
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  sizeText: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.primary,
  },
  stockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    minWidth: 48,
    marginHorizontal: SPACING.sm,
    color: THEME.text.primary,
  },
  smallButton: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
