/* ============================================================
   blocks.js — Color Block Escape gameplay
   ------------------------------------------------------------
   Movement rule: a swipe slides a block in that direction until
   it hits another block or a wall. If the block reaches a grid
   edge with a matching-colour door, it exits the board.

   Architecture:
     - The grid is just a 2D array (board[y][x]) of block IDs.
     - Each block has {id, x, y, color, exited, el}.
     - The DOM uses CSS variables --cell, --gap to size cells.
     - Blocks are positioned via transform: translate(...) so the
       browser smoothly animates moves via CSS transition.
     - Doors are absolutely positioned outside the .bb-board area.

   Input:
     - Pointer (mouse + touch unified) — drag a block in a
       direction, release to commit the swipe.
     - Keyboard — click a block to select, then arrow keys.
   ============================================================ */

(function () {

  const $ = NG.$;
  const LEVELS = NG.blocks.LEVELS;
  const COLORS = NG.blocks.COLORS;

  // --- Game state -----------------------------------------------------------
  let level = null;        // current level definition
  let board = [];          // board[y][x] = block id or null
  let blocks = {};         // id → { id, x, y, color, exited, el }
  let history = [];        // undo stack (board snapshots)
  let moves = 0;
  let currentIdx = 0;      // index into LEVELS
  let selectedId = null;   // for keyboard mode

  const save = NG.save.create('blocks', { version: 1 });

  /* --------------------------------------------------------
     Persisted progress (across sessions)
       { currentIdx, cleared: { levelId: bestMoves } }
     -------------------------------------------------------- */
  let progress = save.read() || { currentIdx: 0, cleared: {} };
  function persistProgress() { save.write(progress); }

  /* ============================================================
     LOAD / RENDER A LEVEL
     ============================================================ */
  function loadLevel(idx) {
    currentIdx = NG.clamp(idx, 0, LEVELS.length - 1);
    level = LEVELS[currentIdx];
    moves = 0;
    history = [];
    selectedId = null;

    // Reset board
    board = [];
    for (let y = 0; y < level.rows; y++) {
      board.push(new Array(level.cols).fill(null));
    }

    blocks = {};
    let nextId = 1;

    // Mark blocked (walled-off) cells with a special sentinel
    const blockedSet = new Set(level.blockedCells || []);
    blockedSet.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      if (y < level.rows && x < level.cols) board[y][x] = 'WALL';
    });

    level.blocks.forEach(b => {
      const id = 'b' + (nextId++);
      const size = b.size || '1x1';
      blocks[id] = { id, x: b.x, y: b.y, color: b.color, size, shape: b.shape || null, rotIndex: b.rotIndex, blocker: b.blocker || false, exited: false, el: null };
      // Mark all cells using getBlockCells (after blocks[id] is set)
      getBlockCells(id, b.x, b.y).forEach(([cx, cy]) => {
        if (cy >= 0 && cy < level.rows && cx >= 0 && cx < level.cols) board[cy][cx] = id;
      });
    });

    render();
    updateHeader();
    progress.currentIdx = currentIdx;
    persistProgress();
  }

  function render() {
    const boardEl = $('#bb-board');
    boardEl.innerHTML = '';
    boardEl.style.setProperty('--cols', level.cols);
    boardEl.style.setProperty('--rows', level.rows);

    const blockedSet = new Set(level.blockedCells || []);

    // Cell backgrounds — skip walled-off cells (non-square shape)
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < level.cols; x++) {
        const c = document.createElement('div');
        if (blockedSet.has(`${x},${y}`)) {
          c.className = 'bb-cell bb-cell--wall';
        } else {
          c.className = 'bb-cell';
        }
        c.style.transform = cellTransform(x, y);
        boardEl.appendChild(c);
      }
    }

    // Blocks
    Object.values(blocks).forEach(b => {
      const el = document.createElement('div');
      el.className = 'bb-block bb-block--' + b.size + (b.blocker ? ' bb-block--blocker' : '');
      el.style.setProperty('--block-color', COLORS[b.color]);
      el.style.transform = cellTransform(b.x, b.y);
      el.dataset.id = b.id;
      el.dataset.size = b.size;
      if (b.size === 'L') el.dataset.lRot = b.rotIndex != null ? b.rotIndex : 0;
      if (b.blocker) el.title = 'Blocker — move it out of the way!';
      boardEl.appendChild(el);
      b.el = el;
    });

    // Doors
    level.doors.forEach(d => {
      const el = document.createElement('div');
      el.className = 'bb-door';
      el.dataset.side = d.side;
      el.style.setProperty('--door-color', COLORS[d.color]);
      Object.assign(el.style, doorPosition(d));
      boardEl.appendChild(el);
    });
  }

  /* Reads the live --cell + --gap px values so swipe-distance math
     stays correct across responsive breakpoints. */
  function getCellSizePx() {
    const boardEl = $('#bb-board');
    const cs = getComputedStyle(boardEl);
    const cell = parseFloat(cs.getPropertyValue('--cell')) || 70;
    const gap = parseFloat(cs.getPropertyValue('--gap')) || 6;
    return cell + gap;
  }

  /* CSS helper: translate(x, y) inside the .bb-board grid */
  function cellTransform(x, y) {
    return `translate(calc(${x} * (var(--cell) + var(--gap))),` +
           `           calc(${y} * (var(--cell) + var(--gap))))`;
  }

  function doorPosition(d) {
    const along = `calc(${d.pos} * (var(--cell) + var(--gap)))`;
    if (d.side === 'top')    return { left: along, top:    '-22px' };
    if (d.side === 'bottom') return { left: along, bottom: '-22px' };
    if (d.side === 'left')   return { top:  along, left:   '-22px' };
    if (d.side === 'right')  return { top:  along, right:  '-22px' };
    return {};
  }

  /* ============================================================
     SLIDE LOGIC
     A swipe direction (dx, dy) ∈ {(-1,0),(1,0),(0,-1),(0,1)}.
     maxDist = max cells to move (1 for short swipe, undefined for slide-to-wall)
     The block moves cell-by-cell until blocked or it reaches a
     matching door at the edge, or it reaches maxDist.
     ============================================================ */
  function getBlockCells(blockId, cx, cy) {
    const b = blocks[blockId];
    switch (b.size) {
      case '1x2': return [[cx, cy], [cx+1, cy]];
      case '1x3': return [[cx, cy], [cx+1, cy], [cx+2, cy]];
      case '2x1': return [[cx, cy], [cx, cy+1]];
      case '3x1': return [[cx, cy], [cx, cy+1], [cx, cy+2]];
      case '2x2': return [[cx, cy], [cx+1, cy], [cx, cy+1], [cx+1, cy+1]];
      case '2x3': return [[cx, cy], [cx+1, cy], [cx, cy+1], [cx+1, cy+1], [cx, cy+2], [cx+1, cy+2]];
      case 'L':   return (b.shape || [{x:0,y:0},{x:1,y:0},{x:0,y:1}]).map(r => [cx + r.x, cy + r.y]);
      default:    return [[cx, cy]];
    }
  }

  function canPlaceBlock(blockId, cx, cy) {
    const cells = getBlockCells(blockId, cx, cy);
    for (const [x, y] of cells) {
      if (x < 0 || x >= level.cols || y < 0 || y >= level.rows) return false;
      // Treat WALL sentinel and other blocks as obstacles
      if (board[y][x] != null && board[y][x] !== blockId) return false;
    }
    return true;
  }

  function attemptSlide(blockId, dx, dy, maxDist = undefined) {
    const b = blocks[blockId];
    if (!b || b.exited) return;
    // Blocker blocks are immovable obstacles
    if (b.blocker) {
      NG.audio.play('error');
      NG.replayAnim(b.el, 'ng-shake');
      return;
    }

    let x = b.x, y = b.y;
    let cellsMoved = 0;
    while (true) {
      // Check if we've hit the max distance limit
      if (maxDist !== undefined && cellsMoved >= maxDist) break;

      const nx = x + dx, ny = y + dy;

      // Try to move to (nx, ny)
      if (!canPlaceBlock(blockId, nx, ny)) {
        // Check if we're exiting through a door
        const cells = getBlockCells(blockId, nx, ny);
        const outOfBoundsCells = cells.filter(([cx, cy]) =>
          cx < 0 || cx >= level.cols || cy < 0 || cy >= level.rows
        );

        // If at least one cell would go out of bounds, check for door exit
        if (outOfBoundsCells.length > 0) {
          const firstOutCell = outOfBoundsCells[0];
          const side = firstOutCell[1] < 0 ? 'top' : firstOutCell[1] >= level.rows ? 'bottom'
                     : firstOutCell[0] < 0 ? 'left' : 'right';
          // For multi-cell blocks, check ALL cells on the leading edge for a door match
          const leadingCells = getBlockCells(blockId, nx, ny).filter(([cx, cy]) =>
            side === 'top' ? cy < 0 : side === 'bottom' ? cy >= level.rows :
            side === 'left' ? cx < 0 : cx >= level.cols
          );
          const door = level.doors.find(d => {
            if (d.side !== side || d.color !== b.color) return false;
            return leadingCells.some(([cx, cy]) =>
              (side === 'top' || side === 'bottom') ? cx === d.pos : cy === d.pos
            );
          });
          if (door) {
            if (x !== b.x || y !== b.y) commitMoveSnapshot();
            moveTo(b, x, y);
            exitBlock(b, side);
            afterMove();
            return;
          }
        }
        break;   // blocked by wall or other block
      }

      // Move into the empty cell and continue
      x = nx; y = ny;
      cellsMoved++;
    }

    // Final commit if the block actually moved
    if (x !== b.x || y !== b.y) {
      commitMoveSnapshot();
      moveTo(b, x, y);
      NG.audio.play('flip');
      afterMove();
    } else {
      // Didn't move at all — small bump feedback
      NG.audio.play('error');
      NG.replayAnim(b.el, 'ng-shake');
    }
  }

  function moveTo(b, x, y) {
    // Clear old position (all cells this block occupied)
    const oldCells = getBlockCells(b.id, b.x, b.y);
    oldCells.forEach(([cx, cy]) => {
      if (cy >= 0 && cy < level.rows && cx >= 0 && cx < level.cols) {
        board[cy][cx] = null;
      }
    });

    // Update position
    b.x = x; b.y = y;

    // Mark new position (all cells this block occupies)
    const newCells = getBlockCells(b.id, x, y);
    newCells.forEach(([cx, cy]) => {
      if (cy >= 0 && cy < level.rows && cx >= 0 && cx < level.cols) {
        board[cy][cx] = b.id;
      }
    });

    b.el.style.transform = cellTransform(x, y);
  }

  function exitBlock(b, side) {
    b.exited = true;
    // Clear ALL cells the block occupies (not just anchor)
    const cells = getBlockCells(b.id, b.x, b.y);
    cells.forEach(([cx, cy]) => {
      if (cy >= 0 && cy < level.rows && cx >= 0 && cx < level.cols) {
        board[cy][cx] = null;
      }
    });
    // Animate the block flying through the door
    const dirX = side === 'left' ? -120 : side === 'right' ?  120 : 0;
    const dirY = side === 'top'  ? -120 : side === 'bottom' ? 120 : 0;
    b.el.style.setProperty('--exit-transform',
      `${cellTransform(b.x, b.y).replace('translate(', 'translate(')}`);
    // Replace transform with combined translate so it slides further out
    b.el.style.transform =
      `translate(calc(${b.x} * (var(--cell) + var(--gap)) + ${dirX}px),` +
      `           calc(${b.y} * (var(--cell) + var(--gap)) + ${dirY}px))`;
    b.el.classList.add('is-exiting');
    NG.audio.play('coin');

    // Confetti at the door for a tiny celebration
    const r = b.el.getBoundingClientRect();
    NG.particles.burst(r.left + r.width / 2, r.top + r.height / 2, {
      count: 8, spread: 50, colors: [COLORS[b.color]],
    });

    // Remove from DOM after animation
    setTimeout(() => b.el.remove(), 400);
  }

  /* ============================================================
     HISTORY / UNDO  (board snapshot per move)
     ============================================================ */
  function commitMoveSnapshot() {
    const snap = {
      moves,
      blocks: Object.values(blocks).map(b => ({
        id: b.id, x: b.x, y: b.y, exited: b.exited,
      })),
    };
    history.push(snap);
    if (history.length > 60) history.shift();
  }

  function undo() {
    if (history.length === 0) { NG.toast('Nothing to undo'); return; }
    const prev = history.pop();
    moves = prev.moves;

    // Rebuild board state from snapshot
    for (let y = 0; y < level.rows; y++) board[y].fill(null);
    prev.blocks.forEach(rec => {
      const b = blocks[rec.id];
      if (!b) return;
      b.exited = rec.exited;
      b.x = rec.x; b.y = rec.y;
      if (!rec.exited) {
        // Mark ALL cells this block occupies (not just anchor)
        getBlockCells(b.id, rec.x, rec.y).forEach(([cx, cy]) => {
          if (cy >= 0 && cy < level.rows && cx >= 0 && cx < level.cols) {
            board[cy][cx] = rec.id;
          }
        });
        // If the block had been removed, re-add it
        if (!b.el.isConnected) {
          $('#bb-board').appendChild(b.el);
        }
        b.el.classList.remove('is-exiting');
        b.el.style.transform = cellTransform(rec.x, rec.y);
      }
    });
    updateHeader();
    NG.audio.play('swoosh');
  }

  /* ============================================================
     AFTER-MOVE: counter, win check, save
     ============================================================ */
  function afterMove() {
    moves++;
    updateHeader();
    // Win when all GOAL blocks (non-blockers) have exited — blockers don't need to exit
    if (Object.values(blocks).every(b => b.blocker || b.exited)) {
      onLevelComplete();
    }
  }

  function onLevelComplete() {
    // Record best-moves for this level
    const lvl = level.id;
    const prevBest = progress.cleared[lvl];
    if (prevBest == null || moves < prevBest) progress.cleared[lvl] = moves;
    persistProgress();

    NG.audio.play('success');
    setTimeout(() => NG.particles.confetti({ count: 120 }), 200);

    $('#banner-title').textContent = 'Level cleared!';
    $('#banner-stats').textContent =
      `${moves} moves` + (prevBest != null ? ` · best ${progress.cleared[lvl]}` : '');
    const next = currentIdx + 1 < LEVELS.length;
    $('#banner-next').style.display = next ? '' : 'none';
    $('#banner-final').style.display = next ? 'none' : '';
    $('#level-banner').classList.add('is-open');
  }

  /* ============================================================
     INPUT — pointer (swipe) and keyboard (arrow keys)
     ============================================================ */
  function attachInput() {
    const boardEl = $('#bb-board');

    let dragState = null;

    boardEl.addEventListener('pointerdown', (e) => {
      const blockEl = e.target.closest('.bb-block');
      if (!blockEl) { selectBlock(null); return; }
      const id = blockEl.dataset.id;
      selectBlock(id);
      dragState = { id, startX: e.clientX, startY: e.clientY };
      blockEl.classList.add('is-dragging');
    });

    window.addEventListener('pointerup', (e) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      const b = blocks[dragState.id];
      if (b) b.el.classList.remove('is-dragging');

      // Decide direction and distance from swipe
      const THRESHOLD = 30;
      const absX = Math.abs(dx), absY = Math.abs(dy);
      const maxDist = Math.max(absX, absY);

      if (maxDist >= THRESHOLD) {
        let mx = 0, my = 0;
        if (absX > absY) mx = dx > 0 ? 1 : -1;
        else             my = dy > 0 ? 1 : -1;

        // Read the actual cell+gap size from CSS (varies by breakpoint).
        // short swipe = 1 cell, medium = 2 cells, long = all the way
        const cellSize = getCellSizePx();
        const cellsDist = Math.round(maxDist / cellSize);
        const cellsToMove = Math.max(1, Math.min(cellsDist, 2));  // clamp to 1-2
        const moveAll = cellsDist >= 3;  // 3+ cells = slide to wall

        attemptSlide(dragState.id, mx, my, moveAll ? undefined : cellsToMove);
      }
      dragState = null;
    });

    // Keyboard: arrow keys move the selected block
    window.addEventListener('keydown', (e) => {
      if (!selectedId) return;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft')  dx = -1;
      else if (e.key === 'ArrowRight') dx = 1;
      else if (e.key === 'ArrowUp')    dy = -1;
      else if (e.key === 'ArrowDown')  dy = 1;
      else return;
      e.preventDefault();
      attemptSlide(selectedId, dx, dy);
    });
  }

  function selectBlock(id) {
    if (selectedId === id) return;
    if (selectedId && blocks[selectedId])
      blocks[selectedId].el.classList.remove('is-selected');
    selectedId = id;
    if (id && blocks[id]) blocks[id].el.classList.add('is-selected');
  }

  /* ============================================================
     HINT — pulse the doors of remaining blocks
     ============================================================ */
  function showHint() {
    // Only highlight doors for blocks still on the board
    const remainingColors = new Set(
      Object.values(blocks).filter(b => !b.blocker && !b.exited).map(b => b.color)
    );
    const doorEls = NG.$$('.bb-door');
    if (!doorEls.length) { NG.toast('No doors visible!', { type: 'warning' }); return; }

    let anyHinted = false;
    doorEls.forEach((el, i) => {
      const d = level.doors[i];
      el.classList.remove('is-hinting');
      if (!d || !remainingColors.has(d.color)) return;
      // Force reflow so animation restarts if already hinting
      void el.offsetWidth;
      el.classList.add('is-hinting');
      anyHinted = true;
    });
    if (!anyHinted) { NG.toast('Nothing left to find!', { type: 'info' }); return; }

    NG.audio.play('flip');
    NG.toast('💡 Find the matching door!', { type: 'info', duration: 1500 });

    // Remove hint after 4 animation cycles
    setTimeout(() => {
      NG.$$('.bb-door.is-hinting').forEach(el => el.classList.remove('is-hinting'));
    }, 4200);
  }

  /* ============================================================
     LEVEL PICKER MODAL
     ============================================================ */
  function openLevelPicker() {
    const grid = document.createElement('div');
    grid.className = 'level-picker';
    LEVELS.forEach((lv, i) => {
      const btn = document.createElement('button');
      btn.className = 'level-pick-btn';
      const cleared = progress.cleared[lv.id] != null;
      const unlocked = i === 0 || progress.cleared[LEVELS[i - 1].id] != null
        || i <= progress.currentIdx;
      if (cleared) btn.classList.add('is-cleared');
      if (!unlocked) btn.classList.add('is-locked');
      btn.textContent = i + 1;
      btn.addEventListener('click', () => {
        if (!unlocked) return;
        NG.modal.close();
        loadLevel(i);
      });
      grid.appendChild(btn);
    });
    NG.modal.open({
      title: 'Pick a level',
      body: grid,
      actions: [{ label: 'Close', variant: 'ghost' }],
    });
  }

  /* ============================================================
     HEADER UPDATE
     ============================================================ */
  function updateHeader() {
    $('#level-name').textContent = level.name;
    $('#level-num').textContent = 'Level ' + (currentIdx + 1) + ' / ' + LEVELS.length;
    $('#stat-moves').textContent = 'Moves: ' + moves;
    const best = progress.cleared[level.id];
    $('#stat-best').textContent = best != null ? 'Best: ' + best : '';
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    loadLevel(progress.currentIdx || 0);
    attachInput();

    NG.on($('#btn-undo'),  'click', undo);

    // Reset menu
    NG.on($('#btn-reset'), 'click', (e) => {
      e.stopPropagation();
      const menu = $('#reset-menu');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    NG.on($('#btn-reset-level'), 'click', () => {
      loadLevel(currentIdx);
      $('#reset-menu').style.display = 'none';
    });
    NG.on($('#btn-reset-all'), 'click', () => {
      if (confirm('Reset all levels? This will clear your progress.')) {
        save.clear();
        loadLevel(0);
        $('#reset-menu').style.display = 'none';
      }
    });
    document.addEventListener('click', () => {
      $('#reset-menu').style.display = 'none';
    });

    NG.on($('#btn-hint'),  'click', showHint);
    NG.on($('#btn-levels'), 'click', openLevelPicker);

    NG.on($('#banner-next'), 'click', () => {
      $('#level-banner').classList.remove('is-open');
      loadLevel(currentIdx + 1);
    });
    NG.on($('#banner-replay'), 'click', () => {
      $('#level-banner').classList.remove('is-open');
      loadLevel(currentIdx);
    });
    NG.on($('#banner-close'),  'click', () => {
      $('#level-banner').classList.remove('is-open');
    });

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
