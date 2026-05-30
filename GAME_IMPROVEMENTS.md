# 🎮 Game Improvements & Feature Ideas

## 🧩 Blocks — Color Block Escape

### Bugs
- [ ] **Hint button does nothing** — Button is visible but clicking it doesn't trigger hint functionality (should pulse doors/exit)

### Difficulty Progression
- [ ] **Difficulty scaling issue** — Levels feel repetitive. Currently just moves blocks/doors to different positions, but no real difficulty increase
- [ ] **Implement progression system:**
  - Start with smaller playground (fewer squares)
  - Gradually increase playground size as levels progress
  - Introduce larger blocks (not just 1x1) that are harder to move
  - Add roadblock mechanics - must move correct blocks in correct order before accessing the exit
  - Examples: 2x2 blocks, 1x3 blocks that require spatial planning

### Level Design
- [ ] **Playground shape variety** — Not always square grids
  - Add L-shaped playgrounds
  - Add irregular corners and angles
  - Add T-shaped layouts
  - This adds visual variety and puzzle complexity

### Gameplay Mechanics
- [ ] Add blocking/collision mechanics where larger blocks can't be moved if surrounded
- [ ] Add "locked" blocks that require solving other puzzles first
- [ ] Progressive tutorial for new block mechanics

---

## ⛏️ Digger — Around the World

### Controls & UI
- [ ] **Hold-to-dig mechanic** — On mobile, holding finger down should continuously dig/move (not just single taps)
- [ ] **Mouse pointer customization:**
  - Show pickaxe cursor when using basic pickaxe
  - Show laser drill cursor when using laser drill
  - Show dynamite cursor for explosives
  - Context-sensitive cursors for different tools

### Gameplay Features
- [ ] **Missing elevator/exit** — No way to get back to surface after digging down
  - Add elevator shaft or stairs to climb back up
  - Should appear at certain depth or at "home" location
  - Allow teleporting home when carrying full cart

### Bug Fixes
- [ ] **Cart full auto-sell bug** — Pressing shop button sells everything even if not at shop
  - Should only sell when physically at shop location
  - Or require explicit "sell" confirmation
- [ ] **Japan ninja character misplaced** — Character sprite is 7 tiles down from cursor position
  - Check character positioning in digger.js
  - Verify sprite offset calculations

### Visual & Thematic Improvements
- [ ] **Add flagpoles to each country:**
  - Flag at top of map (or in base camp)
  - Country-specific flag design
  - Add characteristic building/structure for each country
  - Examples: 
    - Norway: Viking longhouse with Nordic flag
    - Japan: Torii gate with Japanese flag
    - Egypt: Pyramid with Egyptian flag
    - Others: Context-appropriate buildings

- [ ] **Norway character redesign:**
  - Current: Skier digging (looks silly)
  - Improved: Viking-themed character
  - Add Viking helmet
  - Add long beard
  - Give pickaxe more weapon-like appearance
  - More fitting for digging/mining theme

### Other Ideas
- [ ] Different character skins/appearances for each country
- [ ] Add country-specific minerals and treasures
- [ ] Difficulty increases with depth (harder rocks, more dangerous terrain)
- [ ] Easter eggs or hidden artifacts

---

## 🃏 Cards — Solitaire Collection

### Ideas for Future
- [ ] Add animation polish (card flip animations, smooth movements)
- [ ] Add sound effects for valid/invalid moves
- [ ] Undo history (multiple undos)
- [ ] Statistics tracking (wins/losses per variant)

---

## 🍩 Idle — Donut Empire

### Ideas for Future
- [ ] Add prestige/ascension system
- [ ] Add special events
- [ ] Add achievements
- [ ] Add prestige-only generators

---

## 📝 Implementation Priority

**High Priority (Major Gameplay):**
1. Blocks - Difficulty progression system
2. Digger - Elevator/exit mechanic
3. Digger - Hold-to-dig on mobile

**Medium Priority (Polish & Bugs):**
1. Digger - Cursor customization
2. Digger - Fix ninja character positioning
3. Digger - Cart auto-sell bug fix
4. Blocks - Hint button fix

**Lower Priority (Visual/Thematic):**
1. Digger - Flagpoles and buildings
2. Digger - Norway character redesign
3. Digger - Country-specific aesthetics

---

## 🧪 Testing Considerations

When implementing these changes:
- Update existing tests if behavior changes
- Add new tests for:
  - Hint button functionality
  - Mobile hold-to-dig mechanics
  - Cart sell mechanics
  - Character positioning

---

*Last updated: 2026-05-30*
