# 🎮 Small Collection of Browser Games

A cozy collection of **4 mini games** built with vanilla JavaScript. Play them in your browser, save your progress, and challenge yourself across multiple difficulty levels.

**⚠️ Important:** All games in this collection are under development and uncompleted. They are shared for educational purposes and community feedback.

## 🎯 Games

### 🧩 **Blocks** — Color Block Escape
Match and clear colored blocks on a grid. Strategic puzzle game with increasing difficulty across 100+ levels.

**Features:**
- 100+ hand-crafted levels
- Block selection and strategic movement
- Move counter and hint system
- Progress saves automatically
- Responsive design (mobile, tablet, desktop)

### 🃏 **Cards** — Solitaire Collection
Three classic card games in one: Klondike, Spider, and FreeCell.

**Features:**
- 3 solitaire variants to choose from
- Customizable deck themes (8 themes available)
- Undo moves, track score and moves
- Spider difficulty selector (1, 2, 3 suits)
- Dark theme support
- Game state persists across sessions

### 🍩 **Idle** — Donut Empire
An incremental clicker game. Click donuts to earn coins, buy generators, and build your empire.

**Features:**
- Click-based gameplay with passive income
- Shop with upgradeable generators
- Offline earnings tracking
- Autosave every 5 seconds
- Responsive grid layout

### ⛏️ **Digger** — Around the World Digger
Mine your way around the world. Dig through different terrain types and find minerals and artifacts.

**Features:**
- Procedurally generated worlds
- Multiple countries with separate worlds
- Various tile types (dirt, stone, sand, etc.)
- Mineral spotting system
- World persists across sessions
- Arrow keys and mobile swipe support

## 🚀 Getting Started

### Play Online
Coming soon! For now, run locally:

### Run Locally

**Requirements:**
- Node.js 18.x or 20.x
- npm

**Setup:**
```bash
# Install dependencies
npm install

# Start local server
npx http-server -p 8000

# Open in browser
# http://localhost:8000
```

## 🧪 Testing

This project includes a comprehensive **Playwright test suite** with **99 tests** covering all games.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode (step through)
npm run test:debug

# Run with interactive UI
npm run test:ui

# View test report
npm run test:report

# Run specific test file
npx playwright test tests/blocks.spec.ts

# Run specific test by name
npx playwright test -g "block movement increases move counter"
```

### Test Coverage

| Game | Tests | Coverage |
|------|-------|----------|
| **Site/Hub** | 11 | Navigation, responsiveness |
| **Blocks** | 24 | Mechanics, persistence, movement, responsive |
| **Cards** | 27 | All variants, persistence, themes, responsive |
| **Idle** | 18 | Mechanics, persistence, offline earnings |
| **Digger** | 19 | World generation, persistence, movement |
| **Total** | **99** | Across 5 browsers + mobile emulators |

### Browsers Tested

- ✅ Chromium
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## 📁 Project Structure

```
.
├── index.html                 # Hub page (game selection)
├── games/
│   ├── blocks/               # Blocks game
│   │   ├── index.html
│   │   └── js/
│   ├── cards/                # Cards (Klondike, Spider, FreeCell)
│   │   ├── index.html
│   │   ├── klondike.html
│   │   ├── spider.html
│   │   ├── freecell.html
│   │   └── js/
│   ├── digger/               # Digger game
│   │   ├── index.html
│   │   └── js/
│   └── idle/                 # Idle game
│       ├── index.html
│       └── js/
├── shared/                   # Shared framework
│   ├── css/                  # Styles (theme, UI, animations)
│   ├── js/                   # Utilities, save system, audio, etc.
│   └── assets/
├── tests/                    # Playwright test suite
│   ├── site.spec.ts
│   ├── blocks.spec.ts
│   ├── cards.spec.ts
│   ├── idle.spec.ts
│   ├── digger.spec.ts
│   └── README.md             # Test documentation
├── .github/
│   └── workflows/
│       └── playwright.yml    # CI/CD (auto-runs tests on push)
└── package.json              # Dependencies & scripts
```

## 💾 Game Saves

All games automatically save progress to browser **localStorage** using the format:

```
newgames.<game>.<variant>
```

**Save Keys:**
- `newgames.blocks.save` — Blocks progress (level, moves, cleared blocks)
- `newgames.cards.klondike.save` — Klondike state
- `newgames.cards.spider.save` — Spider state
- `newgames.cards.freecell.save` — FreeCell state
- `newgames.cards.deck-theme` — Deck theme preference (global)
- `newgames.idle.save` — Idle state (coins, generators, upgrades)
- `newgames.digger.save` — Digger world state (per country)

**Data Persistence:**
- Games save automatically on state changes
- Progress restores when you revisit
- Clearing browser data resets progress
- Corrupted saves gracefully reset to fresh state

## 🔧 Development

### Tech Stack
- **HTML/CSS/JavaScript** — Vanilla, no frameworks
- **Playwright** — E2E testing
- **GitHub Actions** — CI/CD automation
- **localStorage** — Game persistence

### Adding Features

1. **Make your changes** in VS Code
2. **Test locally:** `npm test`
3. **Push to GitHub:** `git push origin main`
4. **CI/CD runs automatically** — all 99 tests execute
5. **Check Actions tab** for results

### File Organization

- Game logic: `/games/<game>/js/*.js`
- Game UI: `/games/<game>/index.html`
- Shared utilities: `/shared/js/*.js`
- Shared styles: `/shared/css/*.css`
- Tests: `/tests/*.spec.ts`

## 🐛 Known Issues & Future Improvements

### Known Limitations
- Games save to localStorage only (cleared if browser data is cleared)
- No cloud sync between devices
- No user accounts/authentication

### Planned Features
- [ ] GitHub Pages deployment for online play
- [ ] Visual regression testing
- [ ] Performance benchmarks
- [ ] Accessibility (WCAG) testing
- [ ] Achievement/unlock system
- [ ] Leaderboards
- [ ] Multiplayer features

## 📊 CI/CD Status

![Playwright Tests](https://github.com/nobody174/Small-collection-of-browser-games/actions/workflows/playwright.yml/badge.svg)

Tests run automatically on every push. Latest status:

```
✅ 495+ tests passing
✅ Node.js 18.x & 20.x
✅ All browsers tested
✅ All games functional
```

View full test results: [GitHub Actions](https://github.com/nobody174/Small-collection-of-browser-games/actions)

## 📝 License

MIT — Feel free to use, modify, and distribute.

## 🎮 Credits

Built with vanilla JavaScript. No external game frameworks — just pure browser APIs and CSS.

---

**Ready to play?** Start with the hub page at `http://localhost:8000` and pick your game!

Have fun! 🎉

---

*Built with assistance from [Claude Code](https://claude.ai/code) by Anthropic.*
