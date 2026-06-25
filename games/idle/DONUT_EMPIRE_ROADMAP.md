# Donut Empire — Groundbreaking Feature Roadmap & Design Document

*Strictly a design document. No code included. Codebase audited as of this writing: [idle.js](js/idle.js) (452 lines), [index.html](index.html), [style.css](style.css) — 8 generators, 5 click upgrades, flat unsorted shop list, sprinkle-rain click feedback, no prestige layer, offline-earnings cap at 8h.*

---

## 1. Research Findings

### 1.1 The 1966 Batman "Fight Balloon" Effect
The show's onomatopoeia ("POW!", "BAM!", "KAPOW!", lesser-known ones like "ZOK!", "URKK!", "THWACK!") were never just decoration — they were a **budget hack that became an art style**. Season 1 placed them *behind* the actors; producers realized full-screen word cards were cheaper to produce and reused them across episodes. The lesson for us: a small reusable library of "word cards" (text + background flash + camera shake) is cheap to build and gets *more* charming with repetition, not less — it became the show's signature precisely because it recurred. Source: [66batmania.com](https://www.66batmania.com/trivia/bat-fight-words/), [methodshop.com](https://methodshop.com/batman-fight-words/).

**Design takeaway:** treat onomatopoeia as a *named system* with its own escalating tiers (small hit → big hit → milestone → record-breaker), not a single one-off animation.

### 1.2 Modern Idle UI at Scale
Cookie Clicker manages **716 upgrades** by tiering them to specific buildings ("Plain", "Sugar-coated", "Amethyst" tiers unlock as you own more of a building) and by introducing **Synergy Upgrades** late-game that make buildings buff each other — turning a wall of purchases into a web of interacting systems instead of a linear list. Source: [cookieclicker.wiki.gg](https://cookieclicker.wiki.gg/wiki/Upgrades). Realm Grinder structures its entire late-game around a **binary faction choice** (Good vs Evil at ~30 min in) that reshapes which upgrades are even visible — a strong pattern for cutting down a wall of choices into a *curated* one. Source: [pinkcrow.net](https://pinkcrow.net/game-idea/the-best-incremental-games-for-prestige-automation-fans/).

**Design takeaway:** the fix for "too many upgrades" isn't a longer scrollbar, it's *segmentation* (tabs/tiers) + *filtering by relevance* (hide what you can't afford soon) + *synergy* (so late upgrades change how you read earlier ones, instead of just adding more rows).

### 1.3 Prestige Beyond the Flat Multiplier
The genre's current direction treats a prestige reset as **a narrative beat, not a punishment** — "a civilizational collapse, a cosmological restart, or a moment of genuine choice" rather than a number going to zero. Clicker Heroes solved "resets feel bad" by stacking *layered* prestige systems (Ascension → Hero Souls, Transcension → Ancient Souls), each layer adding new mechanics rather than just multiplying the old ones. Source: [blog.clickerheroes.com](https://blog.clickerheroes.com/ascension-in-clicker-heroes-the-ultimate-guide/), [pinkcrow.net](https://pinkcrow.net/game-idea/the-best-incremental-games-for-prestige-automation-fans/).

**Design takeaway:** Donut Empire's prestige reset needs (a) an in-universe *reason* tied to the donut's evolution lore, (b) a persistent currency/collection that survives reset and is *qualitatively* different from coins, and (c) each prestige tier should unlock a new mechanic, not just bigger numbers.

---

## 2. Feature Blueprints

### 2.1 Dynamic Milestone Feedback — "The Bat-Glaze Effect"

**Current state:** [idle.js:216-251](js/idle.js#L216-L251) only has sprinkle rain on every click — no escalation, no milestone awareness, same effect at coin #1 and coin #1,000,000,000.

**The system, fully fleshed out:**

A tiered **Word-Card Engine** that fires full-screen, comic-panel-style text cards at meaningful moments, escalating in size/screen-shake/sound as the trigger gets bigger.

| Tier | Trigger examples | Visual treatment | Words (donut-themed) |
|---|---|---|---|
| **Tier 1 — Tap** | Every Nth click (e.g. every 10th), small streaks | Small card near cursor, quick fade, no shake | "POP!", "GLAZE!", "NIBBLE!" |
| **Tier 2 — Combo** | Click streak within a time window (rapid-fire clicking) | Card grows with streak count, mild screen shake | "SUGAR RUSH!", "DOUGH-NADO!", "FROSTED FRENZY!" |
| **Tier 3 — Purchase milestone** | Buying a generator's 10th/25th/50th/100th unit | Card + the generator's row pulses gold | "KA-DOUGH!", "BAKED IN!", "RISE & GRIND!" |
| **Tier 4 — Threshold/record** | Crossing a coin order-of-magnitude you've never reached, first-ever generator type bought | Full-screen flash, comic halftone-dot background, retro color bands | "HOLY SPRINKLES!", "DONUT-PALOOZA!", "BATTER UP!" |
| **Tier 5 — Prestige-tier event** | Evolving the donut, ascending (see 2.3) | Cinematic full-screen takeover, slow-mo, unique one-time card per evolution | "GLAZE ASCENDANT!", "THE GREAT RISING!" |

**Making it interactive, not just visual — the "Buff Pop":**
Each word-card *can* carry a small functional payload, turning feedback into reward:
- **"SUGAR RUSH!"** (Tier 2 combo card) — grants a **temporary click-power buff** (e.g. ×2 for 8 seconds) that the player can *see ticking down* as a border around the card. This converts a feedback moment into an active-play incentive: players are rewarded for *engaging* with clicking, not just walking away to let generators run.
- **"KA-DOUGH!"** (Tier 3 purchase milestone) — spawns a **clickable bonus icon** for ~3 seconds that, if tapped, grants a one-time coin burst (an "Easter egg" reward layered onto the card itself, encouraging the player's eyes to stay on screen near reward moments).
- **"HOLY SPRINKLES!"** (Tier 4 record) — unlocks a **lore snippet** (see 2.3's Idle Narrative) tied to the specific threshold crossed, e.g. crossing 1 billion lifetime coins unlocks a one-line story beat about the donut's rise to fame.

**Scalability rule:** word-card *text* is data-driven (a simple array of `{trigger, tier, text, payload}` entries), so adding 50 more donut puns later is a content change, never a code change — directly mirroring how the original Batman show reused a small set of word-card image templates across hundreds of fight beats.

---

### 2.2 Generators Menu UI/UX Overhaul

**Current state:** [idle.js:114-176](js/idle.js#L114-L176) renders one flat `<div id="shop-items">` with a "Generators" header then a "Click Upgrades" header — no tabs, no filtering, and at 8 generators + 5 upgrades it's already losing visual hierarchy; at 100+ it would be unusable.

**The redesign — Tabbed Categories + Smart Filtering:**

**Tab structure** (matches the brief's categories, expanded):
1. **🍩 Bakers** (passive generators — renamed from "Generators" for flavor; today's 8 items live here, room for 100+)
2. **👆 Click Multipliers** (today's "Click Upgrades" — direct click power)
3. **⚡ Short Boosts** *(new)* — consumable/timed buffs purchased with coins (e.g. "Double rate for 60s") — gives the coin sink something to do between generator purchases, a classic clicker pacing tool
4. **🤖 Clickerinos** *(new, from the brief)* — automation upgrades that simulate clicks for you (auto-clicker per second, separate from passive generator income — this is its own resource sink because it scales differently: cost based on *clicks/sec* not *coins/sec*)
5. **🌟 Synergies** *(new, unlocks late)* — cross-category upgrades, mirroring Cookie Clicker's late-game synergy tier (e.g. "Every 10 Bakers owned adds +1% to Clickerino speed")

**Scalability mechanisms for 100+ items per tab:**
- **Sub-tier grouping within a tab** (Cookie Clicker pattern): once a Baker category has 15+ generators, auto-split into collapsible tiers ("Tier I: Kitchen", "Tier II: Industrial", "Tier III: Cosmic") based on unlock thresholds already defined by `unlockAt` — this is *free* given the existing data shape, just needs a grouping key.
- **"Next Up" smart filter** (default view): rather than showing every owned + unowned item, default each tab to showing only owned items + the next 2-3 affordable/near-affordable items, with a "Show All" toggle — solves the "endless scroll" problem at the UX layer without removing player agency.
- **Sticky tab header with live badges**: each tab icon shows a small pip/badge when something new is affordable or newly unlocked in that category, so players don't need to manually check 5 tabs every session — directly addresses "I forgot upgrades existed" fatigue common in flat-list idle UIs.
- **Search/sort control**: a simple text filter + sort-by (cost / output / "best value" — coins-per-second-per-coin-spent) becomes essential once item count crosses ~30; cheap to add, huge UX payoff at scale.

---

### 2.3 The "Next World" / Prestige / Evolution System — "The Glaze Ascension"

**Current state:** no prestige mechanic exists at all today; `state.totalEarned` is only used to gate generator unlocks, never reset.

**Lore hook:** the plain donut isn't just leveling up — it's **achieving Donut Sentience**, and each prestige is a literal evolution of the donut's form, narrated as the donut's own rise from a corner bakery to a multiversal pastry empire. This reframes the reset from "you lost your progress" to **"your donut transcended its old body"** — directly applying the research finding that resets should be narrative beats, not punishments.

**Structure — three layered prestige systems, each adding a *new mechanic*, not just a bigger multiplier:**

| Layer | Name | Trigger | What resets | What persists & what's NEW |
|---|---|---|---|---|
| **Layer 1** | **Flavor Evolution** | Reach a lifetime-coins threshold, choose to "Evolve" | Coins, generators, click upgrades | Persistent currency: **Sprinkle Shards** (based on lifetime coins earned this run). Donut visually changes (Plain → Chocolate → Strawberry → ...). Each flavor grants a small passive perk (Chocolate = +X% generator output; Strawberry = +X% click power) |
| **Layer 2** | **Flavor Fusion** | Unlock after 3+ flavor evolutions | Everything from Layer 1 + Sprinkle Shard *spending* | New mechanic: **combine two owned flavors into a Buddy Donut** (e.g. Strawberry + Chocolate = "Neapolitan Buddy") that sits beside the main donut and contributes its own passive click/generator bonus permanently — this is the brief's "getting a buddy" idea elevated into a real system with combinatorial depth (N flavors → N-choose-2 buddy combos, each with unique flavor-text and a distinct bonus, giving long-tail content for free) |
| **Layer 3** | **World Ascension** | Unlock after first Buddy is formed | Everything from Layers 1-2 | New mechanic: **leave the bakery, enter a new World** (Park, City, Space Station, etc.) — each World has its own generator set, its own visual theme, and a "World Bonus" that's permanent once unlocked. This is the "Next World" framing from the brief, built as the *deepest*, rarest reset, reserved for serious long-term players |

**Mini-donut spawning** (brief's idea, expanded): once a Buddy Donut exists, every Tier-3+ word-card milestone (2.1) has a chance to spawn a **mini-donut** that orbits the main donut visually and adds a tiny permanent click-power tick. Mini-donuts accumulate as a visible swarm — the screen *physically fills up* with little donuts circling the player's empire, which is itself the "visual progression reward" the brief asks for: success is something you can *see*, not just read in a number.

**Why this avoids "prestige fatigue":** each layer is optional and meaningfully different — a player who only ever does Layer 1 resets still gets visual variety (flavor changes) and passive bonuses; a player who pushes to Layer 3 gets a genuinely different game board. No layer is "just multiply everything by 2 again."

---

## 3. The "Out-of-the-Box" Pitch — 4 Wild Mechanics You Didn't Ask For

### 3.1 "The Health Inspector" — a recurring soft-antagonist minigame
Every so often (randomized, escalating with empire size), a **Health Inspector** shows up as a banner event. The player has ~15 seconds to tap a sequence of "clean up" icons (sweep crumbs, hide the illegal extra fryer) in a tiny reflex minigame. Success = a temporary income/click buff and a funny word-card ("PASSED WITH FLYING SPRINKLES!"); failure = a brief, low-stakes fine (small coin deduction, never devastating) and a comedic word-card ("BUSTED! 🚨"). This is a **sub-mechanic minigame** that breaks up the idle loop exactly as requested, adds light stakes without punishing AFK players (it simply doesn't fire while the tab's backgrounded), and gives the onomatopoeia system a *comedic villain* to play off of.

### 3.2 "Donut DNA" — a meta-collection layer across runs
Every time a Buddy Donut or new World is unlocked (2.3), the player permanently collects a **"Donut DNA" card** for it (think a Pokédex of flavors/worlds) — viewable in a dedicated collection screen, with full art, a flavor-text lore blurb, and the exact run-stats of when it was first achieved (date, total clicks, time-to-unlock). This costs almost nothing to build (it's just an append-only log of evolution events that already happen) but gives completionist players a *second, permanent goalpost* that survives every prestige forever, and turns "I unlocked Strawberry-Chocolate Buddy three months ago" into a thing the player can revisit and feel proud of.

### 3.3 "Bakery Radio" — idle narrative delivered as overheard dialogue
Instead of a traditional "story log," ambient, infrequent **one-line radio chatter** appears in a small ticker (like a news crawl) — overheard customer comments, rival bakery gossip, or your own staff talking about the empire's scale ("customer: *did you hear the bakery on 5th now has a ROCKET?*"). Lines are keyed to game state (generator counts, prestige tier, time-of-day even) so the world *reacts* to what the player has actually built, without requiring a single cutscene or reading a wall of text — this is the "idle narrative while away" requirement solved with the cheapest possible content format (one-liners), while still making the empire feel alive and observed.

### 3.4 "Frosting Wars" — asynchronous soft-competitive flavor leaderboard
Without needing a server or real multiplayer infrastructure, generate a **locally-seeded "rival bakery"** (a deterministic AI ghost, e.g. "Glenda's Glazed Goods") that's always running slightly ahead or behind the player's own historical pace (computed from the player's own save timestamps across sessions). A small persistent banner shows "Glenda just unlocked her 4th flavor!" as a soft nudge — competitive flavor without the technical or scope cost of real multiplayer, and it's an extremely natural home for *more* onomatopoeia ("Glenda's bakery went KABOOM! She's resetting — you're back in the lead!").

---

## 4. Development Roadmap (Phased TODO)

### Phase 1 — Quick Wins (Bat-Glaze Effect MVP)
- [ ] Build the **Word-Card Engine** as a standalone, data-driven module (trigger type → tier → text → optional payload)
- [ ] Wire Tier 1 (every-Nth-click) and Tier 3 (generator purchase milestones: 10/25/50/100 owned) triggers using existing `state.clicks` and `state.generators[g.id]` counts — no new state needed
- [ ] Add Tier 4 (lifetime coin order-of-magnitude crossed) using existing `state.totalEarned`
- [ ] Write the donut-pun word list (expand "GLAZE!", "KA-DOUGH!", "SUGAR RUSH!" etc. into a full content table, ~30-40 entries across tiers)
- [ ] Add the Tier 2 "Sugar Rush" combo-buff payload (temporary click-power multiplier with visible countdown)
- [ ] Playtest pacing — make sure word-cards don't fire so often they become noise (tune thresholds)

### Phase 2 — UI/UX Overhaul (Shop Restructure)
- [ ] Design tab bar: 🍩 Bakers / 👆 Click Multipliers / ⚡ Short Boosts / 🤖 Clickerinos / 🌟 Synergies
- [ ] Migrate existing `GENERATORS` → Bakers tab, `UPGRADES` → Click Multipliers tab (no data loss, pure UI re-skin first)
- [ ] Build the "Next Up" smart filter (default collapsed view, "Show All" toggle) per tab
- [ ] Add sub-tier grouping within Bakers tab (group by existing `unlockAt` bands)
- [ ] Implement tab badge/pip system for "something new is affordable" notifications
- [ ] Design and add the new Short Boosts tab content (timed consumable buffs)
- [ ] Design and add the new Clickerinos tab content (auto-clicker upgrades, separate scaling curve from passive generators)
- [ ] Add sort/filter control (by cost, output, best-value) once item count justifies it

### Phase 3 — Prestige System (The Glaze Ascension)
- [ ] Define Layer 1 "Flavor Evolution": threshold formula, Sprinkle Shard currency, first 3-4 flavor visual/perk definitions
- [ ] Build the evolve-reset flow (confirmation modal, what resets vs persists, Tier 5 word-card cinematic moment)
- [ ] Visual asset pass: donut sprite variants per flavor (Chocolate, Strawberry, etc.)
- [ ] Define Layer 2 "Flavor Fusion": Buddy Donut combination logic, per-combo bonus table, Buddy visual placement on screen
- [ ] Define Layer 3 "World Ascension": first new World (Park?), its own generator set, world-swap visual treatment
- [ ] Mini-donut swarm system: spawn conditions, visual orbit behavior, cumulative tiny click-power bonus
- [ ] Balance pass across all three layers so early prestige isn't mandatory but is clearly attractive

### Phase 4 — Wildcard Mechanics
- [ ] **Health Inspector minigame**: trigger cadence, reflex-tap UI, success/fail word-card hooks, fairness tuning (never punishing AFK players)
- [ ] **Donut DNA collection screen**: append-only unlock log → dedicated gallery UI, lore blurb content pass
- [ ] **Bakery Radio ticker**: state-keyed one-liner content bank, ticker UI component, trigger cadence tuning
- [ ] **Frosting Wars rival**: deterministic ghost-pace algorithm from save history, banner UI, comedic event hooks tying back into the Word-Card Engine from Phase 1

---

## Summary

The throughline across all four phases: **everything new plugs into the Word-Card Engine and the existing data-driven generator/upgrade pattern already used in [idle.js](js/idle.js)** — nothing here requires an architecture rewrite, only additive systems layered on top of what's already a clean, well-separated codebase (state / render / actions / tick / save are already cleanly split). The riskiest and highest-payoff piece is Phase 3 (prestige) since it's the first system that touches *resets*; the rest are purely additive and can ship incrementally without ever breaking an existing save.
