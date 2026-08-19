import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addDoc, collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type FinanceAccount = 'bank' | 'cash';
type FinanceType = 'income' | 'expense' | 'purchase' | 'capital' | 'withdrawal' | 'transfer';
type FinanceCategory =
  | 'capital'
  | 'customer_payment'
  | 'other_income'
  | 'other'
  | 'petrol'
  | 'toll'
  | 'parking'
  | 'food'
  | 'shipping'
  | 'advertising'
  | 'platform_fees'
  | 'product_purchase'
  | 'initial_capital'
  | 'additional_capital'
  | 'owner_withdrawal';

type FinanceTransaction = {
  id: string;
  ownerId?: string;
  type?: FinanceType;
  category?: FinanceCategory;
  description?: string;
  amount?: number;
  account?: FinanceAccount;
  date?: string;
  tripId?: string | null;
  orderId?: string | null;
  productId?: string | null;
  receiptId?: string | null;
  fromAccount?: FinanceAccount | null;
  toAccount?: FinanceAccount | null;
  createdAt?: any;
};

type TransactionForm = {
  account: FinanceAccount;
  amount: string;
  category: FinanceCategory;
  description: string;
  date: string;
  tripId: string;
  orderId: string;
  productId: string;
  fromAccount: FinanceAccount;
  toAccount: FinanceAccount;
};

const MONEY_IN_OPTIONS: Array<{ label: string; value: FinanceCategory }> = [
  { label: 'Capital', value: 'capital' },
  { label: 'Customer Payment', value: 'customer_payment' },
  { label: 'Other Income', value: 'other_income' },
  { label: 'Other', value: 'other' },
];

const MONEY_OUT_OPTIONS: Array<{ label: string; value: FinanceCategory }> = [
  { label: 'Petrol', value: 'petrol' },
  { label: 'Toll', value: 'toll' },
  { label: 'Parking', value: 'parking' },
  { label: 'Food', value: 'food' },
  { label: 'Shipping', value: 'shipping' },
  { label: 'Advertising', value: 'advertising' },
  { label: 'Platform Fees', value: 'platform_fees' },
  { label: 'Product Purchase', value: 'product_purchase' },
  { label: 'Other', value: 'other' },
];

const currencyFormatter = new Intl.NumberFormat('en-MY', {
  style: 'currency',
  currency: 'MYR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const createDefaultForm = (): TransactionForm => ({
  account: 'bank',
  amount: '',
  category: 'capital',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  tripId: '',
  orderId: '',
  productId: '',
  fromAccount: 'bank',
  toAccount: 'cash',
});

function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function getCategoryLabel(category?: FinanceCategory) {
  switch (category) {
    case 'capital':
      return 'Capital';
    case 'customer_payment':
      return 'Customer payment';
    case 'other_income':
      return 'Other income';
    case 'petrol':
      return 'Petrol';
    case 'toll':
      return 'Toll';
    case 'parking':
      return 'Parking';
    case 'food':
      return 'Food';
    case 'shipping':
      return 'Shipping';
    case 'advertising':
      return 'Advertising';
    case 'platform_fees':
      return 'Platform fees';
    case 'product_purchase':
      return 'Product purchase';
    case 'initial_capital':
      return 'Initial capital';
    case 'additional_capital':
      return 'Additional capital';
    case 'owner_withdrawal':
      return 'Owner withdrawal';
    default:
      return 'Other';
  }
}

function asNumber(value: any) {
  const next = Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}

export default function Finance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [openingBalances, setOpeningBalances] = useState({ bank: 0, cash: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'income' | 'expense' | 'transfer' | 'opening' | null>(null);
  const [form, setForm] = useState<TransactionForm>(createDefaultForm());

  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      setOpeningBalances({ bank: 0, cash: 0 });
      setLoading(false);
      setError(null);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'financeTransactions'), (snapshot) => {
      const next = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<FinanceTransaction, 'id'>) }))
        .filter((item) => item.ownerId === user.uid)
        .sort((a, b) => {
          const aDate = String(a.date || '');
          const bDate = String(b.date || '');
          return bDate.localeCompare(aDate);
        });

      setTransactions(next);
    });

    const loadOpeningBalances = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data() || {};
        setOpeningBalances({
          bank: asNumber(data.openingBankBalance),
          cash: asNumber(data.openingCashBalance),
        });
      } catch (loadError) {
        console.error('Opening balances load error:', loadError);
      }
    };

    loadOpeningBalances();

    setLoading(false);
    setError(null);

    return () => unsubscribe();
  }, [user?.uid]);

  const summary = useMemo(() => {
    let bankOpening = openingBalances.bank;
    let cashOpening = openingBalances.cash;
    let bankMoneyIn = 0;
    let bankMoneyOut = 0;
    let cashMoneyIn = 0;
    let cashMoneyOut = 0;
    let ownerCapital = 0;
    let additionalCapital = 0;
    let ownerWithdrawal = 0;
    let income = 0;
    let expense = 0;
    let purchase = 0;
    let capital = 0;
    let withdrawal = 0;
    let transfer = 0;
    let customerPayment = 0;

    for (const tx of transactions) {
      const amount = asNumber(tx.amount);
      const type = tx.type || 'income';

      if (type === 'transfer') {
        const fromAccount = tx.fromAccount || tx.account || 'bank';
        const toAccount = tx.toAccount || tx.account || 'cash';

        if (fromAccount === 'bank') {
          bankMoneyOut += amount;
        }
        if (toAccount === 'bank') {
          bankMoneyIn += amount;
        }
        if (fromAccount === 'cash') {
          cashMoneyOut += amount;
        }
        if (toAccount === 'cash') {
          cashMoneyIn += amount;
        }

        transfer += amount;
        continue;
      }

      if (tx.account === 'bank') {
        if (type === 'income' || type === 'capital') {
          bankMoneyIn += amount;
        }
        if (type === 'expense' || type === 'purchase' || type === 'withdrawal') {
          bankMoneyOut += amount;
        }
      }

      if (tx.account === 'cash') {
        if (type === 'income' || type === 'capital') {
          cashMoneyIn += amount;
        }
        if (type === 'expense' || type === 'purchase' || type === 'withdrawal') {
          cashMoneyOut += amount;
        }
      }

      if (type === 'income') {
        income += amount;
        if (tx.category === 'customer_payment') {
          customerPayment += amount;
        }
      }

      if (type === 'expense') {
        expense += amount;
      }

      if (type === 'purchase') {
        purchase += amount;
      }

      if (type === 'capital') {
        capital += amount;
        if (tx.category === 'initial_capital' || tx.category === 'additional_capital') {
          additionalCapital += amount;
        }
      }

      if (type === 'withdrawal') {
        withdrawal += amount;
        ownerWithdrawal += amount;
      }
    }

    const bankBalance = bankOpening + bankMoneyIn - bankMoneyOut;
    const cashBalance = cashOpening + cashMoneyIn - cashMoneyOut;
    const netCapital = capital - ownerWithdrawal;

    return {
      bankOpening,
      bankMoneyIn,
      bankMoneyOut,
      bankBalance,
      cashOpening,
      cashMoneyIn,
      cashMoneyOut,
      cashBalance,
      ownerCapital: 0,
      additionalCapital,
      ownerWithdrawal,
      netCapital,
      income,
      expense,
      purchase,
      capital,
      withdrawal,
      transfer,
      customerPayment,
      moneyIn: bankMoneyIn + cashMoneyIn,
      moneyOut: bankMoneyOut + cashMoneyOut,
      transactionCount: transactions.length,
    };
  }, [transactions, openingBalances]);

  const handleSaveOpeningBalance = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        openingBankBalance: asNumber(form.amount),
        openingCashBalance: asNumber(form.description || 0),
        updatedAt: serverTimestamp(),
      });
      setFormMode(null);
      setForm(createDefaultForm());
      Alert.alert('Opening balances saved', 'Opening balances have been stored in Firebase.');
    } catch (saveError) {
      console.error('Opening balances save error:', saveError);
      Alert.alert('Unable to save opening balances', saveError instanceof Error ? saveError.message : 'Unknown error');
    }
  };

  const handleSaveTransaction = async () => {
    if (!user?.uid) {
      Alert.alert('Authentication', 'Please sign in to save a finance transaction.');
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than zero.');
      return;
    }

    try {
      const payload: Record<string, any> = {
        ownerId: user.uid,
        amount,
        description: form.description.trim() || 'Finance transaction',
        date: form.date || new Date().toISOString().slice(0, 10),
        tripId: form.tripId.trim() || null,
        orderId: form.orderId.trim() || null,
        productId: form.productId.trim() || null,
        receiptId: null,
        createdAt: serverTimestamp(),
      };

      if (formMode === 'transfer') {
        payload.type = 'transfer';
        payload.category = 'other';
        payload.account = form.fromAccount;
        payload.fromAccount = form.fromAccount;
        payload.toAccount = form.toAccount;
      } else if (formMode === 'income') {
        payload.type = 'income';
        payload.account = form.account;
        payload.category = form.category;
      } else if (formMode === 'expense') {
        payload.type = form.category === 'product_purchase' ? 'purchase' : form.category === 'capital' ? 'capital' : 'expense';
        payload.account = form.account;
        payload.category = form.category;
      } else if (formMode === 'opening') {
        throw new Error('Opening balance mode must use the dedicated opening balance action.');
      }

      await addDoc(collection(db, 'financeTransactions'), payload);
      setFormMode(null);
      setForm(createDefaultForm());
      Alert.alert('Saved', 'Finance transaction has been stored in Firebase.');
    } catch (saveError) {
      console.error('Finance save error:', saveError);
      Alert.alert('Unable to save finance entry', saveError instanceof Error ? saveError.message : 'Unknown error');
    }
  };

  const modalTitle =
    formMode === 'income'
      ? 'Money In'
      : formMode === 'expense'
        ? 'Money Out'
        : formMode === 'transfer'
          ? 'Transfer'
          : 'Opening Balances';

  const actionButton = (label: string, mode: 'income' | 'expense' | 'transfer' | 'opening') => (
    <Pressable
      key={label}
      style={styles.actionButton}
      onPress={() => {
        setFormMode(mode);
        setForm(createDefaultForm());
      }}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );

  if (!user?.uid) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Authentication required</Text>
        <Text style={styles.emptyText}>Sign in to view your finance summary.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Finance</Text>

        <View style={styles.actionGrid}>
          {actionButton('MONEY IN', 'income')}
          {actionButton('MONEY OUT', 'expense')}
          {actionButton('TRANSFER', 'transfer')}
          {actionButton('OPENING BAL.', 'opening')}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5B2BD9" />
            <Text style={styles.loadingText}>Loading finance data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Finance unavailable</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <MetricCard label="Bank" value={formatCurrency(summary.bankBalance)} tint="#5B2BD9" />
              <MetricCard label="Cash" value={formatCurrency(summary.cashBalance)} tint="#EC4C99" />
              <MetricCard label="Capital" value={formatCurrency(summary.netCapital)} tint="#5B2BD9" />
              <MetricCard label="Transactions" value={String(summary.transactionCount)} tint="#EC4C99" />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bank Balance</Text>
              <MetricRow label="Opening balance" value={formatCurrency(summary.bankOpening)} />
              <MetricRow label="Money in" value={formatCurrency(summary.bankMoneyIn)} />
              <MetricRow label="Money out" value={formatCurrency(summary.bankMoneyOut)} />
              <MetricRow label="Current bank balance" value={formatCurrency(summary.bankBalance)} highlight />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Cash Balance</Text>
              <MetricRow label="Opening cash" value={formatCurrency(summary.cashOpening)} />
              <MetricRow label="Money in" value={formatCurrency(summary.cashMoneyIn)} />
              <MetricRow label="Money out" value={formatCurrency(summary.cashMoneyOut)} />
              <MetricRow label="Current cash balance" value={formatCurrency(summary.cashBalance)} highlight />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Capital</Text>
              <MetricRow label="Owner capital" value={formatCurrency(summary.ownerCapital)} />
              <MetricRow label="Additional capital" value={formatCurrency(summary.additionalCapital)} />
              <MetricRow label="Owner withdrawal / drawings" value={formatCurrency(summary.ownerWithdrawal)} />
              <MetricRow label="Net capital" value={formatCurrency(summary.netCapital)} highlight />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <MetricRow label="Income" value={formatCurrency(summary.income)} />
              <MetricRow label="Expense" value={formatCurrency(summary.expense)} />
              <MetricRow label="Purchase" value={formatCurrency(summary.purchase)} />
              <MetricRow label="Capital" value={formatCurrency(summary.capital)} />
              <MetricRow label="Withdrawal" value={formatCurrency(summary.withdrawal)} />
              <MetricRow label="Transfer" value={formatCurrency(summary.transfer)} />
              <MetricRow label="Customer payment" value={formatCurrency(summary.customerPayment)} highlight />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Expenses</Text>
              <MetricRow label="Petrol" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'petrol').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Toll" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'toll').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Parking" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'parking').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Food" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'food').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Shipping" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'shipping').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Advertising" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'advertising').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Platform fees" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'platform_fees').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Other" value={formatCurrency(transactions.filter((tx) => tx.type === 'expense' && tx.category === 'other').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} highlight />
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Purchases</Text>
              <MetricRow label="Product purchase" value={formatCurrency(transactions.filter((tx) => tx.type === 'purchase' && tx.category === 'product_purchase').reduce((sum, tx) => sum + asNumber(tx.amount), 0))} />
              <MetricRow label="Customer purchase" value={formatCurrency(summary.customerPayment)} />
              <MetricRow label="Stock purchase" value={formatCurrency(summary.purchase)} highlight />
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!formMode} transparent animationType="slide" onRequestClose={() => setFormMode(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            {formMode === 'opening' ? (
              <>
                <Text style={styles.fieldLabel}>Opening Bank Balance</Text>
                <TextInput
                  style={styles.input}
                  value={form.amount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
                />

                <Text style={styles.fieldLabel}>Opening Cash Balance</Text>
                <TextInput
                  style={styles.input}
                  value={form.description || String(openingBalances.cash)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                />

                <Pressable style={styles.primaryButton} onPress={handleSaveOpeningBalance}>
                  <Text style={styles.primaryButtonText}>Save Opening Balances</Text>
                </Pressable>
              </>
            ) : null}

            {formMode === 'income' ? (
              <>
                <Text style={styles.fieldLabel}>Account</Text>
                <View style={styles.optionRow}>
                  {(['bank', 'cash'] as FinanceAccount[]).map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, form.account === option && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, account: option }))}
                    >
                      <Text style={[styles.optionChipText, form.account === option && styles.optionChipTextActive]}>{option === 'bank' ? 'Bank' : 'Cash'}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={form.amount}
                  placeholder="0.00"
                  onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
                />

                <Text style={styles.fieldLabel}>Source</Text>
                <View style={styles.optionGrid}>
                  {MONEY_IN_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[styles.optionChip, form.category === option.value && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, category: option.value }))}
                    >
                      <Text style={[styles.optionChipText, form.category === option.value && styles.optionChipTextActive]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={form.description}
                  placeholder="Description"
                  onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                />

                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={form.date}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(value) => setForm((current) => ({ ...current, date: value }))}
                />

                <Text style={styles.fieldLabel}>Trip ID (optional)</Text>
                <TextInput style={styles.input} value={form.tripId} onChangeText={(value) => setForm((current) => ({ ...current, tripId: value }))} />

                <Text style={styles.fieldLabel}>Order ID (optional)</Text>
                <TextInput style={styles.input} value={form.orderId} onChangeText={(value) => setForm((current) => ({ ...current, orderId: value }))} />

                <Pressable style={styles.primaryButton} onPress={handleSaveTransaction}>
                  <Text style={styles.primaryButtonText}>Save Money In</Text>
                </Pressable>
              </>
            ) : null}

            {formMode === 'expense' ? (
              <>
                <Text style={styles.fieldLabel}>Account</Text>
                <View style={styles.optionRow}>
                  {(['bank', 'cash'] as FinanceAccount[]).map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.optionChip, form.account === option && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, account: option }))}
                    >
                      <Text style={[styles.optionChipText, form.account === option && styles.optionChipTextActive]}>{option === 'bank' ? 'Bank' : 'Cash'}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={form.amount}
                  placeholder="0.00"
                  onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
                />

                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.optionGrid}>
                  {[
                    { label: 'Expense', value: 'other' },
                    { label: 'Purchase', value: 'product_purchase' },
                    { label: 'Withdrawal', value: 'owner_withdrawal' },
                    { label: 'Other', value: 'other' },
                  ].map((option) => (
                    <Pressable
                      key={option.value}
                      style={[styles.optionChip, form.category === option.value && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, category: option.value as FinanceCategory }))}
                    >
                      <Text style={[styles.optionChipText, form.category === option.value && styles.optionChipTextActive]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.optionGrid}>
                  {MONEY_OUT_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[styles.optionChip, form.category === option.value && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, category: option.value }))}
                    >
                      <Text style={[styles.optionChipText, form.category === option.value && styles.optionChipTextActive]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={form.description}
                  placeholder="Description"
                  onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                />

                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={form.date}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(value) => setForm((current) => ({ ...current, date: value }))}
                />

                <Text style={styles.fieldLabel}>Trip ID (optional)</Text>
                <TextInput style={styles.input} value={form.tripId} onChangeText={(value) => setForm((current) => ({ ...current, tripId: value }))} />

                <Text style={styles.fieldLabel}>Order ID (optional)</Text>
                <TextInput style={styles.input} value={form.orderId} onChangeText={(value) => setForm((current) => ({ ...current, orderId: value }))} />

                <Text style={styles.fieldLabel}>Product ID (optional)</Text>
                <TextInput style={styles.input} value={form.productId} onChangeText={(value) => setForm((current) => ({ ...current, productId: value }))} />

                <Pressable style={styles.primaryButton} onPress={handleSaveTransaction}>
                  <Text style={styles.primaryButtonText}>Save Money Out</Text>
                </Pressable>
              </>
            ) : null}

            {formMode === 'transfer' ? (
              <>
                <Text style={styles.fieldLabel}>From Account</Text>
                <View style={styles.optionRow}>
                  {(['bank', 'cash'] as FinanceAccount[]).map((option) => (
                    <Pressable
                      key={`from-${option}`}
                      style={[styles.optionChip, form.fromAccount === option && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, fromAccount: option }))}
                    >
                      <Text style={[styles.optionChipText, form.fromAccount === option && styles.optionChipTextActive]}>{option === 'bank' ? 'Bank' : 'Cash'}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>To Account</Text>
                <View style={styles.optionRow}>
                  {(['bank', 'cash'] as FinanceAccount[]).map((option) => (
                    <Pressable
                      key={`to-${option}`}
                      style={[styles.optionChip, form.toAccount === option && styles.optionChipActive]}
                      onPress={() => setForm((current) => ({ ...current, toAccount: option }))}
                    >
                      <Text style={[styles.optionChipText, form.toAccount === option && styles.optionChipTextActive]}>{option === 'bank' ? 'Bank' : 'Cash'}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={form.amount}
                  placeholder="0.00"
                  onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))}
                />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={form.description}
                  placeholder="Transfer description"
                  onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
                />

                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={form.date}
                  placeholder="YYYY-MM-DD"
                  onChangeText={(value) => setForm((current) => ({ ...current, date: value }))}
                />

                <Pressable style={styles.primaryButton} onPress={handleSaveTransaction}>
                  <Text style={styles.primaryButtonText}>Save Transfer</Text>
                </Pressable>
              </>
            ) : null}

            <Pressable style={styles.secondaryButton} onPress={() => setFormMode(null)}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetricCard({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <View style={[styles.metricCard, { borderColor: tint }]}> 
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tint }]}>{value}</Text>
    </View>
  );
}

function MetricRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.metricRow}>
      <Text style={[styles.metricText, highlight && styles.highlight]}>{label}</Text>
      <Text style={[styles.metricValueText, highlight && styles.highlight]}>{value}</Text>
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
    marginBottom: 18,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  actionButton: {
    backgroundColor: '#5B2BD9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
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
  metricLabel: {
    color: '#6B6B8A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EEF8',
  },
  metricText: {
    color: '#4F4768',
    fontSize: 13,
    flex: 1,
    marginRight: 12,
  },
  metricValueText: {
    color: '#181145',
    fontSize: 13,
    fontWeight: '700',
  },
  highlight: {
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    color: '#181145',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#4F4768',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E0F7',
    backgroundColor: '#F9F7FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#181145',
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3EEFF',
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipActive: {
    backgroundColor: '#5B2BD9',
  },
  optionChipText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 12,
  },
  optionChipTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#F3EEFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 15,
  },
});
