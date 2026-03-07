#!/usr/bin/env node
'use strict';

/* ── JSON Schema Validation (SP-R2-002-005) ───────────────────── *
 * Lightweight validators for key data structures. Each returns
 * { valid: boolean, errors: string[] }. Zero external deps.
 * ─────────────────────────────────────────────────────────────── */

function str(val, name, errors) {
  if (typeof val !== 'string') { errors.push(`${name} must be a string`); return false; }
  return true;
}
function opt(val, name, type, errors) {
  if (val === undefined || val === null) return true;
  if (typeof val !== type) { errors.push(`${name} must be a ${type} if present`); return false; }
  return true;
}

/* ── Session State ────────────────────────────────────────────── */

function validateSessionState(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['session-state must be an object'] };
  }
  str(data.session_id, 'session_id', errors);
  str(data.cycle_type, 'cycle_type', errors);
  str(data.status, 'status', errors);
  opt(data.current_phase, 'current_phase', 'string', errors);
  opt(data.current_agent, 'current_agent', 'string', errors);
  opt(data.initiated_at, 'initiated_at', 'string', errors);
  opt(data.last_updated, 'last_updated', 'string', errors);
  if (data.completed_phases !== undefined && !Array.isArray(data.completed_phases)) {
    errors.push('completed_phases must be an array');
  }
  if (data.completed_agents !== undefined && !Array.isArray(data.completed_agents)) {
    errors.push('completed_agents must be an array');
  }
  return { valid: errors.length === 0, errors };
}

/* ── Command Queue Entry ──────────────────────────────────────── */

function validateCommandEntry(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['command entry must be an object'] };
  }
  str(data.command, 'command', errors);
  str(data.requested_at, 'requested_at', errors);
  if (!['PENDING', 'PROCESSING', 'DONE', 'ERROR'].includes(data.status)) {
    errors.push('status must be one of: PENDING, PROCESSING, DONE, ERROR');
  }
  opt(data.project, 'project', 'string', errors);
  opt(data.description, 'description', 'string', errors);
  opt(data.scope, 'scope', 'string', errors);
  return { valid: errors.length === 0, errors };
}

function validateCommandQueue(data) {
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['command queue must be an array'] };
  }
  const errors = [];
  for (let i = 0; i < data.length; i++) {
    const r = validateCommandEntry(data[i]);
    if (!r.valid) {
      for (const e of r.errors) errors.push(`[${i}]: ${e}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/* ── Exports ──────────────────────────────────────────────────── */

module.exports = {
  validateSessionState,
  validateCommandEntry,
  validateCommandQueue,
};
