import type { ExpoConfig } from 'expo/config';
const config: ExpoConfig = {
  name: 'MYOPS Mobile',
  slug: 'myops-mobile',
  scheme: 'myops',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: { bundleIdentifier: 'my.myops.mobile', supportsTablet: true },
  android: { package: 'my.myops.mobile' },
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
  extra: { centralLoginUrl: 'https://www.myops.com.my' }
};
export default config;
