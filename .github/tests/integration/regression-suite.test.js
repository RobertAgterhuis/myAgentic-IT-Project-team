'use strict';
/* Comprehensive Regression Test Suite — SP-R2-007-001
 * Verifies ALL features from Sprints 1-6 to ensure zero regressions.
 * Uses InMemoryStore for all data operations. */

const http = require('http');
const path = require('path');
const fs   = require('fs');
const { InMemoryStore, setStore } = require('../../webapp/store');
const { server, _cache, _metrics, _audit,
        sanitizeMarkdown, sanitizeQID, detectSecrets, safePath,
        setSecurityHeaders, recordMetric, computePercentiles,
        sseNotify, _sseClients } = require('../../webapp/server');
const models  = require('../../webapp/models');
const schemas = require('../../webapp/schemas');
const { FileCache } = require('../../webapp/cache');
const { errorResponse, statusToCode } = require('../../webapp/utils/errors');
const { formatSecretWarnings, attachSecretWarnings } = require('../../webapp/utils/secret-utils');
const { VALIDATION: V, RESPONSES: R, STATIC: S } = require('../../webapp/strings');

/* ── Test Infrastructure ──────────────────────────────────────── */

const WEBAPP_DIR    = path.resolve(__dirname, '../../webapp');
const PROJECT_ROOT  = path.resolve(WEBAPP_DIR, '..', '..');
const BUSINESS_DOCS = path.join(PROJECT_ROOT, 'BusinessDocs');
const GITHUB_DOCS   = path.join(PROJECT_ROOT, '.github', 'docs');
const SESSION_DIR   = path.join(GITHUB_DOCS, 'session');
const SESSION_FILE  = path.join(SESSION_DIR, 'session-state.json');
const DECISIONS_FILE = path.join(GITHUB_DOCS, 'decisions.md');
const HELP_DIR       = path.join(PROJECT_ROOT, '.github', 'help');
const ANALYTICS_FILE = path.join(GITHUB_DOCS, 'analytics-events.json');

let baseUrl;

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const opts = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers: {} };
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

### Q-05-002 [OPTIONAL]
**Question:** What is the expected user count?
**Why we need this:** Capacity planning.
**Expected format:** Number
**Example:** 500
**Your answer:**
> *(fill in here)*

## Answer Status

| Q-ID | Status | Last Updated |
|------|--------|--------------|
| Q-05-001 | OPEN | — |
| Q-05-002 | OPEN | — |
`;

const SESSION_STATE = {
  session_id: 'regression-test',
  cycle_type: 'COMBO_AUDIT',
  status: 'SPRINT-IN-PROGRESS',
  current_phase: 'PHASE-5',
  current_agent: '20-implementation-agent',
  current_step: 'Sprint 7 regression testing',
  initiated_at: '2026-03-08T00:00:00Z',
  last_updated: '2026-03-08T00:00:00Z',
  completed_phases: ['ONBOARDING', 'PHASE-2', 'PHASE-3'],
  completed_agents: ['25-onboarding-agent', '05-software-architect'],
  phase_outputs: {
    onboarding: '.github/docs/onboarding/onboarding-output.md',
    'phase-2': { '05': '.github/docs/phase-2/05-software-architect.md' },
  },
  sprint_backlog: {},
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
|----|-----------|-------|----------|-------|------|
| DEC-T-001 | HIGH | All phases | Use dual-mode | Test decision | 2025-01-01 |

### Reevaluation Decisions (DEC-R2 series)

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|----------|-------|------|
| DEC-R2-001 | HIGH | Phase 2 | Use PostgreSQL | Performance reasons | 2025-01-01 |

### Operational Decisions

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|----------|-------|------|
| DEC-102 | HIGH | Phase 2 | Use IaC | Best practice | 2025-01-01 |

---

## Deferred & Expired

---

## Change Log
| Date | Action | ID | By |
|------|--------|----|----|
`;

let store;

beforeAll(async () => {
  store = new InMemoryStore();
  setStore(store);
  _cache.invalidateAll();
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
  store = new InMemoryStore({
    [path.join(BUSINESS_DOCS, Q_FILE_REL)]: QUESTIONNAIRE_MD,
    [SESSION_FILE]: JSON.stringify(SESSION_STATE),
    [DECISIONS_FILE]: DECISIONS_MD,
    [path.join(HELP_DIR, 'getting-started.md')]: '# Getting Started\nWelcome.',
  });
  setStore(store);
  _cache.invalidateAll();
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 1 — SECURITY + FOUNDATION
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 1 Regression: Security', () => {
  it('sanitizeMarkdown escapes heading injection', () => {
    expect(sanitizeMarkdown('# Injected')).toBe('\\# Injected');
    expect(sanitizeMarkdown('## Double')).toBe('\\## Double');
  });

  it('sanitizeMarkdown escapes horizontal rules', () => {
    expect(sanitizeMarkdown('---')).toMatch(/\\---/);
  });

  it('sanitizeMarkdown escapes table pipe at line start', () => {
    expect(sanitizeMarkdown('| cell')).toBe('\\| cell');
  });

  it('sanitizeQID neutralizes fake Q-IDs', () => {
    const result = sanitizeQID('Q-05-001 is the answer');
    expect(result).not.toContain('Q-05-001');
    expect(result).toContain('\u2010'); // non-breaking hyphen
  });

  it('detectSecrets finds AWS keys', () => {
    expect(detectSecrets('key: AKIAIOSFODNN7EXAMPLE')).toContain('AWS Access Key');
  });

  it('detectSecrets finds GitHub tokens', () => {
    expect(detectSecrets('token: ghp_ABCDEFghijklmnopqrstuvwxyz123456789012')).toContain('GitHub Token');
  });

  it('detectSecrets finds private keys', () => {
    expect(detectSecrets('-----BEGIN RSA PRIVATE KEY-----')).toContain('Private Key');
  });

  it('detectSecrets returns empty for clean text', () => {
    expect(detectSecrets('just normal text here')).toHaveLength(0);
  });

  it('safePath blocks traversal', () => {
    expect(() => safePath('/base', '../../../etc/passwd')).toThrow();
  });

  it('safePath allows valid paths', () => {
    const result = safePath('/base', 'sub/file.txt');
    expect(result).toContain('sub');
  });

  it('security headers are set on all responses', async () => {
    const res = await req('GET', '/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['content-security-policy']).toBeTruthy();
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['permissions-policy']).toBeTruthy();
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
  });

  it('POST /api/save warns on secret patterns in answers', async () => {
    const res = await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'Q-05-001', answer: 'key: AKIAIOSFODNN7EXAMPLE', status: 'ANSWERED' }],
    });
    expect(res.status).toBe(200);
    expect(res.json.warnings).toBeDefined();
    expect(res.json.warnings[0]).toContain('AWS Access Key');
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 2 — ARCHITECTURE + DESIGN SYSTEM
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 2 Regression: Architecture', () => {
  it('Store abstraction: InMemoryStore reads and writes', () => {
    store.writeFile('/tmp/test.txt', 'hello');
    expect(store.readFile('/tmp/test.txt')).toBe('hello');
  });

  it('Store abstraction: exists returns false for missing', () => {
    expect(store.exists('/nonexistent/file.txt')).toBe(false);
  });

  it('Store abstraction: writeFile creates parent dirs', () => {
    store.writeFile('/a/b/c/file.txt', 'data');
    expect(store.exists('/a/b/c/file.txt')).toBe(true);
  });

  it('Cache returns cached content on same mtime', () => {
    const cache = new FileCache();
    expect(cache.read(path.join(BUSINESS_DOCS, Q_FILE_REL))).toContain('Software Architect');
    // Second read should be from cache
    expect(cache.read(path.join(BUSINESS_DOCS, Q_FILE_REL))).toContain('Software Architect');
    expect(cache.stats().hits).toBeGreaterThanOrEqual(1);
  });

  it('Cache invalidation forces re-read', () => {
    const cache = new FileCache();
    cache.read(path.join(BUSINESS_DOCS, Q_FILE_REL));
    cache.invalidate(path.join(BUSINESS_DOCS, Q_FILE_REL));
    cache.read(path.join(BUSINESS_DOCS, Q_FILE_REL));
    expect(cache.stats().misses).toBeGreaterThanOrEqual(2);
  });

  it('JSON schema validates session state', () => {
    const result = schemas.validateSessionState(SESSION_STATE);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('JSON schema rejects invalid session state', () => {
    const result = schemas.validateSessionState({ session_id: 123 });
    expect(result.valid).toBe(false);
  });

  it('JSON schema validates command entry', () => {
    const result = schemas.validateCommandEntry({
      command: 'CREATE', requested_at: '2026-01-01T00:00:00Z', status: 'PENDING',
    });
    expect(result.valid).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 3 — CODE QUALITY + TESTING
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 3 Regression: Code Quality', () => {
  it('models.parseQuestionnaire parses correctly', () => {
    const parsed = models.parseQuestionnaire(QUESTIONNAIRE_MD, Q_FILE_REL, BUSINESS_DOCS);
    expect(parsed.agent).toBe('Software Architect');
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0].id).toBe('Q-05-001');
  });

  it('models.updateAnswerInContent replaces placeholder', () => {
    const updated = models.updateAnswerInContent(QUESTIONNAIRE_MD, 'Q-05-001', 'Localhost', 'ANSWERED');
    expect(updated).toContain('Localhost');
  });

  it('models.parseDecisions parses open and decided', () => {
    const decisions = models.parseDecisions(DECISIONS_MD);
    expect(decisions.open).toHaveLength(1);
    expect(decisions.decided.length).toBeGreaterThanOrEqual(3);
    expect(decisions.open[0].id).toBe('DEC-R2-010');
    expect(decisions.decided.map(d => d.id)).toContain('DEC-R2-001');
  });

  it('models.nextDecisionId generates sequential IDs', () => {
    const nextId = models.nextDecisionId(DECISIONS_MD, 'DEC-R2-');
    expect(nextId).toMatch(/^DEC-R2-\d{3}$/);
    expect(parseInt(nextId.split('-').pop())).toBeGreaterThan(10);
  });

  it('error catalog has all expected codes', () => {
    const expectedCodes = [
      'VALIDATION_ERROR', 'FILE_NOT_FOUND', 'DECISIONS_NOT_FOUND',
      'INVALID_ACTION', 'UNKNOWN_COMMAND', 'NOT_FOUND', 'PATH_TRAVERSAL',
      'PAYLOAD_TOO_LARGE', 'INVALID_CONTENT_TYPE', 'INVALID_JSON',
      'INVALID_INPUT', 'METHOD_NOT_ALLOWED', 'INTERNAL_ERROR',
    ];
    for (const code of expectedCodes) {
      const err = errorResponse(code);
      expect(err.code).toBe(code);
      expect(err.message).toBeTruthy();
      expect(err.recovery).toBeTruthy();
    }
  });

  it('statusToCode maps standard HTTP codes', () => {
    expect(statusToCode(400)).toBe('VALIDATION_ERROR');
    expect(statusToCode(403)).toBe('PATH_TRAVERSAL');
    expect(statusToCode(404)).toBe('NOT_FOUND');
    expect(statusToCode(413)).toBe('PAYLOAD_TOO_LARGE');
    expect(statusToCode(500)).toBe('INTERNAL_ERROR');
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 4 — UX PATTERNS + REAL-TIME
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 4 Regression: SSE & Metrics', () => {
  it('GET /api/metrics returns expected shape', async () => {
    const res = await req('GET', '/api/metrics');
    expect(res.status).toBe(200);
    expect(res.json).toHaveProperty('uptime_seconds');
    expect(res.json).toHaveProperty('request_count');
    expect(res.json).toHaveProperty('error_count');
    expect(res.json).toHaveProperty('error_rate');
    expect(res.json).toHaveProperty('response_time_p50');
    expect(res.json).toHaveProperty('sse_connections');
    expect(res.json).toHaveProperty('cache_hit_ratio');
    expect(res.json).toHaveProperty('per_endpoint');
  });

  it('GET /api/health returns status ok with SSE count', async () => {
    const res = await req('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.json.status).toBe('ok');
    expect(res.json).toHaveProperty('sse_connections');
    expect(res.json).toHaveProperty('timestamp');
  });

  it('recordMetric increments counts', () => {
    const before = _metrics.requestCount;
    recordMetric('GET', '/test', 10, 200);
    expect(_metrics.requestCount).toBe(before + 1);
  });

  it('recordMetric tracks errors for 4xx/5xx', () => {
    const before = _metrics.errorCount;
    recordMetric('GET', '/fail', 5, 500);
    expect(_metrics.errorCount).toBe(before + 1);
  });

  it('computePercentiles returns zeroes for empty', () => {
    const p = computePercentiles([]);
    expect(p.p50).toBe(0);
    expect(p.p95).toBe(0);
    expect(p.p99).toBe(0);
  });

  it('computePercentiles computes for known data', () => {
    const data = Array.from({ length: 100 }, (_, i) => i + 1);
    const p = computePercentiles(data);
    expect(p.p50).toBe(50);
    expect(p.p95).toBe(95);
    expect(p.p99).toBe(99);
  });

  it('POST /api/analytics accepts valid events', async () => {
    const res = await req('POST', '/api/analytics', {
      events: [
        { event: 'page_view', properties: { page: 'questionnaires' } },
        { event: 'tab_switch', properties: { tab: 'decisions' } },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.json.accepted).toBe(2);
    expect(res.json.rejected).toBe(0);
  });

  it('POST /api/analytics rejects invalid event types', async () => {
    const res = await req('POST', '/api/analytics', {
      events: [{ event: 'invalid_event' }],
    });
    expect(res.status).toBe(200);
    expect(res.json.accepted).toBe(0);
    expect(res.json.rejected).toBe(1);
  });

  it('GET /api/analytics returns stored events', async () => {
    // Ensure analytics file exists
    store.writeFile(ANALYTICS_FILE, JSON.stringify([
      { event: 'page_view', properties: {}, timestamp: '2026-01-01T00:00:00Z' },
    ]));
    _cache.invalidateAll();
    const res = await req('GET', '/api/analytics');
    expect(res.status).toBe(200);
    expect(res.json.events).toHaveLength(1);
  });

  it('strings module exports all expected keys', () => {
    expect(V.UPDATES_RANGE).toBeTruthy();
    expect(V.EVENTS_RANGE).toBeTruthy();
    expect(V.MISSING_CREATE_FIELDS).toBeTruthy();
    expect(R.reevaluateTrigger('ALL')).toContain('REEVALUATE');
    expect(R.commandQueued('test')).toContain('test');
    expect(S.NOT_FOUND).toBe('Not found');
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 5 — ACCESSIBILITY + CONTENT
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 5 Regression: Accessibility', () => {
  let htmlContent;

  beforeAll(() => {
    const htmlPath = path.join(WEBAPP_DIR, 'index.html');
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  it('HTML has lang attribute on <html>', () => {
    expect(htmlContent).toMatch(/<html[^>]+lang="en"/);
  });

  it('HTML has <meta charset="utf-8">', () => {
    expect(htmlContent).toMatch(/<meta\s+charset="[uU][tT][fF]-8"/i);
  });

  it('HTML has viewport meta tag', () => {
    expect(htmlContent).toMatch(/<meta\s+name="viewport"/);
  });

  it('skip-to-content link present', () => {
    expect(htmlContent).toMatch(/class="skip-nav"/);
  });

  it('main landmark has id="main"', () => {
    expect(htmlContent).toMatch(/id="main"/);
  });

  it('prefers-reduced-motion media query present', () => {
    expect(htmlContent).toMatch(/prefers-reduced-motion/);
  });

  it('focus-visible styles defined', () => {
    expect(htmlContent).toMatch(/focus-visible/);
  });

  it('aria-live region present for announcements', () => {
    expect(htmlContent).toMatch(/aria-live/);
  });

  it('role="alert" used for error messages', () => {
    expect(htmlContent).toMatch(/role="alert"/i);
  });

  it('tabindex management for modal dialogs', () => {
    expect(htmlContent).toMatch(/tabindex/);
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 6 — VALIDATION + INTEGRATION
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 6 Regression: Integration & Backup', () => {
  it('InMemoryStore creates backups on overwrite', () => {
    store.writeFile('/test/backup.txt', 'version1');
    store.writeFile('/test/backup.txt', 'version2');
    const backups = store._backups.get(path.resolve('/test/backup.txt'));
    expect(backups).toBeDefined();
    expect(backups.length).toBeGreaterThanOrEqual(1);
    expect(backups[0].data).toBe('version1');
  });

  it('POST /api/save round-trip persists answer', async () => {
    const saveRes = await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'Q-05-001', answer: 'Localhost deployment', status: 'ANSWERED' }],
    });
    expect(saveRes.status).toBe(200);
    expect(saveRes.json.ok).toBe(true);

    // Verify persistence
    const content = store.readFile(path.join(BUSINESS_DOCS, Q_FILE_REL));
    expect(content).toContain('Localhost deployment');
  });

  it('decision create + answer + decide round-trip', async () => {
    // Create
    const createRes = await req('POST', '/api/decisions', {
      action: 'create', type: 'OPEN_QUESTION', priority: 'HIGH', scope: 'TECH', text: 'Regression test Q?',
    });
    expect(createRes.status).toBe(200);
    const id = createRes.json.id;

    // Answer
    const ansRes = await req('POST', '/api/decisions', { action: 'answer', id, answer: 'Yes, confirmed.' });
    expect(ansRes.status).toBe(200);

    // Decide
    const decRes = await req('POST', '/api/decisions', { action: 'decide', id, answer: 'Final: yes.' });
    expect(decRes.status).toBe(200);
  });

  it('GET /api/export includes session and queue data', async () => {
    const res = await req('GET', '/api/export');
    expect(res.status).toBe(200);
    expect(res.json).toHaveProperty('session');
    expect(res.json).toHaveProperty('command_queue');
    expect(res.json).toHaveProperty('exported_at');
  });

  it('GET /api/progress returns phase structure', async () => {
    const res = await req('GET', '/api/progress');
    expect(res.status).toBe(200);
    expect(res.json.phases).toBeDefined();
    expect(res.json.phases.length).toBe(7); // 7 phase groups
    // Verify phase labels
    const labels = res.json.phases.map(p => p.key);
    expect(labels).toContain('ONBOARDING');
    expect(labels).toContain('PHASE-2');
    expect(labels).toContain('PHASE-5');
  });

  it('secret-utils formats warnings correctly', () => {
    const formatted = formatSecretWarnings(['AWS Access Key', 'GitHub Token']);
    expect(formatted).toHaveLength(1);
    expect(formatted[0]).toContain('AWS Access Key');
    expect(formatted[0]).toContain('GitHub Token');
  });

  it('secret-utils returns empty for no warnings', () => {
    expect(formatSecretWarnings([])).toHaveLength(0);
    expect(formatSecretWarnings(null)).toHaveLength(0);
  });

  it('attachSecretWarnings mutates response', () => {
    const resp = { ok: true };
    attachSecretWarnings(resp, ['test']);
    expect(resp.warnings).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * SPRINT 7 — NEW: AUDIT TRAIL
 * ═══════════════════════════════════════════════════════════════════ */

describe('Sprint 7 Regression: Audit Trail', () => {
  it('GET /api/audit returns entries with limit param', async () => {
    // Trigger some mutations first to generate audit entries
    await req('POST', '/api/save', {
      file: Q_FILE_REL,
      updates: [{ questionId: 'Q-05-001', answer: 'Audit trail test', status: 'ANSWERED' }],
    });
    const res = await req('GET', '/api/audit?limit=10');
    expect(res.status).toBe(200);
    expect(res.json).toHaveProperty('entries');
    expect(res.json).toHaveProperty('total');
    expect(res.json).toHaveProperty('limit');
  });

  it('GET /api/audit defaults to limit=50', async () => {
    const res = await req('GET', '/api/audit');
    expect(res.status).toBe(200);
    expect(res.json.limit).toBe(50);
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * CROSS-CUTTING REGRESSION
 * ═══════════════════════════════════════════════════════════════════ */

describe('Cross-cutting Regression', () => {
  it('404 for unknown API path', async () => {
    const res = await req('GET', '/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.json.code).toBe('NOT_FOUND');
  });

  it('405 for wrong method on existing path', async () => {
    const res = await req('DELETE', '/api/session');
    expect(res.status).toBe(405);
  });

  it('GET /api/help returns table of contents', async () => {
    const res = await req('GET', '/api/help');
    expect(res.status).toBe(200);
    expect(res.json.toc).toBeDefined();
    expect(res.json.toc.length).toBeGreaterThan(0);
  });

  it('GET /api/help?topic=getting-started returns content', async () => {
    const res = await req('GET', '/api/help?topic=getting-started');
    expect(res.status).toBe(200);
    expect(res.json.content).toContain('Getting Started');
  });

  it('GET /api/help rejects invalid slug', async () => {
    const res = await req('GET', '/api/help?topic=../secrets');
    expect(res.status).toBe(400);
  });

  it('POST /api/command queues valid command', async () => {
    const res = await req('POST', '/api/command', { command: 'AUDIT TECH' });
    expect(res.status).toBe(200);
    expect(res.json.ok).toBe(true);
    expect(res.json.clipboard_text).toContain('AUDIT TECH');
  });

  it('POST /api/command rejects unknown command', async () => {
    const res = await req('POST', '/api/command', { command: 'INVALID COMMAND' });
    expect(res.status).toBe(400);
  });

  it('GET /api/command returns queue', async () => {
    // Post a command first
    await req('POST', '/api/command', { command: 'CONTINUE' });
    const res = await req('GET', '/api/command');
    expect(res.status).toBe(200);
    expect(res.json).toHaveProperty('queue');
    expect(res.json).toHaveProperty('command');
  });

  it('POST /api/reevaluate writes trigger', async () => {
    const res = await req('POST', '/api/reevaluate', { scope: 'TECH' });
    expect(res.status).toBe(200);
    expect(res.json.scope).toBe('TECH');
  });

  it('Cache readJSON validates with schema', () => {
    const cache = new FileCache();
    const { data, errors } = cache.readJSON(SESSION_FILE, schemas.validateSessionState);
    expect(data).toBeTruthy();
    expect(errors).toBeNull();
  });

  it('Cache readJSON reports invalid JSON', () => {
    store.writeFile('/test/bad.json', '{invalid json}');
    const cache = new FileCache();
    const { data, errors } = cache.readJSON('/test/bad.json');
    expect(data).toBeNull();
    expect(errors).toBeTruthy();
    expect(errors[0]).toContain('Invalid JSON');
  });
});
