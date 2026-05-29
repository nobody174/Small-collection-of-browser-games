/* ============================================================
   utils.js — Shared helper functions
   ------------------------------------------------------------
   Everything attaches to a single global namespace: window.NG.
   Other shared modules (save, audio, particles, ui) add their
   own properties onto NG, so the global scope stays clean.

   Import order in HTML: utils.js MUST come before save/audio/
   particles/ui, because they call NG.* helpers from here.
   ============================================================ */

// Create the global namespace ONLY if it doesn't already exist.
// Using `window.NG = window.NG || {}` lets us load this file twice
// without wiping previously-attached modules.
window.NG = window.NG || {};


/* ============================================================
   DOM SHORTCUTS
   $  — querySelector  (first match)
   $$ — querySelectorAll → real Array (so .map/.forEach work)
   on — addEventListener with a delegate option
   ============================================================ */

NG.$  = (sel, root = document) => root.querySelector(sel);
NG.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Tiny event helper — supports event delegation if you pass a 4th arg
NG.on = function (el, event, handler, delegateSelector) {
  if (!el) return;
  if (delegateSelector) {
    el.addEventListener(event, (e) => {
      const target = e.target.closest(delegateSelector);
      if (target && el.contains(target)) handler.call(target, e, target);
    });
  } else {
    el.addEventListener(event, handler);
  }
};


/* ============================================================
   NUMBER FORMATTING
   Formats big numbers nicely: 1500 → "1.5K", 2_400_000 → "2.4M"
   Works for any positive number up to quadrillions (Qa).
   ============================================================ */

NG.formatNumber = function (n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  if (n < 1000) return Math.floor(n).toString();

  const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
  const i = Math.min(units.length - 1, Math.floor(Math.log10(n) / 3));
  const scaled = n / Math.pow(1000, i);

  // 1 decimal place, but trim trailing ".0" for cleanliness
  const str = scaled.toFixed(1).replace(/\.0$/, '');
  return str + units[i];
};

/* Pretty time string. ms → "1m 23s" or "3h 12m" */
NG.formatTime = function (ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)    return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60)    return m + 'm ' + (s % 60) + 's';
  const h = Math.floor(m / 60);
  if (h < 24)    return h + 'h ' + (m % 60) + 'm';
  const d = Math.floor(h / 24);
  return d + 'd ' + (h % 24) + 'h';
};


/* ============================================================
   MATH HELPERS
   ============================================================ */

// Restrict a number to a [min, max] range
NG.clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Linear interpolation: returns a value `t` (0..1) between a and b
NG.lerp = (a, b, t) => a + (b - a) * t;

// Random integer in [min, max] inclusive
NG.randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Random float in [min, max)
NG.randomFloat = (min, max) => Math.random() * (max - min) + min;

// Pick a random element from an array
NG.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Pick weighted: pass [{value, weight}, ...]
NG.pickWeighted = function (items) {
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  let roll = Math.random() * total;
  for (const it of items) {
    roll -= it.weight;
    if (roll <= 0) return it.value;
  }
  return items[items.length - 1].value;
};

// Fisher–Yates shuffle (in-place). Returns the same array.
NG.shuffle = function (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};


/* ============================================================
   ANIMATION REPLAY TRICK
   To play a CSS animation a second time you must remove the class,
   force the browser to re-layout, then re-add the class.
   ============================================================ */

NG.replayAnim = function (el, className) {
  if (!el) return;
  el.classList.remove(className);
  // Reading offsetWidth forces a synchronous layout — that "commits"
  // the class removal before we add it again, so the animation restarts.
  void el.offsetWidth;
  el.classList.add(className);
};


/* ============================================================
   SAFE EVENT — auto-removes after one fire (useful for animationend)
   ============================================================ */

NG.once = function (el, event, handler) {
  const wrapped = (e) => {
    el.removeEventListener(event, wrapped);
    handler(e);
  };
  el.addEventListener(event, wrapped);
};


/* ============================================================
   DEBOUNCE / THROTTLE
   debounce — runs `fn` AFTER `wait` ms of silence (search inputs)
   throttle — runs `fn` AT MOST every `wait` ms (scroll/resize)
   ============================================================ */

NG.debounce = function (fn, wait = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
};

NG.throttle = function (fn, wait = 150) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
};


/* ============================================================
   DEVICE DETECTION (lightweight)
   Used by games to enable touch-only behaviour or layout tweaks.
   ============================================================ */

NG.isTouch = function () {
  return ('ontouchstart' in window) ||
         (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
};
