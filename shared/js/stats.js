/* ============================================================
   stats.js — Game statistics tracking
   ============================================================
   Tracks wins, losses, streaks, times, and scores per variant
   Persists to localStorage for long-term player progression
   ============================================================ */

window.NG = window.NG || {};
NG.stats = NG.stats || {};

(function() {
  const STORAGE_PREFIX = 'newgames.stats';

  // Default stats structure
  function defaultStats() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalTime: 0,       // milliseconds
      bestTime: null,     // best winning time in milliseconds
      bestScore: 0,
      totalScore: 0,
      lastGameWon: false,
      lastGameTime: 0,
    };
  }

  function getStorageKey(variant) {
    return `${STORAGE_PREFIX}.${variant}`;
  }

  // Load stats for a variant from localStorage
  function load(variant) {
    try {
      const key = getStorageKey(variant);
      const stored = localStorage.getItem(key);
      if (!stored) return defaultStats();
      const data = JSON.parse(stored);
      // Merge with defaults in case new fields were added
      return Object.assign(defaultStats(), data);
    } catch (e) {
      console.warn('[NG.stats] Failed to load stats for', variant, e);
      return defaultStats();
    }
  }

  // Save stats for a variant to localStorage
  function save(variant, stats) {
    try {
      const key = getStorageKey(variant);
      localStorage.setItem(key, JSON.stringify(stats));
    } catch (e) {
      console.warn('[NG.stats] Failed to save stats for', variant, e);
    }
  }

  // Record a completed game
  function recordGame(variant, won, score, timeMs) {
    const stats = load(variant);

    stats.gamesPlayed++;
    stats.totalTime += timeMs;
    stats.totalScore += score;

    if (won) {
      stats.gamesWon++;
      stats.lastGameWon = true;
      stats.currentStreak++;
      if (stats.currentStreak > stats.bestStreak) {
        stats.bestStreak = stats.currentStreak;
      }
      if (score > stats.bestScore) {
        stats.bestScore = score;
      }
      if (!stats.bestTime || timeMs < stats.bestTime) {
        stats.bestTime = timeMs;
      }
    } else {
      stats.lastGameWon = false;
      stats.currentStreak = 0;
    }

    stats.lastGameTime = timeMs;
    save(variant, stats);
    return stats;
  }

  // Get current streak
  function getStreak(variant) {
    const stats = load(variant);
    return stats.currentStreak;
  }

  // Get win/loss ratio percentage
  function getWinRate(variant) {
    const stats = load(variant);
    if (stats.gamesPlayed === 0) return 0;
    return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
  }

  // Format time (ms) to readable string
  function formatTime(ms) {
    if (!ms) return '--:--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  // Get all stats for a variant
  function getStats(variant) {
    return load(variant);
  }

  // Reset stats for a variant
  function reset(variant) {
    try {
      const key = getStorageKey(variant);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[NG.stats] Failed to reset stats for', variant, e);
    }
  }

  // Reset all stats (careful!)
  function resetAll() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('[NG.stats] Failed to reset all stats', e);
    }
  }

  // Get comparison across all variants
  function getAllStats() {
    const variants = ['klondike', 'spider', 'freecell'];
    const result = {};
    variants.forEach(v => {
      result[v] = load(v);
    });
    return result;
  }

  // Public API
  NG.stats = {
    recordGame,
    getStats,
    getStreak,
    getWinRate,
    formatTime,
    reset,
    resetAll,
    getAllStats,
    load,
    save,
  };
})();
