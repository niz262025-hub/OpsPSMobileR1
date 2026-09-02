const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8081';
const FOUNDER_EMAIL = 'qa.founder.live@example.com';
const FOUNDER_PASSWORD = 'Pass123!';
const CUSTOMER_EMAIL = 'qa.customer.live@example.com';
const CUSTOMER_PASSWORD = 'Pass123!';
const CUSTOMER_NAME = 'Customer Browser QA';
const CUSTOMER_PHONE = '0123456789';
const CUSTOMER_ADDRESS = '45 Browser Street';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function exactMatchLocator(page, text) {
  return page.locator('div[tabindex="0"]').filter({
    hasText: new RegExp(`^${escapeRegExp(text)}$`),
  });
}

function fallbackMatchLocator(page, text) {
  return page.locator('*').filter({
    hasText: new RegExp(`^${escapeRegExp(text)}$`),
  });
}

async function safeBody(page) {
  return await page.locator('body').innerText();
}

async function clickExact(page, text) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const primary = exactMatchLocator(page, text);
    const primaryCount = await primary.count();

    for (let i = 0; i < primaryCount; i += 1) {
      const candidate = primary.nth(i);
      const visible = await candidate.isVisible().catch(() => false);
      if (visible) {
        await candidate.click();
        return;
      }
    }

    const fallback = fallbackMatchLocator(page, text);
    const fallbackCount = await fallback.count();

    for (let i = 0; i < fallbackCount; i += 1) {
      const candidate = fallback.nth(i);
      const visible = await candidate.isVisible().catch(() => false);
      if (visible) {
        await candidate.click();
        return;
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`No visible exact match found for '${text}'`);
}

async function fillInputsByIndex(page, values) {
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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  const steps = [];

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    await logStep(page, '1: Founder landing page', async () => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await clickExact(page, 'Founder');
    });

    await logStep(page, '2: Founder registration', async () => {
      await page.waitForURL(/\/register\/founder/, { timeout: 20000 });
      await fillInputsByIndex(page, [
        'QA Founder',
        'Browser QA Business',
        FOUNDER_EMAIL,
        '0123456789',
        '123 QA Street',
        FOUNDER_PASSWORD,
        FOUNDER_PASSWORD,
      ]);
      await clickExact(page, 'Register Founder');
    });

    await logStep(page, '3: Founder success to login', async () => {
      await page.waitForURL(/\/register\/success\?role=founder/, { timeout: 20000 });
      await clickExact(page, 'Proceed to Login');
    });

    await logStep(page, '4: Founder login', async () => {
      await page.waitForURL(/\/login\?role=founder/, { timeout: 20000 });
      const emailInput = page.locator('input').nth(0);
      const passwordInput = page.locator('input').nth(1);
      await emailInput.waitFor({ state: 'visible', timeout: 20000 });
      await emailInput.fill(FOUNDER_EMAIL);
      await passwordInput.fill(FOUNDER_PASSWORD);
      await clickExact(page, 'Log Masuk');
    });

    await logStep(page, '5: Founder dashboard', async () => {
      await page.waitForURL(/\/\(tabs\)\/dashboard|\/dashboard/, { timeout: 30000 });
      await page.goto(`${BASE_URL}/(tabs)/trips`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    });

    await logStep(page, '6: Founder create trip', async () => {
      await page.waitForURL(/\/\(tabs\)\/trips/, { timeout: 30000 });
      await clickExact(page, 'Create Trip');
      await fillTripForm(page, 'Browser QA Trip', 'Kuala Lumpur', 'Trip created for browser QA');
      await clickExact(page, 'Create Trip');
    });

    await logStep(page, '7: Founder trip detail', async () => {
      await page.waitForURL(/\/trips/, { timeout: 30000 });
      await clickExact(page, 'View');
      await page.waitForURL(/\/trip\//, { timeout: 30000 });
    });

    await logStep(page, '8: Founder upload product', async () => {
      await page.waitForURL(/\/marketplace|\/trip\//, { timeout: 30000 });
      await clickExact(page, '+ Upload Product');
      await page.waitForURL(/\/marketplace|\/\(tabs\)\/marketplace/, { timeout: 30000 });
      await fillInputsByIndex(page, [
        'Browser QA Tee',
        '45',
        '20',
        '8',
      ]);
      await clickExact(page, 'Generate Product Link');
    });

    let productLink = '';
    await logStep(page, '9: Product link generated', async () => {
      const linkText = await page.locator('body').innerText();
      const match = linkText.match(/http:\/\/localhost:8081\/product\/[A-Za-z0-9-]+\?businessId=[^\s]+/);
      if (!match) {
        throw new Error('No generated product link found in page text.');
      }
      productLink = match[0];
      console.log(`PRODUCT_LINK ${productLink}`);
    });

    await logStep(page, '10: Customer registration', async () => {
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

    await logStep(page, '11: Customer success to login', async () => {
      await page.waitForURL(/\/register\/success\?role=customer/, { timeout: 20000 });
      await clickExact(page, 'Proceed to Login');
    });

    await logStep(page, '12: Customer login', async () => {
      await page.waitForURL(/\/login\?role=customer/, { timeout: 20000 });
      await page.locator('input').nth(0).fill(CUSTOMER_EMAIL);
      await page.locator('input').nth(1).fill(CUSTOMER_PASSWORD);
      await clickExact(page, 'Log Masuk');
    });

    await logStep(page, '13: Customer product detail', async () => {
      await page.goto(productLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('div').filter({ hasText: /^Browser QA Tee$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
      const bodyText = await safeBody(page);
      if (!bodyText.includes('Browser QA Tee') || !bodyText.includes('RM45.00')) {
        throw new Error('Product name or price not found on product detail page.');
      }
    });

    await logStep(page, '14: Customer request product', async () => {
      await clickExact(page, 'I Want This Product');
      await page.getByPlaceholder('Full Name').waitFor({ state: 'visible', timeout: 20000 });
      await page.getByPlaceholder('Full Name').fill(CUSTOMER_NAME);
      await page.getByPlaceholder('e.g. 0123456789').fill(CUSTOMER_PHONE);
      await page.getByPlaceholder('Delivery Address').fill(CUSTOMER_ADDRESS);
      await clickExact(page, 'Submit Request');
      await page.locator('div').filter({ hasText: /^Request Sent$/ }).first().waitFor({ state: 'visible', timeout: 30000 });
    });

    await logStep(page, '15: Founder order list', async () => {
      await page.goto(`${BASE_URL}/login?role=founder`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('input').nth(0).fill(FOUNDER_EMAIL);
      await page.locator('input').nth(1).fill(FOUNDER_PASSWORD);
      await clickExact(page, 'Log Masuk');
      await page.waitForURL(/\/\(tabs\)\/dashboard|\/dashboard/, { timeout: 30000 });
      await page.goto(`${BASE_URL}/(tabs)/orders`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('div').filter({ hasText: /^Orders$/ }).first().waitFor({ state: 'visible', timeout: 20000 });
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(CUSTOMER_NAME)}$`) }).first().waitFor({ state: 'visible', timeout: 30000 });
      await page.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(CUSTOMER_NAME)}$`) }).first().click();
    });

    await logStep(page, '16: Founder order detail', async () => {
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

    console.log('LIVE_E2E_VERIFICATION_COMPLETED');
    console.log(`FINAL_PRODUCT_LINK ${productLink}`);
  } catch (error) {
    console.error('LIVE_E2E_VERIFICATION_FAILED', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
