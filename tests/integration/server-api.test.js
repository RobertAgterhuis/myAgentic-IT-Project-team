'use strict';
/* Integration test: server API routes through HTTP.
 * Uses InMemoryStore to avoid filesystem side effects.
 * Exercises all API endpoints to achieve ≥70% coverage on server.js. */

const http = require('http');
const path = require('path');
const { InMemoryStore, setStore } = require('../../.github/webapp/store');
const { server, _cache } = require('../../.github/webapp/server');

// Compute the same paths the server module uses internally
const WEBAPP_DIR    = path.resolve(__dirname, '../../.github/webapp');
const PROJECT_ROOT  = path.resolve(WEBAPP_DIR, '..', '..');
const BUSINESS_DOCS = path.join(PROJECT_ROOT, 'BusinessDocs');
const GITHUB_DOCS   = path.join(PROJECT_ROOT, '.github', 'docs');
const SESSION_DIR   = path.join(GITHUB_DOCS, 'session');
const SESSION_FILE  = path.join(SESSION_DIR, 'session-state.json');
const DECISIONS_FILE = path.join(GITHUB_DOCS, 'decisions.md');
const COMMAND_QUEUE  = path.join(SESSION_DIR, 'command-queue.json');
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

// Raw request with explicit content-type for error testing
function rawPost(urlPath, rawBody, contentType) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const opts = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': contentType || 'text/plain', 'Content-Length': Buffer.byteLength(rawBody) },
    };
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
    r.write(rawBody);
    r.end();
  });
}

/* ── Test fixtures ────────────────────────────────────────────── */

const Q_FILE_REL = 'Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md';

const QUESTIONNAIRE_MD = `# Questionnaire: Software Architect

> Phase: Phase 2 | Generated: 2025-01-01 | Version: 1.0

## Section 1: Architecture

### Q-05-001 [REQUIRED]
**Question:** What is the target deployment environment?
**Why we need this:** To determine infrastructure requirements.
**Expected format:** Text description
**Example:** Cloud-based Kubernetes cluster
**Your answer:**
> *(fill in here)*

## Answer Status

| Q-ID | Status | Last Updated |
|------|--------|--------------|
| Q-05-001 | OPEN | — |
`;

const SESSION_STATE = {
  session_id: 'test-session',
  cycle_type: 'FULL_CREATE',
  status: 'IN_PROGRESS',
  current_phase: 'PHASE-2',
  current_agent: '05-software-architect',
  initiated_at: '2025-01-01T00:00:00Z',
  last_updated: '2025-01-02T00:00:00Z',
  completed_phases: ['ONBOARDING', 'PHASE-1'],
  completed_agents: ['25-onboarding-agent'],
  phase_outputs: {},
  sprint_backlog: { total_sprints: 3, sprint_statuses: { 'SP-1': 'DONE' } },
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
  const qPath = path.join(BUSINESS_DOCS, Q_FILE_REL);
  const helpPath = path.join(HELP_DIR, 'getting-started.md');
  return new InMemoryStore({
    [qPath]: QUESTIONNAIRE_MD,
    [SESSION_FILE]: JSON.stringify(SESSION_STATE),
    [DECISIONS_FILE]: DECISIONS_MD,
    [helpPath]: '# Getting Started\n\nWelcome to the help.',
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

/* ── Health + Static ──────────────────────────────────────────── */

describe('GET /health', () => {
  it('returns ok', async () => {
    const r = await req('GET', '/health');
    expect(r.status).toBe(200);
    expect(r.json.status).toBe('ok');
    expect(r.json.uptime).toBeGreaterThanOrEqual(0);
  });
});

describe('GET / (static)', () => {
  it('serves HTML with security headers', async () => {
    const r = await req('GET', '/');
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toContain('text/html');
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
  });
});

/* ── Router edge cases ────────────────────────────────────────── */

describe('Router', () => {
  it('returns 404 for unknown API path', async () => {
    const r = await req('GET', '/api/nonexistent');
    expect(r.status).toBe(404);
    expect(r.json.error).toBe('Not found');
  });

  it('returns 405 for wrong method on known path', async () => {
    const r = await req('DELETE', '/api/questionnaires');
    expect(r.status).toBe(405);
    expect(r.json.error).toBe('Method Not Allowed');
    expect(r.headers.allow).toBe('GET');
  });

  it('returns 415 for wrong Content-Type on POST', async () => {
    const r = await rawPost('/api/save', 'not json', 'text/plain');
    expect(r.status).toBe(415);
    expect(r.json.error).toContain('Content-Type');
  });

  it('returns 400 for invalid JSON body', async () => {
    const r = await rawPost('/api/save', '{invalid', 'application/json');
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid JSON');
  });
});

/* ── Standardized error response format ──────────────────────── */

describe('Error response format', () => {
  it('returns code, message, recovery on 404', async () => {
    const r = await req('GET', '/api/nonexistent');
    expect(r.status).toBe(404);
    expect(r.json.code).toBe('NOT_FOUND');
    expect(r.json.message).toBe('Not found');
    expect(typeof r.json.recovery).toBe('string');
    expect(r.json.recovery.length).toBeGreaterThan(0);
  });

  it('returns code, message, recovery on 405', async () => {
    const r = await req('DELETE', '/api/questionnaires');
    expect(r.status).toBe(405);
    expect(r.json.code).toBe('METHOD_NOT_ALLOWED');
    expect(typeof r.json.recovery).toBe('string');
  });

  it('returns code, message, recovery on 400 validation', async () => {
    const r = await req('POST', '/api/save', { file: 'x', updates: 'nope' });
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('VALIDATION_ERROR');
    expect(typeof r.json.message).toBe('string');
    expect(typeof r.json.recovery).toBe('string');
  });

  it('returns code, message, recovery on 415', async () => {
    const r = await rawPost('/api/save', 'not json', 'text/plain');
    expect(r.status).toBe(415);
    expect(r.json.code).toBe('INVALID_CONTENT_TYPE');
    expect(typeof r.json.recovery).toBe('string');
  });

  it('returns code, message, recovery on invalid JSON', async () => {
    const r = await rawPost('/api/save', '{bad', 'application/json');
    expect(r.status).toBe(400);
    expect(r.json.code).toBe('INVALID_JSON');
    expect(typeof r.json.recovery).toBe('string');
  });
});

/* ── Questionnaires API ───────────────────────────────────────── */

describe('GET /api/questionnaires', () => {
  it('returns discovered questionnaires', async () => {
    const r = await req('GET', '/api/questionnaires');
    expect(r.status).toBe(200);
    expect(r.json.questionnaires).toHaveLength(1);
    expect(r.json.questionnaires[0].agent).toBe('Software Architect');
    expect(r.json.questionnaires[0].questions).toHaveLength(1);
  });

  it('returns empty when no BusinessDocs', async () => {
    setStore(new InMemoryStore());
    _cache.invalidateAll();
    const r = await req('GET', '/api/questionnaires');
    expect(r.status).toBe(200);
    expect(r.json.questionnaires).toEqual([]);
  });
});

/* ── Session API ──────────────────────────────────────────────── */

describe('GET /api/session', () => {
  it('returns session when file exists', async () => {
    const r = await req('GET', '/api/session');
    expect(r.status).toBe(200);
    expect(r.json.session.session_id).toBe('test-session');
  });

  it('returns null when no session file', async () => {
    setStore(new InMemoryStore());
    _cache.invalidateAll();
    const r = await req('GET', '/api/session');
    expect(r.status).toBe(200);
    expect(r.json.session).toBeNull();
  });
});

/* ── Save API ─────────────────────────────────────────────────── */

describe('POST /api/save', () => {
  it('saves an answer to a questionnaire', async () => {
    const r = await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'Q-05-001', status: 'ANSWERED', answer: 'Localhost only' }],
    });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    expect(r.json.saved).toBe(1);
  });

  it('rejects missing file field', async () => {
    const r = await req('POST', '/api/save', { updates: [{ questionId: 'Q-05-001', status: 'OPEN', answer: '' }] });
    expect(r.status).toBe(400);
  });

  it('rejects empty updates array', async () => {
    const r = await req('POST', '/api/save', { file: Q_FILE_REL, updates: [] });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('updates');
  });

  it('rejects invalid Q-ID', async () => {
    const r = await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'INVALID', status: 'OPEN', answer: '' }],
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid Q-ID');
  });

  it('rejects invalid status', async () => {
    const r = await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'Q-05-001', status: 'INVALID', answer: '' }],
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid status');
  });

  it('returns 404 for non-existent file', async () => {
    const r = await req('POST', '/api/save', {
      file: 'nonexistent/file.md',
      updates: [{ questionId: 'Q-05-001', status: 'OPEN', answer: '' }],
    });
    expect(r.status).toBe(404);
  });

  it('warns when answer contains a secret pattern', async () => {
    const r = await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'Q-05-001', status: 'ANSWERED', answer: 'key=AKIAIOSFODNN7EXAMPLE' }],
    });
    expect(r.status).toBe(200);
    expect(r.json.warnings).toBeDefined();
    expect(r.json.warnings[0]).toContain('secrets detected');
  });
});

/* ── Reevaluate API ───────────────────────────────────────────── */

describe('POST /api/reevaluate', () => {
  it('writes reevaluate trigger', async () => {
    const r = await req('POST', '/api/reevaluate', { scope: 'TECH' });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    expect(r.json.scope).toBe('TECH');
  });

  it('defaults scope to ALL for invalid value', async () => {
    const r = await req('POST', '/api/reevaluate', { scope: 'INVALID' });
    expect(r.status).toBe(200);
    expect(r.json.scope).toBe('ALL');
  });
});

/* ── Decisions API ────────────────────────────────────────────── */

describe('GET /api/decisions', () => {
  it('returns parsed decisions', async () => {
    const r = await req('GET', '/api/decisions');
    expect(r.status).toBe(200);
    expect(r.json.open).toHaveLength(1);
    expect(r.json.open[0].id).toBe('DEC-R2-010');
  });
});

describe('POST /api/decisions', () => {
  it('creates an open question', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'OPEN_QUESTION',
      priority: 'MEDIUM',
      scope: 'Phase 2',
      text: 'Should we add caching?',
    });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    expect(r.json.action).toBe('created_open_question');
    expect(r.json.id).toMatch(/^DEC-/);
  });

  it('creates an operational decision', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      priority: 'HIGH',
      scope: 'All sprints',
      text: 'Use file-based storage',
      notes: 'Per DEC-R2-006',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('created_decision');
  });

  it('answers an open question', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'answer',
      id: 'DEC-R2-010',
      answer: 'PostgreSQL',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('answered');
  });

  it('decides an open question', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'decide',
      id: 'DEC-R2-010',
      answer: 'PostgreSQL — confirmed',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('decided');
  });

  it('defers an item', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'defer',
      id: 'DEC-R2-010',
      reason: 'Waiting for feedback',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('deferred');
  });

  it('expires an item', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'expire',
      id: 'DEC-R2-010',
      reason: 'No longer relevant',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('expired');
  });

  it('reopens an item', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'reopen',
      id: 'DEC-R2-010',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('reopened');
  });

  it('edits a decision', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'edit',
      id: 'DEC-R2-010',
      text: 'Updated question text',
      notes: 'Updated notes',
    });
    expect(r.status).toBe(200);
    expect(r.json.action).toBe('edited');
  });

  it('rejects unknown action', async () => {
    const r = await req('POST', '/api/decisions', { action: 'fly' });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Unknown action');
  });

  it('rejects create with missing fields', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      // missing priority, scope, text
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Missing');
  });

  it('rejects create with invalid type', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'INVALID',
      priority: 'HIGH',
      scope: 'x',
      text: 'y',
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid type');
  });

  it('rejects create with invalid priority', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      priority: 'ULTRA',
      scope: 'x',
      text: 'y',
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid priority');
  });

  it('rejects answer with missing id', async () => {
    const r = await req('POST', '/api/decisions', { action: 'answer', answer: 'yes' });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Missing id');
  });

  it('rejects invalid decision ID format', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'answer',
      id: 'INVALID-FORMAT!!!',
      answer: 'yes',
    });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid decision ID');
  });

  it('warns on secret patterns in decision text', async () => {
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'OPEN_QUESTION',
      priority: 'LOW',
      scope: 'Test',
      text: 'Use key AKIAIOSFODNN7EXAMPLE?',
    });
    expect(r.status).toBe(200);
    expect(r.json.warnings).toBeDefined();
  });

  it('returns 404 when decisions.md missing', async () => {
    setStore(new InMemoryStore());
    _cache.invalidateAll();
    const r = await req('POST', '/api/decisions', {
      action: 'create',
      type: 'DECIDED',
      priority: 'HIGH',
      scope: 'x',
      text: 'y',
    });
    expect(r.status).toBe(404);
  });
});

/* ── Command API ──────────────────────────────────────────────── */

describe('POST /api/command', () => {
  it('queues a valid command', async () => {
    const r = await req('POST', '/api/command', {
      command: 'CREATE',
      project: 'TestProject',
      description: 'A test project',
    });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
    expect(r.json.clipboard_text).toContain('CREATE');
    expect(r.json.clipboard_text).toContain('TestProject');
  });

  it('rejects unknown command', async () => {
    const r = await req('POST', '/api/command', { command: 'FLY' });
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Unknown command');
  });

  it('saves project brief when provided', async () => {
    const r = await req('POST', '/api/command', {
      command: 'CREATE',
      project: 'BriefTest',
      brief: 'This is the full project brief content.',
    });
    expect(r.status).toBe(200);
    expect(r.json.brief_saved).toBe(true);
  });

  it('queues multi-word commands', async () => {
    const r = await req('POST', '/api/command', { command: 'CREATE BUSINESS' });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
  });

  it('appends to existing queue', async () => {
    // Pre-seed with an existing queue
    const store = seedStore();
    store.writeFile(COMMAND_QUEUE, JSON.stringify([{ command: 'AUDIT', status: 'DONE', requested_at: '2025-01-01T00:00:00Z' }]));
    setStore(store);
    _cache.invalidateAll();

    const r = await req('POST', '/api/command', { command: 'CREATE' });
    expect(r.status).toBe(200);
  });
});

describe('GET /api/command', () => {
  it('returns null when no queue exists', async () => {
    const r = await req('GET', '/api/command');
    expect(r.status).toBe(200);
    expect(r.json.command).toBeNull();
    expect(r.json.queue).toEqual([]);
  });

  it('returns latest command from queue', async () => {
    // First queue a command
    await req('POST', '/api/command', { command: 'REEVALUATE' });
    const r = await req('GET', '/api/command');
    expect(r.status).toBe(200);
    expect(r.json.command.command).toBe('REEVALUATE');
    expect(r.json.queue).toHaveLength(1);
  });
});

/* ── Progress API ─────────────────────────────────────────────── */

describe('GET /api/progress', () => {
  it('returns progress with active session', async () => {
    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    expect(r.json.active).toBe(true);
    expect(r.json.session.session_id).toBe('test-session');
    expect(r.json.phases).toHaveLength(7);
    expect(r.json.sprints.total).toBe(3);
    // PHASE-1 should be done
    const p1 = r.json.phases.find(p => p.key === 'PHASE-1');
    expect(p1.status).toBe('done');
    // PHASE-2 should be active
    const p2 = r.json.phases.find(p => p.key === 'PHASE-2');
    expect(p2.status).toBe('active');
  });

  it('returns inactive progress when no session', async () => {
    setStore(new InMemoryStore());
    _cache.invalidateAll();
    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    expect(r.json.active).toBe(false);
    expect(r.json.phases).toHaveLength(7);
  });
});

/* ── Export API ────────────────────────────────────────────────── */

describe('GET /api/export', () => {
  it('returns export bundle with session and queue', async () => {
    // Queue a command first so command_queue is populated
    await req('POST', '/api/command', { command: 'CREATE' });
    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    expect(r.json.exported_at).toBeDefined();
    expect(r.json.session.session_id).toBe('test-session');
    expect(r.json.command_queue.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty export when no state', async () => {
    setStore(new InMemoryStore());
    _cache.invalidateAll();
    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    expect(r.json.session).toBeNull();
  });
});

/* ── Help API ─────────────────────────────────────────────────── */

describe('GET /api/help', () => {
  it('returns table of contents when no topic', async () => {
    const r = await req('GET', '/api/help');
    expect(r.status).toBe(200);
    expect(r.json.toc).toBeDefined();
    expect(r.json.toc.length).toBeGreaterThan(0);
    expect(r.json.toc[0].slug).toBe('getting-started');
  });

  it('returns topic content for valid slug', async () => {
    const r = await req('GET', '/api/help?topic=getting-started');
    expect(r.status).toBe(200);
    expect(r.json.slug).toBe('getting-started');
    expect(r.json.content).toContain('Getting Started');
  });

  it('rejects invalid slug characters', async () => {
    const r = await req('GET', '/api/help?topic=../../etc/passwd');
    expect(r.status).toBe(400);
    expect(r.json.error).toContain('Invalid topic slug');
  });

  it('returns 404 for non-existent topic', async () => {
    const r = await req('GET', '/api/help?topic=nonexistent');
    expect(r.status).toBe(404);
    expect(r.json.error).toContain('not found');
  });
});
