/**
 * Extracted frontend utility functions for testability.
 *
 * These functions are canonical implementations shared between index.html
 * (inline script) and unit tests. Pure functions (no DOM) can be tested
 * without jsdom; DOM helpers require a jsdom environment.
 *
 * REC-R3-004 — Evaluate lightweight frontend testing
 */

/* ── Pure string helpers ─────────────────────────────── */

/**
 * Escape a string for use inside an HTML attribute value.
 * Covers &, ', ", <, >, newline, carriage-return, and tab.
 */
function escAttr(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
    .replace(/\t/g, '&#9;');
}

/**
 * Convert a Markdown string to safe HTML.
 * Uses an escape-first approach: all raw HTML is neutralized before
 * markdown constructs are converted.
 */
function renderMarkdown(md) {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // fenced code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, code) =>
    '<pre><code>' + code + '</code></pre>');
  // tables
  html = html.replace(/^(\|.+\|)\n(\|[-|: ]+\|)\n((?:\|.+\|\n?)*)/gm, (_, hdr, _sep, body) => {
    const thCells = hdr.split('|').filter(c => c.trim()).map(c => '<th>' + c.trim() + '</th>').join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => '<td>' + c.trim() + '</td>').join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    return '<table><thead><tr>' + thCells + '</tr></thead><tbody>' + rows + '</tbody></table>';
  });
  // headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // hr
  html = html.replace(/^---$/gm, '<hr>');
  // blockquote (> is now &gt;)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links — href was escaped, unescape for protocol check then sanitize
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    const raw = href.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (!/^(https?:|mailto:|#|\/)/i.test(raw.trim())) return text;
    const safeHref = raw.replace(/"/g, '%22');
    return `<a href="${safeHref}" target="_blank" rel="noopener">${text}</a>`;
  });
  // unordered list
  html = html.replace(/^((?:- .+\n?)+)/gm, m => {
    const items = m.trim().split('\n').map(l => '<li>' + l.replace(/^- /, '') + '</li>').join('');
    return '<ul>' + items + '</ul>';
  });
  // ordered list
  html = html.replace(/^((?:\d+\. .+\n?)+)/gm, m => {
    const items = m.trim().split('\n').map(l => '<li>' + l.replace(/^\d+\.\s*/, '') + '</li>').join('');
    return '<ol>' + items + '</ol>';
  });
  // paragraphs — wrap remaining plain lines
  html = html.replace(/^(?!<[a-z])(\S.+)$/gm, '<p>$1</p>');
  // collapse consecutive blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');
  return html;
}

/* ── Timing helpers ──────────────────────────────────── */

/** Classic debounce: delays fn execution until ms after the last call. */
function debounce(fn, ms) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

/**
 * Compute the ideal polling interval based on progress state.
 * Returns the interval in milliseconds.
 * @param {object|null} progress - The progress object from /api/progress
 */
function computePollInterval(progress) {
  if (progress && progress.active) return 3000;
  if (progress && progress.command && progress.command.status === 'PENDING') return 5000;
  return 30000;
}

/* ── Cross-reference helper ──────────────────────────── */

/**
 * Find questionnaires related to a decision's scope.
 * @param {object} decision - Decision with a .scope property
 * @param {Array} questionnaireList - Array of questionnaire objects
 * @returns {string} HTML badge string or empty string
 */
function findCrossRefs(decision, questionnaireList) {
  const scope = (decision.scope || '').toLowerCase();
  if (!scope || !questionnaireList.length) return '';
  const matches = questionnaireList.filter(q => {
    const ph = (q.phase || '').toLowerCase();
    return (ph && scope.includes(ph)) || (ph && ph.includes(scope)) || scope.includes('all');
  });
  if (matches.length === 0) return '';
  const total = matches.reduce((n, q) => n + q.questions.length, 0);
  return ` <span class="xref-badge" title="Related: ${matches.map(q => q.agent).join(', ')}"><span aria-hidden="true">&#128203;</span> ${total} Q</span>`;
}

/* ── DOM validation helpers (require jsdom for testing) ── */

/**
 * Show or clear an inline error on a form field.
 * @param {HTMLElement} field - input/textarea element
 * @param {string} msg - error message (empty to clear)
 */
function setFieldError(field, msg) {
  const existing = field.parentElement.querySelector('.error-msg');
  if (existing) existing.remove();
  if (msg) {
    field.classList.add('field-error');
    field.setAttribute('aria-invalid', 'true');
    const errId = field.id ? field.id + '-err' : '';
    const el = document.createElement('div');
    el.className = 'error-msg';
    el.setAttribute('role', 'alert');
    if (errId) { el.id = errId; field.setAttribute('aria-describedby', errId); }
    el.textContent = msg;
    field.parentElement.appendChild(el);
  } else {
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }
}

/** Validate that a required text field is non-empty. Returns true if valid. */
function validateRequired(field, label) {
  if (!field.value.trim()) {
    setFieldError(field, `${label} is required`);
    return false;
  }
  setFieldError(field, '');
  return true;
}

/** Validate the ANSWERED-but-empty pattern for questionnaire answers. */
function validateAnswerStatus(answerEl, statusEl) {
  if (statusEl && statusEl.value === 'ANSWERED' && !answerEl.value.trim()) {
    setFieldError(answerEl, 'Answer cannot be empty when status is ANSWERED');
    return false;
  }
  setFieldError(answerEl, '');
  return true;
}

/* ── Exports ─────────────────────────────────────────── */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escAttr,
    renderMarkdown,
    debounce,
    computePollInterval,
    findCrossRefs,
    setFieldError,
    validateRequired,
    validateAnswerStatus,
  };
}
