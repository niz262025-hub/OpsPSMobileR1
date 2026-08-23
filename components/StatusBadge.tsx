import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme';

type StatusType = 'pending' | 'payment_received' | 'packing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'in-stock' | 'low-stock' | 'out-of-stock';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending Purchase' },
  payment_received: { bg: '#DCFCE7', text: '#166534', label: 'Payment Received' },
  packing: { bg: '#E0E7FF', text: '#3730A3', label: 'Packing' },
  ready: { bg: '#D1FAE5', text: '#065F46', label: 'Ready to Ship' },
  shipped: { bg: '#DBEAFE', text: '#0C2340', label: 'Shipped' },
  delivered: { bg: '#D1FAE5', text: '#065F46', label: 'Delivered' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  'in-stock': { bg: '#D1FAE5', text: '#065F46', label: 'In Stock' },
  'low-stock': { bg: '#FEF3C7', text: '#92400E', label: 'Low Stock' },
  'out-of-stock': { bg: '#FEE2E2', text: '#7F1D1D', label: 'Out of Stock' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label || config.label;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.text,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});
