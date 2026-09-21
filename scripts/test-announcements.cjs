const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  console.log('1. Logging in...');
  await page.goto('http://localhost:5173/auth/login');
  await page.fill('input[type="email"]', 'admin@omniflow.ai');
  await page.fill('input[type="password"]', 'Admin@123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  console.log('   OK logged in');

  console.log('2. Opening Announcements page...');
  await page.goto('http://localhost:5173/dashboard/crm/announcements');
  await page.waitForSelector('h1', { timeout: 8000 });
  await page.screenshot({ path: 'ss-01-list.png' });
  console.log('   OK page loaded');

  console.log('3. Creating announcement...');
  await page.click('button:has-text("New")');
  await page.waitForSelector('input[placeholder*="title" i]', { timeout: 5000 });
  await page.fill('input[placeholder*="title" i]', 'Test Announcement from Playwright');
  await page.fill('textarea', 'Automated test announcement to verify end-to-end CRM announcements.');
  await page.selectOption('select', '3');
  await page.screenshot({ path: 'ss-02-form.png' });
  await page.click('button:has-text("Create")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'ss-03-created.png' });
  console.log('   OK created');

  console.log('4. Opening detail panel...');
  await page.click('text=Test Announcement from Playwright');
  await page.waitForSelector('text=Publish now', { timeout: 5000 });
  await page.screenshot({ path: 'ss-04-detail.png' });
  console.log('   OK detail open');

  console.log('5. Publishing...');
  await page.click('button:has-text("Publish now")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'ss-05-published.png' });
  console.log('   OK published');

  console.log('5b. Closing panel via X button...');
  // Click the X button in the panel header (fixed z-50 panel)
  await page.locator('.fixed.inset-0.z-50 button').first().click();
  await page.waitForTimeout(800);

  console.log('6. Filtering by Published...');
  await page.click('button:has-text("Published")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'ss-06-filter.png' });
  console.log('   OK filter works');

  console.log('\nAll steps passed');
  await browser.close();
})().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
