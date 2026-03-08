---
layout: default
title: Contributing
nav_order: 6
---

# Contributing to Agentic IT Project Team

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Development Setup

### Prerequisites

- **Node.js ≥ 18** — [download](https://nodejs.org/)
- **Git** — [download](https://git-scm.com/)
- **VS Code** with [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) (for agent features)

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/RobertAgterhuis/myAgentic-IT-Project-team.git
cd myAgentic-IT-Project-team

# 2. Install dev dependencies
npm install

# 3. Run the test suite
npm test

# 4. Start the web UI (optional)
npm start
# → Open http://127.0.0.1:3000
```

### Useful Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start the web server on localhost:3000 |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Watch mode — re-runs on file changes |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run ESLint |

---

## Architecture Overview

```
.github/webapp/           ← Web application (the code you'll work with most)
  server.js               ← HTTP server, route handlers, SSE, metrics
  store.js                ← Storage abstraction (FileStore + InMemoryStore)
  models.js               ← Domain parsing (questionnaires, decisions, session state)
  cache.js                ← File cache with mtime invalidation
  schemas.js              ← JSON schema validation
  strings.js              ← Externalized UI strings
  audit.js                ← Mutation audit trail (append-only JSONL)
  utils/errors.js         ← Error catalog with structured responses
  utils/secret-utils.js   ← Secret pattern detection + warning formatting
  index.html              ← Single-page web UI (HTML/CSS/JS, no build step)

.github/skills/           ← Agent skill files (38 agents)
.github/docs/             ← Contracts, guardrails, playbooks, templates

.github/tests/
  unit/                   ← Unit tests (models, cache, schemas, sanitization, etc.)
  integration/            ← Integration tests (API, SSE, store, regression suite)
```

### Key Design Decisions

- **Zero runtime dependencies** — The server uses only Node.js built-in modules (`http`, `fs`, `path`, `url`, `crypto`). Dev dependencies (Vitest, ESLint) are test/lint-only.
- **Store abstraction** — `FileStore` for production, `InMemoryStore` for tests. All I/O goes through the store interface.
- **Atomic writes** — `safeWriteSync()` writes to a temp file first, then renames. Backups are created before overwriting.
- **Localhost only** — The server binds to `127.0.0.1`. No network exposure, no authentication required.
- **Checkpoint-and-yield** — Agents run one at a time, saving state to `session-state.json` after each step.

---

## Coding Standards

### ESLint Configuration

ESLint 9 with flat config (`.github/eslint.config.mjs`) enforces:

| Rule | Setting | Rationale |
|------|---------|-----------|
| `complexity` | max 8 | Keep functions small and testable |
| `no-unused-vars` | error (ignore `_` prefix) | Remove dead code |
| `no-var` | error | Use `const`/`let` only |
| `prefer-const` | error | Immutability by default |
| `eqeqeq` | error | Prevent type coercion bugs |
| `no-eval` | error | Security: prevent code injection |
| `no-implied-eval` | error | Security: prevent indirect eval |

### Style Guidelines

- **`const` by default**, `let` only when reassignment is needed
- **Function complexity ≤ 8** — extract helpers if a function grows too complex
- **No external runtime dependencies** — if you need functionality, implement it or use Node.js built-ins
- **Externalize user-facing strings** to `strings.js`
- **All errors** use the structured error catalog in `utils/errors.js`
- **Tests use InMemoryStore** — never touch the real filesystem in tests

### Security Requirements

All code must be free from OWASP Top 10 vulnerabilities:
- Sanitize all user input (see `sanitizeMarkdown`, `sanitizeQID` in server.js)
- Use `safePath()` to prevent path traversal
- Detect and warn on secret patterns (`detectSecrets()`)
- Set security headers on every response (`setSecurityHeaders()`)
- No `eval()`, no `Function()`, no dynamic code execution

---

## Commit Message Convention

Use descriptive commit messages with this format:

```
<type>: <short summary>

<optional body — explain what and why>
```

**Types:**
- `feat:` — New feature or functionality
- `fix:` — Bug fix
- `test:` — Test additions or fixes
- `docs:` — Documentation changes
- `refactor:` — Code restructuring without behavior change
- `chore:` — Build, tooling, or dependency changes

**Examples:**
```
feat: add mutation audit trail with JSONL logging
fix: reduce safeWriteSync complexity below ESLint threshold
test: add 67 regression tests covering Sprints 1-6
docs: update README with badges and technology stack
```

---

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards above.

3. **Run the full test suite** and ensure all tests pass:
   ```bash
   cd .github
   npm test
   ```

4. **Run ESLint** and fix any issues:
   ```bash
   npm run lint
   ```

5. **Check coverage** hasn't dropped below thresholds:
   ```bash
   npm run test:coverage
   ```

6. **Commit** with a descriptive message following the convention above.

7. **Push and open a PR** against `main`. Include:
   - What the change does and why
   - Link to any related GitHub issue
   - Confirmation that tests pass and lint is clean

### PR Review Checklist

- [ ] All tests pass (`npm test`)
- [ ] ESLint reports 0 errors (`npm run lint`)
- [ ] Coverage thresholds met (`npm run test:coverage`)
- [ ] No secrets or credentials in committed code
- [ ] Security headers maintained on new endpoints
- [ ] New user-facing strings added to `strings.js`
- [ ] New errors added to `utils/errors.js` catalog

---

## Webapp Development Cookbook

Common recipes for extending the web UI at `.github/webapp/`.

### Adding a New API Endpoint

1. Write your handler function in `server.js` following the existing pattern:
   ```js
   function apiGetMyThing(req, res) {
     // Use store.readFile() / store.writeFileSync() for I/O
     // Use json(res, 200, data) for responses
     // Use errorResponse(code, message) for errors
   }
   ```

2. Register the route in the `ROUTES` object:
   ```js
   const ROUTES = {
     // ... existing routes
     'GET /api/my-thing': apiGetMyThing,
   };
   ```
   The router matches `METHOD /path` strings. Method-not-allowed handling is automatic.

3. Add user-facing strings to `strings.js` if the response includes messages.

4. Add error codes to `utils/errors.js` if the endpoint can fail in new ways.

5. Write tests — use `InMemoryStore` (never real filesystem):
   ```js
   import { createTestServer } from './server.test-helpers.js';
   // Or follow the pattern in existing test files
   ```

### Adding a New Tab to the UI

The UI is a single-page app in `index.html`. Tabs are `<section>` elements shown/hidden with CSS.

1. Add a `<button>` to the tab bar (search for `tab-bar` in index.html):
   ```html
   <button class="tab-btn" data-tab="my-tab">My Tab</button>
   ```

2. Add the content section:
   ```html
   <section id="my-tab" class="tab-content" hidden>
     <!-- Your HTML here -->
   </section>
   ```

3. The existing tab-switching JS handles visibility automatically based on `data-tab` matching the section `id`.

4. Fetch data from your API endpoint in a `loadMyTab()` function and call it when the tab activates.

### Adding a New Model Parser

Model parsers live in `models.js`. They transform raw file content into structured data.

1. Export a new function from `models.js`:
   ```js
   function parseMyFormat(content) {
     // Parse the markdown/JSON content
     // Return structured data
   }
   ```

2. Write unit tests in a test file (follow the pattern in `models.test.js`).

3. Use the parser in your API handler via `store.readFile()` + `parseMyFormat()`.

### Adding Validation Schemas

JSON schemas live in `schemas.js`. Used by endpoints that accept POST bodies.

1. Add your schema to `schemas.js`:
   ```js
   const myThingSchema = { type: 'object', required: [...], properties: { ... } };
   ```

2. Validate in your handler:
   ```js
   const { valid, errors } = validateSchema(body, myThingSchema);
   if (!valid) return json(res, 400, errorResponse('VALIDATION_FAILED', errors));
   ```

### Key Patterns to Follow

| Pattern | Where | Why |
|---------|-------|-----|
| Use `store` abstraction | All file I/O | Enables `InMemoryStore` in tests |
| Use `safeWriteSync()` | All writes | Atomic writes with backup |
| Use `safePath()` | All user-provided paths | Prevents path traversal |
| Use `detectSecrets()` | All user input saved to disk | Prevents accidental credential storage |
| Use `setSecurityHeaders()` | All responses | CSP, X-Frame-Options, etc. |
| Use `strings.js` | All user-facing text | Externalized for maintainability |
| Use `utils/errors.js` | All error responses | Consistent error codes |

---

## Questions?

Open a [GitHub Issue](https://github.com/RobertAgterhuis/myAgentic-IT-Project-team/issues) for questions, bug reports, or feature requests.
