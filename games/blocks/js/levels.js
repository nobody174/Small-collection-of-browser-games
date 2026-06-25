/* ============================================================
   levels.js — Color Block Escape (procedurally generated)
   ============================================================ */

window.NG = window.NG || {};
NG.blocks = NG.blocks || {};

NG.blocks.COLORS = {
  red:    '#ff6b6b',
  orange: '#ff9a4a',
  yellow: '#ffd95c',
  green:  '#4ad295',
  blue:   '#57c7ff',
  purple: '#b070ff',
  blocker: '#888899',  // neutral gray — no exit door, just in the way
};

const COLORS_ARRAY = Object.keys(NG.blocks.COLORS);

/* ============================================================
   HAND-CRAFTED TUTORIAL LEVELS (1-8)
   ============================================================ */
const TUTORIAL = [
  {
    id: 'l1', name: 'Get Red Out',
    cols: 4, rows: 3,
    blocks: [
      { x: 1, y: 1, color: 'red'  },
    ],
    doors: [
      { side: 'top',    pos: 1, color: 'red'  },
    ],
  },
  {
    id: 'l2', name: 'Get Blue Out',
    cols: 4, rows: 3,
    blocks: [
      { x: 2, y: 1, color: 'blue' },
    ],
    doors: [
      { side: 'right', pos: 1, color: 'blue' },
    ],
  },
  {
    id: 'l3', name: 'Two Blocks',
    cols: 5, rows: 3,
    blocks: [
      { x: 1, y: 1, color: 'red'  },
      { x: 3, y: 1, color: 'blue' },
    ],
    doors: [
      { side: 'top',  pos: 1, color: 'red'  },
      { side: 'top',  pos: 3, color: 'blue' },
    ],
  },
  {
    id: 'l5', name: 'Push & Pull',
    cols: 5, rows: 5,
    blocks: [
      { x: 1, y: 1, color: 'red'  },
      { x: 3, y: 1, color: 'blue' },
    ],
    doors: [
      { side: 'top',  pos: 1, color: 'red'  },
      { side: 'top',  pos: 3, color: 'blue' },
    ],
  },
  {
    id: 'l6', name: 'Three Blocks',
    cols: 5, rows: 4,
    blocks: [
      { x: 1, y: 1, color: 'red'  },
      { x: 2, y: 2, color: 'blue' },
      { x: 3, y: 1, color: 'green' },
    ],
    doors: [
      { side: 'top',    pos: 1, color: 'red'  },
      { side: 'right',  pos: 2, color: 'blue' },
      { side: 'top',    pos: 3, color: 'green' },
    ],
  },
  {
    id: 'l7', name: 'Blocked Path',
    cols: 5, rows: 4,
    blocks: [
      { x: 1, y: 1, color: 'red'  },
      { x: 3, y: 1, color: 'blue' },
      { x: 2, y: 1, color: 'blocker', size: '1x1', blocker: true },
    ],
    doors: [
      { side: 'top',    pos: 1, color: 'red'  },
      { side: 'bottom', pos: 3, color: 'blue' },
    ],
  },
  {
    id: 'l8', name: 'Compass',
    cols: 5, rows: 5,
    blocks: [
      { x: 2, y: 1, color: 'red'    },
      { x: 3, y: 2, color: 'blue'   },
      { x: 2, y: 3, color: 'green'  },
      { x: 1, y: 2, color: 'yellow' },
    ],
    doors: [
      { side: 'top',    pos: 2, color: 'red'    },
      { side: 'right',  pos: 2, color: 'blue'   },
      { side: 'bottom', pos: 2, color: 'green'  },
      { side: 'left',   pos: 2, color: 'yellow' },
    ],
  },
];

/* ============================================================
   PROCEDURAL LEVEL GENERATION (9-100)
   ============================================================ */
function generateLevel(idx) {
  const level = idx + 1;

  // Progressive difficulty curve
  let cols, rows, numGoalBlocks, numBlockers, blockSizeVariety, useNonSquare;

  if (level < 15) {
    // Easy: small board, 3-4 colored blocks, blockers appear early to keep it interesting
    cols = 4; rows = 4;
    numGoalBlocks = 3 + Math.floor(level / 6);
    numBlockers = level < 9 ? 0 : 1;
    blockSizeVariety = 0;
    useNonSquare = false;
  } else if (level < 35) {
    // Medium: larger board, 4-6 goal blocks, mixed sizes, more blockers
    cols = 5 + Math.floor((level - 15) / 10);
    rows = 5 + Math.floor((level - 15) / 10);
    numGoalBlocks = 4 + Math.floor((level - 15) / 5);
    numBlockers = 1 + Math.floor((level - 15) / 10);
    blockSizeVariety = 1;
    useNonSquare = level > 28;
  } else {
    // Hard: bigger board, 5-8 goal blocks of mixed sizes, most blockers
    cols = 6 + Math.floor((level - 35) / 15);
    rows = 6 + Math.floor((level - 35) / 15);
    numGoalBlocks = 5 + Math.floor((level - 35) / 8);
    numBlockers = 3 + Math.floor((level - 35) / 12);
    blockSizeVariety = 2;
    useNonSquare = true;
  }

  cols = Math.min(8, cols);
  rows = Math.min(8, rows);
  numGoalBlocks = Math.min(8, numGoalBlocks);
  numBlockers = Math.min(4, numBlockers);

  // Build list of valid cells (for non-square shapes, remove corners)
  const blockedCells = new Set();
  if (useNonSquare && cols >= 5 && rows >= 5) {
    // Cut 1-2 cells from random corners to create L/T shaped boards
    const cornerCuts = level > 45 ? 2 : 1;
    const corners = [
      { x: 0, y: 0 }, { x: cols - 1, y: 0 },
      { x: 0, y: rows - 1 }, { x: cols - 1, y: rows - 1 }
    ];
    const shuffledCorners = corners.sort(() => Math.random() - 0.5).slice(0, cornerCuts);
    shuffledCorners.forEach(({ x, y }) => blockedCells.add(`${x},${y}`));
  }

  const doors = [];
  const usedDoors = new Set();
  const doorEdgeCells = new Set();
  const usedPos = new Set([...blockedCells]);
  const blocks = [];
  const laneCells = new Set();  // cells any goal block must cross to reach its door — off-limits for blockers

  // Weighted block size picker per difficulty
  function pickSize() {
    if (blockSizeVariety === 0) return '1x1';
    if (blockSizeVariety === 1) {
      const r = Math.random();
      if (r < 0.5) return '1x1';
      if (r < 0.75) return '1x2';
      return '2x1';
    }
    const r = Math.random();
    if (r < 0.25) return '1x1';
    if (r < 0.45) return '1x2';
    if (r < 0.60) return '2x1';
    if (r < 0.70) return '1x3';
    if (r < 0.80) return '3x1';
    if (r < 0.90) return '2x2';
    return 'L';
  }

  // Place each goal block, then immediately create a door aligned with where it landed
  for (let i = 0; i < numGoalBlocks; i++) {
    const color = COLORS_ARRAY[i % COLORS_ARRAY.length];
    const size = pickSize();

    // Pick exit side randomly, then place block in the opposite half
    const sides = ['top', 'bottom', 'left', 'right'].sort(() => Math.random() - 0.5);
    let blockPlaced = false;

    for (const exitSide of sides) {
      if (blockPlaced) break;

      // Block must stay away from the exit wall (leave room to slide to exit)
      const xMin = exitSide === 'left'  ? 1 : 0;
      const xMax = exitSide === 'right' ? cols - 2 : cols - 1;
      const yMin = exitSide === 'top'   ? 1 : 0;
      const yMax = exitSide === 'bottom'? rows - 2 : rows - 1;

      for (let attempt = 0; attempt < 40 && !blockPlaced; attempt++) {
        const ax = xMin + Math.floor(Math.random() * (xMax - xMin + 1));
        const ay = yMin + Math.floor(Math.random() * (yMax - yMin + 1));
        const positions = getBlockPositions(ax, ay, size, cols, rows);
        if (!positions) continue;
        if (!positions.every(p => p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax)) continue;
        if (positions.some(p => usedPos.has(`${p.x},${p.y}`))) continue;
        if (positions.some(p => doorEdgeCells.has(`${p.x},${p.y}`))) continue;

        // Block fits — now find a door aligned with this block on the exit wall
        // The door pos must align with a row/col the block occupies
        const blockCols = [...new Set(positions.map(p => p.x))];
        const blockRows = [...new Set(positions.map(p => p.y))];
        const posOptions = (exitSide === 'left' || exitSide === 'right') ? blockRows : blockCols;

        let doorPlaced = false;
        for (const pos of posOptions.sort(() => Math.random() - 0.5)) {
          const key = `${exitSide}-${pos}`;
          const adjCell = exitSide === 'top'    ? `${pos},0`
            : exitSide === 'bottom' ? `${pos},${rows - 1}`
            : exitSide === 'left'   ? `0,${pos}`
            : `${cols - 1},${pos}`;
          if (!usedDoors.has(key) && !blockedCells.has(adjCell)) {
            doors.push({ side: exitSide, pos, color });
            usedDoors.add(key);
            doorEdgeCells.add(adjCell);
            doorPlaced = true;
            break;
          }
        }
        if (!doorPlaced) continue;  // couldn't place door on this side, try next side

        // Commit block and door
        const blockDef = { x: ax, y: ay, color, size, blocker: false };
        if (size === 'L') { blockDef.shape = positions.shape; blockDef.rotIndex = positions.rotIndex; }
        blocks.push(blockDef);
        positions.forEach(p => usedPos.add(`${p.x},${p.y}`));

        // Record the straight lane from the block's leading edge to the wall —
        // a blocker placed here would make this block permanently unreachable.
        if (exitSide === 'left' || exitSide === 'right') {
          const minX = Math.min(...positions.map(p => p.x));
          const maxX = Math.max(...positions.map(p => p.x));
          posOptions.forEach(rowY => {
            if (exitSide === 'left')  for (let lx = 0; lx < minX; lx++) laneCells.add(`${lx},${rowY}`);
            if (exitSide === 'right') for (let lx = maxX + 1; lx < cols; lx++) laneCells.add(`${lx},${rowY}`);
          });
        } else {
          const minY = Math.min(...positions.map(p => p.y));
          const maxY = Math.max(...positions.map(p => p.y));
          posOptions.forEach(colX => {
            if (exitSide === 'top')    for (let ly = 0; ly < minY; ly++) laneCells.add(`${colX},${ly}`);
            if (exitSide === 'bottom') for (let ly = maxY + 1; ly < rows; ly++) laneCells.add(`${colX},${ly}`);
          });
        }
        blockPlaced = true;
      }
    }

    // If block failed all side attempts, log it (shouldn't happen with enough space)
    if (!blockPlaced) {
      console.warn(`Level ${level}: couldn't place goal block ${i}`);
    }
  }

  // Mark door edge cells as off-limits for blockers
  doorEdgeCells.forEach(c => usedPos.add(c));

  // Place blocker blocks — must avoid occupied cells, door edges, AND any goal
  // block's straight lane to its door (blockers are immovable, so sitting in
  // a lane would make that block permanently unreachable).
  function placeBlocker() {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 40) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      const key = `${x},${y}`;
      const positions = getBlockPositions(x, y, '1x1', cols, rows);
      if (positions && !positions.some(p => usedPos.has(`${p.x},${p.y}`)) && !laneCells.has(key)) {
        blocks.push({ x, y, color: 'blocker', size: '1x1', blocker: true });
        positions.forEach(p => usedPos.add(`${p.x},${p.y}`));
        placed = true;
      }
      attempts++;
    }
  }

  for (let i = 0; i < numBlockers; i++) {
    placeBlocker();
  }

  return {
    id: `l${level}`,
    name: `Level ${level}`,
    cols, rows,
    blockedCells: [...blockedCells],  // cells that are walled off (non-square shape)
    blocks,
    doors,
  };
}

const L_ROTATIONS = [
  [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}],
  [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}],
  [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}],
  [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}],
];
function pickL() {
  const idx = Math.floor(Math.random() * L_ROTATIONS.length);
  const rot = L_ROTATIONS[idx];
  rot.rotIndex = idx;
  return rot;
}

function getBlockPositions(x, y, size, cols, rows) {
  const positions = [];

  if (size === '1x1') {
    if (x < cols && y < rows) positions.push({ x, y });
  } else if (size === '1x2') {
    // Horizontal 1×2
    if (x + 1 < cols) positions.push({ x, y }, { x: x+1, y });
    else return null;
  } else if (size === '1x3') {
    // Horizontal 1×3
    if (x + 2 < cols) positions.push({ x, y }, { x: x+1, y }, { x: x+2, y });
    else return null;
  } else if (size === '2x1') {
    // Vertical 2×1
    if (y + 1 < rows) positions.push({ x, y }, { x, y: y+1 });
    else return null;
  } else if (size === '3x1') {
    // Vertical 3×1
    if (y + 2 < rows) positions.push({ x, y }, { x, y: y+1 }, { x, y: y+2 });
    else return null;
  } else if (size === '2x2') {
    if (x + 1 < cols && y + 1 < rows) {
      positions.push({ x, y }, { x: x+1, y }, { x, y: y+1 }, { x: x+1, y: y+1 });
    } else return null;
  } else if (size === '2x3') {
    if (x + 1 < cols && y + 2 < rows) {
      positions.push({ x, y }, { x: x+1, y }, { x, y: y+1 }, { x: x+1, y: y+1 }, { x, y: y+2 }, { x: x+1, y: y+2 });
    } else return null;
  } else if (size === 'L') {
    const rot = pickL();
    const valid = rot.every(r => x + r.x < cols && y + r.y < rows);
    if (valid) {
      const result = rot.map(r => ({ x: x + r.x, y: y + r.y }));
      result.shape = rot;            // remember the chosen rotation for the caller
      result.rotIndex = rot.rotIndex;
      return result;
    }
    return null;
  }

  return positions.length > 0 ? positions : null;
}

/* ============================================================
   BUILD COMPLETE LEVEL LIST
   ============================================================ */
NG.blocks.LEVELS = TUTORIAL.concat(
  Array.from({ length: 92 }, (_, i) => generateLevel(8 + i))
);
