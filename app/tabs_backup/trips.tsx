import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, MapPin, Package, Truck } from 'lucide-react-native';
import { MOCK_TRIPS } from '../../mockData';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';
import { StatusBadge } from '../../components/StatusBadge';

export default function TripsScreen() {
  const activeTrips = MOCK_TRIPS.filter((trip) => trip.status === 'active');

  const handleTripPress = (tripId: string) => {
    router.push({
      pathname: '/trip/[id]',
      params: { id: tripId },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.eyebrow}>Active journeys</Text>
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.subtitle}>Open any trip to review products, orders and buy-list needs.</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {activeTrips.map((trip) => (
          <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => handleTripPress(trip.id)}>
            <View style={styles.tripTopRow}>
              <View style={styles.tripTitleWrap}>
                <Text style={styles.tripName}>{trip.name}</Text>
                <View style={styles.tripMetaRow}>
                  <MapPin size={14} color={THEME.text.secondary} />
                  <Text style={styles.tripDate}>{new Date(trip.createdAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <StatusBadge status="in-stock" label="Active" />
            </View>

            <View style={styles.tripMetrics}>
              <View style={styles.metricItem}>
                <Package size={18} color={THEME.primary} />
                <View style={styles.metricTextWrap}>
                  <Text style={styles.metricLabel}>Products</Text>
                  <Text style={styles.metricValue}>{trip.totalProducts}</Text>
                </View>
              </View>
              <View style={styles.metricItem}>
                <Truck size={18} color={THEME.status.info} />
                <View style={styles.metricTextWrap}>
                  <Text style={styles.metricLabel}>Orders</Text>
                  <Text style={styles.metricValue}>{trip.totalOrders}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.tripFooter}>Tap to view details</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    backgroundColor: THEME.surface,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  eyebrow: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '700',
    color: THEME.text.primary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.secondary,
    marginTop: SPACING.xs,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  tripCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...THEME.shadow.medium,
  },
  tripTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  tripTitleWrap: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  tripName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: THEME.text.primary,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  tripDate: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: THEME.text.secondary,
  },
  tripMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    marginBottom: SPACING.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricTextWrap: {
    marginLeft: SPACING.sm,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    color: THEME.text.secondary,
  },
  metricValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: THEME.text.primary,
  },
  tripFooter: {
    fontSize: FONT_SIZES.sm,
    color: THEME.primary,
    fontWeight: '700',
  },
});
