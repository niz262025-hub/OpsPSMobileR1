import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar } from 'lucide-react-native';

import { createTrip } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

export default function CreateTripScreen() {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [tripDate, setTripDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim() || !destination.trim()) {
      setError('Please complete the trip name, destination and date.');
      return;
    }

    createTrip({ name, destination, tripDate: tripDate.toISOString().slice(0, 10), notes });
    router.replace('/(tabs)/trips');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color={THEME.primary} />
          <Text style={styles.backText}>Back to Trips</Text>
        </Pressable>
        <Text style={styles.title}>Create Trip</Text>
        <Text style={styles.subtitle}>Add a new journey to your personal shopper schedule.</Text>

        <View style={styles.form}>
          <Field label="Trip Name" value={name} onChangeText={setName} placeholder="e.g. Bangkok Shopping" />
          <Field label="Shopping Destination / Mall / Event" value={destination} onChangeText={setDestination} placeholder="e.g. ION Orchard" />
          <Text style={styles.label}>Trip Date</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{tripDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            <Calendar size={19} color={THEME.primary} />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={tripDate}
              mode="date"
              display="default"
              onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                setShowDatePicker(false);
                if (event.type === 'set' && selectedDate) setTripDate(selectedDate);
              }}
            />
          )}
          <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={submit} style={styles.submitButton}>
            <Text style={styles.submitText}>Create Trip</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.text.light}
        multiline={multiline}
        style={[styles.input, multiline && styles.notesInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: SPACING.sm, paddingVertical: SPACING.sm },
  backText: { color: THEME.primary, fontWeight: '700' },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: SPACING.xl },
  subtitle: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm, marginTop: SPACING.xs },
  form: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING['2xl'], marginTop: SPACING.xl, borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small },
  field: { marginBottom: SPACING.lg },
  label: { color: THEME.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '700', marginBottom: SPACING.sm },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, color: THEME.text.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, fontSize: FONT_SIZES.sm, backgroundColor: '#FCFCFD' },
  dateButton: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, backgroundColor: '#FCFCFD', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  dateText: { color: THEME.text.primary, fontSize: FONT_SIZES.sm },
  notesInput: { minHeight: 110, textAlignVertical: 'top' },
  error: { color: THEME.status.error, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md },
  submitButton: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZES.base },
});
