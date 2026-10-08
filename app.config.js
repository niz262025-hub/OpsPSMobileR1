module.exports = ({ config }) => ({
  ...config,
  scheme: process.env.EXPO_PUBLIC_APP_SCHEME ?? config.scheme ?? 'opsps',
  extra: {
    ...config.extra,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? config.extra?.EXPO_PUBLIC_SUPABASE_URL ?? '',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? config.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    EXPO_PUBLIC_APP_SCHEME: process.env.EXPO_PUBLIC_APP_SCHEME ?? config.extra?.EXPO_PUBLIC_APP_SCHEME ?? 'opsps',
    EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL ?? config.extra?.EXPO_PUBLIC_SITE_URL ?? '',
    EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL: process.env.EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL ?? config.extra?.EXPO_PUBLIC_SUPABASE_AUTH_REDIRECT_URL ?? '',
    EXPO_PUBLIC_PAYMENT_PROVIDER: process.env.EXPO_PUBLIC_PAYMENT_PROVIDER ?? config.extra?.EXPO_PUBLIC_PAYMENT_PROVIDER ?? 'stripe',
    EXPO_PUBLIC_PAYMENT_ENV: process.env.EXPO_PUBLIC_PAYMENT_ENV ?? config.extra?.EXPO_PUBLIC_PAYMENT_ENV ?? 'sandbox',
    EXPO_PUBLIC_PAYMENT_SUCCESS_URL: process.env.EXPO_PUBLIC_PAYMENT_SUCCESS_URL ?? config.extra?.EXPO_PUBLIC_PAYMENT_SUCCESS_URL ?? 'https://sandbox.example.test/payments/success',
    EXPO_PUBLIC_PAYMENT_CANCEL_URL: process.env.EXPO_PUBLIC_PAYMENT_CANCEL_URL ?? config.extra?.EXPO_PUBLIC_PAYMENT_CANCEL_URL ?? 'https://sandbox.example.test/payments/cancel',
  },
});
