/* ============================================================
   deck-themes.js — Manage card deck theme selection
   ============================================================ */

window.NG = window.NG || {};
NG.deckThemes = NG.deckThemes || {};

NG.deckThemes.THEMES = [
  { id: 'standard',    name: 'Standard Deck',    emoji: '🂮' },
  { id: 'superman',    name: 'Superman',         emoji: '🦸‍♂️' },
  { id: 'ironman',     name: 'Iron Man',         emoji: '🤖' },
  { id: 'spiderman',   name: 'Spider-Man',       emoji: '🕷️' },
  { id: 'incredibles', name: 'Mr. Incredible',   emoji: '👨‍👩‍👧‍👦' },
  { id: 'hulk',        name: 'Hulk',             emoji: '💚' },
  { id: 'captain',     name: 'Captain America',  emoji: '🛡️' },
  { id: 'daredevil',   name: 'Daredevil',        emoji: '👁️' },
];

const STORAGE_KEY = 'newgames.cards.deck-theme';

function getCurrentTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'standard';
}

function setTheme(themeId) {
  const theme = NG.deckThemes.THEMES.find(t => t.id === themeId);
  if (!theme) return;

  localStorage.setItem(STORAGE_KEY, themeId);

  // Remove all deck classes
  NG.deckThemes.THEMES.forEach(t => {
    document.body.classList.remove(`deck-${t.id}`);
  });

  // Add selected theme
  document.body.classList.add(`deck-${themeId}`);
}

function openThemeSelector() {
  const current = getCurrentTheme();
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
  grid.style.gap = 'var(--ng-space-2)';

  NG.deckThemes.THEMES.forEach(theme => {
    const btn = document.createElement('button');
    btn.className = 'btn' + (theme.id === current ? ' btn--primary' : ' btn--secondary');
    btn.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 4px;">${theme.emoji}</div>
      <div style="font-size: 12px;">${theme.name}</div>
    `;
    btn.style.padding = 'var(--ng-space-3)';
    btn.style.borderRadius = 'var(--ng-radius-md)';
    btn.addEventListener('click', () => {
      setTheme(theme.id);
      NG.modal.close();
      NG.toast(`Switched to ${theme.name}`, { type: 'success' });
    });
    grid.appendChild(btn);
  });

  NG.modal.open({
    title: 'Choose Deck Theme',
    body: grid,
    actions: [{ label: 'Close', variant: 'ghost' }],
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTheme(getCurrentTheme());
    const btn = document.getElementById('btn-deck');
    if (btn) NG.on(btn, 'click', openThemeSelector);
  });
} else {
  setTheme(getCurrentTheme());
  const btn = document.getElementById('btn-deck');
  if (btn) NG.on(btn, 'click', openThemeSelector);
}
