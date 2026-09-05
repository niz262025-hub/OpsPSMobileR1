const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:41787';
const STAMP = Date.now();
const FOUNDER_EMAIL = `qa.founder.lifecycle.${STAMP}@example.com`;
const FOUNDER_PASSWORD = 'Pass123!';
const CUSTOMER_EMAIL = `qa.customer.lifecycle.${STAMP}@example.com`;
const CUSTOMER_PASSWORD = 'Pass123!';
const CUSTOMER_NAME = 'Lifecycle Customer QA';
const CUSTOMER_PHONE = '0123456789';
const CUSTOMER_ADDRESS = '45 Lifecycle Street';
const PRODUCT_NAME = `Lifecycle Tee ${STAMP}`;
const INITIAL_STOCK = '8';
const ORDERED_QUANTITY = 1;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function visibleTextLocator(page, text) {
  return page.getByText(text, { exact: false });
}

async function safeBody(page) {
  try {
    return await page.evaluate(() => {
      const root = document.body;
      return root ? root.innerText || '' : '';
    });
  } catch {
    return '';
  }
}

async function captureBrowserState(page, label) {
  const state = await page.evaluate(() => ({
    url: location.href,
    activeBusinessId: localStorage.getItem('@opsps_active_business_id'),
    session: localStorage.getItem('@opsps_session'),
    accounts: localStorage.getItem('@opsps_accounts'),
    businessKeys: Object.keys(localStorage).filter((key) => key.startsWith('@opsps_business_data_')).sort(),
  }));
  console.log(`STATE ${label}`, JSON.stringify(state));
  return state;
}

async function assertFounderState(page, label, shouldExist = true) {
  const state = await captureBrowserState(page, `${label}:precheck`);
  if (shouldExist) {
    if (!state.activeBusinessId || !state.session || !state.businessKeys.length) {
      throw new Error(`Founder scope missing during ${label}. ${JSON.stringify(state)}`);
    }
  }
  return state;
}

async function waitForNavigationOrContent(page, { urlPattern, contentPattern, timeoutMs = 20000, description }) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const currentUrl = page.url();
    if (urlPattern && urlPattern.test(currentUrl)) {
      return true;
    }

    if (contentPattern) {
      const contentMatches = await page.locator('body').filter({ hasText: contentPattern }).count();
      if (contentMatches > 0) {
        return true;
      }
    }

    await page.waitForTimeout(200);
  }

  throw new Error(`Navigation did not occur for ${description}. Current URL: ${page.url()}`);
}

async function clickInteractiveElement(page, text, { urlPattern, contentPattern, timeoutMs = 20000, description } = {}) {
  const normalizedText = String(text).replace(/[’']/g, "'");
  const exactPattern = new RegExp(`^${escapeRegExp(normalizedText).replace(/'/g, "['’]")}$`, 'i');
  const containsPattern = new RegExp(escapeRegExp(normalizedText).replace(/'/g, "['’]"), 'i');
  const primaryCandidates = page.locator('button, a, [role="button"], [tabindex="0"]');
  const fallbackCandidates = page.locator('div, span, p');

  const candidates = [primaryCandidates, fallbackCandidates];

  for (let attempt = 0; attempt < 50; attempt += 1) {
    for (const list of candidates) {
      const count = await list.count();
      for (let i = 0; i < count; i += 1) {
        const candidate = list.nth(i);
        const visible = await candidate.isVisible().catch(() => false);
        if (!visible) continue;

        const textContent = await candidate.textContent().catch(() => '');
        const trimmed = (textContent || '').replace(/\s+/g, ' ').trim();
        if (!trimmed) continue;

        const exactMatch = exactPattern.test(trimmed);
        const containsMatch = containsPattern.test(trimmed);
        const shouldMatch = normalizedText.toLowerCase() === 'founder' ? exactMatch : (exactMatch || containsMatch);
        if (!shouldMatch) continue;

        if (normalizedText.toLowerCase() === 'register founder' || normalizedText.toLowerCase() === 'become a founder') {
          const buttonCandidate = page.locator('button, [role="button"], [tabindex="0"]').filter({ hasText: new RegExp(`^${escapeRegExp(normalizedText)}$`, 'i') }).first();
          if (await buttonCandidate.isVisible().catch(() => false)) {
            await buttonCandidate.scrollIntoViewIfNeeded().catch(() => {});
            await buttonCandidate.click({ timeout: timeoutMs, force: true });
            if (urlPattern || contentPattern) {
              await waitForNavigationOrContent(page, { urlPattern, contentPattern, timeoutMs, description });
            }
            return true;
          }
        }

        await candidate.scrollIntoViewIfNeeded().catch(() => {});
        await candidate.click({ timeout: timeoutMs, force: true });

        if (urlPattern || contentPattern) {
          await waitForNavigationOrContent(page, { urlPattern, contentPattern, timeoutMs, description });
        }
        return true;
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`No visible interactive element matched '${text}' at current URL: ${page.url()}`);
}

async function clickExact(page, text) {
  await clickInteractiveElement(page, text, { timeoutMs: 20000, description: text });
}

async function waitForVisibleInputCount(page, minCount, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const count = await page.locator('input').count();
      if (count >= minCount) {
        const firstVisible = await page.locator('input').first().isVisible().catch(() => false);
        if (firstVisible) {
          return true;
        }
      }
    } catch {
      // Ignore transient target crashes while the screen hydrates.
    }
    await page.waitForTimeout(150);
  }

  throw new Error(`Expected at least ${minCount} visible inputs but none were ready within ${timeoutMs}ms.`);
}

async function clickMatchingText(page, pattern, { timeoutMs = 20000 } = {}) {
  const locator = page.getByText(pattern, { exact: false }).first();
  await locator.waitFor({ state: 'visible', timeout: timeoutMs });
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.click({ timeout: timeoutMs, force: true });
  return true;
}

async function clickExactVisibleText(page, text, { timeoutMs = 20000 } = {}) {
  const exactPattern = new RegExp(`^${escapeRegExp(text)}$`, 'i');

  const interactiveTargets = [
    page.locator('button, a, [role="button"], [tabindex="0"]'),
    page.locator('div[tabindex="0"], div[role="button"]'),
    page.locator('[aria-label]'),
  ];

  for (const target of interactiveTargets) {
    const count = await target.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = target.nth(i);
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;

      const title = (await candidate.textContent().catch(() => '') || '').replace(/\s+/g, ' ').trim();
      if (!title || !exactPattern.test(title)) {
        continue;
      }

      await candidate.scrollIntoViewIfNeeded().catch(() => {});
      await candidate.click({ timeout: timeoutMs, force: true });
      return true;
    }
  }

  const visibleTextTarget = page.locator('div, span, p').filter({ hasText: exactPattern }).first();
  await visibleTextTarget.waitFor({ state: 'visible', timeout: timeoutMs }).catch(() => {});
  await visibleTextTarget.scrollIntoViewIfNeeded().catch(() => {});
  await visibleTextTarget.click({ timeout: timeoutMs, force: true });
  return true;
}

async function clickPaymentCompletion(page) {
  const patterns = [
    /I\s*['’]ve Completed Payment/i,
    /Completed Payment/i,
    /I\s*have Completed Payment/i,
  ];

  for (const pattern of patterns) {
    try {
      await clickMatchingText(page, pattern, { timeoutMs: 20000 });
      return true;
    } catch {
      // Try the next match pattern if this exact label is not present.
    }
  }

  throw new Error('No payment completion control found in the payment modal.');
}

async function navigateAndClick(page, text, { urlPattern, contentPattern, timeoutMs = 20000 }) {
  await clickInteractiveElement(page, text, { urlPattern, contentPattern, timeoutMs, description: text });
}

async function fillInputsByIndex(page, values) {
  await waitForVisibleInputCount(page, values.length, 20000);
  const inputs = page.locator('input');
  for (let i = 0; i < values.length; i += 1) {
    await inputs.nth(i).waitFor({ state: 'visible', timeout: 15000 });
    await inputs.nth(i).fill(values[i]);
  }
}

async function fillTripForm(page, tripName, destination, notes) {
  const fields = page.locator('input, textarea');
  await fields.nth(0).waitFor({ state: 'visible', timeout: 15000 });
  await fields.nth(0).fill(tripName);
  await fields.nth(1).fill(destination);
  await fields.nth(2).fill(notes);
}

async function logStep(page, stepName, action) {
  const startedAt = Date.now();
  const url = page.url();

  try {
    await action();
    console.log(`STEP ${stepName}\nURL ${url}\nPASS`);
    return true;
  } catch (error) {
    const body = await safeBody(page);
    const snippet = body.replace(/\s+/g, ' ').slice(0, 500);
    console.log(`STEP ${stepName}\nURL ${url}\nFAIL\nBODY ${snippet || '(empty)'}\nERROR ${error.message}`);
    throw error;
  } finally {
    const elapsed = Date.now() - startedAt;
    console.log(`STEP ${stepName} took ${elapsed}ms`);
  }
}

async function readStockUnits(page, productName) {
  await page.goto(`${BASE_URL}/(tabs)/inventory`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const row = page.locator('*').filter({ hasText: new RegExp(`^${escapeRegExp(productName)}$`) }).first();
  await row.waitFor({ state: 'visible', timeout: 20000 });
  const card = page.locator('*').filter({ hasText: new RegExp(`${escapeRegExp(productName)}.*Total: \\d+ units`, 's') }).first();
  const text = await card.innerText();
  const match = text.match(/Total:\s*(\d+)\s*units/);
  if (!match) {
    throw new Error(`Could not read stock units for ${productName}. Text: ${text}`);
  }
  return Number(match[1]);
}

async function founderLogin(page) {
  await page.goto(`${BASE_URL}/login?role=founder`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input').nth(0).fill(FOUNDER_EMAIL);
  await page.locator('input').nth(1).fill(FOUNDER_PASSWORD);
  await clickExact(page, 'Log Masuk');
  await page.waitForURL(/\/\(tabs\)\/dashboard|\/dashboard/, { timeout: 30000 });
}

async function customerLogin(page) {
  await page.goto(`${BASE_URL}/login?role=customer`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input').nth(0).fill(CUSTOMER_EMAIL);
  await page.locator('input').nth(1).fill(CUSTOMER_PASSWORD);
  await clickExact(page, 'Log Masuk');
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const record = {};

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await captureBrowserState(page, 'initial-app-load');

    await logStep(page, '1: Founder landing page', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await navigateAndClick(page, 'Founder', { urlPattern: /\/register\/founder(?:\?|$)/, timeoutMs: 20000 });
    });

    await logStep(page, '2: Founder registration', async () => {
      await waitForNavigationOrContent(page, { urlPattern: /\/register\/founder(?:\?|$)/, description: 'Founder register', timeoutMs: 20000 });
      await fillInputsByIndex(page, [
        'QA Founder Lifecycle',
        'Lifecycle QA Business',
        FOUNDER_EMAIL,
        '0123456789',
        '123 QA Street',
        FOUNDER_PASSWORD,
        FOUNDER_PASSWORD,
      ]);
      await clickInteractiveElement(page, 'Register Founder', {
        urlPattern: /\/register\/success\?role=founder(?:\?|$)/,
        timeoutMs: 20000,
        description: 'Register Founder submit button',
      });
    });

    await logStep(page, '3: Founder success to login', async () => {
      await clickInteractiveElement(page, 'Proceed to Login', {
        urlPattern: /\/login\?role=founder(?:\?|$)/,
        timeoutMs: 20000,
        description: 'Proceed to Login button',
      });
    });

    await logStep(page, '4: Founder login', async () => {
      await waitForNavigationOrContent(page, { urlPattern: /\/login\?role=founder(?:\?|$)/, description: 'Founder login', timeoutMs: 20000 });
      const emailInput = page.locator('input').nth(0);
      const passwordInput = page.locator('input').nth(1);
      await emailInput.waitFor({ state: 'visible', timeout: 20000 });
      await emailInput.fill(FOUNDER_EMAIL);
      await passwordInput.fill(FOUNDER_PASSWORD);
      await clickExact(page, 'Log Masuk');
      await waitForNavigationOrContent(page, { urlPattern: /\/\(tabs\)\/dashboard|\/dashboard/, description: 'Founder dashboard', timeoutMs: 30000 });
      await assertFounderState(page, 'after-founder-login');
      await captureBrowserState(page, 'after-founder-login');
    });

    await logStep(page, '5: Founder dashboard', async () => {
      await page.goto(`${BASE_URL}/(tabs)/trips`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await assertFounderState(page, 'before-trip-navigation');
    });

    await logStep(page, '6: Founder create trip', async () => {
      await page.goto(`${BASE_URL}/trip/create`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await fillTripForm(page, `Lifecycle QA Trip ${STAMP}`, 'Kuala Lumpur', 'Trip created for lifecycle QA');
      await clickExact(page, 'Create Trip');
      await page.waitForURL(/\/\(tabs\)\/trips|\/trips/, { timeout: 30000 });
    });

    let tripUrl = '';
    await logStep(page, '7: Founder trip detail', async () => {
      await page.goto(`${BASE_URL}/(tabs)/trips`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const viewButton = page.getByText('View', { exact: false }).last();
      await viewButton.waitFor({ state: 'visible', timeout: 30000 });
      await viewButton.click({ force: true });
      await page.waitForURL(/\/trip\//, { timeout: 30000 });
      tripUrl = page.url();
    });

    await logStep(page, '8: Founder upload product', async () => {
      await page.waitForURL(/\/marketplace|\/trip\//, { timeout: 30000 });
      await clickExact(page, '+ Upload Product');
      await page.waitForURL(/\/marketplace|\/\(tabs\)\/marketplace/, { timeout: 30000 });
      await fillInputsByIndex(page, [
        PRODUCT_NAME,
        '45',
        '20',
        INITIAL_STOCK,
      ]);
      await clickExact(page, 'Generate Product Link');
    });

    let productLink = '';
    await logStep(page, '9: Product link generated', async () => {
      const linkText = await page.locator('body').innerText();
      const match = linkText.match(new RegExp(`http:\/\\/localhost:${BASE_URL.match(/:(\d+)$/)?.[1] || '41787'}\\/product\\/[A-Za-z0-9-]+\\?businessId=[^\\s]+`));
      if (!match) {
        throw new Error('No generated product link found in page text.');
      }
      productLink = match[0];
      console.log(`PRODUCT_LINK ${productLink}`);
    });

    await logStep(page, '10: Founder records stock BEFORE payment', async () => {
      record.stockBefore = await readStockUnits(page, PRODUCT_NAME);
      console.log(`STOCK_BEFORE_PAYMENT ${record.stockBefore}`);
    });

    await logStep(page, '11: Customer registration', async () => {
      await page.goto(`${BASE_URL}/register/customer`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await fillInputsByIndex(page, [
        CUSTOMER_NAME,
        CUSTOMER_EMAIL,
        CUSTOMER_PHONE,
        CUSTOMER_ADDRESS,
        CUSTOMER_PASSWORD,
        CUSTOMER_PASSWORD,
      ]);
      await clickExact(page, 'Register Customer');
    });

    await logStep(page, '12: Customer success to login', async () => {
      await page.waitForURL(/\/register\/success\?role=customer/, { timeout: 20000 });
      await clickExact(page, 'Proceed to Login');
    });

    await logStep(page, '13: Customer login', async () => {
      await page.waitForURL(/\/login\?role=customer/, { timeout: 20000 });
      await page.locator('input').nth(0).fill(CUSTOMER_EMAIL);
      await page.locator('input').nth(1).fill(CUSTOMER_PASSWORD);
      await clickExact(page, 'Log Masuk');
    });

    await logStep(page, '14: Customer product detail', async () => {
      await page.goto(productLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(PRODUCT_NAME)}$`) }).first().waitFor({ state: 'visible', timeout: 30000 });
      const bodyText = await safeBody(page);
      if (!bodyText.includes(PRODUCT_NAME) || !bodyText.includes('RM45.00')) {
        throw new Error('Product name or price not found on product detail page.');
      }
    });

    await logStep(page, '15: Customer request product', async () => {
      await clickExact(page, 'I Want This Product');
      await page.getByPlaceholder('Full Name').waitFor({ state: 'visible', timeout: 20000 });
      await page.getByPlaceholder('Full Name').fill(CUSTOMER_NAME);
      await page.getByPlaceholder('e.g. 0123456789').fill(CUSTOMER_PHONE);
      await page.getByPlaceholder('Delivery Address').fill(CUSTOMER_ADDRESS);
      await clickExact(page, 'Submit Request');
      await page.locator('div').filter({ hasText: /^Request Sent$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
    });

    await logStep(page, '16: Founder confirms availability and Pay Now offer', async () => {
      await founderLogin(page);
      await page.goto(`${BASE_URL}/(tabs)/orders`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('div').filter({ hasText: /^Orders$/ }).first().waitFor({ state: 'visible', timeout: 20000 });
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(CUSTOMER_NAME)}$`) }).first().waitFor({ state: 'visible', timeout: 30000 });
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(CUSTOMER_NAME)}$`) }).first().click();

      const availabilityButton = page.locator('div[tabindex="0"]').filter({ hasText: /^Check Availability$/ }).first();
      if (await availabilityButton.isVisible().catch(() => false)) {
        await availabilityButton.click();
      }
      await page.locator('div').filter({ hasText: /^Product Available$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
      const payNowButton = page.locator('div[tabindex="0"]').filter({ hasText: /^Pay Now$/ }).first();
      if (await payNowButton.isVisible().catch(() => false)) {
        await payNowButton.click();
      }
      await page.locator('div').filter({ hasText: /^Payment Option: Pay Now$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
    });

    await logStep(page, '17: Customer sees Payment Required and proceeds to payment', async () => {
      await customerLogin(page);
      await page.goto(productLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await clickExact(page, 'I Want This Product').catch(() => {});
      await page.goto(productLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.getByText('Payment Required', { exact: false }).first().waitFor({ state: 'visible', timeout: 30000 });
      await clickExact(page, 'Proceed to Payment');
      await page.getByText(/^Payment$/, { exact: true }).first().waitFor({ state: 'visible', timeout: 20000 });
    });

    await logStep(page, '18: Customer selects Bank Transfer and completes payment', async () => {
      const paymentTitle = page.getByText(/^Payment$/, { exact: true }).first();
      await paymentTitle.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

      await clickMatchingText(page, /^Bank Transfer$/i, { timeoutMs: 20000 });
      await clickPaymentCompletion(page);
      await page.locator('div').filter({ hasText: /^Order Progress$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
    });

    await logStep(page, '19: Founder records stock AFTER payment', async () => {
      await founderLogin(page);
      record.stockAfter = await readStockUnits(page, PRODUCT_NAME);
      console.log(`STOCK_AFTER_PAYMENT ${record.stockAfter}`);
      record.expected = record.stockBefore - ORDERED_QUANTITY;
      console.log(`ORDERED_QUANTITY ${ORDERED_QUANTITY}`);
      console.log(`EXPECTED_STOCK_AFTER ${record.expected}`);
      if (record.stockAfter !== record.expected) {
        throw new Error(`Stock deduction mismatch: expected ${record.expected}, got ${record.stockAfter}`);
      }
    });

    await logStep(page, '20: Duplicate payment/reload does not deduct stock again', async () => {
      await customerLogin(page);
      await page.goto(productLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('div').filter({ hasText: /^Order Progress$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
      const proceedButtonVisible = await page.locator('div[tabindex="0"]').filter({ hasText: /^Proceed to Payment$/ }).first().isVisible().catch(() => false);
      if (proceedButtonVisible) {
        throw new Error('Proceed to Payment button still visible after payment success; duplicate payment risk.');
      }

      await founderLogin(page);
      const stockAfterReload = await readStockUnits(page, PRODUCT_NAME);
      console.log(`STOCK_AFTER_DUPLICATE_CHECK ${stockAfterReload}`);
      if (stockAfterReload !== record.expected) {
        throw new Error(`Duplicate payment deducted stock again: expected ${record.expected}, got ${stockAfterReload}`);
      }
    });

    let orderUrl = '';
    await logStep(page, '21: Founder order detail shows Payment Received and starts packing', async () => {
      await page.goto(`${BASE_URL}/(tabs)/orders`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await assertFounderState(page, 'before-order-list');
      await captureBrowserState(page, 'order-list-state');
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(CUSTOMER_NAME)}$`) }).first().waitFor({ state: 'visible', timeout: 30000 });
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(CUSTOMER_NAME)}$`) }).first().click();
      await page.waitForURL(/\/order\//, { timeout: 30000 });
      orderUrl = page.url();
      await assertFounderState(page, 'order-detail-route');
      await captureBrowserState(page, 'order-detail-state');
      const bodyText = await safeBody(page);
      if (!bodyText.includes('Payment Received')) {
        throw new Error('Order detail did not render Payment Received state.');
      }
      if (!bodyText.includes(CUSTOMER_NAME)) {
        throw new Error('Order detail lost association with customer.');
      }
      await clickExactVisibleText(page, 'Start Packing', { timeoutMs: 20000 });
      await page.waitForTimeout(800);
      const nextBodyText = await safeBody(page);
      if (!nextBodyText.includes('Prepare Shipment') && !nextBodyText.includes('Packing')) {
        throw new Error('Order detail did not advance to the shipment preparation state after Start Packing.');
      }
    });

    await logStep(page, '22: Founder prepares and creates shipment', async () => {
      await clickExactVisibleText(page, 'Prepare Shipment', { timeoutMs: 20000 });
      await page.getByText('EasyParcel Shipment', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });

      const inputs = page.locator('input');
      await inputs.nth(0).fill('J&T Express');
      const postcodeIndex = 3;
      await inputs.nth(postcodeIndex).fill('50000');
      await inputs.nth(postcodeIndex + 1).fill('Kuala Lumpur');
      await inputs.nth(postcodeIndex + 2).fill('WP Kuala Lumpur');
      await inputs.nth(postcodeIndex + 3).fill('1');

      await clickExactVisibleText(page, 'Create Shipment', { timeoutMs: 20000 });
      await page.getByText('Shipment', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
    });

    console.log('STEP22_RESULT=PASS');
    console.log(`STEP22_ORDER_URL ${orderUrl}`);

    await logStep(page, '23: Order transitions to SHIPPED', async () => {
      const bodyText = await safeBody(page);
      if (!bodyText.includes('Shipment Status: shipped')) {
        throw new Error(`Order did not transition to shipped. Body: ${bodyText.slice(0, 400)}`);
      }
    });

    await logStep(page, '24: Founder marks order as Delivered', async () => {
      await clickExactVisibleText(page, 'Mark as Delivered', { timeoutMs: 20000 });
      await page.getByText('Delivered', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
    });

    await logStep(page, '25: Delivered state persists after refresh', async () => {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.getByText('Delivered', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
    });

    await logStep(page, '26: Founder closes the trip', async () => {
      await page.goto(tripUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await clickExact(page, 'Close Trip');
      await page.locator('input, textarea').first().waitFor({ state: 'visible', timeout: 20000 });
      const fields = page.locator('input, textarea');
      await fields.nth(0).fill('50');
      await fields.nth(1).fill('Trip closing transport cost');
      await clickExact(page, 'Save Expenses & Close Trip');
      await page.getByText('Closed', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
    });

    await logStep(page, '27: Finance shows customer payment transaction', async () => {
      await page.goto(`${BASE_URL}/(tabs)/finance`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.getByText('Finance', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
      const bodyText = await safeBody(page);
      if (!bodyText.includes('Customer Payment')) {
        throw new Error(`Customer Payment transaction not found in Finance. Body: ${bodyText.slice(0, 500)}`);
      }
    });

    await logStep(page, '28: Reports generates sales report with the order', async () => {
      await page.goto(`${BASE_URL}/(tabs)/reports`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.getByText('Reports', { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
      await clickExact(page, 'Generate Report');
      await page.waitForTimeout(500);
      const bodyText = await safeBody(page);
      if (!bodyText.includes('Sales Summary')) {
        throw new Error(`Sales report summary missing. Body: ${bodyText.slice(0, 500)}`);
      }
    });

    console.log('LIFECYCLE_E2E_VERIFICATION_COMPLETED');
    console.log(`FINAL_PRODUCT_LINK ${productLink}`);
    console.log(`FINAL_ORDER_URL ${orderUrl}`);
    console.log(`SUMMARY stockBefore=${record.stockBefore} orderedQuantity=${ORDERED_QUANTITY} stockAfter=${record.stockAfter} expected=${record.expected}`);
  } catch (error) {
    console.error('LIFECYCLE_E2E_VERIFICATION_FAILED', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
