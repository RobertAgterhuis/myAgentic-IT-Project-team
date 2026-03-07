// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect, beforeEach */
const path = require('path');
const { InMemoryStore, getStore, setStore } = require('./store');

/* ── Story #12: Store interface (SP-R2-002-001) ─────────────── */

describe('InMemoryStore', () => {
  let store;
  beforeEach(() => { store = new InMemoryStore(); });

  describe('exists / readFile / writeFile', () => {
    it('returns false for non-existent file', () => {
      expect(store.exists('/tmp/no-such-file.txt')).toBe(false);
    });

    it('writes and reads a file', () => {
      store.writeFile('/tmp/test.txt', 'hello');
      expect(store.exists('/tmp/test.txt')).toBe(true);
      expect(store.readFile('/tmp/test.txt')).toBe('hello');
    });

    it('overwrites existing file', () => {
      store.writeFile('/tmp/test.txt', 'v1');
      store.writeFile('/tmp/test.txt', 'v2');
      expect(store.readFile('/tmp/test.txt')).toBe('v2');
    });

    it('throws ENOENT for missing file read', () => {
      expect(() => store.readFile('/tmp/missing.txt')).toThrow(/ENOENT/);
    });
  });

  describe('readdir', () => {
    it('lists files in directory', () => {
      store.writeFile('/root/a.txt', 'a');
      store.writeFile('/root/b.txt', 'b');
      const entries = store.readdir('/root');
      expect(entries.sort()).toEqual(['a.txt', 'b.txt']);
    });

    it('lists with withFileTypes', () => {
      store.writeFile('/root/file.txt', 'data');
      store.writeFile('/root/sub/nested.txt', 'nested');
      const entries = store.readdir('/root', { withFileTypes: true });
      const names = entries.map(e => e.name).sort();
      expect(names).toEqual(['file.txt', 'sub']);
      const subEntry = entries.find(e => e.name === 'sub');
      expect(subEntry.isDirectory()).toBe(true);
      const fileEntry = entries.find(e => e.name === 'file.txt');
      expect(fileEntry.isFile()).toBe(true);
    });
  });

  describe('mkdirp', () => {
    it('creates directory and parents', () => {
      store.mkdirp('/a/b/c');
      expect(store.exists(path.resolve('/a/b/c'))).toBe(true);
      expect(store.exists(path.resolve('/a/b'))).toBe(true);
    });
  });

  describe('stat / mtime', () => {
    it('returns stat for existing file', () => {
      store.writeFile('/tmp/s.txt', 'data');
      const s = store.stat('/tmp/s.txt');
      expect(s.isFile()).toBe(true);
      expect(typeof s.mtimeMs).toBe('number');
    });

    it('throws ENOENT for missing file stat', () => {
      expect(() => store.stat('/tmp/missing.txt')).toThrow(/ENOENT/);
    });

    it('returns 0 mtime for missing file', () => {
      expect(store.mtime('/tmp/missing.txt')).toBe(0);
    });

    it('returns positive mtime for existing file', () => {
      store.writeFile('/tmp/m.txt', 'data');
      expect(store.mtime('/tmp/m.txt')).toBeGreaterThan(0);
    });
  });

  describe('initialFiles constructor', () => {
    it('pre-populates files from constructor', () => {
      const s = new InMemoryStore({ '/init/file.md': '# Hello' });
      expect(s.exists('/init/file.md')).toBe(true);
      expect(s.readFile('/init/file.md')).toBe('# Hello');
    });
  });
});

describe('getStore / setStore', () => {
  let original;
  beforeEach(() => { original = getStore(); });

  it('injects a custom store and restores it', () => {
    const mem = new InMemoryStore();
    setStore(mem);
    expect(getStore()).toBe(mem);
    setStore(original);
    expect(getStore()).toBe(original);
  });
});
