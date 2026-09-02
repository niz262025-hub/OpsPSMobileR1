import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Privacy Policy</Text>

        <View style={styles.section}>
          <Text style={styles.text}>OpsPS respects your privacy and is committed to protecting the personal data you share while using the platform.</Text>
          <Text style={styles.text}>We collect information needed to operate the service, including account details, order data, payment references, trip records, and communication preferences.</Text>
          <Text style={styles.text}>This information is used to provide account access, operational support, payment processing, customer service, and service continuity.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Data We Use</Text>
          <Text style={styles.text}>• Personal and business contact details</Text>
          <Text style={styles.text}>• Order, inventory, shipping, and trip information</Text>
          <Text style={styles.text}>• Payment-related records required for service fulfillment</Text>
          <Text style={styles.text}>• Communication and support data sent through the app</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>How We Use It</Text>
          <Text style={styles.text}>We use your data to authenticate access, process transactions, manage operations, troubleshoot issues, and improve the experience of using OpsPS.</Text>
          <Text style={styles.text}>We do not sell or rent personal data to third parties. Information may be shared only with trusted service providers that support the operational needs of the platform.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Your Rights</Text>
          <Text style={styles.text}>You may request to view, update, restrict, or delete your personal data by using the Data Deletion Request page in the app.</Text>
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
