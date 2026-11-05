import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect, Tabs, router } from 'expo-router';
import {
  Home,
  Truck,
  Package,
  DollarSign,
  BarChart3,
  User,
  Store,
  ClipboardList,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const iconProps = {
  size: 24,
  strokeWidth: 2,
};

export default function TabsLayout() {
  const { currentUser, ready, logout } = useAuth();
  const [returning, setReturning] = useState(false);
  const returnToPortal = async () => {
    if (returning) return;
    setReturning(true);
    try { await logout(); } finally { setReturning(false); }
  };
  const TAB_ICON_SIZE = 24;
  const THEME_PRIMARY = '#5B2BD9';
  const THEME_INACTIVE = '#8E899B';

  useEffect(() => {
    if (!ready) return;
    if (!currentUser || currentUser.role !== 'founder') {
      router.replace('/login');
    }
  }, [currentUser, ready]);

  if (!ready) return null;
  if (!currentUser || currentUser.role !== 'founder') return <Redirect href="/login" />;

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        tabBarActiveTintColor: THEME_PRIMARY,
        tabBarInactiveTintColor: THEME_INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        headerStyle: {
          backgroundColor: THEME_PRIMARY,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              disabled={returning}
              onPress={() => void returnToPortal()}
              style={{ backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10 }}
            >
              <Text style={{ color: THEME_PRIMARY, fontWeight: '600', fontSize: 12 }}>{returning ? 'Kembali…' : 'Kembali ke MYOPS'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')}>
              <User
                {...({ ...iconProps, color: '#FFFFFF', style: { marginRight: 16 } } as any)}
              />
            </Pressable>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerTitle: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Home {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />

      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarLabel: 'Trips',
          headerTitle: 'Trips',
          tabBarIcon: ({ color }) => (
            <Truck {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarLabel: 'Market',
          headerTitle: 'Marketplace Hub',
          tabBarIcon: ({ color }) => (
            <Store {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarLabel: 'Orders',
          headerTitle: 'Orders',
          tabBarIcon: ({ color }) => (
            <ClipboardList {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarLabel: 'Inventory',
          headerTitle: 'Inventory',
          tabBarIcon: ({ color }) => (
            <Package {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />

      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarLabel: 'Finance',
          headerTitle: 'Finance',
          tabBarIcon: ({ color }) => (
            <DollarSign {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          headerTitle: 'Reports',
          tabBarIcon: ({ color }) => (
            <BarChart3 {...({ ...iconProps, size: TAB_ICON_SIZE, color } as any)} />
          ),
        }}
      />
    </Tabs>
  );
}
