# OpsPS Mobile v1 - Application Structure

## Mobile-Only Scope

OpsPS is now focused on Android phone development in Expo Go. Web rendering, browser compatibility, Expo web, and SSR are not part of the current scope.

### Current Focus
- Stable Expo Go launch on Android
- Landing screen
- Login
- Dashboard
- Trips
- Add Product
- Upload Image
- Generate Caption
- Share to WhatsApp / Telegram / Instagram / Facebook / TikTok using mobile share intents
- Inventory
- Finance
- Reports

## Screens & Navigation

### Bottom Tabs (Primary Navigation)
1. **Dashboard** (`/(tabs)/dashboard`)
   - Order stats (Order count, Total Sales, Total Profit)
   - Daily Summary table
   - Order Status overview

2. **Trips** (`/(tabs)/trips`)
   - Active trips list
   - Add Trip button
   - Trip cards with product/order counts
   - Taps to trip detail

3. **Inventory** (`/(tabs)/inventory`)
   - Inventory summary (Total, In Stock, Low Stock, Out of Stock)
   - Expandable inventory items
   - Size variants with quantities

4. **Finance** (`/(tabs)/finance`)
   - Capital, Cash, Bank, Expense tabs
   - Summary cards with balances
   - Transaction records with dates and methods

5. **Reports** (`/(tabs)/reports`)
   - P&L, Sales, Expense, Trip, Inventory tabs
   - P&L calculation: Sales - COGS - Expenses = Net Profit
   - Sales report by trip
   - Inventory alerts for low/out of stock

### Stack Navigation
6. **Trip Detail** (`/trip/[id]`)
   - Products tab
   - Orders tab (with "Ship Now" button for ready orders)
   - Buy List tab (auto-generated)

7. **Shipping Generate** (`/shipping/generate`)
   - Recipient form
   - Weight & dimensions input
   - Courier selection
   - Label generation with tracking number & AWB

## Data Models

### Core Entities
- **Trip**: Contains products and orders
- **Product**: Costprice, selling price, size variants (S, M, L, XL)
- **Order**: Customer info, items, status, total
- **BuyListItem**: Auto-generated from inventory gaps
- **InventoryItem**: Aggregated stock across trips
- **FinanceRecord**: Income/expense transactions
- **Report**: Aggregated P&L, sales, expenses

## Design System

### Theme
- **Primary Color**: #7C3AED (Purple)
- **Background**: #F4F4F5
- **Border Radius**: 20px
- **Card Style**: Rounded with soft shadows

### Components
- `StatCard`: KPI display with color variants
- `SectionHeader`: Section titles with "View All" option
- `StatusBadge`: Colored status labels

## Mock Data Included
- 3 trips with active/completed status
- 3 products with multiple size variants
- 4 orders across trips
- 4 buy list items
- 5 inventory items (in stock, low stock, out of stock)
- 5 finance records (capital, income, expenses)

## Key Features Implemented
✅ Bottom tab navigation with icons
✅ Purple-themed modern mobile UI
✅ Dashboard with summary and daily table
✅ Trips management with deep linking
✅ Inventory tracking with expandable details
✅ Finance tracking with 4 categories
✅ Reports with P&L, sales, expenses, trips, inventory
✅ Shipping label generation placeholder
✅ Status badge system (5 order statuses, 3 inventory statuses)
✅ Mock data with realistic values
✅ TypeScript support throughout
✅ Responsive layout for mobile screens

## File Structure
```
app/
├── _layout.tsx                 (Root Stack Layout)
├── index.tsx                   (Root redirect to dashboard)
├── (tabs)/
│   ├── _layout.tsx             (Tab Bar Layout)
│   ├── dashboard.tsx           (Dashboard Screen)
│   ├── trips.tsx               (Trips List Screen)
│   ├── inventory.tsx           (Inventory Screen)
│   ├── finance.tsx             (Finance Screen)
│   └── reports.tsx             (Reports Screen)
├── trip/
│   ├── _layout.tsx             (Trip Stack Layout)
│   └── [id]/
│       └── index.tsx           (Trip Detail with 3 tabs)
└── shipping/
    ├── _layout.tsx             (Shipping Stack Layout)
    └── generate.tsx            (Shipping Label Generator)

components/
├── StatCard.tsx                (KPI Card Component)
├── SectionHeader.tsx           (Section Title Component)
└── StatusBadge.tsx             (Status Label Component)

theme.ts                        (Design tokens)
mockData.ts                     (Mock data & interfaces)
