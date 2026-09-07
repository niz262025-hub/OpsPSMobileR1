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
  create(input: { businessId: string; name: string; destination: string; tripDate: string; notes?: string }): Promise<TripRecord | null>;
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
    async create(input) {
      return createTrip({
        name: input.name,
        destination: input.destination,
        tripDate: input.tripDate,
        notes: input.notes,
        businessId: input.businessId,
      });
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

      const { data, error } = await client.from('trips').select('*').eq('business_id', businessId);
      if (error || !data) {
        return [];
      }
      return data as TripRecord[];
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.from('trips').insert({
        business_id: input.businessId,
        name: input.name,
        destination: input.destination,
        trip_date: input.tripDate,
        notes: input.notes,
        status: 'planning',
      }).select('*').single();

      if (error || !data) {
        return null;
      }

      return data as TripRecord;
    },
  };

  products: ProductRepository = {
    async listForBusiness(businessId: string) {
      const client = getSupabaseClient();
      if (!client) {
        return [];
      }

      const { data, error } = await client.from('products').select('*').eq('business_id', businessId);
      if (error || !data) {
        return [];
      }
      return data as Product[];
    },
    async create(input) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.from('products').insert({
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
      }).select('*').single();

      if (error || !data) {
        return null;
      }

      const variantRow = {
        business_id: input.businessId,
        product_id: data.id,
        size: input.size ?? 'Standard',
        stock: Number(input.stock || 0),
      };

      await client.from('product_variants').insert(variantRow);
      return data as Product;
    },
    async getProduct(productId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.from('products').select('*').eq('id', productId).eq('business_id', businessId).maybeSingle();
      if (error || !data) {
        return null;
      }
      return data as Product;
    },
    async getProductVariant(productVariantId, businessId) {
      const client = getSupabaseClient();
      if (!client) {
        return null;
      }

      const { data, error } = await client.from('product_variants').select('*').eq('id', productVariantId).eq('business_id', businessId).maybeSingle();
      if (error || !data) {
        return null;
      }
      return {
        id: data.id,
        productId: data.product_id,
        size: data.size,
        stock: data.stock,
      };
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
