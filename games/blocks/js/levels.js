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
  let cols, rows, numBlocks, blockSizeVariety;

  if (level < 20) {
    // Easy: small boards, few blocks
    cols = 4 + Math.min(2, Math.floor(level / 10));
    rows = 4 + Math.min(2, Math.floor(level / 10));
    numBlocks = 2 + Math.min(3, Math.floor(level / 7));
    blockSizeVariety = 0;  // only 1x1
  } else if (level < 50) {
    // Medium: medium boards, more blocks, some 2x2
    cols = 5 + Math.min(3, Math.floor((level - 20) / 10));
    rows = 5 + Math.min(3, Math.floor((level - 20) / 10));
    numBlocks = 4 + Math.min(4, Math.floor((level - 20) / 8));
    blockSizeVariety = Math.floor((level - 20) / 15);  // 0, 1
  } else {
    // Hard: large boards, many blocks, 2x2 and L-shapes
    cols = 7 + Math.min(2, Math.floor((level - 50) / 25));
    rows = 7 + Math.min(2, Math.floor((level - 50) / 25));
    numBlocks = 7 + Math.min(3, Math.floor((level - 50) / 10));
    blockSizeVariety = 2;  // 2x2 and L-shapes
  }

  // Clamp board size
  cols = Math.min(8, cols);
  rows = Math.min(8, rows);
  numBlocks = Math.min(6, numBlocks);

  const blocks = [];
  const usedPos = new Set();

  // Generate blocks with variety in sizes
  for (let i = 0; i < numBlocks; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 20) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);

      // Determine block size (1x1, 2x2, or L-shape)
      let size = '1x1';
      if (blockSizeVariety > 0 && Math.random() < 0.3 && level > 20) {
        size = Math.random() < 0.6 ? '2x2' : 'L';
      }

      const positions = getBlockPositions(x, y, size, cols, rows);
      if (positions && !positions.some(p => usedPos.has(`${p.x},${p.y}`))) {
        const color = COLORS_ARRAY[i % COLORS_ARRAY.length];
        blocks.push({ x, y, color, size: size || '1x1' });
        positions.forEach(p => usedPos.add(`${p.x},${p.y}`));
        placed = true;
      }
      attempts++;
    }
  }

  // Generate exit doors (one per block color)
  const doors = [];
  const usedDoors = new Set();
  blocks.forEach((b, i) => {
    const sides = ['top', 'bottom', 'left', 'right'];
    const shuffled = sides.sort(() => Math.random() - 0.5);

    for (const side of shuffled) {
      const pos = side === 'left' || side === 'right'
        ? Math.floor(Math.random() * rows)
        : Math.floor(Math.random() * cols);

      const key = `${side}-${pos}`;
      if (!usedDoors.has(key)) {
        doors.push({ side, pos, color: b.color });
        usedDoors.add(key);
        break;
      }
    }
  });

  return {
    id: `l${level}`,
    name: `Level ${level}`,
    cols, rows,
    blocks,
    doors,
  };
}

function getBlockPositions(x, y, size, cols, rows) {
  const positions = [];

  if (size === '1x1') {
    if (x < cols && y < rows) positions.push({ x, y });
  } else if (size === '2x2') {
    if (x + 1 < cols && y + 1 < rows) {
      positions.push({ x, y }, { x: x+1, y }, { x, y: y+1 }, { x: x+1, y: y+1 });
    }
  } else if (size === 'L') {
    // L-shape: ██  or  ██  etc
    //          █      █
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
