'use strict';
/* global describe, it, expect */
const fs = require('fs');
const path = require('path');

/**
 * Emoji Accessibility Tests — WCAG 1.1.1, 2.5.3, 4.1.2
 *
 * Pattern:
 *   Decorative emojis  → wrapped with aria-hidden="true"
 *   Functional emojis  → parent element has aria-label
 *
 * EMOJI ACCESSIBILITY PATTERN (for future development):
 *   1. If an emoji is decorative (has adjacent text label): wrap in
 *      <span aria-hidden="true">EMOJI</span>
 *   2. If an emoji is the sole content / functional indicator: ensure the
 *      container element has a meaningful aria-label.
 *   3. HTML entity emojis (&#NNNN;) and Unicode emojis follow the same rules.
 *   4. Emojis inside placeholder attributes are exempt (not announced by most
 *      screen readers in placeholders).
 */

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

/* ── Helper: extract all HTML entity emojis &#NNNN; ──── */

function findEmojiEntities(src) {
  const results = [];
  const re = /&#(\d+);/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const code = parseInt(m[1], 10);
    // Only emoji-range code points (skip &nbsp; etc.)
    if (code < 8000) continue;
    const lineNum = src.slice(0, m.index).split(/\r?\n/).length;
    const lineText = src.split(/\r?\n/)[lineNum - 1];
    results.push({ code, lineNum, lineText: lineText.trim(), index: m.index });
  }
  return results;
}

/* ── Helper: check if an emoji is inside a CSS/style block ──── */

function isInStyleBlock(src, index) {
  const before = src.slice(0, index);
  const lastStyleOpen = before.lastIndexOf('<style');
  const lastStyleClose = before.lastIndexOf('</style>');
  return lastStyleOpen > lastStyleClose;
}

/* ── Helper: check if emoji is in a placeholder attribute ──── */

function isInPlaceholder(src, index) {
  const lineStart = src.lastIndexOf('\n', index) + 1;
  const segment = src.slice(lineStart, index);
  return /placeholder="[^"]*$/.test(segment);
}

describe('Emoji Accessibility — WCAG 1.1.1 / 4.1.2', () => {

  const emojis = findEmojiEntities(html).filter(
    e => !isInStyleBlock(html, e.index) && !isInPlaceholder(html, e.index)
  );

  it('finds emoji entities in the HTML', () => {
    expect(emojis.length).toBeGreaterThan(0);
  });

  it('all decorative emojis have aria-hidden="true"', () => {
    const unwrapped = [];
    for (const e of emojis) {
      const before50 = html.slice(Math.max(0, e.index - 80), e.index);
      const hasAriaHidden =
        before50.includes('aria-hidden="true">') ||
        before50.includes("aria-hidden='true'>");
      if (!hasAriaHidden) {
        unwrapped.push(`L${e.lineNum}: &#${e.code}; — ${e.lineText.slice(0, 100)}`);
      }
    }
    expect(unwrapped).toEqual([]);
  });

  it('no duplicate aria-hidden attributes exist', () => {
    const dupes = (html.match(/aria-hidden="true"\s+aria-hidden="true"/g) || []);
    expect(dupes.length).toBe(0);
  });

  describe('Static HTML elements', () => {
    it('header logo has aria-hidden', () => {
      expect(html).toContain('class="header-logo" aria-hidden="true"');
    });

    it('cmd-btn-icon spans have aria-hidden', () => {
      const icons = html.match(/class="cmd-btn-icon"/g) || [];
      const iconsWith = html.match(/class="cmd-btn-icon" aria-hidden="true"/g) || [];
      expect(icons.length).toBe(iconsWith.length);
      expect(icons.length).toBeGreaterThan(0);
    });

    it('pipe-empty-icon has aria-hidden', () => {
      expect(html).toContain('class="pipe-empty-icon" aria-hidden="true"');
    });

    it('tab emojis are wrapped with aria-hidden', () => {
      // All 3 tabs (one has class="tab active")
      const tabLines = html.split(/\r?\n/).filter(l =>
        /class="tab[\s"]/.test(l) && l.includes('aria-hidden="true"')
      );
      expect(tabLines.length).toBeGreaterThanOrEqual(3);
    });

    it('modal heading emojis are wrapped', () => {
      expect(html).toContain('id="reevalTitle"><span aria-hidden="true">');
      expect(html).toContain('id="newDecTitle"><span aria-hidden="true">');
      expect(html).toContain('id="editDecTitle"><span aria-hidden="true">');
    });

    it('modal button emojis are wrapped', () => {
      expect(html).toContain('id="btnConfirmReeval"><span aria-hidden="true">');
      expect(html).toContain('id="btnConfirmNewDec"><span aria-hidden="true">');
      expect(html).toContain('id="btnConfirmEditDec"><span aria-hidden="true">');
    });
  });

  describe('Functional elements with aria-label', () => {
    it('theme toggle button has aria-label', () => {
      expect(html).toMatch(/id="btnTheme"[^>]*aria-label=/);
    });

    it('hamburger button has aria-label', () => {
      expect(html).toMatch(/id="btnHamburger"[^>]*aria-label=/);
    });

    it('export button has aria-label', () => {
      expect(html).toMatch(/id="btnExport"[^>]*aria-label=/);
    });
  });

  describe('JS template literal emojis', () => {
    it('PHASE_ICONS values are wrapped with aria-hidden', () => {
      const match = html.match(/const PHASE_ICONS\s*=\s*\{([^}]+)\}/);
      expect(match).toBeTruthy();
      const body = match[1];
      const values = body.match(/'[^']+'/g) || [];
      // Filter only values (every other match after key)
      const iconValues = values.filter((_, i) => i % 2 === 1);
      for (const v of iconValues) {
        expect(v).toContain('aria-hidden="true"');
      }
    });

    it('renderHelpNav wraps icon with aria-hidden', () => {
      expect(html).toContain('<span aria-hidden="true">${t.icon}</span>');
    });

    it('updateThemeIcon wraps emojis with aria-hidden', () => {
      const fn = html.match(/function updateThemeIcon[\s\S]{0,300}/);
      expect(fn).toBeTruthy();
      expect(fn[0]).toContain('aria-hidden="true"');
    });

    it('fallback phase icon is wrapped', () => {
      expect(html).toContain("|| '<span aria-hidden=\"true\">&#128196;</span>'");
    });
  });
});
