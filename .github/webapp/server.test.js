// Copyright (c) 2026 Robert Agterhuis. MIT License.
'use strict';
/* global describe, it, expect */
const {
  sanitizeMarkdown, sanitizeQID, detectSecrets, checkSecretsInBody,
  safePath, setSecurityHeaders, withFileLock,
} = require('./server');

/* ── Story #1: Content Sanitization (IMPL-CONSTRAINT-002) ─────── */
describe('sanitizeMarkdown', () => {
  it('escapes heading syntax at start of line', () => {
    expect(sanitizeMarkdown('# Heading')).toBe('\\# Heading');
    expect(sanitizeMarkdown('### Deep')).toBe('\\### Deep');
  });

  it('escapes horizontal rules', () => {
    expect(sanitizeMarkdown('---')).toBe('\\---');
    expect(sanitizeMarkdown('  ---  ')).toBe('\\---');
  });

  it('escapes table row syntax at start of line', () => {
    expect(sanitizeMarkdown('| cell |')).toBe('\\| cell |');
  });

  it('returns non-string values as-is', () => {
    expect(sanitizeMarkdown(null)).toBe(null);
    expect(sanitizeMarkdown(42)).toBe(42);
  });

  it('leaves normal text untouched', () => {
    expect(sanitizeMarkdown('Hello world')).toBe('Hello world');
  });
});

describe('sanitizeQID', () => {
  it('neutralizes Q-ID patterns with non-breaking hyphen', () => {
    const result = sanitizeQID('See Q-10-004 for details');
    expect(result).not.toContain('Q-10-004');
    expect(result).toContain('Q\u201010\u2010004');
  });

  it('leaves normal text untouched', () => {
    expect(sanitizeQID('No IDs here')).toBe('No IDs here');
  });

  it('returns non-string values as-is', () => {
    expect(sanitizeQID(undefined)).toBe(undefined);
  });
});

/* ── Story #8: Secret Detection (IMPL-CONSTRAINT-008) ─────────── */
describe('detectSecrets', () => {
  it('detects AWS access keys', () => {
    expect(detectSecrets('key=AKIAIOSFODNN7EXAMPLE')).toContain('AWS Access Key');
  });

  it('detects GitHub tokens', () => {
    expect(detectSecrets('ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl')).toContain('GitHub Token');
  });

  it('detects private keys', () => {
    expect(detectSecrets('-----BEGIN RSA PRIVATE KEY-----')).toContain('Private Key');
    expect(detectSecrets('-----BEGIN PRIVATE KEY-----')).toContain('Private Key');
  });

  it('detects generic API keys', () => {
    expect(detectSecrets('api_key=abcdefghij1234567890')).toContain('Generic API Key');
  });

  it('detects bearer tokens', () => {
    expect(detectSecrets('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test=')).toContain('Bearer Token');
  });

  it('returns empty array for clean text', () => {
    expect(detectSecrets('Just normal text')).toEqual([]);
  });

  it('returns empty array for non-string', () => {
    expect(detectSecrets(null)).toEqual([]);
    expect(detectSecrets(123)).toEqual([]);
  });

  it('detects multiple patterns', () => {
    const text = 'AKIAIOSFODNN7EXAMPLE and -----BEGIN PRIVATE KEY-----';
    const result = detectSecrets(text);
    expect(result).toContain('AWS Access Key');
    expect(result).toContain('Private Key');
  });
});

describe('checkSecretsInBody', () => {
  it('checks specified fields and returns unique warnings', () => {
    const body = { answer: 'AKIAIOSFODNN7EXAMPLE', notes: 'safe' };
    const result = checkSecretsInBody(body, ['answer', 'notes']);
    expect(result).toContain('AWS Access Key');
    expect(result.length).toBe(1);
  });

  it('returns empty for clean fields', () => {
    const body = { answer: 'Normal answer', notes: 'Normal notes' };
    expect(checkSecretsInBody(body, ['answer', 'notes'])).toEqual([]);
  });

  it('skips missing fields', () => {
    const body = {};
    expect(checkSecretsInBody(body, ['answer'])).toEqual([]);
  });
});

/* ── Story #10: Security Headers ──────────────────────────────── */
describe('setSecurityHeaders', () => {
  it('sets all 7 recommended security headers', () => {
    const headers = {};
    const mockRes = { setHeader: (k, v) => { headers[k] = v; } };
    setSecurityHeaders(mockRes);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(headers['Cross-Origin-Embedder-Policy']).toBe('require-corp');
  });
});

/* ── safePath (existing positive finding — must preserve) ─────── */
describe('safePath', () => {
  it('blocks path traversal attempts', () => {
    expect(() => safePath('/base', '../../../etc/passwd')).toThrow('Path traversal blocked');
    expect(() => safePath('/base', '/absolute/path')).toThrow('Path traversal blocked');
  });

  it('allows valid relative paths', () => {
    const result = safePath('/base', 'subdir/file.md');
    expect(result).toContain('subdir');
    expect(result).toContain('file.md');
  });
});

/* ── Story #11: File Locking (race condition fix) ─────────────── */
describe('withFileLock', () => {
  it('serializes concurrent calls on the same file', async () => {
    const order = [];
    const p1 = withFileLock('/test/a.md', async () => {
      await new Promise(r => setTimeout(r, 50));
      order.push(1);
      return 'first';
    });
    const p2 = withFileLock('/test/a.md', async () => {
      order.push(2);
      return 'second';
    });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe('first');
    expect(r2).toBe('second');
    expect(order).toEqual([1, 2]);
  });

  it('allows parallel calls on different files', async () => {
    const order = [];
    const p1 = withFileLock('/test/a.md', async () => {
      await new Promise(r => setTimeout(r, 30));
      order.push('a');
    });
    const p2 = withFileLock('/test/b.md', async () => {
      order.push('b');
    });
    await Promise.all([p1, p2]);
    // b should complete before a since a has a delay
    expect(order[0]).toBe('b');
  });
});
