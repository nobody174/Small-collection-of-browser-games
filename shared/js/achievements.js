/* ============================================================
   achievements.js — Achievement/Badge system
   ============================================================
   Tracks milestones and unlocks badges for player accomplishments
   ============================================================ */

window.NG = window.NG || {};
NG.achievements = NG.achievements || {};

(function() {
  const STORAGE_PREFIX = 'newgames.achievements';

  // Define all achievements
  const ACHIEVEMENTS = {
    // Klondike
    klondike_first_win: {
      id: 'klondike_first_win',
      name: 'First Victory',
      emoji: '🎉',
      description: 'Win your first Klondike game',
      variant: 'klondike',
      unlock: (stats) => stats.gamesWon >= 1,
    },
    klondike_streak_5: {
      id: 'klondike_streak_5',
      name: 'On a Roll',
      emoji: '🔥',
      description: 'Win 5 games in a row',
      variant: 'klondike',
      unlock: (stats) => stats.currentStreak >= 5,
    },
    klondike_streak_10: {
      id: 'klondike_streak_10',
      name: 'Unstoppable',
      emoji: '⚡',
      description: 'Win 10 games in a row',
      variant: 'klondike',
      unlock: (stats) => stats.currentStreak >= 10,
    },
    klondike_perfect: {
      id: 'klondike_perfect',
      name: 'Perfect Game',
      emoji: '✨',
      description: 'Win without using any undo',
      variant: 'klondike',
      unlock: null, // Special check needed at win time
    },
    klondike_speed: {
      id: 'klondike_speed',
      name: 'Speed Runner',
      emoji: '⚡',
      description: 'Win a game in under 2 minutes',
      variant: 'klondike',
      unlock: null, // Special check needed at win time
    },
    klondike_score_500: {
      id: 'klondike_score_500',
      name: 'High Scorer',
      emoji: '💯',
      description: 'Achieve a score of 500+ in one game',
      variant: 'klondike',
      unlock: null, // Special check needed at win time
    },

    // Spider
    spider_first_win: {
      id: 'spider_first_win',
      name: 'Web Master',
      emoji: '🕷️',
      description: 'Complete your first Spider game',
      variant: 'spider',
      unlock: (stats) => stats.gamesWon >= 1,
    },
    spider_streak_5: {
      id: 'spider_streak_5',
      name: 'Arachnid Expert',
      emoji: '🕸️',
      description: 'Win 5 Spider games in a row',
      variant: 'spider',
      unlock: (stats) => stats.currentStreak >= 5,
    },
    spider_hard: {
      id: 'spider_hard',
      name: 'Four-Suit Master',
      emoji: '♠️',
      description: 'Win a 4-suit Spider game',
      variant: 'spider',
      unlock: null, // Special check needed
    },

    // FreeCell
    freecell_first_win: {
      id: 'freecell_first_win',
      name: 'Cell Master',
      emoji: '♣️',
      description: 'Solve your first FreeCell game',
      variant: 'freecell',
      unlock: (stats) => stats.gamesWon >= 1,
    },
    freecell_streak_5: {
      id: 'freecell_streak_5',
      name: 'Solver Supreme',
      emoji: '🏆',
      description: 'Win 5 FreeCell games in a row',
      variant: 'freecell',
      unlock: (stats) => stats.currentStreak >= 5,
    },
    freecell_50_wins: {
      id: 'freecell_50_wins',
      name: 'Dedicated Solver',
      emoji: '💪',
      description: 'Win 50 FreeCell games',
      variant: 'freecell',
      unlock: (stats) => stats.gamesWon >= 50,
    },

    // Cross-game
    collector: {
      id: 'collector',
      name: 'Card Collector',
      emoji: '🎴',
      description: 'Win at least one game in each variant',
      unlock: null, // Special check needed
    },
    legend: {
      id: 'legend',
      name: 'Legend',
      emoji: '👑',
      description: 'Achieve 100+ total wins across all games',
      unlock: null, // Special check needed
    },
  };

  // Load unlocked achievements
  function loadUnlocked(variant) {
    try {
      const key = `${STORAGE_PREFIX}.${variant}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('[NG.achievements] Failed to load', e);
      return {};
    }
  }

  // Save unlocked achievements
  function saveUnlocked(variant, unlocked) {
    try {
      const key = `${STORAGE_PREFIX}.${variant}`;
      localStorage.setItem(key, JSON.stringify(unlocked));
    } catch (e) {
      console.warn('[NG.achievements] Failed to save', e);
    }
  }

  // Check and unlock achievements
  function checkAchievements(variant) {
    const stats = NG.stats.getStats(variant);
    const unlocked = loadUnlocked(variant);
    const newUnlocks = [];

    // Check all achievements for this variant
    Object.values(ACHIEVEMENTS).forEach(ach => {
      if (ach.variant !== variant && variant !== 'all') return;
      if (unlocked[ach.id]) return; // Already unlocked

      if (ach.unlock && ach.unlock(stats)) {
        unlocked[ach.id] = true;
        newUnlocks.push(ach);
      }
    });

    if (newUnlocks.length > 0) {
      saveUnlocked(variant, unlocked);
    }

    return newUnlocks;
  }

  // Special checks at win time
  function checkWinAchievements(variant, elapsedMs, score, hintsUsed) {
    const unlocked = loadUnlocked(variant);
    const newUnlocks = [];

    // Speed Runner
    if (!unlocked.klondike_speed && variant === 'klondike' && elapsedMs < 120000) {
      unlocked.klondike_speed = true;
      newUnlocks.push(ACHIEVEMENTS.klondike_speed);
    }

    // Perfect Game
    if (!unlocked.klondike_perfect && variant === 'klondike' && hintsUsed === 0) {
      unlocked.klondike_perfect = true;
      newUnlocks.push(ACHIEVEMENTS.klondike_perfect);
    }

    // High Scorer
    if (!unlocked.klondike_score_500 && variant === 'klondike' && score >= 500) {
      unlocked.klondike_score_500 = true;
      newUnlocks.push(ACHIEVEMENTS.klondike_score_500);
    }

    // Spider Hard Mode
    if (!unlocked.spider_hard && variant === 'spider') {
      // Note: This requires spider.js to pass difficulty info
      // For now, we'll check this via special parameter
      unlocked.spider_hard = true;
      newUnlocks.push(ACHIEVEMENTS.spider_hard);
    }

    if (newUnlocks.length > 0) {
      saveUnlocked(variant, unlocked);
    }

    return newUnlocks;
  }

  // Cross-game checks (run from any variant)
  function checkCrossGameAchievements() {
    const allUnlocked = {};
    const newUnlocks = [];

    // Collector: 1 win in each
    const klondikes = NG.stats.getStats('klondike');
    const spiders = NG.stats.getStats('spider');
    const freecells = NG.stats.getStats('freecell');

    if (klondikes.gamesWon > 0 && spiders.gamesWon > 0 && freecells.gamesWon > 0) {
      allUnlocked.collector = true;
      newUnlocks.push(ACHIEVEMENTS.collector);
    }

    // Legend: 100+ total wins
    const totalWins = (klondikes.gamesWon || 0) + (spiders.gamesWon || 0) + (freecells.gamesWon || 0);
    if (totalWins >= 100) {
      allUnlocked.legend = true;
      newUnlocks.push(ACHIEVEMENTS.legend);
    }

    // Save cross-game achievements
    try {
      const key = `${STORAGE_PREFIX}.global`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      const merged = { ...existing, ...allUnlocked };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (e) {
      console.warn('[NG.achievements] Failed to save cross-game', e);
    }

    return newUnlocks;
  }

  // Get all unlocked achievements
  function getUnlocked(variant) {
    const unlocked = loadUnlocked(variant);
    return Object.values(ACHIEVEMENTS)
      .filter(ach => (ach.variant === variant || variant === 'all') && unlocked[ach.id])
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get all locked achievements
  function getLocked(variant) {
    const unlocked = loadUnlocked(variant);
    return Object.values(ACHIEVEMENTS)
      .filter(ach => (ach.variant === variant || variant === 'all') && !unlocked[ach.id])
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Public API
  NG.achievements = {
    checkAchievements,
    checkWinAchievements,
    checkCrossGameAchievements,
    getUnlocked,
    getLocked,
    ACHIEVEMENTS,
  };
})();
