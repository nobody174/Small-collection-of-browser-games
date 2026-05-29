# Verification Checklist — Per-Game Polish

## Summary of Changes

1. **Donut Clicker** (2 fixes)
   - ✅ Mobile zoom prevention: `user-select: none` + `touch-action: manipulation`
   - ✅ Visual click feedback: Added `ng-pulse-ring` animation triggered on donut click

2. **Blocks** (2 fixes)
   - ✅ Single-block movement: Swipe threshold increased from 14px → 30px
   - ✅ Difficulty curve: Level 1–2 redesigned with puzzle mechanics (blocking, pushing)

3. **Digger** (1 fix)
   - ✅ House position: Moved from inside tile to above surface (like trees)

4. **Cards** (1 fix)
   - ✅ Drag-drop lag: Added RAF batching + `will-change` CSS hint for smooth mobile dragging

## Test Plan

### To Verify (on mobile or mobile emulator):

**Donut Clicker:**
1. Open `games/idle/index.html`
2. Click the donut button rapidly on mobile
   - Should NOT trigger zoom-in
   - Should see pulse ring animation around donut
   - Sound + floating number still work

**Blocks:**
1. Open `games/blocks/index.html`
2. Start Level 1 ("Blocked Path") — new puzzle with red/blue blocks
   - Red blocked by blue; must move blue first
   - Try small swipes (< 30px) — should NOT move block
   - Try deliberate swipes (> 30px) — smooth single-cell movement

**Digger:**
1. Open `games/digger/index.html`
2. Scroll to surface
   - House emoji should be ABOVE the ground (like trees), not inside tile

**Cards:**
1. Open `games/cards/index.html` → Klondike
2. Drag cards on mobile
   - Should feel smoother, no jank on pointer move events
   - Will-change hint optimizes browser rendering

## Code Review Notes

- All changes are surgical, no logic refactoring
- Mobile-first fixes: threshold tuning, CSS hints, RAF batching
- No breaking changes to existing game mechanics
