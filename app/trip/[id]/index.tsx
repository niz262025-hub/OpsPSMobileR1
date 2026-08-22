import React, { useMemo, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Package, ShoppingBag } from 'lucide-react-native';
import { useMockDatabase, markBuyListItemBought, createBuyListItem, updateBuyListItem, deleteBuyListItem, confirmOrderAvailability, setOrderPaymentMode, recordPayment, verifyPayment, confirmPurchase, markOrderPacked, createMockShipment, markOrderShipped, getTripProducts, getTripOrders, getTripBuyListItems, getProductVariant, getProduct } from '../../../services/mockDatabase';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../theme';
import { StatusBadge } from '../../../components/StatusBadge';

type TabType = 'products' | 'orders' | 'buylist';

function getTripStatusBadge(status: 'planning' | 'open' | 'completed') {
  const badgeStatus = status === 'planning' ? 'pending' : status === 'open' ? 'in-stock' : 'delivered';
  return <StatusBadge status={badgeStatus} label={status.charAt(0).toUpperCase() + status.slice(1)} />;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString();
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useMockDatabase();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [buyItemName, setBuyItemName] = useState('');
  const [buyItemQuantity, setBuyItemQuantity] = useState('1');
  const [editingBuyItem, setEditingBuyItem] = useState<string | null>(null);
  const trip = db.trips.find((entry: { id: string }) => entry.id === id);
  const tripProducts = useMemo(() => getTripProducts(trip?.id ?? '', db), [trip, db]);
  const tripOrders = useMemo(() => getTripOrders(trip?.id ?? '', db), [trip, db]);
  const buyListItems = useMemo(() => getTripBuyListItems(trip?.id ?? '', db), [trip, db]);

  if (!trip) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Trip not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerLabel}>Trip detail</Text>
          <Text style={styles.headerTitle}>{trip.name}</Text>
          <Text style={styles.headerMeta}>{trip.destination} · {formatDate(trip.tripDate)}</Text>
        </View>
        {getTripStatusBadge(trip.status)}
      </View>

      <View style={styles.summary}>
        <SummaryItem label="Orders" value={tripOrders.length} />
        <SummaryItem label="Products" value={tripProducts.length} />
        <SummaryItem label="Buy List" value={buyListItems.length} />
      </View>

      <View style={styles.tabsContainer}>
        {(['products', 'orders', 'buylist'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
              {tab === 'buylist' ? 'Buy List' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'products' && (
          <View>
            {tripProducts.length === 0 ? (
              <View>
                <Text style={styles.emptyText}>No products added yet</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={() => router.push({ pathname: '/(tabs)/marketplace', params: { tripId: trip.id } })}>
                  <Text style={styles.uploadButtonText}>+ Upload Product</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity style={styles.uploadButton} onPress={() => router.push({ pathname: '/(tabs)/marketplace', params: { tripId: trip.id } })}>
                  <Text style={styles.uploadButtonText}>+ Upload Product</Text>
                </TouchableOpacity>
                {tripProducts.map((product: { id: string; name: string; image: string; status: string; costPrice: number; sellingPrice: number }) => {
                const variants = db.productVariants.filter((variant: { productId: string }) => variant.productId === product.id);
                const totalQuantity = variants.reduce((sum, variant) => sum + variant.stock, 0);
                return (
                  <View key={product.id} style={styles.card}>
                    <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="contain" />
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>{product.name}</Text>
                        <StatusBadge status={product.status === 'ready' ? 'in-stock' : 'low-stock'} />
                      </View>
                      <View style={styles.iconPill}>
                        <ShoppingBag size={16} color={THEME.primary} />
                      </View>
                    </View>

                    <View style={styles.cardStats}>
                      <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Cost</Text>
                        <Text style={styles.statValue}>RM{product.costPrice}</Text>
                      </View>
                      <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Selling</Text>
                        <Text style={styles.statValue}>RM{product.sellingPrice}</Text>
                      </View>
                      <View style={styles.statBlock}>
                        <Text style={styles.statLabel}>Qty</Text>
                        <Text style={styles.statValue}>{totalQuantity}</Text>
                      </View>
                    </View>

                    <View style={styles.sizeGrid}>
                      {variants.map((variant: { id: string; size: string; stock: number }) => (
                        <View key={variant.id} style={styles.sizeItem}>
                          <Text style={styles.sizeLabel}>{variant.size}</Text>
                          <Text style={styles.sizeQty}>{variant.stock}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            {tripOrders.length === 0 ? (
              <Text style={styles.emptyText}>No orders yet</Text>
            ) : (
              tripOrders.map((order) => {
                const orderItems = db.orderItems.filter((item: { orderId: string }) => item.orderId === order.id);
                return (
                  <View key={order.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleWrap}>
                        <Text style={styles.cardTitle}>{order.id}</Text>
                        <Text style={styles.orderCustomer}>{order.customerName}</Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>

                    <View style={styles.orderItems}>
                      {orderItems.map((item: { productVariantId: string; quantity: number }, idx: number) => {
                        const variant = db.productVariants.find((candidate: { id: string }) => candidate.id === item.productVariantId);
                        const product = variant ? db.products.find((candidate: { id: string }) => candidate.id === variant.productId) : undefined;
                        return (
                          <View key={idx} style={styles.orderItem}>
                            <Text style={styles.itemName}>{product?.name ?? 'Product'}</Text>
                            <Text style={styles.itemDetail}>{variant?.size} × {item.quantity}</Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>Total RM{order.total.toLocaleString()}</Text>
                      {order.status === 'ready' && (
                        <TouchableOpacity style={styles.shippingBtn} onPress={() => router.push('/shipping/generate')}>
                          <Package size={16} color="#FFFFFF" strokeWidth={2} />
                          <Text style={styles.shippingBtnText}>Ship Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity style={styles.smallAction} onPress={() => router.push(`/order/${order.id}`)}><Text style={styles.smallActionText}>View Order</Text></TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'buylist' && (
          <View>
            <Text style={styles.sectionLabel}>Buy List</Text>
            <View style={styles.addBuyListRow}>
                  <TextInput style={styles.buyInput} value={buyItemName} onChangeText={setBuyItemName} placeholder="Item name" placeholderTextColor={THEME.text.light} />
                  <TextInput style={styles.quantityInput} value={buyItemQuantity} onChangeText={setBuyItemQuantity} keyboardType="numeric" placeholder="Qty" placeholderTextColor={THEME.text.light} />
                  <TouchableOpacity style={styles.addBuyButton} onPress={() => { if (buyItemName.trim()) { createBuyListItem({ tripId: trip.id, itemName: buyItemName, quantity: Number(buyItemQuantity) || 1 }); setBuyItemName(''); setBuyItemQuantity('1'); } }}><Text style={styles.addBuyText}>+ Add Item</Text></TouchableOpacity>
            </View>
            {buyListItems.length === 0 ? (
              <Text style={styles.emptyText}>Buy list is clear</Text>
            ) : (
              <View>
                {buyListItems.map((item) => {
                  const variant = item.productVariantId ? getProductVariant(item.productVariantId, db) : undefined;
                  const product = variant ? getProduct(variant.productId, db) : undefined;
                  return (
                    <View key={item.id} style={styles.card}>
                      <Text style={styles.cardTitle}>{item.itemName ?? product?.name ?? 'Item'}</Text>
                      <View style={styles.buyListRow}>
                        <View>
                          <Text style={styles.buyListLabel}>{variant?.size ? `Size ${variant.size}` : item.purchased ? 'Bought' : 'To Buy'}</Text>
                          <Text style={styles.buyListDetail}>Needed: {item.quantity}</Text>
                        </View>
                        <View style={styles.buyActions}>
                          {!item.purchased && <TouchableOpacity style={styles.markBoughtBtn} onPress={() => { const success = markBuyListItemBought(item.id); if (success) Alert.alert('Success', 'Buy list item marked as bought.'); }}><CheckCircle2 size={16} color={THEME.status.success} strokeWidth={2} /><Text style={styles.markBoughtText}>Mark Bought</Text></TouchableOpacity>}
                          <TouchableOpacity onPress={() => { setEditingBuyItem(item.id); setBuyItemName(item.itemName ?? product?.name ?? ''); setBuyItemQuantity(String(item.quantity)); }}><Text style={styles.editBuyText}>Edit</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteBuyListItem(item.id)}><Text style={styles.deleteBuyText}>Delete</Text></TouchableOpacity>
                        </View>
                      </View>
                      {editingBuyItem === item.id && <View style={styles.editRow}><TextInput style={styles.buyInput} value={buyItemName} onChangeText={setBuyItemName} /><TextInput style={styles.quantityInput} value={buyItemQuantity} onChangeText={setBuyItemQuantity} keyboardType="numeric" /><TouchableOpacity style={styles.addBuyButton} onPress={() => { updateBuyListItem(item.id, { itemName: buyItemName, quantity: Number(buyItemQuantity) || 1 }); setEditingBuyItem(null); }}><Text style={styles.addBuyText}>Save</Text></TouchableOpacity></View>}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  headerLabel: {
    color: '#EDE9FE',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: SPACING.xs,
  },
  headerMeta: {
    color: '#EDE9FE',
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: SPACING.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: THEME.border,
  },
  summaryValue: {
    color: THEME.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
  },
  summaryLabel: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  activeTab: {
    backgroundColor: '#F5F3FF',
  },
  tabLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.secondary,
  },
  activeTabLabel: {
    color: THEME.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...THEME.shadow.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: SPACING.sm,
  },
  iconPill: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#F5F3FF',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    marginBottom: SPACING.md,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: THEME.text.secondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.primary,
  },
  sizeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sizeItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F8FAFC',
    marginHorizontal: SPACING.xs,
  },
  sizeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.secondary,
  },
  sizeQty: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: THEME.text.primary,
    marginTop: SPACING.xs,
  },
  orderCustomer: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.secondary,
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  orderItem: {
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  itemDetail: {
    fontSize: FONT_SIZES.xs,
    color: THEME.text.secondary,
    marginTop: SPACING.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.primary,
  },
  shippingBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  shippingBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  orderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  smallAction: {
    backgroundColor: '#F5F3FF',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  smallActionText: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  dangerActionText: { color: THEME.status.error, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  sectionLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: SPACING.md,
  },
  buyListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  buyListLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  buyListDetail: {
    fontSize: FONT_SIZES.xs,
    color: THEME.text.secondary,
    marginTop: SPACING.xs,
  },
  markBoughtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#D1FAE5',
    borderRadius: BORDER_RADIUS.md,
  },
  markBoughtText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: THEME.status.success,
    marginLeft: SPACING.xs,
  },
  addBuyListRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  editRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: SPACING.sm },
  buyInput: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, color: THEME.text.primary },
  quantityInput: { width: 58, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, color: THEME.text.primary },
  addBuyButton: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  addBuyText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.xs },
  buyActions: { alignItems: 'flex-end', gap: SPACING.xs },
  editBuyText: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  deleteBuyText: { color: THEME.status.error, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  emptyText: {
    fontSize: FONT_SIZES.base,
    color: THEME.text.secondary,
    textAlign: 'center',
    paddingVertical: SPACING['2xl'],
  },
  uploadButton: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  uploadButtonText: { color: '#FFFFFF', fontWeight: '700' },
  productImage: { width: '100%', height: 180, borderRadius: BORDER_RADIUS.md, backgroundColor: '#F8FAFC', marginBottom: SPACING.md },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background,
  },
  notFoundText: {
    fontSize: FONT_SIZES.lg,
    color: THEME.text.secondary,
  },
});


