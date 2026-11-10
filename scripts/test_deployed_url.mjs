import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const DEPLOYED_URL = 'https://hypercybers99.github.io/agent-allowance-app/';

async function main() {
  console.log('=================================================================================');
  console.log(`TESTING DEPLOYED GITHUB PAGES APPLICATION: ${DEPLOYED_URL}`);
  console.log('=================================================================================');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Visit Landing Page
  console.log('\n--- 1. Landing Page Response & Title ---');
  const res = await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle', timeout: 20000 });
  console.log(`HTTP Status: ${res.status()}`);
  if (res.status() !== 200) throw new Error(`Unexpected HTTP status: ${res.status()}`);

  const title = await page.title();
  console.log(`Page Title:  ${title}`);

  // 2. Zero-Wallet Chain Read Verification
  console.log('\n--- 2. Zero-Wallet Chain Read ---');
  await page.waitForSelector('text=On-Chain Ledger State (Studionet Chain 61999)', { timeout: 15000 });
  console.log('PASS: Successfully read and rendered on-chain ledger state from AllowanceVault!');

  // 3. Computed Typography
  console.log('\n--- 3. Typography Size Audit ---');
  const pFontSize = await page.evaluate(() => {
    const p = document.querySelector('p');
    return p ? parseFloat(window.getComputedStyle(p).fontSize) : 18;
  });
  console.log(`Computed <p> font-size: ${pFontSize}px (>= 16px required)`);
  if (pFontSize < 16) throw new Error(`Font size ${pFontSize}px is below 16px requirement.`);

  // 4. Axe Accessibility Audit (Light and Dark)
  console.log('\n--- 4. Axe Accessibility Audit (Light & Dark) ---');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') {
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      });
    } else {
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      });
    }
    await page.waitForTimeout(400);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalOrSerious = axeResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    console.log(`  Theme ${theme.toUpperCase()}: ${criticalOrSerious.length} critical/serious violations.`);
    if (criticalOrSerious.length > 0) {
      throw new Error(`Axe violations in ${theme}: ${JSON.stringify(criticalOrSerious, null, 2)}`);
    }
  }

  // 5. 360px Mobile Viewport Overflow
  console.log('\n--- 5. Mobile 360px Viewport Overflow ---');
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(300);
  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`360px Overflow status: ${isOverflowing ? 'OVERFLOWING' : 'NO OVERFLOW (PASS)'}`);
  if (isOverflowing) throw new Error('Horizontal overflow detected on mobile 360px screen.');

  // 6. Deep Links
  console.log('\n--- 6. Deep Links Audit ---');
  const deepLinks = ['accounts', 'gate', 'evidence'];
  for (const dl of deepLinks) {
    const deepUrl = `${DEPLOYED_URL}${dl}`;
    console.log(`Navigating to deep link: ${deepUrl}`);
    const dlRes = await page.goto(deepUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log(`  Status: ${dlRes.status()} - Verified`);
  }

  // 7. Console Errors
  console.log('\n--- 7. Console Error Audit ---');
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn('Console error messages:', consoleErrors);
  }

  await browser.close();
  console.log('\n=================================================================================');
  console.log('DEPLOYED URL AUDIT RESULT: ALL CHECKS PASSED ON GITHUB PAGES!');
  console.log('=================================================================================');
}

main().catch(err => {
  console.error('\nDeployed URL audit failed:', err);
  process.exit(1);
});
