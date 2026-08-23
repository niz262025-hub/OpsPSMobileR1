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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle2, Package, ShoppingBag } from 'lucide-react-native';
import { useMockDatabase, markBuyListItemBought, createBuyListItem, updateBuyListItem, deleteBuyListItem, getTripProducts, getTripOrders, getTripBuyListItems, getProductVariant, getProduct, closeTrip, addTripExpense, getTripExpenses, addTripCostOfGoods, getTripCostOfGoods, getTripProfit, type TripExpenseType } from '../../../services/mockDatabase';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../../theme';
import { StatusBadge } from '../../../components/StatusBadge';

type TabType = 'products' | 'orders' | 'buylist' | 'expenses';

function getTripStatusBadge(status: 'planning' | 'open' | 'closed') {
  const label = status === 'planning' ? 'Planning' : status === 'open' ? 'Open' : 'Closed';
  const badgeStatus = status === 'planning' ? 'pending' : status === 'open' ? 'in-stock' : 'cancelled';
  return <StatusBadge status={badgeStatus} label={label} />;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString();
}

type TripExpenseDraft = {
  id: string;
  amount: string;
  type: TripExpenseType;
  description: string;
  date: string;
  receipt: string;
};

function createTripExpenseDraft(): TripExpenseDraft {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: '0',
    type: 'Transport',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    receipt: '',
  };
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();
  const db = useMockDatabase();
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [buyItemName, setBuyItemName] = useState('');
  const [buyItemQuantity, setBuyItemQuantity] = useState('1');
  const [editingBuyItem, setEditingBuyItem] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('0');
  const [expenseType, setExpenseType] = useState<TripExpenseType>('Transport');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseReceipt, setExpenseReceipt] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [showCloseFlow, setShowCloseFlow] = useState(false);
  const [closeFlowDrafts, setCloseFlowDrafts] = useState<TripExpenseDraft[]>([createTripExpenseDraft()]);
  const [closeFlowError, setCloseFlowError] = useState('');
  const [cogsDrafts, setCogsDrafts] = useState<Array<{ id: string; productName: string; quantity: string; unitCost: string; notes: string }>>([
    { id: `cogs-${Date.now()}`, productName: '', quantity: '1', unitCost: '0', notes: '' },
  ]);

  const trip = db.trips.find((entry: { id: string }) => entry.id === id);
  const tripProducts = useMemo(() => getTripProducts(trip?.id ?? '', db), [trip, db]);
  const tripOrders = useMemo(() => getTripOrders(trip?.id ?? '', db), [trip, db]);
  const buyListItems = useMemo(() => getTripBuyListItems(trip?.id ?? '', db), [trip, db]);
  const tripExpenses = useMemo(() => getTripExpenses(trip?.id ?? '', db), [trip, db]);
  const tripCostOfGoods = useMemo(() => getTripCostOfGoods(trip?.id ?? '', db), [trip, db]);
  const tripProfit = useMemo(() => (trip ? getTripProfit(trip.id, db) : { salesRevenue: 0, costOfGoods: 0, grossProfit: 0, moneyIn: 0, moneyOut: 0, outstandingRevenue: 0, netProfit: 0 }), [trip, db]);

  const handleCloseTrip = () => {
    if (!trip) return;
    setShowCloseFlow(true);
    setCloseFlowError('');
    setCloseFlowDrafts([createTripExpenseDraft()]);
  };

  const updateCloseDraft = (id: string, updates: Partial<TripExpenseDraft>) => {
    setCloseFlowDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...updates } : draft));
  };

  const addCloseDraft = () => {
    setCloseFlowDrafts((current) => [...current, createTripExpenseDraft()]);
  };

  const updateCogsDraft = (id: string, updates: Partial<{ id: string; productName: string; quantity: string; unitCost: string; notes: string }>) => {
    setCogsDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...updates } : draft));
  };

  const addCogsDraft = () => {
    setCogsDrafts((current) => [...current, { id: `cogs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, productName: '', quantity: '1', unitCost: '0', notes: '' }]);
  };

  const saveCloseTrip = () => {
    if (!trip) return;

    const validExpenseDrafts = closeFlowDrafts.filter((draft) => Number(draft.amount) > 0);
    const validCogsDrafts = cogsDrafts.filter((draft) => draft.productName.trim() && Number(draft.quantity) > 0 && Number(draft.unitCost) > 0);

    if (validExpenseDrafts.length === 0 && validCogsDrafts.length === 0) {
      setCloseFlowError('Please add at least one expense or cost-of-goods entry before closing the trip.');
      return;
    }

    let failed = false;

    validExpenseDrafts.forEach((draft) => {
      const saved = addTripExpense({
        tripId: trip.id,
        amount: Number(draft.amount),
        paymentType: draft.type,
        description: draft.description.trim() || draft.type,
        date: draft.date,
        receiptUri: draft.receipt || undefined,
      });

      if (!saved) {
        failed = true;
      }
    });

    validCogsDrafts.forEach((draft) => {
      const saved = addTripCostOfGoods({
        tripId: trip.id,
        productName: draft.productName,
        quantity: Number(draft.quantity),
        unitCost: Number(draft.unitCost),
        notes: draft.notes,
      });

      if (!saved) {
        failed = true;
      }
    });

    if (failed) {
      setCloseFlowError('One or more final items could not be saved.');
      return;
    }

    closeTrip(trip.id);
    setShowCloseFlow(false);
    setCloseFlowError('');
    setCloseFlowDrafts([createTripExpenseDraft()]);
    setCogsDrafts([{ id: `cogs-${Date.now()}`, productName: '', quantity: '1', unitCost: '0', notes: '' }]);
  };

  const handleReceiptPick = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setExpenseReceipt(String(reader.result));
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library permission is required to upload a receipt.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });

    if (!result.canceled && result.assets.length > 0) {
      setExpenseReceipt(result.assets[0].uri);
    }
  };

  const saveExpense = () => {
    if (!trip) return;

    const parsedAmount = Number(expenseAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setExpenseError('Please enter a valid expense amount.');
      return;
    }

    if (!expenseDescription.trim()) {
      setExpenseError('Please add a brief expense description.');
      return;
    }

    const saved = addTripExpense({
      tripId: trip.id,
      amount: parsedAmount,
      paymentType: expenseType,
      description: expenseDescription,
      date: expenseDate,
      receiptUri: expenseReceipt || undefined,
    });

    if (!saved) {
      setExpenseError('Unable to save this trip expense.');
      return;
    }

    setExpenseAmount('0');
    setExpenseType('Transport');
    setExpenseDescription('');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseReceipt('');
    setExpenseError('');
  };

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

      {trip.status === 'closed' && (
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Trip Summary</Text>
          <View style={styles.summaryRows}>
            <SummaryMetric label="Sales" value={`RM${tripProfit.salesRevenue.toFixed(2)}`} accent="primary" />
            <SummaryMetric label="COGS" value={`-RM${tripProfit.costOfGoods.toFixed(2)}`} accent="warning" />
            <SummaryMetric label="Expenses" value={`-RM${tripProfit.moneyOut.toFixed(2)}`} accent="danger" />
            <SummaryMetric label="Gross Profit" value={`RM${tripProfit.grossProfit.toFixed(2)}`} accent="success" />
            <SummaryMetric label="Net Profit" value={`RM${tripProfit.netProfit.toFixed(2)}`} accent="success" />
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleCloseTrip}>
          <Text style={styles.actionButtonPrimaryText}>Close Trip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {(['products', 'orders', 'buylist', 'expenses'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
              {tab === 'buylist' ? 'Buy List' : tab === 'expenses' ? 'Expenses' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {showCloseFlow && (
          <View style={styles.closeFlowCard}>
            <Text style={styles.sectionLabel}>Close Trip</Text>
            <Text style={styles.closeFlowHint}>Before closing, enter final trip expenses and any direct cost-of-goods for this trip.</Text>

            <Text style={styles.sectionSubLabel}>Cost of Goods</Text>
            {cogsDrafts.map((draft, draftIndex) => (
              <View key={draft.id} style={styles.closeFlowItem}>
                <Text style={styles.label}>COGS Item {draftIndex + 1}</Text>
                <TextInput
                  value={draft.productName}
                  onChangeText={(value) => updateCogsDraft(draft.id, { productName: value })}
                  style={styles.input}
                  placeholder="Product name"
                  placeholderTextColor={THEME.text.light}
                />

                <View style={styles.cogsRow}>
                  <View style={styles.cogsField}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput
                      value={draft.quantity}
                      onChangeText={(value) => updateCogsDraft(draft.id, { quantity: value })}
                      keyboardType="numeric"
                      style={styles.input}
                      placeholder="1"
                      placeholderTextColor={THEME.text.light}
                    />
                  </View>
                  <View style={styles.cogsField}>
                    <Text style={styles.label}>Unit Cost</Text>
                    <TextInput
                      value={draft.unitCost}
                      onChangeText={(value) => updateCogsDraft(draft.id, { unitCost: value })}
                      keyboardType="numeric"
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor={THEME.text.light}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  value={draft.notes}
                  onChangeText={(value) => updateCogsDraft(draft.id, { notes: value })}
                  style={styles.input}
                  placeholder="Supplier, batch, restock, etc."
                  placeholderTextColor={THEME.text.light}
                />

                <Text style={styles.helperText}>Total: RM{((Number(draft.quantity) || 0) * (Number(draft.unitCost) || 0)).toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.closeFlowActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={addCogsDraft}>
                <Text style={styles.secondaryActionText}>Add COGS</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionSubLabel}>Trip Expenses</Text>
            {closeFlowDrafts.map((draft, draftIndex) => (
              <View key={draft.id} style={styles.closeFlowItem}>
                <Text style={styles.label}>Expense {draftIndex + 1}</Text>
                <TextInput
                  value={draft.amount}
                  onChangeText={(value) => updateCloseDraft(draft.id, { amount: value })}
                  keyboardType="numeric"
                  style={styles.input}
                  placeholder="Amount"
                  placeholderTextColor={THEME.text.light}
                />

                <Text style={styles.label}>Type</Text>
                <View style={styles.typeRow}>
                  {(['Transport', 'Hotel', 'Parking', 'Toll', 'Other'] as TripExpenseType[]).map((type) => (
                    <TouchableOpacity
                      key={`${draft.id}-${type}`}
                      style={[styles.typeButton, draft.type === type && styles.typeButtonSelected]}
                      onPress={() => updateCloseDraft(draft.id, { type })}
                    >
                      <Text style={[styles.typeButtonText, draft.type === type && styles.typeButtonTextSelected]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                  value={draft.description}
                  onChangeText={(value) => updateCloseDraft(draft.id, { description: value })}
                  style={styles.input}
                  placeholder="Fuel, hotel, purchase, etc."
                  placeholderTextColor={THEME.text.light}
                />

                <Text style={styles.label}>Receipt</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={async () => {
                    if (Platform.OS === 'web') {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (event) => {
                        const file = (event.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => updateCloseDraft(draft.id, { receipt: String(reader.result) });
                        reader.readAsDataURL(file);
                      };
                      input.click();
                      return;
                    }

                    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!permission.granted) {
                      Alert.alert('Permission Required', 'Photo library permission is required to upload a receipt.');
                      return;
                    }

                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
                    if (!result.canceled && result.assets.length > 0) {
                      updateCloseDraft(draft.id, { receipt: result.assets[0].uri });
                    }
                  }}
                >
                  <Text style={styles.uploadButtonText}>{draft.receipt ? 'Replace Receipt' : 'Upload Receipt'}</Text>
                </TouchableOpacity>

                {!!draft.receipt && <Image source={{ uri: draft.receipt }} style={styles.receiptImage} resizeMode="cover" />}
              </View>
            ))}

            <View style={styles.closeFlowActions}>
              <TouchableOpacity style={styles.secondaryAction} onPress={addCloseDraft}>
                <Text style={styles.secondaryActionText}>Add Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryAction} onPress={saveCloseTrip}>
                <Text style={styles.primaryActionText}>Save Expenses & Close Trip</Text>
              </TouchableOpacity>
            </View>

            {closeFlowError ? <Text style={styles.errorText}>{closeFlowError}</Text> : null}
            <TouchableOpacity style={styles.cancelCloseButton} onPress={() => setShowCloseFlow(false)}>
              <Text style={styles.cancelCloseText}>Back to Trip</Text>
            </TouchableOpacity>
          </View>
        )}

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

        {activeTab === 'expenses' && (
          <View>
            <Text style={styles.sectionLabel}>Trip Expenses</Text>

            <View style={styles.expenseCard}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="numeric"
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={THEME.text.light}
              />

              <Text style={styles.label}>Payment Type</Text>
              <View style={styles.typeRow}>
                {(['Transport', 'Hotel', 'Parking', 'Toll', 'Other'] as TripExpenseType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, expenseType === type && styles.typeButtonSelected]}
                    onPress={() => setExpenseType(type)}
                  >
                    <Text style={[styles.typeButtonText, expenseType === type && styles.typeButtonTextSelected]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date</Text>
              <TextInput
                value={expenseDate}
                onChangeText={setExpenseDate}
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={THEME.text.light}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                value={expenseDescription}
                onChangeText={setExpenseDescription}
                style={[styles.input, styles.textArea]}
                placeholder="Hotel, transport, toll, etc."
                placeholderTextColor={THEME.text.light}
                multiline
              />

              <Text style={styles.label}>Receipt</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleReceiptPick}>
                <Text style={styles.uploadButtonText}>{expenseReceipt ? 'Replace Receipt' : 'Capture / Upload Receipt'}</Text>
              </TouchableOpacity>

              {expenseReceipt ? (
                <Image source={{ uri: expenseReceipt }} style={styles.receiptImage} resizeMode="cover" />
              ) : null}

              {!!expenseError && <Text style={styles.errorText}>{expenseError}</Text>}

              <TouchableOpacity style={styles.primaryAction} onPress={saveExpense}>
                <Text style={styles.primaryActionText}>Save Expense</Text>
              </TouchableOpacity>
            </View>

            {tripExpenses.length === 0 ? (
              <Text style={styles.emptyText}>No trip expenses recorded yet</Text>
            ) : (
              tripExpenses.map((expense) => (
                <View key={expense.id} style={styles.card}>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.cardTitle}>{expense.paymentType}</Text>
                      <Text style={styles.itemDetail}>{expense.description || 'Trip expense'}</Text>
                    </View>
                    <Text style={styles.amountText}>RM{expense.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.metaGrid}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{formatDate(expense.date)}</Text>
                  </View>
                  <View style={styles.metaGrid}>
                    <Text style={styles.metaLabel}>Receipt</Text>
                    <Text style={styles.metaValue}>{expense.receiptUri ? 'Attached' : 'None'}</Text>
                  </View>
                  {!!expense.receiptUri && (
                    <Image source={{ uri: expense.receiptUri }} style={styles.receiptPreview} resizeMode="cover" />
                  )}
                </View>
              ))
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

function SummaryMetric({ label, value, accent }: { label: string; value: string; accent: 'primary' | 'danger' | 'success' | 'warning' }) {
  const color = accent === 'primary' ? THEME.primary : accent === 'danger' ? THEME.status.error : accent === 'warning' ? THEME.status.warning : THEME.status.success;

  return (
    <View style={styles.summaryMetricRow}>
      <Text style={styles.summaryMetricLabel}>{label}</Text>
      <Text style={[styles.summaryMetricValue, { color }]}>{value}</Text>
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
  summaryCard: {
    backgroundColor: THEME.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
  },
  summaryRows: {
    gap: SPACING.sm,
  },
  summaryMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryMetricLabel: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  summaryMetricValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },
  sectionSubLabel: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cogsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cogsField: {
    flex: 1,
  },
  helperText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
  },
  actionsRow: {
    backgroundColor: THEME.surface,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  actionButtonPrimary: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  uploadButton: {
    backgroundColor: '#F5F3FF',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadButtonText: {
    color: THEME.primary,
    fontWeight: '700',
  },
  emptyText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  label: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#FCFCFD',
    color: THEME.text.primary,
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  expenseCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  typeButtonSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  typeButtonText: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: '#FFFFFF',
  },
  closeFlowCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  closeFlowHint: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  closeFlowItem: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  closeFlowActions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  secondaryAction: {
    backgroundColor: '#F5F3FF',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: THEME.primary,
    fontWeight: '800',
  },
  primaryAction: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cancelCloseButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  cancelCloseText: {
    color: THEME.primary,
    fontWeight: '700',
  },
  errorText: {
    color: THEME.status.error,
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.sm,
  },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F3F4F6',
    marginBottom: SPACING.md,
  },
  receiptPreview: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F3F4F6',
    marginTop: SPACING.md,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  amountText: {
    color: THEME.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  metaLabel: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
  },
  metaValue: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.background,
  },
  notFoundText: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  orderCustomer: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
  },
  orderItems: {
    gap: SPACING.sm,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: SPACING.sm,
  },
  itemName: {
    color: THEME.text.primary,
    fontWeight: '600',
  },
  itemDetail: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  orderTotal: {
    color: THEME.text.primary,
    fontWeight: '800',
  },
  shippingBtn: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  shippingBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  smallAction: {
    marginTop: SPACING.md,
  },
  smallActionText: {
    color: THEME.primary,
    fontWeight: '700',
  },
  addBuyListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  buyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FCFCFD',
    color: THEME.text.primary,
  },
  quantityInput: {
    width: 80,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FCFCFD',
    color: THEME.text.primary,
  },
  addBuyButton: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addBuyText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buyListRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyListLabel: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  buyListDetail: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  buyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  markBoughtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  markBoughtText: {
    color: THEME.status.success,
    fontWeight: '700',
  },
  editBuyText: {
    color: THEME.primary,
    fontWeight: '700',
  },
  deleteBuyText: {
    color: THEME.status.error,
    fontWeight: '700',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});


