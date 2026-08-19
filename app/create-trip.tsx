import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './context/AuthContext';

type ShoppingMode =
  | 'customer_request'
  | 'share_buy_on_demand'
  | 'buy_stock_sell';

const SHOPPING_MODES: {
  id: ShoppingMode;
  title: string;
  description: string;
}[] = [
  {
    id: 'customer_request',
    title: 'Customer Request',
    description:
      'Customer tells PS what they want. PS buys the requested item during the trip.',
  },
  {
    id: 'share_buy_on_demand',
    title: 'Share & Buy on Demand',
    description:
      'PS uploads products, shares them, customer requests the item, PS confirms availability, then buys it.',
  },
  {
    id: 'buy_stock_sell',
    title: 'Buy Stock & Sell',
    description:
      'PS buys stock first, adds available stock to inventory, then sells to customers.',
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
  const { user } = useAuth();

  const [tripName, setTripName] = useState('');
  const [location, setLocation] = useState('');

  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [shoppingModes, setShoppingModes] = useState<ShoppingMode[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleShoppingMode = (mode: ShoppingMode) => {
    setShoppingModes((current) => {
      if (current.includes(mode)) {
        return current.filter((item) => item !== mode);
      }

      return [...current, mode];
    });
  };

  const handleDateChange = (
    event: any,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event?.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setTripDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!user?.uid) {
      Alert.alert(
        'Authentication Required',
        'Please log in before creating a trip.'
      );
      return;
    }

    if (!tripName.trim()) {
      Alert.alert(
        'Trip Name Required',
        'Please enter the trip name.'
      );
      return;
    }

    if (shoppingModes.length === 0) {
      Alert.alert(
        'Shopping Mode Required',
        'Please select at least one shopping mode.'
      );
      return;
    }

    try {
      setSaving(true);

      const tripRef = await addDoc(collection(db, 'trips'), {
        ownerId: user.uid,

        tripName: tripName.trim(),
        location: location.trim(),

        date: formatDate(tripDate),

        shoppingModes,

        status: 'open',

        productCount: 0,
        orderCount: 0,
        sales: 0,

        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Trip Created',
        'Your shopping trip has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.push({
                pathname: '/trip-detail',
                params: {
                  tripId: tripRef.id,
                },
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Create trip error:', error);

      Alert.alert(
        'Unable to Create Trip',
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating the trip.'
      );
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
        <Text style={styles.title}>Create Trip</Text>

        <Text style={styles.subtitle}>
          Plan a shopping trip before heading out
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Trip Name"
          placeholderTextColor="#9CA3AF"
          value={tripName}
          onChangeText={setTripName}
        />

        <TextInput
          style={styles.input}
          placeholder="Mall / Location"
          placeholderTextColor="#9CA3AF"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.sectionTitle}>Trip Date</Text>

        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View>
            <Text style={styles.dateLabel}>Shopping date</Text>
            <Text style={styles.dateValue}>
              {formatDate(tripDate)}
            </Text>
          </View>

          <Text style={styles.calendarIcon}>▣</Text>
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

        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>
            How are you shopping?
          </Text>

          <Text style={styles.modeSubtitle}>
            Select one or more shopping methods for this trip.
          </Text>

          {SHOPPING_MODES.map((mode) => {
            const selected = shoppingModes.includes(mode.id);

            return (
              <Pressable
                key={mode.id}
                style={[
                  styles.modeOption,
                  selected && styles.modeOptionSelected,
                ]}
                onPress={() => toggleShoppingMode(mode.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    selected && styles.checkboxSelected,
                  ]}
                >
                  {selected && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>

                <View style={styles.modeContent}>
                  <Text style={styles.modeOptionTitle}>
                    {mode.title}
                  </Text>

                  <Text style={styles.modeOptionDescription}>
                    {mode.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Trip Workflow</Text>

          <Text style={styles.infoText}>
            Create trip → Upload products while shopping → Share
            products → Customer requests → PS confirms availability
            → Buy / Inventory → Payment → Fulfilment.
          </Text>
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            saving && styles.primaryButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>
              Create Trip
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.secondaryText}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FB',
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#181145',
  },

  subtitle: {
    color: '#6B6B8A',
    marginTop: 6,
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    color: '#181145',
  },

  sectionTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },

  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dateLabel: {
    color: '#6B6B8A',
    fontSize: 11,
    fontWeight: '700',
  },

  dateValue: {
    color: '#181145',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },

  calendarIcon: {
    color: '#5B2BD9',
    fontSize: 22,
    fontWeight: '900',
  },

  doneDateButton: {
    backgroundColor: '#EEE9FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 20,
  },

  doneDateText: {
    color: '#5B2BD9',
    fontWeight: '900',
  },

  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },

  modeTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
  },

  modeSubtitle: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 6,
  },

  modeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E8E5F0',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  modeOptionSelected: {
    borderColor: '#6C3FE8',
    backgroundColor: '#F5F1FF',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D6D1E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  checkboxSelected: {
    borderColor: '#6C3FE8',
    backgroundColor: '#6C3FE8',
  },

  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  modeContent: {
    flex: 1,
  },

  modeOptionTitle: {
    color: '#181145',
    fontSize: 14,
    fontWeight: '900',
  },

  modeOptionDescription: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
  },

  infoTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },

  infoText: {
    color: '#6B6B8A',
    lineHeight: 22,
  },

  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },

  primaryButtonDisabled: {
    opacity: 0.6,
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: '#F3F0FF',
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