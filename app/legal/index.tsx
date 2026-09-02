import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const legalPages = [
  { label: 'Privacy Policy', route: '/legal/privacy-policy' },
  { label: 'Terms & Conditions', route: '/legal/terms-conditions' },
  { label: 'Payment Policy', route: '/legal/payment-policy' },
  { label: 'Return & Refund Policy', route: '/legal/return-refund-policy' },
  { label: 'Data Deletion Request', route: '/legal/data-deletion-request' },
];

export default function LegalHubScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Legal & Policies</Text>
        <Text style={styles.subtitle}>Access the platform policies and data request forms.</Text>

        {legalPages.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route)}
            style={styles.item}
          >
            <Text style={styles.itemText}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { color: '#5B2BD9', fontWeight: '700' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#EC4C99', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900', color: '#181145', marginTop: 8 },
  subtitle: { marginTop: 8, marginBottom: 20, color: '#5F5A74', fontSize: 15, lineHeight: 22 },
  item: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E2EF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: { color: '#181145', fontSize: 16, fontWeight: '700' },
  chevron: { color: '#5B2BD9', fontSize: 24, fontWeight: '700' },
});
