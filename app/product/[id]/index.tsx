import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';

import {
  completeCustomerPayment,
  confirmPayLater,
  getConfiguredPaymentMethods,
  getCustomerRequestForProduct,
  getOrder,
  getProduct,
  getProductVariantByProduct,
  submitCustomerOrder,
  useMockDatabase,
} from '../../../services/mockDatabase';
import {
  BORDER_RADIUS,
  FONT_SIZES,
  SPACING,
  THEME,
} from '../../../theme';

const isReasonableMalaysianPhone = (value: string) => {
  const cleaned = value.replace(/\s+/g, '').replace(/-/g, '');
  const normalized = cleaned.startsWith('+60') ? `0${cleaned.slice(3)}` : cleaned;
  return /^0\d{9,10}$/.test(normalized);
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useMockDatabase();

  const [quantity, setQuantity] = useState('1');
  const [selectedSize, setSelectedSize] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [requestStatus, setRequestStatus] = useState<string>('PENDING_AVAILABILITY');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const product = id ? getProduct(id, db) : undefined;
  const paymentMethods = getConfiguredPaymentMethods(db.paymentSettings);

  const syncRequestFromStore = React.useCallback(async (productId?: string) => {
    if (!productId) {
      return;
    }

    const storageKey = `opsps:customer-request:${productId}`;
    const storedId = await AsyncStorage.getItem(storageKey);
    const order = storedId ? getOrder(storedId, db) : undefined;
    const discovered = order ?? getCustomerRequestForProduct(productId, undefined, db);

    if (!discovered) {
      if (storedId) {
        setRequestId('');
        setRequestSent(false);
        setRequestStatus('PENDING_AVAILABILITY');
      }
      return;
    }

    setRequestId(discovered.id);
    setRequestSent(true);
    setRequestStatus(discovered.requestStatus ?? 'PENDING_AVAILABILITY');

    if (storedId !== discovered.id) {
      await AsyncStorage.setItem(storageKey, discovered.id);
    }
  }, [db]);

  useEffect(() => {
    if (!id) {
      return;
    }

    void syncRequestFromStore(id);
  }, [db, id, syncRequestFromStore]);

  useEffect(() => {
    if (!requestId) {
      return;
    }

    const liveOrder = getOrder(requestId, db);
    if (liveOrder) {
      setRequestStatus(liveOrder.requestStatus ?? 'PENDING_AVAILABILITY');
      setRequestSent(true);
    }
  }, [db, requestId]);

  useFocusEffect(
    React.useCallback(() => {
      if (!id) {
        return;
      }

      void syncRequestFromStore(id);
    }, [id, syncRequestFromStore])
  );

  const variants = useMemo(
    () => (product ? getProductVariantByProduct(product.id, db) : []),
    [product, db]
  );

  const activeVariant =
    variants.find((variant) => variant.size === selectedSize) ?? variants[0];

  const quantityNumber = Math.max(1, Number(quantity) || 1);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Product Not Found</Text>
          <Text style={styles.emptyText}>
            This product is no longer available.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sizes = variants.map((variant) => variant.size);
  const total = product.sellingPrice * quantityNumber;

  const submitCustomerRequest = async () => {
    if (!activeVariant) {
      return;
    }

    const name = fullName.trim();
    const phone = phoneNumber.trim();
    const address = deliveryAddress.trim();

    if (!name) {
      setFormError('Full Name is required.');
      return;
    }

    if (!phone) {
      setFormError('Phone Number is required.');
      return;
    }

    if (!isReasonableMalaysianPhone(phone)) {
      setFormError('Please enter a valid Malaysian phone number.');
      return;
    }

    if (!address) {
      setFormError('Delivery Address is required.');
      return;
    }

    const existing = id ? getCustomerRequestForProduct(id, undefined, db) : undefined;
    const order = existing ?? submitCustomerOrder({
      productId: product.id,
      productVariantId: activeVariant.id,
      quantity: quantityNumber,
      customerName: name,
      customerPhone: phone,
      deliveryAddress: address,
      customerId: `customer-${product.id}`,
    });

    if (!order) {
      return;
    }

    setFormError('');
    await AsyncStorage.setItem(`opsps:customer-request:${product.id}`, order.id);
    setRequestId(order.id);
    setRequestSent(true);
    setRequestStatus(order.requestStatus ?? 'PENDING_AVAILABILITY');
    setShowRequestForm(false);
    setFullName('');
    setPhoneNumber('');
    setDeliveryAddress('');
  };

  const handleWantThis = () => {
    if (!activeVariant) {
      return;
    }

    setShowRequestForm(true);
    setFormError('');
  };

  const confirmPayLaterFromCustomer = () => {
    if (!requestId) {
      return;
    }

    const order = getOrder(requestId, db);
    if (!order) {
      return;
    }

    confirmPayLater(order.id);
    setRequestStatus('PAY_LATER_OFFERED');
  };

  const openPaymentModal = () => {
    const availableMethods = paymentMethods.length > 0 ? paymentMethods : ['Bank Transfer'];
    setSelectedPaymentMethod(availableMethods[0]);
    setPaymentSheetVisible(true);
  };

  const completeSelectedPayment = async () => {
    if (!requestId) {
      return;
    }

    const order = getOrder(requestId, db);
    if (!order) {
      return;
    }

    const method = selectedPaymentMethod || 'Bank Transfer';
    const result = completeCustomerPayment(order.id, method);
    if (!result) {
      Alert.alert('Payment Error', 'Unable to complete this payment.');
      return;
    }

    setPaymentSheetVisible(false);
    setRequestStatus('PAID');
    Alert.alert('Payment Successful', `Receipt generated: ${result.receiptNumber}`);
  };

  const currentOrder = requestId ? getOrder(requestId, db) : undefined;
  const liveRequestStatus = currentOrder?.requestStatus ?? requestStatus;

  if (requestSent) {
    const statusText = liveRequestStatus === 'OUT_OF_STOCK'
      ? 'Sorry, this product is currently unavailable.'
      : liveRequestStatus === 'AVAILABLE'
        ? 'Your personal shopper has confirmed availability.'
        : liveRequestStatus === 'PENDING_PAYMENT' || liveRequestStatus === 'PAYMENT_REQUESTED'
          ? 'Payment Required'
          : liveRequestStatus === 'PAY_LATER_OFFERED'
            ? 'Payment Option\nPay Later'
            : liveRequestStatus === 'PAYMENT_REQUIRED'
              ? 'Payment Required'
              : liveRequestStatus === 'PAYMENT_RECEIVED'
                ? 'Payment received and order confirmed.'
                : liveRequestStatus === 'PACKING'
                  ? 'Your order is being packed.'
                  : liveRequestStatus === 'SHIPPED'
                    ? 'Your order has been shipped.'
                    : liveRequestStatus === 'DELIVERED'
                      ? 'Your order has been delivered.'
                      : liveRequestStatus === 'PAID'
                        ? 'Payment Successful'
                        : 'We\'ve sent your request to the personal shopper. Please wait for confirmation.';

    const receipt = currentOrder?.receipt;
    const fulfilmentSteps = [
      { key: 'PAYMENT_RECEIVED', label: 'Payment Received', active: ['PAYMENT_RECEIVED', 'PACKING', 'SHIPPED', 'DELIVERED'].includes(liveRequestStatus) },
      { key: 'PACKING', label: 'Packing', active: ['PACKING', 'SHIPPED', 'DELIVERED'].includes(liveRequestStatus) },
      { key: 'SHIPPED', label: 'Shipped', active: ['SHIPPED', 'DELIVERED'].includes(liveRequestStatus) },
      { key: 'DELIVERED', label: 'Delivered', active: liveRequestStatus === 'DELIVERED' },
    ];

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerCard}>
          <Text style={styles.successTitle}>
            {liveRequestStatus === 'OUT_OF_STOCK'
              ? 'Unavailable'
              : liveRequestStatus === 'AVAILABLE' || liveRequestStatus === 'PENDING_PAYMENT' || liveRequestStatus === 'PAYMENT_REQUESTED' || liveRequestStatus === 'PAY_LATER_OFFERED' || liveRequestStatus === 'PAYMENT_RECEIVED' || liveRequestStatus === 'PACKING' || liveRequestStatus === 'SHIPPED' || liveRequestStatus === 'DELIVERED' || liveRequestStatus === 'PAID'
                ? 'Product Available'
                : 'Request Sent'}
          </Text>

          {(liveRequestStatus === 'AVAILABLE' || liveRequestStatus === 'PENDING_PAYMENT' || liveRequestStatus === 'PAYMENT_REQUESTED' || liveRequestStatus === 'PAY_LATER_OFFERED' || liveRequestStatus === 'PAYMENT_RECEIVED' || liveRequestStatus === 'PACKING' || liveRequestStatus === 'SHIPPED' || liveRequestStatus === 'DELIVERED' || liveRequestStatus === 'PAID') && (
            <Text style={styles.successText}>Your personal shopper has confirmed availability.</Text>
          )}

          {!['AVAILABLE', 'PENDING_PAYMENT', 'PAYMENT_REQUESTED', 'PAY_LATER_OFFERED', 'PAYMENT_RECEIVED', 'PACKING', 'SHIPPED', 'DELIVERED', 'PAID'].includes(liveRequestStatus) && (
            <Text style={styles.successText}>{statusText}</Text>
          )}

          {requestId ? (
            <Text style={styles.requestId}>Request ID: {requestId}</Text>
          ) : null}

          {liveRequestStatus === 'PENDING_AVAILABILITY' && (
            <Text style={styles.statusText}>Status: Waiting for personal shopper confirmation.</Text>
          )}

          {(liveRequestStatus === 'PENDING_PAYMENT' || liveRequestStatus === 'PAYMENT_REQUESTED' || liveRequestStatus === 'PAYMENT_REQUIRED') && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Payment Required</Text>
              <Text style={styles.infoPrice}>Amount: RM{product.sellingPrice.toFixed(2)}</Text>
              <Pressable style={styles.primaryButton} onPress={openPaymentModal}>
                <Text style={styles.primaryButtonText}>Proceed to Payment</Text>
              </Pressable>
            </View>
          )}

          {(liveRequestStatus === 'PAYMENT_RECEIVED' || liveRequestStatus === 'PACKING' || liveRequestStatus === 'SHIPPED' || liveRequestStatus === 'DELIVERED') && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Order Progress</Text>
              {fulfilmentSteps.map((step) => (
                <Text key={step.key} style={[styles.statusText, step.active && styles.statusTextActive]}>
                  {step.active ? '✓' : '○'} {step.label}
                </Text>
              ))}
            </View>
          )}

          {liveRequestStatus === 'PAY_LATER_OFFERED' && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Payment Option</Text>
              <Text style={styles.infoPrice}>Pay Later</Text>
              <Pressable style={styles.primaryButton} onPress={() => confirmPayLaterFromCustomer()}>
                <Text style={styles.primaryButtonText}>Confirm Pay Later</Text>
              </Pressable>
            </View>
          )}

          {liveRequestStatus === 'PAID' && receipt && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Receipt</Text>
              <Text style={styles.infoPrice}>RCPT-{receipt.receiptNumber}</Text>
              <Text style={styles.statusText}>Total: RM{receipt.amount.toFixed(2)}</Text>
            </View>
          )}

          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back</Text>
          </Pressable>
        </View>

        <Modal visible={paymentSheetVisible} transparent animationType="slide" onRequestClose={() => setPaymentSheetVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPaymentSheetVisible(false)}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Payment</Text>
              <Text style={styles.modalText}>Order: {requestId}</Text>
              <Text style={styles.modalText}>Product: {product.name}</Text>
              <Text style={styles.modalText}>Total: RM{product.sellingPrice.toFixed(2)}</Text>

              <View style={styles.methodRow}>
                {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                  <Pressable key={method} style={styles.methodButton} onPress={() => setSelectedPaymentMethod(method)}>
                    <Text style={styles.methodButtonText}>{method}</Text>
                  </Pressable>
                )) : (
                  <Pressable style={styles.methodButton} onPress={() => setSelectedPaymentMethod('Bank Transfer')}>
                    <Text style={styles.methodButtonText}>Bank Transfer</Text>
                  </Pressable>
                )}
              </View>

              {selectedPaymentMethod === 'Bank Transfer' && (
                <View style={styles.bankCard}>
                  <Text style={styles.paymentLabel}>Bank</Text>
                  <Text style={styles.paymentValue}>{db.paymentSettings.bankName || 'Bank not configured'}</Text>
                  <Text style={styles.paymentLabel}>Account Name</Text>
                  <Text style={styles.paymentValue}>{db.paymentSettings.accountName || 'Not configured'}</Text>
                  <Text style={styles.paymentLabel}>Account Number</Text>
                  <Text style={styles.paymentValue}>{db.paymentSettings.accountNumber || 'Not configured'}</Text>
                  <Text style={styles.paymentLabel}>Amount</Text>
                  <Text style={styles.paymentValue}>RM{product.sellingPrice.toFixed(2)}</Text>
                </View>
              )}

              {selectedPaymentMethod === 'QR Payment' && (
                <View style={styles.bankCard}>
                  <Text style={styles.paymentLabel}>QR Payment</Text>
                  <Text style={styles.paymentValue}>RM{product.sellingPrice.toFixed(2)}</Text>
                  {db.paymentSettings.qrImageUri ? (
                    <Image source={{ uri: db.paymentSettings.qrImageUri }} style={styles.qrImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.paymentValue}>No QR image configured in Settings.</Text>
                  )}
                </View>
              )}

              {selectedPaymentMethod === 'Buy Now Pay Later' && (
                <View style={styles.bankCard}>
                  <Text style={styles.paymentLabel}>Pay Later</Text>
                  <Text style={styles.paymentValue}>RM{product.sellingPrice.toFixed(2)}</Text>
                  <Text style={styles.paymentValue}>This payment method is enabled in Settings.</Text>
                </View>
              )}

              {selectedPaymentMethod === 'Atome' && (
                <View style={styles.bankCard}>
                  <Text style={styles.paymentLabel}>Atome</Text>
                  <Text style={styles.paymentValue}>RM{product.sellingPrice.toFixed(2)}</Text>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      const atomeUrl = 'https://www.atome.my/';
                      void Linking.openURL(atomeUrl);
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Continue with Atome</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.paymentActionRow}>
                <Pressable style={styles.primaryButton} onPress={() => { void completeSelectedPayment(); }}>
                  <Text style={styles.primaryButtonText}>I’ve Completed Payment</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={() => setPaymentSheetVisible(false)}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={THEME.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.imageCard}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ShoppingBag size={42} color={THEME.text.light} />
              <Text style={styles.emptyText}>No product image</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.trip}>
            Trip: {db.trips.find((trip) => trip.id === product.tripId)?.name ?? 'Marketplace product'}
          </Text>
          <Text style={styles.price}>RM{product.sellingPrice.toFixed(2)}</Text>

          {!!product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}

          <View style={styles.divider} />

          {sizes.length > 0 && (
            <>
              <Text style={styles.label}>Size</Text>
              <View style={styles.sizeRow}>
                {sizes.map((size) => {
                  const variant = variants.find((item) => item.size === size);
                  const isSelected = (selectedSize || activeVariant?.size) === size;

                  return (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.sizeButton,
                        isSelected && styles.sizeButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          isSelected && styles.sizeTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Quantity</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.quantityInput}
            placeholder="1"
            placeholderTextColor={THEME.text.light}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>RM{total.toFixed(2)}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleWantThis}>
            <ShoppingBag size={19} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>I Want This Product</Text>
          </Pressable>
        </View>

        {showRequestForm && (
          <View style={styles.formCard}>
            <Text style={styles.modalTitle}>Request This Product</Text>
            <Text style={styles.modalText}>Product: {product.name}</Text>
            <Text style={styles.modalText}>Size: {activeVariant?.size ?? 'Standard'}</Text>
            <Text style={styles.modalText}>Quantity: {quantityNumber}</Text>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Full Name" style={styles.input} placeholderTextColor={THEME.text.light} />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="e.g. 0123456789" style={styles.input} placeholderTextColor={THEME.text.light} />

            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <TextInput value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="Delivery Address" multiline numberOfLines={3} style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} placeholderTextColor={THEME.text.light} />

            {!!formError && <Text style={styles.formError}>{formError}</Text>}

            <Pressable style={styles.primaryButton} onPress={() => { void submitCustomerRequest(); }}>
              <Text style={styles.primaryButtonText}>Submit Request</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  centerCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  successTitle: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  successText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  requestId: {
    color: THEME.primary,
    fontWeight: '700',
    marginBottom: SPACING.lg,
  },
  statusText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  statusTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  infoBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  infoTitle: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  infoPrice: {
    color: THEME.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  infoLink: {
    color: THEME.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyTitle: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  emptyText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.lg,
  },
  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: SPACING['2xl'],
    paddingBottom: SPACING['3xl'],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  backText: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  imageCard: {
    width: '100%',
    minHeight: 320,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  infoCard: {
    padding: SPACING['2xl'],
    marginTop: SPACING.lg,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  category: {
    color: THEME.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    marginTop: SPACING.xs,
  },
  trip: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  price: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  description: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: SPACING.lg,
  },
  label: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sizeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#FFFFFF',
  },
  sizeButtonSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  sizeText: {
    color: THEME.text.primary,
    fontWeight: '700',
  },
  sizeTextSelected: {
    color: '#FFFFFF',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: THEME.text.primary,
    backgroundColor: '#FCFCFD',
    marginBottom: SPACING.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  totalLabel: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  totalValue: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: THEME.text.primary,
    backgroundColor: '#FCFCFD',
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  formError: {
    color: THEME.status.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,15,35,0.35)',
  },
  modalSheet: {
    backgroundColor: THEME.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING['2xl'],
    maxHeight: '80%',
  },
  modalTitle: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  modalText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  methodRow: {
    gap: SPACING.sm,
  },
  methodButton: {
    backgroundColor: '#F5F3FF',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  methodButtonText: {
    color: THEME.primary,
    fontWeight: '800',
  },
  bankCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  qrImage: {
    width: '100%',
    height: 220,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    backgroundColor: '#F3F4F6',
  },
  paymentActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  paymentLabel: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  paymentValue: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryButtonText: {
    color: THEME.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },
});
