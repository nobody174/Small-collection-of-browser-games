/* ============================================================
   klondike.js — Klondike Solitaire rules + game loop
   ------------------------------------------------------------
   Builds on:
     - NG.cards.* (engine)
     - NG.save, NG.audio, NG.ui, NG.particles  (shared framework)

   Game rules (standard Klondike, turn-1):
     - 7 tableau columns, each with i face-down + 1 face-up card
     - 4 foundations (build UP by suit, A→K)
     - Stock+Waste: click stock to flip 1 card to waste
       When stock is empty, clicking it moves waste back to stock
     - Tableau builds DOWN by alternating color
     - Empty tableau accepts only a King (or group starting with K)
     - Win = all 52 cards on the foundations
   ============================================================ */

(function () {

  /* --------------------------------------------------------
     Pile setup
     -------------------------------------------------------- */
  const piles = {
    stock:  null,
    waste:  null,
    foundations: [],
    tableau: [],
  };

  // History stack for undo
  const history = [];
  let moves = 0;
  let score = 0;
  let startTs = Date.now();
  let timerId = null;
  let pendingSave = false;
  let hintsUsed = 0;
  const maxHints = 3;
  let isDailyMode = false;
  let drawMode = 1;  // 1 or 3 cards per tap

  const $ = NG.$;
  const save = NG.save.create('cards.klondike', { version: 1 });

  /* --------------------------------------------------------
     Rules — wired into each pile as canPickup/canAccept
     -------------------------------------------------------- */

  // Tableau: pick up any face-up card AND the cards on top of it
  function tableauCanPickup(card, idx, pile) {
    return card.faceUp;
  }

  // Tableau accepts: empty → King only; non-empty → opposite color, value-1
  function tableauCanAccept(card, pile, fromPile) {
    const top = pile.top();
    if (!top) return card.rank === 'K';
    if (!top.faceUp) return false;
    return top.color !== card.color && top.value === card.value + 1;
  }

  // Foundation: pick up only the top card
  function foundationCanPickup(card, idx, pile) {
    return idx === pile.cards.length - 1;
  }

  // Foundation accepts: empty → Ace; non-empty → same suit, value+1
  function foundationCanAccept(card, pile, fromPile) {
    // Don't allow group moves to foundation
    const group = fromPile.groupFrom(card);
    if (group && group.length > 1) return false;
    const top = pile.top();
    if (!top) return card.rank === 'A';
    // Card value must be exactly 1 more than the top card
    return top.suit === card.suit && card.value === top.value + 1;
  }

  // Waste: only top card pickable
  function wasteCanPickup(card, idx, pile) {
    return idx === pile.cards.length - 1;
  }

  // Stock: no pickup (handled via tap → cycle)
  function stockCanPickup() { return false; }

  /* --------------------------------------------------------
     Build the piles + wire rules
     -------------------------------------------------------- */
  function buildPiles() {
    piles.stock = new NG.cards.Pile({
      id: 'stock', el: $('#stock'), type: 'stock', layout: 'stacked',
      canPickup: stockCanPickup,
      canAccept: () => false,
    });
    piles.waste = new NG.cards.Pile({
      id: 'waste', el: $('#waste'), type: 'waste', layout: 'stacked',
      canPickup: wasteCanPickup,
      canAccept: () => false,
    });
    for (let i = 0; i < 4; i++) {
      piles.foundations.push(new NG.cards.Pile({
        id: 'foundation-' + i, el: $('#foundation-' + i),
        type: 'foundation', layout: 'stacked',
        canPickup: foundationCanPickup,
        canAccept: foundationCanAccept,
      }));
    }
    for (let i = 0; i < 7; i++) {
      piles.tableau.push(new NG.cards.Pile({
        id: 'tableau-' + i, el: $('#tableau-' + i),
        type: 'tableau', layout: 'fan-down',
        canPickup: tableauCanPickup,
        canAccept: tableauCanAccept,
      }));
    }
  }

  function allPiles() {
    return [piles.stock, piles.waste, ...piles.foundations, ...piles.tableau];
  }

  /* --------------------------------------------------------
     Deal a fresh game
     -------------------------------------------------------- */
  function deal() {
    // Clear DOM + pile state
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });
    history.length = 0;
    moves = 0;
    score = 0;
    hintsUsed = 0;
    startTs = Date.now();
    updateStats();

    // Use seeded shuffle for daily mode, random otherwise
    let deck;
    if (isDailyMode) {
      const seed = NG.seededRandom.getTodaySeed();
      const rng = new NG.SeededRandom(seed);
      deck = NG.seededRandom.shuffle(NG.cards.createDeck(), rng);
    } else {
      deck = NG.shuffle(NG.cards.createDeck());
    }

    // Place: column i gets (i+1) cards; only the top is face-up
    let idx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[idx++];
        const isTop = row === col;
        card.setFaceUp(isTop);
        piles.tableau[col].push(card, { silent: true });
      }
    }
    // Remaining 24 → stock face-down
    while (idx < deck.length) {
      const c = deck[idx++];
      c.setFaceUp(false);
      piles.stock.push(c, { silent: true });
    }
    updateStockPileState();
    flushSave();
  }

  /* --------------------------------------------------------
     Stock tap — cycle cards to waste (draw 1 or 3, or recycle waste back)
     -------------------------------------------------------- */
  function onStockTap() {
    pushHistory();
    if (piles.stock.isEmpty()) {
      // Recycle: move all waste cards back to stock (reversed, face-down)
      // Infinite cycling with NO score penalty
      if (!piles.waste.isEmpty()) {
        const wasteCards = piles.waste.cards.slice().reverse();
        piles.waste.cards = [];  // Clear waste pile directly
        piles.waste.relayout();   // Update UI after clearing
        wasteCards.forEach(c => {
          c.setFaceUp(false);
          piles.stock.push(c, { silent: true });
        });
      }
    } else {
      // Draw mode: 1 or 3 cards
      for (let i = 0; i < drawMode; i++) {
        if (piles.stock.isEmpty()) break;
        const c = piles.stock.top();
        c.setFaceUp(true);
        piles.waste.push(c, { silent: true });
      }
    }
    NG.audio.play('flip');
    afterMove();
  }

  /* --------------------------------------------------------
     History / Undo
     -------------------------------------------------------- */
  function pushHistory() {
    // Snapshot which cards are in which pile + face state
    const snap = allPiles().map(p => ({
      pile: p.id,
      cards: p.cards.map(c => ({ id: c.el.dataset.cardId, faceUp: c.faceUp })),
    }));
    history.push({ snap, moves, score });
    if (history.length > 50) history.shift();   // cap memory
  }

  function undo() {
    if (history.length === 0) {
      NG.toast('Nothing to undo');
      return;
    }
    const prev = history.pop();

    // Build a lookup of all cards by id
    const all = {};
    allPiles().forEach(p => p.cards.forEach(c => { all[c.el.dataset.cardId] = c; }));

    // Clear current piles (DOM + state)
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });

    // Restore each card to its previous pile
    const pileById = {
      stock: piles.stock,
      waste: piles.waste,
    };
    piles.foundations.forEach((p, i) => pileById['foundation-' + i] = p);
    piles.tableau.forEach((p, i)     => pileById['tableau-' + i]    = p);

    prev.snap.forEach(rec => {
      const pile = pileById[rec.pile];
      rec.cards.forEach(c => {
        const card = all[c.id];
        if (!card) return;
        card.setFaceUp(c.faceUp);
        pile.push(card, { silent: true });
      });
    });

    moves = prev.moves;
    score = prev.score;
    updateStats();
    flushSave();
    NG.audio.play('swoosh');
  }

  /* --------------------------------------------------------
     After every move: flip newly-exposed tableau top,
     auto-send eligible cards, update stats, check win, save.
     -------------------------------------------------------- */
  function updateStockPileState() {
    // Show visual indicator when stock is empty and waste has cards (recyclable)
    if (piles.stock.isEmpty() && !piles.waste.isEmpty()) {
      piles.stock.el.classList.add('can-recycle');
    } else {
      piles.stock.el.classList.remove('can-recycle');
    }
  }

  function afterMove() {
    // Auto-flip face-down tableau tops — must run AFTER any card has been
    // removed from a column (e.g. sent to a foundation via tap) so a newly
    // exposed face-down card is never left stuck unturned.
    piles.tableau.forEach(p => {
      const t = p.top();
      if (t && !t.faceUp) {
        t.setFaceUp(true, true);
        score += 5;
      }
    });
    moves++;
    updateStats();
    checkWin();
    updateStockPileState();
    flushSave();
  }

  /* --------------------------------------------------------
     Move scoring
     -------------------------------------------------------- */
  function scoreMove(card, fromPile, toPile) {
    // Klondike-ish scoring
    if (toPile.type === 'foundation') score += 10;
    else if (fromPile.type === 'waste' && toPile.type === 'tableau') score += 5;
    else if (fromPile.type === 'foundation' && toPile.type === 'tableau') score -= 15;
  }

  /* --------------------------------------------------------
     Win check
     -------------------------------------------------------- */
  function checkWin() {
    const total = piles.foundations.reduce((s, p) => s + p.size(), 0);
    if (total === 52) {
      stopTimer();
      const elapsedMs = Date.now() - startTs;
      const elapsedSecs = Math.floor(elapsedMs / 1000);

      // Record this win in statistics
      NG.stats.recordGame('klondike', true, score, elapsedMs);

      // Check achievements
      const newAchs = NG.achievements.checkWinAchievements('klondike', elapsedMs, score, hintsUsed);
      NG.achievements.checkAchievements('klondike');
      NG.achievements.checkCrossGameAchievements();

      // Show achievements if unlocked
      if (newAchs.length > 0) {
        const achText = newAchs.map(a => `${a.emoji} ${a.name}`).join(' · ');
        setTimeout(() => {
          NG.toast(`🏆 Achievements unlocked: ${achText}`, { type: 'success', duration: 5000 });
          NG.particles.confetti({ count: 40 });
        }, 1500);
      }

      $('#win-stats').textContent =
        `${moves} moves · ${elapsedSecs}s · score ${score}`;
      $('#win-banner').classList.add('is-open');
      NG.audio.play('success');
      // Big celebration
      setTimeout(() => NG.particles.confetti({ count: 120 }), 200);
      setTimeout(() => NG.particles.confetti({ count: 80, origin: 'center' }), 700);
    }
  }

  /* --------------------------------------------------------
     Stats + timer
     -------------------------------------------------------- */
  function updateStats() {
    $('#stat-moves').textContent = 'Moves: ' + moves;
    $('#stat-score').textContent = 'Score: ' + score;
  }
  function tickTimer() {
    const s = Math.floor((Date.now() - startTs) / 1000);
    $('#stat-time').textContent = 'Time: ' + NG.formatTime(s * 1000);
  }
  function startTimer() {
    stopTimer();
    tickTimer();
    timerId = setInterval(tickTimer, 1000);
  }
  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  /* --------------------------------------------------------
     Save / load
     Lightweight — we save the visible game state (which card
     is in which pile, face state, score, moves, startTs, drawMode).
     -------------------------------------------------------- */
  function buildSaveData() {
    const cardKey = (c) => c.suit + ':' + c.rank;
    return {
      score, moves, startTs, drawMode,
      piles: allPiles().map(p => ({
        pile: p.id,
        cards: p.cards.map(c => ({ key: cardKey(c), faceUp: c.faceUp })),
      })),
    };
  }
  function flushSave() {
    if (pendingSave) return;
    pendingSave = true;
    requestAnimationFrame(() => {
      pendingSave = false;
      save.write(buildSaveData());
    });
  }
  function tryRestore() {
    const data = save.read();
    if (!data) return false;
    // Rebuild a fresh ordered deck so we can pull a Card per "suit:rank" key.
    // For duplicate-deck variants this would need a different key, but Klondike
    // uses a single deck so suit+rank is unique.
    const pool = NG.cards.createDeck();
    const byKey = {};
    pool.forEach(c => byKey[c.suit + ':' + c.rank] = c);

    // Clear existing
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });

    const pileById = { stock: piles.stock, waste: piles.waste };
    piles.foundations.forEach((p, i) => pileById['foundation-' + i] = p);
    piles.tableau.forEach((p, i)     => pileById['tableau-' + i]    = p);

    data.piles.forEach(rec => {
      const pile = pileById[rec.pile];
      rec.cards.forEach(c => {
        const card = byKey[c.key];
        if (!card) return;
        card.setFaceUp(c.faceUp);
        pile.push(card, { silent: true });
      });
    });
    score = data.score || 0;
    moves = data.moves || 0;
    startTs = data.startTs || Date.now();
    drawMode = data.drawMode || 1;  // restore draw mode, default to 1
    updateStats();
    updateStockPileState();
    return true;
  }

  /* --------------------------------------------------------
     Keyboard Shortcuts
     -------------------------------------------------------- */
  function onKeyDown(e) {
    // Don't interfere with input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    switch(key) {
      case 'z': undo(); break;
      case 'n':
        NG.modal.confirm({
          title: 'Start a new game?',
          body: 'Your current progress will be discarded.',
          confirmLabel: 'New game',
        }).then(ok => {
          if (ok) {
            $('#win-banner').classList.remove('is-open');
            deal();
            startTs = Date.now();
            startTimer();
          }
        });
        break;
      case '?': showHelp(); break;
      case 'm':
        const muted = NG.audio.toggleMuted();
        NG.toast(muted ? 'Sound muted' : 'Sound unmuted');
        break;
    }
  }

  function showHelp() {
    NG.modal.open({
      title: '♠ Klondike Solitaire Rules',
      body: document.createElement('div'),
      actions: [{ label: 'Close', variant: 'primary' }],
    });
    const body = NG.modal.lastBody || document.querySelector('.modal__body');
    if (body) {
      body.innerHTML = `
        <div style="text-align: left; font-size: 14px; line-height: 1.6;">
          <h3>Objective</h3>
          <p>Build all four suits from Ace to King on the foundations.</p>

          <h3>Rules</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Tableau:</strong> Descending alternating colors (Red on Black)</li>
            <li><strong>Foundation:</strong> Ascending by suit (A→K)</li>
            <li><strong>Empty column:</strong> Only Kings allowed</li>
            <li><strong>Stock/Waste:</strong> Click to cycle cards (recycled face-down)</li>
          </ul>

          <h3>Keyboard Shortcuts</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>[Z]</strong> - Undo last move</li>
            <li><strong>[N]</strong> - New game</li>
            <li><strong>[M]</strong> - Mute/unmute sound</li>
            <li><strong>[?]</strong> - Show this help</li>
          </ul>
        </div>
      `;
    }
  }

  function toggleDailyMode() {
    isDailyMode = !isDailyMode;
    const btn = $('#btn-daily');
    const badge = $('#daily-badge');

    if (isDailyMode) {
      btn.classList.add('is-active');
      if (badge) badge.style.display = 'inline-block';
      NG.toast('Daily Challenge mode ON - Same puzzle for everyone today!', { type: 'success' });
    } else {
      btn.classList.remove('is-active');
      if (badge) badge.style.display = 'none';
      NG.toast('Daily Challenge mode OFF', { type: 'info' });
    }

    $('#win-banner').classList.remove('is-open');
    deal();
    startTs = Date.now();
    startTimer();
  }

  function showHint() {
    if (hintsUsed >= maxHints) {
      NG.toast(`No more hints! (${maxHints}/${maxHints} used)`, { type: 'warning' });
      return;
    }

    const hint = NG.hints.getBestMove(allPiles(), 'klondike');
    if (!hint) {
      NG.toast('No hints available (no legal moves found)', { type: 'info' });
      return;
    }

    NG.hints.highlightMove(hint.card, hint.toPile);
    score = Math.max(0, score - 20); // Penalty for using hint
    hintsUsed++;
    updateStats();

    NG.toast(`Hint: Move to ${hint.toPile.type} (${hintsUsed}/${maxHints} hints used)`, { type: 'info' });
  }

  function showStats() {
    const stats = NG.stats.getStats('klondike');
    const winRate = NG.stats.getWinRate('klondike');
    const avgTime = stats.gamesPlayed > 0 ? NG.stats.formatTime(stats.totalTime / stats.gamesPlayed) : '--:--';
    const unlockedAchs = NG.achievements.getUnlocked('klondike');
    const lockedAchs = NG.achievements.getLocked('klondike');

    NG.modal.open({
      title: '📊 Your Statistics',
      body: document.createElement('div'),
      actions: [
        { label: 'Reset Stats', variant: 'ghost', onclick: () => {
          NG.stats.reset('klondike');
          NG.toast('Statistics reset', { type: 'success' });
          NG.modal.close();
        }},
        { label: 'Close', variant: 'primary' }
      ],
    });
    const body = NG.modal.lastBody || document.querySelector('.modal__body');
    if (body) {
      body.innerHTML = `
        <div style="text-align: left; font-size: 14px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
            <div>
              <div style="font-weight: bold; color: #888; font-size: 12px;">GAMES PLAYED</div>
              <div style="font-size: 32px; font-weight: bold; color: #7c5cff;">${stats.gamesPlayed}</div>
            </div>
            <div>
              <div style="font-weight: bold; color: #888; font-size: 12px;">WIN RATE</div>
              <div style="font-size: 32px; font-weight: bold; color: #22c55e;">${winRate}%</div>
            </div>
            <div>
              <div style="font-weight: bold; color: #888; font-size: 12px;">CURRENT STREAK</div>
              <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.currentStreak}</div>
            </div>
            <div>
              <div style="font-weight: bold; color: #888; font-size: 12px;">BEST STREAK</div>
              <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.bestStreak}</div>
            </div>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
            <h4 style="margin: 10px 0; color: #7c5cff;">Performance</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Best Score</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${stats.bestScore}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; color: #666;">Best Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${stats.bestTime ? NG.stats.formatTime(stats.bestTime) : '--:--'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Average Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold;">${avgTime}</td>
              </tr>
            </table>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
            <h4 style="margin: 10px 0; color: #7c5cff;">Achievements (${unlockedAchs.length})</h4>
            ${unlockedAchs.length > 0 ? `
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 12px 0;">
                ${unlockedAchs.map(a => `
                  <div style="text-align: center; padding: 12px; background: #f0f0f0; border-radius: 8px; cursor: help;" title="${a.description}">
                    <div style="font-size: 24px; margin-bottom: 4px;">${a.emoji}</div>
                    <div style="font-size: 11px; font-weight: bold; color: #333;">${a.name}</div>
                  </div>
                `).join('')}
              </div>
            ` : '<div style="color: #999; padding: 12px 0;">No achievements yet. Keep playing!</div>'}
          </div>
        </div>
      `;
    }
  }

  /* --------------------------------------------------------
     Splash screen - always show until user clicks Start
     -------------------------------------------------------- */
  function setupSplashScreen() {
    const splash = document.getElementById('card-splash');
    if (!splash) return;

    // Always show splash - user dismisses by clicking Start
    const startBtn = document.getElementById('splash-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        splash.classList.add('hidden');
      });
    }
  }

  /* --------------------------------------------------------
     Draw mode selection - shown on new game
     -------------------------------------------------------- */
  async function selectDrawMode() {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        backdrop-filter: blur(2px);
      `;

      const card = document.createElement('div');
      card.style.cssText = `
        background: var(--ng-bg-surface);
        border-radius: var(--ng-radius-xl);
        box-shadow: var(--ng-shadow-lg);
        padding: var(--ng-space-6);
        max-width: 420px;
        text-align: center;
      `;

      card.innerHTML = `
        <h2 style="margin: 0 0 var(--ng-space-3) 0; color: var(--ng-text-strong);">Draw Mode</h2>
        <p style="margin: 0 0 var(--ng-space-5) 0; color: var(--ng-text-muted);">How many cards to draw per click?</p>
        <div style="display: flex; gap: var(--ng-space-3);">
          <button class="btn btn--primary" style="flex: 1;" id="draw-1">Draw 1</button>
          <button class="btn btn--ghost" style="flex: 1;" id="draw-3">Draw 3</button>
        </div>
      `;

      modal.appendChild(card);
      document.body.appendChild(modal);

      const handle = (mode) => {
        modal.remove();
        drawMode = mode;
        resolve(mode);
      };

      card.querySelector('#draw-1').addEventListener('click', () => handle(1));
      card.querySelector('#draw-3').addEventListener('click', () => handle(3));
    });
  }

  /* --------------------------------------------------------
     Init
     -------------------------------------------------------- */
  function init() {
    setupSplashScreen();
    buildPiles();

    // Try to restore a save; otherwise show draw mode selection for fresh game
    if (!tryRestore()) {
      selectDrawMode().then(() => {
        deal();
        startTimer();
      });
    } else {
      startTimer();
    }

    // Setup keyboard shortcuts
    document.addEventListener('keydown', onKeyDown);

    // Wire drag/drop on the whole board
    NG.cards.makeDraggable(document.body, {
      piles: allPiles(),
      // Capture undo state BEFORE the move actually happens
      beforeMove(card, fromPile, toPile, group) {
        pushHistory();
      },
      onMove(card, fromPile, toPile, group) {
        scoreMove(card, fromPile, toPile);
        afterMove();
      },
      onTap(card, pile) {
        // Tap on stock → cycle
        if (pile.type === 'stock') {
          onStockTap();
          return;
        }
        // Double-tap-to-foundation isn't implemented; instead, single tap
        // on a foundation-eligible card auto-sends it.
        if (card.faceUp && (pile.type === 'waste' || pile.type === 'tableau')) {
          const idx = pile.cards.indexOf(card);
          if (idx !== pile.cards.length - 1) return;       // only top card auto-sends
          for (const f of piles.foundations) {
            if (foundationCanAccept(card, f, pile)) {
              pushHistory();
              f.push(card);            // Pile.push handles removing from source
              pile.relayout();         // source pile re-fans now that top is gone
              scoreMove(card, pile, f);
              NG.audio.play('coin');
              afterMove();
              return;
            }
          }
        }
      }
    });

    // Stock pile click handler (for when stock is empty and needs to be recycled)
    // The drag system only handles clicks on .card elements, so we need explicit handler for empty stock
    NG.on(piles.stock.el, 'click', onStockTap);

    // Buttons
    NG.on($('#btn-undo'), 'click', undo);
    NG.on($('#btn-hint'), 'click', showHint);
    NG.on($('#btn-daily'), 'click', toggleDailyMode);
    NG.on($('#btn-stats'), 'click', showStats);
    NG.on($('#btn-new'),  'click', async () => {
      const ok = await NG.modal.confirm({
        title: 'Start a new game?',
        body: 'Your current progress will be discarded.',
        confirmLabel: 'New game',
      });
      if (ok) {
        $('#win-banner').classList.remove('is-open');
        await selectDrawMode();
        deal();
        startTs = Date.now();
        startTimer();
      }
    });

    NG.on($('#win-again'), 'click', async () => {
      $('#win-banner').classList.remove('is-open');
      await selectDrawMode();
      deal();
      startTs = Date.now();
      startTimer();
    });
  }

  // Boot when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
