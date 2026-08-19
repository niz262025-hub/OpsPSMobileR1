import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

type Product = {
  name?: string;
  brand?: string;
  sizeVariant?: string;
  sellingPrice?: number;
  price?: number;
  quantity?: number;
  stock?: number;
  location?: string;
  notes?: string;
  imageUrls?: string[];
  imageUrl?: string;
  source?: string;
  readyStockEnabled?: boolean;
  preOrderEnabled?: boolean;
};

export default function ProductStorefront() {
  const { productId } = useLocalSearchParams<{
    productId: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMode, setPaymentMode] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(db, 'products', productId)
        );

        if (snapshot.exists()) {
          setProduct(snapshot.data() as Product);
        }
      } catch (error) {
        console.error('Storefront product error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleOrder = async () => {
    if (!productId || !product) return;

    if (!customerName.trim()) {
      alert('Please enter your name.');
      return;
    }

    if (!customerContact.trim()) {
      alert('Please enter your WhatsApp / contact number.');
      return;
    }

    if (!customerAddress.trim()) {
      alert('Please enter your delivery address.');
      return;
    }

    const orderQuantity = Number(quantity);
    const availableQuantity =
      product.quantity ?? product.stock ?? 0;

    if (!Number.isInteger(orderQuantity) || orderQuantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (orderQuantity > availableQuantity) {
      alert(
        `Only ${availableQuantity} unit(s) available.`
      );
      return;
    }

    const sellingPrice =
      product.sellingPrice ?? product.price ?? 0;

    const totalAmount = sellingPrice * orderQuantity;
    const isPayNow = paymentMode === 'pay_now';

    try {
      setOrdering(true);

      const productRef = doc(
        db,
        'products',
        productId
      );

      const orderRef = doc(
        collection(db, 'orders')
      );

      await runTransaction(db, async (transaction) => {
        const productSnapshot =
          await transaction.get(productRef);

        if (!productSnapshot.exists()) {
          throw new Error('Product no longer exists.');
        }

        const latestProduct =
          productSnapshot.data();

        const ownerId = latestProduct.ownerId || '';

        const latestQuantity =
          Number(
            latestProduct.quantity ??
            latestProduct.stock ??
            0
          );

        if (orderQuantity > latestQuantity) {
          throw new Error(
            `Only ${latestQuantity} unit(s) available.`
          );
        }

        const isReadyStock =
          latestProduct.readyStockEnabled === true;

        const newQuantity =
          isReadyStock
            ? latestQuantity - orderQuantity
            : latestQuantity;

        const orderStatus = isPayNow ? 'New' : 'Pending Payment';

        transaction.set(orderRef, {
          ownerId,
          productId,

          product: latestProduct.name || '',
          productName: latestProduct.name || '',
          status: isPayNow ? 'In Buy List' : 'Pending Payment',
          buyListStatus: isPayNow ? 'In Buy List' : 'Pending Payment',
          productImage:
            latestProduct.imageUrls?.[0] ||
            latestProduct.imageUrl ||
            '',

          customer: customerName.trim(),
          customerName: customerName.trim(),

          phone: customerContact.trim(),
          customerContact:
            customerContact.trim(),

          address: customerAddress.trim(),
          customerAddress:
            customerAddress.trim(),

          qty: orderQuantity,
          quantity: orderQuantity,

          unitPrice: Number(
            latestProduct.sellingPrice ??
            latestProduct.price ??
            0
          ),

          amount: Number(totalAmount),
          totalAmount: Number(totalAmount),

          source:
            latestProduct.source ||
            'Outside Trip',

          sourceType:
            latestProduct.source ||
            'Outside Trip',

          paymentMethod: paymentMode,
          paymentStatus: isPayNow ? 'Paid' : 'Awaiting Payment',
          orderStatus,

          stockDeducted: isReadyStock && isPayNow,
          stockDeductedQuantity:
            isReadyStock && isPayNow
              ? orderQuantity
              : 0,

          createdAt:
            serverTimestamp(),
        });

        if (isReadyStock && isPayNow) {
          transaction.update(
            productRef,
            {
              quantity: newQuantity,
              stock: newQuantity,
              updatedAt:
                serverTimestamp(),
            }
          );
        }
      });

      alert(
        `Order Submitted Successfully!\n\n` +
        `${product.name || 'Product'}\n` +
        `Quantity: ${orderQuantity}\n` +
        `Total: RM ${totalAmount.toFixed(2)}\n` +
        `${isPayNow ? 'Payment confirmed' : 'Payment will be completed later'}\n\n` +
        `Order ID: ${orderRef.id}`
      );

      setCustomerName('');
      setCustomerContact('');
      setCustomerAddress('');
      setQuantity('1');
    } catch (error) {
      console.error('Create order error:', error);

      alert(
        'Unable to submit order. Please try again.'
      );
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#6C3FE8"
          />

          <Text style={styles.loadingText}>
            Loading product...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.errorTitle}>
            Product not found
          </Text>

          <Text style={styles.errorText}>
            This product link may be invalid or the product
            is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const sellingPrice =
    product.sellingPrice ?? product.price ?? 0;

  const availableQuantity =
    product.quantity ?? product.stock ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHeader}>
          <Text style={styles.brandName}>
            OpsPS
          </Text>

          <Text style={styles.brandSubtitle}>
            Personal Shopper Marketplace
          </Text>
        </View>

        {/* PRODUCT IMAGE */}
        <View style={styles.imageCard}>
          {images.length > 0 ? (
            <>
              <Image
                source={{
                  uri: images[selectedImage],
                }}
                style={styles.mainImage}
              />

              {images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                >
                  {images.map((uri, index) => (
                    <Pressable
                      key={`${uri}-${index}`}
                      onPress={() =>
                        setSelectedImage(index)
                      }
                      style={[
                        styles.thumbnailBox,
                        selectedImage === index &&
                          styles.thumbnailSelected,
                      ]}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.thumbnail}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageIcon}>
                📦
              </Text>

              <Text style={styles.noImageText}>
                Product Image
              </Text>
            </View>
          )}
        </View>

        {/* PRODUCT */}
        <View style={styles.card}>
          {product.brand && (
            <Text style={styles.brand}>
              {product.brand}
            </Text>
          )}

          <Text style={styles.productName}>
            {product.name || 'Product'}
          </Text>

          <Text style={styles.priceLabel}>
            Selling Price
          </Text>

          <Text style={styles.price}>
            RM {Number(sellingPrice).toFixed(2)}
          </Text>

          <View style={styles.badges}>
            {product.readyStockEnabled && (
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>
                  READY STOCK
                </Text>
              </View>
            )}

            {product.preOrderEnabled && (
              <View style={styles.groupBadge}>
                <Text style={styles.groupText}>
                  POST TO GROUP
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              {product.source || 'Outside Trip'}
            </Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Product Details
          </Text>

          <InfoRow
            label="Size / Variant"
            value={product.sizeVariant || '-'}
          />

          <InfoRow
            label="Available"
            value={`${availableQuantity} unit(s)`}
          />

          {product.location && (
            <InfoRow
              label="Location"
              value={product.location}
            />
          )}

          {product.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>
                Notes
              </Text>

              <Text style={styles.notes}>
                {product.notes}
              </Text>
            </View>
          )}
        </View>

        {/* CUSTOMER ORDER */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Place Your Order
          </Text>

          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#9CA3AF"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.label}>
            WhatsApp / Contact
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Your contact number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={customerContact}
            onChangeText={setCustomerContact}
          />

          <Text style={styles.label}>
            Delivery Address
          </Text>

          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="House / Unit, Street, Area, Postcode, City, State"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={customerAddress}
            onChangeText={setCustomerAddress}
          />

          <Text style={styles.label}>
            Quantity
          </Text>

          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.label}>
            Payment Method
          </Text>

          <View style={styles.paymentRow}>
            <Pressable
              style={[
                styles.paymentOption,
                paymentMode === 'pay_now' && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMode('pay_now')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMode === 'pay_now' && styles.paymentOptionTextSelected,
                ]}
              >
                Pay now
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.paymentOption,
                paymentMode === 'pay_later' && styles.paymentOptionSelected,
              ]}
              onPress={() => setPaymentMode('pay_later')}
            >
              <Text
                style={[
                  styles.paymentOptionText,
                  paymentMode === 'pay_later' && styles.paymentOptionTextSelected,
                ]}
              >
                Pay later
              </Text>
            </Pressable>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>
              Estimated Total
            </Text>

            <Text style={styles.totalPrice}>
              RM{' '}
              {(
                Number(sellingPrice) *
                Math.max(Number(quantity) || 0, 0)
              ).toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={[
              styles.orderButton,
              ordering && styles.orderButtonDisabled,
            ]}
            onPress={handleOrder}
            disabled={ordering}
          >
            {ordering ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.orderButtonText}>
                Place Order
              </Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Powered by OpsPS Marketplace
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
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

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: '#817B89',
  },

  errorTitle: {
    color: '#211A2D',
    fontSize: 22,
    fontWeight: '900',
  },

  errorText: {
    color: '#817B89',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  brandHeader: {
    marginBottom: 18,
  },

  brandName: {
    color: '#6C3FE8',
    fontSize: 24,
    fontWeight: '900',
  },

  brandSubtitle: {
    color: '#817B89',
    fontSize: 12,
    marginTop: 2,
  },

  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },

  mainImage: {
    width: '100%',
    height: 340,
    borderRadius: 16,
  },

  thumbnailRow: {
    gap: 8,
    paddingTop: 10,
  },

  thumbnailBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  thumbnailSelected: {
    borderColor: '#6C3FE8',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  noImage: {
    height: 340,
    borderRadius: 16,
    backgroundColor: '#F0EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noImageIcon: {
    fontSize: 48,
  },

  noImageText: {
    marginTop: 8,
    color: '#817B89',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },

  brand: {
    color: '#817B89',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },

  productName: {
    color: '#211A2D',
    fontSize: 27,
    fontWeight: '900',
  },

  priceLabel: {
    color: '#817B89',
    fontSize: 12,
    marginTop: 16,
  },

  price: {
    color: '#5B2BD9',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
  },

  readyBadge: {
    backgroundColor: '#FFF3DD',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  readyText: {
    color: '#9A6400',
    fontSize: 9,
    fontWeight: '900',
  },

  groupBadge: {
    backgroundColor: '#EAF7EF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  groupText: {
    color: '#287A45',
    fontSize: 9,
    fontWeight: '900',
  },

  sourceBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#EEE9FF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  sourceText: {
    color: '#6C3FE8',
    fontSize: 10,
    fontWeight: '900',
  },

  sectionTitle: {
    color: '#211A2D',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF5',
  },

  infoLabel: {
    color: '#817B89',
    fontSize: 13,
  },

  infoValue: {
    color: '#211A2D',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },

  notesBox: {
    marginTop: 14,
  },

  notesLabel: {
    color: '#211A2D',
    fontWeight: '800',
    marginBottom: 5,
  },

  notes: {
    color: '#5F5968',
    fontSize: 13,
    lineHeight: 20,
  },

  label: {
    color: '#211A2D',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 8,
  },

  input: {
    backgroundColor: '#F8F7FC',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 14,
    color: '#211A2D',
    fontSize: 14,
  },

  addressInput: {
    minHeight: 100,
  },

  paymentRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },

  paymentOption: {
    flex: 1,
    backgroundColor: '#F8F7FC',
    borderWidth: 1,
    borderColor: '#D9D2F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  paymentOptionSelected: {
    backgroundColor: '#F3EEFF',
    borderColor: '#5B2BD9',
  },

  paymentOptionText: {
    color: '#51476A',
    fontSize: 13,
    fontWeight: '800',
  },

  paymentOptionTextSelected: {
    color: '#5B2BD9',
  },

  totalBox: {
    marginTop: 18,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#F5F1FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  totalLabel: {
    color: '#817B89',
    fontSize: 13,
    fontWeight: '700',
  },

  totalPrice: {
    color: '#5B2BD9',
    fontSize: 20,
    fontWeight: '900',
  },

  orderButton: {
    marginTop: 14,
    backgroundColor: '#6C3FE8',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
  },

  orderButtonDisabled: {
    opacity: 0.6,
  },

  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  footer: {
    textAlign: 'center',
    color: '#9A95A1',
    fontSize: 11,
    marginTop: 8,
  },
});
