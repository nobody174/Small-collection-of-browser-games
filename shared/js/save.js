/* ============================================================
   save.js — Save/load system
   ------------------------------------------------------------
   Thin wrapper around localStorage with:
     - per-game namespacing (e.g. "newgames.cards.save")
     - save versioning (so old saves can be migrated/ignored)
     - autosave loop (start/stop)
     - JSON safety (corrupt data won't crash the game)

   Usage:
     const store = NG.save.create('cards', { version: 1 });
     store.write({ score: 0, deck: [...] });   // save
     const data = store.read();                 // load (or null)
     store.clear();                             // wipe save
     store.startAutosave(() => buildSaveObject(), 30000);
     store.stopAutosave();
   ============================================================ */

window.NG = window.NG || {};

NG.save = (function () {

  const ROOT_PREFIX = 'newgames';   // every key starts with this

  /* Build the localStorage key for a given game */
  function keyFor(gameId) {
    return `${ROOT_PREFIX}.${gameId}.save`;
  }

  /* Create a save store for one game.
     opts.version  — bump this when your save format changes (default 1)
     opts.onLoadError — optional callback if a save is corrupt/old      */
  function create(gameId, opts = {}) {
    const version  = opts.version || 1;
    const storageKey = keyFor(gameId);

    let autosaveTimer = null;

    /* --- write ----------------------------------------------------- */
    function write(data) {
      try {
        const payload = {
          version,
          savedAt: Date.now(),
          data
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        return true;
      } catch (e) {
        // localStorage can throw in private-browsing or when full
        console.warn('[NG.save] write failed:', e);
        return false;
      }
    }

    /* --- read ------------------------------------------------------ */
    function read() {
      let raw;
      try {
        raw = localStorage.getItem(storageKey);
      } catch (e) {
        console.warn('[NG.save] read failed:', e);
        return null;
      }
      if (!raw) return null;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.warn('[NG.save] corrupt save, ignoring:', e);
        if (opts.onLoadError) opts.onLoadError('parse');
        return null;
      }

      // Version mismatch — let the caller decide what to do
      if (parsed.version !== version) {
        console.warn(`[NG.save] version mismatch (have ${parsed.version}, expected ${version})`);
        if (opts.onLoadError) opts.onLoadError('version', parsed);
        return null;
      }

      return parsed.data;
    }

    /* --- metadata about the last save ------------------------------ */
    function meta() {
      let raw;
      try { raw = localStorage.getItem(storageKey); } catch { return null; }
      if (!raw) return null;
      try {
        const p = JSON.parse(raw);
        return { version: p.version, savedAt: p.savedAt };
      } catch { return null; }
    }

    /* --- clear ----------------------------------------------------- */
    function clear() {
      try { localStorage.removeItem(storageKey); } catch {}
    }

    /* --- autosave loop --------------------------------------------- */
    /* getDataFn must return the latest state each tick.              */
    function startAutosave(getDataFn, intervalMs = 30000) {
      stopAutosave();
      autosaveTimer = setInterval(() => {
        try { write(getDataFn()); } catch (e) { console.warn(e); }
      }, intervalMs);
    }

    function stopAutosave() {
      if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = null;
      }
    }

    return { write, read, meta, clear, startAutosave, stopAutosave, storageKey };
  }

  /* --- list all game save keys (handy for a "wipe all" button) ----- */
  function listAll() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(ROOT_PREFIX + '.')) out.push(k);
      }
    } catch {}
    return out;
  }

  /* --- wipe every save across every game --------------------------- */
  function wipeAll() {
    listAll().forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  }

  return { create, listAll, wipeAll, keyFor };
})();
