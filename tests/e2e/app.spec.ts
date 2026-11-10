import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Agent Allowance Application E2E & Usability Suite', () => {
  test('zero-wallet browsing across all primary views', async ({ page }) => {
    // 1. Landing Page
    await page.goto('');
    await expect(page.locator('h1')).toContainText('A spending account for an AI agent');
    await expect(page.locator('text=Preview').first()).toBeVisible();
    await expect(page.locator('text=Credits are demo credits, not money').first()).toBeVisible();

    // 2. Accounts List Page
    await page.goto('accounts');
    await expect(page.locator('h1')).toContainText('Spending Accounts');
    await expect(page.locator('text=Direct Account ID Lookup').first()).toBeVisible();

    // 3. Create Account Page
    await page.goto('accounts/new');
    await expect(page.locator('h1')).toContainText('Create Spending Account');
    await expect(page.locator('text=Contract Enforcement Guarantee').first()).toBeVisible();

    // 4. SpendGate Page
    await page.goto('gate');
    await expect(page.locator('h1')).toContainText('SpendGate Merchant Portal');
    await expect(page.locator('text=Verify Spend ID').first()).toBeVisible();

    // 5. Credits Page
    await page.goto('credits');
    await expect(page.locator('h1')).toContainText('Demo Credits Faucet');
    await expect(page.locator('text=One-Time Demo Claim').first()).toBeVisible();

    // 6. Evidence Page
    await page.goto('evidence');
    await expect(page.locator('h1')).toContainText('On-Chain Evidence & Verification');
    await expect(page.locator('text=13 Canonical On-Chain Spend Requests').first()).toBeVisible();
    await expect(page.locator('text=Robustness Evidence: 60 Raw On-Chain Consensus Transactions').first()).toBeVisible();

    // 7. Limits Page
    await page.goto('limits');
    await expect(page.locator('h1')).toContainText('Technical & Security Limitations');
    await expect(page.locator('text=On-Chain Numerical Limits').first()).toBeVisible();

    // 8. 404 Page
    await page.goto('non-existent-route-for-testing');
    await expect(page.locator('h1')).toContainText('Page Not Found');
  });

  test('responsive mobile 360px viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    const routes = ['', 'accounts', 'accounts/new', 'gate', 'credits', 'evidence', 'limits'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(isOverflowing, `Route ${route} has horizontal overflow on 360px screen`).toBe(false);
    }
  });

  test('typography adheres to readable minimum base font size (>= 16px/18px)', async ({ page }) => {
    await page.goto('');
    const pFontSize = await page.evaluate(() => {
      const p = document.querySelector('p');
      if (!p) return 18;
      return parseFloat(window.getComputedStyle(p).fontSize);
    });
    expect(pFontSize).toBeGreaterThanOrEqual(16);
  });

  test('accessibility audit has zero critical or serious WCAG violations', async ({ page }) => {
    const auditPages = ['', 'accounts', 'credits', 'evidence', 'limits'];

    for (const p of auditPages) {
      await page.goto(p);
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const criticalOrSerious = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        criticalOrSerious.length,
        `Page ${p} has accessibility violations: ${JSON.stringify(criticalOrSerious, null, 2)}`
      ).toBe(0);
    }
  });
});
