import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OpsPS Dashboard</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Trips</Text>
        <Text style={styles.cardValue}>3</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ready to Pack</Text>
        <Text style={styles.cardValue}>12</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending to Ship</Text>
        <Text style={styles.cardValue}>7</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#6B7280',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#5B2BE0',
  },
});