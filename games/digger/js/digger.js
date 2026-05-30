/* ============================================================
   digger.js — Around the World Digger
   ------------------------------------------------------------
   Side-view mining game.
     - World is a 2D grid of tiles (cols × rows).
     - Top rows are sky/surface; below is dirt → stone → bedrock.
     - Player can only act on tiles adjacent to its position.
       Click an adjacent dug tile → walk into it.
       Click an adjacent solid tile → dig it (multiple clicks).
     - Dug tiles may contain minerals → added to cart.
     - Walking onto the surface "shop" tile opens the upgrade
       store and auto-sells the cart.
     - Travel between countries to mine different palettes.
   ============================================================ */

(function () {

  const $ = NG.$;
  const $$ = NG.$$;
  const fmt = NG.formatNumber;

  const { COUNTRIES, MINERALS, PICKAXES, CARTS, BANDS, WORLD } = NG.digger;

  /* --------------------------------------------------------
     STATE
     -------------------------------------------------------- */
  let state = null;       // see initState()
  const save = NG.save.create('digger', { version: 1 });

  function initState(countryId = 'norway') {
    state = {
      countryId,
      countriesUnlocked: { norway: true },
      gold: 0,
      pickaxeIdx: 0,         // index into PICKAXES
      cartIdx: 0,            // index into CARTS
      cart: {},              // mineralId → count
      worlds: {},            // countryId → { tiles, player }
      lastSaveTime: Date.now(),
    };
  }

  function getWorld() {
    if (!state.worlds[state.countryId]) {
      state.worlds[state.countryId] = generateWorld();
    }
    return state.worlds[state.countryId];
  }

  /* --------------------------------------------------------
     WORLD GENERATION
     -------------------------------------------------------- */
  function generateWorld() {
    const tiles = [];
    for (let r = 0; r < WORLD.rows; r++) {
      tiles.push(new Array(WORLD.cols));
      for (let c = 0; c < WORLD.cols; c++) {
        tiles[r][c] = makeTile(r, c);
      }
    }
    // Player starts on the shop tile (so first action is walking off it)
    return {
      tiles,
      player: { row: WORLD.surfaceRow, col: WORLD.shopCol },
    };
  }

  function makeTile(r, c) {
    if (r < WORLD.surfaceRow) return { type: 'sky',     dug: true,  hp: 0, hardness: 0, mineral: null };
    if (r === WORLD.surfaceRow) {
      if (c === WORLD.shopCol) return { type: 'shop',    dug: true,  hp: 0, hardness: 0, mineral: null };
      return                   { type: 'surface', dug: true,  hp: 0, hardness: 0, mineral: null };
    }
    // Below surface: pick the band
    const band = BANDS.find(b => r >= b.minRow && r <= b.maxRow) || BANDS[BANDS.length - 1];

    // Elevator shaft at the band's designated row (middle column)
    if (r === band.elevatorRow && c === 4) {
      return { type: 'elevator', dug: true, hp: 0, hardness: 0, mineral: null };
    }

    const mineral = pickWeighted(band.minerals);
    return {
      type: band.tileType,
      dug:  false,
      hardness: band.hardness,
      hp:   band.hardness,
      mineral,
    };
  }

  function pickWeighted(arr) {
    const total = arr.reduce((s, x) => s + x.w, 0);
    let roll = Math.random() * total;
    for (const x of arr) { roll -= x.w; if (roll <= 0) return x.id; }
    return arr[arr.length - 1].id;
  }

  /* --------------------------------------------------------
     RENDERING
     -------------------------------------------------------- */
  function render() {
    const world = getWorld();
    const worldEl = $('#world');
    worldEl.style.height = `calc(${WORLD.rows} * var(--tile))`;
    worldEl.innerHTML = '';

    for (let r = 0; r < WORLD.rows; r++) {
      for (let c = 0; c < WORLD.cols; c++) {
        const t = world.tiles[r][c];
        const el = document.createElement('div');
        el.className = tileClass(t);
        el.dataset.row = r;
        el.dataset.col = c;
        el.style.transform = `translate(calc(${c} * var(--tile)), calc(${r} * var(--tile)))`;
        // Show mineral for dug tiles that had one
        if (t.dug && t.mineral && t._collected) {
          const m = document.createElement('div');
          m.className = 'tile__mineral';
          m.dataset.mineral = t.mineral;
          el.appendChild(m);
        }
        worldEl.appendChild(el);
      }
    }

    // Player sprite
    const p = document.createElement('div');
    p.className = 'player';
    p.id = 'player-sprite';
    placePlayer(p, world.player.row, world.player.col);
    worldEl.appendChild(p);

    updateAdjacency();
    updateViewport();
    updateUI();

    // Apply country body class
    document.body.classList.forEach(c => {
      if (c.startsWith('country-')) document.body.classList.remove(c);
    });
    document.body.classList.add('country-' + state.countryId);
  }

  function tileClass(t) {
    return 'tile tile--' + t.type + (t.dug ? ' tile--dug' : '');
  }

  function placePlayer(el, row, col) {
    el.style.transform = `translate(calc(${col} * var(--tile)), calc(${row} * var(--tile)))`;
  }

  function updateAdjacency() {
    $$('.tile.is-adjacent').forEach(el => el.classList.remove('is-adjacent'));
    const { player } = getWorld();
    [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => {
      const r = player.row + dr, c = player.col + dc;
      if (r < 0 || r >= WORLD.rows || c < 0 || c >= WORLD.cols) return;
      const el = tileEl(r, c);
      if (el) el.classList.add('is-adjacent');
    });
  }

  function tileEl(r, c) {
    return $('#world').querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
  }

  function updateViewport() {
    // Center the player vertically in the viewport
    const { player } = getWorld();
    const TILES_VISIBLE = 11;
    // Offset of 7 tiles centers player properly in 11-tile viewport
    const targetRow = Math.max(0,
      Math.min(WORLD.rows - TILES_VISIBLE, player.row - 7));
    $('#world').style.transform = `translateY(calc(-${targetRow} * var(--tile)))`;
  }

  /* --------------------------------------------------------
     UI updates (cart, gold, depth, gear)
     -------------------------------------------------------- */
  function updateUI() {
    const pickaxe = PICKAXES[state.pickaxeIdx];
    const cart = CARTS[state.cartIdx];
    const country = COUNTRIES.find(c => c.id === state.countryId);

    $('#stat-country').textContent = `${country.flag} ${country.name}`;
    $('#stat-gold').textContent    = '💰 ' + fmt(state.gold);
    $('#stat-depth').textContent   = '⛏️ Depth ' + (getWorld().player.row - WORLD.surfaceRow);
    $('#stat-pickaxe').textContent = `${pickaxe.emoji} ${pickaxe.name} (str ${pickaxe.strength})`;

    // Cart fill
    const totalUnits = Object.values(state.cart).reduce((s, n) => s + n, 0);
    $('#stat-cart').textContent = `🛒 ${totalUnits}/${cart.size}`;

    // Cart chips per mineral
    const cartEl = $('#cart-chips');
    cartEl.innerHTML = '';
    Object.entries(state.cart).forEach(([id, n]) => {
      if (n <= 0) return;
      const m = MINERALS[id];
      const chip = document.createElement('div');
      chip.className = 'cart__chip';
      chip.innerHTML = `${m.icon} ${m.name} <b>×${n}</b>`;
      cartEl.appendChild(chip);
    });
    if (!cartEl.children.length) {
      const chip = document.createElement('div');
      chip.className = 'cart__chip';
      chip.style.opacity = '0.55';
      chip.textContent = 'Cart is empty — start digging!';
      cartEl.appendChild(chip);
    }
  }

  /* --------------------------------------------------------
     INPUT — click a tile or use arrow keys
     -------------------------------------------------------- */
  function onTileClick(e) {
    const tEl = e.target.closest('.tile');
    if (!tEl) return;
    const r = parseInt(tEl.dataset.row);
    const c = parseInt(tEl.dataset.col);
    const { player } = getWorld();
    const dist = Math.abs(r - player.row) + Math.abs(c - player.col);
    if (dist !== 1) return;     // must be adjacent (orthogonal)
    interact(r, c);
  }

  function onKey(e) {
    // Ignore arrow keys while a modal (shop / confirm) is open
    if (document.querySelector('.modal.is-open')) return;
    let dr = 0, dc = 0;
    if (e.key === 'ArrowUp')    dr = -1;
    else if (e.key === 'ArrowDown') dr = 1;
    else if (e.key === 'ArrowLeft') dc = -1;
    else if (e.key === 'ArrowRight') dc = 1;
    else return;
    e.preventDefault();
    const { player } = getWorld();
    interact(player.row + dr, player.col + dc);
  }

  function interact(r, c) {
    if (r < 0 || r >= WORLD.rows || c < 0 || c >= WORLD.cols) return;
    const world = getWorld();
    const t = world.tiles[r][c];

    if (t.type === 'sky') return;

    if (t.dug) {
      // Walk into it
      world.player.row = r;
      world.player.col = c;
      placePlayer($('#player-sprite'), r, c);
      updateAdjacency();
      updateViewport();
      // Stepping on the shop opens the upgrade store
      if (t.type === 'shop') openShop();
      // Stepping on an elevator opens the layer select menu
      else if (t.type === 'elevator') openElevator(r, c);
      else NG.audio.play('flip');
      updateUI();
      flushSave();
      return;
    }

    // Solid tile → dig
    dig(r, c);
  }

  function dig(r, c) {
    const world = getWorld();
    const t = world.tiles[r][c];
    if (t.dug) return;

    // Cart fullness check
    const used = Object.values(state.cart).reduce((s, n) => s + n, 0);
    if (used >= CARTS[state.cartIdx].size) {
      NG.toast('Cart is full — return to the shop!', { type: 'warning' });
      NG.audio.play('error');
      return;
    }

    const pickaxe = PICKAXES[state.pickaxeIdx];
    t.hp -= pickaxe.strength;
    NG.audio.play('pop');

    const el = tileEl(r, c);
    NG.replayAnim($('#player-sprite'), 'is-digging');

    if (t.hp <= 0) {
      // Tile is fully dug
      t.dug = true;
      const tEl = tileEl(r, c);
      tEl.className = tileClass(t);

      // Mineral drop?
      if (t.mineral) {
        const m = MINERALS[t.mineral];
        state.cart[t.mineral] = (state.cart[t.mineral] || 0) + 1;
        t._collected = true;     // show icon in the now-empty tile
        const mEl = document.createElement('div');
        mEl.className = 'tile__mineral';
        mEl.textContent = m.icon;
        tEl.appendChild(mEl);
        flyMineralToCart(tEl, m);
        NG.audio.play('coin');
      }

      // Move player into the just-dug tile
      world.player.row = r;
      world.player.col = c;
      placePlayer($('#player-sprite'), r, c);
      updateAdjacency();
      updateViewport();
    } else {
      // Show damage cracks (1-3 levels)
      const pct = t.hp / t.hardness;
      el.classList.remove('is-damaged-1', 'is-damaged-2', 'is-damaged-3');
      if      (pct <= 0.33) el.classList.add('is-damaged-3');
      else if (pct <= 0.66) el.classList.add('is-damaged-2');
      else                  el.classList.add('is-damaged-1');
      // Small particle burst at click point
      const rct = el.getBoundingClientRect();
      NG.particles.burst(rct.left + rct.width / 2, rct.top + rct.height / 2, {
        count: 5, spread: 24, size: 5,
        colors: ['#c97a3a', '#9a8c7a', '#6a6f7a']
      });
    }

    updateUI();
    flushSave();
  }

  function flyMineralToCart(tileEl, mineral) {
    // Animate a copy flying from the tile to the cart counter
    const cartEl = $('#stat-cart');
    const sR = tileEl.getBoundingClientRect();
    const tR = cartEl.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly-icon';
    fly.textContent = mineral.icon;
    fly.style.left = sR.left + sR.width / 2 - 14 + 'px';
    fly.style.top  = sR.top  + sR.height / 2 - 14 + 'px';
    document.body.appendChild(fly);
    requestAnimationFrame(() => {
      const dx = (tR.left + tR.width / 2) - (sR.left + sR.width / 2);
      const dy = (tR.top  + tR.height / 2) - (sR.top  + sR.height / 2);
      fly.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
      fly.style.opacity = '0';
    });
    setTimeout(() => fly.remove(), 720);
  }

  /* --------------------------------------------------------
     SHOP — auto-sell + upgrade store
     -------------------------------------------------------- */
  function openShop() {
    NG.audio.play('coin');
    const sellTotal = Object.entries(state.cart)
      .reduce((s, [id, n]) => s + n * MINERALS[id].value, 0);

    if (sellTotal > 0) {
      state.gold += sellTotal;
      state.cart = {};
      NG.toast(`Sold cart for 💰 ${fmt(sellTotal)}`, { type: 'success' });
    }

    // Build the shop content
    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = 'var(--ng-space-3)';

    // Pickaxe upgrade
    if (state.pickaxeIdx + 1 < PICKAXES.length) {
      const next = PICKAXES[state.pickaxeIdx + 1];
      body.appendChild(shopRow(
        `${next.emoji}  ${next.name}`,
        `Strength ${next.strength}`,
        next.cost,
        state.gold >= next.cost,
        () => {
          state.gold -= next.cost;
          state.pickaxeIdx++;
          NG.audio.play('upgrade');
          NG.modal.close();
          openShop();
        }
      ));
    }

    // Cart upgrade
    if (state.cartIdx + 1 < CARTS.length) {
      const next = CARTS[state.cartIdx + 1];
      body.appendChild(shopRow(
        `🛒  ${next.name}`,
        `Capacity ${next.size}`,
        next.cost,
        state.gold >= next.cost,
        () => {
          state.gold -= next.cost;
          state.cartIdx++;
          NG.audio.play('upgrade');
          NG.modal.close();
          openShop();
        }
      ));
    }

    // Country travel
    const travelTitle = document.createElement('div');
    travelTitle.className = 'shop__title';
    travelTitle.textContent = 'Travel to a country';
    travelTitle.style.marginTop = 'var(--ng-space-3)';
    body.appendChild(travelTitle);

    COUNTRIES.forEach(c => {
      if (c.id === state.countryId) return;
      const unlocked = state.countriesUnlocked[c.id] ||
        state.gold + sellTotal >= c.unlockGold;
      body.appendChild(shopRow(
        `${c.flag}  ${c.name}`,
        unlocked ? 'Travel here' : `Unlocks at 💰 ${fmt(c.unlockGold)}`,
        unlocked ? 0 : null,
        unlocked,
        () => {
          state.countriesUnlocked[c.id] = true;
          state.countryId = c.id;
          NG.modal.close();
          render();
          NG.toast(c.intro, { type: 'info' });
        }
      ));
    });

    NG.modal.open({
      title: 'Shop',
      body,
      actions: [{ label: 'Back to the mine', variant: 'primary' }],
    });
    updateUI();
    flushSave();
  }

  function openElevator(r, c) {
    const world = getWorld();
    const band = BANDS.find(b => r >= b.minRow && r <= b.maxRow);
    const currLayer = band ? BANDS.indexOf(band) : -1;

    // Build layer selector
    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = 'var(--ng-space-2)';

    BANDS.forEach((b, idx) => {
      const btn = document.createElement('button');
      btn.className = 'shop-item';
      if (idx === currLayer) btn.classList.add('is-unaffordable');  // current layer is disabled
      const depthText = `${b.minRow}-${b.maxRow} (${b.tileType})`;
      btn.innerHTML = `
        <div class="shop-item__icon">${idx === currLayer ? '✓' : '↓'}</div>
        <div>
          <div class="shop-item__name">Layer ${idx + 1}</div>
          <div class="shop-item__sub">${depthText}</div>
        </div>
      `;
      if (idx !== currLayer) {
        btn.addEventListener('click', () => {
          world.player.row = b.elevatorRow;
          world.player.col = 4;
          placePlayer($('#player-sprite'), b.elevatorRow, 4);
          updateAdjacency();
          updateViewport();
          NG.modal.close();
          NG.audio.play('coin');
          flushSave();
        });
      }
      body.appendChild(btn);
    });

    NG.modal.open({
      title: '🛗 Choose Layer',
      body,
      actions: [{ label: 'Close', variant: 'ghost' }],
    });
  }

  function shopRow(title, sub, cost, enabled, onClick) {
    const row = document.createElement('button');
    row.className = 'shop-item' + (enabled ? '' : ' is-unaffordable');
    row.style.width = '100%';
    row.innerHTML = `
      <div class="shop-item__icon">${title.slice(0, 2).trim() || '•'}</div>
      <div>
        <div class="shop-item__name">${title}</div>
        <div class="shop-item__sub">${sub}</div>
      </div>
      <div class="shop-item__right">
        <div class="shop-item__cost">${cost == null ? '' : (cost === 0 ? 'free' : '💰 ' + fmt(cost))}</div>
      </div>
    `;
    if (enabled) row.addEventListener('click', onClick);
    return row;
  }

  /* --------------------------------------------------------
     SAVE / LOAD
     -------------------------------------------------------- */
  let pendingSave = false;
  function flushSave() {
    if (pendingSave) return;
    pendingSave = true;
    requestAnimationFrame(() => {
      pendingSave = false;
      save.write(state);
    });
  }
  function tryRestore() {
    const data = save.read();
    if (!data) return false;
    state = data;
    // Heal in case new mineral / country / etc. fields were added since save
    if (!state.countriesUnlocked) state.countriesUnlocked = { norway: true };
    if (!state.worlds) state.worlds = {};
    return true;
  }

  /* --------------------------------------------------------
     INIT
     -------------------------------------------------------- */
  /* --------------------------------------------------------
     Swipe/drag movement — detect finger swipes to move player
     -------------------------------------------------------- */
  function attachSwipeInput() {
    const viewport = $('.viewport');
    let swipeState = null;

    viewport.addEventListener('pointerdown', (e) => {
      swipeState = { startX: e.clientX, startY: e.clientY, moved: false };
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!swipeState) return;
      const dx = e.clientX - swipeState.startX;
      const dy = e.clientY - swipeState.startY;
      if (!swipeState.moved && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        swipeState.moved = true;
      }
    });

    viewport.addEventListener('pointerup', (e) => {
      if (!swipeState || !swipeState.moved) { swipeState = null; return; }
      const dx = e.clientX - swipeState.startX;
      const dy = e.clientY - swipeState.startY;
      let dr = 0, dc = 0;
      // Determine direction based on the larger component
      if (Math.abs(dx) > Math.abs(dy)) {
        dc = dx > 0 ? 1 : -1;
      } else {
        dr = dy > 0 ? 1 : -1;
      }
      if (dr !== 0 || dc !== 0) {
        const { player } = getWorld();
        interact(player.row + dr, player.col + dc);
      }
      swipeState = null;
    });
  }

  function init() {
    if (!tryRestore()) initState();
    render();

    $('#world').addEventListener('click', onTileClick);
    attachSwipeInput();
    window.addEventListener('keydown', onKey);

    NG.on($('#btn-shop'), 'click', openShop);
    NG.on($('#btn-reset'), 'click', async () => {
      const ok = await NG.modal.confirm({
        title: 'Wipe save?',
        body:  'You will lose all gold, pickaxes, carts and tunnels.',
        danger: true, confirmLabel: 'Wipe it',
      });
      if (ok) {
        save.clear();
        initState();
        render();
        NG.toast('Fresh start!');
      }
    });
    NG.on($('#btn-mute'), 'click', () => {
      const m = NG.audio.toggleMuted();
      $('#btn-mute').textContent = m ? '🔇' : '🔊';
    });
    if (NG.audio.isMuted()) $('#btn-mute').textContent = '🔇';

    // Autosave every 5s
    setInterval(flushSave, 5000);
    window.addEventListener('beforeunload', () => save.write(state));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
