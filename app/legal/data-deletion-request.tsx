import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function DataDeletionRequestScreen() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const submitRequest = () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address so we can review your request.');
      return;
    }

    const payload = {
      email: email.trim(),
      reason: reason.trim() || 'No additional reason provided',
      requestedAt: new Date().toISOString(),
    };

    Alert.alert(
      'Request submitted',
      `Your data deletion request has been prepared for review.\n\nEmail: ${payload.email}\nReason: ${payload.reason}`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>OpsPS</Text>
        <Text style={styles.title}>Data Deletion Request</Text>
        <Text style={styles.subtitle}>Submit a request to review and remove the personal data associated with your OpsPS account.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Reason for request</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Tell us why you want your data deleted"
            multiline
            numberOfLines={5}
            style={[styles.input, styles.textArea]}
          />

          <Pressable style={styles.primaryButton} onPress={submitRequest}>
            <Text style={styles.primaryButtonText}>Submit request</Text>
          </Pressable>
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
  title: { fontSize: 28, fontWeight: '900', color: '#181145', marginBottom: 8 },
  subtitle: { color: '#5F5A74', fontSize: 15, lineHeight: 22, marginBottom: 16 },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7E2EF', borderRadius: 16, padding: 16 },
  label: { color: '#181145', fontSize: 15, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: '#F7F5FB',
    borderWidth: 1,
    borderColor: '#E7E2EF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#181145',
    fontSize: 15,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#5B2BD9', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
