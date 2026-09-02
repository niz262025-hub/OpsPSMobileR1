import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PaymentPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Payment Policy</Text>

        <View style={styles.section}>
          <Text style={styles.text}>OpsPS supports a range of payment methods and settlement workflows for platform users and business operations.</Text>
          <Text style={styles.text}>Payment instructions and account details are provided within the app for users who are authorized to manage the relevant payment setup.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Billing</Text>
          <Text style={styles.text}>Pricing is based on the selected plan and active services in the OpsPS workspace. Users are responsible for reviewing subscription details and confirming current business terms.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Accepted Methods</Text>
          <Text style={styles.text}>Supported methods may include bank transfer, QR payment, DuitNow, Touch & Go, or other merchant setups configured by the business.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Disputes</Text>
          <Text style={styles.text}>Any payment concern should be raised through the official support channel in the app so that the issue can be reviewed and resolved with the relevant account and order details.</Text>
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
