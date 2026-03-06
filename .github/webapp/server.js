#!/usr/bin/env node
// Questionnaire Manager — Local API server
// Zero external dependencies. Requires Node.js 14+.
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

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
}

function safeWriteSync(filePath, data, encoding) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, data, encoding || 'utf8');
  } catch (err) {
    throw Object.assign(new Error(`File write failed (${path.basename(filePath)}): ${err.message}`), { status: 500 });
  }
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

function escRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function today() { return new Date().toISOString().split('T')[0]; }
function isoNow() { return new Date().toISOString(); }
function literalReplace(str, search, replacement) { return str.replace(search, () => replacement); }
function escPipe(s) { return (s || '').replace(/\|/g, '\\|'); }
const Q_ID_RE = /^Q-\d{1,3}-\d{1,4}$/;
const DEC_ID_RE = /^DEC-[\w-]{1,30}$/;

function assertString(val, name, maxLen = 1000) {
  if (typeof val !== 'string') throw Object.assign(new Error(`${name} must be a string`), { status: 400 });
  if (val.length > maxLen) throw Object.assign(new Error(`${name} exceeds max length (${maxLen})`), { status: 400 });
}

const _writeLocks = new Map();
async function withFileLock(filePath, fn) {
  const key = path.resolve(filePath);
  while (_writeLocks.has(key)) await _writeLocks.get(key);
  let resolve;
  _writeLocks.set(key, new Promise(r => { resolve = r; }));
  try { return await fn(); }
  finally { _writeLocks.delete(key); resolve(); }
}

function log(method, url, status, ms) {
  const ts = new Date().toISOString();
  console.log(`  ${ts} ${method} ${url} → ${status} (${ms}ms)`);
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
  if (!fs.existsSync(BUSINESS_DOCS)) return [];
  const results = [];
  (function walk(dir, depth) {
    if (depth > 20) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
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

/* ── Markdown parser ──────────────────────────────────────────── */

function parseQuestionnaire(content, filePath) {
  const lines = content.split(/\r?\n/);
  const q = {
    file: path.relative(BUSINESS_DOCS, filePath).replace(/\\/g, '/'),
    agent: '', phase: '', generated: '', version: '',
    sections: [], questions: [],
  };

  const titleM = content.match(/^#\s+Questionnaire:\s*(.+)/m);
  if (titleM) q.agent = titleM[1].trim();

  const metaM = content.match(/>\s*Phase:\s*(.+?)\s*\|\s*Generated:\s*(.+?)\s*\|\s*Version:\s*(.+)/m);
  if (metaM) { q.phase = metaM[1].trim(); q.generated = metaM[2].trim(); q.version = metaM[3].trim(); }

  // Pre-parse status table
  const statusMap = {};
  const tableStart = content.indexOf('## Answer Status');
  if (tableStart !== -1) {
    const re = /\|\s*(Q-\d+-\d+)\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|/g;
    let m;
    while ((m = re.exec(content.slice(tableStart)))) statusMap[m[1]] = { status: m[2], lastUpdated: m[3].trim() };
  }

  let sec = null, cur = null, inAns = false, ansLines = [];

  function finalize() {
    if (!cur) return;
    if (inAns) cur.answer = ansLines.join('\n').trim();
    const st = statusMap[cur.id];
    cur.status = st ? st.status : 'OPEN';
    cur.lastUpdated = st ? st.lastUpdated : '';
    q.questions.push(cur);
    if (sec) sec.questions.push(cur);
    cur = null; inAns = false; ansLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+Answer\s+Status/i.test(line)) { finalize(); break; }

    const secM = line.match(/^##\s+Section\s+\d+:\s*(.+)/);
    if (secM) { finalize(); sec = { title: secM[1].trim(), questions: [] }; q.sections.push(sec); continue; }

    const qM = line.match(/^###\s+(Q-\d+-\d+)\s+\[(REQUIRED|OPTIONAL)]/);
    if (qM) {
      finalize();
      cur = { id: qM[1], classification: qM[2], question: '', whyNeeded: '', expectedFormat: '', example: '', answer: '', section: sec ? sec.title : '', status: 'OPEN', lastUpdated: '' };
      continue;
    }

    if (!cur) continue;
    if (/^\*\*Your answer:\*\*/.test(line)) { inAns = true; ansLines = []; continue; }

    if (inAns) {
      if (/^---/.test(line) || /^###/.test(line) || /^##\s/.test(line)) { cur.answer = ansLines.join('\n').trim(); inAns = false; i--; continue; }
      const stripped = line.replace(/^>\s?/, '');
      if (stripped !== '*(fill in here)*') ansLines.push(stripped);
      continue;
    }

    let fm;
    if ((fm = line.match(/^\*\*Question:\*\*\s*(.+)/)))           cur.question        = fm[1].trim();
    else if ((fm = line.match(/^\*\*Why we need this:\*\*\s*(.+)/))) cur.whyNeeded    = fm[1].trim();
    else if ((fm = line.match(/^\*\*Expected format:\*\*\s*(.+)/)))  cur.expectedFormat = fm[1].trim();
    else if ((fm = line.match(/^\*\*Example:\*\*\s*(.+)/)))          cur.example        = fm[1].trim();
  }
  finalize();
  return q;
}

/* ── Markdown writer ──────────────────────────────────────────── */

function updateAnswerInContent(content, questionId, newAnswer, newStatus) {
  const lines  = content.split(/\r?\n/);
  const result = [];
  const esc    = escRx(questionId);
  let i = 0;

  while (i < lines.length) {
    if (new RegExp(`^###\\s+${esc}\\s+\\[`).test(lines[i])) {
      result.push(lines[i++]);
      while (i < lines.length && !/^\*\*Your answer:\*\*/.test(lines[i])) result.push(lines[i++]);
      if (i < lines.length) {
        result.push(lines[i++]); // **Your answer:**
        while (i < lines.length && !/^---/.test(lines[i]) && !/^###/.test(lines[i]) && !/^##\s/.test(lines[i])) i++;
        if (newAnswer && newAnswer.trim()) {
          for (const l of newAnswer.split('\n')) result.push(`> ${l}`);
        } else {
          result.push('> *(fill in here)*');
        }
        result.push('');
      }
      continue;
    }
    if (new RegExp(`\\|\\s*${esc}\\s*\\|`).test(lines[i])) {
      result.push(`| ${questionId} | ${newStatus} | ${today()} |`);
      i++;
      continue;
    }
    result.push(lines[i++]);
  }
  return result.join('\n');
}

/* ── Questionnaire index updater ──────────────────────────────── */

function rebuildQuestionnaireIndex() {
  const files = discoverQuestionnaires();
  if (files.length === 0) return;

  const rows = [];
  for (const f of files) {
    let content;
    try { content = fs.readFileSync(f, 'utf8'); } catch { continue; }
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
    try { content = fs.readFileSync(f, 'utf8'); } catch { continue; }
    questionnaires.push(parseQuestionnaire(content, f));
  }
  json(res, 200, { questionnaires });
}

async function apiGetSession(_req, res) {
  if (!fs.existsSync(SESSION_FILE)) return json(res, 200, { session: null });
  let session;
  try { session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); }
  catch { return json(res, 200, { session: null }); }
  json(res, 200, { session });
}

async function apiSave(req, res) {
  const body = await parseBody(req);
  assertString(body.file, 'file', 500);
  if (!Array.isArray(body.updates) || body.updates.length === 0 || body.updates.length > 200) return json(res, 400, { error: 'updates must be 1–200 items' });

  const filePath = safePath(BUSINESS_DOCS, body.file);
  if (!fs.existsSync(filePath)) return json(res, 404, { error: 'File not found' });

  for (const u of body.updates) {
    if (!Q_ID_RE.test(u.questionId)) return json(res, 400, { error: `Invalid Q-ID: ${u.questionId}` });
    if (!['OPEN', 'ANSWERED', 'DEFERRED'].includes(u.status)) return json(res, 400, { error: `Invalid status: ${u.status}` });
  }

  await withFileLock(filePath, () => {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const u of body.updates) content = updateAnswerInContent(content, u.questionId, u.answer, u.status);
    safeWriteSync(filePath, content);
  });

  scheduleRebuildIndex();
  json(res, 200, { ok: true, saved: body.updates.length });
}

async function apiReevaluate(req, res) {
  const body  = await parseBody(req);
  const scope = ['ALL', 'BUSINESS', 'TECH', 'UX', 'MARKETING'].includes(body.scope) ? body.scope : 'ALL';
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  safeWriteSync(
    path.join(SESSION_DIR, 'reevaluate-trigger.json'),
    JSON.stringify({ requested_at: isoNow(), scope, source: 'questionnaire-webapp', status: 'PENDING' }, null, 2)
  );
  json(res, 200, { ok: true, scope, message: `Trigger written. Type REEVALUATE ${scope} in Copilot chat.` });
}

/* ── Decisions parser ─────────────────────────────────────────── */

function parseDecisions() {
  if (!fs.existsSync(DECISIONS_FILE)) return { open: [], decided: [], deferred: [] };
  const content = fs.readFileSync(DECISIONS_FILE, 'utf8');
  const open = [], decided = [], deferred = [];

  // Parse "Open Questions" table
  const openSection = content.match(/## Open Questions[^\n]*\n([\s\S]*?)(?=\n---|\n## )/);
  if (openSection) {
    const re = /\|\s*(DEC-[\w-]+)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g;
    let m;
    while ((m = re.exec(openSection[1]))) {
      if (m[4].includes('No open questions')) continue;
      open.push({ id: m[1], type: 'OPEN_QUESTION', status: 'OPEN', priority: m[2], scope: m[3].trim(), question: m[4].trim(), answer: m[5].trim(), date: m[6].trim() });
    }
  }

  // Parse "Transformation Decisions" table
  const transSection = content.match(/### Transformation Decisions[^\n]*\n([\s\S]*?)(?=\n### |\n---|\n## )/);
  if (transSection) {
    const re = /\|\s*(DEC-T-[\d]+)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g;
    let m;
    while ((m = re.exec(transSection[1]))) {
      decided.push({ id: m[1], type: 'DECIDED', status: 'DECIDED', priority: m[2], scope: m[3].trim(), decision: m[4].trim(), notes: m[5].trim(), date: m[6].trim() });
    }
  }

  // Parse "Operational Decisions" table
  const opsSection = content.match(/### Operational Decisions[^\n]*\n([\s\S]*?)(?=\n---|\n## )/);
  if (opsSection) {
    const re = /\|\s*(DEC-[\d]+)\s*\|\s*(HIGH|MEDIUM|LOW|—)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g;
    let m;
    while ((m = re.exec(opsSection[1]))) {
      if (m[4].includes('Add a decision here')) continue;
      decided.push({ id: m[1], type: 'DECIDED', status: 'DECIDED', priority: m[2], scope: m[3].trim(), decision: m[4].trim(), notes: m[5].trim(), date: m[6].trim() });
    }
  }

  // Parse "Deferred & Expired" table
  const defSection = content.match(/## Deferred & Expired[^\n]*\n([\s\S]*?)(?=\n---|\n## |$)/);
  if (defSection) {
    const re = /\|\s*(DEC-[\w-]+)\s*\|\s*(DEFERRED|EXPIRED)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g;
    let m;
    while ((m = re.exec(defSection[1]))) {
      deferred.push({ id: m[1], type: m[2] === 'DEFERRED' ? 'OPEN_QUESTION' : 'DECIDED', status: m[2], scope: m[3].trim(), subject: m[4].trim(), reason: m[5].trim(), date: m[6].trim() });
    }
  }

  return { open, decided, deferred };
}

/* ── Decisions writer ────────────────────────────────────────── */

function nextDecisionId(content, prefix) {
  const re = new RegExp(`${escRx(prefix)}(\\d+)`, 'g');
  let max = 0, m;
  while ((m = re.exec(content))) max = Math.max(max, parseInt(m[1], 10));
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function addOpenQuestion(content, entry) {
  // Insert row before the empty-state row or at end of Open Questions table
  const marker = /\|\s*\|\s*\|\s*\|\s*\*\(No open questions\)\*\s*\|\s*\|\s*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.question)} | ${escPipe(entry.answer || '')} | ${escPipe(entry.date)} |`;
  if (marker.test(content)) {
    return content.replace(marker, () => row);
  }
  // Append after last row in Open Questions table (before the ---)
  const secEnd = content.match(/(## Open Questions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/);
  if (secEnd) {
    return content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

function addOperationalDecision(content, entry) {
  // Insert row before the placeholder row or append
  const marker = /\|\s*DEC-100\s*\|\s*—\s*\|\s*—\s*\|\s*\*\(Add a decision here\)\*\s*\|[^\n]*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.decision)} | ${escPipe(entry.notes || '')} | ${escPipe(entry.date)} |`;
  if (marker.test(content)) {
    return content.replace(marker, () => row);
  }
  // Append after last row in Operational Decisions table
  const secEnd = content.match(/(### Operational Decisions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/);
  if (secEnd) {
    return content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

function answerOpenQuestion(content, id, answer) {
  // Find the row with the given ID in the Open Questions table and fill in the answer + update date
  const esc = escRx(id);
  const re = new RegExp(`(\\|\\s*${esc}\\s*\\|\\s*(?:HIGH|MEDIUM|LOW)\\s*\\|\\s*[^|]*\\|\\s*[^|]*\\|)\\s*[^|]*\\|\\s*[\\d-]*\\s*\\|`);
  const m = content.match(re);
  if (!m) return content;
  const replacement = `${m[1]} ${escPipe(answer)} | ${today()} |`;
  return literalReplace(content, m[0], replacement);
}

function moveToDecided(content, id) {
  // Remove from Open Questions, add to Operational Decisions
  const esc = escRx(id);
  const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([\\d-]*)\\s*\\|[^\\n]*\\n?`);
  const m = content.match(rowRe);
  if (!m) return content;
  const priority = m[1], scope = m[2].trim(), question = m[3].trim(), answer = m[4].trim(), date = m[5].trim();
  // Remove the row from open questions
  content = content.replace(m[0], '');
  // Check if open questions table is now empty and restore placeholder
  const openCheck = content.match(/## Open Questions[^\n]*\n\|[^\n]+\|\n\|[-\s|]+\|\n(\s*\n+---)/);
  if (openCheck) {
    content = content.replace(openCheck[0], openCheck[0].replace(openCheck[1], `| | | | *(No open questions)* | | |\n\n---`));
  }
  // Add as operational decision
  const entry = { id, priority, scope, decision: question, notes: answer, date: today() };
  const marker = /\|\s*DEC-100\s*\|\s*—\s*\|\s*—\s*\|\s*\*\(Add a decision here\)\*\s*\|[^\n]*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.decision)} | ${escPipe(entry.notes)} | ${escPipe(entry.date)} |`;
  if (marker.test(content)) {
    content = content.replace(marker, () => row);
  } else {
    const secEnd = content.match(/(### Operational Decisions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/);
    if (secEnd) content = content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

/* ── Decisions: additional transitions ────────────────────────── */

function deferOpenQuestion(content, id, reason) {
  const esc = escRx(id);
  const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  const m = content.match(rowRe);
  if (!m) return content;
  const scope = m[2].trim(), question = m[3].trim();
  content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
  content = restoreOpenPlaceholderIfEmpty(content);
  return insertDeferredRow(content, id, 'DEFERRED', scope, question, reason || 'Deferred via webapp');
}

function expireDecidedItem(content, id, reason) {
  const esc = escRx(id);
  const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW|—)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  const m = content.match(rowRe);
  if (!m) return content;
  const scope = m[2].trim(), text = m[3].trim();
  content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
  return insertDeferredRow(content, id, 'EXPIRED', scope, text, reason || 'Expired via webapp');
}

function reopenItem(content, id) {
  const esc = escRx(id);
  // Try deferred table first
  const defRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(?:DEFERRED|EXPIRED)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  let m = content.match(defRe);
  if (m) {
    const scope = m[1].trim(), subject = m[2].trim();
    content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
    return addOpenQuestion(content, { id, priority: 'HIGH', scope, question: subject, answer: '', date: today() });
  }
  // Try decided tables
  const decRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW|—)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  m = content.match(decRe);
  if (m) {
    const priority = m[1] === '—' ? 'MEDIUM' : m[1], scope = m[2].trim(), text = m[3].trim();
    content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
    return addOpenQuestion(content, { id, priority, scope, question: text, answer: '', date: today() });
  }
  return content;
}

function editDecidedRow(content, id, fields) {
  const esc = escRx(id);
  const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW|—)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([\\d-]*)\\s*\\|`);
  const m = content.match(rowRe);
  if (!m) return content;
  const p = fields.priority || m[1].trim();
  if (p && !['HIGH', 'MEDIUM', 'LOW', '—'].includes(p)) return content;
  const s = fields.scope !== undefined ? fields.scope : m[2].trim();
  const t = fields.text  !== undefined ? fields.text  : m[3].trim();
  const n = fields.notes !== undefined ? fields.notes : m[4].trim();
  const replacement = `| ${escPipe(id)} | ${escPipe(p)} | ${escPipe(s)} | ${escPipe(t)} | ${escPipe(n)} | ${today()} |`;
  return literalReplace(content, m[0], replacement);
}

function restoreOpenPlaceholderIfEmpty(content) {
  const idx = content.indexOf('## Open Questions');
  if (idx === -1) return content;
  const endIdx = content.indexOf('\n---', idx);
  if (endIdx === -1) return content;
  const section = content.slice(idx, endIdx);
  if (/\|\s*DEC-/.test(section) || /No open questions/.test(section)) return content;
  return content.slice(0, endIdx) + '\n| | | | *(No open questions)* | | |' + content.slice(endIdx);
}

function insertDeferredRow(content, id, status, scope, subject, reason) {
  const row = `| ${escPipe(id)} | ${escPipe(status)} | ${escPipe(scope)} | ${escPipe(subject)} | ${escPipe(reason)} | ${today()} |`;
  const defIdx = content.indexOf('## Deferred & Expired');
  if (defIdx === -1) return content;
  // Scope to just this section (up to next ## heading or end)
  const afterDef = content.slice(defIdx + 1);
  const nextH = afterDef.search(/\n## /);
  const sectionEnd = nextH !== -1 ? defIdx + 1 + nextH : content.length;
  const section = content.slice(defIdx, sectionEnd);

  // Replace empty placeholder row
  if (/\|\s*\|\s*\|\s*\|\s*\|\s*\|\s*\|/.test(section)) {
    return content.slice(0, defIdx) + section.replace(/\|\s*\|\s*\|\s*\|\s*\|\s*\|\s*\|/, row) + content.slice(sectionEnd);
  }
  // Append after last data row
  const lines = section.split('\n');
  let lastRow = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('|') && t.endsWith('|') && !/^\|[\s-]+\|$/.test(t) && !/^\|\s*ID\b/.test(t)) lastRow = i;
  }
  if (lastRow >= 0) {
    lines.splice(lastRow + 1, 0, row);
    return content.slice(0, defIdx) + lines.join('\n') + content.slice(sectionEnd);
  }
  // No data rows — insert after separator line
  for (let i = 0; i < lines.length; i++) {
    if (/^\|[-\s|]+/.test(lines[i])) {
      lines.splice(i + 1, 0, row);
      return content.slice(0, defIdx) + lines.join('\n') + content.slice(sectionEnd);
    }
  }
  return content;
}

function appendAuditTrail(content, action, id) {
  const entry = `- ${isoNow()} | \`${action}\` | \`${id}\` | source: webapp`;
  if (/## Change Log/.test(content)) {
    return content.replace(/(## Change Log\n\n?)/, '$1' + entry + '\n');
  }
  const exIdx = content.indexOf('\n## Examples');
  if (exIdx !== -1) {
    return content.slice(0, exIdx) + '\n---\n\n## Change Log\n\n' + entry + '\n' + content.slice(exIdx);
  }
  return content.trimEnd() + '\n\n---\n\n## Change Log\n\n' + entry + '\n';
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

  if (!fs.existsSync(DECISIONS_FILE)) return json(res, 404, { error: 'decisions.md not found' });

  return withFileLock(DECISIONS_FILE, () => {
    let content = fs.readFileSync(DECISIONS_FILE, 'utf8');

    switch (body.action) {
    case 'create': {
      if (!body.type || !body.priority || !body.scope || !body.text) {
        return json(res, 400, { error: 'Missing type, priority, scope, or text' });
      }
      if (!['DECIDED', 'OPEN_QUESTION'].includes(body.type)) return json(res, 400, { error: 'Invalid type' });
      if (!['HIGH', 'MEDIUM', 'LOW'].includes(body.priority)) return json(res, 400, { error: 'Invalid priority' });
      const id = nextDecisionId(content, 'DEC-');
      if (body.type === 'OPEN_QUESTION') {
        content = addOpenQuestion(content, { id, priority: body.priority, scope: body.scope, question: body.text, answer: '', date: today() });
      } else {
        content = addOperationalDecision(content, { id, priority: body.priority, scope: body.scope, decision: body.text, notes: body.notes || '', date: today() });
      }
      content = appendAuditTrail(content, 'create', id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id, action: body.type === 'OPEN_QUESTION' ? 'created_open_question' : 'created_decision' });
    }
    case 'answer': {
      if (!body.id || !body.answer) return json(res, 400, { error: 'Missing id or answer' });
      content = answerOpenQuestion(content, body.id, body.answer);
      content = appendAuditTrail(content, 'answer', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id: body.id, action: 'answered' });
    }
    case 'decide': {
      if (!body.id || !body.answer) return json(res, 400, { error: 'Missing id or answer' });
      content = answerOpenQuestion(content, body.id, body.answer);
      content = moveToDecided(content, body.id);
      content = appendAuditTrail(content, 'decide', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id: body.id, action: 'decided' });
    }
    case 'defer': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = deferOpenQuestion(content, body.id, body.reason || '');
      content = appendAuditTrail(content, 'defer', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id: body.id, action: 'deferred' });
    }
    case 'expire': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = expireDecidedItem(content, body.id, body.reason || '');
      content = appendAuditTrail(content, 'expire', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id: body.id, action: 'expired' });
    }
    case 'reopen': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = reopenItem(content, body.id);
      content = appendAuditTrail(content, 'reopen', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id: body.id, action: 'reopened' });
    }
    case 'edit': {
      if (!body.id) return json(res, 400, { error: 'Missing id' });
      content = editDecidedRow(content, body.id, { priority: body.priority, scope: body.scope, text: body.text, notes: body.notes });
      content = appendAuditTrail(content, 'edit', body.id);
      safeWriteSync(DECISIONS_FILE, content);
      return json(res, 200, { ok: true, id: body.id, action: 'edited' });
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
  const cmd = body.command.trim().toUpperCase();
  const parts = cmd.split(/\s+/);
  const isValid = VALID_COMMANDS.includes(cmd)
    || VALID_COMMANDS.includes(parts.slice(0, 2).join(' '))
    || (VALID_COMMANDS.includes(parts[0]) && parts.length <= 1);
  if (!isValid) {
    return json(res, 400, { error: `Unknown command: ${body.command}` });
  }

  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

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
    if (!fs.existsSync(BUSINESS_DOCS)) fs.mkdirSync(BUSINESS_DOCS, { recursive: true });
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
  if (fs.existsSync(COMMAND_QUEUE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(COMMAND_QUEUE, 'utf8'));
      queue = Array.isArray(existing) ? existing : (existing ? [existing] : []);
    } catch {}
  }
  const MAX_QUEUE_SIZE = 50;
  queue.push(entry);
  if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE);
  safeWriteSync(COMMAND_QUEUE, JSON.stringify(queue, null, 2));
  json(res, 200, { ok: true, clipboard_text: clipText, brief_saved: !!entry.brief_saved, message: `Command queued. Paste in Copilot Chat: ${clipText}` });
}

async function apiGetCommand(_req, res) {
  if (!fs.existsSync(COMMAND_QUEUE)) return json(res, 200, { command: null, queue: [] });
  try {
    const raw = JSON.parse(fs.readFileSync(COMMAND_QUEUE, 'utf8'));
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
  if (fs.existsSync(COMMAND_QUEUE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(COMMAND_QUEUE, 'utf8'));
      const queue = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      command = queue.length ? queue[queue.length - 1] : null;
    } catch {}
  }

  if (!fs.existsSync(SESSION_FILE)) {
    return json(res, 200, { active: false, phases: buildEmptyPhases(), session: null, command });
  }
  let session;
  try { session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch { return json(res, 200, { active: false, phases: buildEmptyPhases(), session: null, command }); }

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
  const bundle = { exported_at: isoNow(), session: null, command_queue: [], phase_outputs: {} };

  // Session state
  if (fs.existsSync(SESSION_FILE)) {
    try { bundle.session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch {}
  }

  // Command queue
  if (fs.existsSync(COMMAND_QUEUE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(COMMAND_QUEUE, 'utf8'));
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
        if (fs.existsSync(fp)) {
          try {
            const txt = fs.readFileSync(fp, 'utf8');
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
            if (fs.existsSync(fp)) {
              try {
                const txt = fs.readFileSync(fp, 'utf8');
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
  if (!fs.existsSync(filePath)) {
    return json(res, 404, { error: 'Help topic not found' });
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const entry = HELP_TOC.find(t => t.slug === slug);
  json(res, 200, { slug, title: entry ? entry.title : slug, content });
}

/* ── Static file serving ──────────────────────────────────────── */

const cachedHtml = fs.existsSync(path.join(WEBAPP_DIR, 'index.html'))
  ? fs.readFileSync(path.join(WEBAPP_DIR, 'index.html'))
  : null;

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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ERROR: Port ${PORT} is already in use.`);
    console.error(`  Stop the other process or set a different port: PORT=3001 node server.js\n`);
  } else {
    console.error(`\n  Server error: ${err.message}\n`);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Questionnaire & Decisions Manager`);
  console.log(`  ──────────────────────────────────`);
  console.log(`  Server       : http://${HOST}:${PORT}\n`);
});

/* ── Graceful shutdown ─────────────────────────────────────────── */

function shutdown() {
  console.log('\n  Shutting down gracefully...');
  server.close(() => { console.log('  Server closed.'); process.exit(0); });
  const forceTimer = setTimeout(() => { console.error('  Forced shutdown after timeout.'); process.exit(1); }, 5000);
  forceTimer.unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => { console.error('  Unhandled rejection:', reason); });
process.on('uncaughtException', (err) => { console.error('  Uncaught exception:', err); shutdown(); });
