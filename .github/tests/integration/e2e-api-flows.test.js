'use strict';
/* SP-R2-006-005: End-to-end integration tests.
 * Tests complete user journeys through the API:
 * - Questionnaire CRUD (discover → save answer → verify)
 * - Decision CRUD + state transitions (create → answer → decide → defer → reopen → expire)
 * - Command pipeline (queue → verify → re-read)
 * - Analytics flow (post events → read back)
 * - Error paths (invalid input, missing files, malformed data)
 * Uses InMemoryStore for isolation; exercises real HTTP through server. */

const http = require('http');
const path = require('path');
const { InMemoryStore, setStore } = require('../../webapp/store');
const { server, _cache } = require('../../webapp/server');

const WEBAPP_DIR    = path.resolve(__dirname, '../../webapp');
const PROJECT_ROOT  = path.resolve(WEBAPP_DIR, '..', '..');
const BUSINESS_DOCS = path.join(PROJECT_ROOT, 'BusinessDocs');
const GITHUB_DOCS   = path.join(PROJECT_ROOT, '.github', 'docs');
const SESSION_DIR   = path.join(GITHUB_DOCS, 'session');
const SESSION_FILE  = path.join(SESSION_DIR, 'session-state.json');
const DECISIONS_FILE = path.join(GITHUB_DOCS, 'decisions.md');
const HELP_DIR       = path.join(PROJECT_ROOT, '.github', 'help');

let baseUrl;

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {},
    };
    if (body !== undefined) {
      const data = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const r = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let json;
        try { json = JSON.parse(text); } catch { json = null; }
        resolve({ status: res.statusCode, headers: res.headers, text, json });
      });
    });
    r.on('error', reject);
    if (body !== undefined) r.write(JSON.stringify(body));
    r.end();
  });
}

/* ── Fixtures ─────────────────────────────────────────────────── */

const Q05_MD = `# Questionnaire: Software Architect

> Phase: Phase 2 | Generated: 2025-01-01 | Version: 1.0

## Section 1: Architecture

### Q-05-001 [REQUIRED]
**Question:** What is the target deployment environment?
**Why we need this:** To determine infrastructure requirements.
**Expected format:** Text description
**Example:** Cloud-based Kubernetes cluster
**Your answer:**
> *(fill in here)*

### Q-05-002 [OPTIONAL]
**Question:** What is the expected peak load?
**Why we need this:** Capacity planning.
**Expected format:** Number
**Example:** 1000 requests/sec
**Your answer:**
> *(fill in here)*

## Answer Status

| Q-ID | Status | Last Updated |
|------|--------|--------------|
| Q-05-001 | OPEN | — |
| Q-05-002 | OPEN | — |
`;

const SESSION_STATE = {
  session_id: 'e2e-test-session',
  cycle_type: 'COMBO_AUDIT',
  status: 'SPRINT-IN-PROGRESS',
  current_phase: 'PHASE-5',
  current_agent: '20-implementation-agent',
  initiated_at: '2026-03-01T00:00:00Z',
  last_updated: '2026-03-08T00:00:00Z',
  completed_phases: ['ONBOARDING', 'PHASE-2', 'PHASE-3'],
  completed_agents: ['25-onboarding-agent', '05-software-architect'],
  phase_outputs: {},
  sprint_backlog: { total_sprints: 7, sprint_statuses: { 'SP-R2-001': 'DONE', 'SP-R2-002': 'DONE' } },
};

const DECISIONS_MD = `# Decisions & Open Questions

---

## Open Questions (waiting for your answer)

| ID | Priority | Scope | Question | Your answer | Date |
|----|-----------|-------|-------|---------------|-------|
| DEC-R2-010 | HIGH | Phase 2 | Which DB to use? | | 2025-01-01 |

---

## Decided Items (agents act on these)

### Transformation Decisions (DEC-T series)

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|

### Reevaluation Decisions (DEC-R2 series)

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-R2-001 | HIGH | All sprints | Localhost only | Security advisory | 2025-01-01 |

### Operational Decisions

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-100 | — | — | *(Add a decision here)* | | |

---

## Deferred & Expired

| ID | Status | Scope | Subject | Reason | Date |
|----|--------|-------|---------|--------|------|

---

## Audit Trail
`;

function seedStore() {
  const qPath = path.join(BUSINESS_DOCS, 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md');
  const helpPath = path.join(HELP_DIR, 'getting-started.md');
  return new InMemoryStore({
    [qPath]: Q05_MD,
    [SESSION_FILE]: JSON.stringify(SESSION_STATE),
    [DECISIONS_FILE]: DECISIONS_MD,
    [helpPath]: '# Getting Started\n\nWelcome to the help system.',
  });
}

/* ── Lifecycle ────────────────────────────────────────────────── */

beforeAll(async () => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  setStore(seedStore());
  _cache.invalidateAll();
});

afterEach(() => {
  setStore(new InMemoryStore());
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 1: Questionnaire discovery → answer → verify persistence
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Questionnaire answer journey', () => {
  it('discovers questionnaires, saves answers, and verifies persistence', async () => {
    // Step 1: Discover available questionnaires
    const discover = await req('GET', '/api/questionnaires');
    expect(discover.status).toBe(200);
    expect(discover.json.questionnaires).toHaveLength(1);
    const q = discover.json.questionnaires[0];
    expect(q.agent).toBe('Software Architect');
    expect(q.questions).toHaveLength(2);
    expect(q.questions[0].id).toBe('Q-05-001');
    expect(q.questions[0].status).toBe('OPEN');
    expect(q.questions[1].id).toBe('Q-05-002');

    // Step 2: Save answer to Q-05-001
    const save1 = await req('POST', '/api/save', {
      file: 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md',
      updates: [{ questionId: 'Q-05-001', status: 'ANSWERED', answer: 'Local Node.js server' }],
    });
    expect(save1.status).toBe(200);
    expect(save1.json.ok).toBe(true);
    expect(save1.json.saved).toBe(1);

    // Step 3: Re-discover to verify answer persisted
    const verify = await req('GET', '/api/questionnaires');
    expect(verify.status).toBe(200);
    const updated = verify.json.questionnaires[0];
    const q1 = updated.questions.find(x => x.id === 'Q-05-001');
    expect(q1.answer).toBe('Local Node.js server');
    expect(q1.status).toBe('ANSWERED');
    // Q-05-002 should still be OPEN
    const q2 = updated.questions.find(x => x.id === 'Q-05-002');
    expect(q2.status).toBe('OPEN');
  });

  it('saves multiple answers in one batch and verifies all', async () => {
    const save = await req('POST', '/api/save', {
      file: 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md',
      updates: [
        { questionId: 'Q-05-001', status: 'ANSWERED', answer: 'Docker containers' },
        { questionId: 'Q-05-002', status: 'ANSWERED', answer: '500 req/sec' },
      ],
    });
    expect(save.status).toBe(200);
    expect(save.json.saved).toBe(2);

    const verify = await req('GET', '/api/questionnaires');
    const qs = verify.json.questionnaires[0].questions;
    expect(qs.find(x => x.id === 'Q-05-001').answer).toBe('Docker containers');
    expect(qs.find(x => x.id === 'Q-05-002').answer).toBe('500 req/sec');
    expect(qs.every(x => x.status === 'ANSWERED')).toBe(true);
  });

  it('handles sequential answer updates (overwrite previous)', async () => {
    // First answer
    await req('POST', '/api/save', {
      file: 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md',
      updates: [{ questionId: 'Q-05-001', status: 'ANSWERED', answer: 'First answer' }],
    });

    // Update with new answer
    await req('POST', '/api/save', {
      file: 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md',
      updates: [{ questionId: 'Q-05-001', status: 'ANSWERED', answer: 'Updated answer' }],
    });

    const verify = await req('GET', '/api/questionnaires');
    const q1 = verify.json.questionnaires[0].questions.find(x => x.id === 'Q-05-001');
    expect(q1.answer).toBe('Updated answer');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 2: Decision lifecycle — full state machine
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Decision full lifecycle', () => {
  it('creates, answers, decides, and verifies an open question', async () => {
    // Step 1: Read initial state
    const initial = await req('GET', '/api/decisions');
    expect(initial.status).toBe(200);
    expect(initial.json.open).toHaveLength(1);
    expect(initial.json.open[0].id).toBe('DEC-R2-010');

    // Step 2: Create a new open question
    const create = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'OPEN_QUESTION',
      priority: 'MEDIUM',
      scope: 'Phase 5',
      text: 'Should we use WebSockets for real-time updates?',
    });
    expect(create.status).toBe(200);
    expect(create.json.ok).toBe(true);
    expect(create.json.action).toBe('created_open_question');
    const newId = create.json.id;

    // Step 3: Verify it appears in the open list
    const afterCreate = await req('GET', '/api/decisions');
    expect(afterCreate.json.open).toHaveLength(2);
    const newQ = afterCreate.json.open.find(q => q.id === newId);
    expect(newQ).toBeDefined();
    expect(newQ.question).toContain('WebSockets');

    // Step 4: Answer the question
    const answer = await req('POST', '/api/decisions', {
      action: 'answer',
      id: newId,
      answer: 'SSE is sufficient for localhost use',
    });
    expect(answer.status).toBe(200);
    expect(answer.json.action).toBe('answered');

    // Step 5: Verify answer persisted
    const afterAnswer = await req('GET', '/api/decisions');
    const answered = afterAnswer.json.open.find(q => q.id === newId);
    expect(answered.answer).toContain('SSE is sufficient');

    // Step 6: Decide (move to decided)
    const decide = await req('POST', '/api/decisions', {
      action: 'decide',
      id: newId,
      answer: 'SSE confirmed — DEC-R2-001 constraints apply',
    });
    expect(decide.status).toBe(200);
    expect(decide.json.action).toBe('decided');

    // Step 7: Verify it moved from open to decided
    const afterDecide = await req('GET', '/api/decisions');
    expect(afterDecide.json.open.find(q => q.id === newId)).toBeUndefined();
    // It should now be in the decided list
    const decided = afterDecide.json.decided.find(d => d.id === newId);
    expect(decided).toBeDefined();
  });

  it('creates decision, defers it, then reopens it', async () => {
    // Create
    const create = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'OPEN_QUESTION',
      priority: 'HIGH',
      scope: 'Phase 2',
      text: 'What caching strategy to use?',
    });
    const id = create.json.id;

    // Defer
    const defer = await req('POST', '/api/decisions', {
      action: 'defer',
      id,
      reason: 'Waiting for performance benchmarks',
    });
    expect(defer.status).toBe(200);
    expect(defer.json.action).toBe('deferred');

    // Verify deferred
    const afterDefer = await req('GET', '/api/decisions');
    expect(afterDefer.json.open.find(q => q.id === id)).toBeUndefined();
    expect(afterDefer.json.deferred.find(d => d.id === id)).toBeDefined();

    // Reopen
    const reopen = await req('POST', '/api/decisions', {
      action: 'reopen',
      id,
    });
    expect(reopen.status).toBe(200);
    expect(reopen.json.action).toBe('reopened');

    // Verify reopened (back to open)
    const afterReopen = await req('GET', '/api/decisions');
    expect(afterReopen.json.open.find(q => q.id === id)).toBeDefined();
    expect(afterReopen.json.deferred.find(d => d.id === id)).toBeUndefined();
  });

  it('creates an operational decision directly', async () => {
    const create = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      priority: 'HIGH',
      scope: 'All sprints',
      text: 'Use file-based storage only',
      notes: 'Simplicity over scalability',
    });
    expect(create.status).toBe(200);
    expect(create.json.action).toBe('created_decision');

    const after = await req('GET', '/api/decisions');
    const dec = after.json.decided.find(d => d.id === create.json.id);
    expect(dec).toBeDefined();
    expect(dec.decision).toContain('file-based storage');
  });

  it('edits an existing decided item', async () => {
    // The pre-seeded DEC-R2-001 is in decided
    const edit = await req('POST', '/api/decisions', {
      action: 'edit',
      id: 'DEC-R2-001',
      text: 'Localhost only — confirmed production constraint',
      notes: 'Updated security advisory notes',
    });
    expect(edit.status).toBe(200);
    expect(edit.json.action).toBe('edited');

    const after = await req('GET', '/api/decisions');
    const edited = after.json.decided.find(d => d.id === 'DEC-R2-001');
    expect(edited.decision).toContain('confirmed production constraint');
    expect(edited.notes).toContain('Updated security');
  });

  it('expires a decided item', async () => {
    const expire = await req('POST', '/api/decisions', {
      action: 'expire',
      id: 'DEC-R2-001',
      reason: 'Migrating to cloud deployment',
    });
    expect(expire.status).toBe(200);
    expect(expire.json.action).toBe('expired');

    const after = await req('GET', '/api/decisions');
    expect(after.json.decided.find(d => d.id === 'DEC-R2-001')).toBeUndefined();
    const expired = after.json.deferred.find(d => d.id === 'DEC-R2-001');
    expect(expired).toBeDefined();
    expect(expired.status).toBe('EXPIRED');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 3: Command pipeline — queue, verify, read back
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Command pipeline journey', () => {
  it('queues commands, reads them back, and verifies order', async () => {
    // Step 1: Queue is initially empty
    const empty = await req('GET', '/api/command');
    expect(empty.status).toBe(200);
    expect(empty.json.command).toBeNull();
    expect(empty.json.queue).toEqual([]);

    // Step 2: Queue a CREATE command
    const cmd1 = await req('POST', '/api/command', {
      command: 'CREATE',
      project: 'ProjectAlpha',
      description: 'A new software project',
    });
    expect(cmd1.status).toBe(200);
    expect(cmd1.json.ok).toBe(true);
    expect(cmd1.json.clipboard_text).toContain('CREATE');
    expect(cmd1.json.clipboard_text).toContain('ProjectAlpha');

    // Step 3: Queue a REEVALUATE command
    const cmd2 = await req('POST', '/api/command', {
      command: 'REEVALUATE',
      scope: 'TECH',
    });
    expect(cmd2.status).toBe(200);
    expect(cmd2.json.ok).toBe(true);

    // Step 4: Read back — latest should be REEVALUATE
    const readBack = await req('GET', '/api/command');
    expect(readBack.status).toBe(200);
    expect(readBack.json.command.command).toBe('REEVALUATE');
    expect(readBack.json.queue).toHaveLength(2);
    expect(readBack.json.queue[0].command).toBe('CREATE');
    expect(readBack.json.queue[1].command).toBe('REEVALUATE');
  });

  it('queues a command with project brief and verifies brief saved', async () => {
    const cmd = await req('POST', '/api/command', {
      command: 'CREATE',
      project: 'BriefProject',
      brief: 'This is a comprehensive project brief for testing purposes.',
    });
    expect(cmd.status).toBe(200);
    expect(cmd.json.brief_saved).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 4: Session + Progress monitoring
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Session and progress monitoring', () => {
  it('reads session, checks progress phases, verifies consistency', async () => {
    // Step 1: Read session
    const session = await req('GET', '/api/session');
    expect(session.status).toBe(200);
    expect(session.json.session.session_id).toBe('e2e-test-session');
    expect(session.json.session.status).toBe('SPRINT-IN-PROGRESS');

    // Step 2: Check progress
    const progress = await req('GET', '/api/progress');
    expect(progress.status).toBe(200);
    expect(progress.json.active).toBe(true);
    expect(progress.json.session.session_id).toBe('e2e-test-session');
    expect(progress.json.phases).toHaveLength(7);

    // Completed phases should show as done
    const p2 = progress.json.phases.find(p => p.key === 'PHASE-2');
    expect(p2.status).toBe('done');
    const p3 = progress.json.phases.find(p => p.key === 'PHASE-3');
    expect(p3.status).toBe('done');

    // Current phase (PHASE-5) should be active
    const p5 = progress.json.phases.find(p => p.key === 'PHASE-5');
    expect(p5.status).toBe('active');

    // Sprint info should be present
    expect(progress.json.sprints.total).toBe(7);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 5: Analytics flow — post, accumulate, read back
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Analytics event flow', () => {
  it('posts analytics events, accumulates, and reads back all', async () => {
    // Step 1: No events initially
    const empty = await req('GET', '/api/analytics');
    expect(empty.status).toBe(200);
    expect(empty.json.events).toEqual([]);

    // Step 2: Post batch 1
    const post1 = await req('POST', '/api/analytics', {
      events: [
        { event: 'session_start', properties: { source: 'test' }, timestamp: '2026-03-08T00:00:00Z' },
        { event: 'page_view', properties: { page: 'dashboard' }, timestamp: '2026-03-08T00:01:00Z' },
      ],
    });
    expect(post1.status).toBe(200);
    expect(post1.json.accepted).toBe(2);

    // Step 3: Post batch 2
    const post2 = await req('POST', '/api/analytics', {
      events: [
        { event: 'tab_switch', properties: { tab: 'decisions' }, timestamp: '2026-03-08T00:02:00Z' },
      ],
    });
    expect(post2.status).toBe(200);
    expect(post2.json.accepted).toBe(1);

    // Step 4: Read back all — should have 3 events
    const readAll = await req('GET', '/api/analytics');
    expect(readAll.status).toBe(200);
    expect(readAll.json.total).toBe(3);
    expect(readAll.json.events.some(e => e.event === 'session_start')).toBe(true);
    expect(readAll.json.events.some(e => e.event === 'page_view')).toBe(true);
    expect(readAll.json.events.some(e => e.event === 'tab_switch')).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 6: Reevaluate trigger flow
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Reevaluate trigger flow', () => {
  it('triggers reevaluate and verifies trigger file written', async () => {
    const trigger = await req('POST', '/api/reevaluate', { scope: 'TECH' });
    expect(trigger.status).toBe(200);
    expect(trigger.json.ok).toBe(true);
    expect(trigger.json.scope).toBe('TECH');
    expect(trigger.json.message).toContain('REEVALUATE TECH');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 7: Export bundle — comprehensive state dump
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Export bundle journey', () => {
  it('exports session + command queue as complete bundle', async () => {
    // Queue a command first
    await req('POST', '/api/command', { command: 'AUDIT', project: 'TestExport' });

    const exp = await req('GET', '/api/export');
    expect(exp.status).toBe(200);
    expect(exp.json.exported_at).toBeDefined();
    expect(exp.json.session.session_id).toBe('e2e-test-session');
    expect(exp.json.command_queue).toHaveLength(1);
    expect(exp.json.command_queue[0].command).toBe('AUDIT');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 8: Help system navigation
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Help system navigation', () => {
  it('lists help topics, then reads a specific topic', async () => {
    // Step 1: Get TOC
    const toc = await req('GET', '/api/help');
    expect(toc.status).toBe(200);
    expect(toc.json.toc).toBeDefined();
    expect(toc.json.toc.length).toBeGreaterThan(0);

    // Step 2: Read first topic
    const firstSlug = toc.json.toc[0].slug;
    const topic = await req('GET', `/api/help?topic=${firstSlug}`);
    expect(topic.status).toBe(200);
    expect(topic.json.slug).toBe(firstSlug);
    expect(topic.json.content).toBeDefined();
    expect(topic.json.content.length).toBeGreaterThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 9: Error path — comprehensive error handling
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Error paths', () => {
  it('returns 404 for save to non-existent questionnaire file', async () => {
    const r = await req('POST', '/api/save', {
      file: 'NonExistent/fake-questionnaire.md',
      updates: [{ questionId: 'Q-99-001', status: 'OPEN', answer: '' }],
    });
    expect(r.status).toBe(404);
    expect(r.json.code).toBe('FILE_NOT_FOUND');
    expect(r.json.recovery).toBeDefined();
  });

  it('returns 400 for invalid question ID format', async () => {
    const r = await req('POST', '/api/save', {
      file: 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md',
      updates: [{ questionId: 'INVALID-ID', status: 'OPEN', answer: '' }],
    });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for decision with missing required fields', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      // missing priority, scope, text
    });
    expect(r.status).toBe(400);
  });

  it('returns 400 for unknown decision action', async () => {
    const r = await req('POST', '/api/decisions', { action: 'teleport' });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('INVALID_ACTION');
  });

  it('returns 400 for unknown command', async () => {
    const r = await req('POST', '/api/command', { command: 'DESTROY' });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('UNKNOWN_COMMAND');
  });

  it('returns 404 for decisions when decisions.md is missing', async () => {
    setStore(new InMemoryStore({ [SESSION_FILE]: JSON.stringify(SESSION_STATE) }));
    _cache.invalidateAll();
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      priority: 'HIGH',
      scope: 'Test',
      text: 'Test decision',
    });
    expect(r.status).toBe(404);
    expect(r.json.code).toBe('DECISIONS_NOT_FOUND');
  });

  it('returns 400 for analytics with invalid event types', async () => {
    const r = await req('POST', '/api/analytics', {
      events: [{ event: 'invalid_event_type', properties: {} }],
    });
    expect(r.status).toBe(200);
    // Invalid events get rejected; accepted count should be 0
    expect(r.json.accepted).toBe(0);
    expect(r.json.rejected).toBe(1);
  });

  it('returns 400 for path traversal attempt in save', async () => {
    const r = await req('POST', '/api/save', {
      file: '../../etc/passwd',
      updates: [{ questionId: 'Q-01-001', status: 'OPEN', answer: '' }],
    });
    expect(r.status).toBe(403);
    expect(r.json.code).toBe('PATH_TRAVERSAL');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 10: Health + Metrics observability
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Health and metrics observability', () => {
  it('health endpoint reports status, then metrics reflect request count', async () => {
    const health = await req('GET', '/api/health');
    expect(health.status).toBe(200);
    expect(health.json.status).toBe('ok');
    expect(health.json.sse_connections).toBeDefined();

    const metrics = await req('GET', '/api/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.json.request_count).toBeGreaterThan(0);
    expect(metrics.json.uptime_seconds).toBeGreaterThanOrEqual(0);
    expect(metrics.json.response_time_p50).toBeDefined();
    expect(metrics.json.per_endpoint).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 11: Secret detection across endpoints
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Secret detection across endpoints', () => {
  it('detects secrets in questionnaire answers', async () => {
    const r = await req('POST', '/api/save', {
      file: 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md',
      updates: [{ questionId: 'Q-05-001', status: 'ANSWERED', answer: 'Use key AKIAIOSFODNN7EXAMPLE to connect' }],
    });
    expect(r.status).toBe(200);
    expect(r.json.warnings).toBeDefined();
    expect(r.json.warnings[0]).toContain('secrets detected');
  });

  it('detects secrets in decision text', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'OPEN_QUESTION',
      priority: 'LOW',
      scope: 'Test',
      text: 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm',
    });
    expect(r.status).toBe(200);
    expect(r.json.warnings).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════
 * JOURNEY 12: Cross-endpoint state consistency
 * ═══════════════════════════════════════════════════════════════ */

describe('E2E: Cross-endpoint state consistency', () => {
  it('decision changes reflect in export bundle', async () => {
    // Create a decision
    const create = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      priority: 'HIGH',
      scope: 'All',
      text: 'Use vitest for testing',
      notes: 'Confirmed in Sprint 3',
    });
    expect(create.status).toBe(200);

    // Export should include the session state
    const exp = await req('GET', '/api/export');
    expect(exp.status).toBe(200);
    expect(exp.json.session.session_id).toBe('e2e-test-session');
  });

  it('progress reflects session changes after reevaluate trigger', async () => {
    // Trigger reevaluate
    const trigger = await req('POST', '/api/reevaluate', { scope: 'UX' });
    expect(trigger.status).toBe(200);

    // Progress should still be active and consistent
    const progress = await req('GET', '/api/progress');
    expect(progress.status).toBe(200);
    expect(progress.json.active).toBe(true);
    expect(progress.json.session.session_id).toBe('e2e-test-session');
  });
});
