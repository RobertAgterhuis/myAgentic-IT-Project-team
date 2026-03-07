#!/usr/bin/env node
'use strict';

const path = require('path');

/* ── Domain Models (SP-R2-002-003) ────────────────────────────── *
 * Consolidates parsing logic for Questionnaire, Decision, and
 * Pipeline (session-state) data. These are pure functions that
 * operate on content strings — no fs dependency.
 * ─────────────────────────────────────────────────────────────── */

/* ── Shared utilities ─────────────────────────────────────────── */

function escRx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function today() { return new Date().toISOString().split('T')[0]; }
function isoNow() { return new Date().toISOString(); }
function escPipe(s) { return (s || '').replace(/\|/g, '\\|'); }
function literalReplace(str, search, replacement) { return str.replace(search, () => replacement); }

const Q_ID_RE = /^Q-\d{1,3}-\d{1,4}$/;
const DEC_ID_RE = /^DEC-[\w-]{1,30}$/;

/* ── Questionnaire Model ──────────────────────────────────────── */

function parseQuestionnaire(content, filePath, basePath) {
  const lines = content.split(/\r?\n/);
  const q = {
    file: path.relative(basePath, filePath).replace(/\\/g, '/'),
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

/* ── Decision Model ───────────────────────────────────────────── */

function parseDecisions(content) {
  if (!content) return { open: [], decided: [], deferred: [] };
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

  // Parse "Reevaluation Decisions" table
  const reevSection = content.match(/### Reevaluation Decisions[^\n]*\n([\s\S]*?)(?=\n### |\n---|\n## )/);
  if (reevSection) {
    const re = /\|\s*(DEC-R2-[\d]+)\s*\|\s*(HIGH|MEDIUM|LOW)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*([\d-]*)\s*\|/g;
    let m;
    while ((m = re.exec(reevSection[1]))) {
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

/* ── Decision content mutation functions ──────────────────────── */

function nextDecisionId(content, prefix) {
  const re = new RegExp(`${escRx(prefix)}(\\d+)`, 'g');
  let max = 0, m;
  while ((m = re.exec(content))) max = Math.max(max, parseInt(m[1], 10));
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

function addOpenQuestion(content, entry) {
  const marker = /\|\s*\|\s*\|\s*\|\s*\*\(No open questions\)\*\s*\|\s*\|\s*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.question)} | ${escPipe(entry.answer || '')} | ${escPipe(entry.date)} |`;
  if (marker.test(content)) {
    return content.replace(marker, () => row);
  }
  const secEnd = content.match(/(## Open Questions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/);
  if (secEnd) {
    return content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

function addOperationalDecision(content, entry) {
  const marker = /\|\s*DEC-100\s*\|\s*—\s*\|\s*—\s*\|\s*\*\(Add a decision here\)\*\s*\|[^\n]*\|/;
  const row = `| ${escPipe(entry.id)} | ${escPipe(entry.priority)} | ${escPipe(entry.scope)} | ${escPipe(entry.decision)} | ${escPipe(entry.notes || '')} | ${escPipe(entry.date)} |`;
  if (marker.test(content)) {
    return content.replace(marker, () => row);
  }
  const secEnd = content.match(/(### Operational Decisions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/);
  if (secEnd) {
    return content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

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
  if (marker.test(content)) {
    content = content.replace(marker, () => row);
  } else {
    const secEnd = content.match(/(### Operational Decisions[^\n]*\n[\s\S]*?\|[^\n]+\|)\s*\n+---/);
    if (secEnd) content = content.replace(secEnd[0], secEnd[1] + '\n' + row + '\n\n---');
  }
  return content;
}

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
  let lastRow = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('|') && t.endsWith('|') && !/^\|[\s-]+\|$/.test(t) && !/^\|\s*ID\b/.test(t)) lastRow = i;
  }
  if (lastRow >= 0) {
    lines.splice(lastRow + 1, 0, row);
    return content.slice(0, defIdx) + lines.join('\n') + content.slice(sectionEnd);
  }
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

/* ── Pipeline Model (session-state helpers) ───────────────────── */

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
