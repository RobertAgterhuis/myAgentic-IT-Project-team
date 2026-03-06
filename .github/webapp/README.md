# Agentic System — Command Center

A zero-dependency local web app for managing the agentic system. Provides a unified Command Center with three tabs — **Command Center** (pipeline view + command launcher), **Questionnaires** (answer questions, set statuses), and **Decisions** (create/answer/defer decisions) — so non-technical stakeholders can interact with the system without editing markdown by hand.

## Prerequisites

- **Node.js 14+** (no npm install required — zero external dependencies)

## Quick Start

From the project root:

```bash
node .github/webapp/server.js
```

Then open **http://127.0.0.1:3000** in your browser.

### Custom port

```bash
PORT=8080 node .github/webapp/server.js
```

## What It Does

| Feature | Description |
|---------|-------------|
| **Command Center** | Pipeline view showing phase/agent progress; command launcher for CREATE, AUDIT, REEVALUATE, etc. |
| **Questionnaires** | Shows all questionnaires grouped by phase with answer-progress bars; per-question answer editing with auto-resize |
| **Decisions** | Create new decisions, answer or defer existing ones, view decision history |
| **Status management** | Dropdown per question: OPEN → ANSWERED → DEFERRED |
| **Save** | Per-question save, per-file save, or global Save All (Ctrl+S) |
| **Reevaluate** | Saves all pending changes, writes `.github/docs/session/reevaluate-trigger.json`, and prompts you to type `REEVALUATE [SCOPE]` in the Copilot chat |
| **Export** | Export all questionnaire data as JSON for external processing |
| **Help** | Built-in help system with topic navigation (F1 or ? to toggle) |
| **Contract-compliant** | Reads/writes the exact markdown format defined in `.github/docs/contracts/questionnaire-output-contract.md` |
| **Index rebuild** | Automatically updates `BusinessDocs/questionnaire-index.md` after every save (debounced) |

## Architecture

```
.github/webapp/
  server.js     Node.js server (built-in http module only)
  index.html    SPA — inline CSS + JS, no build step
  README.md     This file
```

- **Server** binds to `127.0.0.1` only (localhost) for security
- **Markdown is the source of truth** — the UI reads and writes the same files the agentic system uses
- **No database, no state** — everything lives in your `BusinessDocs/` folder

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/questionnaires` | List all questionnaires with parsed questions |
| GET | `/api/session` | Current session state (if exists) |
| POST | `/api/save` | Save answer(s) for a questionnaire file (max 200 updates per request) |
| POST | `/api/reevaluate` | Write reevaluation trigger file |
| GET | `/api/decisions` | Parse and return all decisions from `decisions.md` |
| POST | `/api/decisions` | Create, answer, defer, or delete a decision (`action`: `create` / `answer` / `defer` / `delete`) |
| POST | `/api/command` | Queue an agentic command (e.g. `CREATE`, `REEVALUATE`) and get clipboard text to paste in Copilot Chat |
| GET | `/api/command` | Retrieve the currently queued command (or `null`) |
| GET | `/api/progress` | Live phase/agent progress derived from `session-state.json` |
| GET | `/api/export` | Export all questionnaire data as JSON |
| GET | `/api/help?topic=<slug>` | Without `topic`: returns help table-of-contents. With `topic`: returns the markdown content for that help file |
| GET | `/health` | Health check endpoint (returns uptime) |

## Reevaluation Flow

1. Answer questions in the UI
2. Click **Save** (or Ctrl+S)
3. Click **Reevaluate** → choose scope → confirm
4. The server writes `.github/docs/session/reevaluate-trigger.json`
5. In the Copilot chat, type `REEVALUATE ALL` (or the scope you selected)
6. The agentic system picks up the updated answers and re-processes

## Security Notes

- Server only listens on `127.0.0.1` — not accessible from the network
- Security headers on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Content-Security-Policy`
- All file writes use `safeWriteSync` with try-catch (returns 500 with a user-friendly message on I/O failure)
- Concurrent file writes protected by async file locking (per-file mutex)
- Path traversal protection on all file operations
- Request body limited to 1 MB
- Strict JSON content-type validation on POST endpoints
- Input string validation with `assertString()` (type + max-length enforcement)
- Batch save capped at 200 updates per request
- Question IDs validated against `Q-\d{2}-\d{3}` format
- Status values validated against allowed set (`OPEN`, `ANSWERED`, `DEFERRED`)
- Command validation uses strict allowlist matching
- PORT validated to 1–65535 range at startup
- Directory traversal depth limited to 20 levels
- SSE command queue capped at 50 entries
- Questionnaire index rebuild debounced (500ms) to prevent redundant I/O
- 405 responses include computed `Allow` header and security headers
- Server error handling with specific `EADDRINUSE` detection
