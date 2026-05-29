const fs = require('fs');

let content = fs.readFileSync('tests/digger.spec.ts', 'utf8');

// Remove redundant await page.goto(GAME_URL); lines from "Around the World Digger" describe block
// But keep them for Movement tests which have their own beforeEach
const lines = content.split('\n');
const result = [];
let inFirstDescribe = true;
let inMovementDescribe = false;
let bracketDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track when we enter Movement describe
  if (line.includes("test.describe('Digger - Movement'")) {
    inMovementDescribe = true;
    inFirstDescribe = false;
  }
  
  // Skip redundant goto in first describe block (before Movement)
  if (inFirstDescribe && !inMovementDescribe && line.trim() === 'await page.goto(GAME_URL);') {
    // Check if the next non-empty line starts with actual test code, not just whitespace
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j < lines.length && !lines[j].includes('//') && !lines[j].includes('const') ) {
      result.push('    // Already navigated in beforeEach');
      continue;
    }
  }
  
  result.push(line);
}

fs.writeFileSync('tests/digger.spec.ts', result.join('\n'), 'utf8');
console.log('Fixed digger.spec.ts');
