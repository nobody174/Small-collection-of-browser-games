# 🍩 Donut Empire — Future Roadmap

Version 1.0 is complete and stable. Below are planned features for future updates based on player feedback and expansion opportunities.

---

## 📋 Patch 1.1 — Synergies & Cross-Generator Buffs

**Status:** Planned

Implement the Synergies tab with meaningful cross-generator synergy upgrades.

### Features:
- **Synergy Pairs:** Unlock buffs when owning multiple specific generators (e.g., "Baker + Machine = +10% combined output")
- **Synergy Tree:** Visual progression showing available/unlocked synergies
- **Cost Scale:** Synergies cost Sprinkle Shards or coins, scale with generator ownership
- **Unlock Conditions:** Synergies unlock after first prestige evolution or at specific coin thresholds

### Implementation:
- Add `SYNERGIES` data array with pair definitions
- Create `calculateSynergyBonus()` helper
- Render synergy cards in shop tab with unlock indicators
- Show active synergies on main board

---

## 🎨 Patch 1.2 — World Themes & Visual Overhaul

**Status:** Planned

Make each world (Bakery, Park, Space Station) visually distinct with unique backgrounds, tiles, and atmosphere.

### Features:
- **World Backgrounds:** Custom gradient/image for each world
- **Generator Skins:** Generators look different per world (e.g., Baker → Park Vendor, Factory → Cosmic Station)
- **UI Theming:** Shop tabs, buttons, colors adapt to current world
- **Flavor-World Synergy:** Certain flavors thrive in certain worlds (visual hints)

### Implementation:
- Add `WORLD_THEMES` data with background colors, accent colors, generator names per world
- Create CSS themes: `.world-bakery`, `.world-park`, `.world-space`
- Update generator render to use world-specific emoji/names
- Add world-switch animation (fade/transition)

---

## ✨ Patch 1.3 — Mini-Donut Orbit Animation

**Status:** Planned

Animate mini-donuts in an orbital swarm around the main donut for visual impact and progression feedback.

### Features:
- **Orbit Animation:** Mini-donuts circle the main donut at increasing speeds
- **Spawn Feedback:** Mini-donuts spawn when combo-meter hits 20, evolution triggers, or major milestones
- **Visual Swarm:** Each mini-donut has slight size variance and color randomization
- **Performance:** Use CSS animations, not JavaScript, for smooth 60 FPS

### Implementation:
- Add `.mini-donut` CSS class with orbit keyframes
- Create `spawnMiniDonut()` function
- Trigger spawns on combo hits, evolution, Tier 4 word-cards
- Display mini-donut count on main board

---

## 📻 Patch 1.4 — Expanded Lore & Narrative

**Status:** Planned

Deepen the story with multi-line lore snippets, flavor-specific dialogue, and world-specific narrative beats.

### Features:
- **Lore Snippets:** Long-form dialogue at major coin/flavor milestones (shown in modal)
- **Flavor Stories:** Each flavor has its own description and "origin story"
- **World Narrative:** Each world has lore and unique events
- **Rival Stories:** Rivals react to player progress with contextual taunts/encouragement
- **Achievement Logs:** New tab showing all lore unlocked, sorted chronologically

### Implementation:
- Expand `WORD_CARD_LORE` to include multi-paragraph stories
- Add `FLAVOR_STORIES` and `WORLD_LORE` data objects
- Create modal for reading extended lore
- Update rival dialogue to reference player progress (coins, flavors, world)
- Add lore/achievement gallery UI

---

## 🎵 Patch 1.5 — Sound Design

**Status:** Planned

Add satisfying audio feedback for clicks, word-cards, prestige events, and ambient background music.

### Features:
- **Click SFX:** Varied "pop" sounds for different click types (normal, critical, combo)
- **Word-Card Jingles:** Short musical stings for each era (8-bit to orchestral)
- **Prestige Chime:** Dramatic chord progression on evolution/reset
- **Ambient Music:** Optional looping background track (toggle in settings)
- **Rival Fanfare:** Dramatic sting when rival unlocks flavor

### Implementation:
- Create audio file library (coin pop, word-card tones, prestige chime, bg music)
- Use existing `NG.audio.play()` system to trigger SFX
- Add volume slider expansion (separate SFX vs. music volume)
- Add "Music On/Off" toggle in topbar

---

## 🚀 Patch 2.0 — Transcendence & Infinity Layers

**Status:** Planned (Major)

Add 4th+ prestige layers beyond World Ascension for ultra-endgame progression.

### Features:
- **Transcendence Layer:** Prestige to unlock "Ascended" flavor variants (Ascended Chocolate, etc.) with +50% bonus per layer
- **Infinity Coins:** New currency earned on Transcendence reset, harder to farm but multiplicative bonuses
- **Dimension Hopping:** Unlock parallel universes with unique generator sets and modifiers
- **Infinity Upgrades:** One-time purchases that persist across ALL future runs (meta progression)

### Implementation:
- Add `state.transcendenceLayers`, `state.infinityCoins`
- Create Transcendence UI/button (appears after 1 Infinity evolution)
- Implement infinity upgrade shop (grayed out unless in Transcendence run)
- Add dimension-switching mechanic (unlocked at high Infinity Coins)

---

## 🎮 Patch 2.1 — Prestige Challenges & Leaderboard

**Status:** Planned

Add optional challenge runs and optional leaderboard (local high-scores).

### Features:
- **Challenge Modes:**
  - "No Generators" — Only click, no passive income
  - "Hardcore" — 50% slower generator rates, earn more Shards
  - "Speedrun" — Reach 1B coins as fast as possible (timer tracked)
- **Local Leaderboard:** High-scores for each challenge mode (stored in localStorage)
- **Badges:** Earn badges for completing challenges, displayed in Collection

### Implementation:
- Add `state.activeChallenge` and challenge-specific rules in rate/earn calculations
- Create challenge selection UI (modal with descriptions)
- Track times/scores in new `state.leaderboard` object
- Display badges in Collection modal

---

## 👥 Patch 2.2 — Multiplayer / Async Competition

**Status:** Speculative (Future)

Optional cloud backend for comparing your progress with friends/global players.

### Features:
- **Cloud Save:** Optional login to sync progress across devices
- **Friend Comparison:** See friends' highest coins, flavors unlocked, prestige level
- **Global Leaderboard:** Top 100 players by coins, prestige level, speedrun times
- **Seasonal Resets:** Monthly challenges with seasonal leaderboards

### Implementation:
- Integrate simple backend API (Node.js + MongoDB suggested)
- Add login/auth UI
- Add "Compare with Friends" modal
- Display global leaderboards (read-only initially)

---

## 🐛 Known Limitations & TODOs

- **Synergies Tab:** Currently shows placeholder "Coming Soon" text
- **World Themes:** All worlds use same Bakery visual (Park/Space visuals not implemented)
- **Mini-Donuts:** Counted in state but not animated in UI
- **Buddy Donut Fusion:** UI incomplete, fusion modal not tested
- **Mobile:** Tested on iPhone XR; may need refinement for tablets/landscape
- **Accessibility:** No screen reader support yet; keyboard nav limited

---

## 🎯 Version Goals

- **v1.0** (Current): Solid, playable idle game with core progression ✅
- **v1.1–1.5**: Quality of life, visual polish, sound, expanded narrative
- **v2.0**: Endgame content (Transcendence, Infinity, challenge modes)
- **v2.1+**: Social features (leaderboards, multiplayer)

---

## 💡 Community Feedback Drivers

Features marked above will be **prioritized based on player feedback**:
- Which features do players ask for most?
- Which features do players engage with longest?
- What balance issues arise?

**This is a living document.** As players provide feedback, the roadmap will evolve.

---

*Last updated: 2026-06-26*
*Maintained by: Claude Code*
