'use strict';
/* Unit test example: isolated pure-function testing.
 * Pattern: test pure functions with no external dependencies.
 * These tests validate content sanitization edge cases beyond
 * what the co-located server.test.js covers. */

const { sanitizeMarkdown, sanitizeQID } = require('../../.github/webapp/server');

describe('sanitizeMarkdown — edge cases', () => {
  it('handles multi-line content with mixed markdown syntax', () => {
    const input = '# Title\nSome text\n| table |\n---\n### Sub';
    const result = sanitizeMarkdown(input);
    expect(result).not.toMatch(/^#\s/m);
    expect(result).not.toMatch(/^\|/m);
    expect(result).toContain('\\#');
    expect(result).toContain('\\|');
    expect(result).toContain('\\---');
  });

  it('preserves inline content that looks like markdown', () => {
    const input = 'Use option #1 in the menu';
    const result = sanitizeMarkdown(input);
    expect(result).toBe('Use option #1 in the menu');
  });

  it('handles empty string', () => {
    expect(sanitizeMarkdown('')).toBe('');
  });
});

describe('sanitizeQID — edge cases', () => {
  it('neutralizes multiple Q-IDs in same string', () => {
    const input = 'See Q-10-001 and Q-33-004';
    const result = sanitizeQID(input);
    expect(result).not.toContain('Q-10-001');
    expect(result).not.toContain('Q-33-004');
  });

  it('handles empty string', () => {
    expect(sanitizeQID('')).toBe('');
  });
});
