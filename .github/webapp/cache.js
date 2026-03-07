#!/usr/bin/env node
'use strict';

const { getStore } = require('./store');

/* ── File Cache with mtime invalidation (SP-R2-002-004) ──────── *
 * Reduces repeated file reads by caching content and checking
 * filesystem mtime for invalidation. Uses the Store abstraction.
 * ─────────────────────────────────────────────────────────────── */

class FileCache {
  constructor() {
    /** @type {Map<string, {content: string, mtime: number}>} */
    this._entries = new Map();
    this._hits = 0;
    this._misses = 0;
  }

  /**
   * Read a file, returning cached content if mtime is unchanged.
   * @param {string} filePath
   * @param {string} [encoding]
   * @returns {string}
   */
  read(filePath, encoding) {
    const store = getStore();
    const currentMtime = store.mtime(filePath);
    if (currentMtime > 0) {
      const cached = this._entries.get(filePath);
      if (cached && cached.mtime === currentMtime) { this._hits++; return cached.content; }
    }
    this._misses++;
    const content = store.readFile(filePath, encoding);
    if (currentMtime > 0) {
      this._entries.set(filePath, { content, mtime: currentMtime });
    }
    return content;
  }

  /**
   * Read and parse a JSON file, applying an optional validator.
   * @param {string} filePath
   * @param {function} [validator] - (data) => { valid, errors }
   * @returns {{ data: any, errors: string[] | null }}
   */
  readJSON(filePath, validator) {
    const raw = this.read(filePath);
    let data;
    try { data = JSON.parse(raw); }
    catch (e) {
      return { data: null, errors: [`Invalid JSON: ${e.message}`] };
    }
    if (validator) {
      const result = validator(data);
      if (!result.valid) return { data, errors: result.errors };
    }
    return { data, errors: null };
  }

  /** Invalidate a single path (call after writes). */
  invalidate(filePath) {
    this._entries.delete(filePath);
  }

  /** Invalidate all cached entries. */
  invalidateAll() {
    this._entries.clear();
  }

  /** Number of currently cached entries. */
  get size() {
    return this._entries.size;
  }

  /** Return cache hit/miss statistics. */
  stats() {
    return { hits: this._hits, misses: this._misses };
  }
}

module.exports = { FileCache };
