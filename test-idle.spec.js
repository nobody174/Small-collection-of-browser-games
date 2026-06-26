import { test, expect } from '@playwright/test';

test.describe('Donut Empire - Phase 1-4 Implementation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/games/idle/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('Phase 1: Word-Card Engine - Page loads', async ({ page }) => {
    const donutBtn = page.locator('#donut-btn');
    await expect(donutBtn).toBeVisible();
  });

  test('Phase 1: Click increases coins', async ({ page }) => {
    const coinAmount = page.locator('#coin-amount');
    const beforeText = await coinAmount.textContent();
    
    await page.click('#donut-btn');
    await page.waitForTimeout(100);
    
    const afterText = await coinAmount.textContent();
    expect(afterText).not.toBe(beforeText);
  });

  test('Phase 2: Shop has tabs', async ({ page }) => {
    const tabs = page.locator('.shop__tabs .btn');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('Phase 2: Bakers tab renders generators', async ({ page }) => {
    const firstTab = page.locator('.shop__tabs .btn').first();
    await firstTab.click();
    await page.waitForTimeout(100);
    
    const items = page.locator('.shop-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Phase 3: Evolve button exists', async ({ page }) => {
    const evolveBtn = page.locator('#btn-evolve');
    await expect(evolveBtn).toBeVisible();
  });

  test('Phase 3: Collection button exists', async ({ page }) => {
    const collectionBtn = page.locator('#btn-collection');
    await expect(collectionBtn).toBeVisible();
  });

  test('Phase 4: Radio ticker element exists', async ({ page }) => {
    const ticker = page.locator('#bakery-radio-ticker');
    await expect(ticker).toBeVisible();
  });

  test('State object is accessible', async ({ page }) => {
    const stateExists = await page.evaluate(() => {
      return typeof state !== 'undefined' && state.coins !== undefined;
    });
    expect(stateExists).toBe(true);
  });

  test('Word-Card animation CSS is loaded', async ({ page }) => {
    const hasAnimation = await page.evaluate(() => {
      const styleSheets = document.styleSheets;
      for (let sheet of styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (let rule of rules) {
            if (rule.name === 'word-card-pop') return true;
          }
        } catch (e) {}
      }
      return false;
    });
    expect(hasAnimation).toBe(true);
  });

  test('No console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    // Perform some interactions
    await page.click('#donut-btn');
    await page.waitForTimeout(200);
    
    expect(errors).toHaveLength(0);
  });

  test('Digger game loads without text errors', async ({ page }) => {
    await page.goto('http://localhost:8000/games/digger/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check badges are readable (should have dark text)
    const badge = page.locator('.digger-stats .badge').first();
    const color = await badge.evaluate(el => 
      window.getComputedStyle(el).color
    );
    // Should not be white (rgb(255, 255, 255))
    expect(color).not.toBe('rgb(255, 255, 255)');
  });
});
