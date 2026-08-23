import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'ps' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@opsps_auth_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setUser(JSON.parse(raw) as AuthUser);
          } catch {
            // ignore corrupt data
          }
        }
      })
      .finally(() => setReady(true));
  }, []);

  const persist = async (authUser: AuthUser | null) => {
    if (authUser) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const login = async (email: string, _password: string, role: UserRole) => {
    const authUser: AuthUser = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0] ?? email,
      email,
      role,
    };
    setUser(authUser);
    await persist(authUser);
  };

  const register = async (name: string, email: string, _password: string, role: UserRole) => {
    const authUser: AuthUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
    };
    setUser(authUser);
    await persist(authUser);
  };

  const logout = async () => {
    setUser(null);
    await persist(null);
  };

  const value: AuthContextValue = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
