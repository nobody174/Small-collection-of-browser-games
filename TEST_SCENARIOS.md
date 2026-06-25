# Card Games: Test Scenarios & Validation

Complete test scenarios to verify all bug fixes and enhancements work correctly.

---

## TEST 1: Klondike Foundation Logic (Bug #1)

### Scenario: Build a Foundation from Ace to King

**Setup:**
1. Start a new Klondike game
2. Locate an Ace in the tableau or stock/waste
3. Move it to a foundation pile

**Expected Behavior (BEFORE FIX):**
- ❌ Ace placement fails or acts incorrectly
- ❌ Cannot build 2 on Ace, even with correct suit

**Expected Behavior (AFTER FIX):**
- ✅ Ace goes on empty foundation
- ✅ 2 of same suit goes on Ace
- ✅ 3 of same suit goes on 2
- ✅ Chain continues A→K without errors

**Verification:**
```javascript
// In browser console:
// Card 5 should accept card 6 (6 = 5 + 1)
const card5 = new NG.cards.Card('hearts', '5');
const card6 = new NG.cards.Card('hearts', '6');
console.log('5.value:', card5.value, '6.value:', card6.value);
console.log('Should accept 6 on 5:', card6.value === card5.value + 1); // true
```

---

## TEST 2: Spider Move Validation (Bug #2)

### Scenario: Attempt Invalid Group Moves

**Setup:**
1. Start a 1-suit Spider game (all spades)
2. Create a valid descending sequence: K♠ Q♠ J♠
3. Try to move it to a pile

**Test Case A: Valid Move**
- Top card: 9♠
- Moving: J♠ 10♠ 9♠
- **Expected:** Move succeeds (correct descending sequence)

**Test Case B: Invalid Group (Before Fix)**
- Artificially create: 5♠ 7♠ 6♠ (not descending)
- Try to move
- **Before:** ❌ System might allow it (bug)
- **After:** ✅ System rejects it (fixed)

**Test Case C: Destination Validation**
- Moving: 7♠ 6♠ 5♠
- Destination top: 8♠
- **Expected:** Move succeeds (creates valid 8-7-6-5 sequence)

**Verification:**
```javascript
// In Spider game console:
const spiderDeck = NG.cards.createDeck(2, ['spades']);
const validSequence = [
  spiderDeck.find(c => c.rank === '7'),
  spiderDeck.find(c => c.rank === '6'),
  spiderDeck.find(c => c.rank === '5')
];

// Check: all same suit and descending
const allSpades = validSequence.every(c => c.suit === 'spades');
const isDescending = validSequence[0].value > validSequence[1].value && 
                     validSequence[1].value > validSequence[2].value;
console.log('Valid group:', allSpades && isDescending); // true
```

---

## TEST 3: FreeCell SuperMove Formula (Bug #3)

### Scenario: Move Large Card Groups

**Setup:**
1. Start FreeCell game
2. Open 2 free cells and 1 tableau column (3 empty spaces total)

**Test Case A: Maximum Legal Move**
- Formula: (emptyFreeCells + 1) × 2^emptyTableauCols
- With: 2 empty free cells, 1 empty tableau column
- Calculation: (2 + 1) × 2^1 = 3 × 2 = **6 cards max**
- **Before Fix:** May have calculated differently
- **After Fix:** Correctly allows 6, rejects 7+

**Test Case B: No Free Space**
- Formula: (0 + 1) × 2^0 = 1 × 1 = **1 card max**
- All free cells full, no empty tableaus
- **Expected:** Single card moves only

**Test Case C: Many Empty Tableaus**
- Formula: (1 + 1) × 2^3 = 2 × 8 = **16 cards max**
- 1 empty free cell, 3 empty tableau columns
- **Expected:** Up to 16-card group moves allowed

**Verification:**
```javascript
// In FreeCell game console:
function testSuperMove(emptyFreeCells, emptyTableaus) {
  return (emptyFreeCells + 1) * Math.pow(2, emptyTableaus);
}

console.log('2 free, 1 tableau:', testSuperMove(2, 1)); // 6
console.log('0 free, 0 tableau:', testSuperMove(0, 0)); // 1
console.log('1 free, 3 tableaus:', testSuperMove(1, 3)); // 16
console.log('4 free, 3 tableaus:', testSuperMove(4, 3)); // 40
```

---

## TEST 4: Auto-Send Feature (Klondike Enhancement)

### Scenario: Watch Cards Auto-Move to Foundations

**Setup:**
1. Deal Klondike game
2. Get 4 Aces into foundations (manually or by luck)
3. Expose multiple 2s in tableau

**Expected Behavior:**
1. Move one 2 to foundation manually
2. Other 2s of same suit auto-move immediately
3. Chain continues: 3s auto-move, then 4s, etc.
4. No need to click each card individually

**Verification Steps:**
1. Play until you have A♥, 2♥, 3♥ on foundation
2. Expose 2♣ in tableau
3. Move 2♣ to foundation
4. Watch: 3♣, 4♣, 5♣ auto-move if exposed
5. Score increases for each auto-send

**Edge Cases:**
- ✅ Auto-send doesn't trigger if card is face-down
- ✅ Auto-send stops if no more eligible cards
- ✅ Auto-send works from both waste and tableau
- ✅ History/undo captures all auto-sends

---

## TEST 5: Cascade Completion (Spider Enhancement)

### Scenario: Watch Sequences Auto-Remove and Cascade

**Setup:**
1. Play 4-suit Spider game (harder difficulty)
2. Work towards a K-A sequence
3. Complete one sequence

**Expected Behavior:**
1. K-A-[rest] of same suit auto-removes
2. Newly exposed card auto-flips
3. If it forms another K-A sequence, that auto-completes too
4. Continues until no more sequences available

**Example Chain Reaction:**
```
Step 1: You move 6♠ onto 7♥ (breaking up a mixed run)
Step 2: New top card of that column is K♣ A♣ Q♣ J♣... (descending)
Step 3: Last 13 cards are K♣ down to A♣ (all spades!)
Step 4: BOOM - auto-remove with confetti
Step 5: Expose new card - it's K♦ down to A♦
Step 6: Auto-remove again!
Step 7: Display confetti, score increases, sets counter +2
```

**Verification:**
- [ ] Multiple sequences complete in single afterMove() call
- [ ] Sound plays for each sequence removed
- [ ] Particles show for each removal
- [ ] Score increases by 100 per sequence
- [ ] Sets counter increments correctly

---

## TEST 6: Drag-Drop Cleanup (Polish Enhancement)

### Scenario: Verify No Ghost Clicks or Ghost Moves

**Setup:**
1. Start any game
2. Initiate drag but don't complete it
3. Drag off-screen or snap back
4. Quickly click same card again

**Expected Behavior (Before):**
- ⚠️ Possible ghost click or weird state
- ⚠️ Card might be partially attached to wrong pile

**Expected Behavior (After):**
- ✅ Clean snap-back animation
- ✅ Card back to original position
- ✅ New drag starts fresh with no state issues
- ✅ No phantom moves
- ✅ Smooth 60fps even with rapid drags

**Verification:**
- [ ] Drag 5 cards back and forth rapidly
- [ ] No console errors
- [ ] No visual artifacts
- [ ] Cards end up where expected

---

## INTEGRATION TEST: Full Game Flow

### Klondike Classic Full Game
1. ✅ Deal fresh hand
2. ✅ Try stock clicks (cycle to waste, recycle)
3. ✅ Move cards to tableau (multi-card groups)
4. ✅ Move to foundations (verify value logic)
5. ✅ Auto-send engages at appropriate time
6. ✅ Undo works, restores game state
7. ✅ Win condition triggers at 52 cards
8. ✅ Save/load preserves game state

### Spider 1-Suit Game
1. ✅ Deal 104-card deck into 10 columns
2. ✅ Pick up only valid same-suit descending groups
3. ✅ Complete K-A sequence
4. ✅ Watch cascade removal if available
5. ✅ Deal from stock (blocks with full columns)
6. ✅ Win at 8 sequences completed
7. ✅ Undo/redo works

### FreeCell Full Game
1. ✅ Deal all 52 cards face-up
2. ✅ Move single card to free cell
3. ✅ Move multi-card group (respects SuperMove)
4. ✅ Auto-send triggers after foundation moves
5. ✅ Tap card to send to foundation
6. ✅ Win at all 52 on foundations
7. ✅ History/undo works

---

## EDGE CASE TESTS

### Empty Pile Handling
- [ ] Klondike: Only King can go to empty tableau
- [ ] Spider: Any card can go to empty tableau
- [ ] FreeCell: Any card/group can go to empty tableau

### Face-Down Card Behavior
- [ ] Klondike: Face-down cards auto-flip when exposed
- [ ] Spider: Face-down cards auto-flip when exposed
- [ ] FreeCell: All cards dealt face-up (no flip needed)

### Undo/History Integrity
- [ ] Undo doesn't corrupt card references
- [ ] Undo restores exact pile positions
- [ ] Undo restores face-up/face-down state
- [ ] Undo restores score/moves count
- [ ] Undo history caps at 50 items (memory safety)

### State Persistence (Save/Load)
- [ ] Game state saves to localStorage
- [ ] Reload browser restores exact position
- [ ] Score/moves preserved
- [ ] Face state (up/down) preserved
- [ ] Works with new game after restore

---

## PERFORMANCE TESTS

### Drag Performance
- [ ] 60fps during card drag (no jank)
- [ ] Smooth animation even with 20+ cards on screen
- [ ] Memory usage stable (no leaks)

### Animation Performance
- [ ] Card flip: smooth 300ms animation
- [ ] Confetti: doesn't cause lag
- [ ] Cascade completion: instant processing

### Event Performance
- [ ] No console errors during gameplay
- [ ] No duplicate event listeners (check DevTools)
- [ ] Responsive to clicks/taps (< 100ms)

---

## REGRESSION TESTS (Ensure Nothing Broke)

### Existing Features Still Work
- [ ] Card graphics render correctly
- [ ] Deck theme selector works
- [ ] Volume/mute controls work
- [ ] Win banner displays correctly
- [ ] "New Game" button resets properly
- [ ] Navigation between variants works
- [ ] Mobile responsive layout

### No New Bugs Introduced
- [ ] No console errors in any game
- [ ] No memory leaks on extended play
- [ ] No CSS conflicts with existing styles
- [ ] No HTML structure changes required

---

## Success Criteria

✅ **All tests pass?** → Production ready
⚠️ **Minor issues?** → Document and schedule
❌ **Critical failures?** → Back to fix phase

---

## Test Execution Notes

**Environment:**
- Browser: Chrome/Firefox/Safari latest
- Device: Desktop + Mobile (iOS/Android)
- Network: Both online and offline
- Screen: 320px (mobile) to 2560px (ultra-wide)

**Test Duration:** ~30-45 minutes per game variant
**Total Coverage:** ~2 hours per full cycle

**Automated Testing:**
- Run Playwright suite after manual validation
- Check for new console errors/warnings
- Performance profiling (DevTools)
- Accessibility audit (aXe)

---

