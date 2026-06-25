const { test, expect } = require('@playwright/test');

test('Digger cosmetics avatar display shows equipped items', async ({ page }) => {
  // Inject save with an equipped hat
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
      ownedCosmetics: { 'hat-viking': true },
      equippedCosmetics: {
        hat: 'hat-viking',
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

  // Verify avatar display exists
  const avatar = await page.locator('.cosmetics-avatar');
  expect(await avatar.isVisible()).toBeTruthy();
  console.log('✓ Cosmetics avatar display visible');

  // Verify head image loaded
  const headImg = await page.locator('.cosmetics-avatar__head');
  expect(await headImg.isVisible()).toBeTruthy();

  const src = await headImg.getAttribute('src');
  expect(src).toContain('head.png');
  console.log('✓ Head image loaded');

  // Verify equipped cosmetics are shown in the label
  const label = await page.locator('.cosmetics-avatar__label');
  const labelText = await label.textContent();
  expect(labelText).toContain('Viking Helm');
  console.log(`✓ Avatar shows equipped items: "${labelText}"`);

  // Take screenshot
  await page.screenshot({ path: 'digger-avatar.png' });
  console.log('✓ Avatar display working perfectly!');
});
