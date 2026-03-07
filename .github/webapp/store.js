#!/usr/bin/env node
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

/* ── FileStore ────────────────────────────────────────────────── */

class FileStore {
  exists(filePath) {
    return fs.existsSync(filePath);
  }

  readFile(filePath, encoding) {
    return fs.readFileSync(filePath, encoding || 'utf8');
  }

  writeFile(filePath, data, encoding) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

/* ── InMemoryStore (for testing) ──────────────────────────────── */

class InMemoryStore {
  constructor(initialFiles) {
    // _files: Map<string, { data: string, mtime: number }>
    this._files = new Map();
    // _dirs: Set<string> — tracks created directories
    this._dirs = new Set();
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
    this._files.set(resolved, { data, mtime: Date.now() });
  }

  readdir(dirPath, options) {
    const resolved = path.resolve(dirPath);
    const entries = [];
    const seen = new Set();

    for (const key of this._files.keys()) {
      if (key.startsWith(resolved + path.sep) || key.startsWith(resolved + '/')) {
        const relative = key.slice(resolved.length + 1);
        const parts = relative.split(/[\\/]/);
        const name = parts[0];
        if (!seen.has(name)) {
          seen.add(name);
          const isDir = parts.length > 1;
          if (options && options.withFileTypes) {
            entries.push({ name, isFile: () => !isDir, isDirectory: () => isDir });
          } else {
            entries.push(name);
          }
        }
      }
    }
    // Also include empty dirs
    for (const dir of this._dirs) {
      if (dir.startsWith(resolved + path.sep) || dir.startsWith(resolved + '/')) {
        const relative = dir.slice(resolved.length + 1);
        const parts = relative.split(/[\\/]/);
        const name = parts[0];
        if (!seen.has(name)) {
          seen.add(name);
          if (options && options.withFileTypes) {
            entries.push({ name, isFile: () => false, isDirectory: () => true });
          } else {
            entries.push(name);
          }
        }
      }
    }
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

function getStore() {
  return _defaultStore;
}

function setStore(store) {
  _defaultStore = store;
}

module.exports = {
  FileStore,
  InMemoryStore,
  getStore,
  setStore,
};
