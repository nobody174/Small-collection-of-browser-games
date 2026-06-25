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
  let hintsUsed = 0;
  const maxHints = 3;

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
    const empty = emptyFreeCellCount();
    const emptyTab = emptyTableauCount(destPile);
    // SuperMove formula: groups can be at most (1 + emptyFreeCells) * 2^emptyTableauCols
    // If destination is empty, it doesn't count as a "storage slot" for this calculation
    // since we're moving INTO it, not through it. Formula: (n + 1) * 2^k where n=free cells,
    // k=empty tableau columns (excluding destination if it's empty).
    return (empty + 1) * Math.pow(2, emptyTab);
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
      const elapsedMs = Date.now() - startTs;
      const elapsed = Math.floor(elapsedMs / 1000);

      // Record this win in statistics
      NG.stats.recordGame('freecell', true, score, elapsedMs);

      // Check achievements
      const newAchs = NG.achievements.checkWinAchievements('freecell', elapsedMs, score, hintsUsed);
      NG.achievements.checkAchievements('freecell');
      NG.achievements.checkCrossGameAchievements();

      if (newAchs.length > 0) {
        const achText = newAchs.map(a => `${a.emoji} ${a.name}`).join(' · ');
        setTimeout(() => {
          NG.toast(`🏆 Achievements unlocked: ${achText}`, { type: 'success', duration: 5000 });
          NG.particles.confetti({ count: 40 });
        }, 1500);
      }

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
     Statistics Modal
     -------------------------------------------------------- */
  function showHint() {
    if (hintsUsed >= maxHints) {
      NG.toast(`No more hints! (${maxHints}/${maxHints} used)`, { type: 'warning' });
      return;
    }

    const hint = NG.hints.getBestMove(allPiles(), 'freecell');
    if (!hint) {
      NG.toast('No hints available', { type: 'info' });
      return;
    }

    NG.hints.highlightMove(hint.card, hint.toPile);
    score = Math.max(0, score - 20);
    hintsUsed++;
    updateStats();

    NG.toast(`Hint: Move to ${hint.toPile.type} (${hintsUsed}/${maxHints} hints used)`, { type: 'info' });
  }

  function showStats() {
    const stats = NG.stats.getStats('freecell');
    const winRate = NG.stats.getWinRate('freecell');
    const avgTime = stats.gamesPlayed > 0 ? NG.stats.formatTime(stats.totalTime / stats.gamesPlayed) : '--:--';
    const unlockedAchs = NG.achievements.getUnlocked('freecell');

    NG.modal.open({
      title: '📊 Your Statistics',
      body: document.createElement('div'),
      actions: [
        { label: 'Reset Stats', variant: 'ghost', onclick: () => {
          NG.stats.reset('freecell');
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
     Keyboard Shortcuts
     -------------------------------------------------------- */
  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    switch(key) {
      case 'z': undo(); break;
      case 'n':
        NG.modal.confirm({
          title: 'Start a new game?',
          body: 'Current progress will be discarded.',
          confirmLabel: 'New game'
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
      title: '♣ FreeCell Rules',
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
            <li><strong>Tableau:</strong> Descending alternating colors</li>
            <li><strong>Free Cells:</strong> Store 1 card temporarily</li>
            <li><strong>SuperMove:</strong> Move groups using free cells as temporary storage</li>
            <li><strong>Foundation:</strong> Ascending by suit (A→K)</li>
          </ul>

          <h3>SuperMove Formula</h3>
          <p style="margin: 10px 0; font-size: 13px;">
            Max cards = (empty free cells + 1) × 2<sup>empty tableau columns</sup>
          </p>

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

  /* --------------------------------------------------------
     Splash screen
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
     Init
     -------------------------------------------------------- */
  function init() {
    setupSplashScreen();
    buildPiles();
    if (!tryRestore()) deal();
    startTimer();

    // Setup keyboard shortcuts
    document.addEventListener('keydown', onKeyDown);

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
    NG.on($('#btn-hint'), 'click', showHint);
    NG.on($('#btn-stats'), 'click', showStats);
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
