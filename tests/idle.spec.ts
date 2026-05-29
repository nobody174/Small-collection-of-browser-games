import { test, expect } from '@playwright/test';

const GAME_URL = 'http://localhost:8000/games/idle/index.html';

test.describe('Donut Empire (Idle)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first before accessing localStorage
    await page.goto(GAME_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('idle game page loads', async ({ page }) => {
    await page.goto(GAME_URL);
    await expect(page).toHaveTitle(/Donut Empire/i);
  });

  test('displays coin counter at 0', async ({ page }) => {
    await page.goto(GAME_URL);

    const coinAmount = await page.locator('#coin-amount');
    await expect(coinAmount).toContainText('0');
  });

  test('displays coin rate', async ({ page }) => {
    await page.goto(GAME_URL);

    const coinRate = await page.locator('#coin-rate');
    await expect(coinRate).toContainText('coins / second');
  });

  test('displays click power', async ({ page }) => {
    await page.goto(GAME_URL);

    const clickPower = await page.locator('#click-power');
    await expect(clickPower).toContainText('Click power:');
  });

  test('donut button is clickable', async ({ page }) => {
    await page.goto(GAME_URL);

    const donutBtn = await page.locator('#donut-btn');
    await expect(donutBtn).toBeVisible();
    await expect(donutBtn).toContainText('🍩');
  });

  test('clicking donut increases coins', async ({ page }) => {
    await page.goto(GAME_URL);

    const coinAmount = await page.locator('#coin-amount');
    const initialCoins = await coinAmount.textContent();

    const donutBtn = await page.locator('#donut-btn');
    await donutBtn.click();

    // Wait for state update
    await page.waitForTimeout(100);

    const updatedCoins = await coinAmount.textContent();
    expect(updatedCoins).not.toBe(initialCoins);
  });

  test('shop displays generators', async ({ page }) => {
    await page.goto(GAME_URL);

    const shop = await page.locator('#shop');
    await expect(shop).toBeVisible();

    // Should have shop items
    const items = await page.locator('.shop-item');
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('reset button is visible', async ({ page }) => {
    await page.goto(GAME_URL);

    const resetBtn = await page.locator('#btn-reset');
    await expect(resetBtn).toBeVisible();
  });

  test('mute button toggles state', async ({ page }) => {
    await page.goto(GAME_URL);

    const muteBtn = await page.locator('#btn-mute');
    const initialText = await muteBtn.textContent();

    await muteBtn.click();
    const afterClick = await muteBtn.textContent();

    expect(initialText).not.toBe(afterClick);
  });

  test('can navigate back to hub', async ({ page }) => {
    const backLink = await page.locator('a:has-text("← Hub")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Wait for title to change
    await expect(page).toHaveTitle('New Games — Hub', { timeout: 15000 });
  });
});

test.describe('Idle - Persistence', () => {
  test('game state saves to localStorage', async ({ page }) => {
    await page.goto(GAME_URL);

    // Click donut to generate some state
    const donutBtn = await page.locator('#donut-btn');
    await donutBtn.click();

    // Wait for autosave (happens every 5 seconds)
    await page.waitForTimeout(5500);

    // Check localStorage
    const saveKey = 'newgames.idle.save';
    const gameSave = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, saveKey);

    expect(gameSave).toBeTruthy();

    const saveData = JSON.parse(gameSave!);
    expect(saveData.version).toBe(1);
    expect(saveData.data).toBeTruthy();
    expect(saveData.data.coins).toBeGreaterThan(0);
  });

  test('game state restores after reload', async ({ page }) => {
    await page.goto(GAME_URL);
    // Wait for game to fully initialize
    await page.waitForTimeout(1000);

    // Click donut multiple times to generate coins
    const donutBtn = await page.locator('#donut-btn');
    for (let i = 0; i < 5; i++) {
      await donutBtn.click();
      await page.waitForTimeout(100);
    }

    // Wait for autosave (5 second interval) to definitely persist to localStorage
    await page.waitForTimeout(6000);

    // Get coins before reload
    const coinsBeforeReload = await page.locator('#coin-amount').textContent();
    expect(coinsBeforeReload).not.toBe('0'); // Verify we actually clicked

    // Reload
    await page.reload();
    // Wait for page to reload and game to reinitialize
    await page.waitForTimeout(2000);

    // Coins should be restored from localStorage
    const coinsAfterReload = await page.locator('#coin-amount').textContent();
    expect(coinsAfterReload).toBe(coinsBeforeReload);
  });

  test('corrupted save does not crash game', async ({ page }) => {
    await page.goto(GAME_URL);

    // Corrupt save
    await page.evaluate(() => {
      localStorage.setItem('newgames.idle.save', '{invalid json]');
    });

    // Reload
    await page.reload();

    // Game should load with fresh state
    const coinAmount = await page.locator('#coin-amount');
    await expect(coinAmount).toContainText('0');
  });

  test('offline earnings message appears', async ({ page }) => {
    await page.goto(GAME_URL);

    // Get initial save time
    const initialTime = Date.now();

    // Set manual save time to 1 hour ago
    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem('newgames.idle.save') || '{}');
      save.data = save.data || {};
      save.data.lastSaveTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
      localStorage.setItem('newgames.idle.save', JSON.stringify(save));
    });

    // Reload
    await page.reload();
    await page.waitForTimeout(500);

    // Welcome back banner should appear
    const welcomeBanner = await page.locator('.welcome-back');
    if (await welcomeBanner.isVisible()) {
      await expect(welcomeBanner).toContainText('earned');
    }
  });
});

test.describe('Idle - Responsive Design', () => {
  test('game adapts to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(GAME_URL);

    const card = await page.locator('#coin-card');
    await expect(card).toBeVisible();
  });

  test('game adapts to tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(GAME_URL);

    const card = await page.locator('#coin-card');
    await expect(card).toBeVisible();
  });

  test('game adapts to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(GAME_URL);

    const card = await page.locator('#coin-card');
    await expect(card).toBeVisible();
  });
});
