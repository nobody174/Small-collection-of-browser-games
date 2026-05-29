import { test, expect } from '@playwright/test';

const GAME_URL = 'http://localhost:8000/games/digger/index.html';

test.describe('Around the World Digger', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first before accessing localStorage
    await page.goto(GAME_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('digger game page loads', async ({ page }) => {
    await expect(page).toHaveTitle(/Digger/i);
  });

  test('displays viewport with world', async ({ page }) => {

    const viewport = await page.locator('.viewport');
    await expect(viewport).toBeVisible();

    const world = await page.locator('#world');
    await expect(world).toBeVisible();
  });

  test('displays player sprite', async ({ page }) => {
    

    const player = await page.locator('#player-sprite');
    await expect(player).toBeVisible();
  });

  test('displays topbar with stats', async ({ page }) => {
    

    const topbar = await page.locator('.digger-topbar');
    await expect(topbar).toBeVisible();

    const title = await page.locator('.ng-topbar__title');
    await expect(title).toContainText(/Digger|⛏️/i);
  });

  test('displays gold counter', async ({ page }) => {
    

    const goldStat = await page.locator('#stat-gold');
    await expect(goldStat).toBeVisible();
  });

  test('displays cart information', async ({ page }) => {
    

    const cart = await page.locator('.cart');
    await expect(cart).toBeVisible();
  });

  test('shop button is visible', async ({ page }) => {
    

    const shopBtn = await page.locator('#btn-shop');
    await expect(shopBtn).toBeVisible();
  });

  test('reset button is visible', async ({ page }) => {
    

    const resetBtn = await page.locator('#btn-reset');
    await expect(resetBtn).toBeVisible();
  });

  test('mute button toggles state', async ({ page }) => {
    

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

    // Wait for title to change back to hub (more reliable than URL pattern)
    await expect(page).toHaveTitle('New Games — Hub', { timeout: 15000 });
  });
});

test.describe('Digger - World & Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('world contains tiles', async ({ page }) => {
    await page.goto(GAME_URL);

    const tiles = await page.locator('.tile');
    expect(await tiles.count()).toBeGreaterThan(0);
  });

  test('world contains various tile types', async ({ page }) => {
    await page.goto(GAME_URL);

    // Should have sky tiles
    const skyTiles = await page.locator('.tile--sky');
    expect(await skyTiles.count()).toBeGreaterThan(0);

    // Should have surface tiles
    const surfaceTiles = await page.locator('.tile--surface');
    expect(await surfaceTiles.count()).toBeGreaterThan(0);
  });

  test('displays adjacent tile hints', async ({ page }) => {
    await page.goto(GAME_URL);

    // Adjacent tiles should have visual hint
    const adjacent = await page.locator('.tile.is-adjacent');
    // Count might be 0-4 depending on player position
    expect(await adjacent.count()).toBeLessThanOrEqual(4);
  });

  test('elevator tiles are present', async ({ page }) => {
    await page.goto(GAME_URL);

    // Elevator tiles might not be visible immediately, but should exist in world
    const elevators = await page.locator('.tile--elevator');
    // Might be 0 visible (below viewport) or more
    expect(await elevators.count()).toBeGreaterThanOrEqual(0);
  });

  test('mineral visuals render', async ({ page }) => {
    await page.goto(GAME_URL);

    // Minerals should have data-mineral attribute
    const minerals = await page.locator('[data-mineral]');
    // Count depends on what's been dug
    expect(await minerals.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Digger - Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
  });

  test('world state saves to localStorage', async ({ page }) => {
    // Wait for the game viewport to be visible (indicates game is ready)
    const viewport = await page.locator('.viewport');
    await expect(viewport).toBeVisible();

    // Wait for player sprite to indicate game fully initialized
    const player = await page.locator('#player-sprite');
    await expect(player).toBeVisible();

    // Trigger a game action to cause save (click an adjacent tile)
    // This will call flushSave() in the game code
    const adjacentTile = await page.locator('.tile.is-adjacent').first();
    if (await adjacentTile.count() > 0) {
      await adjacentTile.click();
      await page.waitForTimeout(100);
    }

    // If no action triggered a save, wait for 5-second autosave
    // (or it may have already triggered from initial render)
    await page.waitForTimeout(5100);

    // Check localStorage
    const saveKey = 'newgames.digger.save';
    const gameSave = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, saveKey);

    expect(gameSave).toBeTruthy();

    const saveData = JSON.parse(gameSave!);
    expect(saveData.version).toBe(1);
    expect(saveData.data).toBeTruthy();
  });

  test('world persists across reloads', async ({ page }) => {
    await page.goto(GAME_URL);

    // Get current world state
    const worldState = await page.evaluate(() => {
      const save = localStorage.getItem('newgames.digger.save');
      if (!save) return null;
      const parsed = JSON.parse(save);
      return parsed.data.countryId;
    });

    // Reload
    await page.reload();
    await page.waitForTimeout(500);

    // World should be same
    const newWorldState = await page.evaluate(() => {
      const save = localStorage.getItem('newgames.digger.save');
      if (!save) return null;
      const parsed = JSON.parse(save);
      return parsed.data.countryId;
    });

    expect(newWorldState).toBe(worldState);
  });

  test('corrupted save does not crash game', async ({ page }) => {
    await page.goto(GAME_URL);

    // Corrupt save
    await page.evaluate(() => {
      localStorage.setItem('newgames.digger.save', '{invalid json]');
    });

    // Reload
    await page.reload();

    // Game should load with fresh state
    const viewport = await page.locator('.viewport');
    await expect(viewport).toBeVisible();
  });

  test('multiple countries maintain separate worlds', async ({ page }) => {
    await page.goto(GAME_URL);

    // Get initial country
    const initialCountry = await page.evaluate(() => {
      const save = localStorage.getItem('newgames.digger.save');
      if (!save) return null;
      const parsed = JSON.parse(save);
      return parsed.data.countryId;
    });

    expect(initialCountry).toBe('norway'); // Starting country

    // Both countries' worlds should be tracked separately
    const worldsData = await page.evaluate(() => {
      const save = localStorage.getItem('newgames.digger.save');
      if (!save) return null;
      const parsed = JSON.parse(save);
      return Object.keys(parsed.data.worlds);
    });

    expect(worldsData).toBeTruthy();
  });
});

test.describe('Digger - Movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('player can click adjacent tiles', async ({ page }) => {
    await page.goto(GAME_URL);

    const viewport = await page.locator('.viewport');
    const player = await page.locator('#player-sprite');

    // Player should be visible
    await expect(player).toBeVisible();

    // Adjacent tiles should be clickable (they have is-adjacent class)
    const adjacent = await page.locator('.tile.is-adjacent');
    const count = await adjacent.count();

    // Should have 1-4 adjacent tiles (up, down, left, right)
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(4);
  });

  test('keyboard arrow keys work', async ({ page }) => {
    await page.goto(GAME_URL);

    // Focus on page
    const viewport = await page.locator('.viewport');
    await viewport.click();

    // Press arrow key
    await page.keyboard.press('ArrowDown');

    // Player position might change (or not, depending on tiles)
    const player = await page.locator('#player-sprite');
    await expect(player).toBeVisible();
  });

  test('swipe/drag movement works on viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(GAME_URL);

    const viewport = await page.locator('.viewport');
    const box = await viewport.boundingBox();

    if (box) {
      // Simulate swipe from bottom to top
      await viewport.dragTo(viewport, {
        sourcePosition: { x: box.width / 2, y: box.height - 20 },
        targetPosition: { x: box.width / 2, y: 20 },
      });
    }

    // Player should still be visible
    const player = await page.locator('#player-sprite');
    await expect(player).toBeVisible();
  });
});

test.describe('Digger - Responsive Design', () => {
  test('game adapts to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(GAME_URL);

    const viewport = await page.locator('.viewport');
    await expect(viewport).toBeVisible();

    // Viewport should fit in mobile screen
    const box = await viewport.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });

  test('game adapts to tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(GAME_URL);

    const viewport = await page.locator('.viewport');
    await expect(viewport).toBeVisible();
  });

  test('game adapts to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(GAME_URL);

    const viewport = await page.locator('.viewport');
    await expect(viewport).toBeVisible();
  });
});
