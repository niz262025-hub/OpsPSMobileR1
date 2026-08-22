import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SectionHeader } from '../../components/SectionHeader';
import { StatCard } from '../../components/StatCard';
import { addMonthlyExpense, deleteFinanceTransaction, FinancePaymentMethod, getTripProfit, updateFinanceTransaction, useMockDatabase } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

export default function FinanceScreen() {
  const db = useMockDatabase();
  const { width } = useWindowDimensions();
  const [showExpense, setShowExpense] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Others');
  const [method, setMethod] = useState<FinancePaymentMethod>('bank');
  const [notes, setNotes] = useState('');
  const transactions = db.financeTransactions;
  const moneyIn = transactions.filter((item) => item.type === 'income').reduce((total, item) => total + item.amount, 0);
  const moneyOut = transactions.filter((item) => item.type === 'expense').reduce((total, item) => total + item.amount, 0);
  const bankBalance = transactions.filter((item) => item.paymentMethod === 'bank').reduce((total, item) => total + (item.type === 'income' ? item.amount : -item.amount), 0);
  const cashBalance = transactions.filter((item) => item.paymentMethod === 'cash').reduce((total, item) => total + (item.type === 'income' ? item.amount : -item.amount), 0);
  const monthlyExpenses = transactions.filter((item) => item.isMonthlyExpense);
  const reset = () => { setName(''); setAmount(''); setCategory('Others'); setMethod('bank'); setNotes(''); setEditing(null); setShowExpense(false); };
  const saveExpense = () => {
    if (!name.trim() || !Number(amount)) return;
    if (editing) updateFinanceTransaction(editing, { description: notes ? `${name} - ${notes}` : name, amount: Math.abs(Number(amount)), category: 'Monthly Expense', paymentMethod: method });
    else addMonthlyExpense({ description: name, amount: Number(amount), category, paymentMethod: method, notes });
    reset();
  };
  const editExpense = (id: string) => { const item = transactions.find((transaction) => transaction.id === id); if (!item) return; setEditing(id); setName(item.description.split(' - ')[0]); setAmount(String(item.amount)); setMethod(item.paymentMethod); setNotes(item.description.includes(' - ') ? item.description.split(' - ').slice(1).join(' - ') : ''); setShowExpense(true); };

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>Cash flow</Text><Text style={styles.title}>Finance</Text><Text style={styles.subtitle}>Track money in, money out, and expenses across your operations.</Text>
    <View style={[styles.summary, width >= 900 && styles.summaryDesktop]}>
      <StatCard label="Bank Balance" value={`RM${bankBalance.toFixed(2)}`} variant="primary" />
      <StatCard label="Cash Balance" value={`RM${cashBalance.toFixed(2)}`} variant="success" />
      <StatCard label="Money In" value={`RM${moneyIn.toFixed(2)}`} variant="secondary" />
      <StatCard label="Money Out" value={`RM${moneyOut.toFixed(2)}`} variant="warning" />
    </View>
    <SectionHeader title="Profit by Trip" />
    {db.trips.map((trip) => { const profit = getTripProfit(trip.id, db); return <View key={trip.id} style={styles.transactionRow}><View style={styles.rowInfo}><Text style={styles.rowTitle}>{trip.name}</Text><Text style={styles.rowMeta}>Sales RM{profit.salesRevenue.toFixed(2)} · Cash received RM{profit.moneyIn.toFixed(2)} · Outstanding RM{profit.outstandingRevenue.toFixed(2)}</Text></View><Text style={[styles.transactionAmount, { color: profit.netProfit >= 0 ? THEME.status.success : THEME.status.error }]}>RM{profit.netProfit.toFixed(2)}</Text></View>; })}
    <SectionHeader title="Monthly Expenses" />
    <Pressable style={styles.addButton} onPress={() => setShowExpense(true)}><Text style={styles.addButtonText}>+ Add Monthly Expense</Text></Pressable>
    {monthlyExpenses.length === 0 ? <Text style={styles.emptyText}>No monthly expenses recorded.</Text> : monthlyExpenses.map((item) => <View key={item.id} style={styles.expenseRow}><View style={styles.rowInfo}><Text style={styles.rowTitle}>{item.description}</Text><Text style={styles.rowMeta}>{item.paymentMethod === 'bank' ? 'Bank' : 'Cash'} · {item.category}</Text></View><Text style={styles.expenseAmount}>- RM{item.amount.toFixed(2)}</Text><Pressable onPress={() => editExpense(item.id)}><Text style={styles.editText}>Edit</Text></Pressable><Pressable onPress={() => deleteFinanceTransaction(item.id)}><Text style={styles.deleteText}>Delete</Text></Pressable></View>)}
    <SectionHeader title="Recent Transactions" />
    {transactions.slice(0, 10).map((item) => <View key={item.id} style={styles.transactionRow}><View style={styles.rowInfo}><Text style={styles.rowTitle}>{item.description}</Text><Text style={styles.rowMeta}>{new Date(item.date).toLocaleDateString()} · {item.paymentMethod === 'bank' ? 'Bank' : 'Cash'}</Text></View><View><Text style={[styles.transactionAmount, { color: item.type === 'income' ? THEME.status.success : THEME.status.error }]}>{item.type === 'income' ? '+' : '-'} RM{item.amount.toFixed(2)}</Text><Text style={styles.typeText}>{item.type === 'income' ? 'Money In' : 'Money Out'}</Text></View></View>)}
    <Pressable style={styles.viewAll}><Text style={styles.viewAllText}>View All Transactions</Text></Pressable>
  </ScrollView>
  <Modal visible={showExpense} transparent animationType="slide" onRequestClose={reset}><Pressable style={styles.backdrop} onPress={reset}><View style={styles.modal}><Text style={styles.modalTitle}>{editing ? 'Edit Monthly Expense' : 'Add Monthly Expense'}</Text><Field label="Expense Name" value={name} onChangeText={setName} placeholder="e.g. Rent" /><Field label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" numeric /><Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Phone" /><Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" /><Text style={styles.label}>Payment Method</Text><View style={styles.methodRow}>{(['bank', 'cash'] as FinancePaymentMethod[]).map((value) => <Pressable key={value} style={[styles.method, method === value && styles.methodActive]} onPress={() => setMethod(value)}><Text style={[styles.methodText, method === value && styles.methodTextActive]}>{value === 'bank' ? 'Bank' : 'Cash'}</Text></Pressable>)}</View><Pressable style={styles.saveButton} onPress={saveExpense}><Text style={styles.saveText}>{editing ? 'Save Changes' : 'Add Expense'}</Text></Pressable></View></Pressable></Modal>
  </SafeAreaView>;
}
function Field({ label, value, onChangeText, placeholder, numeric = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; numeric?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={THEME.text.light} keyboardType={numeric ? 'decimal-pad' : 'default'} style={styles.input} /></View>; }
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background }, content: { width: '100%', maxWidth: 1100, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] }, eyebrow: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }, title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: SPACING.xs }, subtitle: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs }, summary: { marginTop: SPACING.lg }, summaryDesktop: { flexDirection: 'row', gap: SPACING.md }, addButton: { alignSelf: 'flex-start', backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md }, addButtonText: { color: '#FFFFFF', fontWeight: '800' }, expenseRow: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderColor: THEME.border }, rowInfo: { flex: 1 }, rowTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '700' }, rowMeta: { color: THEME.text.secondary, fontSize: FONT_SIZES.xs, marginTop: SPACING.xs }, expenseAmount: { color: THEME.status.error, fontWeight: '800' }, editText: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700' }, deleteText: { color: THEME.status.error, fontSize: FONT_SIZES.xs, fontWeight: '700' }, transactionRow: { backgroundColor: THEME.surface, borderBottomWidth: 1, borderBottomColor: THEME.border, paddingVertical: SPACING.md, flexDirection: 'row', alignItems: 'center' }, transactionAmount: { textAlign: 'right', fontWeight: '800' }, typeText: { color: THEME.text.secondary, fontSize: FONT_SIZES.xs, textAlign: 'right', marginTop: SPACING.xs }, viewAll: { alignItems: 'center', padding: SPACING.lg }, viewAllText: { color: THEME.primary, fontWeight: '800' }, emptyText: { color: THEME.text.secondary, paddingVertical: SPACING.md }, backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,15,35,0.35)' }, modal: { backgroundColor: THEME.surface, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING['2xl'] }, modalTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.lg }, field: { marginBottom: SPACING.md }, label: { color: THEME.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '700', marginBottom: SPACING.xs }, input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: THEME.text.primary }, methodRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }, method: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' }, methodActive: { backgroundColor: THEME.primary, borderColor: THEME.primary }, methodText: { color: THEME.text.secondary, fontWeight: '700' }, methodTextActive: { color: '#FFFFFF' }, saveButton: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, alignItems: 'center', padding: SPACING.md }, saveText: { color: '#FFFFFF', fontWeight: '800' },
});
