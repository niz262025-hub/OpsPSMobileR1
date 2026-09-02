import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsConditionsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Terms & Conditions</Text>

        <View style={styles.section}>
          <Text style={styles.text}>By using OpsPS, you agree to use the platform responsibly and for the purpose of managing personal shopper operations and related business services.</Text>
          <Text style={styles.text}>Users are responsible for the accuracy of business records, order details, pricing data, and customer information entered into the system.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Platform Use</Text>
          <Text style={styles.text}>OpsPS is provided to support operational workflows, including product management, orders, inventory, trips, shipping coordination, and financial reporting.</Text>
          <Text style={styles.text}>Any misuse, unauthorized access, or malicious activity may result in suspension of access or removal of services.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>No Guarantee</Text>
          <Text style={styles.text}>OpsPS provides operational tools and reporting features as a service platform. While we aim to maintain reliability and accuracy, we do not guarantee uninterrupted availability, complete error-free performance, or outcomes beyond the intended service scope.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Changes</Text>
          <Text style={styles.text}>We may update these terms and related policies from time to time. Continued use of the app after changes are made indicates acceptance of the updated terms.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backText: { color: '#5B2BD9', fontWeight: '700' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: '#EC4C99', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '900', color: '#181145', marginBottom: 16 },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E2EF', borderRadius: 16, padding: 16, marginBottom: 14 },
  heading: { color: '#181145', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  text: { color: '#3D3A49', fontSize: 15, lineHeight: 24, marginBottom: 8 },
});
