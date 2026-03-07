# Technical Architecture Overview
> Version: v2 | Last updated: 2026-03-08T12:00:00Z | Source: Phase 2 agent outputs (05, 06, 07, 08, 09) + Reevaluation R2
> Completeness: ~90% — updated with questionnaire answers (deployment scope, team capacity, storage, security scope resolved)

---

## System Architecture

**Architecture style:** Layerless monolith — single-file server (`server.js`, ~1,600 LOC) + single-page application (`index.html`, ~2,200 LOC). No separation between routing, business logic, and data access layers. (Source: Agent 05, GAP-ARCH-001)

**Communication:** HTTP REST API between client and server. Client uses `fetch()` with `async/await`. Server uses native Node.js `http` module. No WebSocket or SSE for real-time updates — uses polling with 2-second intervals for long-running operations. (Source: Agent 05, Agent 06)

**State management:** Client-side state held in JavaScript module-level variables (`currentTab`, `sortOrder`, `searchTerm`). No centralized state store. Server-side state is the filesystem. (Source: Agent 05, GAP-ARCH-002)

**Key architectural concern:** God Functions — `server.js` `handleRequest()` routes ALL endpoints in a single function with cascading if/else blocks. `index.html` contains similar patterns in `loadTab()` and `handleOverlayAction()`. Cyclomatic complexity reaches 25+ in several functions. (Source: Agent 06, 51 SOLID violations)

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Runtime | Node.js | Not pinned (no `package.json`) | Native `http`, `fs`, `path` modules only |
| Frontend | Vanilla HTML/CSS/JS | ES2020+ | Single `index.html` SPA, no framework |
| Data | Filesystem (Markdown + JSON) | N/A | Human-readable persistence |
| Dependencies | **Zero** | N/A | No `node_modules`, no `package.json` |
| Build system | None | N/A | No bundling, no transpilation |

**Notable:** The zero-dependency architecture eliminates supply chain risk entirely but limits available tooling. Adding any dependency (test framework, linter, i18n library) requires an Architecture Decision Record per guardrail G-ARCH-AUDIT-04. (Source: Agent 05, Agent 07)

---

## Infrastructure & Deployment

**Current deployment:** Manual start via `start.ps1` PowerShell script → `node server.js` → `http://127.0.0.1:3000`. Localhost-only binding. No Docker, no cloud deployment, no environment configuration. (Source: Agent 07, CMMI Level 0)

**CI/CD:** None — no pipeline, no automated testing, no secret scanning, no linting, no build step. (Source: Agent 07)

**RESOLVED (Q-07-001):** Target deployment is **localhost only** — no cloud deployment, no Docker, no TLS, no network-level auth required. 30+ conditional findings are downgraded to ADVISORY status. Future internal deployment may be considered (Q-08-001) but is not planned.

**Team capacity (Q-05-001, Q-06-001):** 1 full-time developer, 30 story points per 2-week sprint. Sequential execution only — no parallel tracks.

---

## Security Posture

**Overall:** 47 OWASP findings identified (19 critical+high). Risk profile is bifurcated by deployment scope. (Source: Agent 08)

**Mitigating factor:** Localhost-only binding (`127.0.0.1:3000`) eliminates network attack surface for current deployment. (Source: Agent 08)

**Critical findings (regardless of deployment):**
- **Markdown injection** — user input is written directly to `.md` files without sanitization. Can corrupt data structure. (4-agent consensus: Agents 05, 06, 08, 09)
- **Non-atomic writes** — `fs.writeFileSync()` without temp-file-then-rename pattern. Data corruption risk on crash/concurrent access. (5-agent consensus)
- **No input validation** — API endpoints accept arbitrary input without schema validation (Source: Agent 08, SEC-A03)

**ADVISORY findings (localhost-only confirmed — Q-07-001, Q-08-001):**
- No authentication or authorization — ADVISORY (not required for localhost)
- No HTTPS/TLS — ADVISORY (not required for localhost)
- No CORS policy — ADVISORY (not required for localhost)
- No rate limiting — ADVISORY (not required for localhost)
- No Content-Security-Policy headers — ADVISORY (recommended for defense-in-depth)
- GDPR compliance — **NOT APPLICABLE** (no PII processed per Q-09-002, no retention needed per Q-09-003)

---

## Data Architecture

**Storage model:** Flat-file storage using Markdown (`.md`) and JSON (`.json`) files in conventional directory paths under the repository root. No database. (Source: Agent 09)

**Key data entities:**
- Questionnaires → `BusinessDocs/[Phase]/Questionnaires/*.md`
- Decisions → `.github/docs/decisions.md`
- Session state → `.github/docs/session/session-state.json`
- Agent outputs → `.github/docs/phase-[N]/*.md`
- Help content → `.github/help/*.md`

**Data integrity gaps:**
- No schema validation for JSON files (Source: Agent 09, GAP-DATA-003)
- No backup mechanism (Source: Agent 09, GAP-DATA-006)
- No audit trail for mutations (Source: Agent 09, GAP-DATA-007)
- Non-atomic writes (shared finding across 5 agents)

**RESOLVED (Q-09-003):** No data retention policy needed — no personal data, no regulatory requirement.
**RESOLVED (Q-09-004):** Single-user application — no concurrent access. Non-atomic write risk remains for crash recovery only.

---

## Key Technical Constraints

1. **Zero-dependency principle** — Any new dependency requires ADR justification (G-ARCH-AUDIT-04). (Source: Agent 05)
2. **File-based persistence** — **Confirmed: no database migration planned (Q-06-002).** All data access improvements must work with the filesystem. (Source: Agent 09)
3. **No network exposure without authentication** — Per DEC-T-010 and G-SEC-AUDIT-05, the application MUST NOT be deployed to a network-accessible environment without implementing authentication first. (Source: Agent 08, decisions.md)
4. **Localhost binding** — Currently hardcoded to `127.0.0.1`. Changing this triggers the full security remediation scope. (Source: Agent 07)
5. **Single-process** — No clustering, no worker threads. Concurrent access is not safely handled. (Source: Agent 05, Agent 09)
