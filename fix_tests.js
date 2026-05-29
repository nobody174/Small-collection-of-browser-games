const fs = require('fs');
const path = require('path');

// Fix all test files
const testFiles = [
  'tests/site.spec.ts',
  'tests/cards.spec.ts',
  'tests/idle.spec.ts',
  'tests/digger.spec.ts'
];

testFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix beforeEach hook - add navigation before localStorage access
  content = content.replace(
    /test\.beforeEach\s*\(\s*async\s*\(\s*\{\s*page\s*\}\s*\)\s*=>\s*\{\s*\/\/ Clear localStorage/,
    `test.beforeEach(async ({ page }) => {
    // Navigate first before accessing localStorage
    await page.goto(${file.includes('site') ? 'BASE_URL' : 'GAME_URL'});
    // Clear localStorage`
  );
  
  // Alternative pattern if navigate is missing
  content = content.replace(
    /test\.beforeEach\s*\(\s*async\s*\(\s*\{\s*page\s*\}\s*\)\s*=>\s*\{\s*await page\.context\(\)\.clearCookies\(\);/,
    `test.beforeEach(async ({ page }) => {
    // Navigate first before accessing localStorage
    await page.goto(${file.includes('site') ? 'BASE_URL' : 'GAME_URL'});
    await page.context().clearCookies();`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});
