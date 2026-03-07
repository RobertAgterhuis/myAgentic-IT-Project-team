// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect */
const models = require('./models');

/* ── Story #14: Domain model extraction (SP-R2-002-003) ──────── */

/* ── Shared utilities ─────────────────────────────────────────── */

describe('escRx', () => {
  it('escapes regex special characters', () => {
    expect(models.escRx('a.b+c')).toBe('a\\.b\\+c');
  });
});

describe('Q_ID_RE / DEC_ID_RE', () => {
  it('matches valid Q-IDs', () => {
    expect(models.Q_ID_RE.test('Q-1-1')).toBe(true);
    expect(models.Q_ID_RE.test('Q-99-1234')).toBe(true);
    expect(models.Q_ID_RE.test('Q-1-12345')).toBe(false);
  });

  it('matches valid DEC-IDs', () => {
    expect(models.DEC_ID_RE.test('DEC-R2-001')).toBe(true);
    expect(models.DEC_ID_RE.test('DEC-T-005')).toBe(true);
    expect(models.DEC_ID_RE.test('BAD')).toBe(false);
  });
});

/* ── Questionnaire parsing ─────────────────────────────────────── */

describe('parseQuestionnaire', () => {
  const sample = [
    '# Questionnaire: Software Architect',
    '> Phase: Phase 2 | Generated: 2026-03-01 | Version: 1.0',
    '',
    '## Section 1: Architecture',
    '',
    '### Q-5-1 [REQUIRED]',
    '**Question:** What is the target platform?',
    '**Why we need this:** To choose runtime',
    '**Expected format:** Free text',
    '**Example:** Node.js on Linux',
    '**Your answer:**',
    '> Localhost Node.js',
    '',
    '---',
    '',
    '## Answer Status',
    '| Q-ID | Status | Last Updated |',
    '|------|--------|-------------|',
    '| Q-5-1 | ANSWERED | 2026-03-02 |',
  ].join('\n');

  it('extracts agent, phase, version', () => {
    const q = models.parseQuestionnaire(sample, '/docs/q.md', '/docs');
    expect(q.agent).toBe('Software Architect');
    expect(q.phase).toBe('Phase 2');
    expect(q.version).toBe('1.0');
  });

  it('parses questions with answers and status', () => {
    const q = models.parseQuestionnaire(sample, '/docs/q.md', '/docs');
    expect(q.questions).toHaveLength(1);
    expect(q.questions[0].id).toBe('Q-5-1');
    expect(q.questions[0].classification).toBe('REQUIRED');
    expect(q.questions[0].question).toBe('What is the target platform?');
    expect(q.questions[0].answer).toBe('Localhost Node.js');
    expect(q.questions[0].status).toBe('ANSWERED');
  });

  it('sets relative file path', () => {
    const q = models.parseQuestionnaire(sample, '/docs/sub/q.md', '/docs');
    expect(q.file).toBe('sub/q.md');
  });
});

/* ── updateAnswerInContent ─────────────────────────────────────── */

describe('updateAnswerInContent', () => {
  const content = [
    '### Q-5-1 [REQUIRED]',
    '**Question:** Something?',
    '**Your answer:**',
    '> *(fill in here)*',
    '',
    '---',
    '',
    '## Answer Status',
    '| Q-ID | Status | Last Updated |',
    '|------|--------|-------------|',
    '| Q-5-1 | OPEN | |',
  ].join('\n');

  it('replaces placeholder with answer', () => {
    const updated = models.updateAnswerInContent(content, 'Q-5-1', 'My answer', 'ANSWERED');
    expect(updated).toContain('> My answer');
    expect(updated).not.toContain('fill in here');
  });

  it('updates status row', () => {
    const updated = models.updateAnswerInContent(content, 'Q-5-1', 'My answer', 'ANSWERED');
    expect(updated).toContain('| Q-5-1 | ANSWERED |');
  });
});

/* ── Decision parsing ──────────────────────────────────────────── */

describe('parseDecisions', () => {
  const decContent = [
    '## Open Questions',
    '',
    '| ID | Priority | Scope | Question | Answer | Date |',
    '|-----|----------|-------|----------|--------|------|',
    '| DEC-OPEN-001 | HIGH | Tech | Should we use Redis? | | 2026-03-01 |',
    '',
    '---',
    '',
    '### Operational Decisions',
    '',
    '| ID | Priority | Scope | Decision | Notes | Date |',
    '|-----|----------|-------|----------|-------|------|',
    '| DEC-001 | MEDIUM | Infra | Use localhost only | Per DEC-R2-001 | 2026-03-01 |',
    '',
    '---',
    '',
    '## Deferred & Expired',
    '',
    '| ID | Status | Scope | Subject | Reason | Date |',
    '|-----|--------|-------|---------|--------|------|',
    '| DEC-DEF-001 | DEFERRED | UX | Color scheme | Pending brand | 2026-03-01 |',
  ].join('\n');

  it('parses open questions', () => {
    const { open } = models.parseDecisions(decContent);
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe('DEC-OPEN-001');
    expect(open[0].priority).toBe('HIGH');
  });

  it('parses operational decisions', () => {
    const { decided } = models.parseDecisions(decContent);
    expect(decided).toHaveLength(1);
    expect(decided[0].id).toBe('DEC-001');
    expect(decided[0].decision).toBe('Use localhost only');
  });

  it('parses deferred items', () => {
    const { deferred } = models.parseDecisions(decContent);
    expect(deferred).toHaveLength(1);
    expect(deferred[0].id).toBe('DEC-DEF-001');
    expect(deferred[0].status).toBe('DEFERRED');
  });

  it('returns empty arrays for empty content', () => {
    const r = models.parseDecisions('');
    expect(r).toEqual({ open: [], decided: [], deferred: [] });
  });
});

/* ── Decision mutation functions ───────────────────────────────── */

describe('nextDecisionId', () => {
  it('generates next sequential ID', () => {
    const content = '| DEC-001 | ... |\n| DEC-003 | ... |';
    expect(models.nextDecisionId(content, 'DEC-')).toBe('DEC-004');
  });

  it('starts at 001 when no IDs exist', () => {
    expect(models.nextDecisionId('no ids here', 'DEC-')).toBe('DEC-001');
  });
});

describe('addOpenQuestion', () => {
  const base = [
    '## Open Questions',
    '',
    '| ID | Priority | Scope | Question | Answer | Date |',
    '|-----|----------|-------|----------|--------|------|',
    '| | | | *(No open questions)* | | |',
    '',
    '---',
  ].join('\n');

  it('replaces placeholder with new question', () => {
    const result = models.addOpenQuestion(base, {
      id: 'DEC-NEW-001', priority: 'HIGH', scope: 'Tech',
      question: 'New Q?', answer: '', date: '2026-03-07',
    });
    expect(result).toContain('DEC-NEW-001');
    expect(result).toContain('New Q?');
    expect(result).not.toContain('No open questions');
  });
});

describe('appendAuditTrail', () => {
  it('adds entry to existing Change Log', () => {
    const content = '## Change Log\n\n- old entry\n';
    const result = models.appendAuditTrail(content, 'ADD_OPEN', 'DEC-001');
    expect(result).toContain('`ADD_OPEN`');
    expect(result).toContain('`DEC-001`');
    expect(result).toContain('source: webapp');
  });

  it('creates Change Log section when missing', () => {
    const result = models.appendAuditTrail('some content', 'MOVE', 'DEC-002');
    expect(result).toContain('## Change Log');
    expect(result).toContain('`MOVE`');
  });
});

describe('parseSessionState', () => {
  it('parses valid JSON', () => {
    const r = models.parseSessionState('{"session_id":"s1"}');
    expect(r).toEqual({ session_id: 's1' });
  });

  it('returns null for invalid JSON', () => {
    expect(models.parseSessionState('{bad')).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(models.parseSessionState('')).toBeNull();
    expect(models.parseSessionState(null)).toBeNull();
  });
});
