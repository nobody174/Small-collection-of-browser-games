/* ============================================================
   seeded-random.js — Deterministic random number generator
   ============================================================
   Generates the same sequence of random numbers for the same seed
   Used for daily challenges where all players get the same shuffle
   ============================================================ */

window.NG = window.NG || {};

(function() {

  // Linear Congruential Generator - simple and effective
  class SeededRandom {
    constructor(seed) {
      // Use timestamp as default
      this.seed = seed || Math.floor(Date.now() / 1000);
      this.m = 2147483647; // 2^31 - 1
      this.a = 16807;      // multiplier
    }

    // Return next random number between 0 and 1
    next() {
      this.seed = (this.a * this.seed) % this.m;
      return this.seed / this.m;
    }

    // Return random integer between min (inclusive) and max (exclusive)
    nextInt(min, max) {
      return Math.floor(this.next() * (max - min)) + min;
    }

    // Return random element from array
    pick(array) {
      if (!array || array.length === 0) return null;
      return array[this.nextInt(0, array.length)];
    }
  }

  // Generate daily seed from date string (YYYY-MM-DD)
  // Same seed for all players on the same day
  function getDailySeed(dateStr) {
    // Convert date string to deterministic number
    // Example: "2026-06-25" → 20260625
    const cleaned = dateStr.replace(/-/g, '');
    return parseInt(cleaned);
  }

  // Get today's seed
  function getTodaySeed() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return getDailySeed(dateStr);
  }

  // Fisher-Yates shuffle using seeded RNG
  function shuffle(array, rng) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = rng.nextInt(0, i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Public API
  NG.SeededRandom = SeededRandom;
  NG.seededRandom = {
    getDailySeed,
    getTodaySeed,
    shuffle,
  };
})();
