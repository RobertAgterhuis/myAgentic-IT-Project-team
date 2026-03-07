// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect */
const fs = require('fs');
const path = require('path');

/* ── WCAG 2.1 contrast-ratio helpers ─────────────────── */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function linearize(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ── Load tokens ─────────────────────────────────────── */

const tokensPath = path.join(__dirname, '..', 'docs', 'brand', 'design-tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
const light = tokens.color.light;
const dark = tokens.color.dark;

/* ── Text contrast: 4.5:1 minimum (WCAG 1.4.3 AA) ──── */

describe('WCAG AA text contrast (4.5:1)', () => {
  const textPairs = [
    // Light theme — text on backgrounds
    { name: 'light text on bg',          fg: light.text.$value,      bg: light.bg.$value },
    { name: 'light text on surface',     fg: light.text.$value,      bg: light.surface.$value },
    { name: 'light text-sec on bg',      fg: light['text-sec'].$value, bg: light.bg.$value },
    { name: 'light text-sec on surface', fg: light['text-sec'].$value, bg: light.surface.$value },
    { name: 'light text-muted on bg',    fg: light['text-muted'].$value, bg: light.bg.$value },
    { name: 'light text-muted on surface', fg: light['text-muted'].$value, bg: light.surface.$value },
    // Dark theme — text on backgrounds
    { name: 'dark text on bg',           fg: dark.text.$value,       bg: dark.bg.$value },
    { name: 'dark text on surface',      fg: dark.text.$value,       bg: dark.surface.$value },
    { name: 'dark text-sec on bg',       fg: dark['text-sec'].$value, bg: dark.bg.$value },
    { name: 'dark text-sec on surface',  fg: dark['text-sec'].$value, bg: dark.surface.$value },
    { name: 'dark text-muted on bg',     fg: dark['text-muted'].$value, bg: dark.bg.$value },
    { name: 'dark text-muted on surface', fg: dark['text-muted'].$value, bg: dark.surface.$value },
  ];

  for (const { name, fg, bg } of textPairs) {
    it(`${name}: ${fg} on ${bg} ≥ 4.5:1`, () => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
});

/* ── Non-text contrast: 3:1 minimum (WCAG 1.4.11 AA) ── */

describe('WCAG AA non-text contrast (3:1)', () => {
  const uiPairs = [
    // Interactive element borders (border-control) against adjacent backgrounds
    { name: 'light border-control on surface', fg: light['border-control'].$value, bg: light.surface.$value },
    { name: 'light border-control on input-bg', fg: light['border-control'].$value, bg: light['input-bg'].$value },
    { name: 'dark border-control on surface',  fg: dark['border-control'].$value,  bg: dark.surface.$value },
    { name: 'dark border-control on input-bg', fg: dark['border-control'].$value,  bg: dark['input-bg'].$value },
    // Hover state borders
    { name: 'dark border-hover on surface',    fg: dark['border-hover'].$value,    bg: dark.surface.$value },
  ];

  for (const { name, fg, bg } of uiPairs) {
    it(`${name}: ${fg} on ${bg} ≥ 3:1`, () => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  }
});

/* ── Utility self-check ──────────────────────────────── */

describe('contrastRatio utility', () => {
  it('black on white = 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('white on white = 1:1', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
  });

  it('is symmetric', () => {
    const a = contrastRatio('#6366f1', '#ffffff');
    const b = contrastRatio('#ffffff', '#6366f1');
    expect(a).toBeCloseTo(b, 5);
  });
});
