import { PDFDocument, StandardFonts, rgb } from 'pdf-lib/dist/pdf-lib.esm.js';
import * as XLSX from 'xlsx';

export type ReportType = 'sales' | 'orders' | 'trip_profit' | 'purchases' | 'expenses' | 'customer_payments' | 'inventory';
export type ReportRow = Record<string, string | number>;

export type ReportDataset = {
  orders: Array<{
    id: string;
    businessId?: string;
    tripId?: string;
    customerName: string;
    customerPhone?: string | null;
    orderDate: string;
    total: number;
    shippingFee?: number;
    paymentMode?: string | null;
    paymentStatus?: string | null;
    availabilityStatus?: string | null;
    status?: string | null;
    tripName?: string | null;
    productName?: string | null;
    productSize?: string | null;
    quantity?: number;
  }>;
  orderItems: Array<{ id: string; orderId: string; productVariantId: string; quantity: number }>;
  productVariants: Array<{ id: string; productId: string; size: string; stock: number }>;
  products: Array<{ id: string; businessId?: string; tripId?: string; name: string; category?: string; costPrice?: number; sellingPrice?: number }>;
  trips: Array<{ id: string; businessId?: string; name: string; destination?: string; tripDate?: string }>;
  financeTransactions: Array<{
    id: string;
    business_id?: string | null;
    trip_id?: string | null;
    order_id?: string | null;
    product_id?: string | null;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    payment_method?: string | null;
    category?: string | null;
    created_at?: string | null;
  }>;
  payments: Array<{
    id: string;
    business_id: string;
    order_id: string;
    amount: number;
    payment_status?: string | null;
    status?: string | null;
    payment_method?: string | null;
    verified?: boolean;
    created_at?: string | null;
  }>;
};

const title = (type: ReportType) => type.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value: number) => Number(value.toFixed(2));
const inRange = (value: string | null | undefined, from: string, to: string) => {
  const nextValue = (value ?? '').slice(0, 10);
  if (!nextValue) {
    return true;
  }

  return nextValue >= from && nextValue <= to;
};
const fileName = (type: ReportType, from: string, to: string, extension: string) => `OpsPS_${title(type).replace(/ /g, '')}_${from}_to_${to}.${extension}`;
const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const getOrderProduct = (dataset: ReportDataset, orderId: string) => {
  const item = dataset.orderItems.find((entry) => entry.orderId === orderId);
  if (!item) {
    return { item: undefined, variant: undefined, product: undefined };
  }

  const variant = dataset.productVariants.find((entry) => entry.id === item.productVariantId);
  const product = variant ? dataset.products.find((entry) => entry.id === variant.productId) : undefined;
  return { item, variant, product };
};

function summarize(rows: ReportRow[], type: ReportType): ReportRow {
  const summary: ReportRow = { Rows: rows.length };

  if (type === 'sales') {
    summary['Total Sales'] = money(rows.reduce((sum, row) => sum + Number(row['Total Sales'] ?? 0), 0));
    summary['Total Orders'] = new Set(rows.map((row) => row['Order ID'])).size;
    summary['Total Items'] = rows.reduce((sum, row) => sum + Number(row.Quantity ?? 0), 0);
    summary['Outstanding Payment'] = money(rows.filter((row) => String(row['Payment Status'] ?? '').toLowerCase() !== 'paid' && String(row['Payment Status'] ?? '').toLowerCase() !== 'verified').reduce((sum, row) => sum + Number(row['Total Sales'] ?? 0), 0));
    return summary;
  }

  if (type === 'orders') {
    summary['Total Orders'] = rows.length;
    summary['Total Sales'] = money(rows.reduce((sum, row) => sum + Number(row.Amount ?? row['Total Sales'] ?? 0), 0));
    summary['Total Items'] = rows.reduce((sum, row) => sum + Number(row.Quantity ?? 0), 0);
    return summary;
  }

  if (type === 'trip_profit') {
    summary['Total Sales'] = money(rows.reduce((sum, row) => sum + Number(row.Sales ?? 0), 0));
    summary['Net Profit'] = money(rows.reduce((sum, row) => sum + Number(row['Net Profit'] ?? 0), 0));
    summary['Total Trips'] = rows.length;
    return summary;
  }

  if (type === 'purchases') {
    summary['Total Purchases'] = money(rows.reduce((sum, row) => sum + Number(row['Total Purchase'] ?? 0), 0));
    summary['Purchase Rows'] = rows.length;
    return summary;
  }

  if (type === 'expenses') {
    summary['Total Expenses'] = money(rows.reduce((sum, row) => sum + Number(row.Amount ?? 0), 0));
    summary['Expense Rows'] = rows.length;
    return summary;
  }

  if (type === 'customer_payments') {
    summary['Total Payments'] = money(rows.reduce((sum, row) => sum + Number(row.Amount ?? 0), 0));
    summary['Verified Payments'] = rows.filter((row) => ['paid', 'verified'].includes(String(row['Payment Status'] ?? '').toLowerCase())).length;
    return summary;
  }

  summary['Stock Value'] = money(rows.reduce((sum, row) => sum + Number(row['Stock Value'] ?? 0), 0));
  summary['Low Stock Items'] = rows.filter((row) => String(row.Status ?? '').includes('Low Stock') || String(row.Status ?? '').includes('Out of Stock')).length;
  return summary;
}

export function buildReport(type: ReportType, dataset: ReportDataset, from: string, to: string, businessId?: string): { rows: ReportRow[]; summary: ReportRow } {
  const scopedOrders = businessId ? dataset.orders.filter((order) => order.businessId === businessId) : dataset.orders;
  const scopedTrips = businessId ? dataset.trips.filter((trip) => trip.businessId === businessId) : dataset.trips;
  const scopedProducts = businessId ? dataset.products.filter((product) => product.businessId === businessId) : dataset.products;
  const scopedFinance = businessId ? dataset.financeTransactions.filter((entry) => entry.business_id === businessId) : dataset.financeTransactions;
  const scopedPayments = businessId ? dataset.payments.filter((entry) => entry.business_id === businessId) : dataset.payments;

  const tripMap = new Map(scopedTrips.map((trip) => [trip.id, trip]));
  const productMap = new Map(scopedProducts.map((product) => [product.id, product]));
  const variantMap = new Map(dataset.productVariants.map((variant) => [variant.id, variant]));

  let rows: ReportRow[] = [];

  if (type === 'sales' || type === 'orders' || type === 'customer_payments') {
    rows = scopedOrders
      .filter((order) => inRange(order.orderDate, from, to) && (type !== 'sales' || String(order.status ?? '').toLowerCase() !== 'cancelled'))
      .map((order): ReportRow => {
        const { item, variant, product } = getOrderProduct(dataset, order.id);
        const trip = order.tripId ? tripMap.get(order.tripId) : undefined;
        const payment = scopedPayments.find((entry) => entry.order_id === order.id && (entry.payment_status === 'paid' || entry.status === 'paid' || entry.verified));

        const base = {
          Date: (order.orderDate ?? '').slice(0, 10),
          'Order ID': order.id,
          Customer: order.customerName,
          Phone: order.customerPhone ?? '',
          Trip: order.tripName ?? trip?.name ?? order.tripId ?? '',
          Product: order.productName ?? product?.name ?? '',
          Size: order.productSize ?? variant?.size ?? '',
          Quantity: Number(order.quantity ?? item?.quantity ?? 0),
          'Selling Price': Number(product?.sellingPrice ?? 0),
          'Shipping Fee': Number(order.shippingFee ?? 0),
          'Total Sales': Number(order.total ?? 0),
          'Payment Mode': order.paymentMode ?? '',
          'Payment Status': order.paymentStatus ?? '',
          Availability: order.availabilityStatus ?? '',
          'Order Status': order.status ?? '',
        };

        if (type === 'customer_payments') {
          return {
            'Payment Date': payment?.created_at ? payment.created_at.slice(0, 10) : (order.orderDate ?? '').slice(0, 10),
            'Order ID': order.id,
            Customer: order.customerName,
            Trip: order.tripName ?? trip?.name ?? order.tripId ?? '',
            Amount: Number(payment?.amount ?? order.total ?? 0),
            'Payment Mode': order.paymentMode ?? payment?.payment_method ?? '',
            'Payment Status': payment?.payment_status ?? order.paymentStatus ?? '',
            Receipt: payment?.id ? 'Attached' : 'None',
            'Verified Date': payment?.verified ? (payment.created_at ?? '').slice(0, 10) : '',
          } satisfies ReportRow;
        }

        return type === 'sales'
          ? (base as ReportRow)
          : ({
              'Order ID': base['Order ID'],
              'Order Date': base.Date,
              Customer: base.Customer,
              Phone: base.Phone,
              Trip: base.Trip,
              Product: base.Product,
              Size: base.Size,
              Quantity: base.Quantity,
              Amount: base['Total Sales'],
              'Payment Mode': base['Payment Mode'],
              'Payment Status': base['Payment Status'],
              Availability: base.Availability,
              'Order Status': base['Order Status'],
            } as ReportRow);
      });
  } else if (type === 'purchases') {
    rows = scopedFinance
      .filter((entry) => entry.type === 'expense' && /purchase|cogs|product cost|trip purchase|cost/i.test(String(entry.category ?? '') + ' ' + String(entry.description ?? '')) && inRange(entry.created_at ?? '', from, to))
      .map((entry): ReportRow => {
        const product = entry.product_id ? productMap.get(entry.product_id) : undefined;
        const trip = entry.trip_id ? tripMap.get(entry.trip_id) : undefined;
        const variant = entry.product_id ? Array.from(variantMap.values()).find((item) => item.productId === entry.product_id) : undefined;
        return {
          'Purchase ID': entry.id,
          Date: (entry.created_at ?? '').slice(0, 10),
          Trip: trip?.name ?? entry.trip_id ?? '',
          'Order ID': entry.order_id ?? '',
          Customer: '',
          Product: product?.name ?? '',
          Size: variant?.size ?? '',
          'Purchase Classification': 'Expense Record',
          Quantity: 1,
          'Product Cost': Number(entry.amount ?? 0),
          Transport: 0,
          Parking: 0,
          Toll: 0,
          'Other Expenses': 0,
          'Total Purchase': Number(entry.amount ?? 0),
          'Payment Method': entry.payment_method ?? '',
          Receipt: 'None',
          'Purchase Status': 'Confirmed',
        };
      });
  } else if (type === 'expenses') {
    rows = scopedFinance
      .filter((entry) => entry.type === 'expense' && inRange(entry.created_at ?? '', from, to))
      .map((entry): ReportRow => ({
        Date: (entry.created_at ?? '').slice(0, 10),
        Description: entry.description,
        Category: entry.category ?? 'General',
        'Payment Method': entry.payment_method ?? '',
        Amount: Number(entry.amount ?? 0),
        Trip: entry.trip_id ? tripMap.get(entry.trip_id)?.name ?? entry.trip_id : '',
        Order: entry.order_id ?? '',
        Purchase: '',
        Reference: entry.id,
      }));
  } else if (type === 'inventory') {
    rows = scopedProducts.flatMap((product): ReportRow[] => {
      const variants = dataset.productVariants.filter((variant) => variant.productId === product.id);
      return variants.map((variant): ReportRow => ({
        Product: product.name,
        Category: product.category ?? 'Other',
        Trip: product.tripId ? tripMap.get(product.tripId)?.name ?? product.tripId : '',
        Size: variant.size,
        Stock: variant.stock,
        'Cost Price': Number(product.costPrice ?? 0),
        'Selling Price': Number(product.sellingPrice ?? 0),
        'Stock Value': money(variant.stock * Number(product.costPrice ?? 0)),
        Status: variant.stock === 0 ? 'Out of Stock' : variant.stock <= 5 ? 'Low Stock' : 'In Stock',
      }));
    });
  } else {
    rows = scopedTrips
      .filter((trip) => inRange(trip.tripDate ?? '', from, to))
      .map((trip): ReportRow => {
        const tripOrders = scopedOrders.filter((order) => order.tripId === trip.id && String(order.status ?? '').toLowerCase() !== 'cancelled');
        const tripSales = tripOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
        const tripExpenseRows = scopedFinance.filter((entry) => entry.trip_id === trip.id && entry.type === 'expense' && inRange(entry.created_at ?? '', from, to));
        const tripExpenseTotal = tripExpenseRows.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
        const purchaseRows = scopedFinance.filter((entry) => entry.trip_id === trip.id && entry.type === 'expense' && /purchase|cogs|product cost|trip purchase|cost/i.test(String(entry.category ?? '') + ' ' + String(entry.description ?? '')) && inRange(entry.created_at ?? '', from, to));
        const purchaseCost = purchaseRows.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0);
        const otherExpenses = tripExpenseTotal - purchaseCost;

        return {
          Trip: trip.name,
          Destination: trip.destination ?? '',
          'Trip Date': trip.tripDate ?? '',
          Sales: money(tripSales),
          'Product Cost': money(purchaseCost),
          Transport: money(0),
          Parking: money(0),
          Toll: money(0),
          'Other Expenses': money(otherExpenses),
          'Net Profit': money(tripSales - purchaseCost - otherExpenses),
        };
      });
  }

  return { rows, summary: summarize(rows, type) };
}

export function exportExcel(type: ReportType, result: { rows: ReportRow[]; summary: ReportRow }, from: string, to: string) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([result.summary]), `${title(type)} Summary`);
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(result.rows), `${title(type)} Details`);
  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  download(new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName(type, from, to, 'xlsx'));
}

export async function exportPdf(type: ReportType, result: { rows: ReportRow[]; summary: ReportRow }, from: string, to: string) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = 560;
  const write = (text: string, size = 10) => {
    page.drawText(text.slice(0, 130), { x: 28, y, size, font, color: rgb(0.12, 0.16, 0.22) });
    y -= size + 8;
    if (y < 30) {
      page = pdf.addPage([842, 595]);
      y = 560;
    }
  };

  write(`OpsPS - ${title(type)} Report`, 18);
  write(`Date Range: ${from} to ${to}`);
  write(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  write(`Summary: ${Object.entries(result.summary).map(([key, value]) => `${key}: ${value}`).join(' | ')}`);
  result.rows.forEach((row) => write(Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | '), 7));
  const bytes = await pdf.save();
  download(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), fileName(type, from, to, 'pdf'));
}
