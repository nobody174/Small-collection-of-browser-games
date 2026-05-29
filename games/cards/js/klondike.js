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
    return top.suit === card.suit && top.value === card.value - 1;
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
    startTs = Date.now();
    updateStats();

    const deck = NG.shuffle(NG.cards.createDeck());

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
    flushSave();
  }

  /* --------------------------------------------------------
     Stock tap — cycle a card to waste (or recycle waste back)
     -------------------------------------------------------- */
  function onStockTap() {
    pushHistory();
    if (piles.stock.isEmpty()) {
      // Move all waste cards back to stock (reversed, face-down)
      const wasteCards = piles.waste.cards.slice().reverse();
      wasteCards.forEach(c => {
        c.setFaceUp(false);
        piles.stock.push(c, { silent: true });
      });
      score = Math.max(0, score - 100);   // small penalty for recycle
    } else {
      const c = piles.stock.top();
      c.setFaceUp(true);
      piles.waste.push(c, { silent: true });
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
     update stats, check win, save.
     -------------------------------------------------------- */
  function afterMove() {
    // Auto-flip face-down tableau tops
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
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      $('#win-stats').textContent =
        `${moves} moves · ${elapsed}s · score ${score}`;
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
     is in which pile, face state, score, moves, startTs).
     -------------------------------------------------------- */
  function buildSaveData() {
    const cardKey = (c) => c.suit + ':' + c.rank;
    return {
      score, moves, startTs,
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
    updateStats();
    return true;
  }

  /* --------------------------------------------------------
     Init
     -------------------------------------------------------- */
  function init() {
    buildPiles();

    // Try to restore a save; otherwise deal fresh
    if (!tryRestore()) deal();
    startTimer();

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

    // Buttons
    NG.on($('#btn-undo'), 'click', undo);
    NG.on($('#btn-new'),  'click', async () => {
      const ok = await NG.modal.confirm({
        title: 'Start a new game?',
        body: 'Your current progress will be discarded.',
        confirmLabel: 'New game',
      });
      if (ok) {
        $('#win-banner').classList.remove('is-open');
        deal();
        startTs = Date.now();
        startTimer();
      }
    });
    NG.on($('#btn-mute'), 'click', () => {
      const m = NG.audio.toggleMuted();
      $('#btn-mute').textContent = m ? '🔇' : '🔊';
    });
    if (NG.audio.isMuted()) $('#btn-mute').textContent = '🔇';

    NG.on($('#win-again'), 'click', () => {
      $('#win-banner').classList.remove('is-open');
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
