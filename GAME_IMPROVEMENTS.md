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

- [ ] **Sales receipt/summary** — After selling gems, show breakdown
  - Display price per gem type
  - Show individual gem values
  - Display total sum earned from sale
  - Add to UI near shop/cart area

- [ ] **Mineral price tags** — Show gem/mineral value on the board
  - Add price tag on each gem/mineral visible under board
  - Show near cart area where player can see values
  - Helps player strategize what to mine

### Bug Fixes
- [ ] **Cart full auto-sell bug** — Pressing shop button sells everything even if not at shop
  - Should only sell when physically at shop location
  - Or require explicit "sell" confirmation
- [ ] **Character sprite misplaced (7 tiles down)** — Multiple countries affected (Japan, Mexico)
  - Character appears 7 tiles below cursor position
  - Clicking area works but character not visible at correct location
  - Check character positioning in digger.js
  - Verify sprite offset calculations
  - Seems to be a consistent offset issue across all countries

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

### Critical Bug Fixes
- [ ] **Drag & drop broken** — Cards stick outside frames and get misaligned
  - Regression: drag/drop was working before, now worse
  - Cards don't snap properly to drop zones
  - Visual mess when dropping cards
  - **Action:** Research standard Kabale/Solitaire drag-n-drop implementations
  - Check how other solitaire games handle card dragging
  - May need to revert to previous drag-n-drop code or use proven library

### UI/Visibility Issues
- [ ] **Dark theme too dark** — Text visibility severely reduced
  - "Hub" button text not visible
  - "Back" button text not visible
  - Other button/UI text hard to read
  - Need to increase contrast or adjust colors
  - Test on dark and light backgrounds

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

**CRITICAL (Game-Breaking Bugs):**
1. ⚠️ **Cards - Fix drag & drop** — Cards unplayable with current implementation
2. ⚠️ **Cards - Fix dark theme contrast** — Buttons text not visible
3. ⚠️ **Digger - Fix character positioning** — 7-tile offset affecting all countries

**High Priority (Major Gameplay):**
1. Digger - Sales receipt/summary after selling
2. Digger - Mineral price tags on board
3. Blocks - Difficulty progression system
4. Digger - Elevator/exit mechanic
5. Digger - Hold-to-dig on mobile

**Medium Priority (Polish & Bugs):**
1. Digger - Cursor customization
2. Digger - Cart auto-sell bug fix
3. Blocks - Hint button fix
4. Digger - Cart full auto-sell behavior

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

---

## 🔗 References & Research

**Cards Drag & Drop Research:**
- [ ] Look for standard Kabale/Solitaire game implementations
- [ ] Check how proven solitaire games (e.g., classic Windows Solitaire) handle card dragging
- [ ] Review CSS and JavaScript patterns for card snap-to-grid behavior
- [ ] Consider using a proven drag-n-drop library if current implementation is unstable

---

*Last updated: 2026-05-30*
