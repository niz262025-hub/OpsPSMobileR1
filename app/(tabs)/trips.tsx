import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { StatusBadge } from '../../components/StatusBadge';
import { useMockDatabase, getTripOrders, getTripProducts } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

type TripStatus = 'planning' | 'open' | 'completed';

function statusBadge(status: TripStatus) {
  const badgeStatus = status === 'planning' ? 'pending' : status === 'open' ? 'in-stock' : 'delivered';
  return <StatusBadge status={badgeStatus} label={status.charAt(0).toUpperCase() + status.slice(1)} />;
}

function formatDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString();
}

export default function TripsScreen() {
  const { width } = useWindowDimensions();
  const db = useMockDatabase();
  const desktop = width >= 900;

  const openTrip = (tripId: string) => router.push({ pathname: '/trip/[id]', params: { id: tripId } });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.subtitle}>Plan and manage your personal shopper journeys.</Text>
        </View>
        <Pressable style={styles.createButton} onPress={() => router.push('/trip/create')}>
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.createButtonText}>Create Trip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {desktop ? (
          <View style={styles.table}>
            <View style={[styles.row, styles.tableHeader]}>
              {['Trip', 'Destination', 'Date', 'Orders', 'Products', 'Status', 'Action'].map((label) => (
                <Text key={label} style={[styles.headerText, styles[columnStyles[label as keyof typeof columnStyles]]]}>{label}</Text>
              ))}
            </View>
            {db.trips.map((trip) => (
              <View key={trip.id} style={styles.row}>
                <Text style={[styles.cellText, styles.tripColumn]}>{trip.name}</Text>
                <Text style={[styles.cellText, styles.destinationColumn]}>{trip.destination}</Text>
                <Text style={[styles.cellText, styles.dateColumn]}>{formatDate(trip.tripDate)}</Text>
                <Text style={[styles.cellText, styles.countColumn]}>{getTripOrders(trip.id, db).length}</Text>
                <Text style={[styles.cellText, styles.countColumn]}>{getTripProducts(trip.id, db).length}</Text>
                <View style={styles.statusColumn}>{statusBadge(trip.status)}</View>
                <Pressable style={styles.actionColumn} onPress={() => openTrip(trip.id)}><Text style={styles.actionText}>View</Text></Pressable>
              </View>
            ))}
          </View>
        ) : (
          db.trips.map((trip) => (
            <Pressable key={trip.id} style={styles.card} onPress={() => openTrip(trip.id)}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{trip.name}</Text>
                  <Text style={styles.cardDestination}>{trip.destination}</Text>
                </View>
                {statusBadge(trip.status)}
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.statText}>Date: {formatDate(trip.tripDate)}</Text>
                <Text style={styles.statText}>Orders: {getTripOrders(trip.id, db).length}</Text>
                <Text style={styles.statText}>Products: {getTripProducts(trip.id, db).length}</Text>
              </View>
              <Text style={styles.actionText}>View</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const columnStyles = { Trip: 'tripColumn', Destination: 'destinationColumn', Date: 'dateColumn', Orders: 'countColumn', Products: 'countColumn', Status: 'statusColumn', Action: 'actionColumn' } as const;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  header: { backgroundColor: THEME.surface, paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: THEME.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800' },
  subtitle: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  createButtonText: { color: '#FFFFFF', fontWeight: '800', marginLeft: SPACING.xs },
  content: { padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  table: { width: '100%', backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: THEME.border },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, borderTopWidth: 1, borderTopColor: THEME.border },
  tableHeader: { minHeight: 46, backgroundColor: '#FAFAFC', borderTopWidth: 0 },
  headerText: { color: THEME.text.secondary, fontSize: FONT_SIZES.xs, fontWeight: '800' },
  cellText: { color: THEME.text.primary, fontSize: FONT_SIZES.sm },
  tripColumn: { width: '20%' },
  destinationColumn: { width: '22%' },
  dateColumn: { width: '15%' },
  countColumn: { width: '10%' },
  statusColumn: { width: '15%' },
  actionColumn: { width: '8%' },
  actionText: { color: THEME.primary, fontSize: FONT_SIZES.sm, fontWeight: '800' },
  card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleWrap: { flex: 1, paddingRight: SPACING.md },
  cardTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800' },
  cardDestination: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  cardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, borderTopWidth: 1, borderTopColor: THEME.border, marginTop: SPACING.md, paddingTop: SPACING.md, marginBottom: SPACING.md },
  statText: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm },
});
