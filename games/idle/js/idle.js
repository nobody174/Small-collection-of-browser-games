/* ============================================================
   idle.js — Donut Empire (idle clicker)
   ------------------------------------------------------------
   Core loop:
     - Click the donut → earn `clickPower` coins (+ floating number)
     - Generators produce coins per second passively
     - Buy more generators (cost scales 1.15× per owned)
     - Buy click upgrades (multiply click power)
     - Autosave every 5s, restore on load
     - Offline income while away (capped at 8 hours)
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
  };
  // Initialize generator counts to 0
  GENERATORS.forEach(g => state.generators[g.id] = 0);

  const save = NG.save.create('idle', { version: 1 });

  /* --------------------------------------------------------
     HELPERS
     -------------------------------------------------------- */

  // Cost of buying ONE more of a generator
  function costOf(g) {
    const owned = state.generators[g.id] || 0;
    return Math.ceil(g.baseCost * Math.pow(g.costScale, owned));
  }

  // Per-second income from all generators
  function totalRate() {
    let s = 0;
    GENERATORS.forEach(g => s += (state.generators[g.id] || 0) * g.baseRate);
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
  }

  function spend(amount) { state.coins -= amount; }

  /* --------------------------------------------------------
     RENDER — coin counter, rate, shop
     -------------------------------------------------------- */
  function renderTotals() {
    $('#coin-amount').textContent = fmt(state.coins);
    $('#coin-rate').textContent   = fmt(totalRate()) + ' coins / second';
    $('#click-power').innerHTML   = 'Click power: <b>' + fmt(clickPower()) + '</b>';
  }

  // Tracks which generator/upgrade ids are currently rendered, so we know
  // when the visible set changes (unlock, upgrade bought) and a structural
  // rebuild is needed, vs. just refreshing cost/owned/affordability text.
  let renderedGenIds = null;
  let renderedUpgradeIds = null;

  function visibleGenerators() {
    return GENERATORS.filter(g => state.totalEarned >= g.unlockAt);
  }
  function visibleUpgrades() {
    return UPGRADES.filter(u => !state.upgrades[u.id] && state.totalEarned >= u.cost * 0.25);
  }

  // Full DOM rebuild — only needed when the set of visible items changes.
  function renderShop() {
    const visGens = visibleGenerators();
    const visUps = visibleUpgrades();

    const shop = $('#shop-items');
    shop.innerHTML = '';

    // Generators section
    const genTitle = document.createElement('div');
    genTitle.className = 'shop__title';
    genTitle.textContent = 'Generators';
    shop.appendChild(genTitle);

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

    // Upgrades section
    if (visUps.length) {
      const upTitle = document.createElement('div');
      upTitle.className = 'shop__title';
      upTitle.textContent = 'Click Upgrades';
      shop.appendChild(upTitle);

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
    }

    renderedGenIds = visGens.map(g => g.id).join(',');
    renderedUpgradeIds = visUps.map(u => u.id).join(',');
    refreshShopValues();
  }

  // Lightweight update — refreshes cost/owned text and affordability class
  // without touching the DOM structure or re-attaching listeners. Safe to
  // call on every click and every tick.
  function refreshShopValues() {
    const visGens = visibleGenerators();
    const visUps = visibleUpgrades();

    // If the visible set changed (unlock crossed, upgrade purchased), rebuild structure.
    if (visGens.map(g => g.id).join(',') !== renderedGenIds ||
        visUps.map(u => u.id).join(',') !== renderedUpgradeIds) {
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
    // Rain sprinkles from top of screen across entire viewport
    const count = 30 + Math.random() * 20;  // 30-50 sprinkles per rain burst
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const sprinkleNum = Math.floor(Math.random() * 5) + 1;
        const s = document.createElement('img');
        s.src = `img/sprinkles/sprinkle${sprinkleNum}.png`;
        s.className = 'sprinkle-particle';

        // Random x position across full viewport width
        const startX = Math.random() * window.innerWidth;
        const startY = -20;  // Start above viewport
        s.style.left = startX + 'px';
        s.style.top = startY + 'px';
        document.body.appendChild(s);

        // Random fall distance (viewport height + buffer)
        const fallDistance = window.innerHeight + 100;
        const offsetX = (Math.random() - 0.5) * 200;  // -100 to +100px horizontal drift
        const rotation = Math.random() * 360;
        const duration = 1200 + Math.random() * 400;  // 1.2-1.6s fall time

        s.animate([
          { transform: 'translate(-50%, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${offsetX}px), ${fallDistance}px) rotate(${rotation}deg)`, opacity: 0 }
        ], {
          duration,
          easing: 'ease-in',
          fill: 'forwards'
        });

        setTimeout(() => s.remove(), duration);
      }, i * 20);  // Stagger spawn for continuous rain effect
    }
  }

  function onDonutClick(e) {
    const power = clickPower();
    earn(power, 'click');
    state.clicks++;
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

    // Particle burst
    NG.particles.burst(e.clientX, e.clientY, {
      count: 6, spread: 36, size: 6,
      colors: ['#ffc46b', '#ff9a4a', '#ff8fb1'],
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

  /* --------------------------------------------------------
     TICK LOOP — per-second income
     -------------------------------------------------------- */
  let lastTick = performance.now();
  function tick(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const earned = totalRate() * dt;
    if (earned > 0) earn(earned, 'tick');
    renderTotals();
    refreshShopValues();
    requestAnimationFrame(tick);
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
     INIT
     -------------------------------------------------------- */
  function init() {
    tryRestore();
    applyOfflineEarnings();
    renderTotals();
    renderShop();
    lastTick = performance.now();
    requestAnimationFrame(tick);

    NG.on($('#donut-btn'), 'click', onDonutClick);

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
