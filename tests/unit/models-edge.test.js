'use strict';
/* Unit test example: model layer pure-function testing.
 * Pattern: test domain logic (parsing, transformation) in isolation.
 * Demonstrates testing markdown parsing and decision management. */

const path = require('path');
const {
  parseQuestionnaire,
  parseDecisions,
  nextDecisionId,
  today,
  Q_ID_RE,
  DEC_ID_RE,
} = require('../../.github/webapp/models');

describe('parseQuestionnaire — edge cases', () => {
  it('ignores Q-IDs that are not in a question block', () => {
    const md = '# Title\nSome prose mentioning Q-99-001 but not a question.\n';
    const result = parseQuestionnaire(md, '/fake/file.md', '/fake');
    expect(result.questions.length).toBe(0);
  });

  it('handles empty markdown', () => {
    const result = parseQuestionnaire('', '/fake/file.md', '/fake');
    expect(result.questions).toEqual([]);
  });
});

describe('nextDecisionId', () => {
  it('increments the highest existing DEC-ID', () => {
    const md = [
      '| DEC-R2-001 | Something | DECIDED |',
      '| DEC-R2-003 | Another | DECIDED |',
    ].join('\n');
    const next = nextDecisionId(md, 'DEC-R2-');
    expect(next).toBe('DEC-R2-004');
  });

  it('starts at 001 when no decisions exist', () => {
    expect(nextDecisionId('', 'DEC-R2-')).toBe('DEC-R2-001');
  });
});

describe('regex patterns', () => {
  it('Q_ID_RE matches valid Q-IDs', () => {
    expect(Q_ID_RE.test('Q-10-001')).toBe(true);
    expect(Q_ID_RE.test('Q-33-012')).toBe(true);
  });

  it('Q_ID_RE rejects non-Q-ID strings', () => {
    expect(Q_ID_RE.test('DEC-R2-001')).toBe(false);
    expect(Q_ID_RE.test('Q-10-001-extra')).toBe(false);
  });

  it('DEC_ID_RE matches valid DEC-IDs', () => {
    expect(DEC_ID_RE.test('DEC-R2-001')).toBe(true);
    expect(DEC_ID_RE.test('DEC-R2-099')).toBe(true);
  });
});
