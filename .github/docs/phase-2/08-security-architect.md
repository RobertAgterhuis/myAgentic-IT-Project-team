# Agent 08 — Security Architect: Security Architecture Audit
> **Mode:** AUDIT | **Phase:** 2 | **Date:** 2026-03-07 | **Project:** myAgentic-IT-Project-team

---

## QUESTIONNAIRE INPUT CHECK
**Status:** NOT_INJECTED — No questionnaire context block present. Proceeding with security analysis.

---

## STEP 1: SECURITY_FLAG INVENTORY

All `SECURITY_FLAG:` items from preceding agents collected and tracked through resolution matrix (see Section K below).

| Flag | Source Agent | Description | Initial Priority |
|------|-------------|-------------|-----------------|
| SF-001 | 05-Software Architect | Monolithic architecture — single failure point | HIGH |
| SF-002 | 05-Software Architect | No authentication/authorization | CRITICAL |
| SF-003 | 05-Software Architect | No input validation framework | HIGH |
| SF-004 | 05-Software Architect | No HTTPS (HTTP only) | HIGH |
| SF-005 | 05-Software Architect | No secret scanning | HIGH |
| SF-006 | 05-Software Architect | No CSP headers | MEDIUM |
| SF-007 | 05-Software Architect | XSS risk in dynamic HTML generation | HIGH |
| SF-008 | 05-Software Architect | Path traversal risk in file operations | HIGH |
| SF-DEV-001 | 06-Senior Developer | No input sanitization on API endpoints | HIGH |
| SF-DEV-002 | 06-Senior Developer | Dynamic HTML construction without encoding (XSS) | HIGH |
| SF-DEV-003 | 06-Senior Developer | File paths from user input without validation | HIGH |
| SF-DEV-004 | 06-Senior Developer | No rate limiting | MEDIUM |
| SF-DEV-005 | 06-Senior Developer | No CORS configuration | MEDIUM |
| SF-DEV-006 | 06-Senior Developer | Error messages may leak internal paths | MEDIUM |
| SF-DEV-007 | 06-Senior Developer | No Content-Type validation on POST requests | MEDIUM |
| SF-OPS-001 | 07-DevOps Engineer | No .gitignore — risk of committing sensitive files | MEDIUM |
| SF-OPS-002 | 07-DevOps Engineer | No secret scanning in CI/CD | HIGH |
| SF-OPS-003 | 07-DevOps Engineer | No branch protection | MEDIUM |

**Total: 18 flags** — 5 CRITICAL/HIGH confirmed, 6 RESOLVED/MITIGATED, 4 PARTIALLY MITIGATED, 3 CONFIRMED MEDIUM.

---

## STEP 2: COMPLIANCE FRAMEWORK

| Regulation | Applicable? | Rationale |
|-----------|------------|-----------|
| GDPR (General Data Protection Regulation) | **CONDITIONAL** | The application stores user-submitted text (questionnaire answers, decisions) which MAY contain personal data. If deployed within EU or processing EU citizen data, GDPR applies. Currently localhost-only = scope is limited. |
| ISO 27001 | **NOT APPLICABLE** | No organizational ISMS scope identified. Localhost development tool. |
| SOC 2 | **NOT APPLICABLE** | No SaaS/cloud service. No customer data processing. |
| NIS2 | **NOT APPLICABLE** | Not an essential/important entity under NIS2 categories. |
| HIPAA | **NOT APPLICABLE** | No health data processed. |
| PCI-DSS | **NOT APPLICABLE** | No payment card data processed. |

**GDPR Assessment (conditional):**
- Art. 5 (Data minimization): The application stores full answer text — could be excessive if PII is included. **RISK** if answers contain personal data.
- Art. 25 (Data protection by design): No encryption at rest, no PII classification, no retention policy. **GAP** if GDPR applies.
- Art. 32 (Security of processing): Localhost binding is appropriate for development tool. No encryption at rest. **PARTIAL**.
- Art. 35 (DPIA): Not required for localhost development tool. Would be required if deployed as multi-user service.

**Conclusion:** GDPR compliance is **NOT_REQUIRED for current localhost deployment** but becomes **MANDATORY if the application is deployed beyond localhost or if it processes identifiable personal data**. `INSUFFICIENT_DATA:` Whether the business intends to deploy this beyond localhost.

**Source:** Business context from onboarding-output.md (localhost development tool for project management); no Phase 1 business analysis available (AUDIT mode, TECH scope only).

---

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Total findings** | **47** |
| **Critical** | **5** |
| **High** | **14** |
| **Medium** | **16** |
| **Low** | **10** |
| **Informational** | **2** |
| **Files analyzed** | `server.js` (~1,080 LOC), `index.html` (~2,240 LOC) |
| **SECURITY_FLAGs processed** | 18 (SF-001–SF-008, SF-DEV-001–SF-DEV-007, SF-OPS-001–SF-OPS-003) |

**Overall Security Posture: HIGH RISK (pre-production)**

The application binds to `127.0.0.1` (localhost only), which is the **single most important mitigating factor** — it eliminates remote network-based attacks. However, it is vulnerable to local attacks from other processes, browser-based attacks (malicious tabs), and data integrity attacks via crafted requests. The server demonstrates *above-average* defensive coding for a zero-dependency localhost tool (path traversal guard, CSP header, input length limits, Content-Type enforcement, file locking), but several architectural gaps remain.

---

## A. OWASP TOP 10 ANALYSIS (2021)

### A01: Broken Access Control — CRITICAL

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A01-001 | **No authentication on any API endpoint** | **CRITICAL** | `server.js` L1010–1023 (ROUTES map) |
| SEC-A01-002 | **No authorization model — all endpoints writeable by any local process** | **CRITICAL** | `server.js` L1010–1023 |
| SEC-A01-003 | **No session management** — no cookies, no tokens, no identity | HIGH | `server.js` (entire file — absent) |

**Analysis:**  
The router at `server.js` L1010–1023 maps every endpoint without any auth middleware:
```
const ROUTES = {
  'GET /api/questionnaires': apiGetQuestionnaires,
  'POST /api/save':          apiSave,
  'POST /api/decisions':     apiPostDecision,
  'POST /api/command':       apiPostCommand,
  ...
};
```
Any process running on localhost can call `POST /api/save`, `POST /api/decisions`, or `POST /api/command` without proving identity. A malicious browser extension, local malware, or another application on the same machine can modify project data, queue commands, or corrupt questionnaire answers.

**Exploitation scenario:** A malicious browser tab (running on the same machine) sends `fetch('http://127.0.0.1:3000/api/decisions', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action:'create', type:'DECIDED', priority:'HIGH', scope:'ALL', text:'Malicious decision injected'}) })`. This succeeds because there are no auth checks and no CORS restrictions (see A05).

**Mitigating factor:** Binding to `127.0.0.1` prevents remote network access. This limits the attack surface to local processes and same-origin/cross-origin browser requests.

**Processes SF-FLAGs:** SF-002, SF-DEV-001

---

### A02: Cryptographic Failures — HIGH

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A02-001 | **No HTTPS — HTTP only** | HIGH | `server.js` L1063 (`http.createServer`), L1065 (`http://${HOST}:${PORT}`) |
| SEC-A02-002 | **All data stored in plaintext** — markdown and JSON files unencrypted at rest | HIGH | `server.js` L45–50 (`safeWriteSync` uses `fs.writeFileSync` with `utf8`) |
| SEC-A02-003 | **No HSTS header** (`Strict-Transport-Security` absent) | LOW | `server.js` L38–42 (`setSecurityHeaders`) |

**Analysis:**  
The server uses `http.createServer` (L1025) — no TLS. The `setSecurityHeaders` function at L38–42 sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Content-Security-Policy` but **not** `Strict-Transport-Security`.

All data is written via `safeWriteSync` (L45–50) using plain `fs.writeFileSync` with UTF-8 encoding — no encryption at rest. Questionnaire answers, decisions, session state, and command queue are all plaintext files readable by any local process with filesystem access.

**Mitigating factor:** Localhost binding means no network eavesdropping is possible (traffic never leaves the loopback interface). HSTS is irrelevant without HTTPS. The plaintext storage risk is limited to local filesystem access.

**Processes SF-FLAGs:** SF-004

---

### A03: Injection — HIGH

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A03-001 | **Markdown injection via questionnaire answers** | HIGH | `server.js` L216–233 (`updateAnswerInContent`) |
| SEC-A03-002 | **Markdown injection via decisions** | HIGH | `server.js` L412–440 (`addOpenQuestion`, `addOperationalDecision`) |
| SEC-A03-003 | **Pipe-escaping in `escPipe()` is incomplete** — only escapes `|` but not other markdown syntax | MEDIUM | `server.js` L87 |
| SEC-A03-004 | **Path traversal defense is PRESENT and effective** | INFO | `server.js` L27–33 (`safePath`) |
| SEC-A03-005 | **Command injection vector via `body.command`** — validated against whitelist (mitigated) | LOW | `server.js` L781–795 |

**Analysis:**

**Path traversal (MITIGATED):** The `safePath()` function at L27–33 is correctly implemented:
```javascript
function safePath(base, relative) {
  const absBase  = path.resolve(base);
  const resolved = path.resolve(base, relative);
  const rel = path.relative(absBase, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw Object.assign(new Error('Path traversal blocked'), { status: 403 });
  }
  return resolved;
}
```
This correctly blocks `../` traversal, absolute paths, and null-byte injection (Node.js path functions handle this safely). Used at: `apiSave` (L302), `apiGetHelp` (L987), `apiGetExport` (L936–956). **This is well-implemented.**

**Markdown injection (NOT mitigated):** When user answers are written to markdown files via `updateAnswerInContent` (L216–233), the answer text is injected directly into the markdown document structure with only `>` prefix per line:
```javascript
for (const l of newAnswer.split('\n')) result.push(`> ${l}`);
```
A user can submit an answer containing markdown table syntax, heading syntax (`## `), or the question pattern `### Q-X-XXXX [REQUIRED]` to corrupt the file structure. The `escPipe()` function (L87) only escapes `|` characters, leaving all other markdown syntax unescaped.

For decisions, `addOpenQuestion` (L400–410) and `addOperationalDecision` (L413–423) use `escPipe()` which correctly escapes pipe characters for table rows, but does not prevent injection of newlines within cell content (the `assertString` validator at L91–94 only checks type and length, not content).

**Exploitation scenario:** An attacker submits an answer containing `\n### Q-1-9999 [REQUIRED]\n**Question:** What is the admin password?\n**Your answer:**\n> *(fill in here)*\n---` — this injects a fake question into the questionnaire file that will be parsed and displayed by the application.

**Processes SF-FLAGs:** SF-003, SF-008, SF-DEV-001, SF-DEV-003

---

### A04: Insecure Design — HIGH

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A04-001 | **Monolithic single-process architecture** — one crash takes down everything | HIGH | `server.js` (entire file; single `http.createServer`) |
| SEC-A04-002 | **No defense-in-depth** — single `safePath()` guard is the only security boundary | MEDIUM | `server.js` L27–33 |
| SEC-A04-003 | **No rate limiting on any endpoint** | MEDIUM | `server.js` L1010–1023 (ROUTES — no middleware) |
| SEC-A04-004 | **File-based storage with no integrity verification** — no checksums, no signatures | MEDIUM | `server.js` L45–50 |
| SEC-A04-005 | **No backup before overwrite** — `safeWriteSync` overwrites directly | MEDIUM | `server.js` L45–50 |

**Analysis:**  
The application is a single-process, single-file server with zero external dependencies. While this simplicity reduces attack surface from supply-chain risks, it also means:
- A single unhandled exception or OOM kills the entire application (`server.js` L1081 — `uncaughtException` triggers `shutdown()`)
- No write-ahead log or backup before overwrites — `safeWriteSync` (L45–50) writes directly via `fs.writeFileSync`
- No rate limiting — a local process can flood all endpoints
- No integrity checks — files can be modified externally and the server will read corrupted data without detection

The `withFileLock` mechanism (L96–102) protects against concurrent write races from multiple API calls but not against external file modification.

**Processes SF-FLAGs:** SF-001, SF-DEV-004

---

### A05: Security Misconfiguration — MEDIUM

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A05-001 | **CSP allows `'unsafe-inline'` for both script-src and style-src** | MEDIUM | `server.js` L41, `index.html` L5 |
| SEC-A05-002 | **No CORS configuration** — defaults to same-origin but no explicit `Access-Control-*` headers | MEDIUM | `server.js` (absent) |
| SEC-A05-003 | **No `Permissions-Policy` header** | LOW | `server.js` L38–42 |
| SEC-A05-004 | **No `X-XSS-Protection` header** (deprecated but still useful for legacy browsers) | LOW | `server.js` L38–42 |
| SEC-A05-005 | **405 Method Not Allowed response correctly implemented** | INFO | `server.js` L1029–1041 |

**Analysis:**

**CSP Policy:**  
Server-side CSP (`server.js` L41):
```javascript
res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:");
```
Client-side CSP meta tag (`index.html` L5):
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'self';">
```

The client-side CSP is **more restrictive** (adds `form-action 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`) — good. However, `'unsafe-inline'` for `script-src` weakens the XSS protection significantly. Given the application is a single inline `<script>` block, this is architecturally necessary but should be noted as a risk.

**CORS:** No `Access-Control-Allow-Origin` headers are set. Without explicit CORS headers, the browser's same-origin policy blocks cross-origin requests from *reading responses*, but **simple requests** (POST with application/json requires preflight, which will fail) are partially blocked. However, CORS preflight is NOT triggered for all request types — a cross-origin `GET` to `/api/questionnaires` would succeed silently if the browser sends it. The Content-Type enforcement at `server.js` L109–113 (`parseBody`) rejects non-`application/json` POST requests, which adds a layer of defense since `application/json` triggers CORS preflight.

**Security headers present** (L38–42):
- `X-Content-Type-Options: nosniff` ✅
- `X-Frame-Options: DENY` ✅
- `Referrer-Policy: strict-origin-when-cross-origin` ✅
- `Cache-Control: no-store` ✅ (on JSON responses, L58)

**Security headers absent:**
- `Permissions-Policy` ❌
- `X-XSS-Protection` ❌ (deprecated but harmless to include)
- `Strict-Transport-Security` ❌ (irrelevant without HTTPS)
- `Cross-Origin-Opener-Policy` ❌
- `Cross-Origin-Embedder-Policy` ❌

**Processes SF-FLAGs:** SF-006, SF-DEV-005

---

### A06: Vulnerable and Outdated Components — LOW

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A06-001 | **Zero npm dependencies — minimal supply-chain risk** | LOW (positive) | No `package.json` exists |
| SEC-A06-002 | **No dependency scanning possible** — no manifest to scan | LOW | Absent |
| SEC-A06-003 | **No minimum Node.js version enforcement** | LOW | `server.js` L3 (comment says `Node.js 14+` but no `engines` field) |

**Analysis:**  
The application uses only Node.js built-in modules (`http`, `fs`, `path`). This is a significant security benefit — zero third-party supply-chain risk. However, there is no `package.json` with an `engines` field to enforce a minimum Node.js version. Node.js 14 is EOL (End of Life as of April 2023), and the comment on L3 still references it.

---

### A07: Identification and Authentication Failures — CRITICAL

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A07-001 | **No authentication mechanism exists** | **CRITICAL** | `server.js` (entire file — absent) |
| SEC-A07-002 | **No session tokens, no cookies, no bearer tokens** | **CRITICAL** | `server.js` (entire file — absent) |

**Analysis:**  
Duplicate of A01 findings but classified separately per OWASP taxonomy. The application has zero identity management. Every request is treated as fully authorized. There is no concept of a user, session, or permission level.

**Risk assessment:** For a localhost-only development tool, the lack of authentication is a *conscious design choice*. The risk is:
- LOW if the machine is single-user and trusted
- HIGH if the machine is shared or if malicious software is present

**Processes SF-FLAGs:** SF-002

---

### A08: Software and Data Integrity Failures — HIGH

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A08-001 | **No data integrity verification** — files read without checksum validation | HIGH | `server.js` L292–310 (`apiSave`), L335 (`apiPostDecision`) |
| SEC-A08-002 | **No atomic writes** — `fs.writeFileSync` is not crash-safe | MEDIUM | `server.js` L45–50 (`safeWriteSync`) |
| SEC-A08-003 | **No schema validation on JSON files** — session-state.json and command-queue.json parsed without schema checks | MEDIUM | `server.js` L290 (session), L815 (command queue) |
| SEC-A08-004 | **File lock is in-memory only** — does not protect against external process writes | MEDIUM | `server.js` L96–102 (`withFileLock`) |

**Analysis:**  
The `safeWriteSync` function (L45–50) writes directly via `fs.writeFileSync`. If the process crashes mid-write, the file can be corrupted. Best practice is write-to-temp-then-rename (atomic write pattern).

The `withFileLock` (L96–102) uses an in-memory `Map` — it protects against concurrent writes from within the same Node.js process but NOT against external processes modifying the same files simultaneously.

JSON files like `session-state.json` and `command-queue.json` are parsed with `JSON.parse` (L290, L815) without schema validation. A corrupted or maliciously edited file could cause unexpected behavior.

---

### A09: Security Logging and Monitoring Failures — MEDIUM

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A09-001 | **Logging is minimal** — only method, URL, status, duration | MEDIUM | `server.js` L103–106 (`log()`) |
| SEC-A09-002 | **No security event logging** — failed auth (N/A), path traversal blocks, large payloads | MEDIUM | `server.js` L27–33 (no log on traversal block) |
| SEC-A09-003 | **No log rotation or persistence** — stdout only | LOW | `server.js` L105 (`console.log`) |
| SEC-A09-004 | **Error messages in responses are generic** — well-handled | LOW (positive) | `server.js` L1027–1028 |
| SEC-A09-005 | **Decisions audit trail present** — `appendAuditTrail()` logs mutations | LOW (positive) | `server.js` L598–604 |

**Analysis:**  
The `log()` function (L103–106) records:
```javascript
function log(method, url, status, ms) {
  const ts = new Date().toISOString();
  console.log(`  ${ts} ${method} ${url} → ${status} (${ms}ms)`);
}
```
This logs all requests — good. But it does NOT log:
- The client IP address (always 127.0.0.1, so low value)
- Request body contents (good — avoids PII leakage)
- Security-relevant events like path traversal blocks (L27–33 throws error but doesn't explicitly log the attempt)
- 413 payload-too-large events (L70–72 rejects but doesn't log separately)

Positive: Error responses use generic messages (L1027: `{ error: err.message }`) and `err.message` is controlled by the application (custom error objects at L28, L70, L91, L112). Internal stack traces are NOT leaked to clients.

Positive: The decisions system has a built-in audit trail (`appendAuditTrail` at L598–604) that records every mutation with ISO timestamp, action type, and decision ID.

---

### A10: Server-Side Request Forgery (SSRF) — LOW

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-A10-001 | **No outbound HTTP requests from server** — SSRF not applicable | LOW (N/A) | `server.js` (entire file — no `http.request`, `https.request`, `fetch`) |

**Analysis:**  
The server makes zero outbound HTTP requests. It only reads local files and responds to incoming requests. SSRF is not applicable.

---

## B. SECRETS MANAGEMENT AUDIT

### B.1 Hardcoded Secrets Scan

| Check | Result | Source |
|-------|--------|--------|
| Hardcoded passwords in source code | **NOT FOUND** | Full grep of codebase |
| Hardcoded API keys in source code | **NOT FOUND** | Full grep of codebase |
| Hardcoded tokens in source code | **NOT FOUND** | Full grep of codebase |
| `.env` files present | **NOT FOUND** | File search |
| `.env.example` or config templates | **NOT FOUND** | File search |
| Secrets in `session-state.json` | **RISK** — schema allows arbitrary fields; `canva_api_token` is referenced in skill files | `00-orchestrator.md` L838 |

### B.2 User-Submitted Data as Secret Vectors

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-B-001 | **Questionnaire answers stored in plaintext markdown** — users could paste API keys, passwords, or tokens into answers | HIGH | `server.js` L216–233, `safeWriteSync` L45–50 |
| SEC-B-002 | **Decision text/notes stored in plaintext markdown** — same risk as above | HIGH | `server.js` L400–440 |
| SEC-B-003 | **Project brief stored in plaintext** at `BusinessDocs/project-brief.md` | MEDIUM | `server.js` L808–814 |
| SEC-B-004 | **No secret detection/sanitization on user input** — no regex scanning for API key patterns | MEDIUM | `server.js` L91–94 (`assertString` checks type and length only) |
| SEC-B-005 | **Export API dumps all data as JSON** — could expose secrets if present in answers | MEDIUM | `server.js` L905–960 (`apiGetExport`) |

**Analysis:**  
The application stores user-submitted text verbatim in markdown files. If a user pastes an API key, password, or connection string into a questionnaire answer, it will be:
1. Written to a plaintext `.md` file in `BusinessDocs/`
2. Indexed in `questionnaire-index.md`
3. Returned via `GET /api/questionnaires`
4. Potentially included in `GET /api/export` bundle
5. Committed to git (no `.gitignore` exists — see SF-OPS-001)

**Recommendation:** Add a regex-based warning (not blocking) that detects common secret patterns (`AKIA[0-9A-Z]{16}`, `ghp_[a-zA-Z0-9]{36}`, `sk-[a-zA-Z0-9]{48}`, etc.) and warns the user before saving.

**Processes SF-FLAGs:** SF-005, SF-OPS-002

---

## C. IAM (IDENTITY & ACCESS MANAGEMENT) ASSESSMENT

| Aspect | Status | Detail |
|--------|--------|--------|
| Authentication | **ABSENT** | No mechanism exists. Source: `server.js` ROUTES (L1010–1023) — no middleware, no token check |
| Authorization | **ABSENT** | All endpoints accessible to any caller. No RBAC, no ACL, no scopes |
| Session management | **ABSENT** | No cookies, no JWT, no session IDs. `session-state.json` is project state, not user session |
| Identity provider | **ABSENT** | No integration with any IdP |
| Multi-factor auth | **ABSENT** | N/A without primary auth |
| API key protection | **ABSENT** | No API keys issued or validated |
| Permission model | **ABSENT** | Flat — all endpoints equally accessible |

**Risk classification:** For localhost-only tool: **MEDIUM**. For any future deployment beyond localhost: **CRITICAL — MUST be addressed before any network exposure.**

---

## D. DATA PROTECTION ASSESSMENT

### D.1 Data Storage

| Data Type | Storage Format | Location | Encryption |
|-----------|---------------|----------|------------|
| Questionnaire answers | Plaintext markdown | `BusinessDocs/**/*-questionnaire.md` | None |
| Decisions | Plaintext markdown | `.github/docs/decisions.md` | None |
| Session state | Plaintext JSON | `.github/docs/session/session-state.json` | None |
| Command queue | Plaintext JSON | `.github/docs/session/command-queue.json` | None |
| Project brief | Plaintext markdown | `BusinessDocs/project-brief.md` | None |
| Reevaluate trigger | Plaintext JSON | `.github/docs/session/reevaluate-trigger.json` | None |
| Questionnaire index | Plaintext markdown | `BusinessDocs/questionnaire-index.md` | None |

### D.2 PII Handling

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-D-001 | **No PII classification or handling** — user answers could contain PII | MEDIUM | Architectural — no data classification layer |
| SEC-D-002 | **No data retention policy** — files accumulate indefinitely | LOW | Design decision — no TTL or cleanup |
| SEC-D-003 | **Command queue limited to 50 entries** — prevents unbounded growth | LOW (positive) | `server.js` L819 (`MAX_QUEUE_SIZE = 50`) |

### D.3 Encryption

| Layer | Status |
|-------|--------|
| In transit | **NOT ENCRYPTED** — HTTP only (mitigated by localhost binding) |
| At rest | **NOT ENCRYPTED** — plaintext files |
| In memory | **NOT ENCRYPTED** — standard Node.js memory |

---

## E. SECURITY IN CI/CD ASSESSMENT

| Check | Status | Source |
|-------|--------|--------|
| CI/CD pipeline exists | **NO** | No `.github/workflows/` directory found |
| SAST (Static Application Security Testing) | **NO** | No scanner configured |
| DAST (Dynamic Application Security Testing) | **NO** | No scanner configured |
| Dependency scanning | **N/A** | No dependencies to scan |
| Secret scanning in pipeline | **NO** | No TruffleHog, no GitHub secret scanning |
| Container scanning | **N/A** | No containers |
| Code review enforcement | **NO** | No branch protection, no CODEOWNERS |
| `.gitignore` | **ABSENT** | No `.gitignore` file exists |

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-E-001 | **No CI/CD pipeline** — zero automated security gates | HIGH | Absent — no `workflows/` directory |
| SEC-E-002 | **No `.gitignore`** — risk of committing `.env`, `node_modules/`, OS files, backup files | HIGH | File search confirms absent |
| SEC-E-003 | **No branch protection** — `main` can be force-pushed | MEDIUM | Repository configuration (not in code) |
| SEC-E-004 | **No secret scanning** — committed secrets would go undetected | HIGH | Absent |

**Processes SF-FLAGs:** SF-OPS-001, SF-OPS-002, SF-OPS-003

### Penetration Test Status

**Status: NO PENTEST AVAILABLE**
`HIGH_PRIORITY_GAP: No recent pentest` — No penetration test report found (< 12 months or otherwise). No evidence of any security testing beyond code-level static analysis.

---

## F. INPUT VALIDATION DEEP DIVE

### F.1 Endpoint Inventory

| # | Method | Path | Handler | Source |
|---|--------|------|---------|--------|
| 1 | GET | `/api/questionnaires` | `apiGetQuestionnaires` | L1010, L282–289 |
| 2 | GET | `/api/session` | `apiGetSession` | L1011, L291–296 |
| 3 | POST | `/api/save` | `apiSave` | L1012, L298–318 |
| 4 | POST | `/api/reevaluate` | `apiReevaluate` | L1013, L320–330 |
| 5 | GET | `/api/decisions` | `apiGetDecisions` | L1014, L607–610 |
| 6 | POST | `/api/decisions` | `apiPostDecision` | L1015, L612–699 |
| 7 | POST | `/api/command` | `apiPostCommand` | L1016, L771–825 |
| 8 | GET | `/api/command` | `apiGetCommand` | L1017, L827–835 |
| 9 | GET | `/api/progress` | `apiGetProgress` | L1018, L859–920 |
| 10 | GET | `/api/export` | `apiGetExport` | L1019, L922–960 |
| 11 | GET | `/api/help` | `apiGetHelp` | L1020, L975–992 |
| 12 | GET | `/health` | inline lambda | L1021 |
| 13 | GET | `/*` (static) | `serveStatic` | L1043 (fallthrough) |

### F.2 Detailed Input Validation Analysis

#### Endpoint 3: `POST /api/save` (L298–318)

| Input Field | Validation | Gap |
|-------------|-----------|-----|
| `body.file` | `assertString(body.file, 'file', 500)` + `safePath(BUSINESS_DOCS, body.file)` | ✅ Path traversal blocked, length limited |
| `body.updates` | Array check, length 1–200 | ✅ |
| `body.updates[].questionId` | Regex: `Q_ID_RE = /^Q-\d{1,3}-\d{1,4}$/` | ✅ Strict format |
| `body.updates[].status` | Whitelist: `['OPEN', 'ANSWERED', 'DEFERRED']` | ✅ |
| `body.updates[].answer` | **NO VALIDATION** — arbitrary string content accepted | ❌ No length limit, no content sanitization |

**Risk:** The `answer` field has no length limit and no content validation. A user can submit megabytes of data per answer (up to `MAX_BODY = 1_048_576` bytes total). The answer is written directly into the markdown file.

#### Endpoint 4: `POST /api/reevaluate` (L320–330)

| Input Field | Validation | Gap |
|-------------|-----------|-----|
| `body.scope` | Whitelist: `['ALL', 'BUSINESS', 'TECH', 'UX', 'MARKETING']`; defaults to `'ALL'` | ✅ |

**No gaps.** This endpoint is well-validated.

#### Endpoint 6: `POST /api/decisions` (L612–699)

| Input Field | Validation | Gap |
|-------------|-----------|-----|
| `body.action` | `assertString(body.action, 'action', 50)` + switch-case whitelist | ✅ |
| `body.id` | `DEC_ID_RE = /^DEC-[\w-]{1,30}$/` | ✅ (when provided) |
| `body.scope` | `assertString(body.scope, 'scope', 200)` | ✅ Length only |
| `body.text` | `assertString(body.text, 'text', 2000)` | ⚠️ Length only — no content sanitization |
| `body.notes` | `assertString(body.notes, 'notes', 2000)` | ⚠️ Length only — no content sanitization |
| `body.answer` | `assertString(body.answer, 'answer', 2000)` | ⚠️ Length only — no content sanitization |
| `body.reason` | `assertString(body.reason, 'reason', 2000)` | ⚠️ Length only — no content sanitization |
| `body.type` | Whitelist: `['DECIDED', 'OPEN_QUESTION']` | ✅ |
| `body.priority` | Whitelist: `['HIGH', 'MEDIUM', 'LOW']` | ✅ |

**Risk:** Text fields are length-limited but not content-validated. Markdown injection, newline injection, and pipe injection (partially mitigated by `escPipe`) are possible.

#### Endpoint 7: `POST /api/command` (L771–825)

| Input Field | Validation | Gap |
|-------------|-----------|-----|
| `body.command` | `assertString` + whitelist against `VALID_COMMANDS` | ✅ |
| `body.project` | `assertString(body.project, 'project', 200)` | ⚠️ Length only |
| `body.description` | `assertString(body.description, 'description', 2000)` | ⚠️ Length only |
| `body.scope` | `assertString(body.scope, 'scope', 200)` | ⚠️ Length only |
| `body.brief` | `assertString(body.brief, 'brief', 200000)` | ⚠️ 200 KB limit — large but bounded |

**Risk:** The `brief` field accepts up to 200,000 characters and is written to `BusinessDocs/project-brief.md` (L808–814). Content is not sanitized.

#### Endpoint 11: `GET /api/help` (L975–992)

| Input Field | Validation | Gap |
|-------------|-----------|-----|
| `slug` (query param) | Regex: `/^[a-z0-9-]+$/` + `safePath(HELP_DIR, slug + '.md')` | ✅ Double-validated |

**No gaps.** This endpoint is well-validated.

### F.3 Content-Type Enforcement

The `parseBody` function at L109–113 **enforces `application/json`**:
```javascript
const mediaType = ct.split(';')[0].trim().toLowerCase();
if (mediaType !== 'application/json') {
  throw Object.assign(new Error('Content-Type must be application/json'), { status: 415 });
}
```
This is excellent — it blocks CSRF attacks that rely on `application/x-www-form-urlencoded` or `multipart/form-data` (which don't trigger CORS preflight). **This is the strongest CSRF defense present.**

**Processes SF-FLAGs:** SF-003, SF-DEV-001, SF-DEV-003, SF-DEV-007

---

## G. HTTP SECURITY HEADERS

| Header | Present | Value | Source | Assessment |
|--------|---------|-------|--------|------------|
| `Content-Security-Policy` | ✅ | `default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:` | `server.js` L41 | ⚠️ `unsafe-inline` weakens XSS protection |
| `X-Content-Type-Options` | ✅ | `nosniff` | `server.js` L39 | ✅ Correct |
| `X-Frame-Options` | ✅ | `DENY` | `server.js` L40 | ✅ Correct |
| `Referrer-Policy` | ✅ | `strict-origin-when-cross-origin` | `server.js` L41 | ✅ Correct |
| `Cache-Control` | ✅ | `no-store` | `server.js` L58 | ✅ On API responses |
| `Strict-Transport-Security` | ❌ | — | — | N/A (no HTTPS) |
| `X-XSS-Protection` | ❌ | — | — | LOW — deprecated header |
| `Permissions-Policy` | ❌ | — | — | LOW — should restrict camera, microphone, geolocation |
| `Cross-Origin-Opener-Policy` | ❌ | — | — | LOW — recommended |
| `Cross-Origin-Embedder-Policy` | ❌ | — | — | LOW — recommended |

**Client-side CSP meta tag** (`index.html` L5) adds additional restrictions:
- `form-action 'self'` ✅
- `frame-ancestors 'none'` ✅
- `base-uri 'self'` ✅

---

## H. FILE SYSTEM SECURITY

### H.1 Path Traversal

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-H-001 | **`safePath()` is correctly implemented** — blocks `../`, absolute paths | POSITIVE | `server.js` L27–33 |
| SEC-H-002 | **`safePath()` used consistently** on user-controlled file paths | POSITIVE | L302, L936, L956, L987 |
| SEC-H-003 | **Help API slug validated with regex AND safePath** — defense in depth | POSITIVE | L982–987 |

Path traversal defense is one of the strongest aspects of this codebase. The `safePath` function is used at every point where user input influences file paths.

### H.2 File Write Safety

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-H-004 | **No atomic writes** — `fs.writeFileSync` can corrupt on crash | MEDIUM | `server.js` L48 |
| SEC-H-005 | **No backup before overwrite** | MEDIUM | `server.js` L45–50 |
| SEC-H-006 | **Directory creation is recursive** — `mkdirSync({ recursive: true })` | LOW | `server.js` L47 |

**Recommendation:** Use write-temp-rename pattern:
```javascript
const tmp = filePath + '.tmp.' + process.pid;
fs.writeFileSync(tmp, data, encoding);
fs.renameSync(tmp, filePath); // atomic on same filesystem
```

### H.3 Symlink Attacks

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-H-007 | **No symlink protection** — `safePath` uses `path.resolve` which follows symlinks | LOW | `server.js` L27–33 |

If an attacker creates a symlink inside `BusinessDocs/` pointing to `/etc/passwd` (or Windows equivalent), `safePath` would resolve the real path and the relative path check would still pass if the symlink target is under the base directory. However, `path.resolve` + `path.relative` would catch symlinks pointing outside the base. **Risk is LOW** because creating symlinks requires prior filesystem access.

### H.4 Race Conditions

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-H-008 | **TOCTOU race in `apiSave`** — file existence check then read then write | LOW | `server.js` L304–305 |
| SEC-H-009 | **In-memory file lock mitigates internal races** | POSITIVE | `server.js` L96–102 |

The `withFileLock` mechanism prevents race conditions between concurrent API requests to the same file. However, external processes could modify files between the read and write in `apiSave`.

### H.5 Directory Traversal Depth

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-H-010 | **Directory walk depth limited to 20** — prevents infinite recursion | POSITIVE | `server.js` L120 |

---

## I. ERROR HANDLING SECURITY

### I.1 Error Message Analysis

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-I-001 | **Error messages use controlled text** — application-set `err.message` | POSITIVE | `server.js` L28, L70, L91, L112 |
| SEC-I-002 | **No stack traces in API responses** | POSITIVE | `server.js` L1027 |
| SEC-I-003 | **`safeWriteSync` leaks base filename only** — not full path | LOW | `server.js` L49: `path.basename(filePath)` |
| SEC-I-004 | **Unhandled rejections logged to console** — not leaked to clients | POSITIVE | `server.js` L1080 |
| SEC-I-005 | **Uncaught exceptions trigger graceful shutdown** | POSITIVE | `server.js` L1081 |

**Analysis:**  
Error handling is well-implemented. The global error handler at L1026–1029:
```javascript
catch (err) {
  if (!res.headersSent) { json(res, err.status || 500, { error: err.message }); }
  else { res.end(); }
}
```
Only sends `err.message` which is always a controlled string (set via `Object.assign(new Error('...'), { status: N })`). No stack traces, no file paths, no internal state is leaked.

The one minor leak is in `safeWriteSync` (L49) which includes `path.basename(filePath)` in the error message — this reveals only the filename (not the full path), which is acceptable.

**Processes SF-FLAGs:** SF-DEV-006 — **MITIGATED.** Error messages do NOT leak internal paths (contrary to the preceding agent's concern).

---

## J. CLIENT-SIDE SECURITY (`index.html`)

### J.1 XSS Analysis

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-J-001 | **HTML escape function `esc()` is correctly implemented** | POSITIVE | `index.html` L1097 |
| SEC-J-002 | **Attribute escape function `escAttr()` is correctly implemented** | POSITIVE | `index.html` L1098 |
| SEC-J-003 | **All dynamic data uses `esc()` before `innerHTML` assignment** | POSITIVE | L1110–1228 (sidebar, stats, questions, decisions) |
| SEC-J-004 | **`renderMarkdown()` escapes all raw HTML first, then applies markdown** | POSITIVE | `index.html` L2085–2090 |
| SEC-J-005 | **CSP `'unsafe-inline'` means injected scripts could execute if XSS is found** | MEDIUM | `index.html` L5 |
| SEC-J-006 | **`renderMarkdown()` link sanitization only allows `https:`, `mailto:`, `#`, `/`** | POSITIVE | `index.html` L2114–2118 |
| SEC-J-007 | **No `eval()`, `Function()`, `setTimeout(string)`, or `setInterval(string)` usage** | POSITIVE | Full search — none found |

**Detailed `esc()` analysis** (L1097):
```javascript
const _esc = document.createElement('span');
function esc(s) { _esc.textContent = s || ''; return _esc.innerHTML; }
```
This uses the browser's native `textContent → innerHTML` conversion, which is the standard safe way to escape HTML. Used consistently throughout the codebase in all `innerHTML` assignments.

**`escAttr()` analysis** (L1098):
```javascript
function escAttr(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/'/g,'&#39;').replace(/"/g,'&quot;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'&#10;').replace(/\r/g,'&#13;').replace(/\t/g,'&#9;');
}
```
Comprehensive attribute escaping including newlines and tabs — correct.

**`renderMarkdown()` analysis** (L2085–2140):
The help content renderer first escapes ALL raw HTML:
```javascript
let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
```
Then applies markdown formatting (headings, bold, links, etc.) on the pre-escaped string. This is a safe approach — XSS cannot be injected through the markdown content because `<script>` becomes `&lt;script&gt;` before any HTML is generated.

**Link sanitization** (L2114–2118) validates protocols:
```javascript
if (!/^(https?:|mailto:|#|\/)/i.test(raw.trim())) return text;
```
This blocks `javascript:`, `data:`, and other dangerous protocols.

### J.2 Client-Side Storage

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-J-008 | **`sessionStorage` used for activeTab only** — non-sensitive | LOW | `index.html` L937, L1258 |
| SEC-J-009 | **`localStorage` used for theme preference only** — non-sensitive | LOW | `index.html` L2219, L2229 |
| SEC-J-010 | **No sensitive data in client-side storage** | POSITIVE | — |

### J.3 Form Submission Security

| ID | Finding | Severity | Source |
|----|---------|----------|--------|
| SEC-J-011 | **All API calls use `fetch()` with `application/json`** — CSRF-resistant | POSITIVE | `index.html` L952–958 |
| SEC-J-012 | **No HTML form submissions** — all interactions are JS-driven | POSITIVE | — |
| SEC-J-013 | **CSP `form-action 'self'`** prevents form hijacking | POSITIVE | `index.html` L5 |

**Processes SF-FLAGs:** SF-007, SF-DEV-002 — **LARGELY MITIGATED.** The client-side code consistently uses `esc()` and `escAttr()` for all dynamic HTML construction. The XSS risk flagged by preceding agents is handled correctly in the current implementation.

---

## K. SECURITY_FLAG RESOLUTION MATRIX

| Flag ID | Description | Status | Finding | Severity |
|---------|-------------|--------|---------|----------|
| SF-001 | Monolithic architecture | **CONFIRMED** | SEC-A04-001 | HIGH |
| SF-002 | No authentication/authorization | **CONFIRMED** | SEC-A01-001, SEC-A01-002 | CRITICAL |
| SF-003 | No input validation framework | **PARTIALLY MITIGATED** | Input validation present but content sanitization missing | MEDIUM |
| SF-004 | No HTTPS | **CONFIRMED** — mitigated by localhost | SEC-A02-001 | HIGH (design) / LOW (operational) |
| SF-005 | No secret scanning | **CONFIRMED** | SEC-B-001, SEC-B-004 | HIGH |
| SF-006 | No CSP headers | **RESOLVED** — CSP present | SEC-A05-001 | MEDIUM (unsafe-inline) |
| SF-007 | XSS risk in dynamic HTML | **LARGELY MITIGATED** — `esc()` used consistently | SEC-J-003 | LOW |
| SF-008 | Path traversal risk | **RESOLVED** — `safePath()` effective | SEC-H-001 | LOW (resolved) |
| SF-DEV-001 | No input sanitization | **PARTIALLY MITIGATED** — structure validated, content not | SEC-A03-001 | MEDIUM |
| SF-DEV-002 | Dynamic HTML without encoding | **RESOLVED** — `esc()` used consistently | SEC-J-001 | LOW (resolved) |
| SF-DEV-003 | File paths from user input | **RESOLVED** — `safePath()` blocks traversal | SEC-H-001 | LOW (resolved) |
| SF-DEV-004 | No rate limiting | **CONFIRMED** | SEC-A04-003 | MEDIUM |
| SF-DEV-005 | No CORS configuration | **PARTIALLY MITIGATED** — Content-Type enforcement blocks most CSRF | SEC-A05-002 | MEDIUM |
| SF-DEV-006 | Error messages leak internal paths | **RESOLVED** — errors are controlled | SEC-I-001 | LOW (resolved) |
| SF-DEV-007 | No Content-Type validation | **RESOLVED** — `parseBody()` enforces `application/json` | L109-113 | LOW (resolved) |
| SF-OPS-001 | No `.gitignore` | **CONFIRMED** | SEC-E-002 | HIGH |
| SF-OPS-002 | No secret scanning in CI/CD | **CONFIRMED** | SEC-E-004 | HIGH |
| SF-OPS-003 | No branch protection | **CONFIRMED** | SEC-E-003 | MEDIUM |

---

## 2. RECOMMENDATIONS

### REC-SEC-001: Add Content Sanitization for Markdown Injection Prevention (CRITICAL)
**References:** SEC-A03-001, SEC-A03-002 (Markdown injection in answers and decisions)
**Description:** Implement a `sanitizeContent()` function that strips dangerous markdown syntax patterns from user-submitted text fields (answers, decision text/notes). Specifically: escape markdown heading syntax (`## `), horizontal rules (`---`), question ID patterns (`Q-\d+-\d+`), and table pipe sequences outside `escPipe()` coverage. Apply to all text fields in `apiSave` and `apiPostDecision`.
**Impact:**
- Risk Reduction: HIGH — eliminates file structure corruption via injected markdown
- Cost: LOW — 6h implementation
- Revenue: LOW — indirect
- UX: LOW — transparent to users (only malicious content affected)
**Risk of not executing:** An attacker (or accidental user input) can corrupt questionnaire file structure by injecting fake questions, headings, or table rows. Corrupted files break the parsing logic and could inject false data into the audit pipeline.

**SMART Success Criterion:**
- KPI: Markdown injection test pass rate
- Baseline: 0% (no sanitization exists)
- Target: 100% of injected markdown patterns neutralized
- Method: Unit tests with injection payloads (fake questions, heading injection, table corruption)
- Horizon: Sprint 1 (2 weeks)

### REC-SEC-002: Implement Atomic File Writes (HIGH)
**References:** SEC-A08-002, SEC-H-004 (non-atomic writes via `fs.writeFileSync`)
**Description:** Replace `fs.writeFileSync(filePath, data)` in `safeWriteSync` with a write-to-temp-then-rename pattern: write to `{filePath}.tmp.{pid}`, then `fs.renameSync(tmp, filePath)`. This ensures crash-safety — a partial write corrupts only the temp file, not the original.
**Impact:**
- Risk Reduction: HIGH — eliminates data loss from process crashes during write
- Cost: LOW — 2h implementation (3 lines changed in `safeWriteSync`)
- Revenue: LOW — indirect
- UX: MEDIUM — prevents data loss scenarios
**Risk of not executing:** A crash, power failure, or OOM during `fs.writeFileSync` corrupts the target file permanently. Session state, decisions, and questionnaire answers could be destroyed.

**SMART Success Criterion:**
- KPI: Data corruption incidents from interrupted writes
- Baseline: Unknown (no crash testing performed)
- Target: 0 corruption incidents under simulated crash conditions
- Method: Kill-process-during-write test + file integrity verification
- Horizon: Sprint 1 (2 weeks)

### REC-SEC-003: Add Secret-Pattern Detection on Save (HIGH)
**References:** SEC-B-001, SEC-B-004, SF-005 (plaintext secrets in user answers)
**Description:** Add a regex-based scanner that checks user-submitted text for common secret patterns (AWS keys `AKIA[0-9A-Z]{16}`, GitHub tokens `ghp_[a-zA-Z0-9]{36}`, generic API keys, connection strings). Return a WARNING in the API response (not blocking) so the UI can alert the user. Log the detection event (without the secret value).
**Impact:**
- Risk Reduction: HIGH — prevents accidental secret commit to git
- Cost: LOW — 4h implementation
- Revenue: LOW — indirect
- UX: MEDIUM — proactive user warning
**Risk of not executing:** Users paste API keys into questionnaire answers → written to plaintext markdown → committed to git (no `.gitignore`) → pushed to GitHub → exposed in public/shared repository.

**SMART Success Criterion:**
- KPI: Percentage of known secret patterns detected
- Baseline: 0% (no detection exists)
- Target: ≥90% of common secret patterns (AWS, GitHub, Azure, generic) detected
- Method: Unit tests with synthetic secret patterns
- Horizon: Sprint 1 (2 weeks)

### REC-SEC-004: Add Missing Security Headers (MEDIUM)
**References:** SEC-A05-003, SEC-A05-004 (missing Permissions-Policy, COOP, COEP)
**Description:** Add to `setSecurityHeaders()`: `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`.
**Impact:**
- Risk Reduction: MEDIUM — defense-in-depth against capability exploitation
- Cost: LOW — 1h implementation (3 lines in `setSecurityHeaders`)
- Revenue: LOW — indirect
- UX: LOW — transparent
**Risk of not executing:** Browser capabilities (camera, microphone, geolocation) remain available to scripts. Low risk for localhost tool, but violates security best practice.

**SMART Success Criterion:**
- KPI: Security headers present as verified by security header scanner
- Baseline: 4/7 recommended headers present
- Target: 7/7 recommended headers present
- Method: `curl -I http://127.0.0.1:3000` + automated header check
- Horizon: Sprint 1 (2 weeks)

### REC-SEC-005: Implement Rate Limiting (MEDIUM)
**References:** SEC-A04-003, SF-DEV-004 (no rate limiting)
**Description:** Implement an in-memory token bucket rate limiter as middleware. Configuration: 100 requests per minute per source (IP). Return `429 Too Many Requests` when exceeded. Apply to all API endpoints.
**Impact:**
- Risk Reduction: MEDIUM — prevents resource exhaustion from runaway scripts or local malware
- Cost: LOW — 4h implementation (zero-dependency token bucket)
- Revenue: LOW — indirect
- UX: LOW — transparent under normal usage
**Risk of not executing:** A local process can flood all endpoints with rapid requests, causing resource exhaustion, file lock contention, and potential process crash.

**SMART Success Criterion:**
- KPI: Requests beyond rate limit are rejected with 429
- Baseline: 0% rate-limited (no limiter exists)
- Target: 100% of requests beyond 100/min are rejected
- Method: Load test sending 200 requests in 1 minute; verify 100 succeed, 100 return 429
- Horizon: Sprint 2 (4 weeks)

### REC-SEC-006: Add Explicit CORS Headers (MEDIUM)
**References:** SEC-A05-002, SF-DEV-005 (no CORS configuration)
**Description:** Add explicit `Access-Control-Allow-Origin: http://127.0.0.1:${PORT}` and handle `OPTIONS` preflight requests. This explicitly restricts cross-origin access rather than relying on browser defaults.
**Impact:**
- Risk Reduction: MEDIUM — prevents cross-origin data exfiltration from malicious tabs
- Cost: LOW — 3h implementation
- Revenue: LOW — indirect
- UX: LOW — transparent
**Risk of not executing:** Browser `fetch()` from other origins can read API response data (GET endpoints). Content-Type enforcement on POST partially mitigates, but GET endpoints like `/api/questionnaires` and `/api/export` are exposed.

**SMART Success Criterion:**
- KPI: Cross-origin requests blocked by CORS
- Baseline: No CORS headers (relies on browser default)
- Target: All cross-origin requests blocked; only `127.0.0.1:PORT` origin allowed
- Method: Cross-origin fetch test from a different origin
- Horizon: Sprint 2 (4 weeks)

### REC-SEC-007: Security Logging Enhancement (MEDIUM)
**References:** SEC-A09-001, SEC-A09-002 (minimal logging, no security events)
**Description:** Log security-relevant events: path traversal blocks (from `safePath` catch), rate limit violations (from REC-SEC-005), secret pattern detections (from REC-SEC-003), payload-too-large rejections, Content-Type rejections. Use `level: "SECURITY"` in structured logs (DEPENDENT_ON: DevOps Engineer REC-OPS-002 for structured logging).
**Impact:**
- Risk Reduction: MEDIUM — enables detection of attack patterns and forensic analysis
- Cost: LOW — 3h implementation
- Revenue: LOW — indirect
- UX: LOW — transparent
**Risk of not executing:** Security-relevant events go unnoticed. Cannot detect ongoing attacks or investigate incidents post-hoc.

**SMART Success Criterion:**
- KPI: Security events logged
- Baseline: 0 security event types logged
- Target: ≥5 security event types logged (path traversal, rate limit, secret detection, payload size, content-type)
- Method: Trigger each event type; verify log entry exists with `level: "SECURITY"`
- Horizon: Sprint 2 (4 weeks)

### REC-SEC-008: Create Security Handoff Context for Implementation (HIGH)
**References:** All Critical/High findings — bridge to Phase 5
**Description:** Create `.github/docs/security/security-handoff-context.md` containing `IMPL-CONSTRAINT` rules for every High/Critical finding. This file is mandatorily loaded by the Implementation Agent for every story.
**Impact:**
- Risk Reduction: HIGH — ensures security requirements are carried through to implementation
- Cost: LOW — 2h (documentation, produced as part of this audit)
- Revenue: LOW — indirect
- UX: LOW — internal process
**Risk of not executing:** Implementation Agent may introduce or miss security requirements. Critical findings remain unaddressed.

**SMART Success Criterion:**
- KPI: IMPL-CONSTRAINT coverage of Critical/High findings
- Baseline: 0 constraints documented
- Target: 100% of Critical/High findings have at least one IMPL-CONSTRAINT
- Method: Traceability check: each Critical/High finding → IMPL-CONSTRAINT
- Horizon: Sprint 1 (immediate — documentation deliverable)

---

### Recommendation Priority Matrix

| ID | Impact | Effort | Priority | Sprint |
|----|--------|--------|----------|--------|
| REC-SEC-001 | HIGH | LOW | P1 (Critical risk) | Sprint 1 |
| REC-SEC-002 | HIGH | LOW | P1 (Quick win) | Sprint 1 |
| REC-SEC-003 | HIGH | LOW | P1 (Quick win) | Sprint 1 |
| REC-SEC-004 | MEDIUM | LOW | P2 (Quick win) | Sprint 1 |
| REC-SEC-005 | MEDIUM | LOW | P2 (Strategic) | Sprint 2 |
| REC-SEC-006 | MEDIUM | LOW | P2 (Strategic) | Sprint 2 |
| REC-SEC-007 | MEDIUM | LOW | P2 (Strategic) | Sprint 2 |
| REC-SEC-008 | HIGH | LOW | P1 (Immediate) | Sprint 1 |

### Recommendations Self-Check (Step D)
- [x] Every recommendation references a GAP/finding
- [x] All impact fields filled (Revenue/Risk Reduction/Cost/UX)
- [x] All success criteria are SMART
- [x] No recommendations outside domain — CI/CD pipeline creation deferred to `OUT_OF_SCOPE: DevOps Engineer (REC-OPS-001)`, code refactoring deferred to `OUT_OF_SCOPE: Senior Developer`

---

## 3. SPRINT PLAN

### Step E: Assumptions

**Teams:**
- **Team Security** — 1 security engineer — capacity 20 SP/sprint
- `INSUFFICIENT_DATA: team composition` — Actual team size unknown. Sprint plan assumes 1 engineer. Adjust capacity proportionally if team grows. (Aligns with Q-ARCH-TEAM-001 raised by Agent 05.)

**Sprint duration:** 2 weeks (default)
**Technology stack:** Node.js, vanilla JS — zero dependencies
**Preconditions for Sprint 1:**
- Access to server.js and index.html source code
- Node.js ≥18 installed for testing

---

### Step F: Sprint Stories

#### Sprint 1: Critical Security Hardening (20 SP)

**SP-SEC-001: Implement Content Sanitization for User Text Fields**
- Description: As a project team I want user-submitted answers to be sanitized of dangerous markdown patterns so that questionnaire file structure cannot be corrupted by injection
- Team: Team Security
- Story type: `CODE`
- Story points: 5
- Recommendation reference: REC-SEC-001
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given a user submits an answer containing `### Q-1-9999 [REQUIRED]`, when saved, then the heading syntax is escaped/neutralized
  - Given a user submits an answer containing `---` (horizontal rule), when saved, then the rule syntax is escaped
  - Given a user submits a normal text answer, when saved, then no content is modified

**SP-SEC-002: Implement Atomic File Writes in safeWriteSync**
- Description: As a system administrator I want file writes to be crash-safe so that a power failure or process crash cannot corrupt state files
- Team: Team Security
- Story type: `CODE`
- Story points: 3
- Recommendation reference: REC-SEC-002
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given a write operation, when `safeWriteSync` is called, then data is first written to a `.tmp.{pid}` file and then atomically renamed
  - Given a crash during write, when the process restarts, then the original file is intact (temp file may exist)
  - Given the temp file already exists (stale), when a new write starts, then the stale temp is overwritten

**SP-SEC-003: Add Secret-Pattern Detection Warning**
- Description: As a user I want to be warned when I accidentally paste an API key or secret into my answer so that I don't commit credentials to git
- Team: Team Security
- Story type: `CODE`
- Story points: 5
- Recommendation reference: REC-SEC-003
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given an answer containing `AKIAIOSFODNN7EXAMPLE`, when saved, then the API response includes a `warnings` array with a secret detection message
  - Given an answer containing `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`, when saved, then a warning is returned
  - Given the answer is saved despite the warning, when the user confirms, then the answer is persisted (warning is non-blocking)
  - Given a secret is detected, when logged, then the log entry records the event type but NOT the secret value

**SP-SEC-004: Add Missing Security Headers**
- Description: As a security engineer I want all recommended security headers present so that browser-based attack vectors are minimized
- Team: Team Security
- Story type: `CODE`
- Story points: 2
- Recommendation reference: REC-SEC-004
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given a request to any endpoint, when headers are inspected, then `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and `Cross-Origin-Embedder-Policy` are present
  - Given a security header scan tool is run, when results are reviewed, then all 7 recommended headers are present

**SP-SEC-005: Create Security Handoff Context Document**
- Description: As the Implementation Agent I want a security-handoff-context.md with IMPL-CONSTRAINTs so that I know exactly which security rules apply to every story
- Team: Team Security
- Story type: `ANALYSIS`
- Story points: 3
- Recommendation reference: REC-SEC-008
- Dependencies: None — produced as audit output
- Blocker: NONE
- Acceptance criteria:
  - Given `.github/docs/security/security-handoff-context.md` exists, when the Implementation Agent reads it, then every Critical/High finding has an IMPL-CONSTRAINT
  - Given each IMPL-CONSTRAINT, when reviewed, then it has: derived-from (finding ID), scope, testable requirement, verification method

#### Sprint 2: Defense-in-Depth (18 SP)

**SP-SEC-006: Implement Rate Limiting Middleware**
- Description: As a system I want to reject excessive requests so that resource exhaustion attacks from local processes are prevented
- Team: Team Security
- Story type: `CODE`
- Story points: 5
- Recommendation reference: REC-SEC-005
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given 100 requests in 1 minute from the same source, when the 101st request arrives, then it receives `429 Too Many Requests`
  - Given the rate limit window resets, when a new request arrives, then it succeeds normally
  - Given the rate limiter, when inspected, then it uses zero external dependencies

**SP-SEC-007: Add Explicit CORS Headers**
- Description: As a security engineer I want explicit CORS configuration so that cross-origin data access is explicitly denied
- Team: Team Security
- Story type: `CODE`
- Story points: 3
- Recommendation reference: REC-SEC-006
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given a cross-origin GET request, when the response is inspected, then it contains `Access-Control-Allow-Origin: http://127.0.0.1:${PORT}`
  - Given an OPTIONS preflight request, when handled, then appropriate CORS headers are returned
  - Given a request from a different origin, when the browser enforces CORS, then the response is blocked

**SP-SEC-008: Security Event Logging**
- Description: As an operator I want security-relevant events logged with a SECURITY level so that I can detect and investigate attack patterns
- Team: Team Security
- Story type: `CODE`
- Story points: 5
- Recommendation reference: REC-SEC-007
- Dependencies: DEPENDENT_ON: DevOps Engineer REC-OPS-002 (structured logging) — can implement with basic logging first, enhance when structured logging is available
- Blocker: NONE
- Acceptance criteria:
  - Given a path traversal attempt is blocked, when the log is inspected, then an entry with `"level": "SECURITY"` and `"event": "path_traversal_blocked"` exists
  - Given a rate limit is exceeded, when the log is inspected, then a security event is logged
  - Given a secret pattern is detected, when the log is inspected, then the event type is logged but the secret value is NOT

**SP-SEC-009: JSON Schema Validation for State Files**
- Description: As a system I want JSON state files validated against a schema on load so that corrupted or maliciously edited files are detected
- Team: Team Security
- Story type: `CODE`
- Story points: 5
- Recommendation reference: SEC-A08-003 (no schema validation)
- Dependencies: None
- Blocker: NONE
- Acceptance criteria:
  - Given `session-state.json` is loaded, when parsed, then required fields are validated (schema_version, session_id, status, current_phase)
  - Given a corrupted JSON file, when loaded, then a clear error is returned and the file is NOT used
  - Given `command-queue.json` is loaded, when parsed, then the queue structure is validated (array of objects with required fields)

---

### Step F2: Parallel Tracks

**Sprint 1:**
- Track A: SP-SEC-001 (content sanitization) + SP-SEC-002 (atomic writes) — independent, both modify server.js in different functions
- Track B: SP-SEC-003 (secret detection) — independent
- Track C: SP-SEC-004 (headers) + SP-SEC-005 (handoff context doc) — independent

**Sprint 2:**
- Track A: SP-SEC-006 (rate limiting) + SP-SEC-007 (CORS) — independent middleware additions
- Track B: SP-SEC-008 (security logging) + SP-SEC-009 (schema validation) — independent

### Step F3: Blocker Register

No external blockers identified. All stories are implementable with existing codebase access.

---

### Step G: Sprint Goals and Definition of Done

**Sprint 1 Goal:** Eliminate critical data integrity risks and establish security implementation guardrails
- KPI 1: 100% of markdown injection patterns neutralized in test suite
- KPI 2: 0 data corruption incidents under simulated crash conditions
- KPI 3: All Critical/High findings have IMPL-CONSTRAINTs in handoff context
- DoD: All stories complete, injection + crash tests passing, security-handoff-context.md present

**Sprint 2 Goal:** Add defense-in-depth layers for rate limiting, CORS, security logging, and data validation
- KPI 1: 100% of requests beyond rate limit are rejected with 429
- KPI 2: ≥5 security event types logged
- KPI 3: All JSON state files validated against schema on load
- DoD: All stories complete, rate limit + CORS + logging + schema tests passing

---

### Step H: Sprint Plan Self-Check

**Traceability Table:**

| Recommendation | Priority | Story | Status |
|---------------|----------|-------|--------|
| REC-SEC-001 | P1 | SP-SEC-001 | ✅ Covered |
| REC-SEC-002 | P1 | SP-SEC-002 | ✅ Covered |
| REC-SEC-003 | P1 | SP-SEC-003 | ✅ Covered |
| REC-SEC-004 | P2 | SP-SEC-004 | ✅ Covered |
| REC-SEC-005 | P2 | SP-SEC-006 | ✅ Covered |
| REC-SEC-006 | P2 | SP-SEC-007 | ✅ Covered |
| REC-SEC-007 | P2 | SP-SEC-008 | ✅ Covered |
| REC-SEC-008 | P1 | SP-SEC-005 | ✅ Covered |

- [x] All P1 recommendations have at least one story
- [x] All P2 recommendations have at least one story
- [x] Every story has a team assignment
- [x] Every story has at least one acceptance criterion
- [x] Every story has a Blocker field
- [x] No EXTERN blockers (no escalation routes needed)
- [x] Parallel tracks identified per sprint
- [x] Assumptions documented (1 engineer, 20 SP/sprint, 2-week sprints)
- [x] Sprint KPIs are SMART
- [x] ANALYSIS stories free of cross-track blockers from CODE/INFRA

---

## 4. GUARDRAILS

### G-SEC-AUDIT-01: Mandatory safePath for User-Controlled File Paths
**Formulation:** Must not resolve any file path derived from user input without calling `safePath()`. Every API endpoint that accepts a file path (directly or indirectly via slugs, IDs used as filenames) must validate through `safePath()`.
**References:** SEC-H-001, SF-008, SF-DEV-003
**Scope:** All API endpoints in `server.js` that read or write files
**Violation action:** Block PR merge; mark as CRITICAL_FINDING.
**Verification method:** Code review checklist: search for `fs.readFileSync`, `fs.writeFileSync`, `fs.existsSync` — every call using user-derived path must be preceded by `safePath()`. Automated: grep-based CI check.
**Overlap check:** Supplements G-SEC-05 (from security-guardrails.md — general input validation). This guardrail is specific to file path validation.

### G-SEC-AUDIT-02: Mandatory HTML Escaping for Dynamic Content
**Formulation:** Must not assign user-derived data to `innerHTML` without first passing through `esc()` for text content or `escAttr()` for attribute values. No raw string concatenation of user data into HTML strings.
**References:** SEC-J-003, SF-007, SF-DEV-002
**Scope:** All client-side JavaScript in `index.html`
**Violation action:** Block PR merge; escalate to Security Architect as CRITICAL_FINDING.
**Verification method:** Code review checklist: every `innerHTML` assignment must use `esc()`. Automated: regex search for `innerHTML\s*=` patterns without `esc()` in the assignment chain.
**Overlap check:** New — no existing guardrail specifically covers client-side HTML escaping.

### G-SEC-AUDIT-03: Content-Type Enforcement on POST Endpoints
**Formulation:** Must not accept POST request bodies without `Content-Type: application/json` enforcement. The `parseBody()` function must remain the sole body-parsing entry point. No alternative parsers (form-encoded, multipart) may be added without Security Architect review.
**References:** SEC-A05-005 (Content-Type enforcement is CSRF defense), SF-DEV-007
**Scope:** All POST endpoints in `server.js`
**Violation action:** Block PR merge; escalate to Security Architect.
**Verification method:** Code review: verify all POST handlers route through `parseBody()`. Automated: test that `POST` with `Content-Type: text/plain` returns 415.
**Overlap check:** New — no existing guardrail covers Content-Type enforcement.

### G-SEC-AUDIT-04: No Secrets in Logs or Error Responses
**Formulation:** Must not log request body contents, user answers, decision text, or any PII to console or log files. Must not include `Error.stack`, full file paths, or system configuration in API error responses.
**References:** SEC-A09-001, SEC-I-001
**Scope:** All logging and error handling in `server.js`
**Violation action:** Block PR merge; require log audit.
**Verification method:** Code review: verify `console.log`/`console.error` calls do not include `body`, `answer`, `text`, or `notes` fields. Error responses only use controlled `err.message`.
**Overlap check:** Supplements G-SEC-04 (from security-guardrails.md — general data protection). This guardrail is specific to logging.

### G-SEC-AUDIT-05: No Network Exposure Without Authentication
**Formulation:** Must not bind the server to `0.0.0.0`, `::`, or any non-loopback address without implementing authentication and authorization first. The `HOST` constant must remain `127.0.0.1` until auth is in place.
**References:** SEC-A01-001, SEC-A07-001, SF-002
**Scope:** Server startup configuration in `server.js`
**Violation action:** Block deployment; escalate to Security Architect as CRITICAL_FINDING.
**Verification method:** Code review: verify `HOST` constant is `127.0.0.1`. Automated: grep for `0.0.0.0` or `::` in listen calls.
**Overlap check:** New — no existing guardrail specifically prevents network exposure.

### Guardrails Self-Check (Step M)
- [x] Every guardrail is formulated as testable (starts with "Must not")
- [x] Every guardrail has a violation action
- [x] Every guardrail has a verification method
- [x] Every guardrail references an analysis finding
- [x] Overlap checked against existing guardrail documents (03-security-guardrails.md)

---

## QUESTIONNAIRE REQUESTS

| ID | Question | Context | Priority |
|----|----------|---------|----------|
| Q-SEC-DEPLOY-001 | Is there a plan to deploy this application beyond localhost (e.g., team server, cloud, Docker)? | Determines whether authentication, HTTPS, and CORS are P1 or P3 | REQUIRED |
| Q-SEC-DATA-001 | Will users enter personal data (names, emails, phone numbers) into questionnaire answers or decisions? | Determines GDPR applicability and need for PII classification/encryption | REQUIRED |
| Q-SEC-PENTEST-001 | Is a penetration test planned or budgeted for this application? | Currently HIGH_PRIORITY_GAP — no pentest exists | OPTIONAL |

---

## JSON EXPORT

```json
{
  "agent": "08-security-architect",
  "mode": "AUDIT",
  "date": "2026-03-07",
  "overall_posture": "HIGH_RISK_PRE_PRODUCTION",
  "total_findings": 47,
  "by_severity": {
    "critical": 5,
    "high": 14,
    "medium": 16,
    "low": 10,
    "informational": 2
  },
  "owasp_top_10": {
    "A01_broken_access_control": "CRITICAL",
    "A02_cryptographic_failures": "HIGH",
    "A03_injection": "HIGH",
    "A04_insecure_design": "HIGH",
    "A05_security_misconfiguration": "MEDIUM",
    "A06_vulnerable_components": "LOW",
    "A07_auth_failures": "CRITICAL",
    "A08_data_integrity": "HIGH",
    "A09_logging_failures": "MEDIUM",
    "A10_ssrf": "NOT_APPLICABLE"
  },
  "security_flags_processed": 18,
  "security_flags_resolved": 6,
  "security_flags_partially_mitigated": 4,
  "security_flags_confirmed": 8,
  "compliance_framework": "GDPR_CONDITIONAL",
  "pentest_status": "NONE",
  "recommendations": 8,
  "p1_count": 4,
  "p2_count": 4,
  "p3_count": 0,
  "sprint_stories": 9,
  "total_story_points": 38,
  "sprints_planned": 2,
  "guardrails_new": 5,
  "impl_constraints": 10,
  "questionnaire_requests": 3,
  "strongest_defenses": [
    "safePath() path traversal guard",
    "esc()/escAttr() HTML escaping",
    "Content-Type application/json enforcement",
    "localhost-only binding",
    "zero npm dependencies"
  ]
}
```

---

## HANDOFF CHECKLIST — Security Architect — 2026-03-07

- [x] **MODE:** AUDIT
- [x] All SECURITY_FLAG: items from preceding agents processed (18 flags — resolution matrix in Section K)
- [x] Compliance framework established with source reference (GDPR conditional — based on deployment scope)
- [x] OWASP Top 10: all 10 categories assessed (A01–A10, with status per category)
- [x] Secrets audit performed (Section B — no hardcoded secrets found; user-submitted text risk identified)
- [x] IAM analysis complete (Section C — all aspects assessed as ABSENT)
- [x] Security in CI/CD assessed (Section E — no pipeline, no scanning, no protection)
- [x] Pentest status documented (HIGH_PRIORITY_GAP: No recent pentest)
- [x] All findings scored (CVSS-equivalent priority: Critical/High/Medium/Low/Informational)
- [x] CRITICAL_FINDING items marked and escalated (5 Critical findings in A01, A07)
- [x] `.github/docs/security/security-handoff-context.md` present with IMPL-CONSTRAINTs for all High/Critical findings
- [x] JSON export present and valid
- [x] Self-check performed (Steps 7, D, H, M)
- [x] Recommendations: every recommendation references a GAP/RISK analysis finding
- [x] Recommendations: all impact fields filled
- [x] Recommendations: all success criteria are SMART
- [x] Sprint Plan: assumptions (team, capacity, preconditions) documented
- [x] Sprint Plan: all stories have at least 1 acceptance criterion
- [x] **Sprint Plan: all P1 and P2 recommendations have at least one story (traceability table present — 0 MISSING_STORY)**
- [x] Guardrails: all guardrails are formulated as testable
- [x] Guardrails: all guardrails have violation action AND verification method
- [x] Guardrails: all guardrails reference a GAP/RISK analysis finding
- [x] All 4 deliverables present: Analysis ✓ Recommendations ✓ Sprint Plan ✓ Guardrails ✓
- [x] Questionnaire input check: NOT_INJECTED (documented)
- [x] QUESTIONNAIRE_REQUEST: 3 items (Q-SEC-DEPLOY-001, Q-SEC-DATA-001, Q-SEC-PENTEST-001)
- [x] Deliverable written to file per MEMORY MANAGEMENT PROTOCOL
- [x] Output complies with agent-handoff-contract.md

**STATUS: READY FOR HANDOFF**
