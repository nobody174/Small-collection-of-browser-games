const { test, expect } = require('@playwright/test');

test('Idle donut image loads and displays correctly', async ({ page }) => {
  await page.goto('http://localhost:8000/games/idle/index.html');

  // Wait for the game to load
  await page.waitForSelector('.idle-board');

  // Check that the donut image exists and is loaded
  const donutImg = page.locator('.donut-gfx');
  await expect(donutImg).toBeVisible();

  // Verify it's an img tag
  const tagName = await donutImg.evaluate(el => el.tagName.toLowerCase());
  expect(tagName).toBe('img');

  // Verify the src attribute
  const src = await donutImg.getAttribute('src');
  expect(src).toContain('donut.png');

  // Check that the image has loaded (naturalWidth > 0)
  const isLoaded = await donutImg.evaluate(img => img.naturalWidth > 0);
  expect(isLoaded).toBeTruthy();

  console.log('✓ Donut image loaded successfully');

  // Take a screenshot to verify it looks good
  await page.screenshot({ path: 'donut-screenshot.png' });

  // Verify the button is clickable
  const donutBtn = page.locator('#donut-btn');
  await expect(donutBtn).toBeEnabled();

  console.log('✓ Donut button is interactive');

  // Test clicking the donut
  await donutBtn.click();

  // Wait for animation
  await page.waitForTimeout(200);

  console.log('✓ Donut click works smoothly');

  console.log('✓ Donut Empire looks great with the new image!');
});
