'use strict';
/* Unit tests for the AuditTrail module (SP-R2-007-005). */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { AuditTrail } = require('../../webapp/audit');

let tempDir;
let trail;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-test-'));
  trail = new AuditTrail({ logDir: tempDir });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('AuditTrail', () => {
  it('creates log directory if it does not exist', () => {
    const nested = path.join(tempDir, 'sub', 'dir');
    const t = new AuditTrail({ logDir: nested });
    t.log({ operation: 'create', entityType: 'test' });
    expect(fs.existsSync(nested)).toBe(true);
  });

  it('appends entries as JSON Lines', () => {
    trail.log({ operation: 'create', entityType: 'decision', entityId: 'DEC-001', user: 'webapp', summary: 'Created decision' });
    trail.log({ operation: 'update', entityType: 'questionnaire', entityId: 'Q-05-001', user: 'webapp', summary: 'Answer saved' });

    const lines = fs.readFileSync(trail.logPath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.operation).toBe('create');
    expect(first.entity_type).toBe('decision');
    expect(first.entity_id).toBe('DEC-001');
    expect(first.user).toBe('webapp');
    expect(first.timestamp).toBeTruthy();
  });

  it('defaults user to system and entityId to null', () => {
    trail.log({ operation: 'update', entityType: 'session' });
    const lines = fs.readFileSync(trail.logPath, 'utf8').trim().split('\n');
    const entry = JSON.parse(lines[0]);
    expect(entry.user).toBe('system');
    expect(entry.entity_id).toBeNull();
    expect(entry.summary).toBeNull();
  });

  it('reads last N entries', () => {
    for (let i = 0; i < 10; i++) {
      trail.log({ operation: 'update', entityType: 'test', entityId: `ID-${i}` });
    }
    const last5 = trail.read(5);
    expect(last5).toHaveLength(5);
    expect(last5[0].entity_id).toBe('ID-5');
    expect(last5[4].entity_id).toBe('ID-9');
  });

  it('returns empty array when no log exists', () => {
    expect(trail.read()).toEqual([]);
  });

  it('counts entries correctly', () => {
    expect(trail.count()).toBe(0);
    trail.log({ operation: 'create', entityType: 'test' });
    trail.log({ operation: 'update', entityType: 'test' });
    expect(trail.count()).toBe(2);
  });

  it('rotates log when max size exceeded', () => {
    const smallTrail = new AuditTrail({ logDir: tempDir, maxSizeBytes: 100 });
    // Write enough to exceed 100 bytes
    smallTrail.log({ operation: 'create', entityType: 'decision', entityId: 'DEC-001', summary: 'First entry with enough text to exceed limit' });
    // The file is now > 100 bytes; next write should trigger rotation
    smallTrail.log({ operation: 'update', entityType: 'decision', entityId: 'DEC-002', summary: 'Second entry after rotation' });

    const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.jsonl'));
    expect(files.length).toBeGreaterThanOrEqual(2); // original rotated + new
  });

  it('uses custom filename', () => {
    const t = new AuditTrail({ logDir: tempDir, filename: 'custom.jsonl' });
    t.log({ operation: 'create', entityType: 'test' });
    expect(fs.existsSync(path.join(tempDir, 'custom.jsonl'))).toBe(true);
  });

  it('logPath returns correct path', () => {
    expect(trail.logPath).toBe(path.join(tempDir, 'audit-log.jsonl'));
  });
});
