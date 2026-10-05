import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import {
  normalizeSellerVerificationStatus,
  type SellerVerificationStatus,
} from '../services/adminFoundation';
import { getSupabaseClient } from '../services/supabaseClient';
import { getSupabaseAuthRedirectUrl } from '../services/supabaseSchema';

export type UserRole = 'founder' | 'customer' | 'admin' | 'support';

export type AuthAccount = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  businessName?: string;
  phone?: string;
  address?: string;
  businessId?: string;
  sellerVerificationStatus?: SellerVerificationStatus;
};

export type SupabaseSignupErrorCategory = 'duplicate' | 'rate_limit' | 'auth_error';

export type AuthRegistrationResult = {
  ok: boolean;
  kind?: SupabaseSignupErrorCategory;
  message: string;
  statusCode?: number;
};

type AuthProfileRow = {
  id?: string;
  auth_user_id?: string | null;
  business_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: string | null;
};

type AuthBusinessRow = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AuthMembershipRow = {
  id?: string | null;
  business_id?: string | null;
  user_id?: string | null;
  role?: string | null;
};

type AuthContextValue = {
  accounts: AuthAccount[];
  ready: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: AuthProfileRow | null;
  business: AuthBusinessRow | null;
  membership: AuthMembershipRow | null;
  role: UserRole | null;
  register: (account: AuthAccount) => Promise<AuthRegistrationResult>;
  login: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  currentUser: AuthAccount | null;
};

export function sanitizePersistedAccount(account: Partial<AuthAccount> | null | undefined) {
  if (!account) {
    return null;
  }

  const sanitized = { ...account };
  delete sanitized.password;
  return sanitized;
}

export function classifySupabaseSignupError(
  error: {
    status?: number | string;
    code?: string | number;
    error_code?: string;
    message?: string;
    msg?: string;
  } | null | undefined
): AuthRegistrationResult {
  const statusValue = error?.status ?? error?.code ?? 0;
  const status = Number(statusValue) || 0;
  const errorCode = String(error?.error_code ?? error?.code ?? '').toLowerCase();
  const messageText = String(error?.message ?? error?.msg ?? '').toLowerCase();

  if (
    status === 429 ||
    errorCode.includes('over_email_send_rate_limit') ||
    messageText.includes('rate limit exceeded') ||
    messageText.includes('email rate limit')
  ) {
    return {
      ok: false,
      kind: 'rate_limit',
      message: 'Registration temporarily unavailable because email sending is temporarily rate-limited. Please try again later.',
      statusCode: status || 429,
    };
  }

  const duplicateSignals = [
    'already registered',
    'already exists',
    'user already exists',
    'email already in use',
    'duplicate',
    'user_already_exists',
    'email_exists',
  ];

  if (
    duplicateSignals.some((signal) => messageText.includes(signal) || errorCode.includes(signal)) ||
    (status === 400 && messageText.includes('already'))
  ) {
    return {
      ok: false,
      kind: 'duplicate',
      message: 'An account with this email already exists.',
      statusCode: status || 400,
    };
  }

  return {
    ok: false,
    kind: 'auth_error',
    message: 'Registration failed. Please check your details and try again in a moment.',
    statusCode: status || 0,
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfileRow | null>(null);
  const [business, setBusiness] = useState<AuthBusinessRow | null>(null);
  const [membership, setMembership] = useState<AuthMembershipRow | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const applySupabaseSession = async (supabaseSession: Session | null): Promise<AuthAccount | null> => {
    const client = getSupabaseClient();
    if (!client || !supabaseSession) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setBusiness(null);
      setMembership(null);
      setRole(null);
      setCurrentUser(null);
      return null;
    }

    const authUser = supabaseSession.user;
    const { data: profileData, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const { data: membershipRows, error: membershipError } = await client
      .from('business_memberships')
      .select('*')
      .eq('user_id', authUser.id)
      .limit(1);

    if (membershipError) {
      throw membershipError;
    }

    const membershipRow = membershipRows?.[0] ?? null;
    let businessRow: AuthBusinessRow | null = null;

    if (membershipRow?.business_id) {
      const { data: businessData, error: businessError } = await client
        .from('businesses')
        .select('*')
        .eq('id', membershipRow.business_id)
        .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      businessRow = businessData ?? null;
    }

    const normalizedRole = (profileData?.role as UserRole) || (membershipRow?.role as UserRole) || 'customer';
    const normalizedUser: AuthAccount = {
      email: authUser.email ?? '',
      password: '',
      role: normalizedRole,
      name: profileData?.full_name ?? authUser.user_metadata?.full_name ?? authUser.email ?? 'User',
      businessId: membershipRow?.business_id ?? undefined,
      businessName: businessRow?.name ?? '',
      phone: profileData?.phone ?? '',
      address: profileData?.address ?? '',
      sellerVerificationStatus: normalizeSellerVerificationStatus((businessRow as { seller_verification_status?: string } | null | undefined)?.seller_verification_status ?? 'PENDING'),
    };

    setSession(supabaseSession);
    setUser(authUser);
    setProfile(profileData ?? null);
    setBusiness(businessRow);
    setMembership(membershipRow ?? null);
    setRole(normalizedRole);
    setCurrentUser(normalizedUser);
    return normalizedUser;
  };

  useEffect(() => {
    let active = true;

    const restoreAuth = async () => {
      try {
        const client = getSupabaseClient();
        if (!client) {
          setAccounts([]);
          setCurrentUser(null);
          setSession(null);
          setUser(null);
          setProfile(null);
          setBusiness(null);
          setMembership(null);
          setRole(null);
          setReady(true);
          return;
        }

        const { data, error } = await client.auth.getSession();
        if (error) {
          throw error;
        }

        const supabaseSession = data.session;
        if (supabaseSession && active) {
          await applySupabaseSession(supabaseSession);
          setReady(true);
          return;
        }

        setAccounts([]);
        setCurrentUser(null);
        setSession(null);
        setUser(null);
        setProfile(null);
        setBusiness(null);
        setMembership(null);
        setRole(null);
      } catch (error) {
        console.warn('Unable to restore authentication state:', error);
        setCurrentUser(null);
        setSession(null);
        setUser(null);
        setProfile(null);
        setBusiness(null);
        setMembership(null);
        setRole(null);
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    void restoreAuth();

    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!nextSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setBusiness(null);
          setMembership(null);
          setRole(null);
          setCurrentUser(null);
          setReady(true);
          return;
        }

        await applySupabaseSession(nextSession);
        setReady(true);
      });

      return () => {
        active = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, []);

  /**
   * Register a new account.
   *
   * Every new Founder receives a unique and stable business scope.
   */
  const register = async (
    account: AuthAccount
  ): Promise<AuthRegistrationResult> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        ok: false,
        kind: 'auth_error',
        message: 'Registration is temporarily unavailable. Please try again later.',
      };
    }

    setLoading(true);
    try {
      const authRedirectUrl = getSupabaseAuthRedirectUrl();
      const { data, error } = await client.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          emailRedirectTo: authRedirectUrl || undefined,
          data: {
            full_name: account.name,
            role: account.role,
          },
        },
      });

      if (error || !data.user) {
        return classifySupabaseSignupError(error ?? { status: 0, message: 'Unable to create account.' });
      }

      const { error: profileError } = await client.from('profiles').upsert({
        auth_user_id: data.user.id,
        full_name: account.name,
        email: account.email,
        phone: account.phone ?? '',
        address: account.address ?? '',
        role: account.role,
        business_id: account.businessId ?? null,
      }, { onConflict: 'auth_user_id' });

      if (profileError) {
        return classifySupabaseSignupError(profileError ?? { status: 0, message: 'Unable to create profile.' });
      }

      const { data: sessionData } = await client.auth.getSession();
      if (sessionData.session) {
        await applySupabaseSession(sessionData.session);
      }

      return { ok: true, message: 'Registration successful.' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login.
   */
  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client) {
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return false;
      }

      const { data: profileData } = await client
        .from('profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      if (profileData && profileData.role !== role && role !== 'customer') {
        return false;
      }

      const { data: membershipData } = await client
        .from('business_memberships')
        .select('*')
        .eq('user_id', data.user.id)
        .limit(1);

      const membershipRow = membershipData?.[0] ?? null;
      const normalizedRole = (profileData?.role as UserRole) || (membershipRow?.role as UserRole) || role;
      const normalizedAccount: AuthAccount = {
        email: data.user.email ?? email.trim(),
        password,
        role: normalizedRole,
        name: profileData?.full_name ?? data.user.user_metadata?.full_name ?? email.trim(),
        businessId: membershipRow?.business_id ?? undefined,
        businessName: membershipRow?.business_id ? 'Supabase Business' : '',
        phone: profileData?.phone ?? '',
        address: profileData?.address ?? '',
        sellerVerificationStatus: normalizeSellerVerificationStatus((profileData as { seller_verification_status?: string } | null | undefined)?.seller_verification_status ?? 'PENDING'),
      };

      setCurrentUser(normalizedAccount);
      setRole(normalizedRole);
      return true;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout.
   */
  const logout = async (): Promise<void> => {
    const client = getSupabaseClient();

    if (client) {
      await client.auth.signOut();
    }

    setCurrentUser(null);
    setSession(null);
    setUser(null);
    setProfile(null);
    setBusiness(null);
    setMembership(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accounts,
        ready,
        loading,
        user,
        session,
        profile,
        business,
        membership,
        role,
        register,
        login,
        logout,
        currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}