import { getSupabaseClient } from './supabaseClient';
import {
  createProduct,
  createTrip,
  getMockDatabaseSnapshot,
  getProduct,
  getProductVariant,
  getTripProducts,
  getTripOrders,
  getTripProfit,
  type Product,
  type ProductCategory,
  type TripRecord,
} from './mockDatabase';

export type OpspsRole = 'founder' | 'customer' | 'admin' | 'support';

export type BusinessRecord = {
  id: string;
  name: string;
  slug?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProfileRecord = {
  id: string;
  business_id?: string | null;
  auth_user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: OpspsRole;
};

export type MembershipRecord = {
  id: string;
  business_id: string;
  user_id: string;
  role: OpspsRole;
};

export interface AuthRepository {
  registerFounder(input: {
    email: string;
    password: string;
    name: string;
    businessName?: string;
    phone?: string;
    address?: string;
  }): Promise<{ ok: boolean; businessId?: string; userId?: string; error?: string }>;
  login(input: { email: string; password: string; role: OpspsRole }): Promise<{ ok: boolean; businessId?: string; userId?: string; error?: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<{ email: string; name: string; role: OpspsRole; businessId?: string } | null>;
}

export interface BusinessRepository {
  getCurrentBusinessIdForUser(userId: string): Promise<string | null>;
  createBusinessForFounder(input: {
    founderUserId: string;
    founderName: string;
    businessName: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<{ businessId: string } | null>;
}

export interface TripRepository {
  listForBusiness(businessId: string): Promise<TripRecord[]>;
  getForBusiness(businessId: string, tripId: string): Promise<TripRecord | null>;
  create(input: { businessId: string; name: string; destination: string; tripDate: string; notes?: string }): Promise<TripRecord | null>;
  update(input: { tripId: string; businessId: string; name?: string; destination?: string; tripDate?: string; notes?: string; status?: TripRecord['status'] }): Promise<TripRecord | null>;
  closeTrip(tripId: string, businessId: string): Promise<TripRecord | null>;
}

export interface ProductRepository {
  listForBusiness(businessId: string): Promise<Product[]>;
  create(input: {
    businessId: string;
    name: string;
    category: ProductCategory;
    image: string;
    tripId?: string;
    description?: string;
    costPrice: number;
    sellingPrice: number;
    size?: string;
    stock?: number;
  }): Promise<Product | null>;
  getProduct(productId: string, businessId: string): Promise<Product | null>;
  listVariantsForProduct(productId: string, businessId: string): Promise<{ id: string; productId: string; size: string; stock: number }[]>;
  getProductVariant(productVariantId: string, businessId: string): Promise<{ id: string; productId: string; size: string; stock: number } | null>;
}

export interface DataSource {
  auth: AuthRepository;
  business: BusinessRepository;
  trips: TripRepository;
  products: ProductRepository;
}

function slugify(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'opsps-business';
}

function mapTripRow(row: any): TripRecord {
  return {
    id: row.id,
    businessId: row.business_id ?? undefined,
    name: row.name,
    destination: row.destination,
    tripDate: row.trip_date ?? new Date().toISOString().slice(0, 10),
    notes: row.notes ?? '',
    status: (row.status === 'open' || row.status === 'planning' || row.status === 'closed') ? row.status : 'planning',
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapProductVariantRow(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size ?? 'Standard',
    stock: Number(row.stock ?? 0),
  };
}

function mapProductRow(row: any, fallbackVariants: Array<{ size: string; stock: number }> = []): Product {
  const variantStock = fallbackVariants.reduce((total, variant) => total + Number(variant.stock ?? 0), 0);
  const primaryVariant = fallbackVariants[0];

  return {
    id: row.id,
    businessId: row.business_id ?? undefined,
    tripId: row.trip_id ?? '',
    name: row.name,
    image: row.image_url ?? '',
    costPrice: Number(row.cost_price ?? 0),
    sellingPrice: Number(row.selling_price ?? 0),
    status: row.status === 'preorder' ? 'preorder' : 'ready',
    category: (row.category as ProductCategory) ?? 'Other',
    description: row.description ?? undefined,
    size: primaryVariant?.size ?? undefined,
    stock: variantStock > 0 ? variantStock : undefined,
    initialStock: variantStock > 0 ? variantStock : undefined,
  };
}

class MockDataSource implements DataSource {
  auth: AuthRepository = {
    async registerFounder() {
      return { ok: true };
    },
    async login() {
      return { ok: true };
    },
    async logout() {
      return;
    },
    async getCurrentUser() {
      return null;
    },
  };

  business: BusinessRepository = {
    async getCurrentBusinessIdForUser() {
      return null;
    },
    async createBusinessForFounder() {
      return { businessId: 'mock-business' };
    },
  };

  trips: TripRepository = {
    async listForBusiness(businessId: string) {
      return getMockDatabaseSnapshot().trips.filter((trip) => trip.businessId === businessId);
    },
    async getForBusiness(businessId: string, tripId: string) {
      return getMockDatabaseSnapshot().trips.find((trip) => trip.businessId === businessId && trip.id === tripId) ?? null;
    },
    async create(input) {
      return createTrip({
        name: input.name,
        destination: input.destination,
        tripDate: input.tripDate,
        notes: input.notes,
        businessId: input.businessId,
      });
    },
    async update(input) {
      const trip = getMockDatabaseSnapshot().trips.find((entry) => entry.businessId === input.businessId && entry.id === input.tripId);
      if (!trip) {
        return null;
      }
      const updated = {
        ...trip,
        name: input.name ?? trip.name,
        destination: input.destination ?? trip.destination,
        tripDate: input.tripDate ?? trip.tripDate,
        notes: input.notes ?? trip.notes,
        status: input.status ?? trip.status,
      };
      const snapshot = getMockDatabaseSnapshot();
      snapshot.trips = snapshot.trips.map((entry) => entry.id === trip.id ? updated : entry);
      return updated;
    },
    async closeTrip(tripId: string, businessId: string) {
      const trip = getMockDatabaseSnapshot().trips.find((entry) => entry.businessId === businessId && entry.id === tripId);
      if (!trip) {
        return null;
      }
      const updated = { ...trip, status: 'closed' as const };
      const snapshot = getMockDatabaseSnapshot();
      snapshot.trips = snapshot.trips.map((entry) => entry.id === trip.id ? updated : entry);
      return updated;
    },
  };

  products: ProductRepository = {
    async listForBusiness(businessId: string) {
      return getMockDatabaseSnapshot().products.filter((product) => product.businessId === businessId);
    },
    async create(input) {
      return createProduct({
        name: input.name,
        category: input.category,
        image: input.image,
        tripId: input.tripId,
        description: input.description,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        size: input.size,
        stock: input.stock,
        businessId: input.businessId,
      });
    },
    async getProduct(productId, businessId) {
      const product = getProduct(productId, getMockDatabaseSnapshot(), businessId);
      return product ?? null;
    },
    async listVariantsForProduct(productId: string, businessId: string) {
      const variants = getMockDatabaseSnapshot().productVariants.filter((variant) => variant.productId === productId && variant.businessId === businessId);
      return variants.map((variant) => ({ id: variant.id, productId: variant.productId, size: variant.size, stock: variant.stock }));
    },
    async getProductVariant(productVariantId, businessId) {
      const variant = getProductVariant(productVariantId, getMockDatabaseSnapshot(), businessId);
      if (!variant) {
        return null;
      }
      return {
        id: variant.id,
        productId: variant.productId,
        size: variant.size,
        stock: variant.stock,
      };
    },
  };
}

async function getUserIdFromAuth(client: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return data.user.id ?? null;
}

async function hasMembership(client: ReturnType<typeof getSupabaseClient>, businessId: string): Promise<boolean> {
  if (!client) {
    return false;
  }

  const userId = await getUserIdFromAuth(client);
  if (!userId || !businessId) {
    return false;
  }

  const { data, error } = await client
    .from('business_memberships')
    .select('business_id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .maybeSingle();

  const membership = data as { business_id?: string } | null;
  return !error && !!membership && membership.business_id === businessId;
}

async function verifyTripBelongsToBusiness(client: ReturnType<typeof getSupabaseClient>, businessId: string, tripId: string): Promise<boolean> {
  if (!client || !tripId || !businessId) {
    return false;
  }

  const { data, error } = await client
    .from('trips')
    .select('id, business_id')
    .eq('id', tripId)
    .maybeSingle();

  const trip = data as { business_id?: string } | null;
  return !error && !!trip && trip.business_id === businessId;
}

class SupabaseDataSource implements DataSource {
  auth: AuthRepository = {
    async registerFounder(input) {
      const client = getSupabaseClient();
      if (!client) {
        return { ok: false, error: 'Supabase is not configured.' };
      }

      const { data: authData, error: signUpError } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.name,
            role: 'founder',
          },
        },
      });

      if (signUpError || !authData.user) {
        return { ok: false, error: signUpError?.message ?? 'Unable to create Supabase Auth user.' };
      }

      const repo = new SupabaseDataSource();
      const business = await repo.business.createBusinessForFounder({
        founderUserId: authData.user.id,
        founderName: input.name,
        businessName: input.businessName || `${input.name}'s Business`,
        email: input.email,
        phone: input.phone,
        address: input.address,
      });

      if (!business) {
        return { ok: false, error: 'Unable to create business after signup.' };
      }

      return { ok: true, businessId: business.businessId, userId: authData.user.id };
    },
    async login(input) {
      const client = getSupabaseClient();
      if (!client) {
        return { ok: false, error: 'Supabase is not configured.' };
      }

      const { data: authData, error } = await client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error || !authData.user) {
        return { ok: false, error: error?.message ?? 'Login failed.' };
      }

      const repo = new SupabaseDataSource();
      const businessId = await repo.business.getCurrentBusinessIdForUser(authData.user.id);
      return { ok: true, businessId: businessId ?? undefined, userId: authData.user.id };
    },
    async logout() {
      const client = getSupabaseClient();
      if (!client) {
        return;
      }
      await client.auth.signOut();
    },
    async getCurrentUser() {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data: sessionData } = await client.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        return null;
      }

      const [{ data: profileData }, { data: membershipData }] = await Promise.all([
        client.from('profiles').select('*').eq('auth_user_id', user.id).maybeSingle(),
        client.from('business_memberships').select('business_id, role').eq('user_id', user.id).limit(1),
      ]);

      const role = (profileData?.role as OpspsRole) ?? (membershipData?.[0]?.role as OpspsRole) ?? 'customer';
      return {
        email: user.email ?? profileData?.email ?? '',
        name: profileData?.full_name ?? user.user_metadata?.full_name ?? user.email ?? 'User',
        role,
        businessId: membershipData?.[0]?.business_id ?? undefined,
      };
    },
  };

  business: BusinessRepository = {
    async getCurrentBusinessIdForUser(userId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client
        .from('business_memberships')
        .select('business_id')
        .eq('user_id', userId)
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0]?.business_id ?? null;
    },
    async createBusinessForFounder(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const slug = slugify(input.businessName);
      const { data: businessData, error: businessError } = await client
        .from('businesses')
        .insert({
          name: input.businessName,
          slug,
          email: input.email,
          phone: input.phone,
          address: input.address,
          status: 'active',
        })
        .select('id')
        .single();

      if (businessError || !businessData) {
        return null;
      }

      const { error: membershipError } = await client.from('business_memberships').insert({
        business_id: businessData.id,
        user_id: input.founderUserId,
        role: 'founder',
      });

      if (membershipError) {
        return null;
      }

      const { error: profileError } = await client.from('profiles').insert({
        business_id: businessData.id,
        auth_user_id: input.founderUserId,
        full_name: input.founderName,
        email: input.email ?? `${input.founderUserId}@local.opsps`,
        phone: input.phone,
        address: input.address,
        role: 'founder',
      });

      if (profileError) {
        return null;
      }

      return { businessId: businessData.id };
    },
  };

  trips: TripRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const hasAccess = await hasMembership(client, businessId);
      if (!hasAccess) {
        return [];
      }

      const { data, error } = await client.from('trips').select('*').eq('business_id', businessId);
      if (error || !data) {
        return [];
      }
      return (data as any[]).map((row) => mapTripRow(row));
    },
    async getForBusiness(businessId: string, tripId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client.from('trips').select('*').eq('business_id', businessId).eq('id', tripId).maybeSingle();
      if (error || !data) {
        return null;
      }
      return mapTripRow(data);
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, input.businessId))) {
        return null;
      }

      const { data, error } = await client
        .from('trips')
        .insert({
          business_id: input.businessId,
          name: input.name,
          destination: input.destination,
          trip_date: input.tripDate,
          notes: input.notes,
          status: 'planning',
        })
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapTripRow(data);
    },
    async update(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const existingTrip = await this.getForBusiness(input.businessId, input.tripId);
      if (!existingTrip) {
        return null;
      }

      const payload: Record<string, string | Date | null> = {
        name: input.name ?? existingTrip.name,
        destination: input.destination ?? existingTrip.destination,
        trip_date: input.tripDate ?? existingTrip.tripDate,
        notes: input.notes ?? existingTrip.notes,
      };

      if (input.status) {
        payload.status = input.status;
      }

      const { data, error } = await client
        .from('trips')
        .update(payload)
        .eq('id', input.tripId)
        .eq('business_id', input.businessId)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapTripRow(data);
    },
    async closeTrip(tripId: string, businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const existingTrip = await this.getForBusiness(businessId, tripId);
      if (!existingTrip) {
        return null;
      }

      const { data, error } = await client
        .from('trips')
        .update({ status: 'closed' })
        .eq('id', tripId)
        .eq('business_id', businessId)
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      return mapTripRow(data);
    },
  };

  products: ProductRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data: productRows, error: productsError } = await client.from('products').select('*').eq('business_id', businessId);
      if (productsError || !productRows) {
        return [];
      }

      const { data: variantRows, error: variantsError } = await client
        .from('product_variants')
        .select('*')
        .eq('business_id', businessId);

      const variantMap = new Map<string, Array<{ size: string; stock: number }>>();
      if (!variantsError && variantRows) {
        for (const row of variantRows as any[]) {
          const key = row.product_id;
          const existing = variantMap.get(key) ?? [];
          existing.push({ size: row.size ?? 'Standard', stock: Number(row.stock ?? 0) });
          variantMap.set(key, existing);
        }
      }

      return (productRows as any[]).map((row) => mapProductRow(row, variantMap.get(row.id) ?? []));
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const hasBusiness = await hasMembership(client, input.businessId);
      if (!hasBusiness) {
        return null;
      }

      if (input.tripId) {
        const tripMatches = await verifyTripBelongsToBusiness(client, input.businessId, input.tripId);
        if (!tripMatches) {
          return null;
        }
      }

      const { data, error } = await client
        .from('products')
        .insert({
          business_id: input.businessId,
          trip_id: input.tripId ?? null,
          name: input.name,
          category: input.category,
          description: input.description,
          image_url: input.image,
          cost_price: Number(input.costPrice || 0),
          selling_price: Number(input.sellingPrice || 0),
          status: 'ready',
          is_published: false,
        })
        .select('*')
        .single();

      if (error || !data) {
        return null;
      }

      const variantRow = {
        business_id: input.businessId,
        product_id: data.id,
        size: input.size ?? 'Standard',
        stock: Number(input.stock ?? 0),
      };

      const { error: variantError } = await client.from('product_variants').insert(variantRow);
      if (variantError) {
        return null;
      }

      return mapProductRow(data, [{ size: variantRow.size, stock: variantRow.stock }]);
    },
    async getProduct(productId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data: productData, error: productError } = await client
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (productError || !productData) {
        return null;
      }

      const { data: variantRows } = await client
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('business_id', businessId);

      return mapProductRow(productData, (variantRows ?? []).map((row: any) => ({ size: row.size ?? 'Standard', stock: Number(row.stock ?? 0) })));
    },
    async listVariantsForProduct(productId: string, businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      if (!(await hasMembership(client, businessId))) {
        return [];
      }

      const { data, error } = await client
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('business_id', businessId);

      if (error || !data) {
        return [];
      }

      return (data as any[]).map((row) => mapProductVariantRow(row));
    },
    async getProductVariant(productVariantId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      if (!(await hasMembership(client, businessId))) {
        return null;
      }

      const { data, error } = await client
        .from('product_variants')
        .select('*')
        .eq('id', productVariantId)
        .eq('business_id', businessId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return mapProductVariantRow(data);
    },
  };
}

export function getDataSource(mode: 'mock' | 'production' = 'production'): DataSource {
  if (mode === 'mock') {
    return new MockDataSource();
  }

  const client = getSupabaseClient();
  return client ? new SupabaseDataSource() : new MockDataSource();
}
