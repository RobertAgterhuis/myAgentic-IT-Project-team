#!/usr/bin/env node
// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';

const path = require('path');

/* ── Domain Models (SP-R2-002-003) ────────────────────────────── *
 * Consolidates parsing logic for Questionnaire, Decision, and
 * Pipeline (session-state) data. These are pure functions that
 * operate on content strings — no fs dependency.
 * ─────────────────────────────────────────────────────────────── */

/* ── Shared utilities ─────────────────────────────────────────── */

/** Escape special regex characters in a string. @param {string} s @returns {string} */
function escRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
/** @returns {string} Today's date as YYYY-MM-DD. */
function today() { return new Date().toISOString().split('T')[0]; }
/** @returns {string} Current timestamp in ISO 8601 format. */
function isoNow() { return new Date().toISOString(); }
/** Escape pipe characters for safe markdown table embedding. @param {string} s @returns {string} */
function escPipe(s) { return (s || '').replace(/\|/g, '\\|'); }
/**
 * Replace a literal substring (no regex expansion of $ in replacement).
 * @param {string} str - Source string.
 * @param {string} search - Literal substring to find.
 * @param {string} replacement - Replacement text.
 * @returns {string}
 */
function literalReplace(str, search, replacement) { return str.replace(search, () => replacement); }

/** Regex for validating question IDs (e.g. Q-05-001). */
const Q_ID_RE = /^Q-\d{1,3}-\d{1,4}$/;
/** Regex for validating decision IDs (e.g. DEC-R2-001). */
const DEC_ID_RE = /^DEC-[\w-]{1,30}$/;

/* ── Questionnaire Model ──────────────────────────────────────── */

function parseQuestionnaireMetadata(content) {
  const meta = { agent: '', phase: '', generated: '', version: '' };
  const titleM = content.match(/^#\s+Questionnaire:\s*(.+)/m);
  if (titleM) meta.agent = titleM[1].trim();
  const metaM = content.match(/>\s*Phase:\s*(.+?)\s*\|\s*Generated:\s*(.+?)\s*\|\s*Version:\s*(.+)/m);
  if (metaM) { meta.phase = metaM[1].trim(); meta.generated = metaM[2].trim(); meta.version = metaM[3].trim(); }
  return meta;
}

function parseStatusMap(content) {
  const statusMap = {};
  const tableStart = content.indexOf('## Answer Status');
  if (tableStart === -1) return statusMap;
  const re = /\|\s*(Q-\d+-\d+)\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|/g;
  let m;
  while ((m = re.exec(content.slice(tableStart)))) statusMap[m[1]] = { status: m[2], lastUpdated: m[3].trim() };
  return statusMap;
}

function skipToAnswerEnd(lines, startIdx) {
  const ansLines = [];
  let i = startIdx;
  while (i < lines.length) {
    const line = lines[i];
    if (/^---/.test(line) || /^###/.test(line) || /^##\s/.test(line)) break;
    const stripped = line.replace(/^>\s?/, '');
    if (stripped !== '*(fill in here)*') ansLines.push(stripped);
    i++;
  }
  return { answer: ansLines.join('\n').trim(), nextIndex: i };
}

function applyQuestionField(line, cur) {
  let fm;
  if ((fm = line.match(/^\*\*Question:\*\*\s*(.+)/)))           cur.question        = fm[1].trim();
  else if ((fm = line.match(/^\*\*Why we need this:\*\*\s*(.+)/))) cur.whyNeeded    = fm[1].trim();
  else if ((fm = line.match(/^\*\*Expected format:\*\*\s*(.+)/)))  cur.expectedFormat = fm[1].trim();
  else if ((fm = line.match(/^\*\*Example:\*\*\s*(.+)/)))          cur.example        = fm[1].trim();
}

/**
 * Parse a questionnaire markdown file into a structured object.
 * Extracts metadata, sections, questions, answers, and status.
 * @param {string} content - Markdown file content.
 * @param {string} filePath - Absolute path to the questionnaire file.
 * @param {string} basePath - Base directory for computing relative paths.
 * @returns {{ file: string, agent: string, phase: string, sections: object[], questions: object[] }}
 */
function parseQuestionnaire(content, filePath, basePath) {
  const lines = content.split(/\r?\n/);
  const meta = parseQuestionnaireMetadata(content);
  const q = {
    file: path.relative(basePath, filePath).replace(/\\/g, '/'),
    agent: meta.agent, phase: meta.phase, generated: meta.generated, version: meta.version,
    sections: [], questions: [],
  };
  const statusMap = parseStatusMap(content);

  let sec = null, cur = null;

  function finalize() {
    if (!cur) return;
    const st = statusMap[cur.id];
    cur.status = st ? st.status : 'OPEN';
    cur.lastUpdated = st ? st.lastUpdated : '';
    q.questions.push(cur);
    if (sec) sec.questions.push(cur);
    cur = null;
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
    if (/^\*\*Your answer:\*\*/.test(line)) {
      const result = skipToAnswerEnd(lines, i + 1);
      cur.answer = result.answer;
      i = result.nextIndex - 1;
      continue;
    }

    applyQuestionField(line, cur);
  }
  finalize();
  return q;
}

function skipOldAnswerLines(lines, i) {
  while (i < lines.length && !/^---/.test(lines[i]) && !/^###/.test(lines[i]) && !/^##\s/.test(lines[i])) i++;
  return i;
}

function formatAnswerLines(newAnswer) {
  if (newAnswer && newAnswer.trim()) {
    return newAnswer.split('\n').map(l => `> ${l}`);
  }
  return ['> *(fill in here)*'];
}

function replaceAnswerBlock(lines, escapedId, newAnswer) {
  const result = [];
  let i = 0;
  while (i < lines.length) {
    if (new RegExp(`^###\\s+${escapedId}\\s+\\[`).test(lines[i])) {
      result.push(lines[i++]);
      while (i < lines.length && !/^\*\*Your answer:\*\*/.test(lines[i])) result.push(lines[i++]);
      if (i < lines.length) {
        result.push(lines[i++]); // **Your answer:**
        i = skipOldAnswerLines(lines, i);
        result.push(...formatAnswerLines(newAnswer), '');
      }
      continue;
    }
    result.push(lines[i++]);
  }
  return result;
}

function replaceStatusRow(lines, questionId, newStatus) {
  const result = [];
  const esc = escRx(questionId);
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(`\\|\\s*${esc}\\s*\\|`).test(lines[i])) {
      result.push(`| ${questionId} | ${newStatus} | ${today()} |`);
    } else {
      result.push(lines[i]);
    }
  }
  return result;
}

/**
 * Update a question's answer and status in questionnaire markdown content.
 * @param {string} content - Current markdown content.
 * @param {string} questionId - Question ID (e.g. 'Q-05-001').
 * @param {string} newAnswer - New answer text.
 * @param {string} newStatus - New status (e.g. 'ANSWERED', 'OPEN').
 * @returns {string} Updated markdown content.
 */
function updateAnswerInContent(content, questionId, newAnswer, newStatus) {
  const lines = content.split(/\r?\n/);
  const esc = escRx(questionId);
  const withAnswer = replaceAnswerBlock(lines, esc, newAnswer);
  const withStatus = replaceStatusRow(withAnswer, questionId, newStatus);
  return withStatus.join('\n');
}

/* ── Decision Model ───────────────────────────────────────────── */

function parseDecisionTable(content, sectionRegex, rowRegex, mapRow) {
  const section = content.match(sectionRegex);
  if (!section) return [];
  const results = [];
  let m;
  while ((m = rowRegex.exec(section[1]))) {
    const item = mapRow(m);
    if (item) results.push(item);
  }
  return results;
}

/**
 * Parse the decisions markdown into structured open, decided, and deferred lists.
 * @param {string} content - Full decisions.md content.
 * @returns {{ open: object[], decided: object[], deferred: object[] }}
 */
function parseDecisions(content) {
  if (!content) return { open: [], decided: [], deferred: [] };

  const open = parseDecisionTable(content,
    /## Open Questions[^\n]*\n([\s\S]*?)(?=\n---|\n## )/,
    /\|\s*(DEC-[\w-]+)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g,
    m => m[4].includes('No open questions') ? null : { id: m[1], type: 'OPEN_QUESTION', status: 'OPEN', priority: m[2], scope: m[3].trim(), question: m[4].trim(), answer: m[5].trim(), date: m[6].trim() }
  );

  const trans = parseDecisionTable(content,
    /### Transformation Decisions[^\n]*\n([\s\S]*?)(?=\n### |\n---|\n## )/,
    /\|\s*(DEC-T-[\d]+)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g,
    m => ({ id: m[1], type: 'DECIDED', status: 'DECIDED', priority: m[2], scope: m[3].trim(), decision: m[4].trim(), notes: m[5].trim(), date: m[6].trim() })
  );

  const reev = parseDecisionTable(content,
    /### Reevaluation Decisions[^\n]*\n([\s\S]*?)(?=\n### |\n---|\n## )/,
    /\|\s*(DEC-R2-[\d]+)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g,
    m => ({ id: m[1], type: 'DECIDED', status: 'DECIDED', priority: m[2], scope: m[3].trim(), decision: m[4].trim(), notes: m[5].trim(), date: m[6].trim() })
  );

  const ops = parseDecisionTable(content,
    /### Operational Decisions[^\n]*\n([\s\S]*?)(?=\n---|\n## )/,
    /\|\s*(DEC-[\d]+)\s*\|\s*(HIGH|MEDIUM|LOW|—)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g,
    m => m[4].includes('Add a decision here') ? null : { id: m[1], type: 'DECIDED', status: 'DECIDED', priority: m[2], scope: m[3].trim(), decision: m[4].trim(), notes: m[5].trim(), date: m[6].trim() }
  );

  const deferred = parseDecisionTable(content,
    /## Deferred & Expired[^\n]*\n([\s\S]*?)(?=\n---|\n## |$)/,
    /\|\s*(DEC-[\w-]+)\s*\|\s*(DEFERRED|EXPIRED)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g,
    m => ({ id: m[1], type: m[2] === 'DEFERRED' ? 'OPEN_QUESTION' : 'DECIDED', status: m[2], scope: m[3].trim(), subject: m[4].trim(), reason: m[5].trim(), date: m[6].trim() })
  );

  return { open, decided: [...trans, ...reev, ...ops], deferred };
}

/* ── Shared table-row insertion helper ─────────────────────────── */

/**
 * Insert a markdown table row, replacing a placeholder marker or
 * appending after the last row in a section. Used by addOpenQuestion,
 * addOperationalDecision, and moveToDecided.
 * @param {string} content    - Full markdown content.
 * @param {RegExp} marker     - Placeholder row regex to replace.
 * @param {RegExp} sectionRe  - Section-end regex (capture group 1 = rows before `---`).
 * @param {string} row        - The new table row string.
 * @returns {string} Updated content.
 */
function insertTableRow(content, marker, sectionRe, row) {
  if (marker.test(content)) {
    return content.replace(marker, () => row);
  }
  const secEnd = content.match(sectionRe);
  if (secEnd) {
    return content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

/* ── Decision content mutation functions ──────────────────────── */

/**
 * Compute the next sequential decision ID for a given prefix.
 * @param {string} content - Decisions markdown to scan.
 * @param {string} prefix - ID prefix (e.g. 'DEC-R2-').
 * @returns {string} Next ID (e.g. 'DEC-R2-011').
 */
function nextDecisionId(content, prefix) {
  const re = new RegExp(`${escRx(prefix)}(\\d+)`, 'g');
  let max = 0, m;
  while ((m = re.exec(content))) max = Math.max(max, parseInt(m[1], 10));
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

/**
 * Add a new open question row to the Open Questions table.
 * @param {string} content - Decisions markdown.
 * @param {{ id: string, priority: string, scope: string, question: string, answer?: string, date: string }} entry
 * @returns {string} Updated markdown.
 */
function addOpenQuestion(content, entry) {
  const marker = /\|\s*\|\s*\|\s*\|\s*\*\(No open questions\)\*\s*\|\s*\|\s*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.question)} | ${escPipe(entry.answer || '')} | ${escPipe(entry.date)} |`;
  return insertTableRow(content, marker, /(## Open Questions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/, row);
}

/**
 * Add an operational decision row to the Operational Decisions table.
 * @param {string} content - Decisions markdown.
 * @param {{ id: string, priority: string, scope: string, decision: string, notes?: string, date: string }} entry
 * @returns {string} Updated markdown.
 */
function addOperationalDecision(content, entry) {
  const marker = /\|\s*DEC-100\s*\|\s*—\s*\|\s*—\s*\|\s*\*\(Add a decision here\)\*\s*\|[^\n]*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.decision)} | ${escPipe(entry.notes || '')} | ${escPipe(entry.date)} |`;
  return insertTableRow(content, marker, /(### Operational Decisions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/, row);
}

/**
 * Update the answer field of an existing open question.
 * @param {string} content - Decisions markdown.
 * @param {string} id - Decision ID.
 * @param {string} answer - The answer text.
 * @returns {string} Updated markdown.
 */
function answerOpenQuestion(content, id, answer) {
  const esc = escRx(id);
  const re = new RegExp(`(\\|\\s*${esc}\\s*\\|\\s*(?:HIGH|MEDIUM|LOW)\\s*\\|\\s*[^|]*\\|\\s*[^|]*\\|)\\s*[^|]*\\|\\s*[\\d-]*\\s*\\|`);
  const m = content.match(re);
  if (!m) return content;
  const replacement = `${m[1]} ${escPipe(answer)} | ${today()} |`;
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

/**
 * Move an open question to the decided (Operational Decisions) table.
 * @param {string} content - Decisions markdown.
 * @param {string} id - Decision ID to move.
 * @returns {string} Updated markdown.
 */
function moveToDecided(content, id) {
  const esc = escRx(id);
  const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([^|]*)\\|\\s*([\\d-]*)\\s*\\|[^\\n]*\\n?`);
  const m = content.match(rowRe);
  if (!m) return content;
  const priority = m[1], scope = m[2].trim(), question = m[3].trim(), answer = m[4].trim();
  content = content.replace(m[0], '');
  content = restoreOpenPlaceholderIfEmpty(content);
  const entry = { id, priority, scope, decision: question, notes: answer, date: today() };
  const marker = /\|\s*DEC-100\s*\|\s*—\s*\|\s*—\s*\|\s*\*\(Add a decision here\)\*\s*\|[^\n]*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.decision)} | ${escPipe(entry.notes)} | ${escPipe(entry.date)} |`;
  content = insertTableRow(content, marker, /(### Operational Decisions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/, row);
  return content;
}

/**
 * Defer an open question — remove from Open, add to Deferred & Expired.
 * @param {string} content - Decisions markdown.
 * @param {string} id - Decision ID.
 * @param {string} [reason] - Reason for deferring.
 * @returns {string} Updated markdown.
 */
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

/**
 * Expire a decided item — remove from decided, add to Deferred & Expired as EXPIRED.
 * @param {string} content - Decisions markdown.
 * @param {string} id - Decision ID.
 * @param {string} [reason] - Reason for expiring.
 * @returns {string} Updated markdown.
 */
function expireDecidedItem(content, id, reason) {
  const esc = escRx(id);
  const rowRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW|—)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  const m = content.match(rowRe);
  if (!m) return content;
  const scope = m[2].trim(), text = m[3].trim();
  content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
  return insertDeferredRow(content, id, 'EXPIRED', scope, text, reason || 'Expired via webapp');
}

/**
 * Reopen a deferred/expired/decided item back into the open questions table.
 * @param {string} content - Decisions markdown.
 * @param {string} id - Decision ID.
 * @returns {string} Updated markdown.
 */
function reopenItem(content, id) {
  const esc = escRx(id);
  const defRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(?:DEFERRED|EXPIRED)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  let m = content.match(defRe);
  if (m) {
    const scope = m[1].trim(), subject = m[2].trim();
    content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
    return addOpenQuestion(content, { id, priority: 'HIGH', scope, question: subject, answer: '', date: today() });
  }
  const decRe = new RegExp(`\\|\\s*${esc}\\s*\\|\\s*(HIGH|MEDIUM|LOW|—)\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|`);
  m = content.match(decRe);
  if (m) {
    const priority = m[1] === '—' ? 'MEDIUM' : m[1], scope = m[2].trim(), text = m[3].trim();
    content = content.replace(new RegExp(`\\|\\s*${esc}\\s*\\|[^\\n]*\\n?`), '');
    return addOpenQuestion(content, { id, priority, scope, question: text, answer: '', date: today() });
  }
  return content;
}

/**
 * Edit fields of an existing decided row in-place.
 * @param {string} content - Decisions markdown.
 * @param {string} id - Decision ID.
 * @param {{ priority?: string, scope?: string, text?: string, notes?: string }} fields - Fields to update.
 * @returns {string} Updated markdown.
 */
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

function isDataRow(line) {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && !/^\|[\s-]+\|$/.test(t) && !/^\|\s*ID\b/.test(t);
}

function findTableInsertionLine(lines) {
  let lastRow = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isDataRow(lines[i])) lastRow = i;
  }
  if (lastRow >= 0) return lastRow + 1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\|[-\s|]+/.test(lines[i])) return i + 1;
  }
  return -1;
}

function insertDeferredRow(content, id, status, scope, subject, reason) {
  const row = `| ${escPipe(id)} | ${escPipe(status)} | ${escPipe(scope)} | ${escPipe(subject)} | ${escPipe(reason)} | ${today()} |`;
  const defIdx = content.indexOf('## Deferred & Expired');
  if (defIdx === -1) return content;
  const afterDef = content.slice(defIdx + 1);
  const nextH = afterDef.search(/\n## /);
  const sectionEnd = nextH !== -1 ? defIdx + 1 + nextH : content.length;
  const section = content.slice(defIdx, sectionEnd);

  if (/\|\s*\|\s*\|\s*\|\s*\|\s*\|\s*\|/.test(section)) {
    return content.slice(0, defIdx) + section.replace(/\|\s*\|\s*\|\s*\|\s*\|\s*\|\s*\|/, row) + content.slice(sectionEnd);
  }
  const lines = section.split('\n');
  const insertAt = findTableInsertionLine(lines);
  if (insertAt >= 0) {
    lines.splice(insertAt, 0, row);
    return content.slice(0, defIdx) + lines.join('\n') + content.slice(sectionEnd);
  }
  return content;
}

/**
 * Append an audit trail entry to the Change Log section.
 * @param {string} content - Decisions markdown.
 * @param {string} action - Action name (e.g. 'ANSWERED', 'DECIDED').
 * @param {string} id - Decision ID involved.
 * @returns {string} Updated markdown with new audit entry.
 */
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

/* ── Pipeline Model (session-state helpers) ───────────────────── */

/**
 * Parse a session-state JSON string into an object.
 * @param {string} content - JSON string.
 * @returns {object|null} Parsed session state, or null if invalid.
 */
function parseSessionState(content) {
  if (!content) return null;
  try { return JSON.parse(content); }
  catch { return null; }
}

/* ── Exports ──────────────────────────────────────────────────── */

module.exports = {
  // Shared utils
  escRx, today, isoNow, escPipe, literalReplace, Q_ID_RE, DEC_ID_RE,

  // Questionnaire
  parseQuestionnaire, updateAnswerInContent,

  // Decisions
  parseDecisions, nextDecisionId,
  addOpenQuestion, addOperationalDecision, answerOpenQuestion,
  moveToDecided, deferOpenQuestion, expireDecidedItem,
  reopenItem, editDecidedRow, restoreOpenPlaceholderIfEmpty,
  insertDeferredRow, appendAuditTrail,

  // Pipeline
  parseSessionState,
};
