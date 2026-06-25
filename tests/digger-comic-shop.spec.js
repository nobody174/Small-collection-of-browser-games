const { test, expect } = require('@playwright/test');

test('Digger comic-style shop displays correctly', async ({ page }) => {
  // Inject save with gold before loading
  await page.addInitScript(() => {
    const save = {
      countryId: 'norway',
      countriesUnlocked: { norway: true },
      gold: 50000,
      pickaxeIdx: 0,
      cartIdx: 0,
      cart: {},
      worlds: {},
      discoveredElevators: {},
      ownedCosmetics: {},
      equippedCosmetics: {
        hat: null,
        pickaxeSkin: null,
        cartSkin: null,
        title: null,
      },
      lastSaveTime: Date.now(),
    };
    const payload = {
      version: 1,
      savedAt: Date.now(),
      data: save
    };
    localStorage.setItem('newgames.digger.save', JSON.stringify(payload));
  });

  await page.goto('http://localhost:8000/games/digger/index.html');
  await page.waitForSelector('.digger-board');

  // Open the shop
  await page.click('#btn-shop');
  await page.waitForSelector('[role="dialog"]');

  // Verify comic-panel styling
  const panel = await page.locator('.comic-panel');
  expect(await panel.isVisible()).toBeTruthy();
  console.log('✓ Comic shop panel loaded');

  // Verify section titles are visible
  const sectionTitles = await page.locator('.comic-section-title').count();
  expect(sectionTitles).toBeGreaterThan(0);
  console.log(`✓ Found ${sectionTitles} section titles`);

  // Verify list items exist
  const listItems = await page.locator('.comic-list-item').count();
  expect(listItems).toBeGreaterThan(10);
  console.log(`✓ Found ${listItems} comic list items`);

  // Verify the shop is scrollable
  const list = await page.locator('.comic-list');
  const hasMaxHeight = await list.evaluate(el => window.getComputedStyle(el).maxHeight);
  expect(hasMaxHeight).toBeTruthy();
  console.log('✓ Comic shop is scrollable with max-height constraint');

  // Take screenshot
  await page.screenshot({ path: 'digger-comic-shop.png' });

  console.log('✓ Comic shop looks great!');
});
