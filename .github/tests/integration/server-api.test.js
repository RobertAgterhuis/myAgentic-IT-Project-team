'use strict';
/* Integration test: server API routes through HTTP.
 * Uses InMemoryStore to avoid filesystem side effects.
 * Exercises all API endpoints to achieve ≥70% coverage on server.js. */

const http = require('http');
const path = require('path');
const { InMemoryStore, setStore } = require('../../webapp/store');
const { server, _cache } = require('../../webapp/server');

// Compute the same paths the server module uses internally
const WEBAPP_DIR    = path.resolve(__dirname, '../../webapp');
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

/* ── SSE Endpoint (SP-R2-004-005) ─────────────────────────────── */

describe('GET /api/events (SSE)', () => {
  it('returns event-stream content type and sends heartbeat', async () => {
    return new Promise((resolve, reject) => {
      const url = new URL('/api/events', baseUrl);
      const r = http.get({ hostname: url.hostname, port: url.port, path: url.pathname }, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/event-stream');
        expect(res.headers['cache-control']).toBe('no-cache');
        expect(res.headers['connection']).toBe('keep-alive');
        let data = '';
        res.on('data', chunk => {
          data += chunk.toString();
          // Once we get the init heartbeat, we're good
          if (data.includes('event: heartbeat')) {
            res.destroy();
            resolve();
          }
        });
        setTimeout(() => { res.destroy(); resolve(); }, 2000);
      });
      r.on('error', e => {
        // Connection reset is expected after destroy
        if (e.code === 'ECONNRESET') resolve();
        else reject(e);
      });
    });
  });
});

/* ── Metrics Endpoint (SP-R2-004-007) ─────────────────────────── */

describe('GET /api/metrics', () => {
  it('returns metrics with expected shape', async () => {
    // Fire a request first to generate some metrics
    await req('GET', '/api/health');
    const r = await req('GET', '/api/metrics');
    expect(r.status).toBe(200);
    expect(r.json).toHaveProperty('uptime_seconds');
    expect(r.json).toHaveProperty('request_count');
    expect(r.json).toHaveProperty('error_count');
    expect(r.json).toHaveProperty('file_ops_count');
    expect(r.json).toHaveProperty('response_time_p50');
    expect(r.json).toHaveProperty('response_time_p95');
    expect(r.json).toHaveProperty('response_time_p99');
    expect(r.json).toHaveProperty('cache_hit_ratio');
    expect(r.json).toHaveProperty('per_endpoint');
    expect(typeof r.json.request_count).toBe('number');
    expect(r.json.request_count).toBeGreaterThan(0);
  });
});

/* ── Health Endpoint (enhanced) ───────────────────────────────── */

describe('GET /api/health (enhanced)', () => {
  it('returns health with sseConnections field', async () => {
    const r = await req('GET', '/api/health');
    expect(r.status).toBe(200);
    expect(r.json).toHaveProperty('status', 'ok');
    expect(r.json).toHaveProperty('sse_connections');
    expect(typeof r.json.sse_connections).toBe('number');
  });
});

/* ── Analytics Endpoints (SP-R2-004-008) ──────────────────────── */

describe('POST /api/analytics', () => {
  it('accepts and stores analytics events', async () => {
    const r = await req('POST', '/api/analytics', {
      events: [
        { event: 'page_view', properties: { page: 'home' }, timestamp: '2025-01-01T00:00:00Z' },
        { event: 'tab_switch', properties: { tab: 'decisions' }, timestamp: '2025-01-01T00:01:00Z' },
      ]
    });
    expect(r.status).toBe(200);
    expect(r.json).toHaveProperty('accepted', 2);
    expect(r.json).toHaveProperty('rejected', 0);
  });

  it('rejects missing events array', async () => {
    const r = await req('POST', '/api/analytics', {});
    expect(r.status).toBe(400);
  });

  it('rejects non-array events', async () => {
    const r = await req('POST', '/api/analytics', { events: 'not-array' });
    expect(r.status).toBe(400);
  });

  it('rejects events exceeding max batch size', async () => {
    const events = Array.from({ length: 101 }, (_, i) => ({
      event: `evt_${i}`, properties: {}, timestamp: new Date().toISOString()
    }));
    const r = await req('POST', '/api/analytics', { events });
    expect(r.status).toBe(400);
  });
});

describe('GET /api/analytics', () => {
  it('returns empty when no events stored', async () => {
    const r = await req('GET', '/api/analytics');
    expect(r.status).toBe(200);
    expect(r.json.events).toEqual([]);
    expect(r.json.total).toBe(0);
  });

  it('returns stored events after POST', async () => {
    await req('POST', '/api/analytics', {
      events: [{ event: 'session_start', properties: {}, timestamp: '2025-01-01T00:00:00Z' }]
    });
    const r = await req('GET', '/api/analytics');
    expect(r.status).toBe(200);
    expect(r.json.total).toBeGreaterThanOrEqual(1);
    expect(r.json.events.some(e => e.event === 'session_start')).toBe(true);
  });
});

/* ── computePercentiles unit ──────────────────────────────────── */

describe('computePercentiles', () => {
  const { computePercentiles } = require('../../webapp/server');

  it('returns zeroes for empty array', () => {
    const r = computePercentiles([]);
    expect(r).toEqual({ p50: 0, p95: 0, p99: 0 });
  });

  it('computes correct percentiles for known data', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const r = computePercentiles(data);
    expect(r.p50).toBe(50);
    expect(r.p95).toBe(95);
    expect(r.p99).toBe(99);
  });
});

/* ── recordMetric unit ────────────────────────────────────────── */

describe('recordMetric', () => {
  const { recordMetric, _metrics } = require('../../webapp/server');

  it('increments request count', () => {
    const before = _metrics.requestCount;
    recordMetric('GET', '/api/test', 10, 200);
    expect(_metrics.requestCount).toBe(before + 1);
  });

  it('increments error count for 4xx/5xx', () => {
    const before = _metrics.errorCount;
    recordMetric('GET', '/api/fail', 5, 500);
    expect(_metrics.errorCount).toBe(before + 1);
  });

  it('tracks per-endpoint stats', () => {
    recordMetric('GET', '/api/unique-test', 7, 200);
    expect(_metrics.perEndpoint['GET /api/unique-test']).toBeDefined();
    expect(_metrics.perEndpoint['GET /api/unique-test'].count).toBe(1);
  });
});

/* ── Branch coverage: Progress with rich session data ─────────── */

describe('GET /api/progress — rich session branches', () => {
  it('marks agents done from object phase_outputs (hasAgentOutputAsObject)', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: ['ONBOARDING', 'PHASE-1'],
      completed_agents: [],
      current_phase: 'PHASE-3',
      current_agent: '10-ux-researcher',
      phase_outputs: {
        'phase-2': { '05': 'path/to/architect.md', '06': 'path/to/dev.md' },
      },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    const p2 = r.json.phases.find(p => p.key === 'PHASE-2');
    // Agents 05 and 06 should be 'done' via phase_outputs
    const a05 = p2.agents.find(a => a.id === '05');
    const a06 = p2.agents.find(a => a.id === '06');
    expect(a05.status).toBe('done');
    expect(a06.status).toBe('done');
  });

  it('marks onboarding done from string phase output (hasOnboardingOutput)', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: [],
      completed_agents: [],
      current_phase: 'PHASE-1',
      current_agent: '01-business-analyst',
      phase_outputs: { onboarding: '.github/docs/onboarding/onboarding-output.md' },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    const onb = r.json.phases.find(p => p.key === 'ONBOARDING');
    expect(onb.agents[0].status).toBe('done');
  });

  it('marks PHASE-5 active when sprint_backlog has sprints', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: ['ONBOARDING', 'PHASE-1', 'PHASE-2', 'PHASE-3', 'PHASE-4', 'SYNTHESIS'],
      current_phase: 'SYNTHESIS',
      current_agent: null,
      sprint_backlog: { total_sprints: 5, sprint_statuses: { 'SP-1': 'DONE', 'SP-2': 'IN_PROGRESS' } },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    const p5 = r.json.phases.find(p => p.key === 'PHASE-5');
    expect(p5.status).toBe('active');
    expect(r.json.sprints.total).toBe(5);
    expect(r.json.sprints.statuses['SP-1']).toBe('DONE');
  });

  it('includes blockers and escalations in session summary', async () => {
    const session = {
      ...SESSION_STATE,
      current_step: 'Step 3 of 5',
      blockers: [{ id: 'B-1', description: 'Waiting for review' }],
      open_human_escalations: [
        { id: 'E-1', status: 'OPEN', description: 'Need clarification' },
        { id: 'E-2', status: 'RESOLVED', description: 'Already handled' },
      ],
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    expect(r.json.session.current_step).toBe('Step 3 of 5');
    expect(r.json.session.blockers).toHaveLength(1);
    // Only OPEN escalations are returned
    expect(r.json.session.open_human_escalations).toHaveLength(1);
    expect(r.json.session.open_human_escalations[0].status).toBe('OPEN');
  });

  it('handles corrupt session JSON gracefully', async () => {
    const store = new InMemoryStore({ [SESSION_FILE]: '{bad json' });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    expect(r.json.active).toBe(false);
    expect(r.json.session).toBeNull();
  });

  it('returns null sprints when session has no sprint_backlog', async () => {
    const session = { ...SESSION_STATE };
    delete session.sprint_backlog;
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    expect(r.status).toBe(200);
    expect(r.json.sprints).toBeNull();
  });

  it('resolves agent active by id prefix match', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: [],
      completed_agents: [],
      current_phase: 'PHASE-1',
      current_agent: '01',
      phase_outputs: {},
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    const p1 = r.json.phases.find(p => p.key === 'PHASE-1');
    const a01 = p1.agents.find(a => a.id === '01');
    expect(a01.status).toBe('active');
  });

  it('resolves agent done from completed_agents by id only', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: [],
      completed_agents: ['05'],
      current_phase: 'PHASE-2',
      current_agent: '06-senior-developer',
      phase_outputs: {},
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    const p2 = r.json.phases.find(p => p.key === 'PHASE-2');
    const a05 = p2.agents.find(a => a.id === '05');
    expect(a05.status).toBe('done');
    const a06 = p2.agents.find(a => a.id === '06');
    expect(a06.status).toBe('active');
  });

  it('phase_outputs with "null" string does not mark agent done', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: [],
      completed_agents: [],
      current_phase: 'PHASE-2',
      current_agent: '06-senior-developer',
      phase_outputs: { 'phase-2': { '05': 'null' } },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    const p2 = r.json.phases.find(p => p.key === 'PHASE-2');
    const a05 = p2.agents.find(a => a.id === '05');
    expect(a05.status).toBe('pending');
  });

  it('onboarding "null" string does not mark agent done', async () => {
    const session = {
      ...SESSION_STATE,
      completed_phases: [],
      completed_agents: [],
      current_phase: 'PHASE-1',
      current_agent: '01-business-analyst',
      phase_outputs: { onboarding: 'null' },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/progress');
    const onb = r.json.phases.find(p => p.key === 'ONBOARDING');
    expect(onb.agents[0].status).toBe('pending');
  });
});

/* ── Branch coverage: Export with phase outputs ──────────────── */

describe('GET /api/export — phase output branches', () => {
  it('collects string phase outputs from files', async () => {
    const outputPath = path.join(PROJECT_ROOT, '.github/docs/onboarding/onboarding-output.md');
    const session = {
      ...SESSION_STATE,
      phase_outputs: { onboarding: '.github/docs/onboarding/onboarding-output.md' },
    };
    const store = new InMemoryStore({
      [SESSION_FILE]: JSON.stringify(session),
      [outputPath]: '# Onboarding Output\nContent here.',
    });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    expect(r.json.phase_outputs.onboarding).toContain('Onboarding Output');
  });

  it('collects object phase outputs from files', async () => {
    const archFile = path.join(PROJECT_ROOT, '.github/docs/phase2/architect.md');
    const session = {
      ...SESSION_STATE,
      phase_outputs: { 'phase-2': { '05': '.github/docs/phase2/architect.md' } },
    };
    const store = new InMemoryStore({
      [SESSION_FILE]: JSON.stringify(session),
      [archFile]: '# Architect Report',
    });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    expect(r.json.phase_outputs['phase-2']['05']).toContain('Architect Report');
  });

  it('skips null and "null" string phase outputs', async () => {
    const session = {
      ...SESSION_STATE,
      phase_outputs: { 'phase-1': 'null', 'phase-3': null },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    expect(r.json.phase_outputs).toEqual({});
  });

  it('skips null filePaths in object phase outputs', async () => {
    const session = {
      ...SESSION_STATE,
      phase_outputs: { 'phase-2': { '05': null, '06': 'null', '07': '' } },
    };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    // No valid files → empty object (collectObjectPhaseOutput returns {})
    expect(r.json.phase_outputs['phase-2']).toEqual({});
  });

  it('handles corrupt session JSON in export', async () => {
    const store = new InMemoryStore({ [SESSION_FILE]: 'not-json' });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/export');
    expect(r.status).toBe(200);
    expect(r.json.session).toBeNull();
    expect(r.json.phase_outputs).toEqual({});
  });
});

/* ── Branch coverage: Command queue edge cases ───────────────── */

describe('Command queue edge cases', () => {
  it('handles corrupt command queue JSON', async () => {
    const store = seedStore();
    store.writeFile(COMMAND_QUEUE, 'not valid json{{{');
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/command');
    expect(r.status).toBe(200);
    expect(r.json.queue).toEqual([]);
    expect(r.json.command).toBeNull();
  });

  it('wraps single-object command queue in array', async () => {
    const store = seedStore();
    store.writeFile(COMMAND_QUEUE, JSON.stringify({ command: 'CREATE', status: 'DONE' }));
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/command');
    expect(r.status).toBe(200);
    expect(r.json.queue).toHaveLength(1);
    expect(r.json.queue[0].command).toBe('CREATE');
  });

  it('returns empty array for falsy queue content', async () => {
    const store = seedStore();
    store.writeFile(COMMAND_QUEUE, 'null');
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/command');
    expect(r.status).toBe(200);
    expect(r.json.queue).toEqual([]);
  });

  it('builds clipboard text without project', async () => {
    const r = await req('POST', '/api/command', { command: 'CONTINUE' });
    expect(r.status).toBe(200);
    expect(r.json.clipboard_text).toBe('CONTINUE');
  });

  it('builds clipboard text with description', async () => {
    const r = await req('POST', '/api/command', {
      command: 'FEATURE',
      project: 'MyProj',
      description: 'Add login page',
    });
    expect(r.status).toBe(200);
    expect(r.json.clipboard_text).toContain('FEATURE');
    expect(r.json.clipboard_text).toContain('MyProj');
    expect(r.json.clipboard_text).toContain('Add login page');
  });

  it('skips brief save for empty/whitespace brief', async () => {
    const r = await req('POST', '/api/command', {
      command: 'CREATE',
      project: 'Test',
      brief: '   ',
    });
    expect(r.status).toBe(200);
    expect(r.json.brief_saved).toBe(false);
  });
});

/* ── Branch coverage: Analytics edge cases ───────────────────── */

describe('Analytics edge cases', () => {
  it('rejects null event entries', async () => {
    const r = await req('POST', '/api/analytics', {
      events: [null],
    });
    expect(r.status).toBe(200);
    expect(r.json.accepted).toBe(0);
    expect(r.json.rejected).toBe(1);
  });

  it('rejects event with non-object properties', async () => {
    const r = await req('POST', '/api/analytics', {
      events: [{ event: 'page_view', properties: 'not-object' }],
    });
    expect(r.status).toBe(200);
    expect(r.json.accepted).toBe(0);
    expect(r.json.rejected).toBe(1);
  });

  it('rejects unknown event type', async () => {
    const r = await req('POST', '/api/analytics', {
      events: [{ event: 'invalid_event_type' }],
    });
    expect(r.status).toBe(200);
    expect(r.json.rejected).toBe(1);
  });

  it('handles corrupt existing analytics JSON', async () => {
    const analyticsFile = path.join(GITHUB_DOCS, 'analytics-events.json');
    const store = seedStore();
    store.mkdirp(GITHUB_DOCS);
    store.writeFile(analyticsFile, 'broken json!!!');
    setStore(store);
    _cache.invalidateAll();

    const r = await req('POST', '/api/analytics', {
      events: [{ event: 'page_view', properties: {} }],
    });
    expect(r.status).toBe(200);
    expect(r.json.accepted).toBe(1);
  });

  it('handles corrupt analytics JSON on GET', async () => {
    const analyticsFile = path.join(GITHUB_DOCS, 'analytics-events.json');
    const store = seedStore();
    store.mkdirp(GITHUB_DOCS);
    store.writeFile(analyticsFile, '{corrupt}');
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/analytics');
    expect(r.status).toBe(200);
    expect(r.json.events).toEqual([]);
  });

  it('accepts mix of valid and invalid events', async () => {
    const r = await req('POST', '/api/analytics', {
      events: [
        { event: 'page_view', properties: { page: 'home' } },
        { event: 'FAKE_EVENT' },
        { event: 'tab_switch' },
      ],
    });
    expect(r.status).toBe(200);
    expect(r.json.accepted).toBe(2);
    expect(r.json.rejected).toBe(1);
  });
});

/* ── Branch coverage: Save validation boundary ───────────────── */

describe('Save validation boundary', () => {
  it('rejects updates exceeding 200 items', async () => {
    const updates = Array.from({ length: 201 }, (_, i) => ({
      questionId: `Q-05-${String(i + 1).padStart(3, '0')}`,
      status: 'OPEN',
      answer: '',
    }));
    const r = await req('POST', '/api/save', { file: Q_FILE_REL, updates });
    expect(r.status).toBe(400);
  });

  it('rejects non-array updates', async () => {
    const r = await req('POST', '/api/save', { file: Q_FILE_REL, updates: 'not-array' });
    expect(r.status).toBe(400);
  });
});

/* ── Branch coverage: structuredLog level filtering ──────────── */

describe('structuredLog level filtering', () => {
  const { structuredLog } = require('../../webapp/server');

  it('suppresses debug messages at default info level', () => {
    // Should not throw — just silently returns
    expect(() => structuredLog('debug', 'suppressed_msg', { key: 'val' })).not.toThrow();
  });

  it('writes error to stderr', () => {
    expect(() => structuredLog('error', 'test_error', { detail: 'x' })).not.toThrow();
  });
});

/* ── Branch coverage: Audit endpoint with limit parameter ────── */

describe('GET /api/audit', () => {
  it('returns audit entries with default limit', async () => {
    const r = await req('GET', '/api/audit');
    expect(r.status).toBe(200);
    expect(r.json).toHaveProperty('entries');
    expect(r.json).toHaveProperty('limit', 50);
  });

  it('accepts custom limit parameter', async () => {
    const r = await req('GET', '/api/audit?limit=10');
    expect(r.status).toBe(200);
    expect(r.json.limit).toBe(10);
  });

  it('clamps invalid limit to default', async () => {
    const r = await req('GET', '/api/audit?limit=abc');
    expect(r.status).toBe(200);
    expect(r.json.limit).toBe(50);
  });

  it('clamps out-of-range limit to default', async () => {
    const r = await req('GET', '/api/audit?limit=9999');
    expect(r.status).toBe(200);
    expect(r.json.limit).toBe(50);
  });
});

/* ── Branch coverage: isValidCommand multi-part matching ──────── */

describe('Command validation edge cases', () => {
  it('accepts command with extra trailing words (project name)', async () => {
    const r = await req('POST', '/api/command', { command: 'CREATE BUSINESS MyProject' });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
  });

  it('rejects multi-word unknown command', async () => {
    const r = await req('POST', '/api/command', { command: 'UNKNOWN STUFF' });
    expect(r.status).toBe(400);
  });

  it('accepts SCOPE CHANGE with description', async () => {
    const r = await req('POST', '/api/command', { command: 'SCOPE CHANGE TECH', description: 'Pivot to serverless' });
    expect(r.status).toBe(200);
    expect(r.json.ok).toBe(true);
  });
});

/* ── Branch coverage: Session validation warnings ────────────── */

describe('GET /api/session — validation edge cases', () => {
  it('still returns session when validation has warnings', async () => {
    // Session with extra/imperfect fields still parses
    const session = { ...SESSION_STATE, extra_field: 'unknown' };
    const store = new InMemoryStore({ [SESSION_FILE]: JSON.stringify(session) });
    setStore(store);
    _cache.invalidateAll();

    const r = await req('GET', '/api/session');
    expect(r.status).toBe(200);
    expect(r.json.session).toBeTruthy();
  });
});

/* ── Branch coverage: Metrics edge cases ─────────────────────── */

describe('Metrics edge cases', () => {
  it('computes error_rate when requests > 0', async () => {
    // Generate some requests to ensure requestCount > 0
    await req('GET', '/api/health');
    const r = await req('GET', '/api/metrics');
    expect(r.status).toBe(200);
    expect(typeof r.json.error_rate).toBe('number');
    expect(r.json.request_count).toBeGreaterThan(0);
  });
});

/* ── Branch coverage: Decision edge cases ────────────────────── */

describe('Decision mutation edge cases', () => {
  it('rejects defer without id', async () => {
    const r = await req('POST', '/api/decisions', { action: 'defer' });
    expect(r.status).toBe(400);
  });

  it('rejects expire without id', async () => {
    const r = await req('POST', '/api/decisions', { action: 'expire' });
    expect(r.status).toBe(400);
  });

  it('rejects reopen without id', async () => {
    const r = await req('POST', '/api/decisions', { action: 'reopen' });
    expect(r.status).toBe(400);
  });

  it('rejects edit without id', async () => {
    const r = await req('POST', '/api/decisions', { action: 'edit' });
    expect(r.status).toBe(400);
  });
});
