/* ============================================================
   spider.js — Spider Solitaire (1, 2 or 4 suit)
   ------------------------------------------------------------
   Rules summary:
     - 2 decks (104 cards), 10 tableau columns
     - First 4 columns get 6 cards, last 6 columns get 5 cards
       (only the top card of each column starts face-up)
     - 50 cards remain in stock (5 deals × 10 cards)
     - Tableau builds DOWN by ANY suit (e.g. 7♣ on 8♥ is allowed)
     - You can only PICK UP a group if it's a descending same-suit
       sequence (e.g. 7♠ 6♠ 5♠ can move together)
     - Stock deals 1 face-up card to EACH column at once
     - You cannot deal if any column is empty
     - When a column ends with K→A of the SAME suit, that 13-card
       sequence is removed and counts toward winning
     - Win = 8 sequences completed
   ============================================================ */

(function () {

  const $ = NG.$;

  const piles = {
    stock: null,
    tableau: [],
  };

  // Game state
  let history = [];
  let savedDeck = [];        // the full deck in original deal order
  let suits = 1;             // difficulty: 1, 2 or 4
  let completed = 0;         // completed K-A sequences
  let moves = 0;
  let score = 500;           // Spider starts with bonus that decreases per move
  let startTs = Date.now();
  let timerId = null;

  const save = NG.save.create('cards.spider', { version: 1 });

  /* --------------------------------------------------------
     Rules
     -------------------------------------------------------- */

  // Pickup: face-up card and all cards above must form descending
  // same-suit sequence.
  function spiderCanPickup(card, idx, pile) {
    if (!card.faceUp) return false;
    for (let i = idx; i < pile.cards.length - 1; i++) {
      const c = pile.cards[i];
      const nxt = pile.cards[i + 1];
      if (nxt.suit !== c.suit) return false;
      if (nxt.value !== c.value - 1) return false;
    }
    return true;
  }

  // Accept: empty pile → anything; non-empty → top is value+1 (any suit)
  function spiderCanAccept(card, pile, fromPile) {
    const top = pile.top();
    if (!top) return true;
    return top.faceUp && top.value === card.value + 1;
  }

  // Stock: not draggable; tap triggers a 10-card deal
  function stockCanPickup() { return false; }

  /* --------------------------------------------------------
     Build piles
     -------------------------------------------------------- */
  function buildPiles() {
    piles.stock = new NG.cards.Pile({
      id: 'stock', el: $('#stock'), type: 'stock', layout: 'stacked',
      canPickup: stockCanPickup, canAccept: () => false,
    });
    piles.tableau = [];
    for (let i = 0; i < 10; i++) {
      piles.tableau.push(new NG.cards.Pile({
        id: 'tableau-' + i, el: $('#tableau-' + i),
        type: 'tableau', layout: 'fan-down',
        canPickup: spiderCanPickup, canAccept: spiderCanAccept,
      }));
    }
  }
  function allPiles() { return [piles.stock, ...piles.tableau]; }

  /* --------------------------------------------------------
     Build a 104-card deck for the chosen difficulty.
     1-suit  → 8 × all-spades (104)
     2-suit  → 4 × spades + 4 × hearts (104)
     4-suit  → 2 standard decks (104)
     -------------------------------------------------------- */
  function buildDeckFor(s) {
    if (s === 4) return NG.cards.createDeck(2);
    if (s === 2) return NG.cards.createDeck(2, ['spades', 'hearts']);
    return NG.cards.createDeck(2, ['spades']);
  }

  /* --------------------------------------------------------
     Deal a new game
     -------------------------------------------------------- */
  function deal() {
    // Wipe DOM + pile state
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });
    history = [];
    moves = 0;
    score = 500;
    completed = 0;
    startTs = Date.now();

    // Build + shuffle a 104-card deck for the current difficulty
    const deck = NG.shuffle(buildDeckFor(suits));
    deck.forEach((c, i) => c.dealIdx = i);   // stable index for save/load
    savedDeck = deck;

    // First 4 columns: 6 cards (5 down + 1 up).
    // Last 6 columns: 5 cards (4 down + 1 up).
    let idx = 0;
    for (let col = 0; col < 10; col++) {
      const n = col < 4 ? 6 : 5;
      for (let row = 0; row < n; row++) {
        const c = deck[idx++];
        c.setFaceUp(row === n - 1);
        piles.tableau[col].push(c, { silent: true });
      }
    }
    // Remaining 50 cards → stock face-down
    while (idx < deck.length) {
      const c = deck[idx++];
      c.setFaceUp(false);
      piles.stock.push(c, { silent: true });
    }
    updateStats();
    flushSave();
  }

  /* --------------------------------------------------------
     Stock tap — deal 1 face-up card to each of 10 columns
     -------------------------------------------------------- */
  function onStockTap() {
    if (piles.stock.isEmpty()) return;
    // Spider rule: every column must be non-empty before a deal
    if (piles.tableau.some(p => p.isEmpty())) {
      NG.toast('Fill empty columns before dealing', { type: 'warning' });
      NG.audio.play('error');
      return;
    }
    pushHistory();
    for (let i = 0; i < 10; i++) {
      if (piles.stock.isEmpty()) break;
      const c = piles.stock.top();
      c.setFaceUp(true);
      piles.tableau[i].push(c, { silent: true });
    }
    NG.audio.play('flip');
    afterMove();
  }

  /* --------------------------------------------------------
     History / undo  (snapshot-based, same approach as Klondike)
     -------------------------------------------------------- */
  function pushHistory() {
    const snap = allPiles().map(p => ({
      pile: p.id,
      cards: p.cards.map(c => ({ idx: c.dealIdx, faceUp: c.faceUp })),
    }));
    history.push({ snap, moves, score, completed });
    if (history.length > 50) history.shift();
  }

  function undo() {
    if (history.length === 0) { NG.toast('Nothing to undo'); return; }
    const prev = history.pop();

    // Lookup of every Card by its stable dealIdx
    const all = {};
    savedDeck.forEach(c => { all[c.dealIdx] = c; });

    // Clear piles + DOM
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });

    const pileById = { stock: piles.stock };
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
    completed = prev.completed;
    updateStats();
    flushSave();
    NG.audio.play('swoosh');
  }

  /* --------------------------------------------------------
     After every move: auto-flip exposed face-down tops,
     check for completed K→A same-suit sequences, update stats, save.
     -------------------------------------------------------- */
  function afterMove() {
    // Auto-flip the new top of each column
    piles.tableau.forEach(p => {
      const t = p.top();
      if (t && !t.faceUp) {
        t.setFaceUp(true, true);
      }
    });
    checkCompletedSequences();
    moves++;
    score = Math.max(0, score - 1);  // tiny per-move penalty (encourages thought)
    updateStats();
    checkWin();
    flushSave();
  }

  /* When a column ends with K-Q-J-...-A all same suit, remove those 13 */
  function checkCompletedSequences() {
    let any = false;
    for (const p of piles.tableau) {
      if (p.size() < 13) continue;
      const tail = p.cards.slice(-13);
      let valid = true;
      const suit = tail[0].suit;
      for (let i = 0; i < 13; i++) {
        const c = tail[i];
        if (!c.faceUp || c.suit !== suit || c.value !== 13 - i) {
          valid = false; break;
        }
      }
      if (valid) {
        // Animate out then remove (simple: just remove for now)
        tail.forEach(c => c.el.remove());
        p.cards.splice(p.cards.length - 13, 13);
        p.relayout();
        completed++;
        score += 100;
        any = true;
      }
    }
    if (any) {
      NG.audio.play('success');
      NG.particles.confetti({ count: 60 });
    }
  }

  /* --------------------------------------------------------
     Win
     -------------------------------------------------------- */
  function checkWin() {
    if (completed >= 8) {
      stopTimer();
      const elapsed = Math.floor((Date.now() - startTs) / 1000);
      $('#win-stats').textContent =
        `${moves} moves · ${elapsed}s · score ${score} · ${suits}-suit`;
      $('#win-banner').classList.add('is-open');
      NG.audio.play('success');
      setTimeout(() => NG.particles.confetti({ count: 140 }), 200);
      setTimeout(() => NG.particles.confetti({ count: 80, origin: 'center' }), 700);
    }
  }

  /* --------------------------------------------------------
     Stats + timer + stock count
     -------------------------------------------------------- */
  function updateStats() {
    $('#stat-moves').textContent = 'Moves: ' + moves;
    $('#stat-score').textContent = 'Score: ' + score;
    $('#stat-completed').textContent = `Sets: ${completed}/8`;
    const dealsLeft = Math.floor(piles.stock.size() / 10);
    $('#stock-count').textContent = dealsLeft;
    $('#stock-count').style.visibility = dealsLeft > 0 ? '' : 'hidden';
  }
  function tickTimer() {
    const s = Math.floor((Date.now() - startTs) / 1000);
    $('#stat-time').textContent = 'Time: ' + NG.formatTime(s * 1000);
  }
  function startTimer() { stopTimer(); tickTimer(); timerId = setInterval(tickTimer, 1000); }
  function stopTimer()  { if (timerId) clearInterval(timerId); timerId = null; }

  /* --------------------------------------------------------
     Save / load — uses dealIdx so duplicate suits work
     -------------------------------------------------------- */
  let pendingSave = false;
  function buildSaveData() {
    return {
      suits, completed, score, moves, startTs,
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

    // Re-build cards in the saved deck order
    const deck = data.deckOrder.map((k, i) => {
      const [suit, rank] = k.split(':');
      const c = new NG.cards.Card(suit, rank);
      c.dealIdx = i;
      return c;
    });
    savedDeck = deck;
    suits = data.suits || 1;
    completed = data.completed || 0;
    score = data.score || 500;
    moves = data.moves || 0;
    startTs = data.startTs || Date.now();

    // Clear current piles
    allPiles().forEach(p => {
      p.cards.forEach(c => c.el.remove());
      p.cards.length = 0;
    });
    const pileById = { stock: piles.stock };
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
  function setDifficulty(s, forceNew = false) {
    suits = s;
    NG.$$('.difficulty-row .btn').forEach(b => {
      b.classList.toggle('is-active', parseInt(b.dataset.suits) === s);
    });
    if (forceNew) {
      $('#win-banner').classList.remove('is-open');
      deal();
      startTs = Date.now();
      startTimer();
    }
  }

  function init() {
    buildPiles();

    // Try to restore a saved game; otherwise deal a fresh 1-suit game
    if (!tryRestore()) {
      setDifficulty(1);
      deal();
    } else {
      setDifficulty(suits);
    }
    startTimer();

    NG.cards.makeDraggable(document.body, {
      piles: allPiles(),
      beforeMove() { pushHistory(); },
      onMove(card, fromPile, toPile) {
        // Bonus: any move that lands on a same-suit run is implicit;
        // just run afterMove which handles flipping, completion, win.
        afterMove();
      },
      onTap(card, pile) {
        if (pile.type === 'stock') { onStockTap(); return; }
      }
    });

    // Buttons
    NG.on($('#btn-undo'), 'click', undo);
    NG.on($('#btn-new'),  'click', async () => {
      const ok = await NG.modal.confirm({
        title: 'Start a new game?',
        body:  'Current progress will be discarded.',
        confirmLabel: 'New game'
      });
      if (ok) setDifficulty(suits, true);
    });

    // Difficulty buttons
    NG.$$('.difficulty-row .btn').forEach(btn => {
      NG.on(btn, 'click', async () => {
        const s = parseInt(btn.dataset.suits);
        if (s === suits) return;
        const ok = await NG.modal.confirm({
          title: 'Change difficulty?',
          body:  'Starting a new game will discard current progress.',
          confirmLabel: 'Start new'
        });
        if (ok) setDifficulty(s, true);
      });
    });

    NG.on($('#win-again'), 'click', () => setDifficulty(suits, true));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
