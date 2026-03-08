/**
 * @vitest-environment jsdom
 *
 * Frontend utility tests — REC-R3-004
 * Pure-function tests run without DOM; DOM validation tests use jsdom.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const {
  escAttr,
  renderMarkdown,
  debounce,
  computePollInterval,
  findCrossRefs,
  setFieldError,
  validateRequired,
  validateAnswerStatus,
} = require('./frontend-utils');

/* ════════════════════════════════════════════════════════
   escAttr — HTML attribute escaping
   ════════════════════════════════════════════════════════ */
describe('escAttr', () => {
  it('escapes ampersand', () => expect(escAttr('a&b')).toBe('a&amp;b'));
  it('escapes single quotes', () => expect(escAttr("a'b")).toBe('a&#39;b'));
  it('escapes double quotes', () => expect(escAttr('a"b')).toBe('a&quot;b'));
  it('escapes less-than', () => expect(escAttr('a<b')).toBe('a&lt;b'));
  it('escapes greater-than', () => expect(escAttr('a>b')).toBe('a&gt;b'));
  it('escapes newline', () => expect(escAttr('a\nb')).toBe('a&#10;b'));
  it('escapes carriage-return', () => expect(escAttr('a\rb')).toBe('a&#13;b'));
  it('escapes tab', () => expect(escAttr('a\tb')).toBe('a&#9;b'));
  it('handles null/undefined', () => {
    expect(escAttr(null)).toBe('');
    expect(escAttr(undefined)).toBe('');
  });
  it('returns empty string for empty input', () => expect(escAttr('')).toBe(''));
  it('handles combined special chars', () => {
    expect(escAttr('<script>"xss"&</script>'))
      .toBe('&lt;script&gt;&quot;xss&quot;&amp;&lt;/script&gt;');
  });
  it('preserves safe characters', () => {
    expect(escAttr('Hello World 123!')).toBe('Hello World 123!');
  });
});

/* ════════════════════════════════════════════════════════
   renderMarkdown — Markdown → safe HTML
   ════════════════════════════════════════════════════════ */
describe('renderMarkdown', () => {
  describe('headings', () => {
    it('renders h1', () => expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>'));
    it('renders h2', () => expect(renderMarkdown('## Sub')).toContain('<h2>Sub</h2>'));
    it('renders h3', () => expect(renderMarkdown('### H3')).toContain('<h3>H3</h3>'));
    it('renders h4', () => expect(renderMarkdown('#### H4')).toContain('<h4>H4</h4>'));
  });

  describe('inline formatting', () => {
    it('renders bold', () => expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>'));
    it('renders italic', () => expect(renderMarkdown('*italic*')).toContain('<em>italic</em>'));
    it('renders bold+italic', () => {
      const out = renderMarkdown('***both***');
      expect(out).toContain('<strong><em>both</em></strong>');
    });
    it('renders inline code', () => expect(renderMarkdown('use `foo()`')).toContain('<code>foo()</code>'));
  });

  describe('code blocks', () => {
    it('renders fenced code', () => {
      const md = '```js\nconst x = 1;\n```';
      const out = renderMarkdown(md);
      expect(out).toContain('<pre><code>');
      expect(out).toContain('const x = 1;');
    });
  });

  describe('links', () => {
    it('renders https links', () => {
      const out = renderMarkdown('[Google](https://google.com)');
      expect(out).toContain('<a href="https://google.com"');
      expect(out).toContain('target="_blank"');
      expect(out).toContain('rel="noopener"');
    });
    it('renders anchor links', () => {
      expect(renderMarkdown('[top](#top)')).toContain('href="#top"');
    });
    it('renders root-relative links', () => {
      expect(renderMarkdown('[api](/api/health)')).toContain('href="/api/health"');
    });
    it('strips javascript: links', () => {
      const out = renderMarkdown('[xss](javascript:alert(1))');
      expect(out).not.toContain('href');
      expect(out).toContain('xss');
    });
    it('strips data: links', () => {
      const out = renderMarkdown('[click](data:text/html,<h1>x</h1>)');
      expect(out).not.toContain('href');
    });
  });

  describe('lists', () => {
    it('renders unordered list', () => {
      const out = renderMarkdown('- one\n- two\n- three');
      expect(out).toContain('<ul>');
      expect(out).toContain('<li>one</li>');
      expect(out).toContain('<li>three</li>');
    });
    it('renders ordered list', () => {
      const out = renderMarkdown('1. first\n2. second');
      expect(out).toContain('<ol>');
      expect(out).toContain('<li>first</li>');
    });
  });

  describe('tables', () => {
    it('renders a markdown table', () => {
      const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |';
      const out = renderMarkdown(md);
      expect(out).toContain('<table>');
      expect(out).toContain('<th>Name</th>');
      expect(out).toContain('<td>Alice</td>');
      expect(out).toContain('<td>25</td>');
    });
  });

  describe('other elements', () => {
    it('renders hr', () => expect(renderMarkdown('---')).toContain('<hr>'));
    it('renders blockquote', () => {
      expect(renderMarkdown('> important note')).toContain('<blockquote>important note</blockquote>');
    });
    it('wraps plain text in <p>', () => {
      expect(renderMarkdown('Just text')).toContain('<p>Just text</p>');
    });
  });

  describe('XSS prevention', () => {
    it('escapes HTML tags in input', () => {
      const out = renderMarkdown('<script>alert("xss")</script>');
      expect(out).not.toContain('<script>');
      expect(out).toContain('&lt;script&gt;');
    });
    it('escapes HTML in heading content', () => {
      const out = renderMarkdown('# <img onerror=alert(1)>');
      expect(out).toContain('&lt;img');
      expect(out).not.toContain('<img');
    });
    it('escapes HTML in table cells', () => {
      const md = '| Col |\n| --- |\n| <b>x</b> |';
      const out = renderMarkdown(md);
      expect(out).toContain('&lt;b&gt;');
      expect(out).not.toContain('<b>x</b>');
    });
  });

  describe('consecutive blockquotes collapse', () => {
    it('merges adjacent blockquotes', () => {
      const out = renderMarkdown('> line1\n> line2');
      // Should collapse into one blockquote with <br>
      expect(out).toContain('<br>');
    });
  });
});

/* ════════════════════════════════════════════════════════
   debounce — timing utility
   ════════════════════════════════════════════════════════ */
describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('delays execution by the specified ms', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('a');
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('resets timer on repeated calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    vi.advanceTimersByTime(80);
    debounced('b');
    vi.advanceTimersByTime(80);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('calls with latest arguments', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 50);
    debounced(1, 2);
    debounced(3, 4);
    debounced(5, 6);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith(5, 6);
    expect(fn).toHaveBeenCalledOnce();
  });
});

/* ════════════════════════════════════════════════════════
   computePollInterval — adaptive polling
   ════════════════════════════════════════════════════════ */
describe('computePollInterval', () => {
  it('returns 3000 when session is active', () => {
    expect(computePollInterval({ active: true })).toBe(3000);
  });
  it('returns 5000 when command is PENDING', () => {
    expect(computePollInterval({ active: false, command: { status: 'PENDING' } })).toBe(5000);
  });
  it('returns 30000 when idle', () => {
    expect(computePollInterval({ active: false })).toBe(30000);
  });
  it('returns 30000 for null progress', () => {
    expect(computePollInterval(null)).toBe(30000);
  });
  it('returns 30000 for undefined progress', () => {
    expect(computePollInterval(undefined)).toBe(30000);
  });
  it('active takes precedence over pending command', () => {
    expect(computePollInterval({ active: true, command: { status: 'PENDING' } })).toBe(3000);
  });
});

/* ════════════════════════════════════════════════════════
   findCrossRefs — decision/questionnaire cross-references
   ════════════════════════════════════════════════════════ */
describe('findCrossRefs', () => {
  const questionnaires = [
    { phase: 'Phase-1', agent: 'Business Analyst', questions: [{ id: 'Q1' }, { id: 'Q2' }] },
    { phase: 'Phase-2', agent: 'Software Architect', questions: [{ id: 'Q3' }] },
    { phase: 'Phase-3', agent: 'UX Designer', questions: [{ id: 'Q4' }, { id: 'Q5' }, { id: 'Q6' }] },
  ];

  it('returns empty string when scope is empty', () => {
    expect(findCrossRefs({ scope: '' }, questionnaires)).toBe('');
  });
  it('returns empty string when questionnaires is empty', () => {
    expect(findCrossRefs({ scope: 'Phase-1' }, [])).toBe('');
  });
  it('returns empty string when no matches found', () => {
    expect(findCrossRefs({ scope: 'Phase-999' }, questionnaires)).toBe('');
  });
  it('matches by scope containing phase name', () => {
    const result = findCrossRefs({ scope: 'Phase-1' }, questionnaires);
    expect(result).toContain('2 Q');
    expect(result).toContain('Business Analyst');
    expect(result).toContain('xref-badge');
  });
  it('matches "all" scope against all questionnaires', () => {
    const result = findCrossRefs({ scope: 'all' }, questionnaires);
    expect(result).toContain('6 Q');
  });
  it('matches by phase containing scope (reverse match)', () => {
    // scope = 'phase' is contained in 'Phase-1', 'Phase-2', 'Phase-3'
    const result = findCrossRefs({ scope: 'phase' }, questionnaires);
    expect(result).toContain('6 Q');
  });
  it('handles null scope gracefully', () => {
    expect(findCrossRefs({}, questionnaires)).toBe('');
  });
  it('handles decision with undefined scope', () => {
    expect(findCrossRefs({ scope: undefined }, questionnaires)).toBe('');
  });
});

/* ════════════════════════════════════════════════════════
   setFieldError — DOM validation (jsdom)
   ════════════════════════════════════════════════════════ */
describe('setFieldError', () => {
  let container, field;

  beforeEach(() => {
    container = document.createElement('div');
    field = document.createElement('input');
    field.id = 'testField';
    container.appendChild(field);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds error message element when msg is non-empty', () => {
    setFieldError(field, 'Required');
    const errEl = container.querySelector('.error-msg');
    expect(errEl).not.toBeNull();
    expect(errEl.textContent).toBe('Required');
    expect(errEl.getAttribute('role')).toBe('alert');
  });

  it('sets aria-invalid and aria-describedby on field', () => {
    setFieldError(field, 'Required');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe('testField-err');
  });

  it('adds field-error CSS class', () => {
    setFieldError(field, 'Bad input');
    expect(field.classList.contains('field-error')).toBe(true);
  });

  it('clears error when msg is empty', () => {
    setFieldError(field, 'Error first');
    setFieldError(field, '');
    expect(container.querySelector('.error-msg')).toBeNull();
    expect(field.classList.contains('field-error')).toBe(false);
    expect(field.getAttribute('aria-invalid')).toBeNull();
    expect(field.getAttribute('aria-describedby')).toBeNull();
  });

  it('replaces existing error message', () => {
    setFieldError(field, 'First');
    setFieldError(field, 'Second');
    const msgs = container.querySelectorAll('.error-msg');
    expect(msgs.length).toBe(1);
    expect(msgs[0].textContent).toBe('Second');
  });

  it('handles field without id (no aria-describedby)', () => {
    field.removeAttribute('id');
    setFieldError(field, 'Error');
    expect(field.getAttribute('aria-describedby')).toBeNull();
    const errEl = container.querySelector('.error-msg');
    expect(errEl.id).toBe('');
  });
});

/* ════════════════════════════════════════════════════════
   validateRequired — required field validation (jsdom)
   ════════════════════════════════════════════════════════ */
describe('validateRequired', () => {
  let container, field;

  beforeEach(() => {
    container = document.createElement('div');
    field = document.createElement('input');
    field.id = 'reqField';
    container.appendChild(field);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns false and shows error for empty field', () => {
    field.value = '';
    expect(validateRequired(field, 'Name')).toBe(false);
    expect(container.querySelector('.error-msg').textContent).toBe('Name is required');
  });

  it('returns false for whitespace-only field', () => {
    field.value = '   ';
    expect(validateRequired(field, 'Scope')).toBe(false);
  });

  it('returns true and clears error for valid field', () => {
    field.value = 'Hello';
    expect(validateRequired(field, 'Name')).toBe(true);
    expect(container.querySelector('.error-msg')).toBeNull();
  });

  it('clears a previous error when field becomes valid', () => {
    field.value = '';
    validateRequired(field, 'Name');
    expect(field.getAttribute('aria-invalid')).toBe('true');
    field.value = 'Now valid';
    validateRequired(field, 'Name');
    expect(field.getAttribute('aria-invalid')).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════
   validateAnswerStatus — questionnaire answer validation
   ════════════════════════════════════════════════════════ */
describe('validateAnswerStatus', () => {
  let container, answerEl, statusEl;

  beforeEach(() => {
    container = document.createElement('div');
    answerEl = document.createElement('textarea');
    answerEl.id = 'answer';
    statusEl = document.createElement('select');
    const opt1 = document.createElement('option'); opt1.value = 'UNANSWERED'; opt1.text = 'Unanswered';
    const opt2 = document.createElement('option'); opt2.value = 'ANSWERED'; opt2.text = 'Answered';
    statusEl.appendChild(opt1);
    statusEl.appendChild(opt2);
    container.appendChild(answerEl);
    container.appendChild(statusEl);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns false when status is ANSWERED but answer is empty', () => {
    statusEl.value = 'ANSWERED';
    answerEl.value = '';
    expect(validateAnswerStatus(answerEl, statusEl)).toBe(false);
    expect(container.querySelector('.error-msg').textContent)
      .toBe('Answer cannot be empty when status is ANSWERED');
  });

  it('returns true when status is ANSWERED and answer is present', () => {
    statusEl.value = 'ANSWERED';
    answerEl.value = 'My answer';
    expect(validateAnswerStatus(answerEl, statusEl)).toBe(true);
  });

  it('returns true when status is UNANSWERED regardless of answer', () => {
    statusEl.value = 'UNANSWERED';
    answerEl.value = '';
    expect(validateAnswerStatus(answerEl, statusEl)).toBe(true);
  });

  it('returns true when statusEl is null', () => {
    answerEl.value = '';
    expect(validateAnswerStatus(answerEl, null)).toBe(true);
  });

  it('clears previous error when validation passes', () => {
    statusEl.value = 'ANSWERED';
    answerEl.value = '';
    validateAnswerStatus(answerEl, statusEl);
    expect(answerEl.getAttribute('aria-invalid')).toBe('true');

    answerEl.value = 'Fixed';
    validateAnswerStatus(answerEl, statusEl);
    expect(answerEl.getAttribute('aria-invalid')).toBeNull();
    expect(container.querySelector('.error-msg')).toBeNull();
  });
});
