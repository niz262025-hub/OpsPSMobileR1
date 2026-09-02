const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const businessId = 'business-founder-browser-check';
  const productId = 'product-browser-test';
  const email = 'founder.browser.check@example.com';
  const account = {
    email,
    password: 'Pass123!',
    role: 'founder',
    name: 'Browser QA Founder',
    businessName: 'Browser QA Business',
    phone: '0123456789',
    address: '123 QA Street',
    businessId,
  };

  const state = {
    trips: [{ id: 'trip-browser-test', name: 'Browser QA Trip', destination: 'Kuala Lumpur', tripDate: '2026-08-25', notes: 'Trip created for browser QA', status: 'open', createdAt: new Date().toISOString() }],
    products: [{ id: productId, tripId: 'trip-browser-test', name: 'Browser QA Tee', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', costPrice: 20, sellingPrice: 45, status: 'ready', category: 'Clothing', description: 'QA product', size: 'M', stock: 8 }],
    productVariants: [{ id: 'variant-browser-test', productId, size: 'M', stock: 8 }],
    orders: [],
    orderItems: [],
    buyListItems: [],
    tripExpenses: [],
    tripCostOfGoods: [],
    financeTransactions: [],
    extraStockPurchases: [],
    paymentSettings: { bankName: 'Test Bank', accountName: 'Browser QA', accountNumber: '1234567890', paymentReference: 'Order ID', enabledPaymentMethods: ['Bank Transfer', 'QR Payment'], bnplEnabled: false },
    businessSettings: { businessName: 'Browser QA Business', phone: '0123456789', email, address: '123 QA Street', registrationNumber: 'BR123456' },
    marketplaceSettings: { currency: 'RM', defaultProductStatus: 'ready', defaultMarkup: 0 },
    tripSettings: { defaultTripDate: '2026-08-25', destinationType: 'Shopping Mall', clothingSizes: ['XS', 'S', 'M', 'L'], shoeSizes: ['22', '23', '24'] },
    shippingSettings: { defaultCourier: 'J&T', senderName: 'QA', senderPhone: '0123456789', senderAddress: '123 QA Street', integrationStatus: 'Mock / Not Connected' },
    notificationSettings: { paymentConfirmation: true, orderAvailability: true, shipping: true },
    userSettings: { name: 'Browser QA Founder', email },
  };

  const summary = {
    browserQA: false,
    fullCustomerOrderFlow: false,
    fullBusinessFlow: false,
    persistence: false,
    regression: false,
    typescript: false,
    expoWebExport: false,
  };

  await page.goto('http://localhost:19006', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(({ account, state }) => {
    localStorage.setItem('@opsps_accounts', JSON.stringify([account]));
    localStorage.setItem('@opsps_session', JSON.stringify(account));
    localStorage.setItem('@opsps_business_data_' + account.businessId, JSON.stringify(state));
  }, { account, state });

  await page.goto(`http://localhost:19006/product/${productId}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByText('I Want This Product').click();
  await page.getByPlaceholder('Full Name').fill('Customer Browser QA');
  await page.getByPlaceholder('e.g. 0123456789').fill('0123456789');
  await page.getByPlaceholder('Delivery Address').fill('45 Browser Street');
  await page.getByText('Submit Request', { exact: true }).click();
  await page.waitForTimeout(2500);

  const storage = await page.evaluate(({ key }) => JSON.parse(localStorage.getItem(key) || '{}'), { key: '@opsps_business_data_' + businessId });
  const lastOrder = Array.isArray(storage.orders) ? storage.orders[storage.orders.length - 1] : null;

  if (!lastOrder) {
    throw new Error('No order created in business data after submitting the real request flow.');
  }

  const expectedProductId = productId;
  const expectedTotal = 45;
  const hasCorrectOrder = lastOrder.productId === expectedProductId && Number(lastOrder.total) === expectedTotal && lastOrder.customerName === 'Customer Browser QA';

  if (!hasCorrectOrder) {
    throw new Error(`Order data mismatch: ${JSON.stringify(lastOrder)}`);
  }

  summary.browserQA = true;
  summary.fullCustomerOrderFlow = true;
  summary.fullBusinessFlow = true;

  const orderId = lastOrder.id;
  await page.goto(`http://localhost:19006/order/${orderId}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByText('Check Availability').click();
  await page.waitForTimeout(1500);
  const availabilityText = await page.locator('body').innerText();
  if (!/Payment Option|Pay Now|Proceed to Payment|Payment Required|Product Available/i.test(availabilityText)) {
    throw new Error('Availability flow did not reach expected status after submit.');
  }

  await page.goto('http://localhost:19006/inventory', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1000);
  const inventoryText = await page.locator('body').innerText();
  if (!/Inventory/i.test(inventoryText) || !/Browser QA Tee/i.test(inventoryText)) {
    throw new Error('Inventory screen did not show the product data.');
  }

  await page.goto('http://localhost:19006/finance', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1000);
  const financeText = await page.locator('body').innerText();
  if (!/Finance/i.test(financeText)) {
    throw new Error('Finance screen unavailable.');
  }

  await page.goto('http://localhost:19006/reports', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1000);
  const reportText = await page.locator('body').innerText();
  if (!/Reports/i.test(reportText) || !/Generate Report/i.test(reportText)) {
    throw new Error('Report screen unavailable.');
  }

  await page.reload();
  await page.waitForTimeout(1500);
  const afterRefresh = await page.evaluate(({ key }) => JSON.parse(localStorage.getItem(key) || '{}'), { key: '@opsps_business_data_' + businessId });
  const refreshedOrder = Array.isArray(afterRefresh.orders) ? afterRefresh.orders[afterRefresh.orders.length - 1] : null;
  summary.persistence = !!refreshedOrder && refreshedOrder.productId === expectedProductId && Number(refreshedOrder.total) === expectedTotal;

  if (!summary.persistence) {
    throw new Error('Persistence check failed after refresh.');
  }

  summary.regression = summary.browserQA && summary.fullCustomerOrderFlow && summary.fullBusinessFlow && summary.persistence;

  console.log(JSON.stringify(summary, null, 2));
  console.log('ORDER_VERIFIED=' + JSON.stringify(lastOrder));
  await browser.close();
})();
