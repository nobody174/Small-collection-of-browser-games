/* ============================================================
   hints.js — AI hint system for card games
   ============================================================
   Suggests next moves based on game rules and board state
   ============================================================ */

window.NG = window.NG || {};
NG.hints = NG.hints || {};

(function() {

  // Score a move (higher = better)
  function scoreMove(card, fromPile, toPile, variant) {
    let score = 0;

    // Moving to foundation is always excellent
    if (toPile.type === 'foundation') {
      score += 1000;
      // Aces to foundation are extremely valuable
      if (card.rank === 'A') score += 500;
    }

    // Moving a King to empty column opens space (for Klondike/FreeCell)
    if (card.rank === 'K' && toPile.isEmpty && (variant === 'klondike' || variant === 'freecell')) {
      score += 400;
    }

    // Exposing face-down cards is good
    if (fromPile.type === 'tableau' && fromPile.top() && !fromPile.top().faceUp) {
      score += 200;
    }

    // Avoid moving from foundation (score penalty)
    if (fromPile.type === 'foundation') {
      score -= 300;
    }

    // Larger groups moving is slightly discouraged (prefer single moves)
    if (variant === 'freecell') {
      // Groups are ok in FreeCell
      score -= 0;
    }

    return score;
  }

  // Find all legal moves
  function findAllMoves(piles, variant) {
    const moves = [];

    // Try moving each card to each pile
    piles.forEach(fromPile => {
      if (!fromPile.cards || fromPile.cards.length === 0) return;

      fromPile.cards.forEach((card, idx) => {
        // Can we pick up this card?
        if (!fromPile.canPickup(card, idx, fromPile)) return;

        const group = fromPile.groupFrom(card);
        if (!group) return;

        // Try moving this group to each destination pile
        piles.forEach(toPile => {
          if (toPile === fromPile) return;

          // Can we accept this card/group?
          if (toPile.canAccept(card, toPile, fromPile)) {
            moves.push({
              card,
              group,
              fromPile,
              toPile,
              score: scoreMove(card, fromPile, toPile, variant)
            });
          }
        });
      });
    });

    // Sort by score (best moves first)
    return moves.sort((a, b) => b.score - a.score);
  }

  // Get best hint move
  function getBestMove(piles, variant) {
    const moves = findAllMoves(piles, variant);
    return moves.length > 0 ? moves[0] : null;
  }

  // Highlight a move on screen
  function highlightMove(card, toPile) {
    if (!card || !card.el) return;
    if (!toPile || !toPile.el) return;

    // Add pulse animation to cards
    card.el.style.animation = 'none';
    setTimeout(() => {
      card.el.style.animation = 'card-flip-pulse 500ms ease-out';
    }, 10);

    // Highlight destination
    toPile.el.classList.add('drop-valid');
    setTimeout(() => {
      toPile.el.classList.remove('drop-valid');
    }, 2000);

    // Play hint sound
    if (NG.audio && NG.audio.play) {
      NG.audio.play('hover');
    }
  }

  // Public API
  NG.hints = {
    getBestMove,
    highlightMove,
    findAllMoves,
    scoreMove,
  };
})();
