<!-- Testing CI/CD -->
# Playwright Test Suite — New Games

[![Playwright Tests](https://github.com/nobody174/Small-collection-of-browser-games/actions/workflows/playwright.yml/badge.svg)](https://github.com/nobody174/Small-collection-of-browser-games/actions)

Comprehensive test suite for the New Games studio website and all 4 games (Cards, Blocks, Idle, Digger). **99 tests, 100% passing ✅**

## Test Structure

```
tests/
├── site.spec.ts          # Hub page & navigation smoke tests
├── blocks.spec.ts        # Color Block Escape game tests
├── cards.spec.ts         # Cards (Klondike/Spider/FreeCell) tests
├── idle.spec.ts          # Donut Empire idle clicker tests
├── digger.spec.ts        # Around the World Digger tests
└── README.md             # This file
```

## Test Coverage

### Site Smoke Tests (`site.spec.ts`)
- Hub page loads with correct title
- All 4 game cards display with correct titles
- Game cards are clickable links to correct URLs
- Footer displays credit text
- Navigation back from games returns to hub
- Responsive layout (mobile, tablet, desktop)

### Blocks Game (`blocks.spec.ts`)
**Mechanics Tests:**
- Level 1 board renders with cells and blocks
- Level header displays current level
- Move counter starts at 0
- Hint button pulses doors and plays sound
- Block selection/deselection works
- Undo/Reset buttons visible and functional
- Level picker modal opens with 100+ levels
- Navigation back to hub works

**Persistence Tests:**
- Game progress saves to localStorage (`newgames.blocks.save`)
- Cleared localStorage starts fresh game
- Corrupted save doesn't crash game

**Movement Tests:**
- Block movement increases move counter
- Distance-based swipe movement (1 cell / 2 cells / all the way)

**Responsive Tests:**
- Works on mobile (375px), tablet (768px), desktop (1920px)

### Cards Game (`cards.spec.ts`)
**Klondike Tests:**
- Page loads with correct title
- Board displays stock, waste, foundations, tableau
- Stats display (moves, score, time)
- Deck theme button (🂮) visible
- Theme selector opens modal with 8 themes
- Theme selection persists to localStorage
- Undo, new game, mute buttons work
- Can navigate back to variants page

**Spider & FreeCell Tests:**
- Pages load with correct titles
- Boards display correctly
- Spider difficulty selector visible
- FreeCell shows free cells and foundations

**Persistence Tests:**
- Game state saves to localStorage (`newgames.cards.klondike.save`, etc.)
- Deck theme saves globally (`newgames.cards.deck-theme`)
- Deck theme persists across game variants
- Corrupted save doesn't crash

**Responsive Tests:**
- Works on mobile, tablet, desktop
- Dark theme is applied (CSS verified)

### Idle Game (`idle.spec.ts`)
**Mechanics Tests:**
- Page loads with correct title
- Coin counter displays at 0
- Click power displays
- Donut button (🍩) is clickable
- Clicking donut increases coins
- Shop displays generators
- Reset, mute buttons work
- Navigation back to hub works

**Persistence Tests:**
- Game state saves to localStorage (`newgames.idle.save`)
- Game state restores after reload
- Corrupted save resets to fresh state
- Offline earnings message appears after 30+ min away

**Responsive Tests:**
- Works on mobile, tablet, desktop

### Digger Game (`digger.spec.ts`)
**Mechanics Tests:**
- Page loads with correct title
- Viewport displays with world and tiles
- Player sprite visible
- Topbar with stats displays
- Gold counter, cart info visible
- Shop and reset buttons work
- Multiple tile types (sky, surface, dirt, stone, etc.)
- Adjacent tile hints display
- Elevator tiles present (if visible)
- Mineral visuals render correctly

**Persistence Tests:**
- World state saves to localStorage (`newgames.digger.save`)
- World persists across reloads
- Corrupted save resets to fresh state
- Multiple countries maintain separate worlds

**Movement Tests:**
- Player can click adjacent tiles
- Keyboard arrow keys work
- Swipe/drag movement works on mobile

**Responsive Tests:**
- Works on mobile, tablet, desktop

## Running Tests

### Prerequisites
```bash
npm install
```

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode (step through)
```bash
npm run test:debug
```

### Run with UI (interactive test runner)
```bash
npm run test:ui
```

### View test report
```bash
npm run test:report
```

### Run specific test file
```bash
npx playwright test tests/blocks.spec.ts
```

### Run specific test
```bash
npx playwright test -g "block movement increases move counter"
```

### Run on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5 (Android), iPhone 12 (iOS)
- **Base URL**: `http://localhost:8000`
- **Retries**: 0 locally, 2 in CI
- **Workers**: Default locally, 1 in CI
- **Screenshots**: Only on failure
- **Traces**: On first retry
- **Reports**: HTML, JSON, JUnit XML

## Important Test Details

### localStorage Isolation
Every test has a `beforeEach` hook that:
```javascript
await page.context().clearCookies();
await page.evaluate(() => localStorage.clear());
```

This ensures each test starts with a clean slate and doesn't interfere with other tests.

### Exact Selectors Used

**Hub**:
- `.hero` — Hero header
- `.game-card` — Individual game cards
- `#footer` — Footer
- `a[href*="cards/"]` — Cards game link

**Blocks**:
- `#bb-board` — Game board
- `.bb-cell` — Empty cells
- `.bb-block` — Blocks
- `#stat-moves` — Move counter
- `#btn-hint`, `#btn-undo`, `#btn-reset` — Buttons
- `#level-num` — Level display
- `.bb-door` — Exit doors

**Cards**:
- `#stock`, `#waste` — Pile slots
- `.pile--foundation` — Foundation piles
- `.pile--tableau` — Tableau piles
- `#stat-moves`, `#stat-score` — Stats
- `#btn-deck` — Deck theme button
- `.modal.is-open` — Modal dialogs
- `body.deck-*` — Theme class on body

**Idle**:
- `#coin-amount` — Coin counter
- `#coin-rate` — Income rate
- `#donut-btn` — Clickable button
- `#shop` — Shop container
- `#shop-items` — Shop items list

**Digger**:
- `.viewport` — Game viewport
- `#world` — World grid
- `#player-sprite` — Player character
- `.tile` — Grid tiles
- `.tile--*` — Tile types (sky, surface, dirt, etc.)
- `[data-mineral]` — Mineral indicators

## localStorage Keys

All saves use the format: `newgames.<game>.<thing>`

```
newgames.blocks.save          — Blocks game progress (level, moves, cleared)
newgames.cards.klondike.save  — Klondike game state
newgames.cards.spider.save    — Spider game state
newgames.cards.freecell.save  — FreeCell game state
newgames.cards.deck-theme     — Selected deck theme (persistent across variants)
newgames.idle.save            — Idle game state (coins, generators, upgrades)
newgames.digger.save          — Digger game state (worlds, player, gold)
```

## Persistence Testing

Each game's persistence tests verify:
1. **Save on state change**: Modifying game state saves to localStorage
2. **Restore on reload**: Page reload restores saved state exactly
3. **Corrupt save handling**: Invalid JSON doesn't crash, resets to fresh state
4. **Version mismatch**: Old save versions are handled gracefully

## Responsive Testing

Tests verify games work on:
- **Mobile**: 375×667 (iPhone SE)
- **Tablet**: 768×1024 (iPad)
- **Desktop**: 1920×1080 (Full HD)

## GitHub Actions Integration

Tests run automatically on:
- Push to main/master/develop
- Pull requests to main/master/develop
- Manual workflow dispatch

See `.github/workflows/playwright.yml` for CI configuration.

Tests run on 2 Node versions (18.x, 20.x) to verify compatibility.

## Debugging Failed Tests

1. **View HTML report**:
   ```bash
   npm run test:report
   ```

2. **Debug interactively**:
   ```bash
   npm run test:debug
   ```

3. **Run headed (see browser)**:
   ```bash
   npm run test:headed
   ```

4. **Check screenshots** in `test-results/` folder (only on failure)

5. **Check trace files** (Playwright inspector) for failed tests

## Test Data & Mocking

Tests use **real game state** where possible:
- Actual save/load mechanisms
- Real localStorage (cleared between tests)
- Actual DOM and CSS (not mocked)
- Real browser rendering (Chromium, Firefox, WebKit)

This ensures tests verify the actual user experience, not just happy paths.

## Future Improvements

- [ ] Add visual regression tests (screenshot comparison)
- [ ] Add performance benchmarks (load time, frame rate)
- [ ] Add accessibility tests (WCAG compliance)
- [ ] Add E2E achievement unlock tests
- [ ] Add level completion flow tests
- [ ] Stress test localStorage limits
- [ ] Test offline mode thoroughly
