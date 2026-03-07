// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect */
const fs = require('fs');
const path = require('path');

/**
 * Error Prevention UX Tests — Nielsen Heuristic #5 / G-UXD-003
 *
 * Validates:
 *   1. Inline validation CSS classes exist
 *   2. JS validation helper functions exist
 *   3. beforeunload guard is wired up
 *   4. Blur/focusout event listeners attached to forms
 *   5. ARIA attributes for accessibility (aria-invalid, role=alert)
 *   6. All required form fields have inline validation on submission
 */

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

/* ── Extract <style> and <script> blocks ──────────────── */
const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
const css = styleMatch ? styleMatch[1] : '';

const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
const js = scriptMatch ? scriptMatch[1] : '';

/* ═══ 1. CSS validation classes ═══════════════════════ */

describe('Inline validation CSS', () => {
  it('.field-error class with danger border', () => {
    expect(css).toMatch(/\.field-error\s*\{[^}]*border-color:\s*var\(--danger\)/);
  });

  it('.field-error has box-shadow for visual emphasis', () => {
    expect(css).toMatch(/\.field-error\s*\{[^}]*box-shadow:/);
  });

  it('.error-msg class with danger color', () => {
    expect(css).toMatch(/\.error-msg\s*\{[^}]*color:\s*var\(--danger\)/);
  });

  it('.error-msg has warning icon via ::before pseudo-element', () => {
    expect(css).toMatch(/\.error-msg::before\s*\{[^}]*content:/);
  });

  it('@keyframes errorFadeIn animation defined', () => {
    expect(css).toMatch(/@keyframes\s+errorFadeIn/);
  });

  it('.error-msg uses errorFadeIn animation', () => {
    expect(css).toMatch(/\.error-msg\s*\{[^}]*animation:\s*errorFadeIn/);
  });
});

/* ═══ 2. JS validation helper functions ═══════════════ */

describe('Validation helper functions', () => {
  it('setFieldError function is defined', () => {
    expect(js).toMatch(/function setFieldError\s*\(/);
  });

  it('setFieldError adds field-error class', () => {
    expect(js).toMatch(/classList\.add\(\s*['"]field-error['"]\s*\)/);
  });

  it('setFieldError removes field-error class on clear', () => {
    expect(js).toMatch(/classList\.remove\(\s*['"]field-error['"]\s*\)/);
  });

  it('setFieldError sets aria-invalid attribute', () => {
    expect(js).toMatch(/setAttribute\(\s*['"]aria-invalid['"]/);
  });

  it('setFieldError creates error-msg element with role=alert', () => {
    expect(js).toMatch(/setAttribute\(\s*['"]role['"]\s*,\s*['"]alert['"]\s*\)/);
  });

  it('setFieldError sets aria-describedby linking field to error', () => {
    expect(js).toMatch(/setAttribute\(\s*['"]aria-describedby['"]/);
  });

  it('validateRequired function is defined', () => {
    expect(js).toMatch(/function validateRequired\s*\(/);
  });

  it('validateRequired checks trimmed value', () => {
    expect(js).toMatch(/validateRequired[\s\S]*?\.value\.trim\(\)/);
  });

  it('validateAnswerStatus function is defined', () => {
    expect(js).toMatch(/function validateAnswerStatus\s*\(/);
  });

  it('validateAnswerStatus checks ANSWERED + empty pattern', () => {
    expect(js).toMatch(/validateAnswerStatus[\s\S]*?ANSWERED/);
  });
});

/* ═══ 3. beforeunload guard ═══════════════════════════ */

describe('beforeunload unsaved-changes guard', () => {
  it('hasPendingChanges function is defined', () => {
    expect(js).toMatch(/function hasPendingChanges\s*\(/);
  });

  it('hasPendingChanges checks dirty.size', () => {
    expect(js).toMatch(/dirty\.size\s*>\s*0/);
  });

  it('beforeunload event listener is registered', () => {
    expect(js).toMatch(/addEventListener\(\s*['"]beforeunload['"]/);
  });

  it('beforeunload calls e.preventDefault()', () => {
    // The handler should call e.preventDefault() per modern browser spec
    expect(js).toMatch(/beforeunload[\s\S]*?preventDefault/);
  });
});

/* ═══ 4. Blur / focusout event listeners ═════════════ */

describe('Blur validation event listeners', () => {
  it('attachModalValidation sets blur on ndScope', () => {
    expect(js).toMatch(/ndScope[\s\S]*?addEventListener\(\s*['"]blur['"]/);
  });

  it('attachModalValidation sets blur on ndText', () => {
    expect(js).toMatch(/ndText[\s\S]*?addEventListener\(\s*['"]blur['"]/);
  });

  it('attachModalValidation sets blur on edScope', () => {
    expect(js).toMatch(/edScope[\s\S]*?addEventListener\(\s*['"]blur['"]/);
  });

  it('attachModalValidation sets blur on edText', () => {
    expect(js).toMatch(/edText[\s\S]*?addEventListener\(\s*['"]blur['"]/);
  });

  it('delegated focusout on #main for questionnaire textareas', () => {
    expect(js).toMatch(/getElementById\(\s*['"]main['"]\s*\)\.addEventListener\(\s*['"]focusout['"]/);
  });

  it('delegated focusout on #decMain for decision answer textareas', () => {
    expect(js).toMatch(/getElementById\(\s*['"]decMain['"]\s*\)\.addEventListener\(\s*['"]focusout['"]/);
  });

  it('delegated focusout on #cmdMain for command center fields', () => {
    expect(js).toMatch(/getElementById\(\s*['"]cmdMain['"]\s*\)\.addEventListener\(\s*['"]focusout['"]/);
  });

  it('delegated change on #main for status select validation', () => {
    expect(js).toMatch(/getElementById\(\s*['"]main['"]\s*\)\.addEventListener\(\s*['"]change['"]/);
  });
});

/* ═══ 5. Form submission inline validation ═══════════ */

describe('Form submission inline validation', () => {
  it('createDecision is wrapped with validation', () => {
    expect(js).toMatch(/_origCreateDecision\s*=\s*createDecision/);
  });

  it('saveEditDecision is wrapped with validation', () => {
    expect(js).toMatch(/_origSaveEditDecision\s*=\s*saveEditDecision/);
  });

  it('answerDecision uses setFieldError on empty answer', () => {
    expect(js).toMatch(/answerDecision[\s\S]*?setFieldError\(/);
  });

  it('decideDecision uses setFieldError on empty answer', () => {
    expect(js).toMatch(/decideDecision[\s\S]*?setFieldError\(/);
  });

  it('launchCommand uses setFieldError for project field', () => {
    expect(js).toMatch(/launchCommand[\s\S]*?setFieldError\(projEl/);
  });

  it('launchCommand uses setFieldError for description field', () => {
    expect(js).toMatch(/launchCommand[\s\S]*?setFieldError\(descEl/);
  });
});

/* ═══ 6. Visual error indicators (AC #5) ═════════════ */

describe('Visual error indicators', () => {
  it('red border via --danger custom property', () => {
    expect(css).toMatch(/\.field-error[\s\S]*?var\(--danger\)/);
  });

  it('error icon in error-msg (⚠ via CSS content)', () => {
    expect(css).toMatch(/error-msg::before[\s\S]*?content:\s*['"]\\26A0['"]/);
  });

  it('error text element uses role=alert for screen reader announcement', () => {
    expect(js).toMatch(/error-msg[\s\S]*?role[\s\S]*?alert/);
  });
});
