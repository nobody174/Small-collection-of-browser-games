# Donut Empire: Quick Testing Checklist

Use this guide to verify all Phase 1–4 features work as expected.

---

## Prerequisites

1. Open `games/idle/index.html` in a browser (or run a local HTTP server)
2. Open DevTools Console (F12) to watch for any errors
3. Clear browser cache to ensure latest code loads

---

## Phase 1: Word-Card Engine

### TAP (Tier 1)
- [ ] Click the donut 10+ times
- [ ] After every 10th click, a word-card appears (e.g., "POP!", "GLAZE!")
- [ ] Card is small (32px font), fades out after ~2s
- [ ] Multiple clicks shouldn't spam cards (throttled to ~500ms between)

### COMBO (Tier 2)
- [ ] Rapidly click the donut 5+ times within 1 second
- [ ] A medium-sized card appears (e.g., "SUGAR RUSH!")
- [ ] Donut glows with a gold aura for 8 seconds (buff active)
- [ ] Click power display increases while buff is active
- [ ] Glow fades after 8 seconds

### PURCHASE MILESTONE (Tier 3)
- [ ] Buy 10 of any generator (e.g., Apprentice Baker)
- [ ] A large word-card fires (e.g., "KA-DOUGH!")
- [ ] A sparkle icon (✨) appears briefly near the donut
- [ ] Tapping the sparkle grants 5% bonus coins

### THRESHOLD (Tier 4)
- [ ] Earn until total coins exceeds 1,000,000
- [ ] A large word-card fires (e.g., "HOLY SPRINKLES!")
- [ ] A toast notification appears with a lore snippet (e.g., "The donut empire reaches the first million...")
- [ ] Repeat at 1 billion, 1 trillion for more snippets

---

## Phase 2: UI/UX Overhaul

### Tab System
- [ ] 5 tabs visible: 🍩 Bakers, 👆 Click Multipliers, ⚡ Short Boosts, 🤖 Clickerinos, 🌟 Synergies
- [ ] Click each tab; content switches without page reload
- [ ] Active tab has different styling (primary color)
- [ ] Mobile (< 600px): tabs wrap and remain functional

### Bakers Tab
- [ ] All current generators listed (Apprentice Baker through Sugar Portal)
- [ ] Each generator shows: name, rate/s, cost, owned count
- [ ] Clicking a generator buys it (if affordable)

### Click Multipliers Tab
- [ ] Current upgrades listed (Stronger Fingers, Sugar Rush, etc.)
- [ ] Each upgrade shows: name, multiplier effect, cost
- [ ] Unaffordable upgrades appear dimmed (opacity 0.55)

### Short Boosts Tab
- [ ] 2 boosts appear: "Double Rate Boost" and "Triple Click Power"
- [ ] Clicking a boost deducts coins and applies a temporary effect
- [ ] Verify double rate takes effect on next tick (coins earn twice as fast)

### Clickerinos Tab
- [ ] 2 auto-clicker generators appear (unlocked at 100 and 5k coins)
- [ ] Each adds automated clicks per second
- [ ] Cost scales like regular generators (1.15× per owned)

### Affordability Badges
- [ ] Each tab shows a badge (e.g., "2") if items are affordable soon
- [ ] Badge disappears when all items are either bought or still too far away

---

## Phase 3: Prestige System

### Flavor Evolution (Layer 1)

#### Unlock Mechanism
- [ ] Top-right "Evolve" button is visible in topbar
- [ ] Early on, clicking it shows: "Unlock Chocolate Donut at 1M coins!"
- [ ] After earning 1M coins, button becomes active

#### Evolution Flow
- [ ] Click "Evolve" button (now active)
- [ ] Modal appears: "Evolve to Chocolate Donut?" with confirmation
- [ ] Click "Evolve"
- [ ] A cinematic Tier 5 word-card fires (e.g., "GLAZE ASCENDANT!")
- [ ] Toast: "Your donut has evolved! Welcome to a new era."
- [ ] Coin counter resets to 0
- [ ] Generators reset (all owned counts → 0)
- [ ] Upgrades reset (all purchased states → false)
- [ ] Income rate should temporarily show Chocolate perk (+10% generator output)

#### Multiple Evolutions
- [ ] Repeat earning & evolving to Strawberry, Glazed, Cosmic
- [ ] Each evolution: confirm flavor name, reset state, watch word-card
- [ ] Verify each new flavor's perk applies (check coin rate increases)

### Flavor Fusion (Layer 2 - Buddy Donuts)
- [ ] After 2+ evolutions, unlocking this mechanic
- [ ] In-game button or menu to "Create Buddy Donut"
- [ ] Select two flavors (e.g., Chocolate + Strawberry)
- [ ] Costs 50 Sprinkle Shards
- [ ] If insufficient shards, toast: "Not enough Sprinkle Shards! Need 50."
- [ ] If successful, toast: "A new Buddy Donut orbits your empire!"
- [ ] Income increases (each buddy = +5%)
- [ ] Create multiple buddies and verify cumulative +5% per buddy

### World Ascension (Layer 3)
- [ ] After first Buddy is created, "World Ascension" unlocks
- [ ] Topbar shows world selector or dedicated UI
- [ ] Clicking switches between worlds (Bakery → Park → Space Station)
- [ ] Visuals should differ per world (background color, tile theme)
- [ ] Each world reset carries forward shards/buddies

### Mini-Donut Swarm
- [ ] Tier 3+ word-cards spawn mini-donuts (currently: visual counter, not animated)
- [ ] Check `state.miniDonuts` in Console: increases with milestones
- [ ] Verify income bonus: each mini-donut adds +0.1% to final rate

### Donut DNA Collection
- [ ] Top-right "Collection" button opens a modal
- [ ] After first evolution, modal shows entry: "🍩 Evolved to Chocolate Donut"
- [ ] After creating a buddy, shows: "👥 Created Chocolate + Strawberry Buddy Donut"
- [ ] All entries persistent across saves

---

## Phase 4: Wildcard Mechanics

### Health Inspector Minigame
- [ ] Play the game for 2+ minutes (let time pass)
- [ ] Randomly, a red banner appears: "🚨 HEALTH INSPECTOR INCOMING!"
- [ ] 3 buttons: Clean 1, Clean 2, Clean 3
- [ ] Tap all 3 within 15 seconds
- [ ] Success: "BAKED IN!" word-card, coin bonus, banner vanishes
- [ ] Let time expire (don't tap): "BUSTED! 🚨" word-card, coin fine applied

### Bakery Radio Ticker
- [ ] At top of shop, a ticker line appears
- [ ] Line changes every 30 seconds
- [ ] Examples: "Traffic update", "Your empire generates X coins", "Rival unlocked flavor"
- [ ] Tone should be ambient/conversational (not intrusive)

### Donut DNA Collection
- [ ] (Covered in Phase 3 above)
- [ ] Verify persistent across hard refresh

### Frosting Wars Rival
- [ ] Open Console, check `state.rivalPaceState`
- [ ] Play for several minutes, check rival's coin count (should be ~80% of player)
- [ ] Occasionally, banner appears: "👻 Glenda's Glazed Goods just unlocked Flavor!"
- [ ] Compare rival flavor unlocks to player progress (should lag behind)

---

## Save & Load

### Hard Save
- [ ] Play for a few minutes, trigger some word-cards
- [ ] Close and reopen the page
- [ ] Verify coins, generators, upgrades all restored
- [ ] Verify flavor, shards, buddies all restored
- [ ] Verify offline income was applied (banner appears)

### Offline Income
- [ ] Start the game, build up a generator (10+ units of one type)
- [ ] Close the tab completely
- [ ] Wait 5 minutes
- [ ] Reopen the game
- [ ] Welcome-back banner should show: "🍩 You earned X coins while away (5 min)."

---

## UI/UX Quality

### Responsive Design
- [ ] Desktop (1200px+): 2-column layout (donut + shop)
- [ ] Tablet (820px–1200px): stacked layout
- [ ] Mobile (< 600px): single column, tabs wrap, donut smaller
- [ ] All buttons clickable on touch devices

### Animations
- [ ] Word-cards smoothly scale + rotate + fade
- [ ] Donut squishes on click
- [ ] Sprinkles fall from top on click
- [ ] Particles burst from click point
- [ ] Ripple ring expands on click
- [ ] Buff aura pulses smoothly

### Accessibility
- [ ] Tab through buttons with keyboard (Tab key)
- [ ] Confirm modal can be dismissed with Escape
- [ ] Volume slider works
- [ ] Mute button toggles 🔊 ↔ 🔇

---

## Digger Game (UI Modernization)

### Text Readability
- [ ] Open `games/digger/index.html`
- [ ] Check all white-background badges/chips: text should be dark (#1a1a1a)
- [ ] Hover states should be visually distinct (no white-on-white)

### Modern Styling
- [ ] Badges have subtle blur effect (glassmorphism)
- [ ] Buttons have gradient backgrounds (gold → orange)
- [ ] Rounded corners on list items are smooth (12px)
- [ ] Hover animations are smooth and spring-like
- [ ] Color palette is vibrant and contemporary

---

## Console Checks

Open DevTools Console (F12) and paste:

```javascript
// Check Donut Empire state
console.log('Current flavor:', state.currentFlavor);
console.log('Total coins earned:', fmt(state.totalEarned));
console.log('Sprinkle Shards:', state.sprinkleShardsEarned);
console.log('Buddy Donuts:', state.buddyDonuts);
console.log('Mini-Donuts:', state.miniDonuts);
console.log('Donut DNA entries:', state.donutDNA.length);
console.log('Click power (with buff):', getClickPowerWithBuff());
console.log('Total rate (with all bonuses):', fmt(totalRate()));
```

---

## Known Limitations (Future Work)

1. **Synergies tab** is placeholder; no upgrades currently available
2. **World themes** are not visually distinct yet (all worlds look the same)
3. **Mini-donuts** are counted, not visually animated in an orbit
4. **Radio ticker** one-liners could be expanded with more dynamic content
5. **Rival pace** is simple linear calculation; could add variance/surprises

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Word-cards don't appear | Check console for errors; verify `fireWordCard()` is called |
| Tabs don't switch | Clear cache, hard refresh (Ctrl+Shift+R) |
| Game doesn't load | Verify all shared JS files are present in `/shared/js/` |
| Save doesn't restore | Check browser localStorage is not disabled |
| Donut doesn't have buff glow | Verify CSS class `.has-buff` is applied; check filters are enabled |
| Mobile layout broken | Check viewport meta tag in HTML; test on actual mobile device |

---

## Sign-Off

Once you've verified all checkboxes, the implementation is **production-ready**. If any issues arise, check the browser console for specific error messages.

**Good luck, and enjoy your groundbreaking Donut Empire!** 🍩✨
