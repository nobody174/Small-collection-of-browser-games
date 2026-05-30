/* ============================================================
   ui.js — Toasts, modals, helpers
   ------------------------------------------------------------
   Pairs with ui.css + animations.css.

   API:
     NG.toast('Saved!', { type: 'success', duration: 2200 })
     NG.modal.open({ title, body, actions: [{label, onClick, variant}] })
     NG.modal.close()
     NG.modal.confirm({ title, body, confirmLabel, cancelLabel })
       → returns a Promise<boolean>
   ============================================================ */

window.NG = window.NG || {};


/* ============================================================
   TOAST
   Creates a top-center container on demand, then appends a toast
   that auto-removes after `duration`.
   ============================================================ */

(function () {

  let container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  /* type: 'info' | 'success' | 'warning' | 'danger' (optional) */
  NG.toast = function (message, opts = {}) {
    const duration = opts.duration || 2200;
    const type     = opts.type     || '';

    const t = document.createElement('div');
    t.className = 'toast ng-slide-down' + (type ? ` toast--${type}` : '');
    t.textContent = message;

    ensureContainer().appendChild(t);

    // Slide back out before removing
    setTimeout(() => {
      t.style.transition = 'opacity 200ms ease, transform 200ms ease';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-12px)';
      setTimeout(() => t.remove(), 220);
    }, duration);
  };
})();


/* ============================================================
   MODAL
   Single shared backdrop+dialog DOM that gets reused.
   ============================================================ */

NG.modal = (function () {

  let root, dialog, titleEl, bodyEl, actionsEl;
  let escHandler = null;

  function ensureDom() {
    if (root) return;

    root = document.createElement('div');
    root.className = 'modal';
    root.innerHTML = `
      <div class="modal__dialog ng-pop" role="dialog" aria-modal="true">
        <h2 class="modal__title"></h2>
        <div class="modal__body"></div>
        <div class="modal__actions"></div>
      </div>
    `;
    dialog    = root.querySelector('.modal__dialog');
    titleEl   = root.querySelector('.modal__title');
    bodyEl    = root.querySelector('.modal__body');
    actionsEl = root.querySelector('.modal__actions');

    // Click outside dialog → close (unless opts.dismissable === false)
    root.addEventListener('click', (e) => {
      if (e.target === root && root.dataset.dismissable !== 'false') close();
    });

    document.body.appendChild(root);
  }

  /* opts:
       title         — string
       body          — string | HTMLElement
       actions       — array of { label, onClick, variant, autofocus }
                       variant: 'primary' | 'secondary' | 'ghost' | 'danger'
       dismissable   — clicking outside or pressing Esc closes (default true)
  */
  function open(opts = {}) {
    ensureDom();

    titleEl.textContent = opts.title || '';
    titleEl.style.display = opts.title ? '' : 'none';

    // Body can be string OR an element you've already built
    bodyEl.innerHTML = '';
    if (opts.body instanceof HTMLElement) bodyEl.appendChild(opts.body);
    else bodyEl.textContent = opts.body || '';

    // Build action buttons
    actionsEl.innerHTML = '';
    (opts.actions || [{ label: 'OK', variant: 'primary' }]).forEach(act => {
      const btn = document.createElement('button');
      btn.className = 'btn btn--' + (act.variant || 'ghost');
      btn.textContent = act.label;
      btn.addEventListener('click', () => {
        if (typeof act.onClick === 'function') act.onClick();
        if (act.keepOpen !== true) close();
      });
      actionsEl.appendChild(btn);
      if (act.autofocus) setTimeout(() => btn.focus(), 30);
    });

    root.dataset.dismissable = opts.dismissable === false ? 'false' : 'true';
    root.classList.add('is-open');
    // Replay the pop-in animation each time we open
    if (NG.replayAnim) NG.replayAnim(dialog, 'ng-pop');

    // Esc to close
    if (opts.dismissable !== false) {
      escHandler = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', escHandler);
    }
  }

  function close() {
    if (!root) return;
    root.classList.remove('is-open');
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
  }

  /* Convenience: yes/no dialog → returns a Promise<boolean> */
  function confirm(opts = {}) {
    return new Promise((resolve) => {
      open({
        title: opts.title || 'Are you sure?',
        body:  opts.body  || '',
        dismissable: false,
        actions: [
          {
            label: opts.cancelLabel || 'Cancel',
            variant: 'ghost',
            onClick: () => resolve(false)
          },
          {
            label: opts.confirmLabel || 'Confirm',
            variant: opts.danger ? 'danger' : 'primary',
            autofocus: true,
            onClick: () => resolve(true)
          }
        ]
      });
    });
  }

  return { open, close, confirm };
})();


/* ============================================================
   VOLUME SLIDER — auto-wires #volume-slider + #btn-mute
   Called after DOM ready; each game HTML just needs those IDs.
   ============================================================ */
(function () {
  function initVolumeControl() {
    const slider = document.getElementById('volume-slider');
    const muteBtn = document.getElementById('btn-mute');
    if (!slider || !muteBtn) return;

    // Restore saved volume
    const savedVol = NG.audio.getMasterVolume();
    slider.value = Math.round(savedVol * 100);

    function updateMuteIcon() {
      const vol = parseInt(slider.value, 10);
      const muted = NG.audio.isMuted();
      muteBtn.textContent = (muted || vol === 0) ? '🔇' : vol < 50 ? '🔉' : '🔊';
    }

    slider.addEventListener('input', () => {
      const vol = parseInt(slider.value, 10) / 100;
      NG.audio.setMasterVolume(vol);
      updateMuteIcon();
    });

    muteBtn.addEventListener('click', () => {
      const muted = NG.audio.toggleMuted();
      if (!muted && parseInt(slider.value, 10) === 0) {
        // Unmuting with slider at 0 — restore to 35%
        slider.value = 35;
        NG.audio.setMasterVolume(0.35);
      }
      updateMuteIcon();
    });

    updateMuteIcon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVolumeControl);
  } else {
    initVolumeControl();
  }
})();
