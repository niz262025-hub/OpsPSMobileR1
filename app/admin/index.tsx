import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import {
  ADMIN_REQUIRED_ROUTE_KEYS,
  approveSeller,
  getAdminDashboardSummary,
  isAdminRole,
  listPendingSellers,
  loadAdminDashboardQueryResult,
  rejectSeller,
} from '../../services/adminFoundation';

export default function AdminDashboardScreen() {
  const { currentUser, logout } = useAuth();
  const [summary, setSummary] = useState(() => getAdminDashboardSummary());
  const [pendingSellers, setPendingSellers] = useState(() => listPendingSellers());
  const [liveDataAvailable, setLiveDataAvailable] = useState(false);

  const isAdmin = useMemo(
    () => isAdminRole(currentUser?.role),
    [currentUser?.role]
  );

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      try {
        const data = await loadAdminDashboardQueryResult();
        if (!mounted) {
          return;
        }

        const nextSummary = getAdminDashboardSummary({
          totalBusinesses: data.businesses.length,
          activeSubscriptions: data.subscriptions.filter((row) => (row.status ?? '').toLowerCase() === 'active').length,
          pendingPayments: data.payments.filter((row) => {
            const status = (row.payment_status ?? '').toLowerCase();
            return status !== 'paid' && status !== 'refunded';
          }).length,
          platformRevenue: data.payments.reduce((total, row) => {
            const status = (row.payment_status ?? '').toLowerCase();
            if (status === 'failed' || status === 'cancelled' || status === 'refunded') {
              return total;
            }
            const amount = Number(row.amount ?? 0);
            return Number.isFinite(amount) ? total + amount : total;
          }, 0),
          netProfit: data.payments.reduce((total, row) => {
            const status = (row.payment_status ?? '').toLowerCase();
            if (status === 'failed' || status === 'cancelled' || status === 'refunded') {
              return total;
            }
            const amount = Number(row.amount ?? 0);
            return Number.isFinite(amount) ? total + amount : total;
          }, 0) - data.financeTransactions.reduce((total, row) => {
            if ((row.type ?? '').toLowerCase() !== 'expense') {
              return total;
            }
            const amount = Number(row.amount ?? 0);
            return Number.isFinite(amount) ? total + amount : total;
          }, 0),
        });

        setSummary(nextSummary);
        setPendingSellers(
          listPendingSellers({
            businesses: data.businesses,
            profiles: data.users,
          })
        );
        setLiveDataAvailable(data.businesses.length > 0 || data.subscriptions.length > 0 || data.payments.length > 0 || data.financeTransactions.length > 0);
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

        <Text style={styles.sectionTitle}>Pending seller approvals</Text>
        {pendingSellers.length === 0 ? (
          <View style={styles.moduleRow}>
            <Text style={styles.moduleName}>No pending sellers</Text>
            <Text style={styles.moduleStatus}>Clear</Text>
          </View>
        ) : (
          pendingSellers.map((seller) => (
            <View key={seller.businessId} style={styles.sellerCard}>
              <Text style={styles.moduleName}>{seller.businessName}</Text>
              <Text style={styles.sellerMeta}>{seller.founderName} • {seller.founderEmail}</Text>
              {seller.phone ? <Text style={styles.sellerMeta}>{seller.phone}</Text> : null}
              {seller.address ? <Text style={styles.sellerMeta}>{seller.address}</Text> : null}
              <View style={styles.actionRow}>
                <Pressable
                  style={styles.approveButton}
                  onPress={() => {
                    const result = approveSeller({ businessId: seller.businessId, reviewerRole: currentUser?.role });
                    if (result.ok) {
                      setPendingSellers((current) => current.filter((entry) => entry.businessId !== seller.businessId));
                    }
                  }}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={styles.rejectButton}
                  onPress={() => {
                    const result = rejectSeller({ businessId: seller.businessId, reviewerRole: currentUser?.role });
                    if (result.ok) {
                      setPendingSellers((current) => current.filter((entry) => entry.businessId !== seller.businessId));
                    }
                  }}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

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
  sellerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E8E3F1' },
  sellerMeta: { color: '#77738D', fontWeight: '600', marginTop: 4 },
  actionRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  approveButton: { flex: 1, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveText: { color: '#FFFFFF', fontWeight: '800' },
  rejectButton: { flex: 1, backgroundColor: '#B42318', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rejectText: { color: '#FFFFFF', fontWeight: '800' },
});
