/* ============================================================
   particles.js — Lightweight particle effects
   ------------------------------------------------------------
   Pure DOM particles (no canvas). Each particle is a tiny <div>
   that gets animated then removed. Cheap enough for a casual game,
   and trivially styleable with CSS variables.

   Functions:
     NG.particles.burst(x, y, opts)     — sparks/dots radiating outward
     NG.particles.floatText(parent, text, opts) — Delve-style floating number
     NG.particles.confetti(opts)        — celebratory full-screen confetti
   ============================================================ */

window.NG = window.NG || {};

NG.particles = (function () {

  /* --------------------------------------------------------
     BURST — radial spray of small dots from a point.
       x, y    — page coordinates (e.g. e.clientX, e.clientY)
       opts.count    — number of particles (default 12)
       opts.colors   — array of CSS colors
       opts.spread   — max distance in px each particle travels
       opts.size     — particle size in px
     -------------------------------------------------------- */
  function burst(x, y, opts = {}) {
    const count   = opts.count   || 12;
    const colors  = opts.colors  || ['#7c5cff', '#ff8fb1', '#4ad295', '#ffc46b', '#57c7ff'];
    const spread  = opts.spread  || 70;
    const size    = opts.size    || 8;
    const duration = opts.duration || 700;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5);
      const dist  = spread * (0.6 + Math.random() * 0.4);
      const dx    = Math.cos(angle) * dist;
      const dy    = Math.sin(angle) * dist;

      p.style.cssText = `
        position: fixed;
        left: ${x}px;
        top:  ${y}px;
        width:  ${size}px;
        height: ${size}px;
        background: ${colors[i % colors.length]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: transform ${duration}ms cubic-bezier(.22,1,.36,1),
                    opacity   ${duration}ms ease-out;
      `;
      document.body.appendChild(p);

      // Kick off the transition on the next frame
      requestAnimationFrame(() => {
        p.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`;
        p.style.opacity   = '0';
      });

      // Clean up after the animation ends
      setTimeout(() => p.remove(), duration + 50);
    }
  }

  /* --------------------------------------------------------
     FLOAT-TEXT — rising number/text inside a parent element.
     Parent MUST be position:relative so absolute children work.
       parent  — DOM element the text floats above
       text    — string ("+10", "CRIT!", "🪙 5")
       opts.color   — CSS color (defaults to amber)
       opts.left    — % across parent (default random 35-65)
     -------------------------------------------------------- */
  function floatText(parent, text, opts = {}) {
    if (!parent) return;
    const left  = opts.left  != null ? opts.left  : 35 + Math.random() * 30;
    const color = opts.color || 'var(--ng-color-warning)';

    const el = document.createElement('div');
    el.className = 'float-num float-num--anim';
    el.textContent = text;
    el.style.left  = left + '%';
    el.style.top   = '50%';
    el.style.color = color;

    parent.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  /* --------------------------------------------------------
     CONFETTI — big celebratory spray from the top of the screen.
     Uses the .ng-confetti class + CSS variables --dx/--dy/--rot.
       opts.count   — how many pieces (default 80)
       opts.colors  — palette
       opts.origin  — 'top' | 'center'  (default 'top')
     -------------------------------------------------------- */
  function confetti(opts = {}) {
    const count   = opts.count  || 80;
    const colors  = opts.colors || ['#7c5cff', '#ff8fb1', '#4ad295', '#ffc46b', '#57c7ff', '#ff6b6b'];
    const origin  = opts.origin || 'top';

    const startX = window.innerWidth / 2;
    const startY = origin === 'center' ? window.innerHeight / 2 : -20;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'ng-confetti';

      // direction: spread out horizontally, fall downward
      const dx = (Math.random() - 0.5) * window.innerWidth;
      const dy = origin === 'center'
        ? (Math.random() - 0.4) * window.innerHeight
        : window.innerHeight + Math.random() * 100;
      const rot = (Math.random() * 720 - 360) + 'deg';

      piece.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top:  ${startY}px;
        width: 10px;
        height: 14px;
        background: ${colors[i % colors.length]};
        border-radius: 2px;
        pointer-events: none;
        z-index: 9999;
        --dx: ${dx}px;
        --dy: ${dy}px;
        --rot: ${rot};
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1300);
    }
  }

  return { burst, floatText, confetti };
})();
