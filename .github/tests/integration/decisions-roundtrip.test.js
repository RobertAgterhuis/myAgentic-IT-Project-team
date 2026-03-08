'use strict';
/* Integration test example: Store + models + cache working together.
 * Pattern: seed InMemoryStore with markdown files, then exercise
 * the full read-parse-update-write cycle through multiple modules.
 * Demonstrates realistic multi-module integration testing. */

const path = require('path');
const { InMemoryStore, setStore } = require('../../webapp/store');
const { FileCache }               = require('../../webapp/cache');
const { parseDecisions, addOpenQuestion, nextDecisionId, today } = require('../../webapp/models');

const DECISIONS_PATH = path.resolve('/fake/project/.github/docs/decisions.md');

// Must match the exact table format parseDecisions expects
const DECISIONS_MD = `# Decisions & Open Questions

---

## Open Questions (waiting for your answer)

| ID | Priority | Scope | Question | Your answer | Date |
|----|-----------|-------|-------|---------------|-------|
| DEC-R2-010 | HIGH | Phase 2 | Which DB to use? | | 2025-01-01 |

---

## Decided Items (agents act on these)

### Reevaluation Decisions (DEC-R2 series)

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-R2-001 | HIGH | All sprints | Use file storage | Simplicity | 2025-01-02 |

### Operational Decisions

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|

---

## Deferred & Expired

| ID | Status | Scope | Subject | Reason | Date |
|----|--------|-------|---------|--------|------|

---

## Audit Trail
`;

describe('decisions round-trip through Store + Cache + Models', () => {
  let store;
  let cache;

  beforeEach(() => {
    store = new InMemoryStore({ [DECISIONS_PATH]: DECISIONS_MD });
    setStore(store);
    cache = new FileCache();
  });

  afterEach(() => {
    setStore(new InMemoryStore());
  });

  it('reads and parses decisions from Store via Cache', () => {
    const content = cache.read(DECISIONS_PATH);
    const decisions = parseDecisions(content);

    expect(decisions.open).toHaveLength(1);
    expect(decisions.open[0].id).toBe('DEC-R2-010');
    expect(decisions.decided).toHaveLength(1);
    expect(decisions.decided[0].id).toBe('DEC-R2-001');
  });

  it('adds a question, writes back, and re-reads consistently', () => {
    const original = cache.read(DECISIONS_PATH);
    const newId = nextDecisionId(original, 'DEC-R2-');
    const updated = addOpenQuestion(original, {
      id: newId, priority: 'MEDIUM', scope: 'Phase 2',
      question: 'Should we add caching?', answer: '', date: today(),
    });

    // Write updated content back through Store
    cache.invalidate(DECISIONS_PATH);
    store.writeFile(DECISIONS_PATH, updated);

    // Read through cache (which should see new mtime)
    const freshContent = cache.read(DECISIONS_PATH);
    const decisions = parseDecisions(freshContent);

    expect(decisions.open).toHaveLength(2);
    const newQ = decisions.open.find(q => q.question === 'Should we add caching?');
    expect(newQ).toBeDefined();
    expect(newQ.date).toBe(today());
  });

  it('validates schema on cached JSON read', () => {
    const { validateSessionState } = require('../../webapp/schemas');
    const sessionPath = path.resolve('/fake/session-state.json');
    store.writeFile(sessionPath, JSON.stringify({
      session_id: 'test-001',
      cycle_type: 'FULL_CREATE',
      status: 'IN_PROGRESS',
      current_phase: 'Phase 2',
      current_agent: 'Software Architect',
      completed_phases: ['Phase 1'],
      completed_agents: [],
    }));

    const { data, errors } = cache.readJSON(sessionPath, validateSessionState);
    expect(errors).toBeNull();
    expect(data.session_id).toBe('test-001');
    expect(data.completed_phases).toHaveLength(1);
  });
});
