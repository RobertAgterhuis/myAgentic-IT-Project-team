#!/usr/bin/env node
// Copyright (c) 2026 Robert Agterhuis. MIT License.
// Questionnaire Manager — Local API server
// Zero external dependencies. Requires Node.js 14+.
'use strict';

const http = require('http');
const path = require('path');
const { getStore }    = require('./store');
const { FileCache }   = require('./cache');
const schemas         = require('./schemas');
const models          = require('./models');
const { attachSecretWarnings } = require('./utils/secret-utils');
const { errorResponse, statusToCode } = require('./utils/errors');
const { AuditTrail }  = require('./audit');
const { VALIDATION: V, RESPONSES: R, STATIC: S } = require('./strings');

const _cache = new FileCache();

/* ── SSE Client Registry (SP-R2-004-005) ──────────────────────── */
const _sseClients = new Set();

/**
 * Broadcast a Server-Sent Event to all connected clients.
 * @param {string} eventType - SSE event name (e.g. 'file_change', 'progress').
 * @param {object} data - Payload to JSON-serialize into the event.
 */
function sseNotify(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of _sseClients) {
    try { client.write(payload); } catch { _sseClients.delete(client); }
  }
}

/* ── Metrics Collector (SP-R2-004-007) ────────────────────────── */
const _metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimes: [],          // keep last 1000 entries
  fileOpsCount: 0,
  startedAt: Date.now(),
  perEndpoint: {},            // { "GET /api/foo": { count, times[] } }
};
const METRICS_MAX_SAMPLES = 1000;

/**
 * Record an HTTP request metric for observability.
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {string} pathname - Request path.
 * @param {number} durationMs - Response time in milliseconds.
 * @param {number} statusCode - HTTP response status code.
 */
function recordMetric(method, pathname, durationMs, statusCode) {
  _metrics.requestCount++;
  if (statusCode >= 400) _metrics.errorCount++;
  _metrics.responseTimes.push(durationMs);
  if (_metrics.responseTimes.length > METRICS_MAX_SAMPLES) _metrics.responseTimes.shift();
  const key = `${method} ${pathname}`;
  if (!_metrics.perEndpoint[key]) _metrics.perEndpoint[key] = { count: 0, times: [] };
  const ep = _metrics.perEndpoint[key];
  ep.count++;
  ep.times.push(durationMs);
  if (ep.times.length > METRICS_MAX_SAMPLES) ep.times.shift();
}

/**
 * Compute a percentile value from a pre-sorted array.
 * @param {number[]} sorted - Sorted numeric array.
 * @param {number} p - Percentile (0–100).
 * @returns {number} The value at the given percentile.
 */
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(p / 100 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Compute p50, p95, and p99 percentiles from response time samples.
 * @param {number[]} times - Unsorted array of response times in ms.
 * @returns {{ p50: number, p95: number, p99: number }}
 */
function computePercentiles(times) {
  const sorted = [...times].sort((a, b) => a - b);
  return { p50: percentile(sorted, 50), p95: percentile(sorted, 95), p99: percentile(sorted, 99) };
}

/* ── Analytics Store (SP-R2-004-008) ──────────────────────────── */
const ANALYTICS_MAX_EVENTS = 5000;

/* ── Configuration ────────────────────────────────────────────── */

const PORT          = (() => { const p = parseInt(process.env.PORT, 10); return (p >= 1 && p <= 65535) ? p : 3000; })();
const HOST          = '127.0.0.1';
const WEBAPP_DIR    = __dirname;
const PROJECT_ROOT  = path.resolve(WEBAPP_DIR, '..', '..');
const BUSINESS_DOCS = path.join(PROJECT_ROOT, 'BusinessDocs');
const GITHUB_DOCS   = path.join(PROJECT_ROOT, '.github', 'docs');
const SESSION_DIR   = path.join(GITHUB_DOCS, 'session');
const SESSION_FILE  = path.join(SESSION_DIR, 'session-state.json');
const Q_INDEX_FILE  = path.join(BUSINESS_DOCS, 'questionnaire-index.md');
const DECISIONS_FILE = path.join(GITHUB_DOCS, 'decisions.md');
const DECISIONS_DIR  = path.join(GITHUB_DOCS, 'decisions');
const COMMAND_QUEUE  = path.join(SESSION_DIR, 'command-queue.json');
const HELP_DIR       = path.join(PROJECT_ROOT, '.github', 'help');
const ANALYTICS_FILE = path.join(GITHUB_DOCS, 'analytics-events.json');
const MAX_BODY      = 1_048_576; // 1 MB
const SSE_HEARTBEAT_MS = 30000;  // 30s keep-alive

/* ── Mutation Audit Trail (SP-R2-007-005) ─────────────────────── */
const AUDIT_DIR = path.join(GITHUB_DOCS, 'audit');
const _audit = new AuditTrail({ logDir: AUDIT_DIR });

/* ── Utilities ────────────────────────────────────────────────── */

/**
 * Resolve a relative path within a base directory, blocking path traversal.
 * @param {string} base - The allowed base directory.
 * @param {string} relative - User-supplied relative path.
 * @returns {string} Resolved absolute path.
 * @throws {{ status: 403, errorCode: 'PATH_TRAVERSAL' }} If the path escapes base.
 */
function safePath(base, relative) {
  const absBase  = path.resolve(base);
  const resolved = path.resolve(base, relative);
  const rel = path.relative(absBase, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw Object.assign(new Error('Path traversal blocked'), { status: 403, errorCode: 'PATH_TRAVERSAL' });
  }
  return resolved;
}

/**
 * Apply standard security response headers (CSP, X-Frame-Options, etc.).
 * @param {http.ServerResponse} res - The HTTP response object.
 */
function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
}

/**
 * Build audit metadata from optional overrides and file path.
 * @param {string} filePath - Absolute path of the written file.
 * @param {object} [meta] - Optional audit overrides.
 * @returns {object} Normalized audit entry fields.
 */
function buildAuditMeta(filePath, meta) {
  const relative = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
  const defaults = {
    operation: 'update',
    entityType: relative.split('/').pop().replace(/\.\w+$/, ''),
    entityId: null,
    user: 'system',
    summary: `File written: ${relative}`,
  };
  if (!meta) return defaults;
  return {
    operation: meta.operation || defaults.operation,
    entityType: meta.entityType || defaults.entityType,
    entityId: meta.entityId || defaults.entityId,
    user: meta.user || defaults.user,
    summary: meta.summary || defaults.summary,
  };
}

/**
 * Write data to a file via the Store, invalidate cache, bump metrics, emit SSE, and log audit.
 * @param {string} filePath - Absolute path to write.
 * @param {string} data - Content to write.
 * @param {string} [encoding] - File encoding (default: utf8).
 * @param {object} [auditMeta] - Optional audit metadata { operation, entityType, entityId, user, summary }.
 */
function safeWriteSync(filePath, data, encoding, auditMeta) {
  getStore().writeFile(filePath, data, encoding);
  _cache.invalidate(filePath);
  _metrics.fileOpsCount++;
  const relative = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
  sseNotify('file_change', { file: relative, timestamp: new Date().toISOString() });
  _audit.log(buildAuditMeta(filePath, auditMeta));
}

/**
 * Send a JSON response with security headers and no-store cache.
 * @param {http.ServerResponse} res - The HTTP response.
 * @param {number} status - HTTP status code.
 * @param {object} data - Payload to serialize.
 */
function json(res, status, data) {
  const body = JSON.stringify(data);
  setSecurityHeaders(res);
  res.writeHead(status, {
    'Content-Type':  'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

/**
 * Read the full request body as a UTF-8 string, enforcing a 1 MB limit.
 * @param {http.IncomingMessage} req - The incoming request.
 * @returns {Promise<string>} The request body text.
 * @throws {{ status: 413 }} If the body exceeds MAX_BODY bytes.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { req.destroy(); return reject(Object.assign(new Error('Payload too large'), { status: 413, errorCode: 'PAYLOAD_TOO_LARGE' })); }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ── Content sanitization (IMPL-CONSTRAINT-002) ───────────────── */
/**
 * Escape markdown structural syntax in user-supplied text to prevent injection.
 * Neutralizes headings, horizontal rules, table rows, and Q-ID patterns.
 * @param {string} text - Raw user input.
 * @returns {string} Sanitized text safe for embedding in markdown documents.
 */
function sanitizeMarkdown(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/^(#{1,6})\s/gm, '\\$1 ')           // Escape heading syntax
    .replace(/^(\s*---+\s*)$/gm, '\\---')         // Escape horizontal rules
    .replace(/(Q-\d{1,3}-\d{1,4})/g, 'Q\\u2010$1'.replace('Q\\u2010Q-', 'Q\u2010')) // Break Q-ID patterns with non-breaking hyphen
    .replace(/^\|/gm, '\\|')                       // Escape table row syntax
    .replace(/^(\s*>\s*#{1,6})\s/gm, '$1\\');      // Escape headings inside blockquotes
}
/**
 * Neutralize fake question-ID patterns (Q-nn-nnnn) in user text.
 * Replaces standard hyphens with non-breaking hyphens to prevent parser confusion.
 * @param {string} text - Raw user input.
 * @returns {string} Text with Q-ID patterns broken.
 */
function sanitizeQID(text) {
  // Specifically neutralize fake question ID patterns in user text
  if (typeof text !== 'string') return text;
  return text.replace(/Q-(\d{1,3})-(\d{1,4})/g, 'Q\u2010$1\u2010$2');
}

/* ── Secret detection in user input (IMPL-CONSTRAINT-008) ─────── */
const SECRET_PATTERNS = [
  { name: 'AWS Access Key',     re: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Token',       re: /gh[ps]_[A-Za-z0-9_]{36,}/ },
  { name: 'Azure Storage Key',  re: /[A-Za-z0-9/+]{86}==/ },
  { name: 'Generic API Key',    re: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}/i },
  { name: 'Private Key',        re: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/ },
  { name: 'Bearer Token',       re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i },
];

/**
 * Scan text for common secret/credential patterns.
 * @param {string} text - Text to scan.
 * @returns {string[]} Names of detected secret patterns (empty if none).
 */
function detectSecrets(text) {
  if (typeof text !== 'string') return [];
  const found = [];
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) found.push(name);
  }
  return found;
}

/**
 * Check multiple fields in a request body for secret patterns.
 * @param {object} body - Parsed request body.
 * @param {string[]} fieldsToCheck - Field names to scan.
 * @returns {string[]} Deduplicated list of detected pattern names.
 */
function checkSecretsInBody(body, fieldsToCheck) {
  const warnings = [];
  for (const field of fieldsToCheck) {
    if (body[field]) {
      const hits = detectSecrets(body[field]);
      if (hits.length > 0) {
        structuredLog('warn', 'secret_pattern_detected', { field, patterns: hits });
        warnings.push(...hits);
      }
    }
  }
  return [...new Set(warnings)];
}

/**
 * Assert that a value is a string within a maximum length.
 * @param {*} val - Value to check.
 * @param {string} name - Field name for error messages.
 * @param {number} [maxLen=1000] - Maximum allowed length.
 * @throws {{ status: 400, errorCode: 'INVALID_INPUT' }} If validation fails.
 */
function assertString(val, name, maxLen = 1000) {
  if (typeof val !== 'string') throw Object.assign(new Error(`${name} must be a string`), { status: 400, errorCode: 'INVALID_INPUT' });
  if (val.length > maxLen) throw Object.assign(new Error(`${name} exceeds max length (${maxLen})`), { status: 400, errorCode: 'INVALID_INPUT' });
}

const _writeLocks = new Map();
/**
 * Execute a function under a per-path write lock to prevent concurrent writes.
 * Locks are chained — if a lock is already held, the function waits for it.
 * @param {string} filePath - Path used as the lock key.
 * @param {function(): Promise<*>} fn - Async function to execute under the lock.
 * @returns {Promise<*>} The return value of fn.
 */
async function withFileLock(filePath, fn) {
  const key = path.resolve(filePath);
  // Chain on the previous lock's promise to avoid race conditions (IMPL-CONSTRAINT-010)
  const prev = _writeLocks.get(key) || Promise.resolve();
  let resolve;
  const current = new Promise(r => { resolve = r; });
  _writeLocks.set(key, current);
  await prev;
  try { return await fn(); }
  finally {
    if (_writeLocks.get(key) === current) _writeLocks.delete(key);
    resolve();
  }
}

/* ── Structured logging (IMPL-CONSTRAINT-006: no PII in logs) ── */
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL] ?? 2;

/**
 * Emit a structured JSON log entry to stdout (or stderr for errors).
 * @param {'error'|'warn'|'info'|'debug'} level - Log severity.
 * @param {string} message - Log message identifier.
 * @param {object} [fields] - Additional key-value pairs to include.
 */
function structuredLog(level, message, fields = {}) {
  if ((LOG_LEVELS[level] ?? 2) > CURRENT_LOG_LEVEL) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

function log(method, url, status, ms) {
  structuredLog('info', 'http_request', { method, url, status, duration_ms: ms });
}

async function parseBody(req) {
  const ct = (req.headers['content-type'] || '');
  const mediaType = ct.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw Object.assign(new Error('Content-Type must be application/json'), { status: 415, errorCode: 'INVALID_CONTENT_TYPE' });
  }
  const raw = await readBody(req);
  try { return JSON.parse(raw); }
  catch { throw Object.assign(new Error('Invalid JSON in request body'), { status: 400, errorCode: 'INVALID_JSON' }); }
}

/* ── File discovery ───────────────────────────────────────────── */

function discoverQuestionnaires() {
  const store = getStore();
  if (!store.exists(BUSINESS_DOCS)) return [];
  const results = [];
  (function walk(dir, depth) {
    if (depth > 20) return;
    let entries;
    try { entries = store.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      try {
        if (entry.isDirectory()) walk(full, depth + 1);
        else if (entry.isFile() && entry.name.endsWith('-questionnaire.md')) results.push(full);
      } catch { /* skip inaccessible entry */ }
    }
  })(BUSINESS_DOCS, 0);
  return results.sort();
}

/* ── Questionnaire index updater ──────────────────────────────── */

function rebuildQuestionnaireIndex() {
  const files = discoverQuestionnaires();
  if (files.length === 0) return;

  const rows = [];
  for (const f of files) {
    let content;
    try { content = _cache.read(f); } catch { continue; }
    const p = models.parseQuestionnaire(content, f, BUSINESS_DOCS);
    const total    = p.questions.length;
    const answered = p.questions.filter(q => q.status === 'ANSWERED').length;
    const status   = total === 0 ? 'OPEN' : answered === total ? 'COMPLETE' : answered > 0 ? 'PARTIAL' : 'OPEN';
    rows.push(`| ${p.file} | ${p.phase} | ${p.agent} | ${total} | ${answered} | ${status} |`);
  }

  const md = [
    '# Questionnaire Index',
    `> Last updated: ${models.isoNow()}`, '',
    '| File | Phase | Agent | Questions | Answered | Status |',
    '|------|-------|-------|-----------|----------|--------|',
    ...rows, '',
  ].join('\n');

  safeWriteSync(Q_INDEX_FILE, md);
}

let _rebuildTimer = null;
function scheduleRebuildIndex() {
  if (_rebuildTimer) clearTimeout(_rebuildTimer);
  _rebuildTimer = setTimeout(() => { _rebuildTimer = null; rebuildQuestionnaireIndex(); }, 500);
}

/* ── API handlers ─────────────────────────────────────────────── */

async function apiGetQuestionnaires(_req, res) {
  const files = discoverQuestionnaires();
  const questionnaires = [];
  const corruptionWarnings = [];
  for (const f of files) {
    let content;
    try { content = _cache.read(f); } catch { continue; }
    /* Markdown corruption detection (GAP-009) */
    const issues = models.detectMarkdownCorruption(content);
    if (issues.length > 0) {
      const relative = path.relative(PROJECT_ROOT, f).replace(/\\/g, '/');
      structuredLog('warn', 'markdown_corruption', { file: relative, issues });
      corruptionWarnings.push({ file: relative, issues });
    }
    questionnaires.push(models.parseQuestionnaire(content, f, BUSINESS_DOCS));
  }
  const response = { questionnaires };
  if (corruptionWarnings.length > 0) response.corruptionWarnings = corruptionWarnings;
  json(res, 200, response);
}

async function apiGetSession(_req, res) {
  const store = getStore();
  if (!store.exists(SESSION_FILE)) return json(res, 200, { session: null });
  const { data: session, errors } = _cache.readJSON(SESSION_FILE, schemas.validateSessionState);
  if (errors) { structuredLog('warn', 'session_validation', { errors }); }
  if (!session) return json(res, 200, { session: null });
  json(res, 200, { session });
}

function validateSaveUpdates(updates) {
  if (!Array.isArray(updates) || updates.length === 0 || updates.length > 200) return V.UPDATES_RANGE;
  for (const u of updates) {
    if (!models.Q_ID_RE.test(u.questionId)) return V.invalidQID(u.questionId);
    if (!['OPEN', 'ANSWERED', 'DEFERRED'].includes(u.status)) return V.invalidStatus(u.status);
  }
  return null;
}

function sanitizeSaveUpdates(updates) {
  for (const u of updates) { if (u.answer) u.answer = sanitizeMarkdown(sanitizeQID(u.answer)); }
}

function detectSaveSecrets(updates) {
  const warnings = [];
  for (const u of updates) { if (u.answer) warnings.push(...detectSecrets(u.answer)); }
  const unique = [...new Set(warnings)];
  if (unique.length > 0) structuredLog('warn', 'secret_pattern_in_save', { patterns: unique });
  return unique;
}

async function apiSave(req, res) {
  const body = await parseBody(req);
  assertString(body.file, 'file', 500);
  const validationError = validateSaveUpdates(body.updates);
  if (validationError) return json(res, 400, errorResponse('VALIDATION_ERROR', validationError));

  const filePath = safePath(BUSINESS_DOCS, body.file);
  if (!getStore().exists(filePath)) return json(res, 404, errorResponse('FILE_NOT_FOUND', 'File not found'));

  sanitizeSaveUpdates(body.updates);

  await withFileLock(filePath, () => {
    let content = getStore().readFile(filePath);
    for (const u of body.updates) content = models.updateAnswerInContent(content, u.questionId, u.answer, u.status);
    safeWriteSync(filePath, content, undefined, {
      operation: 'update', entityType: 'questionnaire',
      entityId: body.updates.map(u => u.questionId).join(','),
      user: 'webapp', summary: `Updated ${body.updates.length} answer(s) in ${body.file}`,
    });
  });

  const uniqueWarnings = detectSaveSecrets(body.updates);
  scheduleRebuildIndex();
  sseNotify('questionnaire_save', { file: body.file, count: body.updates.length });
  const response = { ok: true, saved: body.updates.length };
  attachSecretWarnings(response, uniqueWarnings);
  json(res, 200, response);
}

async function apiReevaluate(req, res) {
  const body  = await parseBody(req);
  const scope = ['ALL', 'BUSINESS', 'TECH', 'UX', 'MARKETING'].includes(body.scope) ? body.scope : 'ALL';
  getStore().mkdirp(SESSION_DIR);

  safeWriteSync(
    path.join(SESSION_DIR, 'reevaluate-trigger.json'),
    JSON.stringify({ requested_at: models.isoNow(), scope, source: 'questionnaire-webapp', status: 'PENDING' }, null, 2)
  );
  json(res, 200, { ok: true, scope, message: R.reevaluateTrigger(scope) });
}

/* ── Decisions parser — reads index + category files ──────────── */

function parseDecisions() {
  const store = getStore();
  const result = { open: [], decided: [], deferred: [], categories: [] };
  if (!store.exists(DECISIONS_FILE)) return result;
  const indexContent = _cache.read(DECISIONS_FILE);
  const indexData = models.parseDecisions(indexContent);
  result.open = indexData.open;
  result.decided = [...indexData.decided];
  result.deferred = indexData.deferred;

  // Scan category files
  if (store.exists(DECISIONS_DIR)) {
    try {
      const files = store.readdir(DECISIONS_DIR).filter(f => typeof f === 'string' ? f.endsWith('.md') : (f.name || '').endsWith('.md'));
      for (const entry of files) {
        const fname = typeof entry === 'string' ? entry : entry.name;
        const filePath = path.join(DECISIONS_DIR, fname);
        const content = _cache.read(filePath);
        const header = models.parseCategoryHeader(content);
        const decisions = models.parseCategoryDecisions(content, header.stack);
        result.categories.push({
          name: header.name, stack: header.stack, status: header.status,
          applicable: header.applicable, reason: header.reason,
          file: fname, count: decisions.length,
        });
        for (const d of decisions) {
          if (header.status === 'DEFERRED' || d.status === 'CAT_DEFERRED') {
            result.deferred.push({ id: d.id, status: 'DEFERRED', scope: d.scope, subject: d.decision, reason: header.reason || 'Category deferred', date: d.date, category: d.category });
          } else {
            result.decided.push(d);
          }
        }
      }
    } catch { /* directory not readable — ignore */ }
  }

  return result;
}

/* ── Decisions API handlers ──────────────────────────────────── */

async function apiGetDecisions(_req, res) {
  const decisions = parseDecisions();
  json(res, 200, decisions);
}

const DECISION_TEXT_FIELDS = ['text', 'notes', 'answer', 'reason', 'scope'];
const DECISION_SECRET_FIELDS = ['text', 'notes', 'answer', 'reason'];

function validateDecisionBody(body) {
  assertString(body.action, 'action', 50);
  if (body.id && !models.DEC_ID_RE.test(body.id)) return V.INVALID_DEC_ID;
  for (const f of DECISION_TEXT_FIELDS) { if (body[f]) assertString(body[f], f, f === 'scope' ? 200 : 2000); }
  return null;
}

function sanitizeDecisionFields(body) {
  for (const f of DECISION_TEXT_FIELDS) { if (body[f]) body[f] = sanitizeMarkdown(sanitizeQID(body[f])); }
}

function detectDecisionSecrets(body) {
  return checkSecretsInBody(body, DECISION_SECRET_FIELDS);
}

function validateDecisionCreateFields(body) {
  if (!body.type || !body.priority || !body.scope || !body.text) return V.MISSING_CREATE_FIELDS;
  if (!['DECIDED', 'OPEN_QUESTION'].includes(body.type)) return V.INVALID_TYPE;
  if (!['HIGH', 'MEDIUM', 'LOW'].includes(body.priority)) return V.INVALID_PRIORITY;
  return null;
}

function handleDecisionCreate(body, content) {
  const err = validateDecisionCreateFields(body);
  if (err) return { error: err };
  const id = models.nextDecisionId(content, 'DEC-');
  if (body.type === 'OPEN_QUESTION') {
    content = models.addOpenQuestion(content, { id, priority: body.priority, scope: body.scope, question: body.text, answer: '', date: models.today() });
  } else {
    content = models.addOperationalDecision(content, { id, priority: body.priority, scope: body.scope, decision: body.text, notes: body.notes || '', date: models.today() });
  }
  content = models.appendAuditTrail(content, 'create', id);
  return { content, result: { ok: true, id, action: body.type === 'OPEN_QUESTION' ? 'created_open_question' : 'created_decision' } };
}

function mutateAnswer(body, content) {
  if (!body.id || !body.answer) return { error: V.MISSING_ID_OR_ANSWER };
  return { content: models.answerOpenQuestion(content, body.id, body.answer) };
}
function mutateDecide(body, content) {
  if (!body.id || !body.answer) return { error: V.MISSING_ID_OR_ANSWER };
  content = models.answerOpenQuestion(content, body.id, body.answer);
  return { content: models.moveToDecided(content, body.id) };
}
function mutateDefer(body, content) {
  if (!body.id) return { error: V.MISSING_ID };
  return { content: models.deferOpenQuestion(content, body.id, body.reason || '') };
}
function mutateExpire(body, content) {
  if (!body.id) return { error: V.MISSING_ID };
  return { content: models.expireDecidedItem(content, body.id, body.reason || '') };
}
function mutateReopen(body, content) {
  if (!body.id) return { error: V.MISSING_ID };
  return { content: models.reopenItem(content, body.id) };
}
function mutateEdit(body, content) {
  if (!body.id) return { error: V.MISSING_ID };
  return { content: models.editDecidedRow(content, body.id, { priority: body.priority, scope: body.scope, text: body.text, notes: body.notes }) };
}

const DECISION_HANDLERS = { answer: mutateAnswer, decide: mutateDecide, defer: mutateDefer, expire: mutateExpire, reopen: mutateReopen, edit: mutateEdit };
const PAST_TENSE = { answer: 'answered', decide: 'decided', defer: 'deferred', expire: 'expired', reopen: 'reopened', edit: 'edited' };

/**
 * Find which file contains a decision by ID.
 * Checks the index file first, then category files.
 * @param {string} id - Decision ID to locate.
 * @returns {string|null} Absolute file path, or null if not found.
 */
function findDecisionFile(id) {
  const store = getStore();
  if (store.exists(DECISIONS_FILE)) {
    const content = store.readFile(DECISIONS_FILE);
    if (content.includes(id)) return DECISIONS_FILE;
  }
  if (store.exists(DECISIONS_DIR)) {
    try {
      const files = store.readdir(DECISIONS_DIR).filter(f => typeof f === 'string' ? f.endsWith('.md') : (f.name || '').endsWith('.md'));
      for (const entry of files) {
        const fname = typeof entry === 'string' ? entry : entry.name;
        const filePath = path.join(DECISIONS_DIR, fname);
        const content = store.readFile(filePath);
        if (content.includes(id)) return filePath;
      }
    } catch { /* ignore */ }
  }
  return null;
}

/** Actions that may target category files instead of the index. */
const MULTI_FILE_ACTIONS = new Set(['edit', 'expire', 'reopen']);

function handleDecisionMutate(body, content) {
  const handler = DECISION_HANDLERS[body.action];
  if (!handler) return { error: R.unknownAction(body.action) };
  const outcome = handler(body, content);
  if (outcome.error) return outcome;
  content = models.appendAuditTrail(outcome.content, body.action, body.id);
  return { content, result: { ok: true, id: body.id, action: PAST_TENSE[body.action] || body.action } };
}

async function apiPostDecision(req, res) {
  const body = await parseBody(req);
  const valErr = validateDecisionBody(body);
  if (valErr) return json(res, 400, errorResponse('VALIDATION_ERROR', valErr));
  sanitizeDecisionFields(body);
  const secretWarnings = detectDecisionSecrets(body);
  if (secretWarnings.length > 0) structuredLog('warn', 'secret_pattern_in_decision', { patterns: secretWarnings, action: body.action });

  if (!getStore().exists(DECISIONS_FILE)) return json(res, 404, errorResponse('DECISIONS_NOT_FOUND', 'decisions.md not found'));

  // For edit/expire/reopen, the decision may live in a category file
  const targetFile = (body.id && MULTI_FILE_ACTIONS.has(body.action))
    ? (findDecisionFile(body.id) || DECISIONS_FILE)
    : DECISIONS_FILE;

  return withFileLock(targetFile, () => {
    const content = getStore().readFile(targetFile);
    let outcome;
    if (body.action === 'create') {
      outcome = handleDecisionCreate(body, content);
    } else {
      outcome = handleDecisionMutate(body, content);
    }
    if (outcome.error) return json(res, 400, errorResponse('INVALID_ACTION', outcome.error));

    safeWriteSync(targetFile, outcome.content, undefined, {
      operation: body.action === 'create' ? 'create' : 'update',
      entityType: 'decision',
      entityId: outcome.result.id || body.id,
      user: 'webapp',
      summary: `Decision ${body.action}: ${outcome.result.id || body.id}`,
    });

    // For expire: also add deferred row to index file if the source was a category file
    if (body.action === 'expire' && targetFile !== DECISIONS_FILE) {
      withFileLock(DECISIONS_FILE, () => {
        let indexContent = getStore().readFile(DECISIONS_FILE);
        const esc = models.escRx(body.id);
        const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|`);
        // Only add to index deferred if not already there
        if (!rowRe.test(indexContent.split('## Deferred')[1] || '')) {
          indexContent = models.insertDeferredRow(indexContent, body.id, 'EXPIRED', body.scope || '', body.text || body.id, body.reason || 'Expired via webapp');
          indexContent = models.appendAuditTrail(indexContent, 'expire', body.id);
          safeWriteSync(DECISIONS_FILE, indexContent, undefined, {
            operation: 'update', entityType: 'decision', entityId: body.id,
            user: 'webapp', summary: `Decision expire cross-file: ${body.id}`,
          });
        }
      });
    }

    sseNotify('decision_update', { action: body.action, id: outcome.result.id || body.id });
    return json(res, 200, attachSecretWarnings(outcome.result, secretWarnings));
  });
}

/* ── Activate Category API ────────────────────────────────────── */

async function apiPostActivateCategory(req, res) {
  const body = await parseBody(req);
  assertString(body.file, 'file', 100);
  const fname = path.basename(body.file);
  if (!fname.endsWith('.md') || fname.includes('..') || fname.includes(path.sep)) {
    return json(res, 400, errorResponse('INVALID_FILE', 'Invalid category filename'));
  }
  const st = getStore();
  const filePath = path.join(DECISIONS_DIR, fname);
  if (!st.exists(filePath)) {
    return json(res, 404, errorResponse('FILE_NOT_FOUND', `Category file ${fname} not found`));
  }

  return withFileLock(filePath, () => {
    let content = st.readFile(filePath);
    const header = models.parseCategoryHeader(content);
    if (header.status === 'ACTIVE') {
      return json(res, 200, { ok: true, action: 'already_active', file: fname });
    }
    content = models.activateCategoryHeader(content);
    content = models.appendAuditTrail(content, 'activate', fname);
    safeWriteSync(filePath, content, undefined, {
      operation: 'activate', entityType: 'decision_category', entityId: fname,
      user: 'webapp', summary: `Category activated: ${header.name}`,
    });

    // Update the index file Category Registry table
    withFileLock(DECISIONS_FILE, () => {
      let indexContent = st.readFile(DECISIONS_FILE);
      const rowRe = new RegExp(`(\\|[^|]*\\[${models.escRx(fname)}\\][^|]*\\|[^|]*\\|)\\s*DEFERRED\\s*(\\|)\\s*NO\\s*\\|`);
      indexContent = indexContent.replace(rowRe, '$1 ACTIVE $2 YES |');
      safeWriteSync(DECISIONS_FILE, indexContent, undefined, {
        operation: 'update', entityType: 'decision_index', entityId: fname,
        user: 'webapp', summary: `Category registry updated: ${fname} -> ACTIVE`,
      });
    });

    sseNotify('decision_update', { action: 'activate_category', file: fname, name: header.name });
    return json(res, 200, { ok: true, action: 'activated', file: fname, name: header.name, stack: header.stack });
  });
}

/* ── Command Queue API ────────────────────────────────────────── */

const VALID_COMMANDS = [
  'CREATE', 'CREATE BUSINESS', 'CREATE TECH', 'CREATE UX', 'CREATE MARKETING', 'CREATE SYNTHESIS',
  'AUDIT', 'AUDIT BUSINESS', 'AUDIT TECH', 'AUDIT UX', 'AUDIT MARKETING', 'AUDIT SYNTHESIS',
  'REEVALUATE', 'FEATURE', 'SCOPE CHANGE', 'HOTFIX', 'REFRESH ONBOARDING', 'CONTINUE',
];

const COMMAND_OPT_FIELDS = ['project', 'description', 'scope', 'brief'];
const COMMAND_OPT_LIMITS = { project: 200, description: 2000, scope: 200, brief: 200000 };

function validateCommandBody(body) {
  assertString(body.command, 'command', 100);
  for (const f of COMMAND_OPT_FIELDS) { if (body[f]) assertString(body[f], f, COMMAND_OPT_LIMITS[f]); }
  if (body.description) body.description = sanitizeMarkdown(sanitizeQID(body.description));
  if (body.brief) body.brief = sanitizeMarkdown(sanitizeQID(body.brief));
}

function isValidCommand(cmd) {
  const parts = cmd.split(/\s+/);
  return VALID_COMMANDS.includes(cmd)
    || VALID_COMMANDS.includes(parts.slice(0, 2).join(' '))
    || (VALID_COMMANDS.includes(parts[0]) && parts.length <= 1);
}

function buildCommandEntry(body) {
  return {
    command: body.command.trim(),
    project: (body.project || '').trim() || null,
    description: (body.description || '').trim() || null,
    scope: (body.scope || '').trim() || null,
    requested_at: models.isoNow(),
    status: 'PENDING',
    source: 'webapp',
  };
}

function saveProjectBrief(body, entry) {
  if (!body.brief || typeof body.brief !== 'string' || !body.brief.trim()) return;
  getStore().mkdirp(BUSINESS_DOCS);
  const briefPath = path.join(BUSINESS_DOCS, 'project-brief.md');
  const briefContent = `# Project Brief — ${entry.project || 'Untitled'}\n\n` +
    `> Auto-generated by Command Center on ${models.isoNow()}\n\n` +
    body.brief.trim() + '\n';
  safeWriteSync(briefPath, briefContent);
  entry.brief_saved = true;
  entry.brief_path = 'BusinessDocs/project-brief.md';
}

function buildClipboardText(entry) {
  let text = entry.command;
  if (entry.project) text += ' ' + entry.project;
  if (entry.description) text += ': ' + entry.description;
  return text;
}

function readCommandQueue() {
  if (!getStore().exists(COMMAND_QUEUE)) return [];
  try {
    const raw = JSON.parse(_cache.read(COMMAND_QUEUE));
    return Array.isArray(raw) ? raw : (raw ? [raw] : []);
  } catch { return []; }
}

function appendToCommandQueue(entry) {
  const MAX_QUEUE_SIZE = 50;
  let queue = readCommandQueue();
  queue.push(entry);
  if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE);
  safeWriteSync(COMMAND_QUEUE, JSON.stringify(queue, null, 2));
}

async function apiPostCommand(req, res) {
  const body = await parseBody(req);
  validateCommandBody(body);

  const cmdSecrets = checkSecretsInBody(body, ['description', 'brief']);
  if (cmdSecrets.length > 0) structuredLog('warn', 'secret_pattern_in_command', { patterns: cmdSecrets, command: body.command });

  const cmd = body.command.trim().toUpperCase();
  if (!isValidCommand(cmd)) return json(res, 400, errorResponse('UNKNOWN_COMMAND', R.unknownCommand(body.command)));

  getStore().mkdirp(SESSION_DIR);
  const entry = buildCommandEntry(body);
  saveProjectBrief(body, entry);
  entry.clipboard_text = buildClipboardText(entry);
  appendToCommandQueue(entry);

  const cmdResponse = { ok: true, clipboard_text: entry.clipboard_text, brief_saved: !!entry.brief_saved, message: R.commandQueued(entry.clipboard_text) };
  attachSecretWarnings(cmdResponse, cmdSecrets);
  json(res, 200, cmdResponse);
}

async function apiGetCommand(_req, res) {
  const queue = readCommandQueue();
  json(res, 200, { command: getLatestCommand(queue), queue });
}

/* ── Progress API ─────────────────────────────────────────────── */

const PHASE_AGENTS = {
  'ONBOARDING': [{ id: '25', name: 'Onboarding Agent' }],
  'PHASE-1': [
    { id: '01', name: 'Business Analyst' },
    { id: '02', name: 'Domain Expert' },
    { id: '03', name: 'Sales Strategist' },
    { id: '04', name: 'Financial Analyst' },
    { id: '34', name: 'Product Manager' },
    { id: 'critic_risk', name: 'Critic + Risk' },
  ],
  'PHASE-2': [
    { id: '05', name: 'Software Architect' },
    { id: '06', name: 'Senior Developer' },
    { id: '07', name: 'DevOps Engineer' },
    { id: '08', name: 'Security Architect' },
    { id: '09', name: 'Data Architect' },
    { id: '33', name: 'Legal Counsel' },
    { id: 'critic_risk', name: 'Critic + Risk' },
  ],
  'PHASE-3': [
    { id: '10', name: 'UX Researcher' },
    { id: '11', name: 'UX Designer' },
    { id: '12', name: 'UI Designer' },
    { id: '13', name: 'Accessibility Specialist' },
    { id: '32', name: 'Content Strategist' },
    { id: '35', name: 'Localization Specialist' },
    { id: 'critic_risk', name: 'Critic + Risk' },
  ],
  'PHASE-4': [
    { id: '14', name: 'Brand Strategist' },
    { id: '15', name: 'Growth Marketer' },
    { id: '16', name: 'CRO Specialist' },
    { id: 'critic_risk', name: 'Critic + Risk' },
    { id: '30', name: 'Brand & Assets Agent' },
    { id: '31', name: 'Storybook Agent' },
  ],
  'SYNTHESIS': [{ id: '17', name: 'Synthesis Agent' }, { id: '27', name: 'GitHub Integration' }],
  'PHASE-5': [
    { id: '20', name: 'Implementation Agent' },
    { id: '21', name: 'Test Agent' },
    { id: '22', name: 'PR/Review Agent' },
    { id: '29', name: 'KPI Agent' },
    { id: '26', name: 'Documentation Agent' },
    { id: '27', name: 'GitHub Integration' },
    { id: '28', name: 'Retrospective Agent' },
  ],
};

const PHASE_ORDER = ['ONBOARDING', 'PHASE-1', 'PHASE-2', 'PHASE-3', 'PHASE-4', 'SYNTHESIS', 'PHASE-5'];
const PHASE_LABELS = {
  'ONBOARDING': 'Onboarding',
  'PHASE-1': 'Phase 1 — Requirements & Strategy',
  'PHASE-2': 'Phase 2 — Architecture & Design',
  'PHASE-3': 'Phase 3 — Experience Design',
  'PHASE-4': 'Phase 4 — Brand & Growth',
  'SYNTHESIS': 'Synthesis',
  'PHASE-5': 'Phase 5 — Implementation',
};

function getLatestCommand(queue) {
  if (!queue) queue = readCommandQueue();
  return queue.length ? queue[queue.length - 1] : null;
}

function isAgentCompleted(agent, completedAgents) {
  const agentFile = agent.id + '-' + agent.name.toLowerCase().replace(/[^a-z]+/g, '-');
  return completedAgents.includes(agentFile) || completedAgents.includes(agent.id);
}

function isAgentActive(agent, phaseKey, currentPhase, currentAgent) {
  return currentPhase === phaseKey && currentAgent && (currentAgent.startsWith(agent.id + '-') || currentAgent === agent.id);
}

function hasAgentOutputAsObject(po, agentId) {
  return po && typeof po === 'object' && po[agentId] && po[agentId] !== 'null' && po[agentId] !== null;
}

function hasOnboardingOutput(po, phaseKey) {
  return po && typeof po === 'string' && po !== 'null' && po !== null && phaseKey === 'ONBOARDING';
}

function resolveAgentStatus(agent, phaseKey, completedAgents, currentPhase, currentAgent, phaseOutputs) {
  if (isAgentCompleted(agent, completedAgents)) return 'done';
  if (isAgentActive(agent, phaseKey, currentPhase, currentAgent)) return 'active';
  const po = phaseOutputs[phaseKey.toLowerCase()];
  if (hasAgentOutputAsObject(po, agent.id) || hasOnboardingOutput(po, phaseKey)) return 'done';
  return 'pending';
}

function resolvePhaseStatus(phaseKey, completedPhases, currentPhase, session) {
  if (completedPhases.includes(phaseKey)) return 'done';
  if (currentPhase === phaseKey) return 'active';
  if (phaseKey === 'PHASE-5' && session.sprint_backlog && session.sprint_backlog.total_sprints > 0) return 'active';
  return 'pending';
}

function buildPhaseProgress(session) {
  const completedPhases = session.completed_phases || [];
  const completedAgents = session.completed_agents || [];
  const currentPhase    = session.current_phase || null;
  const phaseOutputs    = session.phase_outputs || {};

  return PHASE_ORDER.map(phaseKey => {
    const agents = (PHASE_AGENTS[phaseKey] || []).map(a => ({
      id: a.id, name: a.name,
      status: resolveAgentStatus(a, phaseKey, completedAgents, currentPhase, session.current_agent || null, phaseOutputs),
    }));
    const phaseStatus = resolvePhaseStatus(phaseKey, completedPhases, currentPhase, session);
    const done = agents.filter(a => a.status === 'done').length;
    return { key: phaseKey, label: PHASE_LABELS[phaseKey], status: phaseStatus, agents, done, total: agents.length };
  });
}

function buildSessionSummary(session) {
  return {
    session_id: session.session_id,
    cycle_type: session.cycle_type,
    status: session.status,
    current_phase: session.current_phase || null,
    current_agent: session.current_agent || null,
    current_step: session.current_step || null,
    initiated_at: session.initiated_at,
    last_updated: session.last_updated,
    blockers: session.blockers || [],
    open_human_escalations: (session.open_human_escalations || []).filter(e => e.status === 'OPEN'),
  };
}

async function apiGetProgress(_req, res) {
  const command = getLatestCommand();
  const store = getStore();

  if (!store.exists(SESSION_FILE)) {
    return json(res, 200, { active: false, phases: buildEmptyPhases(), session: null, command });
  }
  let session;
  try { session = JSON.parse(_cache.read(SESSION_FILE)); } catch { return json(res, 200, { active: false, phases: buildEmptyPhases(), session: null, command }); }

  const sprints = session.sprint_backlog
    ? { total: session.sprint_backlog.total_sprints || 0, statuses: session.sprint_backlog.sprint_statuses || {} }
    : null;

  json(res, 200, {
    active: true,
    session: buildSessionSummary(session),
    phases: buildPhaseProgress(session),
    sprints,
    command,
  });
}

function buildEmptyPhases() {
  return PHASE_ORDER.map(key => ({
    key, label: PHASE_LABELS[key], status: 'pending',
    agents: (PHASE_AGENTS[key] || []).map(a => ({ id: a.id, name: a.name, status: 'pending' })),
    done: 0, total: (PHASE_AGENTS[key] || []).length,
  }));
}

/* ── Export API ────────────────────────────────────────────────── */

function readSafeFile(store, basePath, relativePath) {
  let fp;
  try { fp = safePath(basePath, relativePath); } catch { return null; }
  if (!store.exists(fp)) return null;
  try { return _cache.read(fp); } catch { return null; }
}

const MAX_EXPORT_SIZE = 10 * 1024 * 1024;

function tryReadExportFile(store, filePath, ctx) {
  const txt = readSafeFile(store, PROJECT_ROOT, filePath);
  if (!txt) return null;
  ctx.size += Buffer.byteLength(txt);
  return ctx.size <= MAX_EXPORT_SIZE ? txt : null;
}

function collectStringPhaseOutput(val, store, ctx) {
  if (typeof val !== 'string' || val === 'null' || !val) return null;
  return tryReadExportFile(store, val, ctx);
}

function collectObjectPhaseOutput(val, store, ctx) {
  if (!val || typeof val !== 'object') return null;
  const entries = {};
  for (const [agentId, filePath] of Object.entries(val)) {
    if (ctx.size > MAX_EXPORT_SIZE) break;
    if (filePath && filePath !== 'null') {
      const txt = tryReadExportFile(store, filePath, ctx);
      if (txt) entries[agentId] = txt;
    }
  }
  return entries;
}

function collectPhaseOutputs(phaseOutputs, store) {
  const result = {};
  const ctx = { size: 0 };
  for (const [phase, val] of Object.entries(phaseOutputs)) {
    if (ctx.size > MAX_EXPORT_SIZE) break;
    const out = collectStringPhaseOutput(val, store, ctx) || collectObjectPhaseOutput(val, store, ctx);
    if (out) result[phase] = out;
  }
  return result;
}

async function apiGetExport(_req, res) {
  const store = getStore();
  const bundle = { exported_at: models.isoNow(), session: null, command_queue: [], phase_outputs: {} };

  if (store.exists(SESSION_FILE)) {
    try { bundle.session = JSON.parse(_cache.read(SESSION_FILE)); } catch {}
  }
  bundle.command_queue = readCommandQueue();

  if (bundle.session && bundle.session.phase_outputs) {
    bundle.phase_outputs = collectPhaseOutputs(bundle.session.phase_outputs, store);
  }

  json(res, 200, bundle);
}

/* ── Help API ─────────────────────────────────────────────────── */

const HELP_TOC = [
  { slug: 'getting-started',    title: 'Getting Started',     icon: '🚀' },
  { slug: 'commands',           title: 'Commands Reference',  icon: '⌨️' },
  { slug: 'questionnaires',     title: 'Questionnaires',      icon: '📝' },
  { slug: 'decisions',          title: 'Decisions',           icon: '⚖️' },
  { slug: 'pipeline',           title: 'Pipeline & Progress', icon: '📊' },
  { slug: 'agents',             title: 'Agents',              icon: '🤖' },
  { slug: 'keyboard-shortcuts', title: 'Keyboard Shortcuts',  icon: '⌨️' },
];

async function apiGetHelp(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const slug = url.searchParams.get('topic');

  if (!slug) {
    return json(res, 200, { toc: HELP_TOC });
  }

  // Validate slug: alphanumeric + hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return json(res, 400, errorResponse('INVALID_TOPIC', 'Invalid topic slug'));
  }

  const filePath = safePath(HELP_DIR, slug + '.md');
  if (!getStore().exists(filePath)) {
    return json(res, 404, errorResponse('TOPIC_NOT_FOUND', 'Help topic not found'));
  }
  const content = _cache.read(filePath);
  const entry = HELP_TOC.find(t => t.slug === slug);
  json(res, 200, { slug, title: entry ? entry.title : slug, content });
}

/* ── SSE Endpoint (SP-R2-004-005) ─────────────────────────────── */

async function apiGetEvents(req, res) {
  setSecurityHeaders(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  _sseClients.add(res);
  structuredLog('info', 'sse_client_connected', { clients: _sseClients.size });

  const heartbeat = setInterval(() => {
    try { res.write(`:heartbeat ${new Date().toISOString()}\n\n`); }
    catch { clearInterval(heartbeat); _sseClients.delete(res); }
  }, SSE_HEARTBEAT_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    _sseClients.delete(res);
    structuredLog('info', 'sse_client_disconnected', { clients: _sseClients.size });
  });
}

/* ── Metrics Endpoint (SP-R2-004-007) ─────────────────────────── */

async function apiGetMetrics(_req, res) {
  const uptimeS = Math.round((Date.now() - _metrics.startedAt) / 1000);
  const pcts = computePercentiles(_metrics.responseTimes);
  const cacheStats = _cache.stats ? _cache.stats() : { hits: 0, misses: 0 };
  const totalCache = (cacheStats.hits || 0) + (cacheStats.misses || 0);
  const result = {
    uptime_seconds: uptimeS,
    request_count: _metrics.requestCount,
    error_count: _metrics.errorCount,
    error_rate: _metrics.requestCount > 0 ? +( _metrics.errorCount / _metrics.requestCount).toFixed(4) : 0,
    response_time_p50: pcts.p50,
    response_time_p95: pcts.p95,
    response_time_p99: pcts.p99,
    sse_connections: _sseClients.size,
    file_ops_count: _metrics.fileOpsCount,
    cache_hit_ratio: totalCache > 0 ? +((cacheStats.hits || 0) / totalCache).toFixed(4) : 0,
    per_endpoint: {},
  };
  for (const [ep, data] of Object.entries(_metrics.perEndpoint)) {
    const epPcts = computePercentiles(data.times);
    result.per_endpoint[ep] = { count: data.count, p50: epPcts.p50, p95: epPcts.p95, p99: epPcts.p99 };
  }
  json(res, 200, result);
}

async function apiGetHealth(_req, res) {
  json(res, 200, { status: 'ok', uptime: Math.round(process.uptime()), sse_connections: _sseClients.size, timestamp: new Date().toISOString() });
}

/* ── Analytics Endpoint (SP-R2-004-008) ───────────────────────── */

const VALID_ANALYTICS_EVENTS = ['page_view', 'tab_switch', 'command_launch', 'questionnaire_save', 'decision_update', 'error_displayed', 'feature_usage', 'session_start', 'session_end'];

function validateAnalyticsEvent(evt) {
  if (!evt || typeof evt !== 'object') return V.EVENT_MUST_BE_OBJECT;
  if (!VALID_ANALYTICS_EVENTS.includes(evt.event)) return R.unknownEvent(evt.event);
  if (evt.properties && typeof evt.properties !== 'object') return 'Properties must be an object';
  return null;
}

async function apiPostAnalytics(req, res) {
  const body = await parseBody(req);
  if (!Array.isArray(body.events) || body.events.length === 0 || body.events.length > 100) {
    return json(res, 400, errorResponse('VALIDATION_ERROR', V.EVENTS_RANGE));
  }
  const errors = [];
  const valid = [];
  for (const evt of body.events) {
    const err = validateAnalyticsEvent(evt);
    if (err) { errors.push(err); continue; }
    valid.push({
      event: evt.event,
      properties: evt.properties || {},
      timestamp: new Date().toISOString(),
    });
  }

  if (valid.length > 0) {
    await withFileLock(ANALYTICS_FILE, () => {
      let existing = [];
      if (getStore().exists(ANALYTICS_FILE)) {
        try { existing = JSON.parse(_cache.read(ANALYTICS_FILE)); } catch { existing = []; }
      }
      existing.push(...valid);
      if (existing.length > ANALYTICS_MAX_EVENTS) existing = existing.slice(-ANALYTICS_MAX_EVENTS);
      getStore().mkdirp(path.dirname(ANALYTICS_FILE));
      safeWriteSync(ANALYTICS_FILE, JSON.stringify(existing, null, 2));
    });
  }

  json(res, 200, { ok: true, accepted: valid.length, rejected: errors.length });
}

async function apiGetAnalytics(_req, res) {
  if (!getStore().exists(ANALYTICS_FILE)) return json(res, 200, { events: [], total: 0 });
  let events = [];
  try { events = JSON.parse(_cache.read(ANALYTICS_FILE)); } catch {}
  json(res, 200, { events, total: events.length });
}

/* ── Audit Trail Endpoint (SP-R2-007-005) ─────────────────────── */

async function apiGetAudit(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const limitParam = parseInt(url.searchParams.get('limit'), 10);
  const limit = (limitParam >= 1 && limitParam <= 1000) ? limitParam : 50;
  const entries = _audit.read(limit);
  json(res, 200, { entries, total: entries.length, limit });
}

/* ── Static file serving ──────────────────────────────────────── */

let cachedHtml = null;
try {
  const htmlPath = path.join(WEBAPP_DIR, 'index.html');
  if (getStore().exists(htmlPath)) cachedHtml = Buffer.from(getStore().readFile(htmlPath));
} catch { /* index.html not found — static serving will return 404 */ }

function serveStatic(_req, res) {
  if (!cachedHtml) { res.writeHead(404); return res.end(S.NOT_FOUND); }
  setSecurityHeaders(res);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': cachedHtml.length });
  res.end(cachedHtml);
}

/* ── Router ───────────────────────────────────────────────────── */

const ROUTES = {
  'GET /api/questionnaires': apiGetQuestionnaires,
  'GET /api/session':        apiGetSession,
  'POST /api/save':          apiSave,
  'POST /api/reevaluate':    apiReevaluate,
  'GET /api/decisions':      apiGetDecisions,
  'POST /api/decisions':     apiPostDecision,
  'POST /api/decisions/activate-category': apiPostActivateCategory,
  'POST /api/command':       apiPostCommand,
  'GET /api/command':        apiGetCommand,
  'GET /api/progress':       apiGetProgress,
  'GET /api/export':         apiGetExport,
  'GET /api/help':           apiGetHelp,
  'GET /api/events':         apiGetEvents,
  'GET /api/metrics':        apiGetMetrics,
  'GET /api/health':         apiGetHealth,
  'POST /api/analytics':     apiPostAnalytics,
  'GET /api/analytics':      apiGetAnalytics,
  'GET /api/audit':          apiGetAudit,
  'GET /health':             (_req, res) => json(res, 200, { status: 'ok', uptime: Math.round(process.uptime()) }),
};

function handleMethodNotAllowed(res, pathname) {
  const allowed = Object.keys(ROUTES)
    .filter(k => k.endsWith(' ' + pathname))
    .map(k => k.split(' ')[0]);
  if (allowed.length === 0) return false;
  setSecurityHeaders(res);
  const body = JSON.stringify(errorResponse('METHOD_NOT_ALLOWED', 'Method Not Allowed'));
  res.writeHead(405, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Allow': allowed.join(', '),
  });
  res.end(body);
  return true;
}

function handleRouteError(err, res) {
  if (!res.headersSent) {
    const code = err.errorCode || statusToCode(err.status || 500);
    json(res, err.status || 500, errorResponse(code, err.message));
  } else { res.end(); }
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  const pathname = new URL(req.url, `http://${HOST}:${PORT}`).pathname.replace(/\/+$/, '') || '/';
  const key = `${req.method} ${pathname}`;
  if (ROUTES[key]) {
    try { await ROUTES[key](req, res); }
    catch (err) { handleRouteError(err, res); }
  } else if (req.method === 'GET' && !pathname.startsWith('/api')) {
    serveStatic(req, res);
  } else if (!handleMethodNotAllowed(res, pathname)) {
    json(res, 404, errorResponse('NOT_FOUND', 'Not found'));
  }
  const duration = Date.now() - start;
  // Don't log SSE connections every tick — they are long-lived
  if (pathname !== '/api/events') {
    recordMetric(req.method, pathname, duration, res.statusCode);
    log(req.method, pathname, res.statusCode, duration);
  }
});

server.setTimeout(30000);
server.keepAliveTimeout = 5000;

/* istanbul ignore next -- only when run directly */
if (require.main === module) {
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      structuredLog('error', 'port_in_use', { port: PORT, hint: 'Set PORT=3001 or stop the other process' });
    } else {
    structuredLog('error', 'server_error', { error: err.message });
  }
  process.exit(1);
});

  server.listen(PORT, HOST, () => {
    structuredLog('info', 'server_started', { host: HOST, port: PORT, url: `http://${HOST}:${PORT}` });
  });

/* ── Graceful shutdown ─────────────────────────────────────────── */

  function shutdown() {
    structuredLog('info', 'shutdown_initiated');
    server.close(() => { structuredLog('info', 'server_closed'); process.exit(0); });
    const forceTimer = setTimeout(() => { structuredLog('error', 'forced_shutdown'); process.exit(1); }, 5000);
    forceTimer.unref();
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  process.on('unhandledRejection', (reason) => { structuredLog('error', 'unhandled_rejection', { error: String(reason) }); });
  process.on('uncaughtException', (err) => { structuredLog('error', 'uncaught_exception', { error: err.message }); shutdown(); });
} // end require.main === module

/* ── Test exports (conditional) ─────────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeMarkdown, sanitizeQID, detectSecrets, checkSecretsInBody,
    structuredLog, withFileLock, safePath, setSecurityHeaders, server,
    _cache, _sseClients, sseNotify, _metrics, recordMetric, computePercentiles,
    _audit,
  };
}
