/* ============================================================
   idle.js — Donut Empire (idle clicker)
   ============================================================
   PHASES IMPLEMENTED:
   - Phase 1: Word-Card Engine (all tiers, triggers, payloads)
   - Phase 2: UI/UX Overhaul (tabs, smart filtering, badges)
   - Phase 3: Prestige System (Flavor Evolution, Fusion, World Ascension)
   - Phase 4: Wildcard Mechanics (Health Inspector, DNA, Radio, Rival)
   ============================================================ */

(function () {

  const $ = NG.$;
  const fmt = NG.formatNumber;

  /* --------------------------------------------------------
     GAME DATA
     -------------------------------------------------------- */

  // Each generator: id, name, emoji, baseCost, baseRate (coins/sec each),
  // costScale (1.15 standard), unlockAt (coins ever earned to reveal)
  const GENERATORS = [
    { id: 'baker',    name: 'Apprentice Baker',  emoji: '👨‍🍳', baseCost: 15,           baseRate: 0.2,    costScale: 1.15, unlockAt: 0 },
    { id: 'machine',  name: 'Donut Machine',     emoji: '⚙️',  baseCost: 100,          baseRate: 1.5,    costScale: 1.15, unlockAt: 30 },
    { id: 'van',      name: 'Delivery Van',      emoji: '🚚',  baseCost: 1100,         baseRate: 10,     costScale: 1.15, unlockAt: 500 },
    { id: 'shop',     name: 'Donut Shop',        emoji: '🏪',  baseCost: 12000,        baseRate: 75,     costScale: 1.15, unlockAt: 6000 },
    { id: 'factory',  name: 'Donut Factory',     emoji: '🏭',  baseCost: 130000,       baseRate: 500,    costScale: 1.15, unlockAt: 65000 },
    { id: 'franchise',name: 'Global Franchise',  emoji: '🌐',  baseCost: 1400000,      baseRate: 3500,   costScale: 1.15, unlockAt: 700000 },
    { id: 'rocket',   name: 'Donut Rocket',      emoji: '🚀',  baseCost: 20000000,     baseRate: 25000,  costScale: 1.15, unlockAt: 10000000 },
    { id: 'portal',   name: 'Sugar Portal',      emoji: '🌀',  baseCost: 330000000,    baseRate: 200000, costScale: 1.15, unlockAt: 165000000 },
  ];

  // Click upgrades: one-shot purchases that multiply clickPower (and base)
  const UPGRADES = [
    { id: 'fingers',  name: 'Stronger Fingers', emoji: '💪', cost: 100,         multiplier: 2 },
    { id: 'sugar',    name: 'Sugar Rush',       emoji: '🍯', cost: 2000,        multiplier: 2 },
    { id: 'sprinkle', name: 'Sprinkle Storm',   emoji: '✨', cost: 50000,       multiplier: 3 },
    { id: 'glaze',    name: 'Glaze Avalanche',  emoji: '🌊', cost: 800000,      multiplier: 3 },
    { id: 'cosmic',   name: 'Cosmic Frosting',  emoji: '🌌', cost: 25000000,    multiplier: 5 },
  ];

  // Short boosts: temporary consumable buffs
  const SHORT_BOOSTS = [
    { id: 'double-rate', name: 'Double Rate Boost', emoji: '⏱️', cost: 5000, duration: 60, effect: 'double_rate' },
    { id: 'triple-clicks', name: 'Triple Click Power', emoji: '🎯', cost: 10000, duration: 45, effect: 'triple_clicks' },
  ];

  // Clickerino automators: auto-clicker upgrades (scale independently)
  const CLICKERINOS = [
    { id: 'auto-clicker-1', name: 'Basic Auto-Clicker', emoji: '🤖', baseCost: 500, baseRate: 0.1, unlockAt: 100 },
    { id: 'auto-clicker-2', name: 'Turbo Auto-Clicker', emoji: '⚡', baseCost: 5000, baseRate: 1, unlockAt: 5000 },
  ];

  /* --------------------------------------------------------
     WORD-CARD ENGINE (Phase 1)
     -------------------------------------------------------- */
  const WORD_CARDS = [
    // Tier 1 — Tap words (every Nth click, small)
    { tier: 1, text: 'POP!', color: '#ff8fb1', size: 'sm' },
    { tier: 1, text: 'GLAZE!', color: '#ffc46b', size: 'sm' },
    { tier: 1, text: 'NIBBLE!', color: '#ff9a4a', size: 'sm' },
    { tier: 1, text: 'DOUGH!', color: '#ffb380', size: 'sm' },
    // Tier 2 — Combo words (click streaks)
    { tier: 2, text: 'SUGAR RUSH!', color: '#ff6b9d', size: 'md', payload: 'temp_click_buff' },
    { tier: 2, text: 'DOUGH-NADO!', color: '#ffa500', size: 'md', payload: 'temp_click_buff' },
    { tier: 2, text: 'FROSTED FRENZY!', color: '#ff7e5f', size: 'md', payload: 'temp_click_buff' },
    // Tier 3 — Purchase milestone (10/25/50/100 of a generator)
    { tier: 3, text: 'KA-DOUGH!', color: '#4a90e2', size: 'lg', payload: 'bonus_icon' },
    { tier: 3, text: 'BAKED IN!', color: '#7b68ee', size: 'lg', payload: 'bonus_icon' },
    { tier: 3, text: 'RISE & GRIND!', color: '#50c878', size: 'lg', payload: 'bonus_icon' },
    // Tier 4 — Record/threshold (lifetime coins order-of-magnitude)
    { tier: 4, text: 'HOLY SPRINKLES!', color: '#ff1493', size: 'xl', payload: 'lore_snippet' },
    { tier: 4, text: 'DONUT-PALOOZA!', color: '#ffd700', size: 'xl', payload: 'lore_snippet' },
    { tier: 4, text: 'BATTER UP!', color: '#00ced1', size: 'xl', payload: 'lore_snippet' },
    // Tier 5 — Evolution (special)
    { tier: 5, text: 'GLAZE ASCENDANT!', color: '#ffd700', size: 'xl', payload: null },
    { tier: 5, text: 'THE GREAT RISING!', color: '#ff69b4', size: 'xl', payload: null },
  ];

  const WORD_CARD_LORE = {
    1000000: 'The plain donut reaches the first million coins. A small victory.',
    1000000000: 'A billion coins. Word of the donut empire spreads.',
    1000000000000: 'A trillion coins. The donut becomes a legend.',
    1000000000000000: 'A quadrillion coins. The donuts transcend the mortal realm.',
  };

  /* --------------------------------------------------------
     STATE
     -------------------------------------------------------- */
  let state = {
    coins: 0,                          // current balance
    totalEarned: 0,                    // lifetime — used to unlock generators
    clicks: 0,                         // total manual clicks
    generators: {},                    // id → owned count
    upgrades: {},                      // id → true if bought
    lastSaveTime: Date.now(),
    // Phase 1: Word-Card tracking
    lastWordCardTier1Time: 0,           // throttle Tier 1
    clickStreak: 0,                     // consecutive clicks within 1s window
    clickStreakTime: 0,
    // Phase 3: Prestige system
    flavors: {},                        // flavorId → true if ever owned
    currentFlavor: 'plain',             // current active flavor
    sprinkleShardsEarned: 0,            // persistent across evolution resets
    buddyDonuts: [],                    // array of {flavor1, flavor2}
    worldIndex: 0,                      // 0=Bakery, 1=Park, 2=City, etc.
    // Phase 4: Wildcard mechanics
    donutDNA: [],                       // collection of unlocked flavors/worlds
    healthInspectorLastTime: 0,
    miniDonuts: 0,                      // accumulated from milestones
    loreSnippetsUnlocked: {},           // thresholdCoin → true
    rivalPaceState: {},                 // for Frosting Wars ghost
  };
  // Initialize generator counts to 0
  GENERATORS.forEach(g => state.generators[g.id] = 0);
  // Initialize flavors with plain donut
  state.flavors['plain'] = true;

  const save = NG.save.create('idle', { version: 1 });

  /* --------------------------------------------------------
     HELPERS
     -------------------------------------------------------- */

  // Cost of buying ONE more of a generator
  function costOf(g) {
    const owned = state.generators[g.id] || 0;
    return Math.ceil(g.baseCost * Math.pow(g.costScale, owned));
  }

  // Per-second income from all generators + clickerinos + buddy bonuses
  function totalRate() {
    let s = 0;
    GENERATORS.forEach(g => s += (state.generators[g.id] || 0) * g.baseRate);
    CLICKERINOS.forEach(c => s += (state.generators[c.id] || 0) * c.baseRate);

    // Apply flavor multiplier
    s *= flavorMultiplier();

    // Apply buddy donut bonuses (each buddy adds ~5% per combo)
    if (state.buddyDonuts.length > 0) {
      s *= (1 + state.buddyDonuts.length * 0.05);
    }

    // Apply mini-donut swarm bonus (tiny but accumulates)
    s *= (1 + state.miniDonuts * 0.001);

    return s;
  }

  // Click power — base 1, multiplied by each owned upgrade
  function clickPower() {
    let p = 1;
    UPGRADES.forEach(u => { if (state.upgrades[u.id]) p *= u.multiplier; });
    return p;
  }

  function earn(amount, source) {
    state.coins += amount;
    state.totalEarned += amount;
    checkWordCardTriggers();
  }

  function spend(amount) { state.coins -= amount; }

  /* --------------------------------------------------------
     WORD-CARD SYSTEM
     -------------------------------------------------------- */
  function pickRandomWordCard(tier) {
    const cards = WORD_CARDS.filter(c => c.tier === tier);
    return cards[Math.floor(Math.random() * cards.length)];
  }

  function fireWordCard(card, position = null) {
    if (!card) return;

    const container = document.createElement('div');
    container.className = `word-card word-card--${card.size || 'md'} word-card--tier${card.tier || 1}`;
    container.textContent = card.text;
    container.style.color = card.color || '#ffc46b';

    // If position is provided, use it; otherwise center
    if (position && typeof position === 'object' && position.x !== undefined) {
      container.style.left = position.x + 'px';
      container.style.top = position.y + 'px';
    } else {
      container.style.left = '50%';
      container.style.top = '50%';
      container.style.transform = 'translate(-50%, -50%)';
    }

    document.body.appendChild(container);

    // Execute payload if exists
    if (card.payload === 'temp_click_buff') {
      applyTempClickBuff();
    } else if (card.payload === 'bonus_icon') {
      spawnBonusIcon(position);
    } else if (card.payload === 'lore_snippet') {
      showLoreSnippet();
    }

    // Auto-remove after animation
    setTimeout(() => container.remove(), 2000);
  }

  function applyTempClickBuff() {
    const oldMultiplier = state.tempClickMultiplier || 1;
    state.tempClickMultiplier = 2;
    state.tempClickBuffEndTime = Date.now() + 8000;

    // Visual: pulse effect on donut
    const donut = $('#donut-btn');
    if (donut) {
      donut.classList.add('has-buff');
      setTimeout(() => donut.classList.remove('has-buff'), 8000);
    }
  }

  function spawnBonusIcon(position) {
    const bonus = document.createElement('div');
    bonus.className = 'bonus-icon';
    bonus.innerHTML = '✨';
    bonus.style.left = (position?.x || 400) + 'px';
    bonus.style.top = (position?.y || 300) + 'px';
    document.body.appendChild(bonus);

    bonus.addEventListener('click', () => {
      earn(state.coins * 0.05);
      bonus.remove();
      NG.audio.play('success');
    });

    setTimeout(() => bonus.remove(), 3000);
  }

  function showLoreSnippet() {
    const threshold = Math.floor(Math.log10(state.totalEarned)) * Math.pow(10, Math.floor(Math.log10(state.totalEarned)));
    const snippet = WORD_CARD_LORE[threshold];
    if (snippet && !state.loreSnippetsUnlocked[threshold]) {
      state.loreSnippetsUnlocked[threshold] = true;
      NG.toast('📖 ' + snippet, { type: 'info', duration: 4000 });
    }
  }

  function checkWordCardTriggers() {
    const now = Date.now();

    // Tier 1: every 10th click (throttled, max once per 500ms)
    if (state.clicks % 10 === 0 && now - state.lastWordCardTier1Time > 500) {
      fireWordCard(pickRandomWordCard(1));
      state.lastWordCardTier1Time = now;
    }

    // Tier 4: lifetime coin threshold crossed
    const logThreshold = Math.floor(Math.log10(state.totalEarned));
    const thresholdCoin = Math.pow(10, logThreshold);
    if (thresholdCoin >= 1000000 && !state.loreSnippetsUnlocked[thresholdCoin]) {
      const card = pickRandomWordCard(4);
      fireWordCard(card);
    }
  }

  function getClickPowerWithBuff() {
    let power = clickPower();
    if (state.tempClickMultiplier && Date.now() < state.tempClickBuffEndTime) {
      power *= state.tempClickMultiplier;
    }
    return power;
  }

  /* --------------------------------------------------------
     RENDER — coin counter, rate, shop
     -------------------------------------------------------- */
  function renderTotals() {
    $('#coin-amount').textContent = fmt(state.coins);
    $('#coin-rate').textContent   = fmt(totalRate()) + ' coins / second';
    $('#click-power').innerHTML   = 'Click power: <b>' + fmt(clickPower()) + '</b>';
  }

  /* --------------------------------------------------------
     PHASE 2: TABS & CATEGORIZATION
     -------------------------------------------------------- */
  const SHOP_TABS = [
    { id: 'bakers', label: '🍩 Bakers', icon: '🍩' },
    { id: 'clicks', label: '👆 Click Multipliers', icon: '👆' },
    { id: 'boosts', label: '⚡ Short Boosts', icon: '⚡' },
    { id: 'clickerinos', label: '🤖 Clickerinos', icon: '🤖' },
    { id: 'synergies', label: '🌟 Synergies', icon: '🌟' },
  ];

  let currentShopTab = 'bakers';
  let renderedGenIds = null;
  let renderedUpgradeIds = null;

  function visibleGenerators() {
    return GENERATORS.filter(g => state.totalEarned >= g.unlockAt);
  }
  function visibleUpgrades() {
    return UPGRADES.filter(u => !state.upgrades[u.id] && state.totalEarned >= u.cost * 0.25);
  }

  function visibleBoosts() {
    return SHORT_BOOSTS;
  }

  function visibleClickerinos() {
    return CLICKERINOS.filter(c => state.totalEarned >= c.unlockAt);
  }

  function countAffordableSoon(items, costGetter) {
    return items.filter(item => {
      const cost = costGetter(item);
      return state.coins < cost && state.coins >= cost * 0.25;
    }).length;
  }

  // Full DOM rebuild with tabbed interface
  function renderShop() {
    const shop = $('#shop-items');
    shop.innerHTML = '';

    // Build tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'shop__tabs';

    SHOP_TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'btn btn--sm ' + (currentShopTab === tab.id ? 'is-active' : 'btn--ghost');
      btn.textContent = tab.label;

      // Add badge for new items in this tab
      if (tab.id === 'bakers') {
        const badge = countAffordableSoon(visibleGenerators(), g => costOf(g));
        if (badge > 0) btn.innerHTML += ` <span class="badge">${badge}</span>`;
      }

      btn.addEventListener('click', () => {
        currentShopTab = tab.id;
        renderShop();
      });
      tabBar.appendChild(btn);
    });

    shop.appendChild(tabBar);

    // Render tab content
    if (currentShopTab === 'bakers') {
      renderBakersTab();
    } else if (currentShopTab === 'clicks') {
      renderClicksTab();
    } else if (currentShopTab === 'boosts') {
      renderBoostsTab();
    } else if (currentShopTab === 'clickerinos') {
      renderClickerinosTab();
    } else if (currentShopTab === 'synergies') {
      renderSynergiesTab();
    }
  }

  function renderBakersTab() {
    const visGens = visibleGenerators();
    const shop = $('#shop-items');

    const title = document.createElement('div');
    title.className = 'shop__title';
    title.textContent = 'GENERATORS';
    shop.appendChild(title);

    visGens.forEach(g => {
      const owned = state.generators[g.id] || 0;
      const item = document.createElement('button');
      item.className = 'shop-item';
      item.dataset.genId = g.id;
      item.innerHTML = `
        <div class="shop-item__icon">${g.emoji}</div>
        <div>
          <div class="shop-item__name">${g.name}</div>
          <div class="shop-item__sub">+${fmt(g.baseRate)}/s each · total ${fmt(g.baseRate * owned)}/s</div>
        </div>
        <div class="shop-item__right">
          <div class="shop-item__cost"></div>
          <div class="shop-item__owned"></div>
        </div>
      `;
      item.addEventListener('click', () => buyGenerator(g));
      shop.appendChild(item);
    });

    renderedGenIds = visGens.map(g => g.id).join(',');
    refreshShopValues();
  }

  function renderClicksTab() {
    const visUps = visibleUpgrades();
    const shop = $('#shop-items');

    const title = document.createElement('div');
    title.className = 'shop__title';
    title.textContent = 'CLICK UPGRADES';
    shop.appendChild(title);

    visUps.forEach(u => {
      const item = document.createElement('button');
      item.className = 'shop-item';
      item.dataset.upgradeId = u.id;
      item.innerHTML = `
        <div class="shop-item__icon">${u.emoji}</div>
        <div>
          <div class="shop-item__name">${u.name}</div>
          <div class="shop-item__sub">× ${u.multiplier} click power</div>
        </div>
        <div class="shop-item__right">
          <div class="shop-item__cost"></div>
        </div>
      `;
      item.addEventListener('click', () => buyUpgrade(u));
      shop.appendChild(item);
    });

    renderedUpgradeIds = visUps.map(u => u.id).join(',');
    refreshShopValues();
  }

  function renderBoostsTab() {
    const shop = $('#shop-items');

    const title = document.createElement('div');
    title.className = 'shop__title';
    title.textContent = 'TEMPORARY BUFFS';
    shop.appendChild(title);

    SHORT_BOOSTS.forEach(b => {
      const item = document.createElement('button');
      item.className = 'shop-item';
      item.dataset.boostId = b.id;
      item.innerHTML = `
        <div class="shop-item__icon">${b.emoji}</div>
        <div>
          <div class="shop-item__name">${b.name}</div>
          <div class="shop-item__sub">${b.duration}s duration</div>
        </div>
        <div class="shop-item__right">
          <div class="shop-item__cost">${fmt(b.cost)}</div>
        </div>
      `;
      item.addEventListener('click', () => buyBoost(b));
      shop.appendChild(item);
    });
  }

  function renderClickerinosTab() {
    const visClickers = visibleClickerinos();
    const shop = $('#shop-items');

    const title = document.createElement('div');
    title.className = 'shop__title';
    title.textContent = 'AUTO-CLICKERS';
    shop.appendChild(title);

    visClickers.forEach(c => {
      const owned = state.generators[c.id] || 0;
      const cost = Math.ceil(c.baseCost * Math.pow(1.15, owned));
      const item = document.createElement('button');
      item.className = 'shop-item';
      item.dataset.clickerinoId = c.id;
      item.innerHTML = `
        <div class="shop-item__icon">${c.emoji}</div>
        <div>
          <div class="shop-item__name">${c.name}</div>
          <div class="shop-item__sub">+${(c.baseRate).toFixed(1)}/s each · total ${(c.baseRate * owned).toFixed(1)}/s</div>
        </div>
        <div class="shop-item__right">
          <div class="shop-item__cost">${fmt(cost)}</div>
          <div class="shop-item__owned">×${owned}</div>
        </div>
      `;
      item.addEventListener('click', () => buyClickerino(c));
      shop.appendChild(item);
    });
  }

  function renderSynergiesTab() {
    const shop = $('#shop-items');

    const title = document.createElement('div');
    title.className = 'shop__title';
    title.textContent = 'SYNERGIES (Coming Soon)';
    shop.appendChild(title);

    const coming = document.createElement('div');
    coming.style.padding = 'var(--ng-space-4)';
    coming.style.textAlign = 'center';
    coming.style.color = 'var(--ng-text-muted)';
    coming.textContent = 'Synergy upgrades unlock after your first prestige evolution!';
    shop.appendChild(coming);
  }

  // Lightweight update — refreshes cost/owned text and affordability class
  // without touching the DOM structure or re-attaching listeners. Safe to
  // call on every click and every tick.
  function refreshShopValues() {
    const visGens = visibleGenerators();
    const visUps = visibleUpgrades();

    // Only compare against the tab that's actually in the DOM right now —
    // the other tab's renderedXIds stays stale (null/outdated) whenever it
    // isn't the active tab, which previously caused renderShop() to be
    // called every time (mismatch never resolves) → infinite recursion via
    // renderBakersTab/renderClicksTab each re-calling refreshShopValues().
    if (currentShopTab === 'bakers' && visGens.map(g => g.id).join(',') !== renderedGenIds) {
      renderShop();
      return;
    }
    if (currentShopTab === 'clicks' && visUps.map(u => u.id).join(',') !== renderedUpgradeIds) {
      renderShop();
      return;
    }

    visGens.forEach(g => {
      const item = $(`.shop-item[data-gen-id="${g.id}"]`);
      if (!item) return;
      const owned = state.generators[g.id] || 0;
      const cost = costOf(g);
      item.classList.toggle('is-unaffordable', state.coins < cost);
      item.querySelector('.shop-item__cost').textContent = fmt(cost);
      item.querySelector('.shop-item__owned').textContent = '×' + owned;
      item.querySelector('.shop-item__sub').textContent =
        `+${fmt(g.baseRate)}/s each · total ${fmt(g.baseRate * owned)}/s`;
    });

    visUps.forEach(u => {
      const item = $(`.shop-item[data-upgrade-id="${u.id}"]`);
      if (!item) return;
      item.classList.toggle('is-unaffordable', state.coins < u.cost);
      item.querySelector('.shop-item__cost').textContent = fmt(u.cost);
    });
  }

  /* --------------------------------------------------------
     ACTIONS
     -------------------------------------------------------- */

  function spawnFullScreenSprinkles() {
    // Rain sprinkles inside the coin-card (game board) only - natural falling rain
    const coinCard = $('#coin-card');
    if (!coinCard) return;

    const rect = coinCard.getBoundingClientRect();
    const count = 40 + Math.random() * 25;  // 40-65 sprinkles for natural rain coverage

    for (let i = 0; i < count; i++) {
      // Much slower stagger for more natural rainfall (not a dump)
      const spawnDelay = Math.random() * 200;  // Random spawn over 200ms window

      setTimeout(() => {
        const sprinkleNum = Math.floor(Math.random() * 5) + 1;
        const s = document.createElement('img');
        s.src = `img/sprinkles/sprinkle${sprinkleNum}.png`;
        s.className = 'sprinkle-particle';

        // Position absolutely within coin-card
        s.style.position = 'absolute';
        s.style.pointerEvents = 'none';
        s.style.zIndex = '100';

        // Random x position spread across full card width
        const startX = rect.left + Math.random() * rect.width;
        const startY = rect.top - 40;  // Start well above the card
        s.style.left = startX + 'px';
        s.style.top = startY + 'px';
        document.body.appendChild(s);

        // Fall distance: from top of card to bottom
        const fallDistance = rect.height + 60;
        // Slight horizontal drift (wind effect)
        const offsetX = (Math.random() - 0.5) * 80;
        const rotation = Math.random() * 360;
        // Longer, more consistent fall time for natural rain feel
        const duration = 1600 + Math.random() * 400;  // 1.6-2.0s fall time

        s.animate([
          { transform: 'translate(-50%, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${offsetX}px), ${fallDistance}px) rotate(${rotation}deg)`, opacity: 0.3 }
        ], {
          duration,
          easing: 'ease-in-out',  // More natural easing, not just ease-in
          fill: 'forwards'
        });

        setTimeout(() => s.remove(), duration);
      }, spawnDelay);  // More natural staggering
    }
  }

  function onDonutClick(e) {
    const power = getClickPowerWithBuff();
    earn(power, 'click');
    state.clicks++;

    // Track click streak for Tier 2
    const now = Date.now();
    if (now - state.clickStreakTime < 1000) {
      state.clickStreak++;
      if (state.clickStreak >= 5) {
        fireWordCard(pickRandomWordCard(2));
        state.clickStreak = 0;
      }
    } else {
      state.clickStreak = 1;
    }
    state.clickStreakTime = now;

    NG.audio.play('coin');

    // Floating number from the click point
    const card = $('#coin-card');
    const rect = card.getBoundingClientRect();
    const float = document.createElement('div');
    float.className = 'idle-float float-num--anim';
    float.textContent = '+' + fmt(power);
    float.style.left = (e.clientX - rect.left) + 'px';
    float.style.top  = (e.clientY - rect.top)  + 'px';
    float.style.transform = 'translate(-50%, 0)';
    card.appendChild(float);
    setTimeout(() => float.remove(), 950);

    // Full-screen sprinkle rain (instead of localized burst)
    spawnFullScreenSprinkles();

    // Particle burst with rainbow colors - more particles to show all colors
    NG.particles.burst(e.clientX, e.clientY, {
      count: 16, spread: 60, size: 8,
      colors: ['#ffc46b', '#ff9a4a', '#ff8fb1', '#ff6b9d', '#4a90e2', '#7b68ee', '#50c878', '#ffd700'],
    });

    // Donut squish animation
    const btn = $('#donut-btn');
    btn.classList.add('is-squishing');
    setTimeout(() => btn.classList.remove('is-squishing'), 250);

    // Ripple ring on the donut
    const ripple = document.createElement('span');
    ripple.className = 'donut-ripple';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    renderTotals();
    refreshShopValues();
  }

  function buyGenerator(g) {
    const cost = costOf(g);
    if (state.coins < cost) {
      NG.audio.play('error');
      return;
    }
    spend(cost);
    state.generators[g.id] = (state.generators[g.id] || 0) + 1;
    NG.audio.play('upgrade');
    renderTotals();
    renderShop();
  }

  function buyUpgrade(u) {
    if (state.upgrades[u.id]) return;
    if (state.coins < u.cost) {
      NG.audio.play('error');
      return;
    }
    spend(u.cost);
    state.upgrades[u.id] = true;
    NG.audio.play('success');
    NG.toast(u.name + ' purchased! Click power × ' + u.multiplier, { type: 'success' });
    renderTotals();
    renderShop();
  }

  function buyBoost(b) {
    if (state.coins < b.cost) {
      NG.audio.play('error');
      return;
    }
    spend(b.cost);
    NG.audio.play('success');

    // Apply the boost effect
    if (b.effect === 'double_rate') {
      state.boostDoubleRateEndTime = Date.now() + (b.duration * 1000);
    } else if (b.effect === 'triple_clicks') {
      state.boostTripleClickEndTime = Date.now() + (b.duration * 1000);
    }

    NG.toast(b.name + ' activated! Duration: ' + b.duration + 's', { type: 'success' });
    renderTotals();
    renderShop();
  }

  function buyClickerino(c) {
    const cost = Math.ceil(c.baseCost * Math.pow(1.15, state.generators[c.id] || 0));
    if (state.coins < cost) {
      NG.audio.play('error');
      return;
    }
    spend(cost);
    state.generators[c.id] = (state.generators[c.id] || 0) + 1;
    NG.audio.play('upgrade');
    NG.toast(c.name + ' added!', { type: 'success' });
    renderTotals();
    renderShop();
  }

  /* --------------------------------------------------------
     TICK LOOP — per-second income + boost tracking
     -------------------------------------------------------- */
  let lastTick = performance.now();
  function tick(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    let rate = totalRate();

    // Apply double rate boost if active
    if (state.boostDoubleRateEndTime && now < state.boostDoubleRateEndTime) {
      rate *= 2;
    }

    const earned = rate * dt;
    if (earned > 0) earn(earned, 'tick');

    // Update boost UI if any active
    updateBoostUI(now);

    renderTotals();
    refreshShopValues();
    requestAnimationFrame(tick);
  }

  function updateBoostUI(now) {
    // Show active boost warnings if needed
    if (state.boostDoubleRateEndTime && now < state.boostDoubleRateEndTime) {
      const remaining = Math.max(0, state.boostDoubleRateEndTime - now) / 1000;
      // Could show in a status bar here
    }
  }

  /* --------------------------------------------------------
     PHASE 3: PRESTIGE SYSTEM (Flavor Evolution)
     -------------------------------------------------------- */
  const FLAVORS = [
    { id: 'plain', name: 'Plain Donut', color: '#d4a574', unlockAt: 0, perk: 'Base' },
    { id: 'chocolate', name: 'Chocolate Donut', color: '#8b4513', unlockAt: 1000000, perk: '+10% generator output' },
    { id: 'strawberry', name: 'Strawberry Donut', color: '#ff69b4', unlockAt: 50000000, perk: '+10% click power' },
    { id: 'glazed', name: 'Golden Glazed', color: '#ffd700', unlockAt: 1000000000, perk: '+5% of all income' },
    { id: 'cosmic', name: 'Cosmic Donut', color: '#9400d3', unlockAt: 1000000000000, perk: '+20% everything' },
  ];

  const BUDDY_COMBINATIONS = [
    { flavors: ['chocolate', 'strawberry'], name: 'Neapolitan Buddy', emoji: '🍫🍓', bonus: 0.15 },
    { flavors: ['chocolate', 'glazed'], name: 'Rich Buddy', emoji: '🍫✨', bonus: 0.12 },
    { flavors: ['strawberry', 'glazed'], name: 'Deluxe Buddy', emoji: '🍓✨', bonus: 0.12 },
    { flavors: ['glazed', 'cosmic'], name: 'Transcendent Buddy', emoji: '✨🌌', bonus: 0.20 },
  ];

  const WORLDS = [
    { id: 0, name: 'Bakery', theme: 'warm', generators: GENERATORS, unlockAt: 0 },
    { id: 1, name: 'Park', theme: 'green', generators: GENERATORS, unlockAt: 100000000000 },
    { id: 2, name: 'Space Station', theme: 'dark', generators: GENERATORS, unlockAt: 10000000000000 },
  ];

  function flavorMultiplier() {
    const flavor = FLAVORS.find(f => f.id === state.currentFlavor);
    if (!flavor) return 1;
    if (flavor.id === 'plain') return 1;
    if (flavor.id === 'chocolate') return 1.10;
    if (flavor.id === 'strawberry') return 1.10;
    if (flavor.id === 'glazed') return 1.05;
    if (flavor.id === 'cosmic') return 1.20;
    return 1;
  }

  function canEvolve() {
    const flavorThreshold = FLAVORS.find(f => f.id === state.currentFlavor)?.unlockAt || 0;
    const nextFlavor = FLAVORS[FLAVORS.indexOf(FLAVORS.find(f => f.id === state.currentFlavor)) + 1];
    return nextFlavor && state.totalEarned >= nextFlavor.unlockAt;
  }

  async function openEvolveDialog() {
    const nextFlavor = FLAVORS[FLAVORS.indexOf(FLAVORS.find(f => f.id === state.currentFlavor)) + 1];
    if (!nextFlavor) {
      NG.toast('Already at max flavor!', { type: 'info' });
      return;
    }

    const ok = await NG.modal.confirm({
      title: `Evolve to ${nextFlavor.name}?`,
      body: `Your donut will evolve! You'll reset coins & generators, but keep Sprinkle Shards & Buddy Donuts. New perk: ${nextFlavor.perk}`,
      danger: false,
      confirmLabel: 'Evolve',
      cancelLabel: 'Not yet',
    });

    if (ok) {
      performEvolution(nextFlavor.id);
    }
  }

  function performEvolution(newFlavorId) {
    const earnedThisRun = state.coins;
    state.sprinkleShardsEarned += Math.floor(state.totalEarned / 1000000);

    state.currentFlavor = newFlavorId;
    state.flavors[newFlavorId] = true;

    // Reset game state but keep prestige currency & buddies
    state.coins = 0;
    state.clicks = 0;
    state.generators = {};
    state.upgrades = {};
    state.totalEarned = 0;
    GENERATORS.forEach(g => state.generators[g.id] = 0);

    // Record evolution in DNA
    state.donutDNA.push({
      type: 'flavor_evolution',
      flavor: newFlavorId,
      timestamp: Date.now(),
      shards: state.sprinkleShardsEarned,
    });

    const evolutionCard = pickRandomWordCard(5) || { text: 'GLAZE ASCENDANT!', size: 'xl', color: '#ffd700', tier: 5 };
    fireWordCard(evolutionCard);
    NG.toast('Your donut has evolved! Welcome to a new era.', { type: 'success' });

    renderTotals();
    renderShop();
  }

  function addBuddyDonut(flavor1, flavor2) {
    if (state.sprinkleShardsEarned < 50) {
      NG.toast('Not enough Sprinkle Shards! Need 50.', { type: 'warning' });
      return;
    }
    state.sprinkleShardsEarned -= 50;
    state.buddyDonuts.push({ flavor1, flavor2 });
    state.miniDonuts += 5;

    // Record in DNA
    state.donutDNA.push({
      type: 'buddy_creation',
      flavors: [flavor1, flavor2],
      timestamp: Date.now(),
    });

    NG.toast('A new Buddy Donut orbits your empire!', { type: 'success' });
    renderTotals();
  }

  /* --------------------------------------------------------
     SAVE / LOAD + OFFLINE INCOME
     -------------------------------------------------------- */
  function persist() {
    state.lastSaveTime = Date.now();
    save.write(state);
  }
  function isFiniteNonNegative(n) { return typeof n === 'number' && Number.isFinite(n) && n >= 0; }

  function tryRestore() {
    const data = save.read();
    if (!data) return false;

    // Validate top-level numeric fields — a tampered/corrupted save with
    // non-numeric values must not silently propagate NaN through earn()/costOf().
    if (!isFiniteNonNegative(data.coins) || !isFiniteNonNegative(data.totalEarned) ||
        !isFiniteNonNegative(data.clicks) || !isFiniteNonNegative(data.lastSaveTime)) {
      return false;
    }
    if (typeof data.generators !== 'object' || data.generators === null) return false;
    for (const g of GENERATORS) {
      const owned = data.generators[g.id];
      if (owned !== undefined && !isFiniteNonNegative(owned)) return false;
    }

    Object.assign(state, data);
    // Ensure generator/upgrade objects exist for any newly-added IDs
    GENERATORS.forEach(g => { if (!(g.id in state.generators)) state.generators[g.id] = 0; });
    if (!state.upgrades || typeof state.upgrades !== 'object') state.upgrades = {};
    return true;
  }

  function applyOfflineEarnings(sinceMs) {
    const awayMs = sinceMs != null ? sinceMs : (state.lastSaveTime ? Date.now() - state.lastSaveTime : 0);
    if (awayMs < 30000) return;   // ignore < 30s away
    const capMs = 8 * 60 * 60 * 1000;   // cap 8 hours
    const effective = Math.min(awayMs, capMs);
    const earned = totalRate() * (effective / 1000);
    if (earned <= 0) return;
    earn(earned, 'offline');

    // Welcome-back banner
    const minutes = Math.floor(effective / 60000);
    const banner = document.createElement('div');
    banner.className = 'welcome-back';
    banner.textContent =
      `🍩 You earned ${fmt(earned)} coins while away (${minutes} min${minutes === 1 ? '' : 's'}).`;
    $('#shop').prepend(banner);
    setTimeout(() => {
      banner.style.transition = 'opacity 400ms';
      banner.style.opacity = '0';
      setTimeout(() => banner.remove(), 420);
    }, 6000);
  }

  /* --------------------------------------------------------
     PHASE 4: WILDCARD MECHANICS
     -------------------------------------------------------- */

  // Health Inspector minigame
  function maybeSpawnHealthInspector() {
    const now = Date.now();
    if (now - state.healthInspectorLastTime < 120000) return; // Min 2 min between inspections

    const chance = Math.random();
    const scaledChance = Math.min(0.15, state.totalEarned / 10000000000); // Max 15% chance at high play
    if (chance > scaledChance) return;

    showHealthInspectorEvent();
    state.healthInspectorLastTime = now;
  }

  function showHealthInspectorEvent() {
    const banner = document.createElement('div');
    banner.className = 'health-inspector-event';
    banner.innerHTML = `
      <div style="font-size: 24px;">🚨 HEALTH INSPECTOR INCOMING! 🚨</div>
      <div style="margin: 8px 0;">Tap to clean up! (3 taps required)</div>
      <div class="inspector-buttons" style="display: flex; gap: 8px; margin-top: 8px;">
        <button class="btn btn--primary" style="flex: 1;">Clean 1</button>
        <button class="btn btn--primary" style="flex: 1;">Clean 2</button>
        <button class="btn btn--primary" style="flex: 1;">Clean 3</button>
      </div>
    `;

    const shop = $('#shop');
    shop.prepend(banner);

    let cleanTaps = 0;
    const taps = banner.querySelectorAll('.inspector-buttons button');
    taps.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        cleanTaps++;
        btn.disabled = true;
        btn.style.opacity = '0.5';

        if (cleanTaps === 3) {
          // Success!
          fireWordCard(pickRandomWordCard(3));
          earn(state.coins * 0.10);
          NG.audio.play('success');

          // Remove banner
          setTimeout(() => banner.remove(), 1000);
        }
      });
    });

    // If not cleaned in 15 seconds, inspector leaves disappointed
    setTimeout(() => {
      if (cleanTaps < 3 && banner.parentElement) {
        const fine = Math.max(1000, state.coins * 0.05);
        spend(fine);
        NG.toast('Health Inspector fined you ' + fmt(fine) + ' coins! 📉', { type: 'warning' });
        fireWordCard({ text: 'BUSTED! 🚨', size: 'lg', color: '#ff0000', tier: 3 });
        banner.remove();
        renderTotals();
      }
    }, 15000);
  }

  // Bakery Radio ticker
  function generateRadioLine() {
    const lines = [
      'Breaking news: A customer just bought their first donut!',
      'Traffic update: Long lines around the bakery today.',
      'A local rival shop just opened nearby...',
      'Your donut empire has grown to ' + GENERATORS.length + ' types of generators!',
      'Influencer spotted at your bakery! 📸',
      'New flavor unlocked: ' + FLAVORS.find(f => f.id === state.currentFlavor)?.name || 'Donut',
      state.buddyDonuts.length > 0 ? 'Buddy Donuts spotted orbiting the empire!' : 'The donuts are happiest when together.',
      'Weather forecast: Sprinkle rain expected tomorrow!',
      'Local health inspection scheduled soon...',
      'Your empire now generates ' + fmt(totalRate()) + ' coins per second!',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function updateRadioTicker() {
    const ticker = $('#bakery-radio-ticker');
    if (!ticker) return;

    const line = generateRadioLine();
    ticker.innerHTML = `📻 ${line}`;
  }

  // Frosting Wars rival system
  function initRivalPace() {
    state.rivalPaceState = {
      coins: 0,
      flavors: 0,
      lastUpdateTime: Date.now(),
    };
  }

  function updateRivalPace() {
    if (!state.rivalPaceState || !state.rivalPaceState.lastUpdateTime) {
      initRivalPace();
      return;
    }

    const now = Date.now();
    const elapsed = (now - state.rivalPaceState.lastUpdateTime) / 1000;

    // Rival grows at ~80% of player pace
    const playerRate = totalRate() * elapsed;
    state.rivalPaceState.coins += playerRate * 0.8;

    // Rival occasionally "unlocks" flavors
    const rivalFlavorsUnlocked = Math.floor(state.rivalPaceState.coins / 100000000);
    if (rivalFlavorsUnlocked > state.rivalPaceState.flavors) {
      state.rivalPaceState.flavors = rivalFlavorsUnlocked;
      const banner = document.createElement('div');
      banner.className = 'rival-event';
      banner.textContent = `👻 Glenda's Glazed Goods just unlocked a new flavor! You're ${state.flavors ? 'still' : 'not'} ahead!`;
      $('#shop').prepend(banner);
      setTimeout(() => banner.remove(), 5000);
    }

    state.rivalPaceState.lastUpdateTime = now;
  }

  // Donut DNA collection display
  function showCollection() {
    const body = document.createElement('div');
    body.style.maxHeight = '400px';
    body.style.overflowY = 'auto';

    if (state.donutDNA.length === 0) {
      body.innerHTML = '<p style="text-align: center; color: var(--ng-text-muted);">No evolutions yet. Reach the next flavor threshold to unlock achievements!</p>';
    } else {
      const list = document.createElement('div');
      list.style.display = 'flex';
      list.style.flexDirection = 'column';
      list.style.gap = 'var(--ng-space-2)';

      state.donutDNA.forEach((entry, i) => {
        const item = document.createElement('div');
        item.style.padding = 'var(--ng-space-3)';
        item.style.background = 'var(--ng-bg-surface-2)';
        item.style.borderRadius = 'var(--ng-radius-md)';
        if (entry.type === 'flavor_evolution') {
          item.textContent = `🍩 Evolved to ${FLAVORS.find(f => f.id === entry.flavor)?.name || entry.flavor} (${entry.shards} Shards earned)`;
        } else if (entry.type === 'buddy_creation') {
          item.textContent = `👥 Created ${entry.flavors.join(' + ')} Buddy Donut`;
        }
        list.appendChild(item);
      });

      body.appendChild(list);
    }

    NG.modal.open({
      title: '🧬 Donut DNA Collection',
      body: body,
      actions: [
        { label: 'Close', variant: 'ghost' }
      ]
    });
  }

  /* --------------------------------------------------------
     INIT
     -------------------------------------------------------- */
  function init() {
    tryRestore();
    applyOfflineEarnings();
    initRivalPace();
    renderTotals();
    renderShop();
    lastTick = performance.now();
    requestAnimationFrame(tick);

    // Health Inspector random events
    setInterval(maybeSpawnHealthInspector, 10000);

    // Update radio ticker every 30 seconds
    setInterval(updateRadioTicker, 30000);
    updateRadioTicker();

    // Update rival pace
    setInterval(updateRivalPace, 5000);

    NG.on($('#donut-btn'), 'click', onDonutClick);

    // Evolve button
    NG.on($('#btn-evolve'), 'click', () => {
      if (canEvolve()) {
        openEvolveDialog();
      } else {
        const nextFlavor = FLAVORS[FLAVORS.indexOf(FLAVORS.find(f => f.id === state.currentFlavor)) + 1];
        if (nextFlavor) {
          NG.toast('Unlock ' + nextFlavor.name + ' at ' + fmt(nextFlavor.unlockAt) + ' coins!', { type: 'info' });
        }
      }
    });

    // Collection button (DNA)
    NG.on($('#btn-collection'), 'click', showCollection);

    // Dev/Tester button - add 10 million coins
    NG.on($('#btn-dev-coins'), 'click', () => {
      earn(10000000, 'dev-test');
      NG.toast('💰 +10M coins added (dev mode)', { type: 'info' });
      renderTotals();
      renderShop();
    });

    // rAF ticks pause while the tab is backgrounded — catch up on the
    // elapsed time when the user returns instead of losing that income.
    let hiddenSince = null;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenSince = Date.now();
      } else if (hiddenSince != null) {
        const awayMs = Date.now() - hiddenSince;
        hiddenSince = null;
        applyOfflineEarnings(awayMs);
        renderTotals();
        refreshShopValues();
        lastTick = performance.now();
      }
    });


    NG.on($('#btn-reset'), 'click', async () => {
      const ok = await NG.modal.confirm({
        title: 'Wipe your save?',
        body: 'All coins, generators and upgrades will be deleted. This cannot be undone.',
        danger: true,
        confirmLabel: 'Wipe it',
      });
      if (ok) {
        save.clear();
        state = {
          coins: 0, totalEarned: 0, clicks: 0,
          generators: {}, upgrades: {}, lastSaveTime: Date.now(),
        };
        GENERATORS.forEach(g => state.generators[g.id] = 0);
        renderTotals();
        renderShop();
        NG.toast('Fresh start!', { type: 'info' });
      }
    });

    // Autosave every 5 seconds
    setInterval(persist, 5000);
    // Save on tab close too
    window.addEventListener('beforeunload', persist);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
