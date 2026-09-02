import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function ReturnRefundPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Return & Refund Policy</Text>

        <View style={styles.section}>
          <Text style={styles.text}>Refunds are handled according to the service terms, order conditions, and business arrangements in place for each transaction.</Text>
          <Text style={styles.text}>Customers may request review of a refund where the delivered item, service, or booking does not match the agreed order details or quality expectation.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Eligible Cases</Text>
          <Text style={styles.text}>• Item or service does not match the confirmed order</Text>
          <Text style={styles.text}>• Product quality or condition issue is identified</Text>
          <Text style={styles.text}>• The transaction requires correction after review</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Review Process</Text>
          <Text style={styles.text}>Any return or refund request should be submitted through the app support flow or the relevant OpsPS operational channel for verification and resolution.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Final Resolution</Text>
          <Text style={styles.text}>Each case will be reviewed by the business team based on the transaction record, product condition, and service agreement. Decisions will be communicated directly to the relevant user.</Text>
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
