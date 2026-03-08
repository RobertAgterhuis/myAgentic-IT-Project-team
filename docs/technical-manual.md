---
layout: default
title: Technical Manual
nav_order: 3
---

# Technical Manual — Agentic IT Project Team

> Version 1.0 | Last updated: 2026-03-08

This manual covers the server architecture, API reference, data model, configuration, deployment, and development practices for the Questionnaire & Decisions Manager web application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Reference](#module-reference)
3. [API Reference](#api-reference)
4. [Data Model](#data-model)
5. [Configuration](#configuration)
6. [Deployment](#deployment)
7. [Security Model](#security-model)
8. [Testing](#testing)
9. [Development Setup](#development-setup)
10. [Monitoring & Observability](#monitoring--observability)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (index.html)              │
│  ┌──────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Cmd Ctr  │ │Questionnaires│ │   Decisions       │ │
│  └──────────┘ └──────────────┘ └──────────────────┘ │
│         ↕ HTTP/JSON            ↕ SSE                 │
└─────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼─────────────────────────────┐
│               server.js (HTTP Router)                │
│  ┌───────┐ ┌────────┐ ┌────────┐ ┌───────────────┐  │
│  │Routes │ │ SSE    │ │Metrics │ │Security Hdrs  │  │
│  └───┬───┘ └────────┘ └────────┘ └───────────────┘  │
│      │                                               │
│  ┌───┴───┐ ┌────────┐ ┌────────┐ ┌───────────────┐  │
│  │models │ │ cache  │ │schemas │ │  audit         │  │
│  └───┬───┘ └───┬────┘ └────────┘ └───────────────┘  │
│      │         │                                     │
│  ┌───┴─────────┴───┐                                 │
│  │   store.js      │ ← FileStore / InMemoryStore     │
│  └─────────────────┘                                 │
│         ↕                                            │
│  ┌─────────────────┐                                 │
│  │ Filesystem       │ (.github/docs/, BusinessDocs/) │
│  └─────────────────┘                                 │
└─────────────────────────────────────────────────────┘
```

### Design Principles

- **Zero runtime dependencies** — Only Node.js built-in modules (`http`, `fs`, `path`, `url`, `crypto`) for the web UI.
- **MCP integration** — MCP server uses `@modelcontextprotocol/sdk` for cross-IDE support via stdio transport.
- **Store abstraction** — All filesystem I/O goes through the Store interface. `FileStore` for production, `InMemoryStore` for testing.
- **Atomic writes** — `safeWriteSync()` writes to a temp file, then renames. A backup is created before overwriting existing files.
- **Localhost only** — Server binds to `127.0.0.1:3000`. No external network exposure.
- **Single-page UI** — `index.html` contains all HTML, CSS, and JavaScript. No build step, no bundler.

---

## Module Reference

### server.js (~1170 lines)
The main application module. Exports the HTTP server and key utilities.

**Key exports:**
- `server` — Node.js `http.Server` instance
- `sanitizeMarkdown(text)` — Escapes Markdown injection characters
- `sanitizeQID(text)` — Neutralizes Q-ID patterns in user input
- `detectSecrets(text)` — Returns array of detected secret pattern names
- `safePath(base, relative)` — Validates path, throws on traversal
- `setSecurityHeaders(res)` — Sets all security response headers
- `recordMetric(method, path, duration, status)` — Records request metric
- `computePercentiles(arr)` — Returns `{ p50, p95, p99 }` for a sorted number array
- `sseNotify(channel, data)` — Broadcasts SSE event to connected clients
- `_sseClients` — Set of active SSE client connections
- `_cache` — FileCache instance
- `_metrics` — Metrics state object
- `_audit` — AuditTrail instance

### mcp-server.js
MCP (Model Context Protocol) server for cross-IDE integration. Exposes the Command Center functionality as MCP tools and resources via stdio transport.

**Dependency:** `@modelcontextprotocol/sdk` (the only runtime npm dependency).

**Transport:** stdio — launched automatically by the IDE via `.vscode/mcp.json` or equivalent IDE configuration.

**Tools (13):**

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_project_status` | — | Session state, pipeline progress, command queue summary |
| `get_progress` | — | Phase completion status, current agent, sprint info |
| `list_questionnaires` | — | All questionnaires with completion stats (total/answered/open) |
| `get_questionnaire` | `file` | Full parsed questionnaire with questions, answers, statuses |
| `save_answers` | `file`, `updates[]` | Save answers (with secret detection and sanitization) |
| `list_decisions` | — | Decisions grouped by status (open/decided/deferred) |
| `create_decision` | `type`, `priority`, `scope`, `text`, `notes?` | Create open question or operational decision |
| `answer_decision` | `id`, `answer` | Answer an open question |
| `decide_question` | `id` | Finalize an answered question → decided |
| `queue_command` | `command`, `project?`, `scope?`, `description?`, `brief?` | Queue orchestrator command |
| `get_command_queue` | — | Full command queue history |
| `get_help` | `topic?` | Help topic content, or table of contents if omitted |
| `get_audit_log` | `limit?` | Recent audit trail entries (default 50, max 1000) |

**Resources (3):**

| URI | MIME Type | Description |
|-----|-----------|-------------|
| `agentic://session-state` | `application/json` | Current session state |
| `agentic://decisions` | `application/json` | All decisions |
| `agentic://command-queue` | `application/json` | Command queue |

**Key implementation details:**
- Reuses `models.js`, `store.js`, `cache.js`, `audit.js`, and `server.js` sanitization functions from the web UI
- All file writes use the same `safeWrite()` atomic write pattern
- Input sanitization (markdown injection, Q-ID neutralization, secret detection) is applied to all tool inputs
- Path traversal is blocked via `safePath()` on all file parameters
- Startup gated behind `if (require.main === module)` for test-safe importing

### store.js
Storage abstraction layer.

**Classes:**
- `FileStore` — Production store using `fs` for file I/O.
  - `readFile(path)` → string
  - `writeFile(path, content)` — Atomic write with backup
  - `exists(path)` → boolean
  - `listDir(path)` → string[]
  - `mtime(path)` → number (modification timestamp)
- `InMemoryStore` — Test store with in-memory filesystem.
  - Same interface as FileStore
  - Constructor accepts `{ [path]: content }` initial data
  - `_backups` Map tracks overwritten versions

**Functions:**
- `setStore(store)` — Replace the global store instance
- `getStore()` — Get the current global store instance

### models.js
Domain parsing and mutation functions.

**Key functions:**
- `parseQuestionnaire(content, relPath, basePath)` — Parses questionnaire Markdown into structured data
- `updateAnswerInContent(content, questionId, answer, status)` — Replaces a question's answer in Markdown
- `parseDecisions(content)` → `{ open, decided, deferred }` — Parses decisions.md into arrays
- `nextDecisionId(content, prefix)` → string — Computes next sequential ID
- `addOpenQuestion(content, entry)` → string — Inserts a new open question row
- `addOperationalDecision(content, entry)` → string — Inserts a new decided item
- `moveToDecided(content, id, answer)` → string — Moves an open question to decided
- `moveToDeferred(content, id, reason)` → string — Moves an item to deferred
- `parseSessionState(content)` → object — Parses session-state.json
- `parseIndex(content)` → object — Parses questionnaire-index.md

### cache.js
File cache with mtime-based invalidation.

**Class: `FileCache`**
- `read(filePath)` → string — Returns cached content; re-reads if mtime changed
- `readJSON(filePath, validator?)` → `{ data, errors }` — Parses JSON with optional schema validation
- `invalidate(filePath)` — Removes a specific cache entry
- `invalidateAll()` — Clears the entire cache
- `stats()` → `{ hits, misses, size }` — Cache statistics

### schemas.js
JSON schema validators.

**Functions:**
- `validateSessionState(obj)` → `{ valid, errors }` — Validates session state object
- `validateCommandEntry(obj)` → `{ valid, errors }` — Validates a command queue entry
- `validateAnalyticsEvent(obj)` → `{ valid, errors }` — Validates an analytics event

### strings.js
Externalized user-facing strings.

**Exports:**
- `VALIDATION` — Validation error message templates
- `RESPONSES` — Response message factories (e.g., `reevaluateTrigger(scope)`, `commandQueued(cmd)`)
- `STATIC` — Static string constants

### audit.js
Mutation audit trail.

**Class: `AuditTrail`**
- `constructor({ dir, maxSize?, filename? })` — Creates audit trail instance
- `log({ operation, entity_type, entity_id?, user?, summary })` — Appends a log entry
- `read(limit)` → array — Returns the last N entries (default 50)
- `count()` → number — Total entry count
- `logPath` → string — Full path to the log file

**Format:** Append-only JSON Lines (`.jsonl`). Each line: `{ timestamp, operation, entity_type, entity_id, user, summary }`. File rotation at configurable max size (default 10 MB).

### utils/errors.js
Structured error catalog.

**Functions:**
- `errorResponse(code, details?)` → `{ code, message, recovery, details? }` — Returns structured error for a known error code
- `statusToCode(httpStatus)` → string — Maps HTTP status to error code

**Error codes:** `VALIDATION_ERROR`, `FILE_NOT_FOUND`, `DECISIONS_NOT_FOUND`, `INVALID_ACTION`, `UNKNOWN_COMMAND`, `NOT_FOUND`, `PATH_TRAVERSAL`, `PAYLOAD_TOO_LARGE`, `INVALID_CONTENT_TYPE`, `INVALID_JSON`, `INVALID_INPUT`, `METHOD_NOT_ALLOWED`, `INTERNAL_ERROR`

### utils/secret-utils.js
Secret detection and warning utilities.

**Functions:**
- `formatSecretWarnings(patterns)` → string[] — Formats detected patterns into warning messages
- `attachSecretWarnings(response, patterns)` — Adds `warnings` array to a response object if patterns found

---

## API Reference

All endpoints accept and return JSON. The server runs on `http://127.0.0.1:3000`.

### Questionnaires

#### GET /api/questionnaires
Returns all questionnaires parsed from `BusinessDocs/` subdirectories.

**Response:**
```json
{
  "questionnaires": [
    {
      "file": "Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md",
      "agent": "Software Architect",
      "phase": "Phase 2",
      "questions": [
        { "id": "Q-05-001", "required": true, "question": "...", "answer": "", "status": "OPEN" }
      ]
    }
  ]
}
```

#### POST /api/save
Save answers to a questionnaire.

**Request:**
```json
{
  "file": "Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md",
  "updates": [
    { "questionId": "Q-05-001", "answer": "My answer here", "status": "ANSWERED" }
  ]
}
```

**Response:**
```json
{ "ok": true, "updated": 1, "warnings": [] }
```

The `warnings` array contains secret detection alerts if credentials are found in answers.

### Session

#### GET /api/session
Returns the current session state from `session-state.json`.

**Response:** The full session state object (see [Data Model](#data-model)).

### Decisions

#### GET /api/decisions
Returns all decisions parsed from `decisions.md`.

**Response:**
```json
{
  "open": [...],
  "decided": [...],
  "deferred": [...]
}
```

#### POST /api/decisions
Create, answer, decide, or defer a decision.

**Request (create):**
```json
{
  "action": "create",
  "type": "OPEN_QUESTION",
  "priority": "HIGH",
  "scope": "Phase 2",
  "text": "Which database should we use?"
}
```

**Request (answer):**
```json
{ "action": "answer", "id": "DEC-R2-010", "answer": "PostgreSQL" }
```

**Request (decide):**
```json
{ "action": "decide", "id": "DEC-R2-010", "answer": "PostgreSQL — final" }
```

**Request (defer):**
```json
{ "action": "defer", "id": "DEC-R2-010", "reason": "Need more research" }
```

**Response:** `{ "ok": true, "id": "DEC-R2-011" }`

### Commands

#### POST /api/command
Queue a command for the agent pipeline.

**Request:**
```json
{ "command": "CREATE MyProject" }
```

**Response:**
```json
{ "ok": true, "clipboard_text": "CREATE MyProject", "entry": { ... } }
```

Supported commands: `CREATE`, `AUDIT`, `FEATURE`, `REEVALUATE`, `SCOPE CHANGE`, `HOTFIX`, `CONTINUE`, `REFRESH ONBOARDING`, and partial/combo variants.

#### GET /api/command
Returns the command queue.

**Response:**
```json
{
  "queue": [...],
  "command": { ... }
}
```

### Progress

#### GET /api/progress
Returns pipeline progress across all 7 phase groups.

**Response:**
```json
{
  "phases": [
    { "key": "ONBOARDING", "label": "Onboarding", "status": "COMPLETE", "agents": [...] },
    { "key": "PHASE-2", "label": "Architecture & Design", "status": "IN_PROGRESS", "agents": [...] }
  ]
}
```

### Export

#### GET /api/export
Exports the full project state as a single JSON object.

**Response:**
```json
{
  "session": { ... },
  "command_queue": [...],
  "decisions": { "open": [], "decided": [], "deferred": [] },
  "questionnaires": [...],
  "exported_at": "2026-03-08T12:00:00Z"
}
```

### Analytics

#### POST /api/analytics
Submit UI analytics events.

**Request:**
```json
{
  "events": [
    { "event": "page_view", "properties": { "page": "questionnaires" } }
  ]
}
```

**Valid event types:** `page_view`, `tab_switch`, `question_answered`, `decision_created`, `command_queued`, `theme_toggle`, `font_size_change`, `help_opened`, `onboarding_complete`, `onboarding_skip`, `export_triggered`

**Response:** `{ "accepted": 1, "rejected": 0 }`

#### GET /api/analytics
Returns stored analytics events.

**Response:** `{ "events": [...] }`

### Reevaluate

#### POST /api/reevaluate
Triggers a reevaluation of one or more scopes.

**Request:**
```json
{ "scope": "TECH" }
```

**Response:** `{ "ok": true, "scope": "TECH" }`

Writes a trigger file to `.github/docs/session/reevaluate-trigger.json`.

### Help

#### GET /api/help
Returns the help table of contents.

**Response:** `{ "toc": [{ "slug": "getting-started", "title": "Getting Started" }] }`

#### GET /api/help?topic=getting-started
Returns a specific help topic.

**Response:** `{ "slug": "getting-started", "title": "Getting Started", "content": "..." }`

**Validation:** slugs are validated — path traversal attempts return 400.

### Monitoring

#### GET /api/health
Returns server health.

**Response:**
```json
{ "status": "ok", "sse_connections": 0, "timestamp": "2026-03-08T12:00:00Z" }
```

#### GET /api/metrics
Returns server metrics.

**Response:**
```json
{
  "uptime_seconds": 3600,
  "request_count": 150,
  "error_count": 2,
  "error_rate": 0.013,
  "response_time_p50": 5,
  "response_time_p95": 25,
  "response_time_p99": 50,
  "sse_connections": 1,
  "cache_hit_ratio": 0.85,
  "per_endpoint": { ... }
}
```

### Audit

#### GET /api/audit
Returns mutation audit trail entries.

**Query parameters:**
- `limit` — Number of entries to return (default: 50, max: 1000)

**Response:**
```json
{
  "entries": [
    { "timestamp": "2026-03-08T12:00:00Z", "operation": "UPDATE_ANSWER", "entity_type": "questionnaire", "entity_id": "Q-05-001", "user": "webapp", "summary": "..." }
  ],
  "total": 42,
  "limit": 50
}
```

### SSE

#### GET /api/events
Server-Sent Events stream for real-time updates.

**Event types:**
- `questionnaire_update` — Questionnaire answer changed
- `decision_update` — Decision created/modified
- `command_queued` — New command added to queue
- `reevaluate_trigger` — Reevaluation triggered

**Example:**
```
event: questionnaire_update
data: {"file":"Phase2-Tech/Questionnaires/05-software-architect-questionnaire.md"}

```

### Static Files

#### GET /
Serves `index.html` (the single-page web UI).

#### GET /health
Lightweight health check (no JSON structure, fast response).

---

## Data Model

### session-state.json
Location: `.github/docs/session/session-state.json`

```json
{
  "session_id": "string — unique session identifier",
  "cycle_type": "FULL_CREATE | COMBO_AUDIT | PARTIAL_CREATE | ... (11 types)",
  "status": "NOT_STARTED | ONBOARDING | PHASE-1-IN-PROGRESS | ... | COMPLETE",
  "current_phase": "ONBOARDING | PHASE-1 | PHASE-2 | PHASE-3 | PHASE-4 | SYNTHESIS | PHASE-5",
  "current_agent": "string — agent ID (e.g. '20-implementation-agent')",
  "current_step": "string — human-readable step description",
  "initiated_at": "ISO 8601 timestamp",
  "last_updated": "ISO 8601 timestamp",
  "completed_phases": ["array of phase keys"],
  "completed_agents": ["array of agent IDs"],
  "phase_outputs": { "phase-key": "file path or object of agent outputs" },
  "sprint_backlog": { "sprint-id": { ... } }
}
```

### decisions.md
Location: `.github/docs/decisions.md`

Markdown file with three main tables:
- **Open Questions** — items waiting for user answers
- **Decided Items** — active constraints (subsections: Transformation, Reevaluation, Operational)
- **Deferred & Expired** — parked or obsolete items

Each row: `| ID | Priority | Scope | Decision/Question | Notes/Answer | Date |`

### Questionnaires
Location: `BusinessDocs/Phase[N]-[Discipline]/Questionnaires/*.md`

Markdown files with structured questions:
```markdown
### Q-05-001 [REQUIRED]
**Question:** What is the target deployment environment?
**Why we need this:** To determine infrastructure requirements.
**Expected format:** Text description
**Your answer:**
> (user fills in here)
```

### Analytics Events
Location: `.github/docs/analytics-events.json`

JSON array of event objects:
```json
[{ "event": "page_view", "properties": { "page": "questionnaires" }, "timestamp": "2026-03-08T12:00:00Z" }]
```

### Audit Log
Location: `.github/docs/audit/audit.jsonl`

Append-only JSON Lines file:
```jsonl
{"timestamp":"2026-03-08T12:00:00.000Z","operation":"UPDATE_ANSWER","entity_type":"questionnaire","entity_id":"Q-05-001","user":"webapp","summary":"Updated answer for Q-05-001"}
```

### Command Queue
Location: `.github/docs/session/command-queue.json`

JSON array of command entries:
```json
[{ "command": "CREATE MyProject", "requested_at": "2026-03-08T12:00:00Z", "status": "PENDING" }]
```

---

## Configuration

The server uses environment variables and sensible defaults:

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `3000` | HTTP server port |
| `SERVER_HOST` | `127.0.0.1` | Bind address (always localhost) |

All file paths are computed relative to the repository root. The server expects to be launched from the repository root directory or with the correct working directory.

---

## Deployment

### Localhost (Production)

```bash
# Install dependencies (only needed once, from .github/ directory)
cd .github
npm install

# Start the server (from repo root)
node .github/webapp/server.js
```

The server is designed for **localhost use only**. It does not implement authentication, rate limiting, or TLS — these would be needed for any network-exposed deployment.

### Process Management

For persistent operation, use a process manager:

```bash
# Using PM2
npx pm2 start .github/webapp/server.js --name agentic-team

# Check status
npx pm2 status
```

### Health Checks

- `GET /health` — Fast check, returns `{ status: "ok", uptime: N }`
- `GET /api/health` — Detailed check, includes SSE connection count and timestamp

---

## Security Model

### HTTP Security Headers

Every response includes:
| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | Strict CSP with inline script hash |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restricts camera, microphone, geolocation |
| `Cross-Origin-Opener-Policy` | `same-origin` |

### Input Sanitization

- **Markdown injection** — `sanitizeMarkdown()` escapes `#`, `---`, `|`, and other Markdown control characters.
- **Q-ID neutralization** — `sanitizeQID()` replaces hyphens in Q-ID patterns with non-breaking hyphens to prevent ID injection.
- **Path traversal** — `safePath()` validates all file paths, blocking `..` traversal.
- **Payload limits** — Request bodies are limited to prevent abuse.

### Secret Detection

`detectSecrets()` scans answers for:
- AWS Access Keys (`AKIA...`)
- GitHub Tokens (`ghp_...`, `gho_...`, `ghs_...`)
- Private Keys (`-----BEGIN ... PRIVATE KEY-----`)
- Generic API key patterns

Detected patterns generate warnings (not rejections) — users are informed but not blocked.

---

## Testing

### Framework
**Vitest** with **@vitest/coverage-v8** for code coverage.

### Test Structure

```
.github/tests/
  unit/
    audit-trail.test.js       — AuditTrail class
    backup-strategy.test.js    — Backup-on-write behavior
    file-lock.test.js          — Concurrent write safety
    mcp-server.test.js         — MCP server tools + resources (70 tests)
    models-edge.test.js        — Model parsing edge cases
    sanitization.test.js       — Input sanitization
    ...
  integration/
    decisions-roundtrip.test.js — Decision create/answer/decide flow
    e2e-api-flows.test.js       — End-to-end API workflows
    server-api.test.js          — All API endpoints
    store-cache.test.js         — Store + cache interaction
    regression-suite.test.js    — Cross-sprint regression (67 tests)
```

### Running Tests

All dev commands run from the `.github/` directory:

```bash
cd .github
npm test                  # All tests
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode
npx vitest run tests/unit # Only unit tests
```

### Coverage Thresholds

Configured in `.github/vitest.config.mjs`:
- Statements: ≥ 70%
- Branches: ≥ 70%
- Functions: ≥ 70%
- Lines: ≥ 70%

Actual coverage: **95%+ statements**.

### Test Conventions

- Use `InMemoryStore` — never touch the real filesystem.
- Use `setStore(store)` in `beforeEach` to reset state between tests.
- Call `_cache.invalidateAll()` to clear cache state.
- Server tests use `server.listen(0)` for random port allocation.

---

## Development Setup

```bash
# Clone
git clone https://github.com/RobertAgterhuis/myAgentic-IT-Project-team.git
cd myAgentic-IT-Project-team

# Install (tooling lives in .github/)
cd .github
npm install

# Verify
npm test        # Should show 506 passing
npm run lint    # Should show 0 errors

# Develop
npm run test:watch   # Re-runs on changes
npm start            # Start server for manual testing
```

See [CONTRIBUTING.md](contributing) for coding standards and PR process.

---

## Monitoring & Observability

### Metrics Endpoint

`GET /api/metrics` provides:
- **Request count** and **error count** with error rate
- **Response time percentiles** (p50, p95, p99)
- **SSE connection count**
- **Cache hit ratio**
- **Per-endpoint breakdowns** (count, avg response time, error rate)

### Structured Logging

The server emits JSON-formatted log lines to stdout:
```json
{"timestamp":"2026-03-08T12:00:00.000Z","level":"info","message":"http_request","method":"GET","url":"/api/health","status":200,"duration_ms":1}
```

### Audit Trail

All data mutations (questionnaire answers, decision changes) are logged to the append-only audit trail at `.github/docs/audit/audit.jsonl`. Query via `GET /api/audit?limit=100`.
