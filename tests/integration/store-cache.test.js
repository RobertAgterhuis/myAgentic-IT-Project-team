'use strict';
/* Integration test example: Store injection + Cache interaction.
 * Pattern: use InMemoryStore via setStore() to test modules that
 * depend on the Store abstraction without touching the filesystem.
 * This demonstrates the canonical test-isolation approach for
 * any code that reads/writes files through the Store layer. */

const path = require('path');
const { InMemoryStore, setStore, getStore } = require('../../.github/webapp/store');
const { FileCache } = require('../../.github/webapp/cache');

describe('FileCache with InMemoryStore (mock-store injection)', () => {
  let store;
  let cache;

  beforeEach(() => {
    store = new InMemoryStore();
    setStore(store);
    cache = new FileCache();
  });

  afterEach(() => {
    // Reset to a clean InMemoryStore so other tests aren't affected
    setStore(new InMemoryStore());
  });

  it('reads file content through the Store abstraction', () => {
    const filePath = path.resolve('/fake/dir/test.md');
    store.writeFile(filePath, '# Hello');

    const content = cache.read(filePath);
    expect(content).toBe('# Hello');
  });

  it('returns cached content on second read when mtime unchanged', () => {
    const filePath = path.resolve('/fake/dir/test.md');
    store.writeFile(filePath, 'original');

    cache.read(filePath); // prime cache
    // Overwrite data without changing mtime (InMemoryStore may update mtime)
    const entry = store._files.get(filePath);
    const savedMtime = entry.mtime;
    store._files.set(filePath, { data: 'changed-but-same-mtime', mtime: savedMtime });

    const content = cache.read(filePath);
    expect(content).toBe('original'); // still cached
  });

  it('invalidates cache and reads fresh data', () => {
    const filePath = path.resolve('/fake/dir/test.md');
    store.writeFile(filePath, 'v1');
    cache.read(filePath);

    store.writeFile(filePath, 'v2'); // new mtime
    cache.invalidate(filePath);
    const content = cache.read(filePath);
    expect(content).toBe('v2');
  });

  it('readJSON parses valid JSON from Store', () => {
    const filePath = path.resolve('/fake/data.json');
    store.writeFile(filePath, JSON.stringify({ key: 'value' }));

    const { data, errors } = cache.readJSON(filePath);
    expect(errors).toBeNull();
    expect(data).toEqual({ key: 'value' });
  });

  it('readJSON returns errors for invalid JSON', () => {
    const filePath = path.resolve('/fake/bad.json');
    store.writeFile(filePath, 'not-json{');

    const { data, errors } = cache.readJSON(filePath);
    expect(data).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Invalid JSON/);
  });

  it('readJSON applies validator from schemas', () => {
    const { validateSessionState } = require('../../.github/webapp/schemas');
    const filePath = path.resolve('/fake/session.json');
    store.writeFile(filePath, JSON.stringify({
      session_id: 'test-001',
      cycle_type: 'FULL_CREATE',
      status: 'IN_PROGRESS',
      current_phase: 'Phase 2',
    }));

    const { data, errors } = cache.readJSON(filePath, validateSessionState);
    expect(errors).toBeNull();
    expect(data.session_id).toBe('test-001');
  });
});
