import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { ChevronDown, ChevronUp, Package2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getDataSource } from '../../services/repository';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';

export default function InventoryScreen() {
  const { membership, business } = useAuth();
  const businessId = membership?.business_id ?? business?.id ?? undefined;
  const [products, setProducts] = useState<Array<{ id: string; name: string; image?: string; status?: 'ready' | 'preorder'; tripId?: string; businessId?: string; costPrice: number; sellingPrice: number }>>([]);
  const [variants, setVariants] = useState<Array<{ id: string; productId: string; size: string; stock: number }>>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [adjustment, setAdjustment] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!businessId) {
        if (active) {
          setProducts([]);
          setVariants([]);
        }
        return;
      }

      try {
        const repo = getDataSource('production');
        const productRows = await repo.products.listForBusiness(businessId);
        const variantRows = (
          await Promise.all(productRows.map((product) => repo.products.listVariantsForProduct(product.id, businessId)))
        ).flat();

        if (!active) {
          return;
        }

        setProducts(productRows);
        setVariants(variantRows);
      } catch {
        if (active) {
          setProducts([]);
          setVariants([]);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [businessId]);

  const inventorySummary = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;

    for (const product of products) {
      const productVariants = variants.filter((variant) => variant.productId === product.id);
      const totalStock = productVariants.reduce((sum, variant) => sum + Number(variant.stock ?? 0), 0);

      if (totalStock === 0) {
        outOfStock += 1;
      } else if (totalStock <= 5) {
        lowStock += 1;
      }
    }

    return { totalProducts: products.length, lowStock, outOfStock };
  }, [products, variants]);

  const inventoryItems = useMemo(() => products.map((product) => ({
    product,
    variants: variants.filter((variant) => variant.productId === product.id),
  })), [products, variants]);

  const toggleExpanded = (productId: string) => {
    setExpandedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const updateVariantStock = async (variantId: string, productId: string, delta: number) => {
    if (!businessId) {
      return;
    }

    const currentVariant = variants.find((variant) => variant.id === variantId);
    if (!currentVariant) {
      return;
    }

    const nextStock = Math.max(0, Number(currentVariant.stock ?? 0) + delta);
    const repo = getDataSource('production');
    const updated = await repo.products.updateVariant({
      variantId,
      businessId,
      productId,
      stock: nextStock,
    });

    if (!updated) {
      return;
    }

    setVariants((prev) => prev.map((variant) => (variant.id === variantId ? { ...variant, stock: updated.stock } : variant)));
  };

  const deleteVariant = async (variantId: string, productId: string) => {
    if (!businessId) {
      return;
    }

    Alert.alert(
      'Delete variant?',
      'This will remove the selected size variant from this business. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const repo = getDataSource('production');
            const removed = await repo.products.deleteVariant(variantId, businessId, productId);
            if (!removed) {
              Alert.alert('Delete failed', 'The variant could not be deleted. Check that you have permission and that it belongs to this business.');
              return;
            }

            setVariants((prev) => prev.filter((variant) => variant.id !== variantId));
            setExpandedItems((prev) => prev.filter((id) => id !== productId));
          },
        },
      ]
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
          <StatCard label="Total Products" value={String(inventorySummary.totalProducts)} variant="primary" />
          <StatCard label="Low Stock" value={String(inventorySummary.lowStock)} variant="warning" />
          <StatCard label="Out of Stock" value={String(inventorySummary.outOfStock)} />
        </View>

        <View style={styles.itemsContainer}>
          {inventoryItems.map(({ product, variants: productVariants }) => {
            const totalStock = productVariants.reduce((sum, variant) => sum + variant.stock, 0);
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
                    {productVariants.map((variant) => (
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
                              void updateVariantStock(variant.id, product.id, amount);
                            }}
                          >
                            <Text style={styles.smallButtonText}>+</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.smallButton}
                            onPress={() => {
                              const amount = Number(adjustment[variant.id] ?? '1');
                              void updateVariantStock(variant.id, product.id, -amount);
                            }}
                          >
                            <Text style={styles.smallButtonText}>-</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.smallButton, styles.deleteButton]}
                            onPress={() => {
                              void deleteVariant(variant.id, product.id);
                            }}
                          >
                            <Text style={styles.smallButtonText}>Delete</Text>
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
  safeArea: { flex: 1, backgroundColor: THEME.background },
  container: { flex: 1, backgroundColor: THEME.background },
  content: { paddingHorizontal: SPACING['2xl'], paddingTop: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  heroCard: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...THEME.shadow.medium },
  eyebrow: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: SPACING.xs },
  heroTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: '700', color: THEME.text.primary },
  heroSubtitle: { fontSize: FONT_SIZES.sm, color: THEME.text.secondary, marginTop: SPACING.xs },
  heroIcon: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 999, backgroundColor: '#F5F3FF' },
  statsContainer: { marginBottom: SPACING.lg },
  itemsContainer: { marginBottom: SPACING.xl },
  itemCard: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.md, overflow: 'hidden', ...THEME.shadow.medium },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZES.base, fontWeight: '700', color: THEME.text.primary },
  itemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  itemStock: { fontSize: FONT_SIZES.sm, color: THEME.text.secondary },
  itemDetails: { backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: THEME.border, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  sizeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: THEME.border },
  sizeLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: THEME.text.secondary },
  sizeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, alignItems: 'center' },
  sizeText: { fontSize: FONT_SIZES.sm, color: THEME.text.primary },
  stockActions: { flexDirection: 'row', alignItems: 'center' },
  qtyInput: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minWidth: 48, marginHorizontal: SPACING.sm, color: THEME.text.primary },
  smallButton: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, marginLeft: SPACING.xs },
  deleteButton: { backgroundColor: THEME.status.error, paddingHorizontal: SPACING.sm, minWidth: 64 },
  smallButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
