// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect, beforeEach, afterEach */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  FileStore, InMemoryStore, getStore, setStore,
  BACKUPS_DIR_NAME, MAX_BACKUPS_PER_FILE,
} = require('./store');

/* ── Story #12: Store interface (SP-R2-002-001) ─────────────── */

/* ── FileStore (filesystem-backed) ──────────────────────────── */

describe('FileStore', () => {
  let store;
  let tmpDir;

  beforeEach(() => {
    store = new FileStore();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'store-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('exists', () => {
    it('returns false for non-existent path', () => {
      expect(store.exists(path.join(tmpDir, 'nope.txt'))).toBe(false);
    });

    it('returns true for existing file', () => {
      const fp = path.join(tmpDir, 'hello.txt');
      fs.writeFileSync(fp, 'hi');
      expect(store.exists(fp)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('reads file content', () => {
      const fp = path.join(tmpDir, 'data.txt');
      fs.writeFileSync(fp, 'payload');
      expect(store.readFile(fp)).toBe('payload');
    });

    it('uses utf8 by default', () => {
      const fp = path.join(tmpDir, 'utf.txt');
      fs.writeFileSync(fp, 'ünïcödé', 'utf8');
      expect(store.readFile(fp)).toBe('ünïcödé');
    });
  });

  describe('writeFile', () => {
    it('writes a new file and creates parent directories', () => {
      const fp = path.join(tmpDir, 'sub', 'deep', 'out.txt');
      store.writeFile(fp, 'content');
      expect(fs.readFileSync(fp, 'utf8')).toBe('content');
    });

    it('creates a backup when overwriting', () => {
      const fp = path.join(tmpDir, 'bk.txt');
      store.writeFile(fp, 'v1');
      store.writeFile(fp, 'v2');
      const bkDir = path.join(tmpDir, BACKUPS_DIR_NAME, 'bk.txt');
      expect(fs.existsSync(bkDir)).toBe(true);
      const backups = fs.readdirSync(bkDir);
      expect(backups.length).toBe(1);
      expect(fs.readFileSync(path.join(bkDir, backups[0]), 'utf8')).toBe('v1');
    });

    it('prunes backups beyond MAX_BACKUPS_PER_FILE', () => {
      const fp = path.join(tmpDir, 'prune.txt');
      store.writeFile(fp, 'v0');
      for (let i = 1; i <= MAX_BACKUPS_PER_FILE + 3; i++) {
        store.writeFile(fp, `v${i}`);
      }
      const bkDir = path.join(tmpDir, BACKUPS_DIR_NAME, 'prune.txt');
      const backups = fs.readdirSync(bkDir);
      expect(backups.length).toBeLessThanOrEqual(MAX_BACKUPS_PER_FILE);
    });

    it('throws with status 500 on write failure', () => {
      const fp = path.join(tmpDir, 'fail.txt');
      // Mock writeFileSync to fail inside the try block (file is new, so _createBackup exits early)
      const spy = vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
        throw new Error('disk full');
      });
      try {
        expect(() => store.writeFile(fp, 'data')).toThrow(/File write failed/);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('readdir', () => {
    it('lists directory contents', () => {
      fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'a');
      fs.writeFileSync(path.join(tmpDir, 'b.txt'), 'b');
      const entries = store.readdir(tmpDir);
      expect(entries.sort()).toEqual(['a.txt', 'b.txt']);
    });
  });

  describe('mkdirp', () => {
    it('creates nested directories', () => {
      const dir = path.join(tmpDir, 'x', 'y', 'z');
      store.mkdirp(dir);
      expect(fs.existsSync(dir)).toBe(true);
    });

    it('is a no-op if directory exists', () => {
      store.mkdirp(tmpDir);
      expect(fs.existsSync(tmpDir)).toBe(true);
    });
  });

  describe('stat', () => {
    it('returns stat object for a file', () => {
      const fp = path.join(tmpDir, 'st.txt');
      fs.writeFileSync(fp, 'x');
      const s = store.stat(fp);
      expect(typeof s.mtimeMs).toBe('number');
    });
  });

  describe('mtime', () => {
    it('returns positive mtime for existing file', () => {
      const fp = path.join(tmpDir, 'mt.txt');
      fs.writeFileSync(fp, 'y');
      expect(store.mtime(fp)).toBeGreaterThan(0);
    });

    it('returns 0 for missing file', () => {
      expect(store.mtime(path.join(tmpDir, 'gone.txt'))).toBe(0);
    });
  });
});

/* ── InMemoryStore ──────────────────────────────────────────── */

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

  describe('backup behavior', () => {
    it('stores a backup on overwrite', () => {
      store.writeFile('/tmp/bk.txt', 'original');
      store.writeFile('/tmp/bk.txt', 'updated');
      const resolved = path.resolve('/tmp/bk.txt');
      expect(store._backups.has(resolved)).toBe(true);
      const bks = store._backups.get(resolved);
      expect(bks.length).toBe(1);
      expect(bks[0].data).toBe('original');
    });

    it('does not create backup for first write', () => {
      store.writeFile('/tmp/new.txt', 'first');
      const resolved = path.resolve('/tmp/new.txt');
      expect(store._backups.has(resolved)).toBe(false);
    });

    it('prunes backups beyond MAX_BACKUPS_PER_FILE', () => {
      store.writeFile('/tmp/pr.txt', 'v0');
      for (let i = 1; i <= MAX_BACKUPS_PER_FILE + 5; i++) {
        store.writeFile('/tmp/pr.txt', `v${i}`);
      }
      const resolved = path.resolve('/tmp/pr.txt');
      const bks = store._backups.get(resolved);
      expect(bks.length).toBe(MAX_BACKUPS_PER_FILE);
    });
  });

  describe('stat for directories', () => {
    it('returns directory stat for mkdirp-created dir', () => {
      store.mkdirp('/a/b/c');
      const s = store.stat(path.resolve('/a/b/c'));
      expect(s.isDirectory()).toBe(true);
      expect(s.isFile()).toBe(false);
    });
  });

  describe('readdir with mixed content', () => {
    it('includes subdirectories from _dirs', () => {
      store.mkdirp('/root/subdir');
      store.writeFile('/root/file.txt', 'data');
      const entries = store.readdir('/root');
      expect(entries.sort()).toEqual(['file.txt', 'subdir']);
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
