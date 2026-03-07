'use strict';
/* global describe, it, expect */
const {
  validateSessionState,
  validateCommandEntry,
  validateCommandQueue,
} = require('./schemas');

/* ── Story #17: JSON schema validation (SP-R2-002-005) ──────── */

describe('validateSessionState', () => {
  const valid = {
    session_id: 'sess-001',
    cycle_type: 'CREATE',
    status: 'IN_PROGRESS',
    current_phase: 'Phase 2',
    completed_phases: ['Phase 1'],
    completed_agents: ['BA'],
  };

  it('accepts a valid session state', () => {
    const r = validateSessionState(valid);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it('rejects non-object input', () => {
    expect(validateSessionState(null).valid).toBe(false);
    expect(validateSessionState('str').valid).toBe(false);
    expect(validateSessionState([]).valid).toBe(false);
  });

  it('requires session_id, cycle_type, status', () => {
    const r = validateSessionState({});
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('session_id must be a string');
    expect(r.errors).toContain('cycle_type must be a string');
    expect(r.errors).toContain('status must be a string');
  });

  it('validates optional fields type', () => {
    const r = validateSessionState({ ...valid, current_phase: 123 });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('current_phase must be a string if present');
  });

  it('validates completed_phases is array', () => {
    const r = validateSessionState({ ...valid, completed_phases: 'not-array' });
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('completed_phases must be an array');
  });
});

describe('validateCommandEntry', () => {
  const valid = {
    command: 'CREATE TECH',
    requested_at: '2026-03-07T10:00:00Z',
    status: 'PENDING',
  };

  it('accepts a valid command entry', () => {
    const r = validateCommandEntry(valid);
    expect(r.valid).toBe(true);
  });

  it('rejects invalid status', () => {
    const r = validateCommandEntry({ ...valid, status: 'UNKNOWN' });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/status must be one of/);
  });

  it('requires command and requested_at', () => {
    const r = validateCommandEntry({});
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('command must be a string');
    expect(r.errors).toContain('requested_at must be a string');
  });
});

describe('validateCommandQueue', () => {
  it('accepts a valid array', () => {
    const r = validateCommandQueue([
      { command: 'CREATE', requested_at: '2026-01-01T00:00:00Z', status: 'DONE' },
    ]);
    expect(r.valid).toBe(true);
  });

  it('rejects non-array', () => {
    const r = validateCommandQueue({});
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/must be an array/);
  });

  it('reports per-entry errors with index', () => {
    const r = validateCommandQueue([{ command: 'X', requested_at: 'now', status: 'BAD' }]);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/^\[0\]/);
  });
});
