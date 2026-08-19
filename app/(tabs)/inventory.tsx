import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { currency } from '../../currency';
import { useAuth } from '../context/AuthContext';

type Product = {
  id: string;
  name?: string;
  brand?: string;
  category?: string;
  sellingPrice?: number;
  quantity?: number;
  stock?: number;
  readyStockEnabled?: boolean;
  imageUrl?: string;
};

export default function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] =
    useState<Product[]>([]);

  const [queryText, setQueryText] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'products'),
      where('ownerId', '==', user.uid),
      where(
        'readyStockEnabled',
        '==',
        true
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Product[] =
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<
              Product,
              'id'
            >),
          }));

        setProducts(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Inventory error:',
          error
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const filtered = useMemo(() => {
    const q =
      queryText.trim().toLowerCase();

    if (!q) {
      return products;
    }

    return products.filter(
      (product) =>
        (product.name || '')
          .toLowerCase()
          .includes(q) ||
        (product.brand || '')
          .toLowerCase()
          .includes(q) ||
        (product.category || '')
          .toLowerCase()
          .includes(q)
    );
  }, [products, queryText]);

  const getStock = (
    product: Product
  ) => {
    if (
      typeof product.quantity ===
      'number'
    ) {
      return product.quantity;
    }

    if (
      typeof product.stock ===
      'number'
    ) {
      return product.stock;
    }

    return 0;
  };

  const totalStock = products.reduce(
    (sum, product) =>
      sum + getStock(product),
    0
  );

  const stockValue = products.reduce(
    (sum, product) =>
      sum +
      Number(
        product.sellingPrice || 0
      ) *
        getStock(product),
    0
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#5B2BD9"
          />

          <Text style={styles.loadingText}>
            Loading inventory...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.title}>
          Inventory
        </Text>

        <Text style={styles.subtitle}>
          Ready stock products available
          in Marketplace
        </Text>

        <TextInput
          style={styles.search}
          placeholder="Search product"
          placeholderTextColor="#9CA3AF"
          value={queryText}
          onChangeText={setQueryText}
        />

        <Pressable
          style={styles.addButton}
          onPress={() =>
            router.push(
              '/upload-product'
            )
          }
        >
          <Text style={styles.addText}>
            + Add Ready Stock Product
          </Text>
        </Pressable>

        {filtered.length === 0 ? (
          <View
            style={styles.emptyCard}
          >
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No ready stock products
            </Text>

            <Text
              style={styles.emptyText}
            >
              Products marked as Ready
              Stock will appear here.
            </Text>
          </View>
        ) : (
          filtered.map((product) => {
            const stock =
              getStock(product);

            return (
              <View
                key={product.id}
                style={styles.card}
              >
                <View
                  style={
                    styles.imagePlaceholder
                  }
                >
                  <Text
                    style={
                      styles.imageText
                    }
                  >
                    {product.imageUrl
                      ? 'IMAGE'
                      : 'IMG'}
                  </Text>
                </View>

                <View
                  style={styles.cardBody}
                >
                  <Text
                    style={styles.category}
                  >
                    READY STOCK
                  </Text>

                  <Text
                    style={styles.name}
                  >
                    {product.name ||
                      'Unnamed Product'}
                  </Text>

                  {!!product.brand && (
                    <Text
                      style={styles.brand}
                    >
                      {product.brand}
                    </Text>
                  )}

                  <View
                    style={styles.row}
                  >
                    <Text
                      style={styles.price}
                    >
                      {currency.format(
                        Number(
                          product.sellingPrice ||
                            0
                        )
                      )}
                    </Text>

                    <View
                      style={[
                        styles.stockBadge,
                        stock === 0 &&
                          styles.outOfStock,
                        stock > 0 &&
                          stock <= 2 &&
                          styles.lowStock,
                      ]}
                    >
                      <Text
                        style={
                          styles.stockText
                        }
                      >
                        {stock === 0
                          ? 'Out of Stock'
                          : `${stock} in stock`}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={styles.actions}
                  >
                    <Pressable
                      style={
                        styles.secondaryButton
                      }
                      onPress={() =>
                        router.push({
                          pathname:
                            '/product/detail',
                          params: {
                            id: product.id,
                          },
                        })
                      }
                    >
                      <Text
                        style={
                          styles.secondaryText
                        }
                      >
                        View
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.primaryButton
                      }
                      onPress={() =>
                        router.push(
                          '/marketplace'
                        )
                      }
                    >
                      <Text
                        style={
                          styles.primaryText
                        }
                      >
                        Marketplace
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View
          style={styles.summaryCard}
        >
          <Text
            style={styles.summaryTitle}
          >
            Inventory Summary
          </Text>

          <View
            style={styles.summaryRow}
          >
            <Text
              style={styles.summaryLabel}
            >
              Total Products
            </Text>

            <Text
              style={styles.summaryValue}
            >
              {products.length}
            </Text>
          </View>

          <View
            style={styles.summaryRow}
          >
            <Text
              style={styles.summaryLabel}
            >
              Total Stock Units
            </Text>

            <Text
              style={styles.summaryValue}
            >
              {totalStock}
            </Text>
          </View>

          <View
            style={styles.summaryRow}
          >
            <Text
              style={styles.summaryLabel}
            >
              Ready Stock Value
            </Text>

            <Text
              style={styles.summaryValue}
            >
              {currency.format(
                stockValue
              )}
            </Text>
          </View>
        </View>
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

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B6B8A',
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

  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    color: '#181145',
  },

  addButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },

  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },

  imagePlaceholder: {
    height: 160,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageText: {
    color: '#5B2BD9',
    fontWeight: '900',
    fontSize: 18,
  },

  cardBody: {
    marginTop: 16,
  },

  category: {
    color: '#16A34A',
    fontWeight: '800',
  },

  name: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
  },

  brand: {
    color: '#6B6B8A',
    marginTop: 4,
    fontWeight: '600',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  price: {
    color: '#EC4C99',
    fontSize: 24,
    fontWeight: '900',
  },

  stockBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  lowStock: {
    backgroundColor: '#FEF3C7',
  },

  outOfStock: {
    backgroundColor: '#FEE2E2',
  },

  stockText: {
    color: '#181145',
    fontWeight: '800',
    fontSize: 12,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F0FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  secondaryText: {
    color: '#5B2BD9',
    fontWeight: '800',
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#5B2BD9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginTop: 8,
  },

  summaryTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  summaryLabel: {
    color: '#6B6B8A',
  },

  summaryValue: {
    color: '#181145',
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },

  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '900',
  },

  emptyText: {
    color: '#6B6B8A',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 20,
  },
});
