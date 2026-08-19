import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const items = [
  { label: 'Inventory', route: '/(tabs)/inventory' },
  { label: 'Finance', route: '/(tabs)/finance' },
  { label: 'Reports', route: '/(tabs)/reports' },
  { label: 'Setup', route: '/(tabs)/setup' },
  { label: 'Account', route: '/(tabs)/account' },
];

export default function MoreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>OpsPS</Text>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Quick access to business tools</Text>

      <View style={styles.menuCard}>
        {items.map((item) => (
          <Pressable
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
          >
            <Text style={styles.menuText}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },
  content: {
    padding: 20,
    paddingTop: 48,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: '#6C4CF1',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#181145',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    color: '#6B6B8A',
    fontSize: 15,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
  },
  menuText: {
    color: '#181145',
    fontSize: 17,
    fontWeight: '700',
  },
  menuArrow: {
    color: '#6C4CF1',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 26,
  },
});
