#!/usr/bin/env node
// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';

const fs   = require('fs');
const path = require('path');

/* ── Store Interface (SP-R2-002-001) ──────────────────────────── *
 * Defines the contract for all data access. FileStore is the
 * default implementation; InMemoryStore is provided for testing.
 * DEC-R2-006: file-based storage only — abstraction for testability.
 * ─────────────────────────────────────────────────────────────── */

/**
 * @typedef {Object} Store
 * @property {(filePath: string) => boolean} exists
 * @property {(filePath: string, encoding?: string) => string} readFile
 * @property {(filePath: string, data: string, encoding?: string) => void} writeFile
 * @property {(dirPath: string, options?: object) => fs.Dirent[]} readdir
 * @property {(dirPath: string) => void} mkdirp
 * @property {(filePath: string) => fs.Stats} stat
 * @property {(filePath: string) => number} mtime — returns ms-since-epoch
 */

/* ── Backup constants (SP-R2-006-006) ─────────────────────────── */

const BACKUPS_DIR_NAME = '.backups';
const MAX_BACKUPS_PER_FILE = 10;

/* ── FileStore ────────────────────────────────────────────────── */

class FileStore {
  exists(filePath) {
    return fs.existsSync(filePath);
  }

  readFile(filePath, encoding) {
    return fs.readFileSync(filePath, encoding || 'utf8');
  }

  /**
   * Snapshot-on-write: before overwriting, copy the previous version to
   * `.backups/<basename>/<timestamp>`. Retains the last MAX_BACKUPS_PER_FILE
   * snapshots per file (oldest pruned). Complies with G-OPS-AUDIT-03.
   */
  _createBackup(filePath) {
    if (!fs.existsSync(filePath)) return;
    const dir    = path.dirname(filePath);
    const base   = path.basename(filePath);
    const bkDir  = path.join(dir, BACKUPS_DIR_NAME, base);
    if (!fs.existsSync(bkDir)) fs.mkdirSync(bkDir, { recursive: true });

    const stamp  = new Date().toISOString().replace(/[:.]/g, '-');
    const bkPath = path.join(bkDir, stamp);
    fs.copyFileSync(filePath, bkPath);

    // Prune oldest beyond limit
    const files = fs.readdirSync(bkDir).sort();
    while (files.length > MAX_BACKUPS_PER_FILE) {
      const oldest = files.shift();
      try { fs.unlinkSync(path.join(bkDir, oldest)); } catch {}
    }
  }

  writeFile(filePath, data, encoding) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // SP-R2-006-006: backup previous version before overwrite
    this._createBackup(filePath);
    // Atomic write: temp-file-then-rename (IMPL-CONSTRAINT-007)
    const tmpPath = filePath + '.tmp.' + process.pid + '.' + Date.now();
    try {
      fs.writeFileSync(tmpPath, data, encoding || 'utf8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      // Clean up temp file on failure
      try { fs.unlinkSync(tmpPath); } catch {}
      throw Object.assign(
        new Error(`File write failed (${path.basename(filePath)}): ${err.message}`),
        { status: 500 }
      );
    }
  }

  readdir(dirPath, options) {
    return fs.readdirSync(dirPath, options);
  }

  mkdirp(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }

  stat(filePath) {
    return fs.statSync(filePath);
  }

  mtime(filePath) {
    try {
      return fs.statSync(filePath).mtimeMs;
    } catch {
      return 0;
    }
  }
}

/* ── InMemoryStore helpers ─────────────────────────────────────── */

function collectDirEntries(keys, resolved, seen, entries, options, isDirFn) {
  const prefix1 = resolved + path.sep;
  const prefix2 = resolved + '/';
  for (const key of keys) {
    if (key.startsWith(prefix1) || key.startsWith(prefix2)) {
      const name = key.slice(resolved.length + 1).split(/[\\/]/)[0];
      if (!seen.has(name)) {
        seen.add(name);
        const isDir = isDirFn(key, resolved);
        if (options && options.withFileTypes) {
          entries.push({ name, isFile: () => !isDir, isDirectory: () => isDir });
        } else {
          entries.push(name);
        }
      }
    }
  }
}

/* ── InMemoryStore (for testing) ──────────────────────────────── */

class InMemoryStore {
  constructor(initialFiles) {
    // _files: Map<string, { data: string, mtime: number }>
    this._files = new Map();
    // _dirs: Set<string> — tracks created directories
    this._dirs = new Set();
    // _backups: Map<string, Array<{ timestamp: string, data: string }>>
    this._backups = new Map();
    if (initialFiles) {
      for (const [filePath, data] of Object.entries(initialFiles)) {
        this._files.set(path.resolve(filePath), { data, mtime: Date.now() });
        this._ensureParentDirs(filePath);
      }
    }
  }

  _ensureParentDirs(filePath) {
    let dir = path.dirname(path.resolve(filePath));
    while (dir && dir !== path.dirname(dir)) {
      this._dirs.add(dir);
      dir = path.dirname(dir);
    }
  }

  exists(filePath) {
    const resolved = path.resolve(filePath);
    return this._files.has(resolved) || this._dirs.has(resolved);
  }

  readFile(filePath, _encoding) {
    const resolved = path.resolve(filePath);
    const entry = this._files.get(resolved);
    if (!entry) {
      const err = new Error(`ENOENT: no such file: ${filePath}`);
      err.code = 'ENOENT';
      throw err;
    }
    return entry.data;
  }

  writeFile(filePath, data, _encoding) {
    const resolved = path.resolve(filePath);
    this._ensureParentDirs(filePath);
    // SP-R2-006-006: snapshot-on-write backup (mirrors FileStore)
    const existing = this._files.get(resolved);
    if (existing) {
      const bkList = this._backups.get(resolved) || [];
      bkList.push({ timestamp: new Date().toISOString(), data: existing.data });
      while (bkList.length > MAX_BACKUPS_PER_FILE) bkList.shift();
      this._backups.set(resolved, bkList);
    }
    this._files.set(resolved, { data, mtime: Date.now() });
  }

  readdir(dirPath, options) {
    const resolved = path.resolve(dirPath);
    const entries = [];
    const seen = new Set();
    collectDirEntries(this._files.keys(), resolved, seen, entries, options,
      (key, res) => key.slice(res.length + 1).split(/[\\/]/).length > 1);
    collectDirEntries(this._dirs, resolved, seen, entries, options, () => true);
    return entries;
  }

  mkdirp(dirPath) {
    let dir = path.resolve(dirPath);
    while (dir && dir !== path.dirname(dir)) {
      this._dirs.add(dir);
      dir = path.dirname(dir);
    }
  }

  stat(filePath) {
    const resolved = path.resolve(filePath);
    const entry = this._files.get(resolved);
    if (entry) {
      return { mtimeMs: entry.mtime, isFile: () => true, isDirectory: () => false };
    }
    if (this._dirs.has(resolved)) {
      return { mtimeMs: Date.now(), isFile: () => false, isDirectory: () => true };
    }
    const err = new Error(`ENOENT: no such file: ${filePath}`);
    err.code = 'ENOENT';
    throw err;
  }

  mtime(filePath) {
    const resolved = path.resolve(filePath);
    const entry = this._files.get(resolved);
    return entry ? entry.mtime : 0;
  }
}

/* ── Singleton + injection ────────────────────────────────────── */

let _defaultStore = new FileStore();

/**
 * Return the active Store singleton.
 * @returns {FileStore|InMemoryStore}
 */
function getStore() {
  return _defaultStore;
}

/**
 * Replace the active Store singleton (used for test injection).
 * @param {FileStore|InMemoryStore} store
 */
function setStore(store) {
  _defaultStore = store;
}

module.exports = {
  FileStore,
  InMemoryStore,
  getStore,
  setStore,
  BACKUPS_DIR_NAME,
  MAX_BACKUPS_PER_FILE,
};
