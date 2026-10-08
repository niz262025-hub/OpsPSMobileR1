import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Package, ShoppingBag, Sparkles, WalletCards } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { THEME } from '../../theme';

export default function CustomerHomeScreen() {
  const { currentUser, logout } = useAuth();

  const quickStats = [
    { label: 'Orders', value: '08', tint: '#5B2BD9' },
    { label: 'Open', value: '03', tint: '#EC4C99' },
    { label: 'Paid', value: '05', tint: '#16A34A' },
  ];

  const shortcuts = [
    { label: 'Browse Products', icon: ShoppingBag },
    { label: 'Track Orders', icon: Package },
    { label: 'Payments', icon: WalletCards },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={THEME.gradient} style={styles.hero}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.eyebrow}>MYOPS CUSTOMER</Text>
              <Text style={styles.title}>Welcome, {currentUser?.name ?? 'Customer'}</Text>
            </View>
            <Pressable style={styles.logout} onPress={async () => { await logout(); router.replace('/'); }}>
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </View>

          <View style={styles.masterCard}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, styles.avatarPink]} />
              <View style={[styles.avatar, styles.avatarBlue]} />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Sparkles size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>OpsPS</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardPanel}>
          <Text style={styles.sectionTitle}>Today at a glance</Text>
          <View style={styles.statRow}>
            {quickStats.map((item) => (
              <View key={item.label} style={[styles.statCard, { borderTopColor: item.tint }]}> 
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cardPanel}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.shortcutRow}>
            {shortcuts.map(({ label, icon: Icon }) => (
              <Pressable key={label} style={styles.shortcutItem} onPress={() => router.push('/(tabs)/marketplace')}>
                <View style={styles.shortcutIconWrap}><Icon size={20} color={THEME.primary} /></View>
                <Text style={styles.shortcutText}>{label}</Text>
                <ArrowRight size={14} color={THEME.text.secondary} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.cardPanel}>
          <Text style={styles.sectionTitle}>Order status</Text>
          {['Waiting for payment', 'Payment verified', 'Packed & ready'].map((status, index) => (
            <View key={status} style={styles.orderRow}>
              <View style={[styles.dot, { backgroundColor: index === 0 ? THEME.accent : index === 1 ? '#16A34A' : THEME.primary }]} />
              <View style={styles.orderMeta}>
                <Text style={styles.orderText}>{status}</Text>
                <Text style={styles.orderSub}>Updated today</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { padding: 20, paddingBottom: 40 },
  hero: { borderRadius: 28, padding: 20, overflow: 'hidden', marginBottom: 18, ...THEME.shadow.large },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#FCE7F3', fontSize: 10, fontWeight: '800', letterSpacing: 1.25, marginBottom: 8 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', maxWidth: 220 },
  logout: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#FFFFFF', fontWeight: '700' },
  masterCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 20, padding: 18, minHeight: 120, justifyContent: 'center' },
  avatarWrap: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' },
  avatar: { width: 58, height: 78, borderRadius: 24, marginLeft: -12 },
  avatarPink: { backgroundColor: '#F7C7D7', borderWidth: 3, borderColor: '#FDF2F8' },
  avatarBlue: { backgroundColor: '#A8D6FF', borderWidth: 3, borderColor: '#EBF5FF' },
  badgeRow: { marginTop: 12 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: '#FFFFFF', marginLeft: 6, fontWeight: '700' },
  cardPanel: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small },
  sectionTitle: { color: THEME.text.primary, fontSize: 18, fontWeight: '800', marginBottom: 14 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: THEME.surfaceAlt, borderRadius: 16, borderTopWidth: 4, padding: 14, marginHorizontal: 4 },
  statLabel: { color: THEME.text.secondary, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  statValue: { color: THEME.text.primary, fontSize: 22, fontWeight: '800' },
  shortcutRow: { flexDirection: 'column' },
  shortcutItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F4FF', borderRadius: 16, padding: 14, marginBottom: 10 },
  shortcutIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shortcutText: { flex: 1, color: THEME.text.primary, fontWeight: '700' },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  orderMeta: { flex: 1 },
  orderText: { color: THEME.text.primary, fontWeight: '700' },
  orderSub: { color: THEME.text.secondary, fontSize: 12, marginTop: 2 },
});