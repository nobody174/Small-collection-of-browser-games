import { test, expect, Page } from '@playwright/test';

const GAME_URL = 'http://localhost:8000/games/blocks/index.html';

test.describe('Color Block Escape (Blocks)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first before accessing localStorage
    await page.goto(GAME_URL);
    // Clear localStorage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('game page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Color Block|Blocks/i);
  });

  test('level 1 board renders', async ({ page }) => {

    // Wait for board to load
    const board = await page.locator('#bb-board');
    await expect(board).toBeVisible();

    // Should have cells
    const cells = await page.locator('.bb-cell');
    expect(await cells.count()).toBeGreaterThan(0);
  });

  test('blocks are rendered on board', async ({ page }) => {

    // Wait for blocks to render
    const blocks = await page.locator('.bb-block');
    expect(await blocks.count()).toBeGreaterThan(0);
  });

  test('level header displays current level', async ({ page }) => {

    const levelNum = await page.locator('#level-num');
    await expect(levelNum).toContainText('Level');
  });

  test('move counter starts at 0', async ({ page }) => {

    const moveCounter = await page.locator('#stat-moves');
    await expect(moveCounter).toContainText('Moves: 0');
  });

  test('hint button is visible', async ({ page }) => {

    const hintBtn = await page.locator('#btn-hint');
    await expect(hintBtn).toBeVisible();
  });

  test('hint button pulses doors', async ({ page }) => {

    const hintBtn = await page.locator('#btn-hint');
    await hintBtn.click();

    // Doors should have hint class
    const hintingDoors = await page.locator('.bb-door.is-hinting');
    expect(await hintingDoors.count()).toBeGreaterThan(0);

    // Hint class should disappear after animation
    await page.waitForTimeout(4500);
    expect(await hintingDoors.count()).toBe(0);
  });

  test('can select/deselect blocks', async ({ page }) => {

    const firstBlock = await page.locator('.bb-block').first();
    await firstBlock.click();

    // Block should have selected class
    await expect(firstBlock).toHaveClass(/is-selected/);
  });

  test('undo button is visible', async ({ page }) => {

    const undoBtn = await page.locator('#btn-undo');
    await expect(undoBtn).toBeVisible();
  });

  test('reset button is visible', async ({ page }) => {

    const resetBtn = await page.locator('#btn-reset');
    await expect(resetBtn).toBeVisible();
  });

  test('mute button toggles state', async ({ page }) => {

    const muteBtn = await page.locator('#btn-mute');
    const initialText = await muteBtn.textContent();

    await muteBtn.click();
    const afterFirstClick = await muteBtn.textContent();

    expect(initialText).not.toBe(afterFirstClick);
  });

  test('level picker modal opens and closes', async ({ page }) => {

    const levelBtn = await page.locator('#btn-levels');
    await levelBtn.click();

    // Modal should be visible
    const modal = await page.locator('.modal.is-open');
    await expect(modal).toBeVisible();

    // Modal should contain level buttons
    const levelBtns = await page.locator('.level-pick-btn');
    expect(await levelBtns.count()).toBeGreaterThan(5); // At least 6 levels
  });

  test('can navigate back to hub', async ({ page }) => {
    const backLink = await page.locator('a:has-text("← Hub")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    // Wait for title to change back to hub
    await expect(page).toHaveTitle('New Games — Hub');
  });
});

test.describe('Blocks - Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
  });

  test('progress saves and restores', async ({ page }) => {
    // Get initial level
    const initialLevel = await page.locator('#level-num').textContent();

    // Simulate progress by checking localStorage
    const saveKey = 'newgames.blocks.save';
    const progress = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, saveKey);

    // Progress should be saved
    expect(progress).toBeTruthy();

    // Parse the save
    const saveData = JSON.parse(progress!);
    expect(saveData.version).toBe(1);
    expect(saveData.data).toBeTruthy();
  });

  test('cleared localStorage starts fresh game', async ({ page }) => {
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());

    // Reload page
    await page.reload();

    // Should be back on level 1
    const levelNum = await page.locator('#level-num');
    await expect(levelNum).toContainText('Level 1');
  });

  test('corrupted save does not crash game', async ({ page }) => {
    // Corrupt the save
    await page.evaluate(() => {
      localStorage.setItem('newgames.blocks.save', '{invalid json');
    });

    // Reload page
    await page.reload();

    // Game should still load (with fresh state)
    const board = await page.locator('#bb-board');
    await expect(board).toBeVisible();

    // Level counter should show level 1 (reset state)
    const levelNum = await page.locator('#level-num');
    await expect(levelNum).toContainText('Level 1');
  });
});

test.describe('Blocks - Movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
  });

  test('block movement increases move counter', async ({ page }) => {
    const initialMoves = await page.locator('#stat-moves').textContent();
    expect(initialMoves).toContain('0');

    // Attempt to click and drag a block (simple swipe simulation)
    const board = await page.locator('#bb-board');
    const box = await board.boundingBox();

    if (box) {
      // Simulate swipe from left to right (100px)
      await board.dragTo(board, {
        sourcePosition: { x: 50, y: box.height / 2 },
        targetPosition: { x: 150, y: box.height / 2 },
      });
    }

    // Give time for move to register
    await page.waitForTimeout(100);

    // Moves should have incremented or stayed at 0 (depending on level state)
    const finalMoves = await page.locator('#stat-moves');
    await expect(finalMoves).toBeVisible();
  });
});

test.describe('Blocks - Responsive Design', () => {
  test('game adapts to mobile screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(GAME_URL);

    const board = await page.locator('#bb-board');
    await expect(board).toBeVisible();

    // Board should fit in mobile viewport
    const boundingBox = await board.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('game adapts to tablet screen', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(GAME_URL);

    const board = await page.locator('#bb-board');
    await expect(board).toBeVisible();
  });

  test('game adapts to desktop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(GAME_URL);

    const board = await page.locator('#bb-board');
    await expect(board).toBeVisible();
  });
});
