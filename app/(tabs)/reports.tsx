import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { buildReport, exportExcel, exportPdf, ReportType, type ReportDataset, type ReportRow } from '../../services/reporting';
import { getDataSource } from '../../services/repository';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

const types: ReportType[] = ['sales', 'orders', 'trip_profit', 'purchases', 'expenses', 'customer_payments', 'inventory'];
const labels: Record<ReportType, string> = { sales: 'Sales', orders: 'Orders', trip_profit: 'Trip Profit', purchases: 'Purchases', expenses: 'Expenses', customer_payments: 'Customer Payments', inventory: 'Inventory' };

function monthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return { from, to: now.toISOString().slice(0, 10) };
}

export default function ReportsScreen() {
  const { business, membership } = useAuth();
  const businessId = membership?.business_id ?? business?.id ?? undefined;
  const defaults = useMemo(() => monthRange(), []);
  const [type, setType] = useState<ReportType>('sales');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [dataset, setDataset] = useState<ReportDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ rows: ReportRow[]; summary: Record<string, string | number> }>({ rows: [], summary: { Rows: 0 } });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        if (!businessId) {
          if (active) {
            setDataset(null);
            setResult({ rows: [], summary: { Rows: 0 } });
          }
          return;
        }

        const repo = getDataSource('production');
        const [orders, trips, products, financeRows, payments] = await Promise.all([
          repo.orders.listForBusiness(businessId),
          repo.trips.listForBusiness(businessId),
          repo.products.listForBusiness(businessId),
          repo.finance.listForBusiness(businessId),
          repo.payments.listForBusiness(businessId),
        ]);

        const orderItems = await Promise.all(
          orders.map(async (order) => repo.orders.listItemsForOrder(order.id, businessId)),
        );

        const productVariants = await Promise.all(
          products.map(async (product) => repo.products.listVariantsForProduct(product.id, businessId)),
        );

        const nextDataset: ReportDataset = {
          orders: orders.map((order) => ({
            id: order.id,
            businessId: order.businessId,
            tripId: order.tripId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            orderDate: order.orderDate,
            total: Number(order.total ?? 0),
            shippingFee: Number(order.shippingFee ?? 0),
            paymentMode: order.paymentMode,
            paymentStatus: order.paymentStatus,
            availabilityStatus: order.availabilityStatus,
            status: order.orderStatus,
            tripName: trips.find((trip) => trip.id === order.tripId)?.name ?? order.tripId,
            productName: products.find((product) => product.id === order.productId)?.name ?? order.productId,
            productSize: productVariants.flat().find((variant) => variant.productId === order.productId)?.size ?? undefined,
            quantity: orderItems.flat().find((item) => item.orderId === order.id)?.quantity ?? 1,
          })),
          orderItems: orderItems.flat().map((item) => item),
          productVariants: productVariants.flat(),
          products: products.map((product) => ({
            id: product.id,
            businessId: product.businessId,
            tripId: product.tripId,
            name: product.name,
            category: product.category,
            costPrice: Number(product.costPrice ?? 0),
            sellingPrice: Number(product.sellingPrice ?? 0),
          })),
          trips: trips.map((trip) => ({
            id: trip.id,
            businessId: trip.businessId,
            name: trip.name,
            destination: trip.destination,
            tripDate: trip.tripDate,
          })),
          financeTransactions: financeRows.map((row) => ({
            id: row.id,
            business_id: row.business_id,
            trip_id: row.trip_id,
            order_id: row.order_id,
            product_id: row.product_id,
            description: row.description,
            amount: Number(row.amount ?? 0),
            type: row.type,
            payment_method: row.payment_method,
            category: row.category,
            created_at: row.created_at,
          })),
          payments: payments.map((row) => ({
            id: row.id,
            business_id: row.business_id,
            order_id: row.order_id,
            amount: Number(row.amount ?? 0),
            payment_status: row.payment_status ?? row.status,
            status: row.status,
            payment_method: row.payment_method,
            verified: Boolean(row.verified),
            created_at: row.created_at,
          })),
        };

        if (!active) return;
        setDataset(nextDataset);
        setResult(buildReport('sales', nextDataset, defaults.from, defaults.to, businessId));
      } catch {
        if (active) {
          setDataset(null);
          setResult({ rows: [], summary: { Rows: 0 } });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => { active = false; };
  }, [businessId, defaults]);

  const generate = () => {
    if (!dataset) {
      setResult({ rows: [], summary: { Rows: 0 } });
      return;
    }
    const next = buildReport(type, dataset, from, to, businessId);
    setResult(next);
  };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>Reports</Text><Text style={styles.subtitle}>Generated from the current OpsPS database.</Text>{loading ? <Text style={styles.empty}>Loading report data…</Text> : <>
    <View style={styles.card}><Text style={styles.label}>Date From</Text><TextInput value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" style={styles.input} /><Text style={styles.label}>Date To</Text><TextInput value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" style={styles.input} /><Text style={styles.label}>Report Type</Text><View style={styles.actions}>{types.map((entry) => <Pressable key={entry} style={[styles.option, type === entry && styles.selected]} onPress={() => setType(entry)}><Text style={styles.optionText}>{labels[entry]}</Text></Pressable>)}</View><Pressable style={styles.primary} onPress={generate}><Text style={styles.primaryText}>Generate Report</Text></Pressable></View>
    <View style={styles.summary}><Text style={styles.sectionTitle}>{labels[type]} Summary</Text>{Object.entries(result.summary).map(([key, value]) => <View key={key} style={styles.summaryRow}><Text style={styles.label}>{key}</Text><Text style={styles.value}>{String(value)}</Text></View>)}</View>
    <View style={styles.actions}><Pressable style={styles.export} onPress={() => exportPdf(type, result, from, to)}><Text style={styles.exportText}>Download PDF</Text></Pressable><Pressable style={styles.export} onPress={() => exportExcel(type, result, from, to)}><Text style={styles.exportText}>Download Excel</Text></Pressable></View>
    <Text style={styles.sectionTitle}>Report Data ({result.rows.length})</Text>{result.rows.map((row, index) => <View key={index} style={styles.row}>{Object.entries(row).map(([key, value]) => <Text key={key} style={styles.cell}>{key}: {String(value)}</Text>)}</View>)}{!result.rows.length && <Text style={styles.empty}>No records in this date range.</Text>}</>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: THEME.background }, content: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] }, title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800' }, subtitle: { color: THEME.text.secondary, marginVertical: SPACING.md }, card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md }, label: { color: THEME.text.primary, fontWeight: '700' }, input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginVertical: SPACING.xs, marginBottom: SPACING.md, color: THEME.text.primary }, actions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginTop: SPACING.sm }, option: { backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm }, selected: { borderWidth: 2, borderColor: THEME.primary }, optionText: { color: THEME.primary, fontWeight: '800', fontSize: FONT_SIZES.xs }, primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md }, primaryText: { color: '#FFFFFF', fontWeight: '800' }, summary: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md }, sectionTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.md }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs }, value: { color: THEME.primary, fontWeight: '800' }, export: { flex: 1, backgroundColor: THEME.status.success, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' }, exportText: { color: '#FFFFFF', fontWeight: '800' }, row: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.sm }, cell: { color: THEME.text.secondary, fontSize: FONT_SIZES.xs, marginBottom: 2 }, empty: { color: THEME.text.secondary, padding: SPACING.lg } });
