import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import {
  ADMIN_REQUIRED_ROUTE_KEYS,
  buildAdminDashboardSummaryFromRecords,
  getAdminDashboardSummary,
  isAdminRole,
} from '../../services/adminFoundation';
import { getSupabaseClient } from '../../services/supabaseClient';

export default function AdminDashboardScreen() {
  const { currentUser, logout } = useAuth();
  const [summary, setSummary] = useState(() => getAdminDashboardSummary());
  const [liveDataAvailable, setLiveDataAvailable] = useState(false);

  const isAdmin = useMemo(
    () => isAdminRole(currentUser?.role),
    [currentUser?.role]
  );

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      const client = getSupabaseClient();
      if (!client) {
        if (mounted) {
          setSummary(getAdminDashboardSummary());
          setLiveDataAvailable(false);
        }
        return;
      }

      try {
        const [businessResult, subscriptionResult, paymentResult, financeResult] = await Promise.all([
          client.from('businesses').select('status').limit(1000),
          client.from('subscriptions').select('status,payment_status').limit(1000),
          client.from('payments').select('payment_status,amount').limit(1000),
          client.from('finance_transactions').select('type,amount').limit(1000),
        ]);

        if (!mounted) {
          return;
        }

        const nextSummary = buildAdminDashboardSummaryFromRecords({
          businesses: (businessResult.data ?? []) as Array<{ status?: string | null }>,
          subscriptions: (subscriptionResult.data ?? []) as Array<{ status?: string | null; payment_status?: string | null }>,
          payments: (paymentResult.data ?? []) as Array<{ payment_status?: string | null; amount?: number | string | null }>,
          financeTransactions: (financeResult.data ?? []) as Array<{ type?: string | null; amount?: number | string | null }>,
        });

        setSummary(nextSummary);
        setLiveDataAvailable(!businessResult.error && !subscriptionResult.error && !paymentResult.error && !financeResult.error);
      } catch {
        if (mounted) {
          setSummary(getAdminDashboardSummary());
          setLiveDataAvailable(false);
        }
      }
    }

    void loadSummary();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Admin access required</Text>
          <Text style={styles.text}>This area is restricted to platform administrators.</Text>
          <Pressable style={styles.primary} onPress={() => router.replace('/login')}>
            <Text style={styles.primaryText}>Back to login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>OpsPS Admin</Text>
            <Text style={styles.title}>Platform overview</Text>
          </View>
          <Pressable style={styles.secondary} onPress={async () => { await logout(); router.replace('/'); }}>
            <Text style={styles.secondaryText}>Log out</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <StatCard label="Businesses" value={String(summary.totalBusinesses)} />
          <StatCard label="Active subs" value={String(summary.activeSubscriptions)} />
          <StatCard label="Pending payments" value={String(summary.pendingPayments)} />
          <StatCard label="Platform revenue" value={`RM ${summary.platformRevenue.toLocaleString()}`} />
          <StatCard label="Net profit" value={`RM ${summary.netProfit.toLocaleString()}`} />
        </View>

        <Text style={styles.sectionTitle}>Admin modules</Text>
        {ADMIN_REQUIRED_ROUTE_KEYS.map((route) => (
          <View key={route} style={styles.moduleRow}>
            <Text style={styles.moduleName}>{route}</Text>
            <Text style={styles.moduleStatus}>{liveDataAvailable ? 'Live data' : 'Awaiting live data'}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F6FC' },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  eyebrow: { color: '#5B2BD9', fontWeight: '800', letterSpacing: 1.2, fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900', color: '#252039', marginTop: 6 },
  text: { color: '#77738D', marginTop: 8, textAlign: 'center' },
  primary: { backgroundColor: '#5B2BD9', borderRadius: 11, paddingVertical: 12, paddingHorizontal: 18, marginTop: 18 },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  secondary: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, paddingVertical: 10, paddingHorizontal: 14 },
  secondaryText: { color: '#252039', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E8E3F1' },
  statLabel: { color: '#77738D', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  statValue: { color: '#252039', fontSize: 20, fontWeight: '900' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#252039', marginTop: 18, marginBottom: 10 },
  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E8E3F1' },
  moduleName: { color: '#252039', fontWeight: '700', textTransform: 'capitalize' },
  moduleStatus: { color: '#5B2BD9', fontWeight: '700', fontSize: 12 },
});
