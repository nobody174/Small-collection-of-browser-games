# New Games — Architecture

This document explains how the project is organized and *why*.
Read this first whenever you come back to the project after a break.

---

## The big idea

We are building **one studio, many games**.
All games share:

- the same look and feel (colors, fonts, animations)
- the same UI building blocks (buttons, modals, toasts)
- the same systems (save/load, sound, particles, utilities)

Each game lives in its own folder so it can be developed, tested
and shipped independently — but it pulls its style and behaviour
from the same shared library.

Think of `/shared/` as the **mini game engine** and `/games/*` as
**cartridges** that plug into it.

---

## Folder structure

```
New games/
├── ARCHITECTURE.md          ← you are here
├── README.md                ← short project intro (added later)
├── index.html               ← HUB: pick a game to play
│
├── shared/                  ← the mini engine — reused by every game
│   ├── css/
│   │   ├── theme.css        ← colors, fonts, spacing, radii (design tokens)
│   │   ├── ui.css           ← buttons, panels, modals, toasts
│   │   └── animations.css   ← reusable @keyframes
│   ├── js/
│   │   ├── utils.js         ← formatNumber, randomInt, $, $$, etc.
│   │   ├── save.js          ← localStorage wrapper with per-game namespacing
│   │   ├── audio.js         ← Web Audio API procedural sounds + mute
│   │   ├── particles.js     ← click/event particle bursts
│   │   └── ui.js            ← Toast / Modal helpers (pairs with ui.css)
│   └── assets/              ← (empty for now — emojis instead of files)
│
└── games/
    ├── cards/               ← Game 1: Solitaire collection
    │   └── index.html
    ├── blocks/              ← Game 2: Color Block Escape Puzzle
    │   └── index.html
    ├── idle/                ← Game 3: Simple Idle Clicker
    │   └── index.html
    └── digger/              ← Game 4: Around the World Digger
        └── index.html
```

---

## How a game uses the shared framework

Every game's `index.html` imports the shared files at the top, then
adds its own game-specific CSS/JS underneath.

```html
<!-- shared (the studio identity) -->
<link rel="stylesheet" href="../../shared/css/theme.css">
<link rel="stylesheet" href="../../shared/css/ui.css">
<link rel="stylesheet" href="../../shared/css/animations.css">

<script src="../../shared/js/utils.js"></script>
<script src="../../shared/js/save.js"></script>
<script src="../../shared/js/audio.js"></script>
<script src="../../shared/js/particles.js"></script>
<script src="../../shared/js/ui.js"></script>

<!-- game-specific -->
<link rel="stylesheet" href="style.css">
<script src="game.js"></script>
```

That's it. The shared framework attaches a few global helpers
(`NG.save`, `NG.audio`, `NG.toast`, etc.) to a single namespace called
`NG` (short for "New Games") so the global scope stays clean.

---

## Naming conventions

- **Folders & files:** all lowercase, hyphens for spaces (`color-blocks`, not `Color Blocks`)
- **CSS variables:** kebab-case with `--ng-` prefix (`--ng-color-primary`)
- **JS namespace:** everything shared lives under `window.NG`
- **Save keys:** `newgames.<game>.<thing>` (e.g. `newgames.cards.save`)
- **CSS classes:** kebab-case, BEM-ish (`.btn`, `.btn--primary`, `.modal__title`)

---

## Why this structure?

| Choice | Why |
|---|---|
| Multiple files (not single-file like Delve) | 4 games × 1800 lines would be unreadable. Splitting forces modularity. |
| `shared/` folder | The studio's identity in one place. Change a color, every game updates. |
| Per-game subfolder | Each game is independently testable and deployable. |
| Plain HTML/CSS/JS, no build step | Beginner-friendly. Open `index.html` and it just works. |
| Single global `NG` namespace | Avoids polluting global scope; easy to find shared helpers. |
| CSS variables for tokens | Theme swapping later is trivial (dark mode, seasonal palettes). |

---

## Build order

We are building this in phases. Don't skip ahead.

1. **Architecture** ← this doc
2. **Shared CSS** — theme → ui → animations
3. **Shared JS** — utils → save → audio → particles → ui
4. **Hub page** — `index.html` at the root, lists all games
5. **Verify** — test page that exercises everything
6. **Game 1** — Cards (Solitaire). First real test of the framework.
7. **Game 2, 3, 4** — same pattern, each refining shared systems.
8. **Polish + mobile pass** across the whole collection.

---

## Conventions for new code

- **Heavily commented.** Explain *why*, not just *what*.
- **Small functions** with clear names.
- **No frameworks**, no npm packages at runtime.
- **Mobile-first** — test on a narrow window early.
- **Reuse before reinvent** — if something belongs in `/shared/`, put it there.
- **No dark gritty visuals.** Soft, colorful, casual, polished.
