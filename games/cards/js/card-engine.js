/* ============================================================
   card-engine.js — Shared card engine for all solitaire variants
   ------------------------------------------------------------
   Provides:
     NG.cards.Card           — a single card (suit, rank, DOM el)
     NG.cards.createDeck()   — build a standard 52-card deck (or 2 decks)
     NG.cards.Pile           — a collection of cards with a layout
     NG.cards.makeDraggable  — pointer-based drag/drop with hit testing
     NG.cards.dealStaggered  — animated initial deal
     NG.cards.SUITS/RANKS    — constants

   The engine is intentionally rules-agnostic. Each variant
   (Klondike, Spider, FreeCell) plugs in its own canPickup /
   canAccept functions per pile.
   ============================================================ */

window.NG = window.NG || {};
NG.cards = NG.cards || {};

/* --------------------------------------------------------
   Constants
   -------------------------------------------------------- */
NG.cards.SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
NG.cards.SUIT_SYMBOL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
NG.cards.SUIT_COLOR  = { spades: 'black', hearts: 'red', diamonds: 'red', clubs: 'black' };
NG.cards.RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];


/* ============================================================
   Card class
   ------------------------------------------------------------
   .suit / .rank / .value (1..13) / .color / .faceUp
   .pile  — back-reference to the pile it currently belongs to
   .el    — root DOM element (the <div class="card">)
   ============================================================ */

NG.cards.Card = class Card {
  constructor(suit, rank) {
    this.suit  = suit;
    this.rank  = rank;
    this.value = NG.cards.RANKS.indexOf(rank) + 1;   // A=1, K=13
    this.color = NG.cards.SUIT_COLOR[suit];
    this.faceUp = false;
    this.pile = null;
    this.el = this._buildDom();
  }

  /* Build the card's DOM. Done once at construction time. */
  _buildDom() {
    const el = document.createElement('div');
    el.className = 'card is-face-down';
    el.dataset.cardId = Math.random().toString(36).slice(2, 9);

    // Two faces — only one is visible based on .is-face-up/down
    const back = document.createElement('div');
    back.className = 'card__back';

    const front = document.createElement('div');
    front.className = `card__front card__front--${this.color}`;

    const sym = NG.cards.SUIT_SYMBOL[this.suit];
    front.innerHTML = `
      <div class="card__corner card__corner--tl">
        <div class="card__rank">${this.rank}</div>
        <div class="card__suit">${sym}</div>
      </div>
      <div class="card__pip">${sym}</div>
      <div class="card__corner card__corner--br">
        <div class="card__rank">${this.rank}</div>
        <div class="card__suit">${sym}</div>
      </div>
    `;

    el.appendChild(back);
    el.appendChild(front);
    return el;
  }

  /* Flip the card. If `animate` is true the flip-pulse animation plays.
     The animation only touches box-shadow (NOT transform), so it does
     not interfere with the pile's position transforms. */
  setFaceUp(faceUp, animate = false) {
    if (this.faceUp === faceUp) return;
    this.faceUp = faceUp;
    this.el.classList.toggle('is-face-up', faceUp);
    this.el.classList.toggle('is-face-down', !faceUp);
    if (animate) {
      NG.replayAnim(this.el, 'card-flip-pulse');
      NG.audio.play('flip');
    }
  }
};

/* --------------------------------------------------------
   createDeck — array of fresh Card objects.
   nDecks = 1 → 52 cards, 2 → 104 (Spider uses 2)
   onlySuits  → array like ['spades'] for 1-suit Spider, etc.
   -------------------------------------------------------- */
NG.cards.createDeck = function (nDecks = 1, onlySuits = null) {
  const suits = onlySuits || NG.cards.SUITS;
  const out = [];
  for (let d = 0; d < nDecks; d++) {
    for (const s of suits) {
      for (const r of NG.cards.RANKS) {
        out.push(new NG.cards.Card(s, r));
      }
    }
  }
  // If the requested deck size is short of 52 (1-suit Spider), pad by
  // repeating suits so we still end with 8 suits × 13 ranks = 104.
  if (onlySuits && nDecks === 2) {
    while (out.length < 104) {
      for (const s of onlySuits) {
        for (const r of NG.cards.RANKS) {
          if (out.length < 104) out.push(new NG.cards.Card(s, r));
        }
      }
    }
  }
  return out;
};


/* ============================================================
   Pile class
   ------------------------------------------------------------
   A container of cards with a layout (stacked/fan-down/fan-right)
   and optional rule callbacks. Each variant plugs its rules in.
   ============================================================ */

NG.cards.Pile = class Pile {
  constructor(opts) {
    this.id      = opts.id;
    this.el      = opts.el;
    this.layout  = opts.layout  || 'stacked';
    this.type    = opts.type    || 'generic';      // tableau / foundation / stock / waste / free
    this.fanGapUp   = opts.fanGapUp   != null ? opts.fanGapUp   : 26;
    this.fanGapDown = opts.fanGapDown != null ? opts.fanGapDown : 14;
    this.cards = [];

    // Rule hooks — overridden by each variant
    this.canPickup = opts.canPickup || ((card, idx, pile) => idx === pile.cards.length - 1);
    this.canAccept = opts.canAccept || (() => false);
    this.onChange  = opts.onChange  || (() => {});

    this.el.classList.add('pile');
    this.el.classList.add(`pile--${this.type}`);
    this.el.dataset.pileId = this.id;
  }

  push(card, { silent = false } = {}) {
    if (card.pile) card.pile._remove(card);
    this.cards.push(card);
    card.pile = this;
    this.el.appendChild(card.el);
    this.relayout();
    if (!silent) this.onChange(this);
  }

  /* Push many cards (a moving group), preserving order */
  pushMany(group, opts) {
    group.forEach(c => this.push(c, opts));
  }

  _remove(card) {
    const i = this.cards.indexOf(card);
    if (i >= 0) this.cards.splice(i, 1);
    // We don't trigger onChange here; the destination push() will.
  }

  top() { return this.cards[this.cards.length - 1] || null; }
  size() { return this.cards.length; }
  isEmpty() { return this.cards.length === 0; }

  /* Return the card array from `card` to the top, or null if invalid */
  groupFrom(card) {
    const i = this.cards.indexOf(card);
    if (i < 0) return null;
    return this.cards.slice(i);
  }

  /* Position each card based on layout */
  relayout() {
    let offset = 0;
    this.cards.forEach((c, i) => {
      c.el.style.zIndex = i + 1;
      let x = 0, y = 0;
      if (this.layout === 'fan-down') {
        y = offset;
        offset += c.faceUp ? this.fanGapUp : this.fanGapDown;
      } else if (this.layout === 'fan-right') {
        x = offset;
        offset += c.faceUp ? this.fanGapUp : this.fanGapDown;
      }
      // Only apply transform if not currently being dragged
      if (!c.el.classList.contains('is-dragging')) {
        c.el.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }
};


/* ============================================================
   Drag & drop system
   ------------------------------------------------------------
   makeDraggable(rootEl, options)
     options.piles  — array of all Pile instances (for hit testing)
     options.onMove — fn(card, fromPile, toPile, group) called after a successful move
     options.onTap  — fn(card, pile) called on a click/tap with no drag

   Pointer events are unified (mouse + touch), so this works on
   desktop and mobile out of the box.
   ============================================================ */

NG.cards.makeDraggable = function (rootEl, options) {
  const piles      = options.piles;
  const beforeMove = options.beforeMove || (() => {});  // fires BEFORE cards move
  const onMove     = options.onMove     || (() => {});  // fires AFTER cards move
  const onTap      = options.onTap      || (() => {});

  let dragState = null;

  rootEl.addEventListener('pointerdown', onDown);

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;   // left button only
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;

    // Find the Card object and its pile
    const pile = findPileContaining(cardEl);
    if (!pile) return;
    const card = pile.cards.find(c => c.el === cardEl);
    if (!card) return;

    // Ask the pile whether this card is pickable
    const idx = pile.cards.indexOf(card);
    if (!pile.canPickup(card, idx, pile)) {
      // Still allow a "tap" (e.g. stock click) on the top card
      if (idx === pile.cards.length - 1) {
        startTap(e, card, pile);
      }
      return;
    }

    const group = pile.cards.slice(idx);
    startDrag(e, group, pile);
  }

  function startTap(e, card, pile) {
    const startX = e.clientX, startY = e.clientY;
    const move = (ev) => {
      if (Math.abs(ev.clientX - startX) > 6 || Math.abs(ev.clientY - startY) > 6) cleanup();
    };
    const up = () => {
      cleanup();
      onTap(card, pile);
    };
    const cleanup = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  function startDrag(e, group, fromPile) {
    e.preventDefault();
    // Capture pointer so we get all move events even if finger leaves the element
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    const startX = e.clientX, startY = e.clientY;

    // Record each card's current screen position so we can offset relative
    const rects = group.map(c => c.el.getBoundingClientRect());
    const base = rects[0];

    group.forEach((c, i) => {
      const r = rects[i];
      c.el.classList.add('is-dragging');
      c.el.style.zIndex = 9999 + i;
      // Pin to fixed position so it tracks pointer regardless of scroll
      c.el.style.position = 'fixed';
      c.el.style.left = r.left + 'px';
      c.el.style.top  = r.top  + 'px';
      c.el.style.transform = 'translate(0, 0)';
      c.el.style.willChange = 'left, top';
    });

    let moved = false;
    let pendingDx = 0, pendingDy = 0;
    let rafId = null;
    dragState = { group, fromPile, base, startX, startY };

    document.addEventListener('pointermove', onMoveDrag);
    document.addEventListener('pointerup',   onUpDrag);

    function onMoveDrag(ev) {
      pendingDx = ev.clientX - startX;
      pendingDy = ev.clientY - startY;
      if (!moved && (Math.abs(pendingDx) > 3 || Math.abs(pendingDy) > 3)) moved = true;

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          group.forEach((c, i) => {
            const r = rects[i];
            c.el.style.left = (r.left + pendingDx) + 'px';
            c.el.style.top  = (r.top  + pendingDy) + 'px';
          });
          rafId = null;
        });
      }
    }

    function onUpDrag(ev) {
      document.removeEventListener('pointermove', onMoveDrag);
      document.removeEventListener('pointerup',   onUpDrag);

      if (!moved) {
        // Treat as tap — restore and fire onTap
        snapBack(group, fromPile);
        onTap(group[0], fromPile);
        dragState = null;
        return;
      }

      const target = findDropPile(ev.clientX, ev.clientY, group[0], fromPile);
      if (target) {
        beforeMove(group[0], fromPile, target, group);   // snapshot pre-move state
        NG.audio.play('flip');
        moveGroup(group, fromPile, target);
        onMove(group[0], fromPile, target, group);
      } else {
        NG.audio.play('error');
        snapBack(group, fromPile);
      }
      dragState = null;
    }
  }

  function snapBack(group, pile) {
    group.forEach(c => {
      c.el.classList.remove('is-dragging');
      c.el.style.position = '';
      c.el.style.left = '';
      c.el.style.top  = '';
      c.el.style.transform = '';
      c.el.style.zIndex = '';
      c.el.style.willChange = '';
    });
    // Force a reflow to ensure DOM catches up before recalculating pile positions
    pile.el.offsetHeight;
    pile.relayout();
  }

  function moveGroup(group, fromPile, toPile) {
    group.forEach(c => {
      c.el.classList.remove('is-dragging');
      c.el.style.position = '';
      c.el.style.left = '';
      c.el.style.top  = '';
      c.el.style.transform = '';
      c.el.style.zIndex = '';
      c.el.style.willChange = '';
    });
    toPile.pushMany(group);
    // Force a reflow on source pile to ensure correct positioning
    fromPile.el.offsetHeight;
    fromPile.onChange(fromPile);
  }

  /* Use the browser's hit-testing API instead of computing rects ourselves.
     elementsFromPoint returns the stack of elements at (x,y); we ignore
     the dragged cards themselves and pick the first pile/card found. */
  function findDropPile(x, y, draggedCard, fromPile) {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      if (el.classList && el.classList.contains('is-dragging')) continue;

      // Hovering over a card belonging to some pile?
      const cardEl = el.closest && el.closest('.card');
      if (cardEl && !cardEl.classList.contains('is-dragging')) {
        const owner = piles.find(p => p.cards.some(c => c.el === cardEl));
        if (owner && owner !== fromPile) {
          return owner.canAccept(draggedCard, owner, fromPile) ? owner : null;
        }
      }

      // Hovering directly over a pile slot (e.g. empty pile)?
      const pileEl = el.closest && el.closest('.pile');
      if (pileEl) {
        const p = piles.find(pp => pp.el === pileEl);
        if (p && p !== fromPile) {
          return p.canAccept(draggedCard, p, fromPile) ? p : null;
        }
      }
    }
    return null;
  }

  function findPileContaining(cardEl) {
    return piles.find(p => p.cards.some(c => c.el === cardEl)) || null;
  }
};


/* ============================================================
   dealStaggered — animated initial deal
   Calls dealFn(i) for each card in sequence with a small delay
   so cards fly in one after another (like a real shuffle).
   ============================================================ */
NG.cards.dealStaggered = function (total, dealFn, gapMs = 50, doneFn) {
  let i = 0;
  function step() {
    if (i >= total) { if (doneFn) doneFn(); return; }
    dealFn(i);
    i++;
    setTimeout(step, gapMs);
  }
  step();
};
