'use strict';
/* global describe, it, expect */
const { ERROR_CATALOG, errorResponse, statusToCode } = require('./utils/errors');

describe('errorResponse', () => {
  it('returns standardized format with all four fields', () => {
    const r = errorResponse('VALIDATION_ERROR', 'bad input');
    expect(r).toEqual({
      error: 'bad input',
      code: 'VALIDATION_ERROR',
      message: 'bad input',
      recovery: 'Check your input and try again.',
    });
  });

  it('uses default message when no detail is provided', () => {
    const r = errorResponse('FILE_NOT_FOUND');
    expect(r.error).toBe('The requested file was not found.');
    expect(r.code).toBe('FILE_NOT_FOUND');
    expect(r.message).toBe('The requested file was not found.');
    expect(r.recovery).toBe('Refresh the page to reload the latest data.');
  });

  it('falls back to INTERNAL_ERROR for unknown codes', () => {
    const r = errorResponse('DOES_NOT_EXIST', 'oops');
    expect(r.code).toBe('INTERNAL_ERROR');
    expect(r.error).toBe('oops');
    expect(r.recovery).toBe(ERROR_CATALOG.INTERNAL_ERROR.recovery);
  });

  it('covers all catalog codes', () => {
    for (const code of Object.keys(ERROR_CATALOG)) {
      const r = errorResponse(code);
      expect(r.code).toBe(code);
      expect(r.message).toBe(ERROR_CATALOG[code].message);
      expect(r.recovery).toBe(ERROR_CATALOG[code].recovery);
    }
  });
});

describe('statusToCode', () => {
  it('maps 400 to VALIDATION_ERROR', () => {
    expect(statusToCode(400)).toBe('VALIDATION_ERROR');
  });

  it('maps 403 to PATH_TRAVERSAL', () => {
    expect(statusToCode(403)).toBe('PATH_TRAVERSAL');
  });

  it('maps 404 to NOT_FOUND', () => {
    expect(statusToCode(404)).toBe('NOT_FOUND');
  });

  it('maps 405 to METHOD_NOT_ALLOWED', () => {
    expect(statusToCode(405)).toBe('METHOD_NOT_ALLOWED');
  });

  it('maps 413 to PAYLOAD_TOO_LARGE', () => {
    expect(statusToCode(413)).toBe('PAYLOAD_TOO_LARGE');
  });

  it('maps 415 to INVALID_CONTENT_TYPE', () => {
    expect(statusToCode(415)).toBe('INVALID_CONTENT_TYPE');
  });

  it('returns INTERNAL_ERROR for unmapped status', () => {
    expect(statusToCode(500)).toBe('INTERNAL_ERROR');
    expect(statusToCode(503)).toBe('INTERNAL_ERROR');
  });
});
