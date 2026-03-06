# Sweep — Gaps & Optimizations

> Generated 2026-03-06 — Full system audit across webapp, orchestrator, contracts, guardrails, and playbooks.

---

## Severity Key

| Label | Meaning |
|-------|---------|
| **CRITICAL** | System-blocking — will cause data loss, crashes, or prevent autonomous execution |
| **HIGH** | Major gap — breaks key workflows or leaves important behavior undefined |
| **MEDIUM** | Ambiguity or missing defence — works today but fragile or unclear |
| **LOW** | Polish / clarity — nice to have, no operational risk |

---

## 1 — Webapp: server.js

### CRITICAL

| # | Issue | Detail |
|---|-------|--------|
| S1 | **Read-modify-write race condition on decisions** | `apiPostDecision()` reads file → modifies → writes back. Two concurrent requests lose the first write. Same issue in `apiSave()` for questionnaires. Fix: file-level locking or atomic write-with-lock. |
| S2 | **Uncaught exceptions in `walk()` / `discoverQuestionnaires()`** | `fs.readdirSync()` inside recursive `walk()` has no try/catch. Permission-denied or deleted directory crashes the request handler and potentially the process. |
| S3 | **JSON.parse without try/catch on file reads** | `apiGetSession()`, `apiGetDecisions()`, `apiPostCommand()` all parse JSON from disk without error boundary. Corrupted or truncated JSON crashes the handler. |

### HIGH

| # | Issue | Detail |
|---|-------|--------|
| S4 | **Path-traversal edge case on Windows** | `safePath()` uses `resolved.startsWith(absBase + path.sep)`. Mixed separators on Windows could bypass the check. Use `path.relative()` and verify result doesn't start with `..`. |
| S5 | **TOCTOU in `rebuildQuestionnaireIndex()`** | Files discovered by `walk()`, then read in a loop. If a file is deleted between discovery and read, synchronous `readFileSync` throws uncaught. |
| S6 | **Duplicate file reads in questionnaire discovery** | `discoverQuestionnaires()` walks and filters files, then `rebuildQuestionnaireIndex()` reads every file again — 2× disk I/O for large sets. |
| S7 | **No request timeout** | No `server.setTimeout()` or `req.setTimeout()`. A slow-loris connection holds a slot forever. |
| S8 | **No request logging / audit trail** | Only `console.log` at startup. No structured request or error logging. Cannot audit who changed decisions or questionnaires. |
| S9 | **Pipe character in markdown table breaks answer-status regex** | Regex for answer status table doesn't handle `|` inside cell content — answer data is silently lost. |

### MEDIUM

| # | Issue | Detail |
|---|-------|--------|
| S10 | **No Content-Type validation on POST** | JSON.parse runs on any body regardless of `Content-Type` header. |
| S11 | **No authentication / authorization** | Server accepts requests from any localhost client. Shared dev environments are exposed. |
| S12 | **No graceful shutdown (SIGTERM/SIGINT)** | In-flight writes interrupted on kill → partial JSON on disk. |
| S13 | **No rate limiting** | `/api/reevaluate` and `/api/save` can be spammed without limit. |
| S14 | **No health-check endpoint** | No `GET /health` for process-alive verification. |
| S15 | **`safeWriteSync()` doesn't create parent directories** | First write to a new path silently fails if parent dir missing. |
| S16 | **CSP allows `'unsafe-inline'` for `script-src` and `style-src`** | Defeats inline-script protection. Should use nonce-based CSP or external scripts. |

---

## 2 — Webapp: index.html

### CRITICAL

| # | Issue | Detail |
|---|-------|--------|
| H1 | **XSS in help/markdown rendering** | `renderMarkdown()` outputs to `innerHTML` without sanitization. Decision text or help content with `<img onerror="…">` executes JS. Fix: add DOMPurify or comparable sanitiser. |
| H2 | **Event listener accumulation (memory leak)** | `addEventListener()` on `#main` is called inside `renderQ()` on every re-render. After N polls, N duplicate listeners exist. Move binding outside the render loop or use `{ once: true }` / `removeEventListener`. |

### HIGH

| # | Issue | Detail |
|---|-------|--------|
| H3 | **No double-click guard on Save / API buttons** | Buttons are never disabled during in-flight requests. Double-click sends two identical mutations. |
| H4 | **Unsaved changes discarded on tab switch** | Switching tabs rebuilds the panel. Dirty questionnaire edits are silently lost. Add a confirmation prompt or auto-save. |
| H5 | **Null pointer in `renderPipeline()`** | `progress` can be null, but `p.active`, `p.phases`, `p.session` accessed without guards. |
| H6 | **`Promise.all` without timeout / abort** | If one API hangs, all three block the UI forever. Add `AbortController` with timeout. |
| H7 | **Hash comparison uses `JSON.stringify` (order-sensitive)** | Object key order can differ between poll cycles → false "change" re-renders. Use server-side ETag instead. |
| H8 | **Silent polling failure** | When `load(silent=true)` catches an error, the user sees nothing. After 5 consecutive silent failures, show a connectivity warning. |
| H9 | **No focus indicator on interactive elements** | CSS removes `outline` on `:focus` without a visible replacement. Keyboard users cannot see focus position. |
| H10 | **Icon-only buttons (theme, export) lack `aria-label`** | Screen readers announce "button" with no context. |
| H11 | **Color-only status indicators** | Question badges (REQUIRED, OPTIONAL, OPEN, ANSWERED) differ only by colour — inaccessible to colour-blind users. Add text label or icon. |
| H12 | **Modal doesn't trap focus or block body scroll** | Background scrolls behind modal on small screens; Tab escapes the modal. |

### MEDIUM

| # | Issue | Detail |
|---|-------|--------|
| H13 | **Full DOM re-render on every poll** | `renderSidebar()`, `renderQ()`, `renderDecisions()` regenerate entire HTML on each poll cycle. For 100+ questions this causes jank. Use incremental DOM diffing or virtual list. |
| H14 | **No debounce on answer textarea input** | `markDirty()` fires on every keystroke. |
| H15 | **No offline / error recovery** | If API is unreachable, page shows stale data with no indicator. Consider caching last-known state in `localStorage`. |
| H16 | **No unsaved-changes persistence** | Browser crash loses all dirty edits. Auto-save to `localStorage` every 30 s. |
| H17 | **Tab state / active file not persisted across refresh** | F5 resets to first tab and first file. Store in `sessionStorage`. |
| H18 | **Decision priority badge colours fail WCAG AA contrast** | `.b-high` red-on-white is ≈ 3.5 : 1 (needs 4.5 : 1). |
| H19 | **Webkit-only scrollbar styling** | No Firefox fallback. |
| H20 | **`escAttr()` doesn't escape newlines/tabs** | Could allow attribute-breakout in edge cases. |

---

## 3 — Orchestrator & Agent System

### CRITICAL

| # | Issue | Detail |
|---|-------|--------|
| O1 | **No rule for non-compliant agent output** | If an agent hands off output that violates its contract, the Orchestrator has no formal validation rule, no retry limit, and no escalation path. Add **ORC-35** (Agent Output Contract Validation). |
| O2 | **No recovery for corrupted `session-state.json`** | ORC-09 and ORC-33 assume valid JSON. A truncated file after a crash leaves the system stuck. Add a corruption-detection + archive-and-reset branch. |
| O3 | **Session-state schema missing `scope` field** | PARTIAL, COMBO, and FEATURE cycles need a `scope` field to distinguish discipline selection. Without it, CONTINUE cannot determine which agents to activate. |
| O4 | **Inconsistent story-status values across contracts** | Sprint-plan uses `QUEUED | IN_PROGRESS | COMPLETED | BACKLOG`. Implementation uses `IMPLEMENTED | PARTIAL | BLOCKED`. No mapping defined → status is lost between agents. Define a unified state machine. |

### HIGH

| # | Issue | Detail |
|---|-------|--------|
| O5 | **15 agents have no output contract** | Critic (18), Risk (19), Synthesis (17), Onboarding (25), Test (21), PR/Review (22), Reevaluate (23), Scope-Change (37), Feature (24), Brand-Assets (30), Storybook (31), KPI (29), Documentation (26), GitHub-Integration (27), Retrospective (28). These agents cannot self-validate and the Orchestrator cannot assess compliance. |
| O6 | **No predecessor-output validation at phase boundary** | When Phase N+1 starts, nobody checks that Phase N output files actually exist on disk. A deleted file during CONTINUE causes silent failure. |
| O7 | **Ambiguous `story_type` ownership (ORC-05)** | "Return to the relevant phase agent" — but which agent owns `story_type` correction? Clarify: Product Manager (34) owns it across all phases. |
| O8 | **Undefined behaviour after 2× NOT_READY moves (ORC-14)** | After escalation, no resolution options are given (remove from backlog? split? override?). |
| O9 | **`cycle_type` values unclear for PARTIAL/FEATURE** | Contract lists `FULL_CREATE`, but CLI command is just `CREATE`. No canonical mapping for `PARTIAL_CREATE`, `COMBO_CREATE`, `FEATURE`. |
| O10 | **No processing pipeline for non-CODE stories** | Sprint-plan allows `DESIGN`, `CONTENT`, `ANALYSIS` story types, but `implementation-output-contract.md` only covers `CODE` and `INFRA`. No agent, test, or DoD exists for the other types. |
| O11 | **Critic & Risk validation criteria undefined** | Phases are blocked until Critic + Risk "APPROVED", but no contract defines what APPROVED means, what is checked, or what output format is produced. |
| O12 | **Synthesis Agent output structure undefined** | Definition of Done requires 7 components (Executive Summary, Solution Blueprint Heatmap, Risk Matrix, Roadmap, Guardrails, KPIs, Open Items) but no contract defines their structure. |

### MEDIUM

| # | Issue | Detail |
|---|-------|--------|
| O13 | **Questionnaire context refresh between sequential phases** | ORC-25 specifies re-injection on REEVALUATE but not when Phase 1 → Phase 2 boundary is crossed and Phase 1 questionnaire answers have been filled in the meantime. |
| O14 | **HOTFIX criticality thresholds undefined (ORC-23)** | No heuristics for what qualifies as "truly critical". Could be abused or arbitrarily rejected. |
| O15 | **"10% code changes" metric not quantified (ORC-24)** | Files? Lines? Which directories count? Threshold needs a formula. |
| O16 | **"Immediately adjacent regression" scope undefined (ORC-23)** | Test scope for HOTFIX is vague — define 1-layer-deep imports. |
| O17 | **Cross-track dependency removal undefined (ORC-04)** | "Remove the dependency" could mean delete link (risky) or defer story (safe). Needs decision tree. |
| O18 | **Missing predecessor-output error handling in handoff contract** | Agent Handoff Contract Step 1 doesn't specify what to do if a predecessor file is missing or corrupted. |
| O19 | **Phase-agent persistent failure not covered** | Test Agent has `PERSISTENT_FAILURE` handling after 3 retries. Phase agents have no equivalent — could loop forever. |
| O20 | **`SCOPE_EXTENSION` not in escalation types** | Implementation contract references `SCOPE_EXTENSION: [reason]` but the Human Escalation Protocol doesn't list it as a type. |
| O21 | **Agent-conflict resolution protocol incomplete** | `AGENT_CONFLICT` escalation type is defined but resolution options (choose A, choose B, hybrid, defer) and documentation path are missing. |
| O22 | **Tool requirements not project-type-specific** | Tooling contract says "project-specific" for test runner, linter, build tool but never defines where the project declares its requirements. |
| O23 | **Step 0 (questionnaire context) never formally defined** | Analysis contract checklist references "Step 0" but no contract defines what it is or when it runs. |
| O24 | **`INSUFFICIENT_DATA` propagation rules missing** | No guidance on whether downstream agents proceed with upstream `INSUFFICIENT_DATA` items, mark output `PROVISIONAL`, or block. |

### LOW

| # | Issue | Detail |
|---|-------|--------|
| O25 | **Onboarding BLOCKED escalation routing unclear (ORC-08)** | Who resolves `ONBOARDING_BLOCKED` — Onboarding Agent re-run or user escalation? |
| O26 | **Brand guidelines "sections 1–6" not defined in DoD** | Definition of Done references these sections but they're only in the Brand-Assets Agent skill file — not cross-referenced. |
| O27 | **Synthesis inconsistency handling not explicit** | If Phase 1 says "B2B" and Phase 4 says "B2C", Synthesis Agent has no mandated resolution step. |
| O28 | **Multiple open escalations UX is serial** | 5 HALT + PAUSE escalations presented one-at-a-time. Allow batching (max 2 per message). |

---

## 4 — Contracts & Playbook

### CRITICAL

| # | Issue | Detail |
|---|-------|--------|
| C1 | **Contracts reference undefined ORC rules** | `questionnaire-output-contract.md` cites ORC-25 as validation authority; `session-state-contract.md` cites ORC-28 and ORC-29. All three rules exist in the orchestrator skill file but are not formally extracted as standalone definitions in `/docs/`. Contracts should be self-contained or link explicitly. |

### HIGH

| # | Issue | Detail |
|---|-------|--------|
| C2 | **Questionnaire answer-flow timing undefined** | When answers arrive between phases, the injection pathway (automatic at phase boundary vs. only on REEVALUATE) is not documented. |
| C3 | **Scope-Change Agent has no output contract** | Playbook describes full workflow (backlog hold → invalidation → re-analysis → sprint-gate reconciliation) but no contract defines the `scope-change-[N].md` structure or status transitions. |

### MEDIUM

| # | Issue | Detail |
|---|-------|--------|
| C4 | **Multiple-escalation batching not defined** | Human Escalation Protocol says one-at-a-time but doesn't handle > 5 outstanding escalations efficiently. |
| C5 | **Tooling contract Category D "optional" is misleading** | Questionnaire web UI listed as optional, but without it questionnaire management has no alternative interface. |

---

## 5 — Quick Wins (can implement right now)

| # | What | Effort |
|---|------|--------|
| QW1 | Add `try/catch` around every `JSON.parse(fs.readFileSync(...))` in server.js | Small |
| QW2 | Wrap `walk()` iterations in try/catch | Small |
| QW3 | Add `server.setTimeout(30000)` and `req.setTimeout(10000)` | Small |
| QW4 | Add `GET /health` endpoint returning `{ status: 'ok' }` | Small |
| QW5 | Add DOMPurify CDN or inline sanitiser before every `innerHTML` write in index.html | Small |
| QW6 | Move `#main` event listener binding outside `renderQ()` (bind once on init) | Small |
| QW7 | Disable Save button during in-flight API call | Small |
| QW8 | Add `aria-label` to icon-only buttons (theme, export) | Small |
| QW9 | Add unsaved-changes confirmation on tab switch | Small |
| QW10 | Add `{ "current_step": "string|null" }` documentation to session-state-contract FAQ | Small |

---

## 6 — Recommended Priority Order

1. **Security first** — S1 (race condition), H1 (XSS), S4 (path traversal), S3 (JSON.parse crash)
2. **Crash prevention** — S2 (walk crash), S5 (TOCTOU), H2 (listener leak), H5 (null pointer)
3. **Agent system completeness** — O5 (15 missing contracts), O1 (no validation rule), O4 (story status mapping)
4. **Phase 5 unblocking** — O10 (non-code stories), O11 (critic/risk criteria), O12 (synthesis contract)
5. **Session resilience** — O2 (corrupted state), O3 (scope field), O6 (predecessor validation)
6. **UX & accessibility** — H9–H12, H3, H4
7. **Operational hardening** — S7–S8, S12–S14
8. **Polish** — remaining MEDIUM and LOW items
