# Story Completion Report — SP-R2-003-005

**Story:** #25 — Error recovery framework (client + server)
**Sprint:** SP-R2-003 (Code Quality + Testing)
**Priority:** CRITICAL | **SP:** 5
**Status:** COMPLETE

---

## Summary

Implemented a comprehensive error recovery framework covering both server-side standardized error responses and client-side structured error handling with retry logic, WCAG-compliant screen reader announcements, and zero raw API error messages exposed to users.

---

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-1 | Standardized error response format (JSON: error, code, message, recovery) | ✅ PASS | `utils/errors.js` — `errorResponse()` returns `{error, code, message, recovery}` for all 15 error types |
| AC-2 | Client-side error recovery UI component with friendly messages | ✅ PASS | `showError(e, context)` in index.html — structured "What + Action" display |
| AC-3 | Retry mechanism for transient failures (exponential backoff) | ✅ PASS | `apiWithRetry()` — max 2 retries, backoff 1s/2s/8s cap, only for 5xx/network errors |
| AC-4 | Persistent banner when server unreachable | ✅ PASS | `#serverBanner` with `aria-live="assertive"`, shown at ≥3 consecutive failures |
| AC-5 | Error messages follow What + Why + Action pattern | ✅ PASS | All error toasts now show `message — recovery` format from ERROR_CATALOG |
| AC-6 | Error states provide recovery path (G-UXD-001) | ✅ PASS | Every error code has a specific `recovery` string guiding the user |
| AC-7 | Error announcements use aria-live for screen readers (WCAG 3.3.1, 3.3.3) | ✅ PASS | `#errorAnnounce` region with `aria-live="assertive" aria-atomic="true"`, `.sr-only` CSS |
| AC-8 | Zero raw API error messages exposed to users | ✅ PASS | All 10 `toast('Failed/Save failed: ' + e.message)` patterns replaced with `showError()` |

---

## Changes Made

### New Files
| File | Purpose |
|------|---------|
| `.github/webapp/utils/errors.js` | Error catalog (15 codes), `errorResponse()`, `statusToCode()` |
| `.github/webapp/errors.test.js` | 11 unit tests for error utilities (100% coverage) |

### Modified Files
| File | Changes |
|------|---------|
| `.github/webapp/server.js` | Import `errorResponse`/`statusToCode`; refactored all 12 error response points + `handleRouteError` + `handleMethodNotAllowed` + 6 thrown errors to use standardized format with `errorCode` property |
| `.github/webapp/index.html` | Enhanced `api()` to propagate `code`/`recovery`/`status`; added `apiWithRetry()` (exponential backoff); added `showError()` (What + Action format); added `announceError()` (aria-live); added `#errorAnnounce` region + `.sr-only` CSS; enhanced `#serverBanner` with `aria-live="assertive"`; replaced all 10 raw error toast patterns; enhanced `load()` error messages |
| `tests/integration/server-api.test.js` | Added 5 integration tests verifying `code`/`message`/`recovery` fields on 404, 405, 400, 415, invalid JSON |
| `.github/docs/sprints/SP-R2-003-sprint-gate.md` | Story #25 marked COMPLETE |

---

## Test Results

- **168 tests passing** (168/168) — 16 new tests added
- **Coverage:** 93.61% statements (up from 93.38%)
- **ESLint:** 0 violations
- **errors.js:** 100% coverage (statements, branches, functions, lines)

---

## Error Code Catalog

| Code | HTTP Status | User Message | Recovery Action |
|------|-------------|--------------|-----------------|
| VALIDATION_ERROR | 400 | The request contains invalid data | Check your input and try again |
| FILE_NOT_FOUND | 404 | The requested file was not found | Refresh the page to reload the latest data |
| DECISIONS_NOT_FOUND | 404 | The decisions file is missing | Ensure decisions.md exists in your workspace |
| INVALID_ACTION | 400 | The requested action is not recognized | Check the action name and try again |
| UNKNOWN_COMMAND | 400 | The command is not recognized | Check available commands in the help section |
| INVALID_TOPIC | 400 | The help topic identifier is invalid | Use a valid topic from the help index |
| TOPIC_NOT_FOUND | 404 | The help topic was not found | Check the help index for available topics |
| NOT_FOUND | 404 | The requested resource was not found | Check the URL and try again |
| PATH_TRAVERSAL | 403 | Access to this path is not allowed | Use only valid file paths within the workspace |
| PAYLOAD_TOO_LARGE | 413 | The request is too large to process | Reduce the size of the data being sent |
| INVALID_CONTENT_TYPE | 415 | The request content type is not supported | Send requests with Content-Type: application/json |
| INVALID_JSON | 400 | The request body contains invalid JSON | Check the JSON syntax and try again |
| INVALID_INPUT | 400 | One or more input fields are invalid | Review the field requirements and try again |
| METHOD_NOT_ALLOWED | 405 | This HTTP method is not supported here | Use a supported HTTP method for this endpoint |
| INTERNAL_ERROR | 500 | An unexpected server error occurred | Try again. If problem persists, check server logs |

---

## HANDOFF CHECKLIST
- [x] All required sections are filled (not empty, not placeholder)
- [x] All UNCERTAIN: items are documented and escalated — none
- [x] All INSUFFICIENT_DATA: items are documented and escalated — none
- [x] Output complies with the contract
- [x] Guardrails checked (CC ≤ 8, ESLint 0 violations)
- [x] Output is machine-readable and ready as input for the next agent
- [x] No contradictory statements in this document
- [x] All findings include a source reference
- [x] Deliverable written to file per MEMORY MANAGEMENT PROTOCOL
