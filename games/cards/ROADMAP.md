# 🎴 Card Games — Future Roadmap

## Current Version: 1.0
✅ Klondike Solitaire (fully playable)
✅ Spider Solitaire 
✅ FreeCell
✅ Infinite deck recycling (waste cards cycle back to stock without shuffle)
✅ 3-card draw (cards stack on top of each other)

---

## 📋 Patch 1.1 — UI/UX Polish

### Top Bar Enhancement
- Mode selector (Easy, Medium, Hard difficulty)
- Score display with point tracking system
- Game timer with pause/resume
- Settings icon

### Bottom Action Bar Refresh
- Replace plain buttons with emoji-based design:
  - 🆕 New Game
  - 💡 Hint (shows next playable move)
  - ↩️ Undo (revert last move)
  - ↪️ Undo All (back to start)
  - ⋮ More options (menu)
- Better spacing and visual hierarchy
- Responsive button sizing for mobile

### Card Visual Improvements
- **3D Card Shadows** — Drop shadow and depth effect on all cards
- **Hint Highlighting** — Golden glow outline on playable cards (only when Hint is active)
- **Card Animations** — Smooth transitions when moving between piles
- **Waste Pile Fan Layout** — Visual spread of waste cards (fan-right) instead of stacked

### Difficulty System
- **Easy:** 1-card draw, relaxed rules
- **Medium:** 3-card draw, standard rules (current)
- **Hard:** 3-card draw, no undo, stricter rules
- Affects scoring multiplier

### Score Calculation
- Base points per card moved
- Time bonus (faster = more points)
- Difficulty multiplier
- Penalty for recycling deck

### Responsive Design
- **Fullscreen button** — Toggle fullscreen mode
- **Auto-fit to screen** — Cards scale for:
  - Desktop (1920px+)
  - Laptop (1280-1920px)
  - Tablet (768-1280px)
  - Phone (< 768px)
- Landscape/portrait orientation detection
- Touch-friendly button sizing on mobile

---

## 📋 Patch 1.2 — Advanced Features

### Game Modes
- **Timed Mode** — Beat the clock (60s, 5min, unlimited)
- **Daily Challenge** — Same seed daily, compete with others
- **Practice Mode** — No score tracking, unlimited undo

### Statistics & Leaderboard
- Win/loss tracking
- Best times per difficulty
- Average score
- Local high score storage
- (Optional) Cloud leaderboard

### Game Variants
- **Vegas Scoring** — $52 starting bankroll, $5 per card moved
- **Cumulative Scoring** — Score across multiple games
- **Expert Rules** — Stricter move validation

---

## 🐛 Known Issues
- Stock pile clickability: The ↻ cycle symbol is decorative (pointer-events: none). Click the pile background to recycle the deck. Could be improved with hover effect or animation to make it more obvious.

---

## 💡 Community Feedback Drivers
Features will be prioritized based on:
- Player requests in issues/discussions
- Which features players engage with most
- Balance between complexity and usability

*Last updated: 2026-06-26*
