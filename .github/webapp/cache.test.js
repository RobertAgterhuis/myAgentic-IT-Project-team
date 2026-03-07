// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect, beforeEach, afterEach */
const { InMemoryStore, setStore, getStore } = require('./store');
const { FileCache } = require('./cache');

/* ── Story #16: File cache with mtime invalidation (SP-R2-002-004) ── */

describe('FileCache', () => {
  let store, cache, originalStore;

  beforeEach(() => {
    originalStore = getStore();
    store = new InMemoryStore();
    setStore(store);
    cache = new FileCache();
  });
  afterEach(() => { setStore(originalStore); });

  describe('read', () => {
    it('returns file content on first read', () => {
      store.writeFile('/tmp/a.txt', 'hello');
      expect(cache.read('/tmp/a.txt')).toBe('hello');
      expect(cache.size).toBe(1);
    });

    it('returns cached content when mtime is unchanged', () => {
      store.writeFile('/tmp/a.txt', 'original');
      cache.read('/tmp/a.txt'); // cache it
      // Overwrite data in the Map directly without updating mtime
      const resolved = require('path').resolve('/tmp/a.txt');
      const entry = store._files.get(resolved);
      entry.data = 'mutated-behind-cache';
      expect(cache.read('/tmp/a.txt')).toBe('original'); // cached
    });

    it('re-reads when mtime changes', () => {
      store.writeFile('/tmp/a.txt', 'v1');
      cache.read('/tmp/a.txt');
      // Write again and bump mtime to guarantee change detection
      store.writeFile('/tmp/a.txt', 'v2');
      const resolved = require('path').resolve('/tmp/a.txt');
      store._files.get(resolved).mtime += 1000;
      expect(cache.read('/tmp/a.txt')).toBe('v2');
    });
  });

  describe('readJSON', () => {
    it('parses valid JSON', () => {
      store.writeFile('/tmp/data.json', '{"key":"val"}');
      const { data, errors } = cache.readJSON('/tmp/data.json');
      expect(errors).toBeNull();
      expect(data).toEqual({ key: 'val' });
    });

    it('returns error for invalid JSON', () => {
      store.writeFile('/tmp/bad.json', '{broken');
      const { data, errors } = cache.readJSON('/tmp/bad.json');
      expect(data).toBeNull();
      expect(errors[0]).toMatch(/Invalid JSON/);
    });

    it('applies validator and returns errors', () => {
      store.writeFile('/tmp/v.json', '{"x":1}');
      const validator = (d) => ({ valid: false, errors: ['x must be string'] });
      const { data, errors } = cache.readJSON('/tmp/v.json', validator);
      expect(data).toEqual({ x: 1 });
      expect(errors).toEqual(['x must be string']);
    });

    it('passes with valid validator', () => {
      store.writeFile('/tmp/ok.json', '{"x":1}');
      const validator = () => ({ valid: true, errors: [] });
      const { data, errors } = cache.readJSON('/tmp/ok.json', validator);
      expect(errors).toBeNull();
      expect(data).toEqual({ x: 1 });
    });
  });

  describe('invalidate', () => {
    it('removes a single cached entry', () => {
      store.writeFile('/tmp/a.txt', 'data');
      cache.read('/tmp/a.txt');
      expect(cache.size).toBe(1);
      cache.invalidate('/tmp/a.txt');
      expect(cache.size).toBe(0);
    });
  });

  describe('invalidateAll', () => {
    it('clears all entries', () => {
      store.writeFile('/tmp/a.txt', 'a');
      store.writeFile('/tmp/b.txt', 'b');
      cache.read('/tmp/a.txt');
      cache.read('/tmp/b.txt');
      expect(cache.size).toBe(2);
      cache.invalidateAll();
      expect(cache.size).toBe(0);
    });
  });
});
