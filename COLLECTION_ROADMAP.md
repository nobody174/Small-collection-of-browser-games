# 🎮 Small Collection of Browser Games — Collection Roadmap

**Current Status:** v1.0 — All 4 games playable and live on GitHub Pages.  
**Last Updated:** 2026-06-26

---

## 📋 Cross-Game Improvements (Highest Priority)

### Top Bar Unification & Collection Branding
**Goal:** Consistent look & feel across all game pages + strengthen collection identity

#### Main Collection Hub (`index.html`)
- ✅ Current design is solid
- **Additions needed:**
  - Add GitHub link (icon + text) in top-right corner
  - Add Patreon link (icon + text) in top-right corner
  - Optional: Redesign title box for more visual impact

#### In-Game Top Bar Consistency
**Problem:** Each game has a different top bar layout
- Donut Empire: Buttons scattered
- Card Games: Horizontal line with grouped buttons
- Blocks: Different layout again
- Digger: Yet another variation

**Solution:** Unified top bar template
- Consistent left-aligned "BACK" button with house/hub icon (NOT "hub" text)
- Centered title (game name)
- Right-aligned game controls (settings, stats, etc.)
- Same font, spacing, and sizing across all games
- Same dark gray/black background matching collection theme

---

## 🎨 Per-Game Improvements

### Donut Empire
See: `games/idle/FUTURE_ROADMAP.md`

**Current v1.0 Features:**
- Word-card engine with 4 eras
- Prestige system (Sprinkle Shards)
- Rival system with flavor unlocks
- Tabbed shop (Bakers, Clicks, Upgrades)
- Radio ticker with dialogue

**Roadmap:**
- v1.1: Synergies tab, world themes, mini-donut animations
- v1.2: Lore expansion, sound design
- v2.0: Transcendence layer with challenges/leaderboards

---

### Card Games (Klondike Solitaire)
See: `games/cards/ROADMAP.md`

**Current v1.0 Features:**
- Klondike solitaire fully playable
- Infinite deck recycling (no shuffle)
- 3-card draw mode
- Drag & drop, undo, double-tap to foundation

**Roadmap:**

#### v1.1 — UI/UX Polish
- Unified top bar (see above)
- 3D card shadows
- Hint highlighting with golden glow
- Waste pile fan layout (visual spread of cards)
- Difficulty selector (Easy/Medium/Hard)
- Score calculation with multipliers
- Responsive design for all screen sizes

#### v1.2 — Advanced Features
- Timed mode (60s, 5min, unlimited)
- Daily challenge with seeded deck
- Practice mode (no scoring)
- Win/loss statistics
- Local high-score leaderboard
- Game variants (Vegas scoring, cumulative scoring)

**Known Issues:**
- ✅ Infinite deck recycling: FIXED (relayout on waste clear)
- ✅ 3-card draw: WORKING (stacked layout)
- ⚠️ Stock pile visual indicator: When clicking stock button to cycle deck, the visual feedback could be clearer (consider highlighting or animation)

---

### Blocks Game

**Current v1.0 Features:**
- Block-dropping puzzle game
- Grid-based placement
- Scoring system

**Improvements Needed:**
- Unified top bar (see cross-game section)
- Color theme consistency (match dark gray/black background)

**Roadmap:**
- v1.1: Enhanced graphics, particle effects
- v1.2: Different block shapes, difficulty levels
- v2.0: Multiplayer/leaderboard support

---

### Digger Game

**Current v1.0 Features:**
- Grid-based mining game
- Player movement, tile clearing
- Score tracking

**Improvements Needed:**
- ⚠️ **COLOR THEME FIX** — Light blue and sharp colors clash with collection dark theme
  - Change background from light blue → dark gray/black
  - Adjust all color palette to match collection aesthetic
  - Reduce visual harshness (sharp colors strain eyes)
- Unified top bar (see cross-game section)

**Roadmap:**
- v1.1: Enhanced UI with collection color scheme
- v1.2: New power-ups, difficulty progression
- v2.0: Leaderboards, achievements

---

## 🚀 Release Schedule

### v1.0.1 (Hotfix)
- **Target:** ASAP
- ✅ Fix stock pile visual feedback (deck cycling indicator)
- ✅ Digger color theme overhaul (dark gray/black, softer colors)
- ✅ Create unified top bar template

### v1.1 (Feature Release)
- **Target:** 2026-07 (2-3 weeks after v1.0.1)
- All top bar unification across 4 games
- GitHub + Patreon links on collection hub
- Card Games: UI/UX polish, waste fan layout, responsive design
- Digger: Modernized colors + top bar
- Blocks: Modernized colors + top bar
- Donut Empire: Minor polish

### v1.2 (Advanced Features)
- **Target:** 2026-08+
- Card Games: Difficulty modes, statistics, daily challenge
- Advanced features per game
- Leaderboard foundation

---

## 📊 Collection Statistics

| Game | Status | Lines of Code | Features |
|------|--------|---|---|
| Donut Empire | ✅ v1.0 | 1,100+ | 4 eras, prestige, rivals, radio |
| Card Games | ✅ v1.0 | 500+ | Klondike, infinite deck, 3-card draw |
| Blocks | ✅ v1.0 | 300+ | Grid puzzle, scoring |
| Digger | ✅ v1.0 | 400+ | Mining, movement, scoring |

---

## 🔧 Technical Debt

- [ ] Unified top bar component (could be extracted to `shared/components/topbar.js`)
- [ ] Color theme centralization (move color values to CSS custom properties)
- [ ] Consistent button styling across games
- [ ] Mobile viewport optimization for all games
- [ ] Performance: Consider lazy-loading games on collection hub

---

## 💡 Future Vision (Post v1.2)

- **Meta-progression:** Shared currency/cosmetics across games
- **Achievements:** Cross-game achievement system
- **Cloud save:** Optional cloud backup of game saves
- **Social:** Share scores, daily challenge results
- **Monetization:** Patreon integration with exclusive cosmetics
- **Mobile apps:** Wrap as PWA or native apps

---

*See also: Individual game roadmaps for detailed feature lists*
