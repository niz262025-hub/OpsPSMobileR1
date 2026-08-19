import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type Trip = {
  id: string;
  tripName?: string;
  name?: string;
  location?: string;
  status?: string;
  date?: string;
  ownerId?: string;
  notes?: string;
  shoppingModes?: string[];
};

export default function Trips() {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'trips'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Trip, 'id'>),
        }));
        setTrips(items);
        setLoading(false);
      },
      (error) => {
        console.error('Trips load error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const openTrips = useMemo(() => trips.filter((trip) => (trip.status || '').toLowerCase() !== 'closed'), [trips]);
  const closedTrips = useMemo(() => trips.filter((trip) => (trip.status || '').toLowerCase() === 'closed'), [trips]);

  const getTripStatusStyle = (status?: string) => {
    const normalized = (status || 'open').toLowerCase();
    if (normalized === 'completed') return styles.statusCompleted;
    if (normalized === 'closed') return styles.statusClosed;
    return styles.statusOpen;
  };

  const formatShoppingModes = (trip: Trip) => {
    const modes = (trip.shoppingModes || []).map((mode) => mode.replace(/_/g, ' '));
    return modes.length > 0 ? modes.join(' • ') : trip.notes || 'No shopping details yet';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>OpsPS</Text>
            <Text style={styles.title}>Trips</Text>
            <Text style={styles.subtitle}>Manage your personal shopping trips</Text>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={() => router.push('/trip/create')}>
            <Text style={styles.createButtonText}>+ New Trip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard number={String(openTrips.length)} label="Active" />
          <SummaryCard number={String(closedTrips.length)} label="Closed" />
        </View>

        <Text style={styles.sectionTitle}>Trip List</Text>

        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color="#6C3FE8" />
            <Text style={styles.emptyText}>Loading trips...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>🛍️</Text></View>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyText}>Create a shopping trip to manage your orders, products, and trip activity.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/trip/create')}>
              <Text style={styles.emptyButtonText}>Create Trip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => router.push({ pathname: '/trip-detail', params: { tripId: trip.id } })}>
              <View style={styles.tripHeaderRow}>
                <View style={styles.tripHeaderText}>
                  <Text style={styles.tripTitle}>{trip.tripName || trip.name || 'Untitled Trip'}</Text>
                  <Text style={styles.tripLocation}>{trip.location || 'No destination set'}</Text>
                </View>
                <View style={[styles.tripStatusBadge, getTripStatusStyle(trip.status)]}>
                  <Text style={styles.tripStatusText}>{trip.status || 'Open'}</Text>
                </View>
              </View>

              <Text style={styles.tripMetaLabel}>Trip date</Text>
              <Text style={styles.tripMeta}>{trip.date || 'No date set'}</Text>

              <Text style={styles.tripMetaLabel}>Shopping info</Text>
              <Text style={styles.tripInfo}>{formatShoppingModes(trip)}</Text>

              <View style={styles.tripActionRow}>
                <Text style={styles.tripActionHint}>View trip</Text>
                <Text style={styles.tripArrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!!profile && (
          <View style={styles.trialCard}>
            <Text style={styles.trialTitle}>Trial status</Text>
            <Text style={styles.trialText}>{Math.max((profile.freeTripAllowance || 2) - (profile.trialTripsUsed || 0), 0)} free trips remaining</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryNumber}>{number}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function FlowRow({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.flowRow}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{number}</Text>
      </View>

      <View style={styles.flowContent}>
        <Text style={styles.flowTitle}>{title}</Text>
        <Text style={styles.flowText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },

  headerTextWrap: {
    flex: 1,
    minWidth: 180,
  },

  eyebrow: {
    color: '#817B89',
    fontSize: 12,
    fontWeight: '600',
  },

  title: {
    color: '#211A2D',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 2,
  },

  subtitle: {
    color: '#817B89',
    fontSize: 12,
    marginTop: 4,
  },

  createButton: {
    backgroundColor: '#6C3FE8',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },

  summaryCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAEAF3',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  summaryNumber: {
    color: '#6C3FE8',
    fontSize: 27,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#817B89',
    fontSize: 12,
    marginTop: 4,
  },

  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 4,
    marginBottom: 22,
  },

  activeFilter: {
    flex: 1,
    backgroundColor: '#6C3FE8',
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },

  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  filter: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },

  filterText: {
    color: '#817B89',
    fontSize: 13,
    fontWeight: '700',
  },

  sectionTitle: {
    color: '#211A2D',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyIconText: {
    fontSize: 26,
  },

  emptyTitle: {
    color: '#211A2D',
    fontSize: 18,
    fontWeight: '900',
  },

  emptyText: {
    color: '#817B89',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 420,
  },

  emptyButton: {
    backgroundColor: '#6C3FE8',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginTop: 18,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  workflowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 20,
  },

  workflowTitle: {
    color: '#211A2D',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 20,
  },

  flowRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  numberText: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '900',
  },

  flowContent: {
    flex: 1,
  },

  flowTitle: {
    color: '#211A2D',
    fontSize: 14,
    fontWeight: '800',
  },

  flowText: {
    color: '#817B89',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9E2FF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  tripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  tripHeaderText: {
    flex: 1,
    marginRight: 10,
  },
  tripTitle: {
    color: '#211A2D',
    fontSize: 18,
    fontWeight: '800',
  },
  tripLocation: {
    color: '#817B89',
    fontSize: 13,
    marginTop: 4,
  },
  tripMetaLabel: {
    color: '#817B89',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
  },
  tripMeta: {
    color: '#211A2D',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '700',
  },
  tripInfo: {
    color: '#4B5563',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  tripStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  tripStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusOpen: {
    backgroundColor: '#EEE9FF',
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusClosed: {
    backgroundColor: '#E5E7EB',
  },
  tripActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F5',
  },
  tripActionHint: {
    color: '#6C3FE8',
    fontSize: 13,
    fontWeight: '800',
  },
  tripArrow: {
    color: '#6C3FE8',
    fontSize: 18,
    fontWeight: '900',
  },
  trialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  trialTitle: {
    color: '#211A2D',
    fontSize: 16,
    fontWeight: '800',
  },
  trialText: {
    color: '#817B89',
    fontSize: 13,
    marginTop: 6,
  },
});
