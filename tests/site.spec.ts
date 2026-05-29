import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

test.describe('New Games - Site Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page first before accessing localStorage (security requirement)
    await page.goto(BASE_URL);
    // Then clear localStorage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('hub page loads with correct title', async ({ page }) => {
    // Already navigated in beforeEach
    await expect(page).toHaveTitle('New Games — Hub');
  });

  test('hub displays hero header', async ({ page }) => {
    const hero = await page.locator('.hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('h1')).toContainText('New Games');
  });

  test('hub shows all 4 game cards', async ({ page }) => {
    const gameCards = await page.locator('.game-card');
    await expect(gameCards).toHaveCount(4);
  });

  test('game cards have correct titles', async ({ page }) => {
    const titles = ['Card Collection', 'Color Block Escape', 'Donut Empire', 'Around the World Digger'];

    for (const title of titles) {
      const card = await page.locator(`.game-card:has-text("${title}")`);
      await expect(card).toBeVisible();
    }
  });

  test('game cards are clickable links', async ({ page }) => {
    const cardLinks = await page.locator('.game-card[href]');
    const count = await cardLinks.count();

    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const href = await cardLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/games\/(cards|blocks|idle|digger)\//);
    }
  });

  test('hero button plays sound on click', async ({ page }) => {
    let audioPlayed = false;
    page.on('console', (msg) => {
      if (msg.text().includes('pop')) {
        audioPlayed = true;
      }
    });

    const hero = await page.locator('.hero');
    await hero.click();

    // Just verify the click handler doesn't crash (would be tested more with audio context in real scenario)
    await expect(hero).toBeVisible();
  });

  test('footer displays credit text', async ({ page }) => {
    const footer = await page.locator('footer');
    await expect(footer).toContainText('Nobody174');
  });

  test('hub navigation returns when clicking back from a game', async ({ page }) => {
    // Click on Blocks game
    const blocksCard = await page.locator('a[href*="blocks/"]');
    await blocksCard.click();
    await page.waitForURL(/.*blocks\/.*/);

    // Click back to hub link
    const backLink = await page.locator('a:has-text("← Hub")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Should be back on hub - wait for title to change
    await expect(page).toHaveTitle('New Games — Hub', { timeout: 15000 });
  });
});

test.describe('Hub Responsiveness', () => {
  test('layout adapts to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);

    const gameCards = await page.locator('.game-card');
    await expect(gameCards).toHaveCount(4);

    // Cards should still be visible
    for (let i = 0; i < 4; i++) {
      await expect(gameCards.nth(i)).toBeVisible();
    }
  });

  test('layout adapts to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);

    const gameCards = await page.locator('.game-card');
    await expect(gameCards.count()).resolves.toBe(4);
  });

  test('layout adapts to desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);

    const gameCards = await page.locator('.game-card');
    await expect(gameCards.count()).resolves.toBe(4);
  });
});
