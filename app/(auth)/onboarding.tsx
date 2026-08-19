import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to OpsPS</Text>
      <Text style={styles.text}>Onboarding will be available here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5FB',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#181145',
  },
  text: {
    marginTop: 8,
    color: '#6B6B8A',
  },
});
