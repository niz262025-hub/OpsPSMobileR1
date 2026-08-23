# OpsPS Mobile v1

OpsPS is now scoped as a mobile-only React Native + Expo application for Android phones. The focus is on stable Expo Go launches, native phone UX, and later APK delivery.

## Current Scope

- Target platform: Android phone
- Runtime: Expo Go
- Delivery target: APK build later
- Out of scope: Expo web, browser rendering, SSR, and web compatibility

## Priorities

1. Stable Expo Go launch on Android
2. Landing screen
3. Login
4. Dashboard
5. Trips
6. Add Product
7. Upload Image
8. Generate Caption
9. Share to WhatsApp / Telegram / Instagram / Facebook / TikTok using mobile share intents
10. Inventory
11. Finance
12. Reports

## Features

- Dashboard with KPIs, daily summaries, and order status overview
- Trips management with products, orders, and buy list flow
- Inventory tracking with expandable size variants and stock alerts
- Finance tracking for capital, cash, bank, and expenses
- Reporting with P&L, sales, expense, trip, and inventory modules
- Mobile-first sharing flow for social and messaging apps

## Tech Stack

- Expo SDK 57
- Expo Router
- React Native
- TypeScript
- Lucide React Native
- React Native StyleSheet

## Getting Started

```bash
npm install --legacy-peer-deps
npm start
```

## Project Structure

- app/ — Expo Router screens and navigation
- app/(tabs)/ — Main bottom tab screens
- app/trip/ — Trip detail stack screens
- app/shipping/ — Shipping flow screens
- components/ — Shared UI components
- mockData.ts — Mock data and TypeScript interfaces
- theme.ts — Design tokens for the app

