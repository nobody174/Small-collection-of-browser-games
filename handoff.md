# New Games — Handoff Document

*Last updated: 2026-05-29*

This document captures everything built in the project so far, the key
decisions behind it, and what's still open. If you (or a future Claude
session) come back to this project after a break, **read this first**.

---

## 1. What was built

A small **studio of 4 casual browser games** sharing one identity and one
reusable mini-framework. Vanilla HTML / CSS / JavaScript, no frameworks,
no build step. Open `index.html` and everything works.

```
New games/
├── ARCHITECTURE.md           ← the contract (also start of session #2)
├── handoff.md                ← (this file)
├── index.html                ← HUB — pick a game, all 4 are playable
│
├── shared/                   ← the studio's mini engine
│   ├── css/
│   │   ├── theme.css         ← design tokens (colors, fonts, spacing)
│   │   ├── ui.css            ← buttons, panels, modals, toasts
│   │   └── animations.css    ← reusable @keyframes
│   ├── js/
│   │   ├── utils.js          ← NG.$, formatNumber, randomInt, shuffle…
│   │   ├── save.js           ← namespaced localStorage with autosave
│   │   ├── audio.js          ← Web Audio procedural sounds + mute
│   │   ├── particles.js      ← burst, floatText, confetti
│   │   └── ui.js             ← NG.toast(), NG.modal.open/.confirm()
│   └── test.html             ← framework smoke-test page
│
└── games/
    ├── cards/                ← Game 1 — Card Collection
    │   ├── index.html        (variant picker)
    │   ├── klondike.html     (Klondike Solitaire — fully playable)
    │   ├── spider.html       (Spider — 1/2/4-suit)
    │   ├── freecell.html     (FreeCell — SuperMove implemented)
    │   ├── style.css         (shared by all 3 variants)
    │   └── js/
    │       ├── card-engine.js (shared Card/Pile/drag system)
    │       ├── klondike.js
    │       ├── spider.js
    │       └── freecell.js
    │
    ├── blocks/               ← Game 2 — Color Block Escape
    │   ├── index.html
    │   ├── style.css
    │   └── js/
    │       ├── levels.js     (8 hand-designed levels)
    │       └── blocks.js
    │
    ├── idle/                 ← Game 3 — Donut Empire (idle clicker)
    │   ├── index.html
    │   ├── style.css
    │   └── js/idle.js
    │
    └── digger/               ← Game 4 — Around the World Digger
        ├── index.html
        ├── style.css
        └── js/
            ├── countries.js  (Norway, Mexico, Japan + minerals + pickaxes)
            └── digger.js
```

Every game pulls its visual identity from `shared/css/theme.css` and
attaches helpers under one global namespace, **`window.NG`**. Each game
namespaces its localStorage save under `newgames.<game>.save` so they
never clash.

---

## 2. Key decisions made

### Architectural

| Decision | Why |
|---|---|
| Multiple files, not single-file like Delve | 4 games × ~1500 lines would be unreadable. Modular files force separation. |
| Single global `NG` namespace | Avoids polluting `window`; everything reusable lives under one prefix. |
| CSS variables for all design tokens | Re-skinning a game is one variable swap; future dark mode trivial. |
| Plain HTML/CSS/JS, no build step | Beginner-friendly; Jørgen can open the file and it just works. |
| `shared/` folder for the studio's identity | One color/font/sound change ripples to every game. |
| Per-game subfolder | Each game is independently shippable. |
| Save format namespaced as `newgames.<game>.<thing>` | One localStorage wipe per game; never conflicts. |

### Visual / design language

- Soft, colorful, casual-mobile aesthetic (no dark/gritty).
- Each game owns ONE accent color via `--ng-game-accent`:
  Cards = mint, Blocks = pink, Idle = amber, Digger = warm gold.
- Rounded corners, soft shadows, juicy hover / press feedback.
- All animations respect `prefers-reduced-motion`.
- Mobile-first sizing — every game reflows at 600px / 480px.

### Delivery style (user preference)

- Small steps, one focused piece per turn.
- User signals "looks good" or "keep going" between checkpoints.
- When user says "go on" with no other detail = batch the next logical
  group of files, ship, then summarize.

---

## 3. Per-game decisions

### Game 1 — Cards (Klondike / Spider / FreeCell)

- **Shared `card-engine.js`** with a generic `Pile` class that takes
  per-variant `canPickup` / `canAccept` rule callbacks. Adding a new
  solitaire variant later = mostly writing the rules file.
- **Drag/drop** uses unified pointer events (mouse + touch) and
  `document.elementsFromPoint` for hit testing.
- **Engine `beforeMove` + `onMove` callbacks** so each variant can
  snapshot undo state BEFORE the cards actually move.
- **Vector cards** drawn in CSS (corner rank+suit + big center pip),
  purple-striped backs — no image assets.
- **Klondike** turn-1, classic scoring, auto-flip exposed face-downs,
  tap-to-send-to-foundation.
- **Spider** uses a `dealIdx` save format so duplicate-suit decks
  serialize/restore correctly. 1/2/4-suit difficulty selector with
  confirm-before-restart.
- **FreeCell** implements the SuperMove rule:
  `max group = (emptyFreeCells + 1) × 2 ^ emptyOtherTableauColumns`.

### Game 2 — Color Block Escape

- **Slide-to-wall** movement (each swipe moves until obstacle/exit),
  more puzzle-feel than one-cell-per-move.
- **Doors stick out** of the perimeter so the goal is obvious at a glance.
- **Swipe + keyboard** input (click to select, arrow keys to nudge).
- **8 hand-designed levels** in `levels.js` — adding more is data only.
- **Progress saved** automatically: current level, best move-count per
  cleared level. Levels unlock as you clear them.
- `touch-action: none` on the board prevents browser pull-to-refresh
  from interfering with swipes on mobile.

### Game 3 — Donut Empire (idle)

- Themed as donuts to feel distinct from Delve's dungeon clicker.
- **8 generators × 5 click upgrades**, standard 1.15× cost scaling.
- **Generators reveal progressively** as `totalEarned` crosses each
  `unlockAt` threshold — shop doesn't overwhelm a new player.
- **Offline income** capped at 8 hours (Delve precedent), shown in a
  "Welcome back" banner.
- **Autosave every 5s + on `beforeunload`**.
- Tick loop uses `requestAnimationFrame` for smooth UI updates.

### Game 4 — Around the World Digger

- **Side-view tile grid** (8 cols × 112 rows), viewport scrolls down.
- **Per-country world preserved** — when you travel back to Norway,
  your previous tunnel is still there.
- **Country themes** are 100% CSS variables on `body.country-<id>`,
  so adding a new country = one CSS block + one data entry.
- **Mineral drops** by depth band with weighted random distribution.
- **Click-adjacent OR arrow keys** for movement; modal blocks keyboard
  so shop doesn't move the player accidentally.
- **Walking onto the 🏠 tile = shop opens + cart auto-sells**.
- World generation is deterministic per generated world (random
  minerals per tile, baked into the save).

---

## 4. Bugs found & fixed mid-build

| Bug | Where | Fix |
|---|---|---|
| Card face-flip animation made cards jump to pile origin | Klondike — `setFaceUp(true, true)` triggered `ng-pop` which animates `transform: scale(...)`, clobbering the fan-down `translate(...)` position | Added a new `card-flip-pulse` keyframe in cards/style.css that animates **only `box-shadow`** — never `transform`. |
| Undo did not actually undo card moves | `pushHistory()` ran inside `onMove` callback (which fires AFTER the move), so snapshot captured post-move state | Added a `beforeMove` callback to the card engine; klondike/spider/freecell snapshot history there. |
| Drag hit-testing could mis-identify the source pile | Old version unioned each pile's rect with its top card's rect; when the top card was being dragged that union was huge | Replaced with `document.elementsFromPoint` walking the stack and skipping `.is-dragging` elements. |
| Digger player would jump to (0,0) during dig animation | Same pattern as the card flip — `.player.is-digging` animated `translate` on the outer element which also has the position transform | Moved the bounce animation onto `::before` so it animates the inner box independently. (Fixed proactively before user reported.) |

**Recurring lesson worth remembering:** any keyframe that animates
`transform` on an element that ALSO has a positional transform will
override the position. Either animate a child element / pseudo-element,
or animate something else (`box-shadow`, `filter`, `opacity`).

---

## 5. What remains to do

### High-value polish (per game)

- **Cards**
  - Hint system (highlight a legal move on demand)
  - Stats screen (games won, best times, streaks)
  - Optional themes (dark mode, classical card backs)
  - Win-cascade animation (cards bouncing off the foundations)
- **Blocks**
  - More levels — the data format makes this easy
  - Slow / fast slide settings
  - Maybe a "next level unlocked" toast/animation
  - Optional: cell-by-cell movement mode for harder puzzles
- **Idle**
  - Achievement system (45-style milestones like Delve had)
  - Prestige / rebirth (project spec asked for it)
  - Specific-generator multipliers (e.g. "x2 Bakers" upgrade)
  - Sound for tick / generator (currently only click)
- **Digger**
  - More countries (Egypt 🇪🇬, Brazil 🇧🇷, etc.)
  - Tool variety beyond pickaxes — dynamite, drills, mining machines
  - Achievements (first diamond, depth milestones)
  - Visible water / lava hazards at depth
  - Maybe day/night cycle on the surface

### Studio-level

- **Per-game README** explaining how to add content (levels, generators,
  countries)
- **Settings page** in the hub (master mute, wipe-all, theme picker)
- **Achievement framework** in `shared/js/` reusable by all games
- **CI/CD + Playwright tests** like Delve had — the architecture is
  ready for it but tests aren't written
- **`package.json`** + version bumping convention (Delve playbook)
- **GitHub Pages deploy** workflow
- **itch.io publishing** — the project as a whole could ship as one zip

### Known rough edges (left intentionally per user)

- Touch swipe threshold in Blocks may need tuning on different devices
- Cards: dragging a pile of many cards animates one-by-one on drop;
  could feel snappier with a fly-together animation
- Digger: the world is generated once and baked into the save; new
  features that change generation won't apply retroactively (would
  need a save migration)

---

## 6. Naming / convention reference

- **Folders & files**: lowercase, hyphens (`color-blocks` ✗ → `blocks`)
- **CSS variables**: `--ng-<category>-<name>` (`--ng-color-primary`,
  `--ng-game-accent`)
- **JS namespace**: everything shared lives under `window.NG`
- **Save keys**: `newgames.<game>.save` (Spider = `newgames.cards.spider.save`)
- **CSS classes**: BEM-ish kebab (`btn--primary`, `modal__title`)
- **Game-specific accent**: each game overrides `--ng-game-accent` at
  `:root { … }` in its own style.css

---

## 7. How to continue working

When you come back to this project:

1. **Read this file first.**
2. **Then read `ARCHITECTURE.md`** for the contract.
3. **Open `index.html`** in a browser, click every game, confirm they
   still work after any environment changes (browser updates, etc.).
4. **Open `shared/test.html`** to confirm the framework itself works.
5. **For new work**, decide the scope:
   - Cosmetic / polish → likely just a CSS tweak
   - Feature in one game → only that game's files
   - Cross-game system (achievements, settings) → add to `shared/`
6. **Keep the studio identity consistent** — pull colors/spacing from
   `theme.css`, sounds from `audio.js`, modals from `ui.js`. Don't
   reinvent a button.

---

## 8. Tech stack reminder

| Layer | Tech |
|---|---|
| Games | Vanilla HTML / CSS / JavaScript |
| Sound | Web Audio API (procedural, no audio files) |
| Persistence | `localStorage` (namespaced wrapper in `shared/js/save.js`) |
| Visuals | Emoji + CSS — zero asset pipeline |
| Browser support | Modern evergreen (Chrome, Edge, Firefox, Safari) |
| Frameworks | **None** at runtime |

---

## 9. Studio "feel" rules (don't drift)

- Colorful, soft, casual-mobile vibe
- Rounded corners, soft shadows, juicy click feedback
- Snappy short animations (~120–300ms, bouncy easing)
- Readable text, plenty of whitespace
- No dark/gritty visuals, no tiny text, no cluttered menus

If a new game ever stops looking like a sibling of the other four,
something has drifted — most likely it's reaching for raw pixel values
or hex codes instead of pulling from the design tokens.
