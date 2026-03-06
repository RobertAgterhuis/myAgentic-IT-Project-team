# Sweep 2 — Optimization & Gap Audit
> Generated 2026-03-06 — Second-pass audit after all Sweep 1 fixes were applied. Covers webapp, orchestrator, guardrails, contracts, playbooks, and skill files.

---

## Stats

| Area | Findings | Critical | High | Medium | Low |
|------|----------|----------|------|--------|-----|
| server.js | 13 | 0 | 1 | 5 | 7 |
| index.html | 22 | 0 | 3 | 10 | 9 |
| Orchestrator & Guardrails | 21 | 3 | 6 | 7 | 5 |
| Contracts & Playbooks | 24 | 2 | 6 | 10 | 6 |
| Skill Files | 16 | 2 | 3 | 7 | 4 |
| **Total** | **96** | **7** | **19** | **39** | **31** |

---

## Priority Order

### Critical (fix first)
| ID | Title | Area |
|----|-------|------|
| O2-001 | Agent-index missing 15 contracts | Orchestrator |
| O2-002 | TESTING → REVIEW state transition missing | Orchestrator |
| O2-003 | Phase 5 eligibility for PARTIAL/COMBO cycles undefined | Orchestrator |
| C2-001 | Agent-index contracts reference lists only 11 of 25 | Contracts |
| C2-002 | Onboarding session-state schema contradicts canonical contract | Contracts |
| SK-001 | Agent-handoff-contract referenced by zero skill files | Skills |
| SK-002 | Guardrail files 07-legal and 08-content never referenced | Skills |

### High (fix before next cycle)
| ID | Title | Area |
|----|-------|------|
| S2-001 | `$`-pattern injection in String.replace | server.js |
| O2-004 | No retry budget for Critic/Risk validation loop | Orchestrator |
| O2-005 | G-GLOB-16 vs ORC-33 conflict | Orchestrator |
| O2-006 | ORC-28/ORC-29 concurrent trigger priority undefined | Orchestrator |
| O2-007 | No concurrency protocol for HOTFIX + active sprint | Orchestrator |
| O2-008 | ORC-22 LESSON_CANDIDATE trigger table incomplete | Orchestrator |
| O2-009 | No corruption handling for web UI signal files | Orchestrator |
| C2-003 | Risk contract 6 categories defined, validation says "four" | Contracts |
| C2-004 | Story status vocabulary divergence across 3 contracts | Contracts |
| C2-005 | Agent handoff contract only accommodates Phase 1-4 | Contracts |
| C2-006 | ORC-35 referenced in 14 contracts without inline summary | Contracts |
| C2-007 | Session-state escalation type enum is subset of protocol types | Contracts |
| C2-008 | Playbooks list only 5 Phase 5 agents; should be 9 | Contracts |
| H2-001 | renderMarkdown allows raw HTML beyond stripped tags | index.html |
| H2-003 | AbortController signal never wired to fetch — timeout dead code | index.html |
| H2-004 | Tab bar lacks ARIA tab roles and keyboard navigation | index.html |
| H2-005 | Sidebar items not keyboard-accessible | index.html |
| SK-003 | Synthesis Agent missing HANDOFF CHECKLIST heading | Skills |
| SK-004 | Critic Agent doesn't load decisions.md | Skills |
| SK-005 | Newer agents (32-35) lack specific guardrail references | Skills |

---

## 1 — server.js

| ID | Sev | Cat | Title | Location |
|----|-----|-----|-------|----------|
| S2-001 | HIGH | Security | `$`-pattern injection in `String.prototype.replace` | `answerOpenQuestion`, `editDecidedRow`, `addOpenQuestion`, `addOperationalDecision` |
| S2-002 | MED | Security | Path traversal in `apiGetExport` — session-derived paths not validated | `apiGetExport` |
| S2-003 | MED | Robustness | Pipe characters in user input corrupt markdown table rows | All decision writer functions |
| S2-004 | MED | Robustness | No format validation on `body.id` in decision mutation actions | `apiPostDecision` switch cases |
| S2-005 | MED | NodeJS | No `unhandledRejection` / `uncaughtException` handlers | Top-level process |
| S2-006 | MED | Robustness | Error catch in router throws on headers-already-sent | `http.createServer` handler |
| S2-007 | LOW | Robustness | Decision `edit` action doesn't validate `priority` field | `apiPostDecision` `edit` case |
| S2-008 | LOW | API | Missing 405 Method Not Allowed for known routes | Router |
| S2-009 | LOW | Security | Missing `Cache-Control: no-store` on API responses | `json()` helper |
| S2-010 | LOW | Performance | `serveStatic` re-reads index.html from disk on every request | `serveStatic` |
| S2-011 | LOW | CodeQuality | Inconsistent Q-ID regex between `apiSave` and parser | `apiSave` vs `parseQuestionnaire` |
| S2-012 | LOW | NodeJS | Shutdown timer not `.unref()`'d — delays clean exit | `shutdown()` |
| S2-013 | LOW | Performance | `apiGetExport` unbounded response size | `apiGetExport` |

### S2-001 — `$`-pattern injection in `String.prototype.replace` (HIGH)
JavaScript's `String.prototype.replace(pattern, replacementString)` interprets `$` sequences: `$'` inserts text after the match, `` $` `` text before, `$&` the matched text. User-supplied fields (answer, text, notes, question, scope) are interpolated directly into replacement strings. Writing `$'` in an answer causes file corruption and content leakage.

**Fix:** Use a function as the second argument to `.replace()`:
```js
function literalReplace(str, search, replacement) {
  return str.replace(search, () => replacement);
}
```
Apply to: `answerOpenQuestion`, `editDecidedRow`, `addOpenQuestion`, `addOperationalDecision`, `moveToDecided`, `restoreOpenPlaceholderIfEmpty`, `insertDeferredRow`.

### S2-002 — Path traversal in `apiGetExport` (MEDIUM)
Phase output file paths from `session-state.json` are joined with `PROJECT_ROOT` via `path.join()` but not validated through `safePath()`. Manipulated session state → arbitrary file read.

**Fix:** Use `safePath()` for every path read from session state:
```js
let fp; try { fp = safePath(PROJECT_ROOT, val); } catch { continue; }
```

### S2-003 — Pipe characters corrupt markdown tables (MEDIUM)
All decision writer functions insert user text directly into `| ${text} |` rows. A literal `|` in input breaks the table structure and corrupts the parser on subsequent reads.

**Fix:** Escape pipes: `function escPipe(s) { return (s || '').replace(/\|/g, '\\|'); }` — apply to all table-row construction.

### S2-004 — No format validation on `body.id` (MEDIUM)
All mutation actions pass `body.id` unchecked. Any string (empty, long, newlines, control chars) feeds into regex and replacement logic.

**Fix:** Validate: `if (!/^DEC-[\w-]{1,30}$/.test(body.id)) return json(res, 400, { error: 'Invalid decision ID format' });`

### S2-005 — No `unhandledRejection` / `uncaughtException` handlers (MEDIUM)
Unhandled promise rejections terminate Node.js with no structured logging or graceful teardown.

**Fix:** Add handlers near the shutdown block:
```js
process.on('unhandledRejection', (reason) => { console.error('  Unhandled rejection:', reason); });
process.on('uncaughtException', (err) => { console.error('  Uncaught exception:', err); shutdown(); });
```

### S2-006 — Router error catch throws on headers-already-sent (MEDIUM)
If a handler partially writes a response then throws, the catch block calls `json()` → `res.writeHead()` again → `ERR_HTTP_HEADERS_SENT`.

**Fix:** Guard: `catch (err) { if (!res.headersSent) { json(res, err.status || 500, { error: err.message }); } else { res.end(); } }`

### S2-007 — Decision `edit` doesn't validate `priority` (LOW)
Accepts arbitrary priority strings, breaking the parser on subsequent reads.

**Fix:** `if (body.priority && !['HIGH','MEDIUM','LOW'].includes(body.priority)) return json(res, 400, { error: 'Invalid priority' });`

### S2-008 — Missing 405 Method Not Allowed (LOW)
`POST /api/questionnaires` returns 404 instead of 405. Violates HTTP semantics.

**Fix:** After route miss, check if path exists with a different method and return 405 with `Allow` header.

### S2-009 — Missing `Cache-Control: no-store` on API responses (LOW)
Browser/proxy caching of API responses serves stale data.

**Fix:** Add `res.setHeader('Cache-Control', 'no-store');` to `json()` helper.

### S2-010 — `serveStatic` reads disk on every request (LOW)
Every non-API GET triggers `fs.readFileSync` of `index.html`. File doesn't change at runtime.

**Fix:** Cache at startup: `let cachedHtml = fs.readFileSync(path.join(WEBAPP_DIR, 'index.html'));`

### S2-011 — Inconsistent Q-ID regex (LOW)
`apiSave` accepts only `Q-XX-XXX` (2+3 digits); parser accepts any digit count. IDs like `Q-1-01` would parse but never save.

**Fix:** Use a shared regex constant: `const Q_ID_RE = /^Q-\d{1,3}-\d{1,4}$/;`

### S2-012 — Shutdown timer not `.unref()`'d (LOW)
Keeps event loop alive ~5s after graceful shutdown completes.

**Fix:** `forceTimer.unref();`

### S2-013 — `apiGetExport` unbounded response size (LOW)
Reads all phase output files with no size cap. Large projects → multi-MB response.

**Fix:** Add cumulative size guard (10 MB max).

---

## 2 — index.html

| ID | Sev | Cat | Title | Location |
|----|-----|-----|-------|----------|
| H2-001 | HIGH | Security | `renderMarkdown` allows raw HTML beyond stripped tags | `renderMarkdown()` |
| H2-003 | HIGH | Robustness | AbortController signal never wired to `fetch` — timeout dead code | `load()` |
| H2-004 | HIGH | A11y | Tab bar lacks ARIA tab roles & keyboard navigation | `#tabBar` / `.tab` divs |
| H2-005 | HIGH | A11y | Sidebar items not keyboard-accessible | `.sb-item` divs |
| H2-002 | MED | Security | No Content-Security-Policy meta tag | `<head>` |
| H2-006 | MED | A11y | Help nav items not keyboard-accessible | `.help-nav-item` divs |
| H2-007 | MED | A11y | No skip-navigation link | `<body>` top |
| H2-008 | MED | A11y | Sidebar progress bars lack `role="progressbar"` | `.prog-bar` in `renderSidebar()` |
| H2-009 | MED | A11y | Warning badge text fails WCAG AA contrast | `.b-open`, `.b-deferred` colors |
| H2-010 | MED | A11y | Content panel changes not announced via `aria-live` | `#main`, `#decMain` |
| H2-011 | MED | Perf | Full `innerHTML` rebuild on every 3s poll cycle | `renderPipeline()`, `renderStats()` |
| H2-013 | MED | Robustness | No guard against concurrent overlapping `load()` calls | `load()` / `startPolling()` |
| H2-014 | MED | UX | No sidebar collapse / hamburger on narrow viewports | CSS `@media` |
| H2-021 | MED | Robustness | Stale object reference across `await` in `decideDecision` | `decideDecision()` |
| H2-012 | LOW | Perf | Decision text filter re-renders entire list per keystroke | `decFilterText` input handler |
| H2-015 | LOW | Robustness | Export ObjectURL revoked immediately — may race download | `btnExport` handler |
| H2-016 | LOW | CodeQuality | Dead variable `opts` (with signal) in `load()` | `load()` |
| H2-017 | LOW | CodeQuality | Magic strings for tab identifiers repeated ~15× | Throughout JS |
| H2-018 | LOW | CodeQuality | Deprecated `document.execCommand('copy')` | `copyClipboard()` |
| H2-019 | LOW | HTML | Missing `<noscript>` fallback | `<body>` |
| H2-020 | LOW | A11y | Multiple `<nav>`/`<main>` landmarks lack distinguishing `aria-label` | Panel markup |
| H2-022 | LOW | A11y | Toast `role="status"` + child `role="alert"` doubles announcements | `toast()` / `#toasts` |

### H2-001 — `renderMarkdown` allows raw HTML beyond stripped tags (HIGH)
The denylist sanitizer strips `<script>`, `<iframe>`, `<object>`, `<embed>`, and `on*` handlers. But raw HTML not on the denylist passes through to `innerHTML`: `<style>`, `<form>`, `<base>`, `<svg>` with nested script, and `<a href="javascript:...">` in raw HTML (only markdown-syntax links are sanitized). A malicious PR or compromised server response gives XSS.

**Fix:** Escape ALL raw HTML first (`esc()` the input), then apply markdown transformations that produce only controlled tags. Or use an allowlist-based approach that strips everything except known-safe markdown output tags.

### H2-003 — AbortController signal never wired to `fetch` (HIGH)
The H6 fix added `AbortController` + 15s timeout in `load()`, but the `signal` is stored in a dead `opts` variable never passed to `api()`. The `api()` function builds its own fetch options internally. Requests can still hang indefinitely.

**Fix:** Thread signal through `api()`: `async function api(method, url, body, signal)` → `{ method, headers, signal }`. Pass `ctrl.signal` in all `load()` calls.

### H2-004 — Tab bar lacks ARIA tab roles & keyboard nav (HIGH)
Tab bar uses `<div class="tab">` elements with click handlers but no `role="tablist"`, no `role="tab"`, no `aria-selected`, no `tabindex` management, and no arrow-key navigation. Screen readers and keyboard users cannot discover or operate tabs.

**Fix:** Add `role="tablist"` on container, `role="tab"` + `aria-selected` + `tabindex` on tabs, `role="tabpanel"` + `aria-labelledby` on panels, and arrow-key handler for Left/Right navigation.

### H2-005 — Sidebar items not keyboard-accessible (HIGH)
`.sb-item` divs have click handlers only. No `tabindex`, no `role`, no keyboard handler. Users cannot Tab into or activate them.

**Fix:** Add `tabindex="0"`, `role="option"`, and Enter/Space keydown handler. Use `role="listbox"` on container.

### H2-002 — No Content-Security-Policy meta tag (MEDIUM)
No CSP meta or header restricts inline script execution, form actions, or frame embedding. Zero defense-in-depth against XSS.

**Fix:** Add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'self';">` — blocks `<base>` hijacking, form phishing, and framing.

### H2-006 — Help nav items not keyboard-accessible (MEDIUM)
`.help-nav-item` divs have click listeners only. No `tabindex`, no role, no keyboard activation. Keyboard users trapped in close button.

**Fix:** Use `<button>` elements or add `tabindex="0"` + Enter/Space handler.

### H2-007 — No skip-navigation link (MEDIUM)
Header, tab bar, and sidebar require tabbing through 20+ elements. WCAG 2.4.1 requires a skip mechanism.

**Fix:** Add visually hidden skip-link as first child of `<body>`: `<a href="#main" class="sr-only" ...>Skip to main content</a>`.

### H2-008 — Sidebar progress bars lack ARIA (MEDIUM)
No `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Screen readers announce nothing.

**Fix:** Add `role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"`.

### H2-009 — Warning badge color contrast fails WCAG AA (MEDIUM)
`var(--warning)` (#f59e0b) on `var(--warning-light)` ≈ 2.1:1 ratio. WCAG AA requires 4.5:1.

**Fix:** Darken to `#b45309` (≈6:1 on light backgrounds).

### H2-010 — Dynamic content changes not announced (MEDIUM)
Panel content swaps via `innerHTML` are invisible to assistive technology. Only toasts have `aria-live`.

**Fix:** Add `aria-live="polite"` to main content panels, or use a dedicated status region for change announcements.

### H2-011 — Full innerHTML rebuild on every poll (MEDIUM)
Every 3s poll destroys and rebuilds DOM subtrees, causing layout recalculation and losing scroll/selection state.

**Fix:** Compare data before re-rendering. Use fine-grained DOM updates for changed fields only.

### H2-013 — Concurrent load() calls can interleave (MEDIUM)
No mutex flag. `saveAll()` calling `load()` while polling `load(true)` is in flight → mismatched data.

**Fix:** Add `let _loadInFlight = false;` guard in `load()`.

### H2-014 — No sidebar collapse on narrow viewports (MEDIUM)
Below 700px the sidebar shrinks but never hides. At 360px, main content gets ≈140px.

**Fix:** Add hamburger toggle, hide sidebar by default below 600px.

### H2-021 — Stale reference across await in decideDecision (MEDIUM)
Decision object captured before `confirmAction()` await. During dialog, polling replaces `decisions.open`. After dialog, reference may be garbage.

**Fix:** Re-lookup decision after save + `await load()`.

### H2-012 — Decision filter full re-render per keystroke (LOW)
`renderDecisions()` rebuilds entire card DOM on every `input` event.

**Fix:** Apply `debounce(renderDecisions, 200)`.

### H2-015 — Export ObjectURL revoked immediately (LOW)
`URL.revokeObjectURL` fires before download starts on some browsers.

**Fix:** `setTimeout(() => URL.revokeObjectURL(url), 10000);`

### H2-016 — Dead variable `opts` in load() (LOW)
`const opts = { signal: ctrl.signal };` declared but never used. Dead code from H6 fix.

**Fix:** Remove after wiring signal through to `api()` (H2-003 fix resolves this).

### H2-017 — Magic tab identifier strings (LOW)
`'commandcenter'`, `'questionnaires'`, `'decisions'` hardcoded ≈15× across JS.

**Fix:** Define constants: `const TAB = { CMD: 'commandcenter', QUEST: 'questionnaires', DEC: 'decisions' };`

### H2-018 — Deprecated `document.execCommand('copy')` (LOW)
Fallback path uses deprecated API. Primary Clipboard API path exists.

**Fix:** Acceptable as fallback today. Add deprecation comment.

### H2-019 — Missing `<noscript>` fallback (LOW)
JS disabled → blank page with frozen "Loading…".

**Fix:** Add `<noscript>` element explaining JS requirement.

### H2-020 — Multiple landmarks lack aria-label (LOW)
3+ `<nav>` and 3+ `<main>` elements without distinguishing labels. Screen readers list all as "navigation" or "main".

**Fix:** Add `aria-label` to each landmark.

### H2-022 — Toast double-announcement (LOW)
Container `role="status"` + child `role="alert"` causes screen readers to read toast messages twice.

**Fix:** Remove `role="alert"` from individual toasts; let container's `role="status"` handle it.

---

## 3 — Orchestrator & Guardrails

| ID | Sev | Cat | Title |
|----|-----|-----|-------|
| O2-001 | CRIT | CrossRef | Agent-index CONTRACTS REFERENCE missing 15 contracts |
| O2-002 | CRIT | MissingRule | TESTING → REVIEW transition missing from story state machine |
| O2-003 | CRIT | MissingRule | Phase 5 eligibility for PARTIAL / COMBO cycles undefined |
| O2-004 | HIGH | MissingRule | No retry budget for Critic/Risk validation loop |
| O2-005 | HIGH | Conflict | G-GLOB-16 "redo on input change" vs ORC-33 "never re-run completed agents" |
| O2-006 | HIGH | MissingRule | No priority ordering between ORC-28 and ORC-29 concurrent trigger files |
| O2-007 | HIGH | MissingRule | No concurrency protocol for HOTFIX + active regular sprint |
| O2-008 | HIGH | Completeness | ORC-22 LESSON_CANDIDATE trigger table incomplete (5 events missing) |
| O2-009 | HIGH | MissingRule | No corruption handling for web UI signal files (reevaluate-trigger, command-queue) |
| O2-010 | MED | Ambiguity | Step numbering collision in "On Phase 5 sprint start" (two step 6) |
| O2-011 | MED | MissingRule | No meta-validation of Critic/Risk Agent output thoroughness |
| O2-012 | MED | MissingRule | REEVALUATE state missing from session-state transition diagram |
| O2-013 | MED | MissingRule | No Definition of Ready for non-CODE stories |
| O2-014 | MED | MissingRule | No SCOPE CHANGE → FEATURE cycle interaction rule |
| O2-015 | MED | Completeness | pipeline-progress.json referenced in ORC-30 with no schema/contract |
| O2-016 | MED | MissingRule | No maximum sprint duration or early-termination mechanism |
| O2-017 | LOW | Scalability | command-queue.json holds one command — no audit history |
| O2-018 | LOW | Scalability | scope_change_history array unbounded |
| O2-019 | LOW | Ambiguity | G-GLOB-42 sprint capacity — no owner specified |
| O2-020 | LOW | Ambiguity | HOTFIX scope field empty-array semantics undocumented |
| O2-021 | LOW | Ambiguity | ORC-30 batching exceptions incomplete for end-of-sprint agents |

### O2-001 — Agent-index missing 15 contracts (CRITICAL)
`.github/docs/agent-index.md` CONTRACTS REFERENCE lists only 10 contracts. 15 contracts created in Sweep 1 (critic, risk, synthesis, onboarding, test, PR/review, reevaluate, scope-change, feature, brand-assets, storybook, kpi, documentation, github-integration, retrospective) are missing from the index. Agents looking up their contract via the index fail. ORC-35 falls back to HANDOFF CHECKLIST-only validation.

**Fix:** Add all 25 contracts to agent-index.md. Consider adding a guardrail requiring the index to stay in sync after contract creation.

### O2-002 — TESTING → REVIEW transition missing (CRITICAL)
State machine defines `TESTING → COMPLETED | TEST_FAILED`. But pipeline is: Test Agent → **PR/Review Agent** → merge. `TESTING → REVIEW` doesn't exist. Stories jump from TESTING to COMPLETED, skipping review state.

**Fix:** Add `TESTING → REVIEW` transition (when tests pass and PR review follows). Keep `TESTING → COMPLETED` only for edge cases without PR review. Resolve mapping ambiguity: CODE/INFRA Test APPROVED always → REVIEW.

### O2-003 — Phase 5 for PARTIAL/COMBO cycles (CRITICAL)
No rule enables or disables Sprint Gate / Phase 5 for partial cycles. `CREATE UX` without MARKETING could trigger UI stories but no `component-inventory.md` → ORC-18 blocks everything. `CREATE BUSINESS` produces only ANALYSIS stories — is Phase 5 meaningful?

**Fix:** Add **ORC-38** defining Phase 5 eligibility per scope configuration, manual component-inventory provision option, and analysis-only sprint handling.

### O2-004 — No Critic/Risk retry budget (HIGH)
ORC-35 has a 3-retry budget for contract validation. The Critic/Risk validation cycle has none. Agent → Critic FAIL → agent → Critic FAIL → infinite loop.

**Fix:** Max 3 Critic/Risk cycles per phase. After 3 failures: escalate with options ACCEPT_WITH_RISK, MANUAL, RETRY_SIMPLIFIED.

### O2-005 — G-GLOB-16 vs ORC-33 conflict (HIGH)
G-GLOB-16: "Redo every analysis step if input changed." ORC-33: "Never re-run completed agents." If a DECIDED item changes input for Phase 1 while Phase 2 runs, these rules conflict.

**Fix:** Add clause to G-GLOB-16: "Within a running cycle, applies to the active agent's own steps. For completed agents, input changes are handled via REEVALUATE. ORC-33 takes precedence within a running session."

### O2-006 — ORC-28/ORC-29 concurrent trigger priority (HIGH)
Both signal files checked simultaneously. If both PENDING: SCOPE CHANGE + REEVALUATE race condition. SCOPE CHANGE could invalidate REEVALUATE work.

**Fix:** Priority ordering: (1) SCOPE CHANGE, (2) REEVALUATE, (3) FEATURE, (4) other. Simultaneous REEVALUATE superseded by SCOPE CHANGE → set to CONSUMED with `SUPERSEDED_BY_SCOPE_CHANGE`.

### O2-007 — HOTFIX + active sprint concurrency (HIGH)
ORC-23 says "inform" running sprint about impact — vague. No rules for: sprint pause during HOTFIX, file overlap conflict protocol, PR merge priority, baseline changes invalidating test results.

**Fix:** Add ORC-23b: regular sprint NOT paused unless file overlap with IN_PROGRESS stories. On overlap: stories BLOCKED. After HOTFIX merge: re-run tests for all IN_PROGRESS stories. HOTFIX PRs always merge first.

### O2-008 — ORC-22 LESSON_CANDIDATE table incomplete (HIGH)
Missing 5 events: `AGENT_FAILURE` (ORC-37), `PERSISTENT_CONTRACT_FAILURE` (ORC-35), HOTFIX completion (ORC-23), `SCOPE_CHANGE_HOLD >5 stories` (ORC-27), `READY_OVERRIDE` (ORC-14).

**Fix:** Add all 5 events to ORC-22 table. Consolidate ORC-23's standalone LESSON_CANDIDATE mandate as a row reference.

### O2-009 — No corruption handling for signal files (HIGH)
ORC-09 handles `session-state.json` corruption. `reevaluate-trigger.json` and `command-queue.json` have no equivalent. Truncated JSON from crash → parse failure with no recovery.

**Fix:** Add to ORC-28/29: if signal file invalid JSON → log `SIGNAL_FILE_CORRUPTED`, delete, inform user. Do NOT block session.

### O2-010 — Step numbering collision (MEDIUM)
"On Phase 5 sprint start" has two step 6. Steps 6b through 9 should be renumbered.

### O2-011 — No Critic/Risk meta-validation (MEDIUM)
Critic that always returns PASSED with zero findings (rubber-stamping) goes undetected. No rule validates Critic/Risk output quality.

**Fix:** If Critic returns PASSED with zero findings despite open `UNCERTAIN:`/`INSUFFICIENT_DATA:` items, flag `CRITIC_REVIEW_SUSPICIOUS` and require explicit justification.

### O2-012 — REEVALUATE state transitions missing (MEDIUM)
Session-state defines `Every status → SCOPE_CHANGE` but not `Every status → REEVALUATE`. No transitions in/out defined for REEVALUATE status.

**Fix:** Add: `Every status → REEVALUATE` and `REEVALUATE → [previous status]`.

### O2-013 — No Definition of Ready for non-CODE stories (MEDIUM)
DoR check is "mandatory per CODE/INFRA story." DESIGN, CONTENT, ANALYSIS stories bypass DoR and can enter IN_PROGRESS without acceptance criteria, deliverable path, or owner.

**Fix:** Add lightweight DoR: acceptance criterion, deliverable path, owner. On failure: NOT_READY per ORC-14.

### O2-014 — SCOPE CHANGE → FEATURE interaction (MEDIUM)
ORC-27 pauses sprints in affected dimension. Feature backlogs in `Workitems/*/` are not mentioned. Feature sprints may continue on invalidated premises.

**Fix:** Add: scope change scanning includes feature backlogs. Feature sprints in affected dimension → SCOPE_CHANGE_HOLD. Feature Agent reassesses viability after reconciliation.

### O2-015 — pipeline-progress.json no schema (MEDIUM)
Referenced in ORC-30 step 3 with no schema. Sole data source for web UI progress visualization. Could drift from session-state.json.

**Fix:** Define schema in contract, or eliminate file and have web UI read from session-state.json directly.

### O2-016 — No sprint timeout (MEDIUM)
Sprint loop has no max duration or max test-fix cycles. Stuck story → infinite loop.

**Fix:** Max 5 test-fix cycles per story per sprint. After 5: BLOCKED. Orchestrator force-closes sprint if >50% stories BLOCKED.

### O2-017 — Command history loss (LOW)
`command-queue.json` is overwritten per command. No log of prior commands.

### O2-018 — Scope change history unbounded (LOW)
`scope_change_history` grows without limit. After 5+: context bloat, cross-reference complexity.

**Fix:** Warn at 5 scope changes, require confirmation at 10.

### O2-019 — Sprint capacity no owner (LOW)
G-GLOB-42 requires explicit capacity but no rule says who provides it or when.

**Fix:** Orchestrator prompts user at first Sprint Gate. Suggest based on velocity-log.json after 2+ sprints.

### O2-020 — HOTFIX scope empty-array semantics (LOW)
`scope: []` never documented as meaning "skip phase agents, run implementation pipeline only."

### O2-021 — ORC-30 end-of-sprint batching (LOW)
Post-merge agents (KPI, Documentation, GitHub Integration, Retrospective) require 4 CONTINUE turns. No batching exception.

**Fix:** Allow post-merge bookkeeping agents to batch in a single turn when each output is <100 lines and no BLOCKED handoff occurs.

---

## 4 — Contracts & Playbooks

| ID | Sev | Cat | Title |
|----|-----|-----|-------|
| C2-001 | CRIT | Completeness | Agent-index contracts reference lists only 11 of 25 |
| C2-002 | CRIT | Schema | Onboarding session-state schema uses wrong field names |
| C2-003 | HIGH | Consistency | Risk contract: 6 categories defined, validation says "four" |
| C2-004 | HIGH | Consistency | Story status vocabulary divergence across 3 contracts |
| C2-005 | HIGH | Completeness | Agent handoff contract only for Phase 1-4 deliverable structure |
| C2-006 | HIGH | DeadRef | ORC-35 referenced in 14 contracts without inline summary |
| C2-007 | HIGH | Schema | Session-state escalation type enum missing 5 of 10 protocol types |
| C2-008 | HIGH | Alignment | Playbooks list 5 Phase 5 agents; should be 9 |
| C2-009 | MED | Consistency | Critic severity scale (MAJOR/MINOR/INFO) differs from standard |
| C2-010 | MED | Consistency | Test verdict APPROVED/REJECTED vs implementation PASSED/FAILED |
| C2-011 | MED | Consistency | REEVALUATE scope: playbooks use phase numbers, contracts use disciplines |
| C2-012 | MED | Completeness | 13 contracts lack JSON export schema |
| C2-013 | MED | Consistency | Mode field in analysis contract only; 3 others expect mode_consistent |
| C2-014 | MED | DeadRef | Guardrail 09 exists but implementation contract references 00–08 only |
| C2-015 | MED | Completeness | decisions.md schema undefined but referenced in multiple places |
| C2-016 | MED | Completeness | Phase 5 agent outputs not tracked in session-state phase_outputs |
| C2-017 | LOW | Consistency | Validation criteria format divergence: REJECTION vs VALIDATION CRITERIA |
| C2-018 | LOW | DeadRef | "Step F2" dead reference in both playbooks |
| C2-019 | LOW | Alignment | Feature Request entry in agent-index misclassified |
| C2-020 | LOW | Consistency | REQUEUED status not in session-state canonical list |
| C2-021 | LOW | Consistency | Scope change SCOPE_CHANGE_HOLD missing SC-[N] suffix |
| C2-022 | LOW | Completeness | 4 core contracts don't specify output file paths |
| C2-023 | MED | Consistency | mode_consistent in handoff_checklist without metadata mode field |
| C2-024 | MED | Alignment | Audit playbook misleading "20 specialist agents" phrasing |

### C2-001 — Agent-index missing 14 contracts (CRITICAL)
CONTRACTS REFERENCE lists only 11 entries (10 actual contracts + 1 misclassified generated file). 14 contracts on disk are absent. Duplicates finding O2-001.

**Fix:** Add all 25 contracts to agent-index.md.

### C2-002 — Onboarding session-state schema wrong (CRITICAL)
Onboarding contract uses `projectName`, `projectType`, `currentPhase`, `completedPhases` (camelCase). Canonical session-state uses `github_project_name`, `cycle_type`, `current_phase`, `completed_phases` (snake_case) with entirely different semantics.

**Fix:** Replace onboarding contract's session-state section with reference to canonical schema plus list of minimum required fields.

### C2-003 — Risk contract category count (HIGH)
Defines 6 categories (TECHNICAL, BUSINESS, SECURITY, OPERATIONAL, LEGAL, COMPLIANCE) but validation says "four."

**Fix:** Update validation to say "six" and list all categories.

### C2-004 — Story status vocabulary divergence (HIGH)
Session-state has 12 canonical statuses. Sprint plan uses 7 (with 2 not canonical: REQUEUED, BACKLOG CASCADE). Scope change uses 3 different labels.

**Fix:** Add REQUEUED and BACKLOG CASCADE to canonical list. Align scope-change to use `SCOPE_CHANGE_HOLD SC-[N]` with suffix.

### C2-005 — Handoff contract Phase 1-4 only (HIGH)
Requires analysis/recommendations/sprintplan/guardrails deliverables. 21 of 38 agents have different output structures and cannot produce conformant handoffs.

**Fix:** Refactor to generic deliverables: `[{ "type": "string", "path": "string", "contract_ref": "string" }]`.

### C2-006 — ORC-35 unreferenced in 14 contracts (HIGH)
14 newer contracts say "The Orchestrator checks (per ORC-35):" without inline summary. Violates self-contained principle from C1 fix.

**Fix:** Add `### Cross-reference: ORC-35` block in each contract's validation section.

### C2-007 — Escalation type enum incomplete (HIGH)
Session-state lists 5 types. Escalation protocol defines 10. Missing: SPRINT_GATE, SCOPE_CHANGE_DECISION, AGENT_CONFLICT, SECURITY_DECISION, DESTRUCTIVE_GIT_OP.

**Fix:** Synchronize enum to all 10 types.

### C2-008 — Playbooks missing 4 Phase 5 agents (HIGH)
List: Implementation, Test, PR/Review, Critic, Risk. Missing: KPI, Documentation, GitHub Integration, Retrospective.

**Fix:** Add all 9 agents in correct sequence.

### C2-009 — Critic severity scale mismatch (MEDIUM)
Critic uses CRITICAL/MAJOR/MINOR/INFO. Everything else uses CRITICAL/HIGH/MEDIUM/LOW. No mapping documented.

**Fix:** Align to standard scale or add explicit mapping table.

### C2-010 — Verdict naming (MEDIUM)
Test: APPROVED/REJECTED. Implementation: PASSED/FAILED. Critic: APPROVED/FAILED. Three different conventions.

**Fix:** Standardize to APPROVED/FAILED with mapping note for Test REJECTED.

### C2-011 — REEVALUATE scope vocabulary (MEDIUM)
Playbooks use phase numbers (PHASE-1, DELTA-ONLY). Session-state uses discipline names (BUSINESS, TECH). No mapping.

**Fix:** Align playbooks to discipline names. Document DELTA-ONLY as modifier.

### C2-012 — 13 contracts lack JSON export schema (MEDIUM)
Handoff message requires `json_export` path but 13 contracts define no JSON format.

**Fix:** Add JSON schema or explicit "No standalone JSON export" statement per contract.

### C2-013 — mode_consistent without mode field (MEDIUM)
Recommendations, sprintplan, guardrails JSON handoff_checklist has `mode_consistent: true` but no `mode` field in schema.

**Fix:** Add `"mode": "CREATE | AUDIT"` to metadata of all three contracts.

### C2-014 — Guardrail 09 not referenced (MEDIUM)
Implementation contract and playbooks reference guardrails `00–08`. Guardrail 09 (questionnaire) exists.

**Fix:** Update references from `00–08` to `00–09`.

### C2-015 — decisions.md schema undefined (MEDIUM)
Referenced in copilot-instructions and session-state but format, status values, and validation criteria are undocumented.

**Fix:** Create decisions schema section in existing contract or new dedicated contract.

### C2-016 — Phase 5 outputs not tracked (MEDIUM)
`phase_outputs` tracks Phase 1-4 but no `phase-5` section for per-sprint agent outputs.

**Fix:** Add phase-5 section keyed by sprint ID.

### C2-017 — Validation criteria format divergence (LOW)
Old contracts: "REJECTION CRITERIA". New: "VALIDATION CRITERIA". Inconsistent.

### C2-018 — "Step F2" dead reference (LOW)
Both playbooks reference "Step F2" in sprint plan. No such step exists.

**Fix:** Replace with actual section name from sprintplan contract.

### C2-019 — Feature Request misclassified (LOW)
Agent-index lists generated file `Workitems/[FEATURENAME]/00-feature-request.md` instead of contract `feature-output-contract.md`.

### C2-020 — REQUEUED not canonical (LOW)
Sprint plan uses REQUEUED. Session-state canonical list omits it.

**Fix:** Add to canonical list with transition `SCOPE_CHANGE_HOLD → REQUEUED → QUEUED`.

### C2-021 — SCOPE_CHANGE_HOLD suffix mismatch (LOW)
Sprint plan: `SCOPE_CHANGE_HOLD SC-[N]`. Scope change contract: `SCOPE_CHANGE_HOLD` (no suffix).

### C2-022 — Core contracts missing output paths (LOW)
4 original contracts don't specify WHERE files are written. Newer contracts do.

### C2-023 — mode_consistent without mode (MEDIUM)
Same root cause as C2-013. `handoff_checklist.mode_consistent` has nothing to validate against.

### C2-024 — Misleading agent count phrasing (MEDIUM)
Audit playbook says "from all 20 specialist agents" but sprint plans are per-phase, not per-agent.

**Fix:** Change to "from all 4 phases (produced by the 20 specialist agents)."

---

## 5 — Skill Files

| ID | Sev | Cat | Title |
|----|-----|-----|-------|
| SK-001 | CRIT | Handoff | Agent-handoff-contract referenced by zero skill files |
| SK-002 | CRIT | Guardrails | Guardrail files 07-legal and 08-content never referenced by any skill |
| SK-003 | HIGH | Handoff | Synthesis Agent (17) missing HANDOFF CHECKLIST heading |
| SK-004 | HIGH | Instructions | Critic Agent (18) does not load decisions.md |
| SK-005 | HIGH | Guardrails | Newer agents (32-35) lack specific phase guardrail references |
| SK-006 | MED | Instructions | Phase 1-4 specialists have no scope change context instructions |
| SK-007 | MED | Overlap | Content Strategist (32) and Brand Strategist (14) both own voice & tone |
| SK-008 | MED | Chain | Feature Agent (24) Phase 5 handoff unclear |
| SK-009 | MED | Consistency | KPI Agent (29) BRAND category not in baseline schema enum |
| SK-010 | MED | Instructions | Scope Change Agent (37) MARKETING dimension omits Brand Assets + Storybook |
| SK-011 | MED | Consistency | Questionnaire Agent (36) trigger description ambiguous |
| SK-012 | MED | Chain | Brand Assets Agent (30) ignores Growth Marketer and CRO Specialist output |
| SK-013 | LOW | Consistency | Agent-index table uses execution order instead of numerical order |
| SK-014 | LOW | Handoff | Synthesis Agent uses "DEFINITION OF DONE" header instead of "HANDOFF CHECKLIST" |
| SK-015 | LOW | Instructions | Implementation Agent (20) guardrail paths use incorrect file names |
| SK-016 | LOW | Phase | Phase closure self-check naming not standardized ("Self-Review" vs "Self-Check") |

### SK-001 — Agent-handoff-contract referenced by zero skill files (CRITICAL)
The contract exists and is indexed but NO skill file references it. Agents produce handoff output guided only by individual skill files and the universal template. The contract is dead-letter with no enforcement pathway.

**Fix:** Add explicit reference to `agent-handoff-contract.md` in handoff checklist of every agent that hands off: all specialists (01-16, 32-35), Synthesis (17), Critic (18), Risk (19), and Phase 5 agents (20-29).

### SK-002 — Guardrail files 07-legal and 08-content unreferenced (CRITICAL)
`07-legal-guardrails.md` is not referenced by Legal Counsel (33). `08-content-guardrails.md` is not referenced by Content Strategist (32) or Localization Specialist (35). Rules in these files are unenforceable.

**Fix:** Add references to the appropriate agents' handoff checklists. Also add 07-legal to Security Architect (08) and Data Architect (09).

### SK-003 — Synthesis Agent missing HANDOFF CHECKLIST (HIGH)
Only agent without a `## HANDOFF CHECKLIST` section. Uses `## DEFINITION OF DONE (SYNTHESIS)` instead. Critic Agent validation would miss it.

**Fix:** Rename to `## HANDOFF CHECKLIST — Synthesis Agent — [Date]`.

### SK-004 — Critic Agent doesn't load decisions.md (HIGH)
Critic validates phase output but doesn't check against DECIDED items. Output contradicting a decision passes Critic unchallenged.

**Fix:** Add Step 0: load `decisions.md`, verify no recommendation contradicts a DECIDED item.

### SK-005 — Newer agents lack guardrail references (HIGH)
Agents 32-35 reference only generic `/.github/docs/guardrails/`. Original agents cite specific files with rule IDs.

| Agent | Expected guardrail |
|-------|-------------------|
| 34-Product Manager | 01-business-guardrails |
| 33-Legal Counsel | 07-legal-guardrails |
| 32-Content Strategist | 08-content-guardrails |
| 35-Localization Specialist | 08-content-guardrails |

**Fix:** Add specific guardrail file references with applicable rule IDs.

### SK-006 — No scope change context in Phase 1-4 agents (MEDIUM)
Post-phase utility agents (28-31, 36) have `## SCOPE CHANGE context` sections. Phase 1-4 specialists (01-16, 32-35) do not. They rely entirely on Orchestrator injection. If injection fails, no fallback.

**Fix:** Add brief scope change awareness to Step 0 of each Phase 1-4 agent.

### SK-007 — Voice & tone ownership overlap (MEDIUM)
Content Strategist (32, Phase 3) and Brand Strategist (14, Phase 4) both define voice & tone. No deconfliction protocol.

**Fix:** Add to Brand Strategist: load Content Strategist output if available, align or override with rationale.

### SK-008 — Feature Agent Phase 5 handoff unclear (MEDIUM)
Skill file lists agents through Synthesis but doesn't mention Phase 5 agents or handoff to Orchestrator for sprint execution.

**Fix:** Add Step 5: hand off feature sprint plan to Orchestrator for Phase 5 execution.

### SK-009 — KPI Agent BRAND category missing (MEDIUM)
Step 0 category enum omits BRAND. Step 2 measurement table includes BRAND row. Brand KPIs can't be formally tracked.

**Fix:** Add `BRAND` to category enum.

### SK-010 — Scope Change MARKETING dimension incomplete (MEDIUM)
Lists Brand Strategist → Growth Marketer → CRO Specialist → Critic + Risk. Omits Brand Assets Agent and Storybook Agent re-activation.

**Fix:** Add Brand Assets + Storybook to MARKETING dimension activation list.

### SK-011 — Questionnaire Agent trigger ambiguity (MEDIUM)
Says "Called by any phase agent" (implies direct invocation) then "Called from within the Orchestrator's phase completion handler" (correct mechanism).

**Fix:** Rewrite: "Activated by the Orchestrator after Critic + Risk validation passes."

### SK-012 — Brand Assets Agent ignores Growth/CRO output (MEDIUM)
Mandatory input only references Brand Strategist. Growth Marketer channel strategy and CRO conversion design not considered for marketing asset generation.

**Fix:** Add Growth Marketer and CRO Specialist output as optional input.

### SK-015 — Implementation Agent wrong guardrail paths (LOW)
References `00-global.md`, `02-architecture.md`, `03-security.md`. Actual filenames: `00-global-guardrails.md`, `02-architecture-guardrails.md`, `03-security-guardrails.md`.

**Fix:** Update paths to match canonical names from agent-index.

### SK-013 — Agent-index execution order vs numerical (LOW)
Table ordered by phase execution. Agent 32 appears at position ~17. Hard to find by number.

### SK-014 — Synthesis "DEFINITION OF DONE" heading (LOW)
Duplicate of SK-003. Rename to standard heading.

### SK-016 — Self-Check vs Self-Review naming (LOW)
CRO Specialist (16) uses "Self-Review". All others use "Self-Check".

**Fix:** Rename to "Self-Check" for consistency.

---

## Deduplicated Cross-Area Findings

The following findings appear in multiple audit areas and should be fixed once:

| Finding | Appears in | Fix once at |
|---------|-----------|-------------|
| Agent-index missing 14-15 contracts | O2-001, C2-001 | agent-index.md |
| Synthesis Agent heading DEFINITION OF DONE | SK-003, SK-014 | 17-synthesis-agent.md |
| Guardrails 07/08 unreferenced | SK-002, SK-005, C2-014 | Skill files 32-35 + implementation contract |
| REQUEUED not in canonical statuses | C2-004, C2-020 | session-state-contract.md |
| SCOPE_CHANGE_HOLD suffix mismatch | C2-004, C2-021 | scope-change-output-contract.md |
| Phase 5 agent list incomplete | C2-008, SK-008 | Both playbooks |

**Unique findings after deduplication: 88**
