/* ============================================================
   countries.js — Country themes + minerals + pickaxes
   ------------------------------------------------------------
   Each country has its own visual identity. The actual colors
   live in style.css (as CSS variables on body.country-<id>);
   here we just describe metadata + the unlock cost.
   ============================================================ */

window.NG = window.NG || {};
NG.digger = NG.digger || {};


/* --------------------------------------------------------
   COUNTRIES
   -------------------------------------------------------- */
NG.digger.COUNTRIES = [
  {
    id: 'norway',
    name: 'Norway',
    flag: '🇳🇴',
    char: '⛷️',
    decor: '🌲',
    unlockGold: 0,           // starting country
    intro: 'Cold sky, deep iron. Welcome to Norway.',
  },
  {
    id: 'mexico',
    name: 'Mexico',
    flag: '🇲🇽',
    char: '🤠',
    decor: '🌵',
    unlockGold: 2500,
    intro: 'Desert sun, golden veins. Sombrero on, amigo.',
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    char: '🥷',
    decor: '🏮',
    unlockGold: 25000,
    intro: 'Sakura skies, hidden rubies. Dig with grace.',
  },
  {
    id: 'egypt',
    name: 'Egypt',
    flag: '🇪🇬',
    char: '🧑‍🏭',
    decor: '🗿',
    unlockGold: 100000,
    intro: 'Sun-baked sand hides ancient sapphires. Dig deep, pharaoh.',
  },
  {
    id: 'sweden',
    name: 'Sweden',
    flag: '🇸🇪',
    char: '🧔‍♂️',
    decor: '❄️',
    unlockGold: 400000,
    intro: 'Frozen tundra, the richest diamonds in the world. Bundle up.',
  },
];


/* --------------------------------------------------------
   MINERALS — values rise with rarity / depth
   icon, name, value (gold each), color
   -------------------------------------------------------- */
NG.digger.MINERALS = {
  pebble:   { icon: '🪨', name: 'Pebble',   value: 1,    color: '#9a8c7a' },
  coal:     { icon: '⬛', name: 'Coal',     value: 4,    color: '#1a1a1a' },
  iron:     { icon: '🔩', name: 'Iron',     value: 12,   color: '#9aa3ad' },
  copper:   { icon: '🟤', name: 'Copper',   value: 28,   color: '#c97a3a' },
  silver:   { icon: '⚪', name: 'Silver',   value: 70,   color: '#dde3e8' },
  gold:     { icon: '🟡', name: 'Gold',     value: 180,  color: '#ffce4a' },
  ruby:     { icon: '🔴', name: 'Ruby',     value: 480,  color: '#ff4a6b' },
  emerald:  { icon: '🟢', name: 'Emerald',  value: 1100, color: '#4ad295' },
  sapphire: { icon: '🔵', name: 'Sapphire', value: 2400, color: '#4aa6ff' },
  diamond:  { icon: '💎', name: 'Diamond',  value: 6000, color: '#a8e4ff' },
};


/* --------------------------------------------------------
   PICKAXES — upgrading lets you mine harder tiles in fewer hits
   strength damages tile HP per click
   -------------------------------------------------------- */
NG.digger.PICKAXES = [
  { id: 'wood',    name: 'Wooden Pickaxe',  emoji: '⛏️', strength: 1,  cost: 0      },
  { id: 'stone',   name: 'Stone Pickaxe',   emoji: '⛏️', strength: 2,  cost: 80     },
  { id: 'iron',    name: 'Iron Pickaxe',    emoji: '⛏️', strength: 3,  cost: 450    },
  { id: 'steel',   name: 'Steel Pickaxe',   emoji: '⛏️', strength: 5,  cost: 2200   },
  { id: 'gold',    name: 'Golden Pickaxe',  emoji: '⛏️', strength: 8,  cost: 9000   },
  { id: 'diamond', name: 'Diamond Pickaxe', emoji: '⛏️', strength: 12, cost: 32000  },
  { id: 'laser',   name: 'Laser Drill',     emoji: '🔆', strength: 20, cost: 120000 },
];


/* --------------------------------------------------------
   CART CAPACITIES
   -------------------------------------------------------- */
NG.digger.CARTS = [
  { id: 'cart-1', name: 'Wheelbarrow',  size: 20,   cost: 0     },
  { id: 'cart-2', name: 'Small Cart',   size: 50,   cost: 200   },
  { id: 'cart-3', name: 'Wagon',        size: 120,  cost: 1500  },
  { id: 'cart-4', name: 'Tipper Truck', size: 320,  cost: 8000  },
  { id: 'cart-5', name: 'Freight Hold', size: 800,  cost: 40000 },
];


/* --------------------------------------------------------
   WORLD GENERATION RULES
   For each depth band: tile type + hardness + mineral distribution.
   weight = relative chance; null = no mineral
   -------------------------------------------------------- */
NG.digger.BANDS = [
  { minRow: 4,  maxRow: 10, tileType: 'dirt',      hardness: 1, elevatorRow: 8,
    minerals: [ {id: null, w: 84}, {id: 'pebble', w: 12}, {id: 'coal', w: 4} ] },

  { minRow: 11, maxRow: 22, tileType: 'dirt',      hardness: 2, elevatorRow: 18,
    minerals: [ {id: null, w: 70}, {id: 'pebble', w: 10}, {id: 'coal', w: 12}, {id: 'iron', w: 8} ] },

  { minRow: 23, maxRow: 36, tileType: 'stone',     hardness: 3, elevatorRow: 32,
    minerals: [ {id: null, w: 60}, {id: 'coal', w: 10}, {id: 'iron', w: 15}, {id: 'copper', w: 12}, {id: 'silver', w: 3} ] },

  { minRow: 37, maxRow: 52, tileType: 'stone',     hardness: 4, elevatorRow: 48,
    minerals: [ {id: null, w: 55}, {id: 'iron', w: 8}, {id: 'copper', w: 14}, {id: 'silver', w: 14}, {id: 'gold', w: 9} ] },

  { minRow: 53, maxRow: 70, tileType: 'hardstone', hardness: 6, elevatorRow: 66,
    minerals: [ {id: null, w: 50}, {id: 'silver', w: 14}, {id: 'gold', w: 18}, {id: 'ruby', w: 12}, {id: 'emerald', w: 6} ] },

  { minRow: 71, maxRow: 90, tileType: 'hardstone', hardness: 9, elevatorRow: 86,
    minerals: [ {id: null, w: 45}, {id: 'gold', w: 16}, {id: 'ruby', w: 18}, {id: 'emerald', w: 13}, {id: 'sapphire', w: 8} ] },

  { minRow: 91, maxRow: 110, tileType: 'bedrock', hardness: 14, elevatorRow: 106,
    minerals: [ {id: null, w: 50}, {id: 'emerald', w: 14}, {id: 'sapphire', w: 18}, {id: 'diamond', w: 18} ] },
];

NG.digger.WORLD = { cols: 8, rows: 112, surfaceRow: 3, shopCol: 4 };


/* --------------------------------------------------------
   COSMETICS — purely visual, no gameplay effect
   Player can buy hats, pickaxe skins, cart skins, & titles.
   All earned cosmetics persist in state.ownedCosmetics.
   -------------------------------------------------------- */
NG.digger.COSMETICS = {
  hats: [
    { id: 'hat-viking',    name: 'Viking Helm',      emoji: '⚔️', cost: 500,   desc: 'Classic Norse headgear' },
    { id: 'hat-sombrero',  name: 'Sombrero',         emoji: '🎩', cost: 800,   desc: 'Desert style' },
    { id: 'hat-crown',     name: 'Golden Crown',     emoji: '👑', cost: 5000,  desc: 'Reign supreme' },
    { id: 'hat-tophat',    name: 'Top Hat',          emoji: '🎩', cost: 2000,  desc: 'Classic elegance' },
    { id: 'hat-hardhat',   name: 'Safety Helmet',    emoji: '🪖', cost: 300,   desc: 'Professional digger' },
  ],
  pickaxeSkins: [
    { id: 'skin-golden',   name: 'Golden Pick',      emoji: '🟡', cost: 1000,  desc: 'Luxury mining tool' },
    { id: 'skin-diamond',  name: 'Diamond Tipped',   emoji: '💎', cost: 3000,  desc: 'Most valuable' },
    { id: 'skin-fire',     name: 'Flame Pick',       emoji: '🔥', cost: 2000,  desc: 'Burn through rock' },
    { id: 'skin-ice',      name: 'Frost Pick',       emoji: '❄️', cost: 2000,  desc: 'Shatter stone' },
  ],
  cartSkins: [
    { id: 'cart-gold',     name: 'Golden Cart',      emoji: '🟨', cost: 1500,  desc: 'Glittering hauler' },
    { id: 'cart-crystal',  name: 'Crystal Wagon',    emoji: '✨', cost: 2500,  desc: 'Sparkling transport' },
    { id: 'cart-steam',    name: 'Steam Engine',     emoji: '🚂', cost: 3000,  desc: 'Industrial power' },
  ],
  titles: [
    { id: 'title-expert',  name: 'Expert Miner',     emoji: '⛏️', cost: 1000,  desc: 'You know your stuff' },
    { id: 'title-dragon',  name: 'Dragon Slayer',    emoji: '🐉', cost: 5000,  desc: 'Legendary digger' },
    { id: 'title-pharaoh', name: 'Pharaoh',          emoji: '👑', cost: 8000,  desc: 'Master of the sands' },
    { id: 'title-legend',  name: 'Living Legend',    emoji: '⭐', cost: 10000, desc: 'Immortal fame' },
  ],
};
