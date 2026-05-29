# Game Updates — May 2026

## Summary

Major polish and feature improvements across all 4 games, with focus on mobile experience, visual refinement, and gameplay depth.

---

## Cards (Klondike / Spider / FreeCell)

### Fixes
1. **Card disappearing bug** — Fixed issue where dragging invalid card groups could leave cards in inconsistent state
   - Added cleanup of `transform`, `zIndex` styles in `snapBack()` and `moveGroup()`
   - Ensures all inline styles are properly reset when drag ends

2. **Drag-drop smoothness** — Implemented RAF batching + `will-change` CSS hint
   - Position updates now coalesce instead of firing on every pointermove
   - GPU-hints cards for smoother mobile dragging

3. **Brightness reduction** — Toned down white card faces and blue background
   - Card background: `#ffffff` → `#f8f9fb` (soft off-white)
   - Board background: Reduced radial-gradient opacity from 0.18 → 0.08
   - Board colors: `#f4f7ff / #ecf3ff` → `#e8eef5 / #dfe9f2` (cooler, softer tones)

---

## Color Block Escape (Blocks)

### Features
1. **Distance-based movement** — Control how far blocks move based on swipe length
   - **< 60px swipe**: Move 1 cell (fine control)
   - **60-120px swipe**: Move 2 cells
   - **> 120px swipe**: Slide to wall (classic behavior)
   - Solves mobile complaint: "can't move blocks 1 cell at a time"

### Fixes
2. **Swipe threshold**: Increased from 14px → 30px (requires deliberate swipe, prevents accidental moves)

### Level Design
3. **Redesigned early levels** — More engaging puzzle concepts
   - **Level 1 "Blocked Path"**: Red block is blocked by blue; teach sequencing
   - **Level 2 "Push & Pull"**: Both blocks want to exit up; teach separation strategy
   - (Existing levels 3-8 remain unchanged; ramp difficulty smoothly)

---

## Around the World Digger

### Visual Improvements
1. **Realistic minerals** — CSS-based gemstone rendering instead of colored emoji
   - Each mineral has radial gradient + inset shadow for 3D effect
   - Matches theme: coal is matte-dark, diamonds are bright-reflective, rubies are saturated-red
   - Data-driven: `<div data-mineral="ruby">` → CSS handles appearance
   - New minerals look: pebble, coal, iron, copper, silver, gold, ruby, emerald, sapphire, diamond

### Gameplay Improvements
2. **Swipe-based movement** — Move player with finger/mouse swipes instead of clicking each tile
   - Drag in any direction on the viewport to move player
   - Threshold: 10px movement to activate
   - Complements existing click + arrow-key input

3. **Layer elevator system** — Fast travel between mining depths
   - Each geological band (dirt, stone, hardstone, bedrock) has ONE elevator at mid-depth
   - Elevator tile: `🛗` emoji, purple shaft background, clickable
   - Opens modal: select which layer to teleport to
   - Solves tedious clicking: "digging 100 cells up" is now 1 elevator use + walk back

### Technical
- Added `elevatorRow` to each BANDS entry (determines where elevator appears in that layer)
- New tile type: `tile--elevator` with CSS styling
- New function: `openElevator()` for modal layer selection
- Elevator generation: Deterministic (same location every run)

---

## Files Modified

### Cards
- `games/cards/js/card-engine.js` — Fixed drag state cleanup + RAF batching
- `games/cards/style.css` — Softened card face + background colors

### Blocks
- `games/blocks/js/blocks.js` — Distance-based slide + threshold increase
- `games/blocks/js/levels.js` — Redesigned Level 1 & 2

### Digger
- `games/digger/js/digger.js` — Mineral rendering, swipe input, elevator system
- `games/digger/js/countries.js` — Added `elevatorRow` to BANDS
- `games/digger/style.css` — Mineral CSS + elevator tile styling

---

## Testing Checklist

- [ ] **Cards**: Drag a card group, drag invalid card, confirm no disappearing
- [ ] **Cards**: Drag smoothly on mobile, no jank, eyes feel comfortable on softer background
- [ ] **Blocks**: Short swipe = 1 cell, long swipe = slide to wall
- [ ] **Blocks**: Level 1 teaches sequencing (move blue first)
- [ ] **Digger**: Minerals render as 3D gemstones, not emoji
- [ ] **Digger**: Swipe left/right/up/down to move player
- [ ] **Digger**: Click elevator tile, see layer selector, teleport between layers
- [ ] **Digger**: Elevator stays in same position after revisiting a layer

---

## Notes for Future Work

- **Cards**: Could add hint animation to highlight next valid move
- **Blocks**: Difficulty 3+ levels could be tuned once players reach them
- **Digger**: Elevator visual could animate (rising platform effect)
- **All**: Mobile testing on real devices (touch threshold tuning may be needed)
