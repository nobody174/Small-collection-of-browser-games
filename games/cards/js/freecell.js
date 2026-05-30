/* ============================================================
   freecell.js — FreeCell solitaire
   ------------------------------------------------------------
   Rules summary:
     - 52 cards, all dealt face-up into 8 tableau columns
       (first 4 columns get 7 cards, last 4 get 6 cards)
     - 4 "free cells" (each holds exactly 1 card)
     - 4 foundations (build UP by suit, A→K)
     - Tableau builds DOWN, alternating colors (red on black, etc.)
     - You can only physically move ONE card at a time, but the
       SuperMove rule lets you move a group as if you'd shuttled them
       through free cells / empty columns:
         max group = (emptyFreeCells + 1) × 2 ^ emptyTableauCols
       (an empty destination tableau column is NOT counted)
     - Empty tableau column accepts any card
     - Win = all 52 cards on the foundations
   ============================================================ */

(function () {

  const $ = NG.$;

  const piles = {
    freecells: [],
    foundations: [],
    tableau: [],
  };

  let history = [];
  let savedDeck = [];
  let moves = 0;
  let score = 0;
  let startTs = Date.now();
  let timerId = null;
  let pendingSave = false;

  const save = NG.save.create('cards.freecell', { version: 1 });

  /* --------------------------------------------------------
     Helpers for SuperMove sizing
     -------------------------------------------------------- */
  function emptyFreeCellCount() {
    return piles.freecells.filter(p => p.isEmpty()).length;
  }
  function emptyTableauCount(excludePile) {
    return piles.tableau.filter(p => p !== excludePile && p.isEmpty()).length;
  }
  function maxMoveSize(destPile) {
    return (emptyFreeCellCount() + 1) * Math.pow(2, emptyTableauCount(destPile));
  }

  /* --------------------------------------------------------
     Rules
     -------------------------------------------------------- */

  // Tableau: pickup if face-up AND group is descending alternating color
  function tableauCanPickup(card, idx, pile) {
    if (!card.faceUp) return false;
    for (let i = idx; i < pile.cards.length - 1; i++) {
      const c = pile.cards[i];
      const nxt = pile.cards[i + 1];
      if (nxt.color === c.color) return false;
      if (nxt.value !== c.value - 1) return false;
    }
    return true;
  }
  function tableauCanAccept(card, pile, fromPile) {
    const top = pile.top();
    // Value/color check
    if (top) {
      if (top.color === card.color) return false;
      if (top.value !== card.value + 1) return false;
    }
    // SuperMove size check
    const group = fromPile.groupFrom ? fromPile.groupFrom(card) : null;
    if (group && group.length > maxMoveSize(pile)) return false;
    return true;
  }

  // Free cell: only top card pickable; only accepts a single card into empty cell
  function freeCanPickup(card, idx, pile) {
    return idx === pile.cards.length - 1;
  }
  function freeCanAccept(card, pile, fromPile) {
    if (!pile.isEmpty()) return false;
    const group = fromPile.groupFrom ? fromPile.groupFrom(card) : null;
    if (group && group.length > 1) return false;
    return true;
  }

  // Foundation: pickup top; accept same-suit ascending (single card only)
  function foundationCanPickup(card, idx, pile) {
    return idx === pile.cards.length - 1;
  }
  function foundationCanAccept(card, pile, fromPile) {
    const group = fromPile.groupFrom ? fromPile.groupFrom(card) : null;
    if (group && group.length > 1) return false;
    const top = pile.top();
    if (!top) return card.rank === 'A';
    return top.suit === card.suit && top.value === card.value - 1;
  }

  /* --------------------------------------------------------
     Build piles
     -------------------------------------------------------- */
  function buildPiles() {
    for (let i = 0; i < 4; i++) {
      piles.freecells.push(new NG.cards.Pile({
        id: 'free-' + i, el: $('#free-' + i),
        type: 'free', layout: 'stacked',
        canPickup: freeCanPickup, canAccept: freeCanAccept,
      }));
      piles.foundations.push(new NG.cards.Pile({
        id: 'foundation-' + i, el: $('#foundation-' + i),
        type: 'foundation', layout: 'stacked',
        canPickup: foundationCanPickup, canAccept: foundationCanAccept,
      }));
    }
    for (let i = 0; i < 8; i++) {
      piles.tableau.push(new NG.cards.Pile({
        id: 'tableau-' + i, el: $('#tableau-' + i),
        type: 'tableau', layout: 'fan-down',
        canPickup: tableauCanPickup, canAccept: tableauCanAccept,
      }));
    }
  }
  function allPiles() {
    return [...piles.freecells, ...piles.foundations, ...piles.tableau];
  }

  /* --------------------------------------------------------
     Deal a fresh game
     -------------------------------------------------------- */
  function deal() {
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });
    history = [];
    moves = 0;
    score = 0;
    startTs = Date.now();

    const deck = NG.shuffle(NG.cards.createDeck());
    deck.forEach((c, i) => c.dealIdx = i);
    savedDeck = deck;

    // 7 cards into first 4 columns, 6 into the rest, all face-up
    let idx = 0;
    for (let col = 0; col < 8; col++) {
      const n = col < 4 ? 7 : 6;
      for (let row = 0; row < n; row++) {
        const c = deck[idx++];
        c.setFaceUp(true);
        piles.tableau[col].push(c, { silent: true });
      }
    }
    updateStats();
    flushSave();
  }

  /* --------------------------------------------------------
     History / undo
     -------------------------------------------------------- */
  function pushHistory() {
    const snap = allPiles().map(p => ({
      pile: p.id,
      cards: p.cards.map(c => ({ idx: c.dealIdx, faceUp: c.faceUp })),
    }));
    history.push({ snap, moves, score });
    if (history.length > 50) history.shift();
  }
  function undo() {
    if (history.length === 0) { NG.toast('Nothing to undo'); return; }
    const prev = history.pop();

    const all = {};
    savedDeck.forEach(c => { all[c.dealIdx] = c; });

    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });

    const pileById = {};
    piles.freecells.forEach((p, i) => pileById['free-' + i] = p);
    piles.foundations.forEach((p, i) => pileById['foundation-' + i] = p);
    piles.tableau.forEach((p, i) => pileById['tableau-' + i] = p);

    prev.snap.forEach(rec => {
      const pile = pileById[rec.pile];
      rec.cards.forEach(c => {
        const card = all[c.idx];
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
     After a move
     -------------------------------------------------------- */
  function afterMove() {
    moves++;
    updateStats();
    checkWin();
    flushSave();
  }
  function scoreMove(card, fromPile, toPile) {
    if (toPile.type === 'foundation') score += 10;
    else if (fromPile.type === 'foundation') score -= 15;
    else if (toPile.type === 'tableau' && fromPile.type === 'free') score += 5;
  }
  function checkWin() {
    const total = piles.foundations.reduce((s, p) => s + p.size(), 0);
    if (total === 52) {
      stopTimer();
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      $('#win-stats').textContent = `${moves} moves · ${elapsed}s · score ${score}`;
      $('#win-banner').classList.add('is-open');
      NG.audio.play('success');
      setTimeout(() => NG.particles.confetti({ count: 140 }), 200);
      setTimeout(() => NG.particles.confetti({ count: 80, origin: 'center' }), 700);
    }
  }

  /* --------------------------------------------------------
     Stats / timer
     -------------------------------------------------------- */
  function updateStats() {
    $('#stat-moves').textContent = 'Moves: ' + moves;
    $('#stat-score').textContent = 'Score: ' + score;
  }
  function tickTimer() {
    const s = Math.floor((Date.now() - startTs) / 1000);
    $('#stat-time').textContent = 'Time: ' + NG.formatTime(s * 1000);
  }
  function startTimer() { stopTimer(); tickTimer(); timerId = setInterval(tickTimer, 1000); }
  function stopTimer()  { if (timerId) clearInterval(timerId); timerId = null; }

  /* --------------------------------------------------------
     Save / load
     -------------------------------------------------------- */
  function buildSaveData() {
    return {
      score, moves, startTs,
      deckOrder: savedDeck.map(c => c.suit + ':' + c.rank),
      piles: allPiles().map(p => ({
        pile: p.id,
        cards: p.cards.map(c => ({ idx: c.dealIdx, faceUp: c.faceUp })),
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
    const deck = data.deckOrder.map((k, i) => {
      const [suit, rank] = k.split(':');
      const c = new NG.cards.Card(suit, rank);
      c.dealIdx = i;
      return c;
    });
    savedDeck = deck;
    score = data.score || 0;
    moves = data.moves || 0;
    startTs = data.startTs || Date.now();

    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });

    const pileById = {};
    piles.freecells.forEach((p, i) => pileById['free-' + i] = p);
    piles.foundations.forEach((p, i) => pileById['foundation-' + i] = p);
    piles.tableau.forEach((p, i) => pileById['tableau-' + i] = p);

    data.piles.forEach(rec => {
      const pile = pileById[rec.pile];
      rec.cards.forEach(c => {
        const card = deck[c.idx];
        if (!card) return;
        card.setFaceUp(c.faceUp);
        pile.push(card, { silent: true });
      });
    });
    updateStats();
    return true;
  }

  /* --------------------------------------------------------
     Init
     -------------------------------------------------------- */
  function init() {
    buildPiles();
    if (!tryRestore()) deal();
    startTimer();

    NG.cards.makeDraggable(document.body, {
      piles: allPiles(),
      beforeMove() { pushHistory(); },
      onMove(card, fromPile, toPile) {
        scoreMove(card, fromPile, toPile);
        afterMove();
      },
      onTap(card, pile) {
        // Single-tap auto-send to foundation if eligible
        if (!card.faceUp) return;
        const idx = pile.cards.indexOf(card);
        if (idx !== pile.cards.length - 1) return;
        for (const f of piles.foundations) {
          if (foundationCanAccept(card, f, pile)) {
            pushHistory();
            f.push(card);
            pile.relayout();
            scoreMove(card, pile, f);
            NG.audio.play('coin');
            afterMove();
            return;
          }
        }
        // Else: try sending to an empty free cell if it's a tableau top
        if (pile.type === 'tableau') {
          for (const fc of piles.freecells) {
            if (freeCanAccept(card, fc, pile)) {
              pushHistory();
              fc.push(card);
              pile.relayout();
              NG.audio.play('flip');
              afterMove();
              return;
            }
          }
        }
      }
    });

    NG.on($('#btn-undo'), 'click', undo);
    NG.on($('#btn-new'),  'click', async () => {
      const ok = await NG.modal.confirm({
        title: 'Start a new game?',
        body:  'Current progress will be discarded.',
        confirmLabel: 'New game'
      });
      if (ok) {
        $('#win-banner').classList.remove('is-open');
        deal();
        startTs = Date.now();
        startTimer();
      }
    });

    NG.on($('#win-again'), 'click', () => {
      $('#win-banner').classList.remove('is-open');
      deal();
      startTs = Date.now();
      startTimer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
