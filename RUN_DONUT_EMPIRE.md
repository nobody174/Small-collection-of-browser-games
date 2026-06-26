# 🍩 How to Run Donut Empire

## Quick Start (Recommended)

### Option 1: Double-Click (Easiest)

1. Navigate to: `D:\Claude AI Projects\projects\GitHub\Small Collection of browser games\`
2. **Double-click** `start-server.bat`
3. A console window will open with:
   ```
   🍩 Donut Empire Server Running
   📍 URL: http://localhost:8080/games/idle/index.html
   ```
4. **Copy the URL** and paste it into your browser address bar
5. Press Enter to load the game

### Option 2: Command Line

1. Open PowerShell or Command Prompt
2. Navigate to the game folder:
   ```bash
   cd "D:\Claude AI Projects\projects\GitHub\Small Collection of browser games"
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. You'll see:
   ```
   📍 URL: http://localhost:8080/games/idle/index.html
   ```
5. Open that URL in your browser

### Option 3: Python (if Node.js isn't installed)

1. Open PowerShell or Command Prompt
2. Navigate to the game folder:
   ```bash
   cd "D:\Claude AI Projects\projects\GitHub\Small Collection of browser games\games\idle"
   ```
3. Start a Python server:
   ```bash
   python -m http.server 8000
   ```
4. Open this URL in your browser:
   ```
   http://localhost:8000/index.html
   ```

---

## Why You Need a Server

The game won't work when opened directly as a file (`file://`) because:
- Relative paths to shared JavaScript files won't load
- Browser security restrictions block local file access

**The server provides proper HTTP delivery of all files.**

---

## Troubleshooting

### Port Already in Use

If you see: `Error: listen EADDRINUSE: address already in use :::8080`

**Solution:** Kill the existing process:
```bash
# PowerShell
Get-Process -Name node | Stop-Process
```

Then try again.

### Server won't start

**Make sure you're in the correct directory:**
```bash
# Should see: server.js, games/, shared/, etc.
dir
```

If Node.js isn't installed, use Python Option 3 above.

### Still nothing happens when clicking the donut

1. **Open DevTools (F12)** in your browser
2. Go to the **Console** tab
3. Look for red error messages
4. Share those error messages for debugging

---

## Testing the Game

Once loaded, follow `TESTING_CHECKLIST.md` for comprehensive testing:

**Quick smoke test:**
1. Click the donut 10+ times → Should see word-cards like "POP!", "GLAZE!"
2. Click rapidly 5+ times in 1 second → "SUGAR RUSH!" should appear with donut glow
3. Let it run a bit, then click "Evolve" button → Should show a modal
4. Click on different tabs (Bakers, Clicks, etc.) → Tabs should switch
5. Open "Collection" button → DNA gallery should appear

---

## Where to Go From Here

- **Full testing guide:** See `TESTING_CHECKLIST.md` (100+ test cases)
- **What changed:** See `IMPLEMENTATION_SUMMARY.md`
- **Design details:** See `DONUT_EMPIRE_ROADMAP.md`
- **Test results:** See `TEST_RESULTS.md`

---

**Questions?** Check the browser console (F12 → Console tab) for error messages.
