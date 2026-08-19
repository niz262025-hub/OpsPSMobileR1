import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth, updateUserTripUsage } from '../context/AuthContext';

type ShoppingMode =
  | 'customer_request'
  | 'share_buy_on_demand'
  | 'buy_stock_sell';

const SHOPPING_MODES: Array<{
  id: ShoppingMode;
  title: string;
  description: string;
}> = [
  {
    id: 'customer_request',
    title: 'Customer Request',
    description: 'Customer tells PS what they want; PS buys the item during the trip.',
  },
  {
    id: 'share_buy_on_demand',
    title: 'Share & Buy on Demand',
    description: 'PS uploads/shares product, customer requests, PS confirms availability and buys when needed.',
  },
  {
    id: 'buy_stock_sell',
    title: 'Buy Stock & Sell',
    description: 'PS buys stock first, then sells from inventory once available.',
  },
];

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CreateTrip() {
  const { user, profile, canCreateTrip, refreshProfile } = useAuth();
  const [tripName, setTripName] = useState('');
  const [location, setLocation] = useState('');
  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shoppingModes, setShoppingModes] = useState<ShoppingMode[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleShoppingMode = (mode: ShoppingMode) => {
    setShoppingModes((current) => {
      if (current.includes(mode)) {
        return current.filter((item) => item !== mode);
      }

      return [...current, mode];
    });
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (_event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setTripDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!user?.uid) {
      Alert.alert('Authentication', 'Please log in to create a trip.');
      return;
    }

    if (!tripName.trim()) {
      Alert.alert('Validation', 'Please enter Trip Name.');
      return;
    }

    if (shoppingModes.length === 0) {
      Alert.alert('Shopping Mode Required', 'Please select at least one shopping mode for this trip.');
      return;
    }

    try {
      const tripAllowance = await canCreateTrip();
      if (!tripAllowance.allowed) {
        Alert.alert('Trial limit reached', `You have used all ${tripAllowance.max} free shopping trips. Please subscribe to create more trips.`);
        router.push('/subscription');
        return;
      }
    } catch (error) {
      console.error('Trip allowance check failed:', error);
    }

    try {
      setSaving(true);
      const tripRef = await addDoc(collection(db, 'trips'), {
        ownerId: user.uid,
        tripName: tripName.trim(),
        location: location.trim(),
        date: formatDate(tripDate),
        notes: notes.trim(),
        shoppingModes,
        status: 'open',
        productCount: 0,
        orderCount: 0,
        sales: 0,
        createdAt: serverTimestamp(),
      });

      if (profile?.subscriptionPlan !== 'PREMIUM') {
        await updateUserTripUsage(user.uid, 1);
        await refreshProfile();
      }

      router.push({
        pathname: '/trip-detail',
        params: { tripId: tripRef.id },
      });
    } catch (error) {
      console.error('Create trip error:', error);
      Alert.alert('Unable to create trip', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>OpsPS</Text>

        <Text style={styles.title}>Create Trip</Text>

        <Text style={styles.subtitle}>
          Plan a shopping trip before heading out
        </Text>

        <Text style={styles.label}>Trip Name *</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. ION Orchard Shopping"
          placeholderTextColor="#9CA3AF"
          value={tripName}
          onChangeText={setTripName}
        />

        <Text style={styles.label}>
          Mall / Event / Location (Optional)
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. ION Orchard"
          placeholderTextColor="#9CA3AF"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Trip Date *</Text>

        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(tripDate)}</Text>
          <Text style={styles.calendarText}>📅</Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={tripDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        {Platform.OS === 'ios' && showDatePicker && (
          <Pressable
            style={styles.doneDateButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.doneDateText}>Done</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Notes (Optional)</Text>

        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Optional notes about this trip"
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>How are you shopping?</Text>
          <Text style={styles.modeSubtitle}>Select one or more options for this trip.</Text>

          {SHOPPING_MODES.map((mode) => {
            const selected = shoppingModes.includes(mode.id);

            return (
              <Pressable
                key={mode.id}
                style={[styles.modeOption, selected && styles.modeOptionSelected]}
                onPress={() => toggleShoppingMode(mode.id)}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <View style={styles.modeTextWrap}>
                  <Text style={styles.modeLabel}>{mode.title}</Text>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.flowCard}>
          <Text style={styles.flowTitle}>What happens next?</Text>

          <FlowStep
            number="1"
            title="Create Trip"
            text="Your shopping trip is created as Open."
          />

          <FlowStep
            number="2"
            title="Upload Products"
            text="Upload products while shopping at the mall or event."
          />

          <FlowStep
            number="3"
            title="Publish Products"
            text="Publish products and share the product links."
          />

          <FlowStep
            number="4"
            title="Customer Orders"
            text="Customer orders are connected to this trip."
          />
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={handleCreate}
          disabled={saving}
        >
          <Text style={styles.primaryText}>{saving ? 'Creating...' : 'Create Trip'}</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FlowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.flowStep}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{number}</Text>
      </View>

      <View style={styles.flowContent}>
        <Text style={styles.flowStepTitle}>{title}</Text>
        <Text style={styles.flowStepText}>{text}</Text>
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
    padding: 24,
    paddingBottom: 50,
  },

  eyebrow: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#181145',
  },

  subtitle: {
    color: '#6B6B8A',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 25,
  },

  label: {
    color: '#181145',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 17,
    color: '#181145',
    fontSize: 14,
  },

  notesInput: {
    minHeight: 100,
    paddingTop: 15,
  },

  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateText: {
    color: '#181145',
    fontSize: 14,
    fontWeight: '700',
  },

  calendarText: {
    fontSize: 20,
  },

  doneDateButton: {
    backgroundColor: '#EEE9FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 17,
  },

  doneDateText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 14,
  },

  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 6,
    marginBottom: 22,
  },

  modeTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },

  modeSubtitle: {
    color: '#6B6B8A',
    fontSize: 12,
    marginBottom: 16,
  },

  modeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F7F5FB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E1FF',
  },

  modeOptionSelected: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6C3FE8',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C9BDF8',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    backgroundColor: '#6C3FE8',
    borderColor: '#6C3FE8',
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  modeTextWrap: {
    flex: 1,
  },

  modeLabel: {
    color: '#181145',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
  },

  modeDescription: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
  },

  flowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 5,
    marginBottom: 22,
  },

  flowTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 18,
  },

  flowStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  numberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  numberText: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '900',
  },

  flowContent: {
    flex: 1,
  },

  flowStepTitle: {
    color: '#181145',
    fontSize: 13,
    fontWeight: '800',
  },

  flowStepText: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: '#EEE9FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  secondaryText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 16,
  },
});
