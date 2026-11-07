import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getDataSource, type ShipmentRecord } from '../../services/repository';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../theme';

export default function ShippingGenerateScreen() {
  const { orderId = '' } = useLocalSearchParams<{ orderId?: string }>();
  const { membership, business } = useAuth();
  const businessId = membership?.business_id ?? business?.id;
  const [recipient, setRecipient] = useState<{name:string;phone:string;address:string}|null>(null);
  const [weight, setWeight] = useState('');
  const [courier, setCourier] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [shipment, setShipment] = useState<ShipmentRecord|null>(null);
  useEffect(() => {
    let active = true;
    if (businessId && orderId) void getDataSource('production').orders.getForBusiness(businessId, orderId).then(order => {
      if (active && order) setRecipient({name:order.customerName,phone:order.customerPhone??'',address:order.deliveryAddress??''});
    }).catch(() => { if(active) setMessage('Order could not be loaded.'); });
    return () => { active=false; };
  },[businessId,orderId]);
  const submit = async () => {
    const parcelWeight=Number(weight);
    if (!recipient?.name || !recipient.phone || !recipient.address || !courier || !Number.isFinite(parcelWeight) || parcelWeight<=0 || parcelWeight>9999) {
      setMessage('Recipient details, courier and a valid parcel weight are required.');return;
    }
    if (!businessId || busy) return;
    setBusy(true);setMessage('');
    try {
      const result=await getDataSource('production').shipments.create({businessId,orderId,courier,parcelWeight});
      if(result) setShipment(result);
      else setMessage('Dispatch could not be saved. Check payment, packing and available stock, then retry.');
    } catch {setMessage('Dispatch could not be saved. Please retry.');}
    finally {setBusy(false);}
  };
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.contentContainer}>
    <TouchableOpacity accessibilityRole="button" onPress={()=>router.replace(`/order/${orderId}`)}><Text>Back to order</Text></TouchableOpacity>
    <Text style={styles.sectionTitle}>Manual dispatch</Text>
    {message ? <Text accessibilityRole="alert">{message}</Text> : null}
    {shipment ? <View>
      <Text style={styles.sectionTitle}>Manual dispatch recorded</Text>
      <Text>Dispatch and stock movement saved. Book the courier separately; no courier label or tracking number has been generated.</Text>
      <Text>Recipient: {shipment.recipientName}</Text><Text>Phone: {shipment.recipientPhone}</Text><Text>Address: {shipment.deliveryAddress}</Text>
      <Text>Courier: {shipment.courier}</Text><Text>Weight: {shipment.parcelWeight} kg</Text>
      <Text>Tracking: {shipment.trackingNumber ?? 'Not available — book courier separately'}</Text>
      <Text>AWB: {shipment.shipmentId ?? 'Not available'}</Text>
    </View> : <View>
      <Text style={styles.label}>Recipient from order</Text><Text>{recipient?.name ?? 'Loading order…'}</Text><Text>{recipient?.phone}</Text><Text>{recipient?.address}</Text>
      <Text style={styles.label}>Weight (kg)</Text><TextInput accessibilityLabel="Parcel weight" style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      <Text style={styles.label}>Courier</Text>
      {['J&T Express','Pos Laju','Skynet','Lazada Logistics','GD Express'].map(name=><TouchableOpacity key={name} accessibilityRole="button" accessibilityState={{selected:courier===name}} style={[styles.courierOption,courier===name&&styles.courierOptionActive]} onPress={()=>setCourier(name)}><Text>{name}</Text></TouchableOpacity>)}
      <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.generateButton} onPress={()=>void submit()}><Text style={styles.generateButtonText}>{busy?'Saving…':'Record manual dispatch'}</Text></TouchableOpacity>
    </View>}
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerTextWrap: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  headerLabel: {
    color: '#EDE9FE',
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: THEME.text.primary,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.secondary,
    marginBottom: SPACING.sm,
  },
  subLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.secondary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.base,
    borderWidth: 1,
    borderColor: THEME.border,
    color: THEME.text.primary,
  },
  dimensionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  dimensionInput: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  courierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  courierOption: {
    width: '48%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: THEME.border,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  courierOptionActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  courierText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.secondary,
  },
  courierTextActive: {
    color: '#FFFFFF',
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT_SIZES.base,
    marginLeft: SPACING.sm,
  },
  successCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: THEME.status.success,
  },
  successText: {
    fontSize: FONT_SIZES.base,
    color: THEME.status.success,
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  labelDetails: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...THEME.shadow.small,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  detailLabel: {
    fontSize: FONT_SIZES.sm,
    color: THEME.text.secondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: THEME.text.primary,
  },
  labelBox: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: THEME.primary,
    ...THEME.shadow.small,
  },
  labelBoxTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: THEME.text.secondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  trackingNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: THEME.primary,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  awbNumber: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: THEME.primary,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  copyButton: {
    flex: 1,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  copyButtonText: {
    color: THEME.primary,
    fontWeight: '700',
    fontSize: FONT_SIZES.base,
  },
  newLabelButton: {
    flex: 1,
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  newLabelButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT_SIZES.base,
  },
});
