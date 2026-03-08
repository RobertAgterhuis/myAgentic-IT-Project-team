#!/usr/bin/env node
// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';

const path = require('path');
const fs   = require('fs');

/* ── Mutation Audit Trail (SP-R2-007-005 / GR-DATA-004) ───────── *
 * Append-only JSON Lines log of all data mutations.
 * Every create/update/delete operation is recorded with timestamp,
 * entity type, entity ID, operation, user, and summary.
 * File rotation when log exceeds configurable size.
 * ─────────────────────────────────────────────────────────────── */

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const DEFAULT_AUDIT_FILENAME = 'audit-log.jsonl';

class AuditTrail {
  /**
   * @param {object} options
   * @param {string} options.logDir - Directory for audit log files.
   * @param {string} [options.filename] - Log filename (default: audit-log.jsonl).
   * @param {number} [options.maxSizeBytes] - Max file size before rotation.
   */
  constructor({ logDir, filename, maxSizeBytes } = {}) {
    this._logDir = logDir;
    this._filename = filename || DEFAULT_AUDIT_FILENAME;
    this._maxSizeBytes = maxSizeBytes || DEFAULT_MAX_SIZE_BYTES;
  }

  /** @returns {string} Full path to the current audit log. */
  get logPath() {
    return path.join(this._logDir, this._filename);
  }

  /**
   * Ensure the log directory exists.
   * @private
   */
  _ensureDir() {
    if (!fs.existsSync(this._logDir)) {
      fs.mkdirSync(this._logDir, { recursive: true });
    }
  }

  /**
   * Rotate the log file if it exceeds the configured max size.
   * Renames current log to audit-log.<ISO-timestamp>.jsonl.
   * @private
   */
  _rotateIfNeeded() {
    try {
      const stat = fs.statSync(this.logPath);
      if (stat.size >= this._maxSizeBytes) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotated = path.join(
          this._logDir,
          this._filename.replace('.jsonl', `.${stamp}.jsonl`)
        );
        fs.renameSync(this.logPath, rotated);
      }
    } catch {
      // File doesn't exist yet — no rotation needed
    }
  }

  /**
   * Append an audit entry to the log.
   * @param {object} entry
   * @param {string} entry.operation - create | update | delete
   * @param {string} entry.entityType - Type of entity (questionnaire, decision, session, etc.)
   * @param {string} [entry.entityId] - ID of the entity (e.g. Q-05-001, DEC-R2-001)
   * @param {string} [entry.user] - User/agent performing the mutation (default: 'system')
   * @param {string} [entry.summary] - Human-readable summary of the change
   */
  log(entry) {
    this._ensureDir();
    this._rotateIfNeeded();

    const record = {
      timestamp: new Date().toISOString(),
      operation: entry.operation,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      user: entry.user || 'system',
      summary: entry.summary || null,
    };

    fs.appendFileSync(this.logPath, JSON.stringify(record) + '\n', 'utf8');
  }

  /**
   * Read the last N entries from the audit log.
   * @param {number} [limit=50] - Maximum entries to return.
   * @returns {object[]} Array of parsed audit entries (newest last).
   */
  read(limit = 50) {
    if (!fs.existsSync(this.logPath)) return [];
    const content = fs.readFileSync(this.logPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    const entries = [];
    const start = Math.max(0, lines.length - limit);
    for (let i = start; i < lines.length; i++) {
      try { entries.push(JSON.parse(lines[i])); } catch { /* skip malformed */ }
    }
    return entries;
  }

  /**
   * Get the total number of entries in the current log file.
   * @returns {number}
   */
  count() {
    if (!fs.existsSync(this.logPath)) return 0;
    const content = fs.readFileSync(this.logPath, 'utf8');
    return content.trim().split('\n').filter(Boolean).length;
  }
}

module.exports = { AuditTrail, DEFAULT_MAX_SIZE_BYTES, DEFAULT_AUDIT_FILENAME };
