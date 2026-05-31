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
    id: 'l1', name: 'Blocked Path',
    cols: 5, rows: 4,
    blocks: [
      { x: 2, y: 1, color: 'red'  },
      { x: 2, y: 2, color: 'blue' },
    ],
    doors: [
      { side: 'top',  pos: 2, color: 'red'  },
      { side: 'right', pos: 2, color: 'blue' },
    ],
  },
  {
    id: 'l2', name: 'Push & Pull',
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
    id: 'l3', name: 'Sidestep',
    cols: 5, rows: 2,
    blocks: [
      { x: 0, y: 0, color: 'red'  },
      { x: 4, y: 0, color: 'blue' },
    ],
    doors: [
      { side: 'right', pos: 0, color: 'red'  },
      { side: 'left',  pos: 0, color: 'blue' },
    ],
  },
  {
    id: 'l4', name: 'Compass',
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
  {
    id: 'l5', name: 'Shuffle',
    cols: 3, rows: 3,
    blocks: [
      { x: 0, y: 0, color: 'red'   },
      { x: 1, y: 0, color: 'blue'  },
      { x: 2, y: 0, color: 'green' },
    ],
    doors: [
      { side: 'top', pos: 2, color: 'red'   },
      { side: 'top', pos: 1, color: 'blue'  },
      { side: 'top', pos: 0, color: 'green' },
    ],
  },
  {
    id: 'l6', name: 'Crossroads',
    cols: 5, rows: 5,
    blocks: [
      { x: 0, y: 2, color: 'red'    },
      { x: 4, y: 2, color: 'blue'   },
      { x: 2, y: 0, color: 'green'  },
      { x: 2, y: 4, color: 'yellow' },
    ],
    doors: [
      { side: 'right',  pos: 2, color: 'red'    },
      { side: 'left',   pos: 2, color: 'blue'   },
      { side: 'bottom', pos: 2, color: 'green'  },
      { side: 'top',    pos: 2, color: 'yellow' },
    ],
  },
  {
    id: 'l7', name: 'Six pack',
    cols: 5, rows: 5,
    blocks: [
      { x: 0, y: 0, color: 'red'    },
      { x: 4, y: 0, color: 'orange' },
      { x: 0, y: 4, color: 'green'  },
      { x: 4, y: 4, color: 'blue'   },
      { x: 2, y: 2, color: 'purple' },
      { x: 1, y: 2, color: 'yellow' },
    ],
    doors: [
      { side: 'top',    pos: 0, color: 'red'    },
      { side: 'top',    pos: 4, color: 'orange' },
      { side: 'bottom', pos: 0, color: 'green'  },
      { side: 'bottom', pos: 4, color: 'blue'   },
      { side: 'right',  pos: 2, color: 'purple' },
      { side: 'left',   pos: 2, color: 'yellow' },
    ],
  },
  {
    id: 'l8', name: 'Logjam',
    cols: 5, rows: 5,
    blocks: [
      { x: 1, y: 2, color: 'red'    },
      { x: 2, y: 2, color: 'orange' },
      { x: 3, y: 2, color: 'yellow' },
      { x: 2, y: 1, color: 'green'  },
      { x: 2, y: 3, color: 'blue'   },
    ],
    doors: [
      { side: 'left',   pos: 2, color: 'red'    },
      { side: 'top',    pos: 2, color: 'green'  },
      { side: 'right',  pos: 2, color: 'yellow' },
      { side: 'bottom', pos: 2, color: 'blue'   },
      { side: 'right',  pos: 0, color: 'orange' },
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
    // Easy: small board, 2-3 colored goal blocks, no blockers
    cols = 4; rows = 4;
    numGoalBlocks = 2 + Math.floor(level / 7);
    numBlockers = 0;
    blockSizeVariety = 0;
    useNonSquare = false;
  } else if (level < 35) {
    // Medium: 5-6 board, 2-3 goal blocks, 2-4 blockers (more obstacles than goals)
    cols = 5 + Math.floor((level - 15) / 10);
    rows = 5 + Math.floor((level - 15) / 10);
    numGoalBlocks = 2 + Math.floor((level - 15) / 10);  // max 3
    numBlockers = 2 + Math.floor((level - 15) / 7);     // 2-4 blockers
    blockSizeVariety = 1;
    useNonSquare = level > 25;
  } else {
    // Hard: 6-8 board, 2-4 goal blocks, 3-6 blockers filling the board
    cols = 6 + Math.floor((level - 35) / 15);
    rows = 6 + Math.floor((level - 35) / 15);
    numGoalBlocks = 2 + Math.floor((level - 35) / 15);  // max 4
    numBlockers = 3 + Math.floor((level - 35) / 8);     // 3-6 blockers
    blockSizeVariety = 2;
    useNonSquare = true;
  }

  cols = Math.min(8, cols);
  rows = Math.min(8, rows);
  numGoalBlocks = Math.min(4, numGoalBlocks);  // max 4 doors ever
  numBlockers = Math.min(6, numBlockers);

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

  const blocks = [];
  const usedPos = new Set([...blockedCells]);

  // Weighted block size picker per difficulty
  function pickSize(isBlocker) {
    if (isBlocker) return '1x1';
    if (blockSizeVariety === 0) return '1x1';
    if (blockSizeVariety === 1) {
      const r = Math.random();
      if (r < 0.45) return '1x1';
      if (r < 0.65) return '1x2';
      if (r < 0.80) return '2x1';
      return '2x2';
    }
    // blockSizeVariety === 2 (hard)
    const r = Math.random();
    if (r < 0.20) return '1x1';
    if (r < 0.35) return '1x2';
    if (r < 0.50) return '2x1';
    if (r < 0.60) return '1x3';
    if (r < 0.70) return '3x1';
    if (r < 0.82) return '2x2';
    if (r < 0.92) return 'L';
    return '2x3';
  }

  function placeBlock(color, isBlocker) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      const size = pickSize(isBlocker);
      const positions = getBlockPositions(x, y, size, cols, rows);
      if (positions && !positions.some(p => usedPos.has(`${p.x},${p.y}`))) {
        blocks.push({ x, y, color, size, blocker: isBlocker || false });
        positions.forEach(p => usedPos.add(`${p.x},${p.y}`));
        placed = true;
      }
      attempts++;
    }
  }

  // Place goal blocks (colored, each gets a matching door)
  for (let i = 0; i < numGoalBlocks; i++) {
    placeBlock(COLORS_ARRAY[i % COLORS_ARRAY.length], false);
  }

  // Generate exit doors FIRST (one per goal block)
  const doors = [];
  const usedDoors = new Set();
  const doorEdgeCells = new Set(); // cells adjacent to doors (blockers must avoid these)

  // Build a set of all occupied cells for door placement check
  const occupiedCells = new Set([...usedPos]);

  blocks.filter(b => !b.blocker).forEach((b) => {
    // Prefer the side OPPOSITE to the block's position so the block must travel across the board
    const bCenterX = b.x / cols;
    const bCenterY = b.y / rows;
    // Pick opposite side: if block is left half → right door, top half → bottom door, etc.
    const preferredSides = bCenterX < 0.5
      ? ['right', 'bottom', 'top', 'left']
      : bCenterY < 0.5
        ? ['bottom', 'right', 'left', 'top']
        : ['left', 'top', 'right', 'bottom'];

    let placed = false;
    for (const side of preferredSides) {
      if (placed) break;
      const range = (side === 'left' || side === 'right') ? rows : cols;
      const positions = Array.from({ length: range }, (_, i) => i).sort(() => Math.random() - 0.5);
      for (const pos of positions) {
        const key = `${side}-${pos}`;
        if (usedDoors.has(key)) continue;
        const adjCell = side === 'top' ? `${pos},0`
          : side === 'bottom' ? `${pos},${rows - 1}`
          : side === 'left'   ? `0,${pos}`
          : `${cols - 1},${pos}`;
        if (occupiedCells.has(adjCell)) continue;
        doors.push({ side, pos, color: b.color });
        usedDoors.add(key);
        doorEdgeCells.add(adjCell);
        placed = true;
        break;
      }
    }
  });

  // Place blocker blocks AFTER doors — avoid door-adjacent cells
  function placeBlocker() {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 40) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      const positions = getBlockPositions(x, y, '1x1', cols, rows);
      if (positions &&
          !positions.some(p => usedPos.has(`${p.x},${p.y}`)) &&
          !positions.some(p => doorEdgeCells.has(`${p.x},${p.y}`))) {
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
    const rotations = [
      [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}],
      [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}],
      [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}],
      [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}],
    ];
    const rot = rotations[Math.floor(Math.random() * rotations.length)];
    const valid = rot.every(r => x + r.x < cols && y + r.y < rows);
    if (valid) return rot.map(r => ({ x: x + r.x, y: y + r.y }));
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
