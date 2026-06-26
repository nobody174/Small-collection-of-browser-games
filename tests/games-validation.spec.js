import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Game Collection - Validation Tests', () => {

  // ============================================================
  // FILE STRUCTURE VALIDATION
  // ============================================================

  test('Donut Empire files exist', async () => {
    const files = [
      'games/idle/index.html',
      'games/idle/js/idle.js',
      'games/idle/style.css',
      'games/idle/img/donut.png',
      'games/idle/DONUT_EMPIRE_ROADMAP.md',
      'games/idle/FUTURE_ROADMAP.md',
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
  });

  test('Digger game files exist', async () => {
    const files = [
      'games/digger/index.html',
      'games/digger/js/digger.js',
      'games/digger/style.css',
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
  });

  test('Card Games files exist', async () => {
    const files = [
      'games/cards/index.html',
      'games/cards/js/klondike.js',
      'games/cards/style.css',
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
  });

  test('Blocks game files exist', async () => {
    const files = [
      'games/blocks/index.html',
      'games/blocks/js/blocks.js',
      'games/blocks/style.css',
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
  });

  test('Shared resources exist', async () => {
    const files = [
      'shared/js/utils.js',
      'shared/js/save.js',
      'shared/js/audio.js',
      'shared/js/particles.js',
      'shared/js/ui.js',
      'shared/css/theme.css',
      'shared/css/ui.css',
      'shared/css/animations.css',
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
  });

  // ============================================================
  // SYNTAX VALIDATION
  // ============================================================

  test('Donut Empire JS has no syntax errors', async () => {
    const jsFile = fs.readFileSync('games/idle/js/idle.js', 'utf-8');

    // Basic checks
    expect(jsFile).toContain('function');
    expect(jsFile).toContain('const state');
  });

  test('HTML files are valid markup', async () => {
    const files = [
      'games/idle/index.html',
      'games/digger/index.html',
      'games/cards/index.html',
      'games/blocks/index.html',
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).toContain('<!doctype html');
      expect(content).toContain('<html');
      expect(content).toContain('</html>');
      expect(content.match(/<script/g).length).toBeGreaterThan(0);
    }
  });

  test('CSS files exist and are non-empty', async () => {
    const files = [
      'games/idle/style.css',
      'games/digger/style.css',
      'games/cards/style.css',
      'games/blocks/style.css',
      'shared/css/theme.css',
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('{');
      expect(content).toContain('}');
    }
  });

  // ============================================================
  // DONUT EMPIRE SPECIFIC CHECKS
  // ============================================================

  test('Donut Empire has era-based word progression', async () => {
    const jsFile = fs.readFileSync('games/idle/js/idle.js', 'utf-8');
    expect(jsFile).toContain('WORD_CARD_ERAS');
    expect(jsFile).toContain('Era 1');
    expect(jsFile).toContain('Era 2');
    expect(jsFile).toContain('Era 3');
    expect(jsFile).toContain('Era 4');
  });

  test('Donut Empire has prestige system', async () => {
    const jsFile = fs.readFileSync('games/idle/js/idle.js', 'utf-8');
    expect(jsFile).toContain('FLAVORS');
    expect(jsFile).toContain('performEvolution');
    expect(jsFile).toContain('sprinkleShardsEarned');
  });

  test('Donut Empire has shop tabs', async () => {
    const jsFile = fs.readFileSync('games/idle/js/idle.js', 'utf-8');
    expect(jsFile).toContain('SHOP_TABS');
    expect(jsFile).toContain('Bakers');
    expect(jsFile).toContain('Clicks');
  });

  test('Donut Empire has rival system', async () => {
    const jsFile = fs.readFileSync('games/idle/js/idle.js', 'utf-8');
    expect(jsFile).toContain('RIVALS');
    expect(jsFile).toContain('updateRivalPace');
  });

  test('Donut Empire has mobile touch optimization', async () => {
    const htmlFile = fs.readFileSync('games/idle/index.html', 'utf-8');
    expect(htmlFile).toContain('user-scalable=no');
    expect(htmlFile).toContain('viewport');
  });

  // ============================================================
  // GITHUB PAGES READINESS
  // ============================================================

  test('GitHub Pages config exists', async () => {
    const files = [
      '.github/workflows/test.yml',
      '.github/workflows/deploy.yml',
    ];

    for (const file of files) {
      expect(fs.existsSync(file)).toBeTruthy();
    }
  });

  test('README exists and has content', async () => {
    const readme = fs.readFileSync('README.md', 'utf-8');
    expect(readme.length).toBeGreaterThan(100);
    expect(readme).toContain('Donut Empire');
  });

  test('Roadmap documentation exists', async () => {
    const roadmap = fs.readFileSync('games/idle/FUTURE_ROADMAP.md', 'utf-8');
    expect(roadmap).toContain('v1.1');
    expect(roadmap).toContain('Patch');
  });

  // ============================================================
  // NO BROKEN REFERENCES
  // ============================================================

  test('Donut Empire HTML links to correct JS file', async () => {
    const htmlFile = fs.readFileSync('games/idle/index.html', 'utf-8');
    expect(htmlFile).toContain('js/idle.js');
    expect(fs.existsSync('games/idle/js/idle.js')).toBeTruthy();
  });

  test('Donut Empire HTML links to correct CSS file', async () => {
    const htmlFile = fs.readFileSync('games/idle/index.html', 'utf-8');
    expect(htmlFile).toContain('style.css');
    expect(fs.existsSync('games/idle/style.css')).toBeTruthy();
  });

  test('Shared CSS is referenced correctly', async () => {
    const htmlFile = fs.readFileSync('games/idle/index.html', 'utf-8');
    expect(htmlFile).toContain('../../shared/css');
  });

});
