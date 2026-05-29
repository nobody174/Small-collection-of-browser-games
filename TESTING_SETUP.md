# Testing Setup — New Games

Complete guide to the Playwright test suite and GitHub Actions CI/CD for New Games.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

Playwright is already in `devDependencies`. This installs `@playwright/test@^1.60.0` and TypeScript support.

### 2. Run Tests Locally
```bash
npm test
```

This starts an HTTP server on port 8000 and runs all tests on Chromium, Firefox, WebKit, and mobile emulators.

### 3. View Results
```bash
npm run test:report
```

Opens the HTML report showing all test results, screenshots of failures, and execution traces.

---

## What's Tested

### ✅ Hub Page (`tests/site.spec.ts`)
- Title and header load correctly
- All 4 game cards display
- Links navigate to correct game pages
- Responsive layout (mobile, tablet, desktop)
- Navigation back from games returns to hub

### ✅ Blocks Game (`tests/blocks.spec.ts`)
- Board renders with correct structure
- Moves counter increments
- Hint button pulses exit doors
- 100+ levels available via level picker
- Block selection and dragging
- Distance-based movement (1/2 cells vs full slide)
- Game progress saves and restores
- Corrupted saves don't crash

### ✅ Cards Game (`tests/cards.spec.ts`)
- **Klondike, Spider, FreeCell** all load correctly
- Stock, waste, foundations, tableau display
- Move counter and stats work
- **Deck theme selector** (8 superhero themes)
- Theme persists across sessions and game variants
- Undo, new game, mute buttons function
- Dark background applied
- Game saves and restores state
- Responsive on all screen sizes

### ✅ Idle Game (`tests/idle.spec.ts`)
- Coin counter starts at 0 and increments on donut click
- Generators display in shop
- State saves to localStorage
- Offline earnings message appears after 30+ min
- Corrupted saves reset to fresh state
- Responsive layout

### ✅ Digger Game (`tests/digger.spec.ts`)
- Viewport loads with world and tiles
- Player sprite visible and movable
- Multiple tile types (sky, surface, dirt, stone, elevator, etc.)
- Mineral visuals render (CSS gradients, not emoji)
- Adjacent tile hints display
- Swipe/drag movement works on mobile
- Multiple countries maintain separate worlds
- Game state saves and restores
- Responsive on mobile, tablet, desktop

---

## File Structure

```
new-games/
├── tests/
│   ├── site.spec.ts           ← Hub page tests
│   ├── blocks.spec.ts         ← Blocks game tests
│   ├── cards.spec.ts          ← Cards games tests (Klondike, Spider, FreeCell)
│   ├── idle.spec.ts           ← Idle clicker tests
│   ├── digger.spec.ts         ← Digger game tests
│   └── README.md              ← Detailed test documentation
│
├── .github/
│   └── workflows/
│       └── playwright.yml      ← GitHub Actions CI/CD workflow
│
├── playwright.config.ts        ← Playwright configuration
├── package.json               ← Test scripts added
└── TESTING_SETUP.md          ← This file
```

---

## Test Configuration

### `playwright.config.ts`

Configures:
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Emulation**: Pixel 5 (Android), iPhone 12 (iOS)
- **Base URL**: `http://localhost:8000`
- **Screenshot**: Only on failure (saves disk space)
- **Trace Recording**: On first retry (for debugging)
- **Reports**: HTML, JSON, JUnit XML

### `package.json` Scripts

```json
{
  "scripts": {
    "test": "playwright test",                    // Run all tests
    "test:debug": "playwright test --debug",      // Step-by-step debugging
    "test:headed": "playwright test --headed",    // Show browser window
    "test:ui": "playwright test --ui",            // Interactive UI runner
    "test:report": "playwright show-report"       // View HTML report
  }
}
```

---

## GitHub Actions Workflow

### `.github/workflows/playwright.yml`

**Triggers:**
- Every push to `main`, `master`, or `develop`
- Every pull request to those branches
- Manual workflow dispatch (via GitHub UI)
- Only runs if relevant files changed:
  - `games/**` (game code)
  - `shared/**` (shared framework)
  - `tests/**` (test files)
  - `index.html` (hub page)
  - `package.json` (dependencies)

**What it does:**
1. Checks out code
2. Sets up Node.js (matrix: 18.x, 20.x)
3. Installs dependencies (`npm ci`)
4. Installs Playwright browsers
5. Starts HTTP server on port 8000
6. Runs all Playwright tests
7. Uploads test reports as artifacts (30-day retention)
8. Posts results comment on pull requests

**Artifacts:**
- `playwright-report-node-18.x/` — HTML report for Node 18
- `playwright-report-node-20.x/` — HTML report for Node 20

Access artifacts in GitHub UI: **Actions** → **Playwright Tests** → **Run** → **Artifacts**

---

## localStorage & Persistence Testing

Every test clears localStorage before running:

```javascript
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
});
```

This ensures:
- Tests don't interfere with each other
- Each test starts with a clean state
- Persistence is tested by explicitly setting/reading localStorage

### Keys Tested

```
newgames.blocks.save               → Level progress
newgames.cards.klondike.save       → Klondike state
newgames.cards.spider.save         → Spider state
newgames.cards.freecell.save       → FreeCell state
newgames.cards.deck-theme          → Deck selection
newgames.idle.save                 → Coins, generators, upgrades
newgames.digger.save               → Worlds, player position, gold
```

---

## Running Tests Locally

### Standard: Run all tests
```bash
npm test
```
Runs tests on all browsers and mobile emulators, with retries disabled (faster).

### Headed: See the browser
```bash
npm run test:headed
```
Opens browser windows so you watch tests run. Great for debugging.

### Debug: Step through with inspector
```bash
npm run test:debug
```
Opens Playwright Inspector — step through test line by line, inspect DOM, etc.

### UI Mode: Interactive dashboard
```bash
npm run test:ui
```
Web-based test runner. Pick tests, watch them run, inspect failures interactively.

### Single file
```bash
npx playwright test tests/blocks.spec.ts
```

### Single test by name
```bash
npx playwright test -g "hint button pulses doors"
```

### Specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

### View report after run
```bash
npm run test:report
```

---

## Test Philosophy

### Real State, Real Rendering
Tests use **actual localStorage**, **real DOM**, and **real CSS** — not mocks. This ensures tests verify the actual user experience, not happy-path abstractions.

### Isolation via beforeEach
Every test clears state before running, so:
- Tests run independently
- No shared state leaks
- Each test starts fresh
- Order doesn't matter

### Exact Selectors
All tests use the actual DOM IDs and classes from your HTML:
- `#donut-btn` — Idle's clickable button
- `#bb-board` — Blocks game board
- `.bb-door` — Exit doors
- `[data-mineral]` — Mineral visuals

If you rename an element in HTML, the test will fail, alerting you to update the selector. This is intentional — tests should break when the UI changes.

### No Mocking Game Logic
Tests don't mock game state or engine logic. They click buttons, read results, and verify localStorage. This tests the full stack.

---

## Debugging Failed Tests

### 1. View HTML Report
```bash
npm run test:report
```
Shows screenshots of each failure, full execution traces, and console logs.

### 2. Run Headed
```bash
npm run test:headed
```
Watch the test run in a real browser so you see what's happening.

### 3. Use Inspector
```bash
npm run test:debug
```
Step through code, inspect DOM, set breakpoints.

### 4. Run Single Test
```bash
npx playwright test -g "exact test name"
```
Isolate and repeat the failing test.

### 5. Increase Timeout
If tests time out waiting for elements:
```javascript
await page.locator('#element').click({ timeout: 10000 }); // 10 seconds
```

---

## Maintenance

### Adding New Tests

1. Create new file in `tests/` with `.spec.ts` extension
2. Import `{ test, expect }` from `@playwright/test`
3. Add `beforeEach` hook to clear localStorage
4. Use exact selectors from your HTML
5. Run `npm test` to verify

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('feature works', async ({ page }) => {
    await page.goto('http://localhost:8000/games/myGame');
    const btn = await page.locator('#my-button');
    await expect(btn).toBeVisible();
    await btn.click();
    // Assert the result
  });
});
```

### Updating Selectors

If you rename a game element:
1. Update the HTML
2. Tests will fail (good — they caught it!)
3. Update the selector in the test file
4. Run `npm test` to verify fix

Example: renamed `#donut-btn` to `#bake-button`
```typescript
// Before
const btn = await page.locator('#donut-btn');

// After
const btn = await page.locator('#bake-button');
```

### New Games

When adding a new game:
1. Create `tests/newgame.spec.ts`
2. Copy structure from similar game (blocks/cards/idle/digger)
3. Update selectors to match your HTML IDs
4. Add to `.github/workflows/playwright.yml` path filter (optional)

---

## CI/CD Integration

Tests run automatically on GitHub:

### On Push to main/master/develop
✅ Runs tests on Node 18.x and 20.x
✅ Uploads reports as artifacts
✅ Fails the CI if any test fails

### On Pull Request
✅ Same as push
✅ Posts comment with test results
✅ Blocks merge if tests fail

### Manual Run
GitHub UI → Actions → Playwright Tests → Run workflow → Branch → Run

---

## Troubleshooting

### Server Won't Start
```bash
# Kill any existing server on port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or just use a different port
npx playwright test --webServerPort=8001
```

### Tests Timeout on Slow Machine
Edit `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 30000,  // Increase from default 10s
},
```

### Need Different Base URL
Edit `playwright.config.ts`:
```typescript
use: {
  baseURL: 'http://192.168.1.5:3000',  // Your actual server
},
```

### Tests Pass Locally But Fail in CI
Usually due to timing issues. Add `page.waitForLoadState('networkidle')`:
```typescript
await page.goto('/');
await page.waitForLoadState('networkidle');
```

---

## Next Steps

1. **Run tests**: `npm test`
2. **View report**: `npm run test:report`
3. **Add new tests** as you add features
4. **CI automatically** runs tests on each PR
5. **Artifacts** preserve test evidence for debugging

Tests are now live and protecting your codebase! 🚀
