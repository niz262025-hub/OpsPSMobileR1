import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'founder' | 'customer';

type AuthAccount = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  businessName?: string;
  phone?: string;
  address?: string;
};

type AuthContextValue = {
  accounts: AuthAccount[];
  ready: boolean;
  register: (account: AuthAccount) => Promise<boolean>;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  currentUser: AuthAccount | null;
};

const ACCOUNTS_KEY = '@opsps_accounts';
const SESSION_KEY = '@opsps_session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(ACCOUNTS_KEY), AsyncStorage.getItem(SESSION_KEY)])
      .then(([storedAccounts, storedSession]) => {
        if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
        if (storedSession) setCurrentUser(JSON.parse(storedSession));
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const register = async (account: AuthAccount) => {
    if (accounts.some((entry) => entry.email.toLowerCase() === account.email.toLowerCase() && entry.role === account.role)) return false;
    const nextAccounts = [...accounts, account];
    setAccounts(nextAccounts);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
    return true;
  };

  const login = async (email: string, password: string, role: UserRole) => {
    const sanitizedEmail = email.trim();
    const account = accounts.find(
      (entry) =>
        entry.email.toLowerCase() === sanitizedEmail.toLowerCase() &&
        entry.password === password &&
        entry.role === role,
    );

    if (!account) return false;

    setCurrentUser(account);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account));
    return true;
  };

  const logout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  return <AuthContext.Provider value={{ accounts, ready, register, login, logout, currentUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}