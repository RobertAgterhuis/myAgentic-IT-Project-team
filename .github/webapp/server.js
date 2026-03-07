#!/usr/bin/env node
// Questionnaire Manager — Local API server
// Zero external dependencies. Requires Node.js 14+.
'use strict';

const http = require('http');
const path = require('path');
const { getStore }    = require('./store');
const { FileCache }   = require('./cache');
const schemas         = require('./schemas');
const models          = require('./models');

const _cache = new FileCache();

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
const COMMAND_QUEUE  = path.join(SESSION_DIR, 'command-queue.json');
const HELP_DIR       = path.join(PROJECT_ROOT, '.github', 'help');
const MAX_BODY      = 1_048_576; // 1 MB

/* ── Utilities ────────────────────────────────────────────────── */

function safePath(base, relative) {
  const absBase  = path.resolve(base);
  const resolved = path.resolve(base, relative);
  const rel = path.relative(absBase, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw Object.assign(new Error('Path traversal blocked'), { status: 403 });
  }
  return resolved;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
}

function safeWriteSync(filePath, data, encoding) {
  getStore().writeFile(filePath, data, encoding);
  _cache.invalidate(filePath);
}

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

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { req.destroy(); return reject(Object.assign(new Error('Payload too large'), { status: 413 })); }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function escRx(s) { return models.escRx(s); }
function today() { return models.today(); }
function isoNow() { return models.isoNow(); }
const Q_ID_RE = models.Q_ID_RE;
const DEC_ID_RE = models.DEC_ID_RE;

/* ── Content sanitization (IMPL-CONSTRAINT-002) ───────────────── */
function sanitizeMarkdown(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/^(#{1,6})\s/gm, '\\$1 ')           // Escape heading syntax
    .replace(/^(\s*---+\s*)$/gm, '\\---')         // Escape horizontal rules
    .replace(/(Q-\d{1,3}-\d{1,4})/g, 'Q\\u2010$1'.replace('Q\\u2010Q-', 'Q\u2010')) // Break Q-ID patterns with non-breaking hyphen
    .replace(/^\|/gm, '\\|')                       // Escape table row syntax
    .replace(/^(\s*>\s*#{1,6})\s/gm, '$1\\');      // Escape headings inside blockquotes
}
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

function detectSecrets(text) {
  if (typeof text !== 'string') return [];
  const found = [];
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) found.push(name);
  }
  return found;
}

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

function assertString(val, name, maxLen = 1000) {
  if (typeof val !== 'string') throw Object.assign(new Error(`${name} must be a string`), { status: 400 });
  if (val.length > maxLen) throw Object.assign(new Error(`${name} exceeds max length (${maxLen})`), { status: 400 });
}

const _writeLocks = new Map();
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
    throw Object.assign(new Error('Content-Type must be application/json'), { status: 415 });
  }
  const raw = await readBody(req);
  try { return JSON.parse(raw); }
  catch { throw Object.assign(new Error('Invalid JSON in request body'), { status: 400 }); }
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

/* ── Markdown parser — delegates to models.js ─────────────────── */

function parseQuestionnaire(content, filePath) {
  return models.parseQuestionnaire(content, filePath, BUSINESS_DOCS);
}

/* ── Markdown writer — delegates to models.js ─────────────────── */

function updateAnswerInContent(content, questionId, newAnswer, newStatus) {
  return models.updateAnswerInContent(content, questionId, newAnswer, newStatus);
}

/* ── Questionnaire index updater ──────────────────────────────── */

function rebuildQuestionnaireIndex() {
  const files = discoverQuestionnaires();
  if (files.length === 0) return;

  const rows = [];
  for (const f of files) {
    let content;
    try { content = _cache.read(f); } catch { continue; }
    const p = parseQuestionnaire(content, f);
    const total    = p.questions.length;
    const answered = p.questions.filter(q => q.status === 'ANSWERED').length;
    const status   = total === 0 ? 'OPEN' : answered === total ? 'COMPLETE' : answered > 0 ? 'PARTIAL' : 'OPEN';
    rows.push(`| ${p.file} | ${p.phase} | ${p.agent} | ${total} | ${answered} | ${status} |`);
  }

  const md = [
    '# Questionnaire Index',
    `> Last updated: ${isoNow()}`, '',
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
  for (const f of files) {
    let content;
    try { content = _cache.read(f); } catch { continue; }
    questionnaires.push(parseQuestionnaire(content, f));
  }
  json(res, 200, { questionnaires });
}

async function apiGetSession(_req, res) {
  const store = getStore();
  if (!store.exists(SESSION_FILE)) return json(res, 200, { session: null });
  const { data: session, errors } = _cache.readJSON(SESSION_FILE, schemas.validateSessionState);
  if (errors) { structuredLog('warn', 'session_validation', { errors }); }
  if (!session) return json(res, 200, { session: null });
  json(res, 200, { session });
}

async function apiSave(req, res) {
  const body = await parseBody(req);
  assertString(body.file, 'file', 500);
  if (!Array.isArray(body.updates) || body.updates.length === 0 || body.updates.length > 200) return json(res, 400, { error: 'updates must be 1–200 items' });

  const filePath = safePath(BUSINESS_DOCS, body.file);
  if (!getStore().exists(filePath)) return json(res, 404, { error: 'File not found' });

  for (const u of body.updates) {
    if (!Q_ID_RE.test(u.questionId)) return json(res, 400, { error: `Invalid Q-ID: ${u.questionId}` });
    if (!['OPEN', 'ANSWERED', 'DEFERRED'].includes(u.status)) return json(res, 400, { error: `Invalid status: ${u.status}` });
    if (u.answer) u.answer = sanitizeMarkdown(sanitizeQID(u.answer));
  }

  await withFileLock(filePath, () => {
    let content = getStore().readFile(filePath);
    for (const u of body.updates) content = updateAnswerInContent(content, u.questionId, u.answer, u.status);
    safeWriteSync(filePath, content);
  });

  // Secret detection in answers (IMPL-CONSTRAINT-008)
  const secretWarnings = [];
  for (const u of body.updates) {
    if (u.answer) secretWarnings.push(...detectSecrets(u.answer));
  }
  const uniqueWarnings = [...new Set(secretWarnings)];
  if (uniqueWarnings.length > 0) {
    structuredLog('warn', 'secret_pattern_in_save', { patterns: uniqueWarnings });
  }

  scheduleRebuildIndex();
  const response = { ok: true, saved: body.updates.length };
  if (uniqueWarnings.length > 0) response.warnings = [`Possible secrets detected (${uniqueWarnings.join(', ')}). Please verify no sensitive data was submitted.`];
  json(res, 200, response);
}

async function apiReevaluate(req, res) {
  const body  = await parseBody(req);
  const scope = ['ALL', 'BUSINESS', 'TECH', 'UX', 'MARKETING'].includes(body.scope) ? body.scope : 'ALL';
  getStore().mkdirp(SESSION_DIR);

  safeWriteSync(
    path.join(SESSION_DIR, 'reevaluate-trigger.json'),
    JSON.stringify({ requested_at: isoNow(), scope, source: 'questionnaire-webapp', status: 'PENDING' }, null, 2)
  );
  json(res, 200, { ok: true, scope, message: `Trigger written. Type REEVALUATE ${scope} in Copilot chat.` });
}

/* ── Decisions parser — reads via store, delegates to models ──── */

function parseDecisions() {
  const store = getStore();
  if (!store.exists(DECISIONS_FILE)) return { open: [], decided: [], deferred: [] };
  const content = _cache.read(DECISIONS_FILE);
  return models.parseDecisions(content);
}

/* ── Decisions API handlers ──────────────────────────────────── */

async function apiGetDecisions(_req, res) {
  const decisions = parseDecisions();
  json(res, 200, decisions);
}

async function apiPostDecision(req, res) {
  const body = await parseBody(req);
  assertString(body.action, 'action', 50);
  if (body.id && !DEC_ID_RE.test(body.id)) return json(res, 400, { error: 'Invalid decision ID format' });
  if (body.scope) assertString(body.scope, 'scope', 200);
  if (body.text) assertString(body.text, 'text', 2000);
  if (body.notes) assertString(body.notes, 'notes', 2000);
  if (body.answer) assertString(body.answer, 'answer', 2000);
  if (body.reason) assertString(body.reason, 'reason', 2000);

  // Sanitize user-supplied text fields (IMPL-CONSTRAINT-002)
  if (body.text) body.text = sanitizeMarkdown(sanitizeQID(body.text));
  if (body.notes) body.notes = sanitizeMarkdown(sanitizeQID(body.notes));
  if (body.answer) body.answer = sanitizeMarkdown(sanitizeQID(body.answer));
  if (body.reason) body.reason = sanitizeMarkdown(sanitizeQID(body.reason));
  if (body.scope) body.scope = sanitizeMarkdown(sanitizeQID(body.scope));

  // Secret detection in user-supplied fields (IMPL-CONSTRAINT-008)
  const _decSecrets = [];
  for (const f of ['text', 'notes', 'answer', 'reason']) { if (body[f]) _decSecrets.push(...detectSecrets(body[f])); }
  const _decUniqueSecrets = [...new Set(_decSecrets)];
  if (_decUniqueSecrets.length > 0) structuredLog('warn', 'secret_pattern_in_decision', { patterns: _decUniqueSecrets, action: body.action });
  const _ok = (obj) => { if (_decUniqueSecrets.length > 0) obj.warnings = [`Possible secrets detected (${_decUniqueSecrets.join(', ')}). Please verify no sensitive data was submitted.`]; return json(res, 200, obj); };

  if (!getStore().exists(DECISIONS_FILE)) return json(res, 404, { error: 'decisions.md not found' });

  return withFileLock(DECISIONS_FILE, () => {
    let content = getStore().readFile(DECISIONS_FILE);

    switch (body.action) {
    case 'create': {
      if (!body.type || !body.priority || !body.scope || !body.text) {
        return json(res, 400, { error: 'Missing type, priority, scope, or text' });
      }
      if (!['DECIDED', 'OPEN_QUESTION'].includes(body.type)) return json(res, 400, { error: 'Invalid type' });
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(body.priority)) return json(res, 400, { error: 'Invalid priority' });
      const id = models.nextDecisionId(content, 'DEC-');
      if (body.type === 'OPEN_QUESTION') {
        content = models.addOpenQuestion(content, { id, priority: body.priority, scope: body.scope, question: body.text, answer: '', date: today() });
      } else {
        content = models.addOperationalDecision(content, { id, priority: body.priority, scope: body.scope, decision: body.text, notes: body.notes || '', date: today() });
      }
      content = models.appendAuditTrail(content, 'create', id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id, action: body.type === 'OPEN_QUESTION' ? 'created_open_question' : 'created_decision' });
    }
    case 'answer': {
      if (!body.id || !body.answer) return json(res, 400, { error: 'Missing id or answer' });
      content = models.answerOpenQuestion(content, body.id, body.answer);
      content = models.appendAuditTrail(content, 'answer', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id: body.id, action: 'answered' });
    }
    case 'decide': {
      if (!body.id || !body.answer) return json(res, 400, { error: 'Missing id or answer' });
      content = models.answerOpenQuestion(content, body.id, body.answer);
      content = models.moveToDecided(content, body.id);
      content = models.appendAuditTrail(content, 'decide', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id: body.id, action: 'decided' });
    }
    case 'defer': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = models.deferOpenQuestion(content, body.id, body.reason || '');
      content = models.appendAuditTrail(content, 'defer', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id: body.id, action: 'deferred' });
    }
    case 'expire': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = models.expireDecidedItem(content, body.id, body.reason || '');
      content = models.appendAuditTrail(content, 'expire', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id: body.id, action: 'expired' });
    }
    case 'reopen': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = models.reopenItem(content, body.id);
      content = models.appendAuditTrail(content, 'reopen', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id: body.id, action: 'reopened' });
    }
    case 'edit': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = models.editDecidedRow(content, body.id, { priority: body.priority, scope: body.scope, text: body.text, notes: body.notes });
      content = models.appendAuditTrail(content, 'edit', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return _ok({ ok: true, id: body.id, action: 'edited' });
    }
    default:
      return json(res, 400, { error: `Unknown action: ${body.action}` });
  }
  }); // withFileLock
}

/* ── Command Queue API ────────────────────────────────────────── */

const VALID_COMMANDS = [
  'CREATE', 'CREATE BUSINESS', 'CREATE TECH', 'CREATE UX', 'CREATE MARKETING', 'CREATE SYNTHESIS',
  'AUDIT', 'AUDIT BUSINESS', 'AUDIT TECH', 'AUDIT UX', 'AUDIT MARKETING', 'AUDIT SYNTHESIS',
  'REEVALUATE', 'FEATURE', 'SCOPE CHANGE', 'HOTFIX', 'REFRESH ONBOARDING', 'CONTINUE',
];

async function apiPostCommand(req, res) {
  const body = await parseBody(req);
  assertString(body.command, 'command', 100);
  if (body.project) assertString(body.project, 'project', 200);
  if (body.description) assertString(body.description, 'description', 2000);
  if (body.scope) assertString(body.scope, 'scope', 200);
  if (body.brief) assertString(body.brief, 'brief', 200000);
  // Sanitize user-supplied text fields (IMPL-CONSTRAINT-002)
  if (body.description) body.description = sanitizeMarkdown(sanitizeQID(body.description));
  if (body.brief) body.brief = sanitizeMarkdown(sanitizeQID(body.brief));

  // Secret detection in user-supplied fields (IMPL-CONSTRAINT-008)
  const _cmdSecrets = [];
  for (const f of ['description', 'brief']) { if (body[f]) _cmdSecrets.push(...detectSecrets(body[f])); }
  const _cmdUniqueSecrets = [...new Set(_cmdSecrets)];
  if (_cmdUniqueSecrets.length > 0) structuredLog('warn', 'secret_pattern_in_command', { patterns: _cmdUniqueSecrets, command: body.command });

  const cmd = body.command.trim().toUpperCase();
  const parts = cmd.split(/\s+/);
  const isValid = VALID_COMMANDS.includes(cmd)
    || VALID_COMMANDS.includes(parts.slice(0, 2).join(' '))
    || (VALID_COMMANDS.includes(parts[0]) && parts.length <= 1);
  if (!isValid) {
    return json(res, 400, { error: `Unknown command: ${body.command}` });
  }

  getStore().mkdirp(SESSION_DIR);

  const entry = {
    command: body.command.trim(),
    project: (body.project || '').trim() || null,
    description: (body.description || '').trim() || null,
    scope: (body.scope || '').trim() || null,
    requested_at: isoNow(),
    status: 'PENDING',
    source: 'webapp',
  };

  // Save project brief to file if provided (keeps it out of the chat context)
  if (body.brief && typeof body.brief === 'string' && body.brief.trim()) {
    getStore().mkdirp(BUSINESS_DOCS);
    const briefPath = path.join(BUSINESS_DOCS, 'project-brief.md');
    const briefContent = `# Project Brief — ${entry.project || 'Untitled'}\n\n` +
      `> Auto-generated by Command Center on ${isoNow()}\n\n` +
      body.brief.trim() + '\n';
    safeWriteSync(briefPath, briefContent);
    entry.brief_saved = true;
    entry.brief_path = 'BusinessDocs/project-brief.md';
  }

  // Build the clipboard text the user should paste in Copilot Chat
  // NOTE: The brief is intentionally NOT included — it is read from file by the Onboarding Agent
  let clipText = entry.command;
  if (entry.project) clipText += ' ' + entry.project;
  if (entry.description) clipText += ': ' + entry.description;
  entry.clipboard_text = clipText;

  // Append to queue array (preserves history)
  let queue = [];
  if (getStore().exists(COMMAND_QUEUE)) {
    try {
      const existing = JSON.parse(_cache.read(COMMAND_QUEUE));
      queue = Array.isArray(existing) ? existing : (existing ? [existing] : []);
    } catch {}
  }
  const MAX_QUEUE_SIZE = 50;
  queue.push(entry);
  if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE);
  safeWriteSync(COMMAND_QUEUE, JSON.stringify(queue, null, 2));
  const cmdResponse = { ok: true, clipboard_text: clipText, brief_saved: !!entry.brief_saved, message: `Command queued. Paste in Copilot Chat: ${clipText}` };
  if (_cmdUniqueSecrets.length > 0) cmdResponse.warnings = [`Possible secrets detected (${_cmdUniqueSecrets.join(', ')}). Please verify no sensitive data was submitted.`];
  json(res, 200, cmdResponse);
}

async function apiGetCommand(_req, res) {
  if (!getStore().exists(COMMAND_QUEUE)) return json(res, 200, { command: null, queue: [] });
  try {
    const raw = JSON.parse(_cache.read(COMMAND_QUEUE));
    const queue = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    const latest = queue.length ? queue[queue.length - 1] : null;
    json(res, 200, { command: latest, queue });
  } catch { json(res, 200, { command: null, queue: [] }); }
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

async function apiGetProgress(_req, res) {
  // Always include command queue so the UI can show waiting state
  let command = null;
  const store = getStore();
  if (store.exists(COMMAND_QUEUE)) {
    try {
      const raw = JSON.parse(_cache.read(COMMAND_QUEUE));
      const queue = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      command = queue.length ? queue[queue.length - 1] : null;
    } catch {}
  }

  if (!store.exists(SESSION_FILE)) {
    return json(res, 200, { active: false, phases: buildEmptyPhases(), session: null, command });
  }
  let session;
  try { session = JSON.parse(_cache.read(SESSION_FILE)); } catch { return json(res, 200, { active: false, phases: buildEmptyPhases(), session: null, command }); }

  const completedPhases = session.completed_phases || [];
  const completedAgents = session.completed_agents || [];
  const currentPhase    = session.current_phase || null;
  const currentAgent    = session.current_agent || null;
  const currentStep     = session.current_step || null;
  const phaseOutputs    = session.phase_outputs || {};

  const phases = PHASE_ORDER.map(phaseKey => {
    const label   = PHASE_LABELS[phaseKey];
    const agents  = (PHASE_AGENTS[phaseKey] || []).map(a => {
      const agentFile = a.id + '-' + a.name.toLowerCase().replace(/[^a-z]+/g, '-');
      let status = 'pending';
      if (completedAgents.includes(agentFile) || completedAgents.includes(a.id)) status = 'done';
      else if (currentPhase === phaseKey && currentAgent && (currentAgent.startsWith(a.id + '-') || currentAgent === a.id)) status = 'active';
      // Also check phase_outputs
      const po = phaseOutputs[phaseKey.toLowerCase()];
      if (po && typeof po === 'object' && po[a.id] && po[a.id] !== 'null' && po[a.id] !== null) status = 'done';
      else if (po && typeof po === 'string' && po !== 'null' && po !== null && phaseKey === 'ONBOARDING') status = 'done';
      return { id: a.id, name: a.name, status };
    });

    let phaseStatus = 'pending';
    if (completedPhases.includes(phaseKey)) phaseStatus = 'done';
    else if (currentPhase === phaseKey) phaseStatus = 'active';
    else if (phaseKey === 'PHASE-5' && session.sprint_backlog && session.sprint_backlog.total_sprints > 0) {
      phaseStatus = 'active'; // Phase 5 is iterative
    }

    const done  = agents.filter(a => a.status === 'done').length;
    const total = agents.length;

    return { key: phaseKey, label, status: phaseStatus, agents, done, total };
  });

  // Sprint info
  let sprints = null;
  if (session.sprint_backlog) {
    sprints = {
      total: session.sprint_backlog.total_sprints || 0,
      statuses: session.sprint_backlog.sprint_statuses || {},
    };
  }

  json(res, 200, {
    active: true,
    session: {
      session_id: session.session_id,
      cycle_type: session.cycle_type,
      status: session.status,
      current_phase: currentPhase,
      current_agent: currentAgent,
      current_step: currentStep,
      initiated_at: session.initiated_at,
      last_updated: session.last_updated,
      blockers: session.blockers || [],
      open_human_escalations: (session.open_human_escalations || []).filter(e => e.status === 'OPEN'),
    },
    phases,
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

async function apiGetExport(_req, res) {
  const store = getStore();
  const bundle = { exported_at: isoNow(), session: null, command_queue: [], phase_outputs: {} };

  // Session state
  if (store.exists(SESSION_FILE)) {
    try { bundle.session = JSON.parse(_cache.read(SESSION_FILE)); } catch {}
  }

  // Command queue
  if (store.exists(COMMAND_QUEUE)) {
    try {
      const raw = JSON.parse(_cache.read(COMMAND_QUEUE));
      bundle.command_queue = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    } catch {}
  }

  // Collect phase output files referenced in session
  if (bundle.session && bundle.session.phase_outputs) {
    const po = bundle.session.phase_outputs;
    let cumSize = 0;
    const MAX_EXPORT_SIZE = 10 * 1024 * 1024; // 10 MB
    for (const [phase, val] of Object.entries(po)) {
      if (cumSize > MAX_EXPORT_SIZE) break;
      if (typeof val === 'string' && val !== 'null' && val) {
        let fp;
        try { fp = safePath(PROJECT_ROOT, val); } catch { continue; }
        if (store.exists(fp)) {
          try {
            const txt = _cache.read(fp);
            cumSize += Buffer.byteLength(txt);
            if (cumSize <= MAX_EXPORT_SIZE) bundle.phase_outputs[phase] = txt;
          } catch {}
        }
      } else if (val && typeof val === 'object') {
        bundle.phase_outputs[phase] = {};
        for (const [agentId, filePath] of Object.entries(val)) {
          if (cumSize > MAX_EXPORT_SIZE) break;
          if (filePath && filePath !== 'null') {
            let fp;
            try { fp = safePath(PROJECT_ROOT, filePath); } catch { continue; }
            if (store.exists(fp)) {
              try {
                const txt = _cache.read(fp);
                cumSize += Buffer.byteLength(txt);
                if (cumSize <= MAX_EXPORT_SIZE) bundle.phase_outputs[phase][agentId] = txt;
              } catch {}
            }
          }
        }
      }
    }
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
    return json(res, 400, { error: 'Invalid topic slug' });
  }

  const filePath = safePath(HELP_DIR, slug + '.md');
  if (!getStore().exists(filePath)) {
    return json(res, 404, { error: 'Help topic not found' });
  }
  const content = _cache.read(filePath);
  const entry = HELP_TOC.find(t => t.slug === slug);
  json(res, 200, { slug, title: entry ? entry.title : slug, content });
}

/* ── Static file serving ──────────────────────────────────────── */

let cachedHtml = null;
try {
  const htmlPath = path.join(WEBAPP_DIR, 'index.html');
  if (getStore().exists(htmlPath)) cachedHtml = Buffer.from(getStore().readFile(htmlPath));
} catch { /* index.html not found — static serving will return 404 */ }

function serveStatic(_req, res) {
  if (!cachedHtml) { res.writeHead(404); return res.end('Not found'); }
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
  'POST /api/command':       apiPostCommand,
  'GET /api/command':        apiGetCommand,
  'GET /api/progress':       apiGetProgress,
  'GET /api/export':         apiGetExport,
  'GET /api/help':             apiGetHelp,
  'GET /health':             (_req, res) => json(res, 200, { status: 'ok', uptime: Math.round(process.uptime()) }),
};

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  const pathname = new URL(req.url, `http://${HOST}:${PORT}`).pathname.replace(/\/+$/, '') || '/';
  const key = `${req.method} ${pathname}`;
  if (ROUTES[key]) {
    try { await ROUTES[key](req, res); }
    catch (err) {
      if (!res.headersSent) { json(res, err.status || 500, { error: err.message }); }
      else { res.end(); }
    }
  } else if (req.method === 'GET' && !pathname.startsWith('/api')) {
    serveStatic(req, res);
  } else {
    // Check if path exists with different method → 405
    const allowed = Object.keys(ROUTES)
      .filter(k => k.endsWith(' ' + pathname))
      .map(k => k.split(' ')[0]);
    if (allowed.length > 0) {
      setSecurityHeaders(res);
      const body = JSON.stringify({ error: 'Method Not Allowed' });
      res.writeHead(405, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
        'Allow': allowed.join(', '),
      });
      res.end(body);
    } else {
      json(res, 404, { error: 'Not found' });
    }
  }
  log(req.method, pathname, res.statusCode, Date.now() - start);
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
    _cache,
  };
}
