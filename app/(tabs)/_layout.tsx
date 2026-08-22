import React from 'react';
import { Pressable } from 'react-native';
import { Tabs, router } from 'expo-router';
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

const iconProps = {
  size: 24,
  strokeWidth: 2,
};

export default function TabsLayout() {
  const TAB_ICON_SIZE = 24;
  const THEME_PRIMARY = '#7C3AED';
  const THEME_INACTIVE = '#9CA3AF';

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
          <Pressable onPress={() => router.push('/settings')}>
            <User
              {...({ ...iconProps, color: '#FFFFFF', style: { marginRight: 16 } } as any)}
            />
          </Pressable>
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
          headerTitle: 'Marketplace',
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
