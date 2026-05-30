/* ============================================================
   audio.js — Procedural sound engine (Web Audio API)
   ------------------------------------------------------------
   No audio files! Every sound is generated in code from short
   oscillators with a quick envelope (volume rises then fades).
   This is exactly the approach Delve used.

   Why procedural sound?
     - zero asset pipeline (no .mp3/.ogg files to ship)
     - tiny file size
     - works in every browser
     - very fast to iterate ("change the pitch a bit")

   Usage:
     NG.audio.play('click');
     NG.audio.play('coin');
     NG.audio.setMuted(true);
     NG.audio.toggleMuted();
   ============================================================ */

window.NG = window.NG || {};

NG.audio = (function () {

  // The AudioContext is the "speakers" of Web Audio.
  // We create it lazily on the first user interaction, because
  // browsers block audio until the user clicks something.
  let ctx = null;
  let muted = false;
  let masterVolume = 0.35;   // overall volume cap (avoid being loud)

  // Try to restore mute + volume settings from a previous session
  try {
    const stored = localStorage.getItem('newgames.muted');
    if (stored === '1') muted = true;
    const storedVol = localStorage.getItem('newgames.volume');
    if (storedVol !== null) masterVolume = parseFloat(storedVol);
  } catch {}

  /* --------------------------------------------------------
     ensureCtx — create / unlock the AudioContext on demand.
     Browsers won't let us play sound until the user clicks,
     so we wait until the first call.
     -------------------------------------------------------- */
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* --------------------------------------------------------
     tone — the low-level building block. Plays one note.
       freq      — frequency in Hz (440 = A4)
       duration  — seconds
       type      — oscillator wave: 'sine' | 'square' | 'triangle' | 'sawtooth'
       volume    — 0..1 (multiplied by masterVolume)
       attack    — fade-in seconds (0.005 = instant pop)
       release   — fade-out seconds
       glide     — optional target freq, glides over duration
     -------------------------------------------------------- */
  function tone({ freq = 440, duration = 0.12, type = 'sine',
                  volume = 1, attack = 0.005, release = 0.08, glide = null }) {
    if (muted) return;
    const ac = ensureCtx();
    if (!ac) return;

    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (glide !== null) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, glide), ac.currentTime + duration
      );
    }

    // ADSR-ish envelope: attack up, sustain, release down.
    const v = volume * masterVolume;
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(v, ac.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001,
      ac.currentTime + duration + release);

    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration + release + 0.02);
  }

  /* --------------------------------------------------------
     PRESETS — the sounds every game can call by name.
     Add more here over time; keep them short and snappy.
     -------------------------------------------------------- */
  const presets = {

    click: () => tone({
      freq: 600, glide: 480, duration: 0.05,
      type: 'triangle', volume: 0.6, release: 0.05
    }),

    pop: () => tone({
      freq: 880, glide: 1100, duration: 0.06,
      type: 'sine', volume: 0.7, release: 0.06
    }),

    coin: () => {
      // Two-note chime — feels rewarding
      tone({ freq: 880,  duration: 0.06, type: 'square', volume: 0.4 });
      setTimeout(() => tone({
        freq: 1320, duration: 0.10, type: 'square', volume: 0.4
      }), 60);
    },

    success: () => {
      // Rising arpeggio
      [523, 659, 784, 1047].forEach((f, i) => {
        setTimeout(() => tone({
          freq: f, duration: 0.08, type: 'triangle', volume: 0.5
        }), i * 60);
      });
    },

    error: () => tone({
      freq: 220, glide: 110, duration: 0.18,
      type: 'sawtooth', volume: 0.4, release: 0.15
    }),

    swoosh: () => tone({
      freq: 1200, glide: 200, duration: 0.18,
      type: 'sine', volume: 0.25, release: 0.15
    }),

    upgrade: () => {
      // Power-up chord
      [392, 494, 587].forEach((f, i) => setTimeout(() => tone({
        freq: f, duration: 0.18, type: 'triangle', volume: 0.45, release: 0.18
      }), i * 30));
    },

    flip: () => tone({
      freq: 700, glide: 900, duration: 0.05,
      type: 'square', volume: 0.3, release: 0.05
    }),
  };

  /* --------------------------------------------------------
     PUBLIC API
     -------------------------------------------------------- */
  function play(name) {
    const fn = presets[name];
    if (!fn) {
      console.warn('[NG.audio] no preset called', name);
      return;
    }
    fn();
  }

  function setMuted(value) {
    muted = !!value;
    try { localStorage.setItem('newgames.muted', muted ? '1' : '0'); } catch {}
  }
  function toggleMuted() { setMuted(!muted); return muted; }
  function isMuted() { return muted; }

  function setMasterVolume(v) {
    masterVolume = NG.clamp ? NG.clamp(v, 0, 1) : Math.max(0, Math.min(1, v));
    try { localStorage.setItem('newgames.volume', masterVolume); } catch {}
    // Auto-unmute when volume is turned up
    if (masterVolume > 0 && muted) { setMuted(false); }
    // Auto-mute when volume is set to 0
    if (masterVolume === 0) { setMuted(true); }
  }
  function getMasterVolume() { return masterVolume; }

  /* Expose `tone` too, in case a game wants a custom sound */
  return { play, tone, setMuted, toggleMuted, isMuted, setMasterVolume, getMasterVolume, presets };
})();
