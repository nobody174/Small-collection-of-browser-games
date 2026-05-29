# Delve — Project Reference

Built May–June 2026. One-month solo project: a browser-based dungeon idle/clicker game
built entirely in vanilla HTML, CSS and JavaScript.

**Live URLs:**
- GitHub Pages: https://nobody174.github.io/dungeon-idle/
- itch.io: https://nobody174.itch.io/delve
- Repository: https://github.com/nobody174/dungeon-idle

---

## What Was Built

A single-file browser game with no frameworks, no backend, no install required.
The entire game — HTML structure, CSS styling, and JavaScript logic — lives in one file: `index.html`.

**Core gameplay loop:**
Click Attack → deal damage → monster dies → earn gold → buy upgrades → descend floors → repeat

**Features:**
- 10 monster types scaling across infinite floors
- Boss every 5th floor with screen flash and loot drop
- 3 equipment slots (weapon / armour / ring) — Common, Rare, Legendary rarity
- Item comparison modal when loot drops
- 5 unlockable heroes with permanent level-up bonuses (Lyra, Gorak, Seraphine, Thornwick, Vex)
- Full prestige system — Ascend at floor 20+ to earn Soul Shards and permanent multipliers
- 45 achievements with toast notifications
- Floating damage numbers on click and from passive units
- Offline progress — earn gold while away, capped at 8 hours
- Web Audio API sound effects (procedurally generated, no audio files)
- Auto-save to localStorage every 30 seconds
- Mobile responsive layout
- Mute button

---

## File Structure

```
dungeon-idle/
├── index.html              ← The entire game (HTML + CSS + JS in one file)
├── package.json            ← Project metadata, version, npm scripts
├── playwright.config.js    ← Test runner configuration
├── CHANGELOG.md            ← Version history
├── .github/
│   └── workflows/
│       └── deploy.yml      ← CI/CD pipeline (auto-test + auto-deploy)
└── tests/
    └── game.test.js        ← Automated browser tests (Playwright)
```

---

## index.html — Architecture

Everything in one file, split into three sections:

### HTML (structure)
Key element IDs used throughout the game:

| ID | What it is |
|---|---|
| `#floor-label` | Current floor display |
| `#monster-emoji` | Monster icon |
| `#monster-name` | Monster name |
| `#hp-fill` | HP bar fill element |
| `#hp-text` | HP text (e.g. "HP: 40 / 40") |
| `#gold-amount` | Gold counter |
| `#stat-click` | Click damage stat |
| `#stat-dps` | Passive DPS stat |
| `.attack-btn` | The attack button (class, not ID) |
| `#atk-dmg` | Damage shown inside attack button |
| `#ach-count` | Achievement counter |
| `#mute-btn` | Mute toggle |
| `#tab-shop` | Shop panel |
| `#ascend-btn` | Prestige/Ascend button |
| `#shard-balance` | Soul Shard count |
| `#toast-container` | Where toast notifications appear |

### CSS (styling)
- Dark dungeon theme: `#0f0f1a` background, `#c9a84c` gold accents
- Two-column layout: game panel left, tabs panel right
- CSS keyframe animations for hit flash, damage numbers, kill message
- Responsive — stacks to single column on mobile

### JavaScript (logic)
Key variables (all in global scope):

```javascript
let gold = 0;
let clickDamage = 10;
let passiveDamage = 0;
let currentFloor = 1;
let monsterHP, monsterMaxHP, monsterDead;
let units = { squire: 0, rogue: 0, mage: 0 };
let equipped = { weapon: null, armor: null, ring: null };
let heroes = [];          // unlocked heroes
let achievements = [];    // 45 achievement objects
const SAVE_VERSION = 2;
```

Key functions:

| Function | What it does |
|---|---|
| `attack()` | Handles a player click — deals damage, triggers animations |
| `dealDamage(amount)` | Applies damage to monster, checks for death |
| `loadMonster()` | Loads next monster based on current floor |
| `rollLoot()` | RNG loot drop after boss kill |
| `showLootModal()` | Displays item comparison popup |
| `equipLoot()` | Equips chosen item, updates stats |
| `doAscend()` | Prestige — resets progress, awards Soul Shards |
| `saveGame()` | Serialises state to localStorage |
| `loadGame()` | Deserialises and restores state |
| `formatNum(n)` | Formats numbers: 1000 → 1K, 1000000 → 1M |
| `getTotalMult()` | Calculates total gold multiplier from shards + heroes |
| `applyGoldMult()` | Applies multiplier to earned gold |

**Passive DPS loop:**
```javascript
setInterval(() => {
  if (!monsterDead) dealDamage(passiveDamage);
}, 1000);
```

**Auto-save loop:**
```javascript
setInterval(saveGame, 30000);
```

**Offline progress:**
On load, calculates `Date.now() - lastSaveTime`, converts to gold earned while away (capped at 8 hours).

**CSS animation trick** — to replay an animation, remove the class, force a reflow, re-add:
```javascript
element.classList.remove('hit');
void element.offsetWidth;  // forces reflow
element.classList.add('hit');
```

---

## Game Design Decisions

**Single file** — chosen for simplicity and portability. No build step, no dependencies, open in any browser. Trade-off: file gets long (~1800 lines), harder to navigate as it grows.

**localStorage for saves** — built-in browser storage, no server needed. Save key: `dungeonSave`. SAVE_VERSION = 2 guards against loading incompatible old saves.

**Web Audio API for sound** — generates tones procedurally so no audio files are needed. Works in every browser without any assets.

**Emoji for graphics** — zero asset pipeline. Monsters, items and UI all use emoji. Fast to build, universally supported.

**Floor scaling** — every 5th floor is a boss. Monster HP and gold scale with floor number. Equipment stats scale too.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Game | Vanilla HTML, CSS, JavaScript |
| Sound | Web Audio API |
| Persistence | localStorage |
| Testing | Playwright |
| CI/CD | GitHub Actions |
| Hosting (free) | GitHub Pages |
| Distribution | itch.io |
| Version control | Git |

No frameworks. No build tools. No npm packages at runtime — only devDependencies for testing.

---

## Git & GitHub Setup

### First-time setup for a new project
```bash
cd YourProjectFolder
git init
git remote add origin https://USERNAME:TOKEN@github.com/USERNAME/REPO.git
git add .
git commit -m "Initial commit"
git branch -m master main
git pull origin main --allow-unrelated-histories
git push origin main
```

### Normal workflow (after changes)
```bash
git add .
git commit -m "fix: describe what changed"
git push origin main
```

### Personal Access Token (PAT)
Required for HTTPS authentication with GitHub.
- github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Scopes needed: `repo` + `workflow`
- Token goes in the remote URL: `https://USERNAME:TOKEN@github.com/...`
- If token changes: `git remote set-url origin https://USERNAME:NEW_TOKEN@github.com/USERNAME/REPO.git`

### Common git errors and fixes

**"fetch first" / rejected:**
Remote has commits local doesn't have. Fix:
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

**"src refspec main does not match":**
Local branch is called master, not main. Fix:
```bash
git branch -m master main
```

**"refusing to allow PAT to create workflow":**
Token missing `workflow` scope. Go to GitHub → edit token → tick `workflow`.

---

## CI/CD Pipeline

File: `.github/workflows/deploy.yml`

Triggers on every push to `main`. Runs two jobs in sequence:

### Job 1 — Test 🧪
1. Checkout code
2. Install Node.js 20
3. `npm ci` — install exact versions from package-lock.json
4. Install Playwright + Chromium browser
5. `npm test` — run all tests in `tests/game.test.js`
6. If any test fails → pipeline stops, deploy is blocked, GitHub emails you

### Job 2 — Deploy 🚀 (only runs if Job 1 passes)
1. Upload files to GitHub Pages artifact
2. Deploy to `nobody174.github.io/dungeon-idle`

**GitHub Pages source must be set to "GitHub Actions"** in repo Settings → Pages for this to work.

If tests pass → site is live within ~60 seconds of pushing.
If tests fail → old version stays live, you get a red notification on GitHub.

---

## Automated Tests

File: `tests/game.test.js` — 11 tests using Playwright

Each test: opens the game in a headless Chromium browser, clears localStorage for a fresh state, then checks something specific.

| Test | What it checks |
|---|---|
| Page title | `<title>` is "Delve" |
| Starts on Floor 1 | `#floor-label` contains "Floor 1" |
| Gold starts at 0 | `#gold-amount` is "0" |
| First monster is Slime | `#monster-name` contains "Slime" |
| HP bar visible | `#hp-text` visible and contains "HP:" |
| Achievements at 0 | `#ach-count` is "0" |
| Attack button visible | `.attack-btn` is visible |
| Shop tab visible | `#tab-shop` is visible |
| Mute button present | `#mute-btn` is visible |
| Attack reduces HP | HP text changes after clicking `.attack-btn` |
| Stat panel present | `#stat-click` and `#stat-dps` both visible |

**Run tests locally:**
```bash
npm test          # headless
npm run test:ui   # with visual UI
```

**Local test server:** Playwright starts `serve` on port 3000 automatically when running tests.

---

## Semantic Versioning

Version lives in `package.json` → `"version": "1.0.0"`

Format: `MAJOR.MINOR.PATCH`

| Commit prefix | Meaning | Version bump |
|---|---|---|
| `fix:` | Bug fix | 1.0.0 → 1.0.1 |
| `feat:` | New feature | 1.0.0 → 1.1.0 |
| `BREAKING CHANGE:` | Major rework | 1.0.0 → 2.0.0 |
| `chore:` | Maintenance, no gameplay change | no bump |
| `docs:` | Documentation only | no bump |

When releasing a new version: bump the number in `package.json`, add an entry to `CHANGELOG.md`, commit and push.

---

## itch.io Publishing

URL: https://nobody174.itch.io/delve

**Settings used:**
- Kind: HTML game
- File: `index.zip` (zip the contents of the folder, not the folder itself — `index.html` must be at the root of the zip)
- Tick: "This file will be played in the browser"
- Platforms: Windows, Mac, Linux, Android (runs in any browser)
- Embed: "Embed in page", width 860 × height 750
- Frame options: Mobile friendly ✓, Auto-start ✓, Fullscreen button ✓, Scrollbars ✓
- Price: Free, "Pay what you want" enabled with PayPal direct payments
- Genre: Strategy
- Tags: idle, incremental, clicker, dungeon, rpg, loot, fantasy, browser, singleplayer
- AI disclosure: Yes (built with Claude assistance)

**Note:** itch.io and GitHub Pages are independent. itch.io is not connected to the repo — to update itch.io you upload a new zip manually. GitHub Pages updates automatically on every push.

---

## Lessons Learned

**What worked well:**
- Single-file approach made the first month simple — no tooling to set up
- localStorage is reliable enough for a browser game save system
- Web Audio API is powerful and completely free to use
- GitHub Pages + itch.io gives you two free hosting options immediately
- CI/CD with Playwright catches regressions before they reach players

**What to do differently next time:**
- Name the file `index.html` from day one (avoid renaming hassle later)
- Set up git in the project folder from day one, not a parent folder
- Include `workflow` scope in the PAT from the start
- Write at least a few tests early so CI/CD can be set up sooner

**Git gotchas on Windows:**
- File names are case-insensitive on Windows but case-sensitive on GitHub (Linux). `Index.html` ≠ `index.html` on the server.
- Always work in the correct folder — running `git init` in a parent folder causes submodule problems
- Each `git add / commit / push` must be run as separate commands

---

## What's Next (Roadmap)

From `CHANGELOG.md` and planned features:

- [ ] Combat arena with player sprite, lunge and recoil animations
- [ ] Passive unit floating damage numbers (per unit type, in blue)
- [ ] Dodge mechanic — boss attacks back, player can sidestep
- [ ] More equipment items and set bonuses
- [ ] Cover image for itch.io page (630×500px screenshot)
- [ ] Post to r/incremental_games and Idle Game Makers Discord
- [ ] Update profile README (nobody174/nobody174) — age 44, mention Delve
