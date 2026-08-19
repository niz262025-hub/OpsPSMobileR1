export type OrderStatus =
  | 'In Buy List'
  | 'Awaiting Trip Return'
  | 'New'
  | 'Pending Payment'
  | 'Ready to Pack'
  | 'Packed'
  | 'Pending to Ship'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled';

export type Order = {
  id: string;
  customer: string;
  phone: string;
  product: string;
  qty: number;
  amount: number;
  status: OrderStatus;
  date: string;
  address: string;
  notes?: string;
  tracking?: string;
  courier?: string;
  source?: 'ready-stock' | 'trip';
  tripId?: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

export type BuyListItem = {
  id: string;
  product: string;
  qty: number;
  bought: boolean;
};

export type Trip = {
  id: string;
  name: string;
  location: string;
  status: 'Open' | 'Live' | 'Closed';
};

export const trips: Trip[] = [
  {
    id: 'TRIP-101',
    name: 'Mid Valley Mega Sale',
    location: 'Mid Valley Megamall',
    status: 'Live',
  },
];

export const inventory: InventoryItem[] = [
  {
    id: 'INV-001',
    name: 'Kebaya White',
    price: 128,
    stock: 4,
  },
  {
    id: 'INV-002',
    name: 'IKEA Storage Box',
    price: 35,
    stock: 12,
  },
];

export const buyList: BuyListItem[] = [];

export const orders: Order[] = [
  {
    id: 'ORD-2041',
    customer: 'Aina',
    phone: '+60123456789',
    product: 'Kebaya White',
    qty: 1,
    amount: 128,
    status: 'Pending to Ship',
    date: '2026-08-15',
    address: 'Jalan Bukit Bintang, Kuala Lumpur',
    source: 'ready-stock',
    tracking: 'EP123456789MY',
    courier: 'J&T Express',
  },
];

export function addToBuyList(product: string, qty: number) {
  const existing = buyList.find((item) => item.product === product);

  if (existing) {
    existing.qty += qty;
    return;
  }

  buyList.push({
    id: `BL-${buyList.length + 1}`,
    product,
    qty,
    bought: false,
  });
}

export function addMarketplaceOrder(data: {
  customer: string;
  phone: string;
  product: string;
  qty: number;
  amount: number;
  address: string;
  notes?: string;
}) {
  orders.unshift({
    id: `ORD-${2040 + orders.length + 1}`,
    customer: data.customer,
    phone: data.phone,
    product: data.product,
    qty: data.qty,
    amount: data.amount,
    status: 'In Buy List',
    date: '2026-08-15',
    address: data.address,
    notes: data.notes,
    source: 'trip',
  });

  addToBuyList(data.product, data.qty);
}

export function addReadyStockOrder(data: {
  customer: string;
  phone: string;
  product: string;
  qty: number;
  address: string;
  notes?: string;
}) {
  const inventoryItem = inventory.find((item) => item.name === data.product);

  if (!inventoryItem || inventoryItem.stock < data.qty) {
    throw new Error('Selected product is out of stock.');
  }

  inventoryItem.stock -= data.qty;

  orders.unshift({
    id: `ORD-${2040 + orders.length + 1}`,
    customer: data.customer,
    phone: data.phone,
    product: data.product,
    qty: data.qty,
    amount: inventoryItem.price * data.qty,
    status: 'Ready to Pack',
    date: '2026-08-15',
    address: data.address,
    notes: data.notes,
    source: 'ready-stock',
  });
}

export function addTripOrder(data: {
  customer: string;
  phone: string;
  product: string;
  qty: number;
  address: string;
  tripId: string;
  notes?: string;
}) {
  orders.unshift({
    id: `ORD-${2040 + orders.length + 1}`,
    customer: data.customer,
    phone: data.phone,
    product: data.product,
    qty: data.qty,
    amount: 0,
    status: 'Awaiting Trip Return',
    date: '2026-08-15',
    address: data.address,
    notes: data.notes,
    source: 'trip',
    tripId: data.tripId,
  });
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const order = orders.find((item) => item.id === orderId);

  if (order) {
    order.status = newStatus;
  }
}

export function markBuyListItemBought(product: string) {
  const item = buyList.find((i) => i.product === product);

  if (!item || item.bought) return;

  item.bought = true;

  let inventoryItem = inventory.find((inv) => inv.name === product);

  if (!inventoryItem) {
    inventoryItem = {
      id: `INV-${inventory.length + 1}`,
      name: product,
      price: 100,
      stock: 0,
    };
    inventory.push(inventoryItem);
  }

  inventoryItem.stock += item.qty;

  orders
    .filter((order) => order.product === product && order.status === 'In Buy List')
    .forEach((order) => {
      if (inventoryItem!.stock >= order.qty) {
        inventoryItem!.stock -= order.qty;
        order.status = 'Ready to Pack';
      }
    });
}

export function closeTrip() {
  const trip = trips[0];

  if (trip) {
    trip.status = 'Closed';
  }
}

export function closeTripAndTransferStock(tripId: string) {
  closeTrip();

  orders
    .filter((order) => order.tripId === tripId || order.status === 'Awaiting Trip Return')
    .forEach((order) => {
      order.status = 'Ready to Pack';
    });
}

export function packOrder(orderId: string) {
  const order = orders.find((item) => item.id === orderId);

  if (order && order.status === 'Ready to Pack') {
    order.status = 'Packed';
  }
}

export function generateShipment(orderId: string, courier: string) {
  const order = orders.find((item) => item.id === orderId);

  if (!order || order.status !== 'Packed') return;

  order.courier = courier;
  order.tracking = `EP${Math.floor(100000000 + Math.random() * 900000000)}MY`;
  order.status = 'Pending to Ship';
}

export function markShipped(orderId: string) {
  const order = orders.find((item) => item.id === orderId);

  if (order && order.status === 'Pending to Ship') {
    order.status = 'Shipped';
  }
}

export function markCompleted(orderId: string) {
  const order = orders.find((item) => item.id === orderId);

  if (order && order.status === 'Shipped') {
    order.status = 'Completed';
  }
}

export function getDashboardStats() {
  const today = '2026-08-15';
  const todayOrders = orders.filter((order) => order.date === today);
  const salesToday = todayOrders.reduce((sum, order) => sum + order.amount, 0);

  return {
    liveTrips: trips.filter((trip) => trip.status === 'Live').length,
    buyList: buyList.filter((item) => !item.bought).length,
    readyToPack: orders.filter((order) => order.status === 'Ready to Pack').length,
    pendingToShip: orders.filter((order) => order.status === 'Pending to Ship').length,
    shipped: orders.filter((order) => order.status === 'Shipped').length,
    salesToday,
    profitToday: Math.round(salesToday * 0.38),
    profitMonth: Math.round(salesToday * 1.4),
    totalOrdersToday: todayOrders.length,
  };
}