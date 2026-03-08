'use strict';
/* SP-R2-006-006: Tests for snapshot-on-write backup strategy.
 * Verifies that InMemoryStore (and by contract, FileStore) creates
 * timestamped backups before every write, retains max 10, and prunes oldest. */

const path = require('path');
const { InMemoryStore, MAX_BACKUPS_PER_FILE } = require('../../webapp/store');

describe('Snapshot-on-write backup (InMemoryStore)', () => {
  const FILE = path.resolve('/test/data.md');

  it('does not create a backup on first write (no previous version)', () => {
    const store = new InMemoryStore();
    store.writeFile(FILE, 'v1');
    expect(store._backups.has(FILE)).toBe(false);
  });

  it('creates a backup on second write with previous content', () => {
    const store = new InMemoryStore({ [FILE]: 'v1' });
    store.writeFile(FILE, 'v2');
    const bks = store._backups.get(FILE);
    expect(bks).toHaveLength(1);
    expect(bks[0].data).toBe('v1');
    expect(bks[0].timestamp).toBeDefined();
  });

  it('accumulates backups across multiple writes', () => {
    const store = new InMemoryStore({ [FILE]: 'v1' });
    store.writeFile(FILE, 'v2');
    store.writeFile(FILE, 'v3');
    store.writeFile(FILE, 'v4');
    const bks = store._backups.get(FILE);
    expect(bks).toHaveLength(3);
    expect(bks[0].data).toBe('v1');
    expect(bks[1].data).toBe('v2');
    expect(bks[2].data).toBe('v3');
    // Current value should be v4
    expect(store.readFile(FILE)).toBe('v4');
  });

  it('prunes backups beyond MAX_BACKUPS_PER_FILE (10)', () => {
    const store = new InMemoryStore({ [FILE]: 'v0' });
    // Write 12 more times → 12 backups attempted, only 10 retained
    for (let i = 1; i <= 12; i++) {
      store.writeFile(FILE, `v${i}`);
    }
    const bks = store._backups.get(FILE);
    expect(bks).toHaveLength(MAX_BACKUPS_PER_FILE);
    // Oldest kept should be v2 (v0 and v1 pruned)
    expect(bks[0].data).toBe('v2');
    // Newest should be v11 (v12 is the current value, not backed up yet)
    expect(bks[bks.length - 1].data).toBe('v11');
    expect(store.readFile(FILE)).toBe('v12');
  });

  it('maintains separate backup histories per file', () => {
    const FILE_A = path.resolve('/test/a.md');
    const FILE_B = path.resolve('/test/b.md');
    const store = new InMemoryStore({ [FILE_A]: 'a1', [FILE_B]: 'b1' });

    store.writeFile(FILE_A, 'a2');
    store.writeFile(FILE_B, 'b2');

    expect(store._backups.get(FILE_A)).toHaveLength(1);
    expect(store._backups.get(FILE_A)[0].data).toBe('a1');
    expect(store._backups.get(FILE_B)).toHaveLength(1);
    expect(store._backups.get(FILE_B)[0].data).toBe('b1');
  });

  it('backup timestamps are valid ISO strings', () => {
    const store = new InMemoryStore({ [FILE]: 'v1' });
    store.writeFile(FILE, 'v2');
    const ts = store._backups.get(FILE)[0].timestamp;
    expect(() => new Date(ts)).not.toThrow();
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('preserves file content correctly through backup cycle', () => {
    const content = '# Markdown\n\n| Col A | Col B |\n|-------|-------|\n| 1 | 2 |\n';
    const store = new InMemoryStore({ [FILE]: content });
    store.writeFile(FILE, 'replaced');
    expect(store._backups.get(FILE)[0].data).toBe(content);
    expect(store.readFile(FILE)).toBe('replaced');
  });
});
