const { chromium, webkit, devices } = require('playwright');
const path = require('path');

const outDir = 'e:/PRO_WORK/Fabric_Awinings/docs/customer-screenshots-2026-04-21';
const pages = [
  { url: 'https://fabrika-tentov.ru/', name: 'home' },
  { url: 'https://fabrika-tentov.ru/catalog', name: 'catalog' },
  { url: 'https://fabrika-tentov.ru/portfolio', name: 'portfolio' },
  { url: 'https://fabrika-tentov.ru/contacts', name: 'contacts' },
];

async function waitRendered(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

(async () => {
  const browserDesktop = await chromium.launch({ headless: true });
  const ctxDesktop = await browserDesktop.newContext({ viewport: { width: 1920, height: 1080 } });

  for (const p of pages) {
    const page = await ctxDesktop.newPage();
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitRendered(page);
    await page.screenshot({ path: path.join(outDir, `${p.name}-desktop.png`), fullPage: true });
    await page.close();
  }
  await ctxDesktop.close();
  await browserDesktop.close();

  const browserMobile = await webkit.launch({ headless: true });
  const ctxMobile = await browserMobile.newContext({ ...devices['iPhone 13'] });

  for (const p of pages) {
    const page = await ctxMobile.newPage();
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitRendered(page);
    await page.screenshot({ path: path.join(outDir, `${p.name}-mobile.png`), fullPage: true });
    await page.close();
  }
  await ctxMobile.close();
  await browserMobile.close();
})();
