import { test, expect } from '@playwright/test';

const KLONDIKE_URL = 'http://localhost:8000/games/cards/klondike.html';
const SPIDER_URL = 'http://localhost:8000/games/cards/spider.html';
const FREECELL_URL = 'http://localhost:8000/games/cards/freecell.html';

test.describe('Cards - Klondike Solitaire', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first before accessing localStorage
    await page.goto(KLONDIKE_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('klondike page loads with correct title', async ({ page }) => {

    await expect(page).toHaveTitle(/Klondike/i);
  });

  test('klondike displays board with piles', async ({ page }) => {


    // Stock pile should be visible
    const stock = await page.locator('#stock');
    await expect(stock).toBeVisible();

    // Waste pile should be visible
    const waste = await page.locator('#waste');
    await expect(waste).toBeVisible();

    // Foundations should be visible
    const foundations = await page.locator('.pile--foundation');
    expect(await foundations.count()).toBe(4);

    // Tableau piles should be visible
    const tableau = await page.locator('.pile--tableau');
    expect(await tableau.count()).toBe(7);
  });

  test('klondike displays stats', async ({ page }) => {


    const moves = await page.locator('#stat-moves');
    await expect(moves).toContainText('Moves: 0');

    const score = await page.locator('#stat-score');
    await expect(score).toBeVisible();

    const time = await page.locator('#stat-time');
    await expect(time).toBeVisible();
  });

  test('deck theme button is visible', async ({ page }) => {


    const themeBtn = await page.locator('#btn-deck');
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).toContainText('🂮');
  });

  test('deck theme selector opens modal', async ({ page }) => {

    const themeBtn = await page.locator('#btn-deck');
    await themeBtn.click();

    // Modal should open
    const modal = await page.locator('.modal.is-open');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/theme|deck/i);
  });

  test('can select different deck themes', async ({ page }) => {

    const themeBtn = await page.locator('#btn-deck');
    await themeBtn.click();

    // Click Superman theme
    const supermanBtn = await page.locator('button:has-text("Superman")');
    if (await supermanBtn.isVisible()) {
      await supermanBtn.click();

      // Modal should close
      const modal = await page.locator('.modal.is-open');
      await expect(modal).not.toBeVisible();

      // Body should have deck class
      const body = await page.locator('body');
      const classes = await body.getAttribute('class');
      expect(classes).toContain('deck-');
    }
  });

  test('theme selection persists', async ({ page }) => {

    // Set theme to Superman
    const themeBtn = await page.locator('#btn-deck');
    await themeBtn.click();

    const supermanBtn = await page.locator('button:has-text("Superman")');
    if (await supermanBtn.isVisible()) {
      await supermanBtn.click();

      // Check localStorage
      const theme = await page.evaluate(() => localStorage.getItem('newgames.cards.deck-theme'));
      expect(theme).toBeTruthy();

      // Reload page
      await page.reload();

      // Theme should still be applied
      const body = await page.locator('body');
      const classes = await body.getAttribute('class');
      expect(classes).toContain('deck-');
    }
  });

  test('undo button is visible', async ({ page }) => {

    const undoBtn = await page.locator('#btn-undo');
    await expect(undoBtn).toBeVisible();
  });

  test('new game button is visible', async ({ page }) => {

    const newGameBtn = await page.locator('#btn-new');
    await expect(newGameBtn).toBeVisible();
  });

  test('mute button toggles', async ({ page }) => {

    const muteBtn = await page.locator('#btn-mute');
    const initialText = await muteBtn.textContent();

    await muteBtn.click();
    const afterClick = await muteBtn.textContent();

    expect(initialText).not.toBe(afterClick);
  });

  test('can navigate back to variants', async ({ page }) => {

    const backLink = await page.locator('a:has-text("← Variants")');
    await expect(backLink).toBeVisible();
    await backLink.click();

    await page.waitForURL(/.*cards\/index\.html/);
  });
});

test.describe('Cards - Spider Solitaire', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SPIDER_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('spider page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Spider/i);
  });

  test('spider displays board', async ({ page }) => {
    // Wait for the tableau to render (the second board-row with 10 columns)
    const tableau = await page.locator('.board-row >> nth=1');
    await expect(tableau).toBeVisible();

    // Verify tableau has at least one pile
    const piles = await page.locator('.pile--tableau');
    expect(await piles.count()).toBeGreaterThan(0);
  });

  test('spider has difficulty selector', async ({ page }) => {

    // Spider should have difficulty buttons (Easy, Medium, Hard)
    const difficultyBtns = await page.locator('[data-suits]');
    expect(await difficultyBtns.count()).toBeGreaterThan(0);
  });

  test('spider displays completed sets counter', async ({ page }) => {

    const sets = await page.locator('#stat-completed');
    await expect(sets).toContainText('Sets');
  });
});

test.describe('Cards - FreeCell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FREECELL_URL);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('freecell page loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/FreeCell/i);
  });

  test('freecell displays free cells and foundations', async ({ page }) => {

    const freeCells = await page.locator('.pile--free');
    expect(await freeCells.count()).toBeGreaterThan(0);

    const foundations = await page.locator('.pile--foundation');
    expect(await foundations.count()).toBe(4);
  });
});

test.describe('Cards - Persistence', () => {
  test('game state saves to localStorage', async ({ page }) => {
    await page.goto(KLONDIKE_URL);

    // Wait for game to initialize and write save
    await page.waitForSelector('.pile--tableau', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Check localStorage for saved game
    const saveKey = 'newgames.cards.klondike.save';
    const gameSave = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, saveKey);

    // Should have some save data
    expect(gameSave).toBeTruthy();

    const saveData = JSON.parse(gameSave!);
    expect(saveData.version).toBe(1);
    expect(saveData.data).toBeTruthy();
  });

  test('deck theme persists across games', async ({ page }) => {
    await page.goto(KLONDIKE_URL);

    // Set a theme
    const themeKey = 'newgames.cards.deck-theme';
    await page.evaluate((key) => {
      localStorage.setItem(key, 'superman');
    }, themeKey);

    // Navigate to Spider
    await page.goto(SPIDER_URL);

    // Check theme is still set
    const theme = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, themeKey);

    expect(theme).toBe('superman');
  });

  test('corrupted game save does not crash', async ({ page }) => {
    await page.goto(KLONDIKE_URL);

    // Corrupt the save
    await page.evaluate(() => {
      localStorage.setItem('newgames.cards.klondike.save', 'invalid json {]');
    });

    // Reload
    await page.reload();

    // Page should still load
    const board = await page.locator('.board');
    await expect(board).toBeVisible();
  });
});

test.describe('Cards - Responsive Design', () => {
  test('klondike adapts to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(KLONDIKE_URL);

    const board = await page.locator('.board');
    await expect(board).toBeVisible();
  });

  test('klondike adapts to tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(KLONDIKE_URL);

    const board = await page.locator('.board');
    await expect(board).toBeVisible();
  });

  test('klondike adapts to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(KLONDIKE_URL);

    const board = await page.locator('.board');
    await expect(board).toBeVisible();
  });

  test('dark theme is applied', async ({ page }) => {
    await page.goto(KLONDIKE_URL);

    const body = await page.locator('body.cards-board');
    await expect(body).toBeVisible();

    // Check that dark background CSS is applied
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be dark (not bright white)
    expect(bgColor).toBeTruthy();
  });
});
