# Analysis – UX Researcher – 2026-03-07

## Metadata
- Agent: UX Researcher (10)
- Phase: 3 – Experience Design
- Input received from: Phase 2 Critic + Risk validation (APPROVED)
- Date: 2026-03-07
- Software under analysis: Agentic System — Command Center (webapp)
- Mode: AUDIT

---

## Step 0: Questionnaire Input Check

**Status:** NOT_INJECTED — No `## QUESTIONNAIRE INPUT — UX Researcher` block present. Proceeding normally. Questionnaires may be generated after Phase 3 Critic + Risk validation.

---

## 1. Current State (AUDIT mode)

### 1.1 Research Data Inventory

- **Usability tests:** ABSENT — No usability test recordings, task completion logs, or results found in repository.
  - Source: file search across `.github/docs/`, `Documentation/`, `BusinessDocs/` — no files matching `usability`, `test-results`, `ux-test`, `task-completion`.
  - Impact: All user behavior claims are based on heuristic evaluation, NOT empirical data.

- **Analytics data:** ABSENT — No analytics integration (Google Analytics, Plausible, Matomo, or custom events) found in `index.html` or `server.js`.
  - Source: `.github/webapp/index.html` — no `<script>` tags referencing analytics; `server.js` — no analytics middleware.
  - Impact: No quantitative data on pageviews, flows, drop-offs, funnels, or session duration. All flow analysis is heuristic.

- **Session recordings:** ABSENT — No session recording tools (Hotjar, FullStory, LogRocket) integrated.
  - Source: `.github/webapp/index.html` — no third-party recording scripts.

- **User interviews/surveys:** ABSENT — No interview transcripts, survey data, or NPS/CSAT scores in repository.
  - Source: `BusinessDocs/` directory — empty (first audit cycle); `Documentation/` — contains only technical README.

- **Support tickets:** ABSENT — No issue tracker or support ticket integration.
  - Source: No `.github/ISSUE_TEMPLATE/`, no support link in UI.

- **NPS/CSAT data:** ABSENT — No satisfaction measurement mechanism.

**Summary:** `INSUFFICIENT_DATA:` for ALL empirical user research. The entire UX analysis is based on **heuristic evaluation** of the codebase. This is clearly labeled throughout.

### 1.2 Application Overview — User-Facing Interface

The webapp is a single-page application (SPA) served from `.github/webapp/index.html` (~2,200+ lines) with embedded CSS and JavaScript. It communicates with a local Node.js HTTP server (`server.js`) via JSON REST APIs.

**Primary interface structure:**
- Source: `.github/webapp/index.html:691-694` — 3 tabs defined in tablist
- Tab 1: **Command Center** — Pipeline visualization, command launcher sidebar, session status
- Tab 2: **Questionnaires** — Sidebar navigation by phase/agent, card-based Q&A, progress tracking
- Tab 3: **Decisions** — Filter bar, card-based decisions with status management (OPEN/DECIDED/DEFERRED/EXPIRED)

**Supporting UI elements:**
- Header: Logo, title, subtitle, stats bar, action buttons (Save All, New Decision, Reevaluate, Help, Export, Theme toggle)
- Help panel: Slide-out panel with navigation and markdown content rendering
- Modals: Reevaluate, New Decision, Edit Decision, Confirmation dialog
- Toast notifications: Success/error/info feedback
- Theme: Light/dark mode with CSS custom properties (~60+ variables), `prefers-color-scheme` support
- Source: `.github/webapp/index.html:11-65` (CSS variables for both themes)

### 1.3 User Persona Validation (AUDIT mode)

The application targets a specific user type identifiable from the UI and documentation:

**Primary User: Technical Project Lead / Product Owner**
- Source: `.github/copilot-instructions.md` — system designed for multi-agent software creation/audit
- Evidence from UI: Command Center offers CREATE/AUDIT commands requiring project management knowledge; Questionnaire tab expects domain-specific answers about business, tech, UX, and marketing decisions; Decisions tab requires strategic prioritization (HIGH/MEDIUM/LOW).
- Technical proficiency: HIGH — User must understand software development phases, sprint planning, WCAG compliance, and be comfortable with a CLI-adjacent workflow (paste commands into Copilot Chat).
- Usage context: Local development environment (localhost:3000), VS Code + GitHub Copilot workflow.

**Secondary User: Domain Stakeholder / Business Analyst**
- Evidence: Questionnaires cover business requirements, financial models, legal compliance — questions that may be delegated to non-technical stakeholders.
- However: The UI assumes technical familiarity (sprint terminology, phase numbering, agent names). No onboarding flow or guided tour exists for non-technical users.

**Validation against Phase 1 ICP:** Phase 1 not in scope for this COMBO_AUDIT (TECH + UX). No ICP document available. User persona is derived from observable UI and documentation only. `INSUFFICIENT_DATA:` for market-validated persona.

### 1.4 Theme System & Visual Foundation

- **Design tokens:** Comprehensive CSS custom properties covering colors, typography, spacing, shadows, radii.
  - Source: `.github/webapp/index.html:11-65` — 60+ CSS variables for light theme, mirrored for dark theme
- **Design system:** No formal design system (no Figma, no Storybook, no component library).
  - `CRITICAL_GAP: Design System missing` per G-UX-01
- **Typography:** System font stack (`Inter`, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)
  - Source: `.github/webapp/index.html:78` — body font-family
  - Monospace: `SF Mono`, `Cascadia Code`, `Consolas` — used for IDs and code blocks

---

## 2. Gaps

### 2.1 No Formal Design System (GAP-UXR-001)
- Description: No Figma file, Storybook instance, or component library exists. CSS classes are ad-hoc (`.card`, `.btn`, `.badge`) with no documented design tokens or component API.
- Source: File search for `figma`, `storybook`, `design-system` — no results. `.github/docs/brand/` directory not populated.
- Risk if unresolved: UI inconsistency as features grow; onboarding new contributors is slow; accessibility regressions likely without systematic component testing.
- Priority: Critical (per G-UX-01)

### 2.2 No User Research Data (GAP-UXR-002)
- Description: Zero empirical user research artifacts exist — no usability tests, analytics, session recordings, surveys, or support tickets.
- Source: Repository-wide search across all directories — no research data files.
- Risk if unresolved: All UX decisions are based on assumptions; no baseline for measuring improvement; cannot validate whether the interface actually serves user needs.
- Priority: High

### 2.3 No Onboarding Flow for New Users (GAP-UXR-003)
- Description: The application has no guided first-run experience. Users see the Command Center with a static "Select a command" message. No tooltips, tutorial, or contextual help explain what commands do or how the workflow operates.
- Source: `.github/webapp/index.html:809-814` — `cmdWelcome` div shows static text only.
- Risk if unresolved: High cognitive load for first-time users; users may not understand the multi-step Copilot Chat workflow (paste command → wait for agents → check pipeline → answer questionnaires).
- Priority: High

### 2.4 No Error Recovery Guidance (GAP-UXR-004)
- Description: When API calls fail, toast notifications show raw error messages (`'Error: ' + e.message`). No recovery path or retry mechanism is offered to the user.
- Source: `.github/webapp/index.html:1035-1040` — error handling in `load()` function; similar pattern in `saveOne()`, decision actions.
- Risk if unresolved: Users encounter dead ends when the server is down or an operation fails; frustration and abandonment.
- Priority: Medium

### 2.5 Emoji Icons Without Text Fallbacks (GAP-UXR-005)
- Description: Navigation and buttons use emoji-only labels (e.g., `&#128190;` for save, `&#128260;` for reevaluate). These render inconsistently across platforms and are opaque to screen readers when not accompanied by text labels.
- Source: `.github/webapp/index.html:681-686` — header action buttons use emoji + short text, but some contexts use emoji only (e.g., pipeline icons at L1651, tab icons at L692-694).
- Risk if unresolved: Accessibility barrier (screen readers announce Unicode code points); visual inconsistency across OS/browser combinations.
- Priority: Medium

### 2.6 No Keyboard Shortcut Documentation (GAP-UXR-006)
- Description: While focus indicators and keyboard navigation exist (tab focus, Escape to close modals, arrow keys for tabs), no keyboard shortcut documentation or help is provided.
- Source: `.github/webapp/index.html:658-663` — focus-visible styles defined; no `keydown` handler for keyboard shortcuts beyond Tab/Escape/Arrow.
- Risk if unresolved: Power users cannot discover efficiency shortcuts; accessibility expectation gap.
- Priority: Low

### 2.7 No Undo/Redo for Questionnaire Answers (GAP-UXR-007)
- Description: Once a questionnaire answer is saved via the Save button, there is no undo mechanism. The "dirty" tracking only works pre-save.
- Source: `.github/webapp/index.html:1552-1575` — `saveOne()` persists immediately to server; no undo stack.
- Risk if unresolved: Data loss if user accidentally saves wrong content; reduced confidence in editing.
- Priority: Low

### 2.8 Hardcoded English — No i18n Readiness (GAP-UXR-008)
- Description: All UI strings are hardcoded in English within the HTML. No string extraction, no translation framework, no language selector.
- Source: `.github/webapp/index.html` — all text literals embedded directly (e.g., L675 "Agentic System — Command Center", L702 "Loading questionnaires…").
- Risk if unresolved: Cannot serve non-English users; internationalization retrofit is expensive after launch.
- Priority: Medium

---

## 3. User Journey Mapping (AUDIT mode)

### 3.1 Journey: Launch a New Audit/Create Cycle

**Touchpoints:**
1. Open browser → `http://127.0.0.1:3000` → Command Center tab loads (default)
2. Scan sidebar → Select command (e.g., "AUDIT TECH UX")
3. Fill in form fields (project name, optional brief)
4. Click "Launch Command" → command text copied to clipboard
5. Switch to VS Code Copilot Chat → paste command → wait for Orchestrator
6. Return to Command Center → observe pipeline progress

**Pain points (heuristic):**
- **Step 2→3:** Form validation is minimal. Empty project name shows a toast but no field highlight. Source: `.github/webapp/index.html:1805-1806`.
- **Step 4→5:** Context switch from browser to VS Code is a **critical friction point**. Users must understand that the webapp is a monitoring/input tool, NOT the execution engine. The clipboard-paste workflow is non-standard and unintuitive for users unfamiliar with LLM agent workflows.
- **Step 5→6:** No automatic notification when agents start. User must manually check the pipeline. Polling at 5-second intervals when command is pending (source: `.github/webapp/index.html:1047`).

**Emotion curve:** Neutral (launch) → Confused (clipboard step) → Anxious (waiting) → Relieved (pipeline appears)

**Moments of truth:**
- The clipboard-paste handoff is the #1 moment of truth. If the user doesn't paste the command correctly, the entire workflow fails silently.
- Pipeline visualization appearing confirms the system is working — this is the key trust-building moment.

**Drop-off risk:** HIGH at Step 4→5 (heuristic assessment). Users unfamiliar with the workflow may not complete the clipboard-paste step.

**Interaction steps:** 6 steps for primary flow → `UX_FRICTION_FLAG` per G-UX-02 (exceeds 3-step maximum)

### 3.2 Journey: Answer Questionnaires

**Touchpoints:**
1. Click "Questionnaires" tab → sidebar loads with phase/agent grouping
2. Select a questionnaire from sidebar → cards render in main area
3. Read question → type answer in textarea → optionally change status
4. Click "Save" per question or "Save All" for batch

**Pain points (heuristic):**
- **Step 2:** No search/filter for questionnaires. With many phases, scrolling the sidebar becomes tedious. Source: `.github/webapp/index.html:700` — sidebar has no search input.
- **Step 3:** Long questionnaires require extensive scrolling. No "jump to unanswered" or progress indicator within a questionnaire.
- **Step 3:** Textarea auto-resize works but min-height is 72px (source: L209), which can feel cramped for long answers.

**Emotion curve:** Focused (start) → Fatigued (many questions) → Satisfied (progress visible)

**Moments of truth:**
- Seeing the progress bar fill in the sidebar gives a sense of accomplishment.
- The unsaved-changes warning when switching tabs (source: L1207) prevents data loss.

**Interaction steps:** 4 steps → acceptable per G-UX-02

### 3.3 Journey: Manage Decisions

**Touchpoints:**
1. Click "Decisions" tab → filter bar + decision cards load
2. Scan decisions → use text search, priority filter, status filter
3. Answer open question → type answer → click "Decide & Close" or "Save Answer"
4. Optionally: Create new decision, Edit, Defer, Expire, Reopen

**Pain points (heuristic):**
- **Step 2:** Filter changes trigger immediate re-render without debounce, which could cause layout thrashing with many decisions. Source: `.github/webapp/index.html` — filter inputs have no debounce.
- **Step 3:** "Decide & Close" prompts a confirmation dialog AND optionally a reevaluation dialog — this is 3 interactions for a single conceptual action. Source: `.github/webapp/index.html:1469-1483`.
- **Step 4:** Creating a new decision opens a modal with 5 form fields, which is appropriate complexity.

**Emotion curve:** Focused → Empowered (filtering works well) → Slightly annoyed (double confirmation)

**Interaction steps:** 3 steps for answering → acceptable per G-UX-02

---

## 4. Task Success Rate (AUDIT mode)

### 4.1 Task: Launch a Command
- Measurable completion: Command text copied to clipboard and command-pending.json written to disk.
- Baseline success rate: `INSUFFICIENT_DATA:` — no analytics or testing data.
- Obstructions: Requires understanding the clipboard-paste-to-Copilot workflow; no validation that the command was actually pasted.

### 4.2 Task: Answer a Questionnaire Question
- Measurable completion: Answer saved to server (HTTP 200 response from `/api/save`).
- Baseline success rate: `INSUFFICIENT_DATA:`
- Obstructions: None critical — UI provides clear save button and feedback toast.

### 4.3 Task: Decide an Open Question
- Measurable completion: Decision status changes from OPEN to DECIDED in decisions.md.
- Baseline success rate: `INSUFFICIENT_DATA:`
- Obstructions: Double confirmation dialog adds friction.

### 4.4 Task: Monitor Pipeline Progress
- Measurable completion: User can identify current phase, active agent, and overall progress.
- Baseline success rate: `INSUFFICIENT_DATA:`
- Obstructions: Information is well-presented; no obvious barriers.

---

## 5. Friction Point Inventory (AUDIT mode)

| ID | Description | Impact | Frequency | Source |
|---|---|---|---|---|
| FP-001 | Clipboard-paste handoff to Copilot Chat requires context switch and is non-standard | HIGH — workflow fails if user doesn't paste | Every session start | Heuristic: `.github/webapp/index.html:1805-1830` |
| FP-002 | No onboarding flow for first-time users | HIGH — new users have no guidance | First use | Heuristic: `cmdWelcome` div at L809-814 |
| FP-003 | Questionnaire sidebar lacks search/filter | MEDIUM — tedious with many questionnaires | Every questionnaire session | Heuristic: `.github/webapp/index.html:700` |
| FP-004 | No "jump to unanswered" within a questionnaire | MEDIUM — long lists require scrolling | Frequent | Heuristic: `renderQ()` function |
| FP-005 | Double confirmation for Decide & Close action | LOW — adds 1 extra click | Every decision | Heuristic: L1469-1483 |
| FP-006 | Error messages show raw API errors, no recovery guidance | MEDIUM — user can't self-resolve | On API failure | Heuristic: `load()` error handler, L1035 |
| FP-007 | Brief textarea (project brief) has no character count, only a size warning at 50KB | LOW — user unsure of limit | Command creation | Heuristic: L1798-1800 |
| FP-008 | Filter changes in Decisions tab are not debounced | LOW — potential layout thrashing | Filter usage | Heuristic: filter event handlers |

---

## 6. Technical Feasibility Check (AUDIT mode)

Linking identified UX pain points to Phase 2 technical constraints:

| Pain Point | Phase 2 Constraint | Feasibility |
|---|---|---|
| FP-001: Clipboard handoff | The clipboard-paste is architecturally inherent — the webapp cannot directly invoke VS Code/Copilot Chat. Server only serves HTTP; no WebSocket or extension bridge. Source: Agent 05 (Software Architect), CS-ARCH-001. | `DEPENDENT_ON_TECH: Requires VS Code extension or WebSocket bridge to eliminate clipboard step. Currently infeasible within architecture.` |
| FP-002: No onboarding | Technically trivial — add first-run state detection (check session-state.json) and render onboarding UI. No architectural constraint. | FEASIBLE |
| FP-003: Questionnaire search | Technically trivial — client-side text filtering of existing data. No server change needed. | FEASIBLE |
| FP-004: Jump to unanswered | Technically trivial — scroll to first `.badge.b-open` element. | FEASIBLE |
| FP-005: Double confirmation | Reduce to single confirmation. No technical constraint. | FEASIBLE |
| FP-006: Error recovery | Add retry button and user-friendly error messages. No architectural constraint. | FEASIBLE |
| GAP-UXR-001: Design system | Phase 2 Agent 05 recommended component extraction (REC-ARCH-006). Storybook Agent (31) executes in Phase 4 workflow. | FEASIBLE (blocked on Storybook Agent output) |
| GAP-UXR-008: i18n | Phase 2 Agent 06 confirmed all strings are hardcoded. Extraction requires systematic refactoring. `DEPENDENT_ON_TECH: requires string extraction layer, estimated in Agent 06 sprint plan.` | FEASIBLE with effort |

---

## 7. Self-Check

- [x] All available research data types inventoried (all ABSENT — documented)
- [x] User persona derived from observable evidence (not invented)
- [x] User journeys documented for all 3 primary flows
- [x] Each journey has touchpoints, pain points, emotion curve, moments of truth
- [x] Pain points clearly labeled as heuristic (no research data available)
- [x] Task success rates documented with INSUFFICIENT_DATA where applicable
- [x] Friction points inventoried with impact, frequency, source
- [x] Technical feasibility linked to Phase 2 constraints
- [x] G-UX-02 evaluated: Command launch flow exceeds 3 steps (UX_FRICTION_FLAG)
- [x] G-UX-03 satisfied: Journey analysis based on code evidence, not assumption
- [x] G-UX-09 satisfied: Task success baselines documented (all INSUFFICIENT_DATA)

---

## 4. KPI Baseline

| KPI | Current value | Source | Measurement method |
|-----|--------------|--------|-------------------|
| Task success rate (command launch) | INSUFFICIENT_DATA: | No analytics | Usability testing required |
| Task success rate (questionnaire answer) | INSUFFICIENT_DATA: | No analytics | Usability testing required |
| Time-to-first-action (new user) | INSUFFICIENT_DATA: | No analytics | Session recording + analytics |
| Questionnaire completion rate | INSUFFICIENT_DATA: | No analytics | Server-side tracking of answered/total |
| Mean time to answer a questionnaire | INSUFFICIENT_DATA: | No analytics | Analytics event tracking |
| User error rate (per flow) | INSUFFICIENT_DATA: | No analytics | Error event tracking |
| System Usability Scale (SUS) score | INSUFFICIENT_DATA: | No survey | SUS questionnaire after testing |

---

## 5. UNCERTAIN Items

- `UNCERTAIN: FP-001 drop-off rate` — Reason: The clipboard-paste handoff is assessed as HIGH drop-off risk, but without analytics this cannot be quantified. — Escalation: Implement analytics tracking (GAP-UXR-002 resolution) or conduct usability test.
- `UNCERTAIN: Concurrent user impact on questionnaire editing` — Reason: Phase 2 Agent 09 identified non-atomic writes (GAP-DATA-005). If two users edit the same questionnaire, data loss is possible. UX impact unclear without multi-user testing. — Escalation: Phase 2 sprint addresses atomic writes.

---

## 6. INSUFFICIENT_DATA Items

- `INSUFFICIENT_DATA: All task success rates` — Missing: Analytics integration, usability test data — Consequence: Cannot establish baselines; all improvement claims will be qualitative only.
- `INSUFFICIENT_DATA: User persona validation` — Missing: User interviews, surveys, ICP from Phase 1 — Consequence: Persona is inferred from code analysis, not validated with real users.
- `INSUFFICIENT_DATA: Drop-off rates per journey` — Missing: Funnel analytics — Consequence: Cannot quantify which journeys lose users most.
- `INSUFFICIENT_DATA: Cognitive load scores (empirical)` — Missing: User testing with cognitive load measurement — Consequence: Scores in Agent 11 (UX Designer) will be heuristic-based.

---

# Recommendations – UX Researcher – 2026-03-07

## Metadata
- Agent: UX Researcher (10)
- Phase: 3
- Based on analysis: This document (analysis section above)
- Date: 2026-03-07
- Mode: AUDIT

---

## Recommendation REC-UXR-001

### Problem
No user research data exists to validate any UX decision or measure improvement. All UX analysis is based on heuristic evaluation.
**Analysis reference:** GAP-UXR-002

### Solution
Implement a minimal analytics and feedback layer:
1. Add client-side event tracking for key user actions (command launch, questionnaire save, decision actions, tab switches, error occurrences).
2. Store events in a local JSON file via a new `/api/telemetry` endpoint (privacy-preserving — no PII, localhost only).
3. Add a SUS (System Usability Scale) micro-survey accessible from the Help panel.
**Implementation approach:**
1. Step 1: Add event tracking JS module with `trackEvent(category, action, label)` — client-side, ~50 lines
2. Step 2: Add `/api/telemetry` POST endpoint in `server.js` — append to `telemetry.jsonl` (one JSON object per line)
3. Step 3: Add SUS micro-survey as a new Help panel section with 10 standard SUS questions

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool — no direct revenue |
| Risk Reduction | High — enables data-driven UX decisions | Without data, all UX improvements are guesses |
| Cost | Low — ~2 SP implementation effort | Simple event logging, no external dependency |
| UX | High — establishes measurement baseline | Enables KPI tracking for all subsequent recommendations |

### Dependencies
- Requires: `server.js` API extension (Phase 2 architecture supports this)
- Blocked by: NONE

### Risk of Not Implementing
All UX improvements remain unmeasurable. Future investment in UX cannot be justified or evaluated. The same blind spots persist indefinitely.

### Measurement Criterion
- KPI: Event tracking coverage (% of primary actions tracked)
- Baseline: 0%
- Target: 100% of primary actions (command launch, save, decide, filter, tab switch, error)
- Measurement method: Count of distinct event types in telemetry.jsonl
- Time horizon: Sprint 1 completion

---

## Recommendation REC-UXR-002

### Problem
First-time users see a static welcome screen with no guidance on the multi-step workflow (webapp → Copilot Chat → pipeline monitoring → questionnaires → decisions). The clipboard-paste handoff is the #1 usability risk.
**Analysis reference:** GAP-UXR-003, FP-001

### Solution
Implement a first-run onboarding experience:
1. Detect first-run state: check if `session-state.json` exists via `/api/progress` — if no active session and no history, show onboarding.
2. Show a step-by-step wizard overlay (3-4 steps) explaining: (a) Choose command, (b) Paste in Copilot Chat, (c) Monitor pipeline, (d) Answer questionnaires.
3. Add a "Show Tour" button to the Help panel for repeat access.
4. Add contextual tooltip on the clipboard step: "Copied! Now paste this command in VS Code → Copilot Chat".
**Implementation approach:**
1. Step 1: Add `firstRun` detection logic in `load()` — check localStorage flag + session state
2. Step 2: Create onboarding overlay HTML (4 steps with next/back/skip) 
3. Step 3: Add "Show Tour" trigger in Help panel

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Medium — reduces user confusion and workflow failure | Primary drop-off point addressed |
| Cost | Low — ~3 SP implementation effort | HTML/CSS/JS, no server changes needed |
| UX | High — converts confused first-timers into productive users | Addresses #1 friction point |

### Dependencies
- Requires: NONE
- Blocked by: NONE

### Risk of Not Implementing
New users may fail to complete the clipboard-paste handoff, never starting a session. Each failed attempt erodes trust in the tool. Users seek alternatives or give up.

### Measurement Criterion
- KPI: First-run completion rate (onboarding wizard completed / started)
- Baseline: INSUFFICIENT_DATA:
- Target: ≥ 80% completion rate
- Measurement method: Telemetry events (requires REC-UXR-001)
- Time horizon: Sprint 2 + 2 weeks observation

---

## Recommendation REC-UXR-003

### Problem
Questionnaire sidebar has no search or filter. With many phases and agents, finding a specific questionnaire requires scanning the full list.
**Analysis reference:** FP-003

### Solution
Add a search input at the top of the questionnaire sidebar that filters questionnaires by agent name, phase name, or question content.
**Implementation approach:**
1. Step 1: Add `<input type="search" placeholder="Filter questionnaires...">` above sidebar items
2. Step 2: Filter `renderSidebar()` output by search term matching against `q.agent`, `q.phase`, and question text

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Low | Quality-of-life improvement |
| Cost | Low — ~1 SP | Client-side filter, no server change |
| UX | Medium — reduces scrolling and scanning time | Direct friction point resolution |

### Dependencies
- Requires: NONE
- Blocked by: NONE

### Risk of Not Implementing
Users with many questionnaires spend extra time scanning the sidebar. Minor productivity loss.

### Measurement Criterion
- KPI: Sidebar search usage rate
- Baseline: 0 (feature doesn't exist)
- Target: Used in ≥ 30% of sessions with > 5 questionnaires
- Measurement method: Telemetry event on search input usage
- Time horizon: Sprint 1 + 2 weeks observation

---

## Recommendation REC-UXR-004

### Problem
Error messages show raw API errors with no recovery path. Users encounter dead ends on server failure.
**Analysis reference:** GAP-UXR-004, FP-006

### Solution
Implement user-friendly error handling:
1. Map common API errors to human-readable messages with suggested actions.
2. Add a "Retry" button to toast notifications for retryable operations (save, load, reevaluate).
3. Add a connection-status indicator in the header (green dot = connected, red = disconnected).
**Implementation approach:**
1. Step 1: Create error message mapping object (`{ 'ECONNREFUSED': 'Server is not running...', ... }`)
2. Step 2: Modify toast to optionally include a retry button with callback
3. Step 3: Add connection status dot to header based on polling success/failure

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Medium — reduces user frustration and support burden | Users can self-recover |
| Cost | Low — ~2 SP | Client-side changes + minor toast enhancement |
| UX | Medium — eliminates dead-end error states | Direct friction resolution |

### Dependencies
- Requires: NONE
- Blocked by: NONE

### Risk of Not Implementing
Users encountering server errors have no recovery path. They may refresh the page (losing unsaved dirty state) or give up.

### Measurement Criterion
- KPI: Error recovery rate (retry clicked / error shown)
- Baseline: 0% (no retry option exists)
- Target: ≥ 50% of retryable errors trigger retry click
- Measurement method: Telemetry events
- Time horizon: Sprint 1 + 2 weeks observation

---

## Recommendation REC-UXR-005

### Problem
The Command Center launch flow requires 6 interaction steps, exceeding the G-UX-02 maximum of 3 for a primary action. The clipboard-paste handoff is particularly problematic.
**Analysis reference:** FP-001, G-UX-02 violation

### Solution
Reduce the launch flow friction:
1. Add a prominent visual callout after clipboard copy: animated arrow pointing to VS Code icon, step-by-step instructions.
2. Add "I've pasted it" confirmation button that immediately starts polling at 3-second intervals and shows a waiting state with progress steps.
3. (Long-term, `DEPENDENT_ON_TECH`): Investigate VS Code extension integration to eliminate the clipboard step entirely.
**Implementation approach:**
1. Step 1: Enhance post-copy UI with animated instruction panel
2. Step 2: Add "I've pasted it" button that triggers aggressive polling
3. Step 3 (future): Evaluate VS Code extension bridge feasibility

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | High — reduces primary workflow failure risk | Addresses #1 drop-off point |
| Cost | Medium — ~3 SP (steps 1+2), HIGH for step 3 | UI changes are moderate; extension is significant |
| UX | High — transforms confusing handoff into guided experience | Direct resolution of UX_FRICTION_FLAG |

### Dependencies
- Requires: NONE for steps 1-2
- Blocked by: VS Code extension API investigation for step 3 — `DEPENDENT_ON_TECH: VS Code extension bridge`
- Depends on output of: Agent 05 (Software Architect) for architecture feasibility of extension bridge

### Risk of Not Implementing
The primary workflow continues to have a non-standard, high-friction handoff point. User abandonment at this step remains the #1 UX risk.

### Measurement Criterion
- KPI: Command-to-session conversion rate (sessions started / commands launched)
- Baseline: INSUFFICIENT_DATA:
- Target: ≥ 90% conversion rate
- Measurement method: Telemetry: compare command-queued events to session-started events
- Time horizon: Sprint 2 + 4 weeks observation

---

## PRIORITY MATRIX

| Recommendation ID | Impact | Effort | Priority | Sprint | Rationale |
|---|---|---|---|---|---|
| REC-UXR-001 | High | Low | P1 | Sprint 1 | Enables measurement for all other recommendations |
| REC-UXR-002 | High | Low | P1 | Sprint 1 | Addresses #1 friction point for new users |
| REC-UXR-005 | High | Medium | P1 | Sprint 2 | Resolves G-UX-02 violation on primary flow |
| REC-UXR-004 | Medium | Low | P2 | Sprint 1 | Quick win — improves error resilience |
| REC-UXR-003 | Medium | Low | P2 | Sprint 1 | Quick win — reduces sidebar friction |

---

# Sprint Plan – UX Researcher – 2026-03-07

## Metadata
- Agent: UX Researcher (10)
- Phase: 3
- Based on recommendations: REC-UXR-001 through REC-UXR-005
- Date: 2026-03-07
- Total scope: 2 sprints
- Mode: AUDIT

## Assumptions
- Team composition: `INSUFFICIENT_DATA:` — No team composition data available. Using placeholder based on typical single-developer project.
  - Team UX-Dev: 1 full-stack developer — capacity: 10 SP/sprint (assumed)
- Sprint duration: 2 weeks
- Technology stack: Vanilla HTML/CSS/JS, Node.js server (zero npm deps)
- Prerequisites: Phase 2 sprint plan for data layer abstraction should be coordinated (Agent 05 SP-2-001)

**QUESTIONNAIRE_REQUEST:** `QUE-UXR-TEAM-001` — What is the team composition and capacity for UX/frontend work?

---

## Sprint 1 – Establish UX Measurement Foundation & Quick Wins

### Goal
Enable data-driven UX decisions by implementing event tracking and error recovery, while delivering quick-win friction reductions.

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | Story Points | Dependencies | Blocker | Rec |
|---|---|---|---|---|---|---|---|---|
| SP-UXR-1-001 | As a product owner I want client-side event tracking so that I can measure user behavior | CODE | UX-Dev | Given the webapp is loaded, when a user performs a primary action (command launch, save, tab switch, error), then an event is logged to `/api/telemetry` | 2 | NONE | NONE | REC-UXR-001 |
| SP-UXR-1-002 | As a product owner I want a telemetry API endpoint so that events are persisted locally | CODE | UX-Dev | Given a POST to `/api/telemetry` with valid event JSON, when the server processes it, then the event is appended to `telemetry.jsonl`; given invalid JSON, then HTTP 400 is returned | 1 | NONE | NONE | REC-UXR-001 |
| SP-UXR-1-003 | As a user I want a search input in the questionnaire sidebar so that I can find questionnaires quickly | CODE | UX-Dev | Given > 5 questionnaires loaded, when I type in the search box, then only matching questionnaires (by agent/phase name) are shown; given empty search, then all are shown | 1 | NONE | NONE | REC-UXR-003 |
| SP-UXR-1-004 | As a user I want friendly error messages with retry buttons so that I can recover from failures | CODE | UX-Dev | Given an API call fails, when the error toast appears, then it shows a human-readable message + "Retry" button; given I click retry, then the operation is re-attempted | 2 | NONE | NONE | REC-UXR-004 |
| SP-UXR-1-005 | As a user I want a connection status indicator so that I know if the server is reachable | CODE | UX-Dev | Given the server is running, when the page loads, then a green dot appears in the header; given polling fails 3 consecutive times, then the dot turns red | 1 | SP-UXR-1-004 | NONE | REC-UXR-004 |

### Parallel Tracks

| Track | Type | Stories | Team(s) | Start condition |
|---|---|---|---|---|
| Track 1 (Telemetry) | CODE | SP-UXR-1-001, SP-UXR-1-002 | UX-Dev | Sprint 1 start |
| Track 2 (UI Polish) | CODE | SP-UXR-1-003, SP-UXR-1-004, SP-UXR-1-005 | UX-Dev | Sprint 1 start (SP-UXR-1-005 after SP-UXR-1-004) |

### Blocker Register

No blockers for Sprint 1.

### Sprint 1 Goal & Definition of Done
- **Outcome:** Product owner can review telemetry data after a usage session; users experience friendly errors with retry; sidebar filtering works.
- **KPI targets:** Telemetry endpoint operational; error retry available on all API calls; sidebar filter functional.
- **Definition of Done:** All 5 stories complete, code reviewed, no new CRITICAL_FINDING, telemetry captures ≥ 5 event types.

---

## Sprint 2 – Onboarding & Flow Optimization

### Goal
Convert first-time users into productive users through guided onboarding, and reduce friction on the primary command-launch flow.

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | Story Points | Dependencies | Blocker | Rec |
|---|---|---|---|---|---|---|---|---|
| SP-UXR-2-001 | As a first-time user I want a guided onboarding wizard so that I understand the workflow | CODE | UX-Dev | Given no prior session exists and localStorage has no `onboarding-complete` flag, when the page loads, then a 4-step wizard overlay appears; given I click Skip or Finish, then the wizard closes and the flag is set | 3 | NONE | NONE | REC-UXR-002 |
| SP-UXR-2-002 | As a user I want a "Show Tour" button in Help so that I can revisit the onboarding | CODE | UX-Dev | Given I click "Show Tour" in the Help panel, when the overlay opens, then the onboarding wizard appears regardless of the flag | 1 | SP-UXR-2-001 | NONE | REC-UXR-002 |
| SP-UXR-2-003 | As a user I want enhanced post-copy feedback so that I know what to do after launching a command | CODE | UX-Dev | Given I click "Launch Command" and the command is copied, when the clipboard box appears, then an animated instruction panel shows "Step 1: Open Copilot Chat, Step 2: Paste command, Step 3: Wait for pipeline" with visual cues | 2 | NONE | NONE | REC-UXR-005 |
| SP-UXR-2-004 | As a user I want an "I've pasted it" button so that the system starts monitoring immediately | CODE | UX-Dev | Given the post-copy instruction panel is shown, when I click "I've pasted it", then polling interval drops to 3 seconds and a waiting animation appears with clear progress steps | 1 | SP-UXR-2-003 | NONE | REC-UXR-005 |

### Parallel Tracks

| Track | Type | Stories | Team(s) | Start condition |
|---|---|---|---|---|
| Track 1 (Onboarding) | CODE | SP-UXR-2-001, SP-UXR-2-002 | UX-Dev | Sprint 2 start |
| Track 2 (Command Flow) | CODE | SP-UXR-2-003, SP-UXR-2-004 | UX-Dev | Sprint 2 start |

### Blocker Register

No blockers for Sprint 2.

### Sprint 2 Goal & Definition of Done
- **Outcome:** New users successfully complete their first command-launch cycle on first attempt; clipboard handoff friction is significantly reduced.
- **KPI targets:** Onboarding wizard completion ≥ 80% (via telemetry); command-to-session conversion measurable.
- **Definition of Done:** All 4 stories complete, code reviewed, no new CRITICAL_FINDING, onboarding wizard renders correctly on both light/dark themes.

---

## Traceability: Recommendations → Stories

| Recommendation | Priority | Stories | Covered |
|---|---|---|---|
| REC-UXR-001 (Analytics) | P1 | SP-UXR-1-001, SP-UXR-1-002 | ✅ |
| REC-UXR-002 (Onboarding) | P1 | SP-UXR-2-001, SP-UXR-2-002 | ✅ |
| REC-UXR-003 (Sidebar search) | P2 | SP-UXR-1-003 | ✅ |
| REC-UXR-004 (Error recovery) | P2 | SP-UXR-1-004, SP-UXR-1-005 | ✅ |
| REC-UXR-005 (Flow optimization) | P1 | SP-UXR-2-003, SP-UXR-2-004 | ✅ |

**No P1 recommendation without a story. ✅**

---

# Guardrails – UX Researcher – 2026-03-07

## Metadata
- Agent: UX Researcher (10)
- Phase: 3
- Date: 2026-03-07
- Based on analysis: This document
- Mode: AUDIT

---

## Guardrail G-UXR-001

### Title
All UX Claims Must Be Labeled by Evidence Source

### Scope
- Applies to: All Phase 3 agents, Implementation Agent (UX stories)
- Time horizon: Permanent

### Rule
Every UX finding, recommendation, or design decision MUST be labeled with its evidence source: `HEURISTIC`, `ANALYTICS`, `USABILITY_TEST`, `USER_INTERVIEW`, or `ASSUMPTION`. Claims without a source label are INVALID.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UXR-001`, block handoff, return to agent for source labeling.

### Rationale
Based on GAP-UXR-002: No empirical research data exists. All current claims are heuristic. As analytics (REC-UXR-001) and usability testing become available, evidence sources will evolve. Labeling prevents conflation of assumption with evidence.

### Verification Method
Code review checklist item: every UX finding in Phase 3 outputs has an explicit source label.

---

## Guardrail G-UXR-002

### Title
Primary Flow Maximum 3 Interaction Steps

### Scope
- Applies to: UI Designer (12), Implementation Agent (UX stories)
- Time horizon: Permanent

### Rule
Every primary user flow (command launch, questionnaire answer, decision management) MUST complete in ≤ 3 mandatory interaction steps. Flows exceeding 3 steps MUST have a documented justification or a remediation story in the sprint backlog. Per G-UX-02.

### Violation Action
Mark as `UX_FRICTION_FLAG`, create remediation story before sprint approval.

### Rationale
Based on G-UX-02 and FP-001: The command launch flow currently requires 6 steps. REC-UXR-005 addresses the immediate violation. This guardrail prevents regression.

### Verification Method
Heuristic evaluation of flow step counts at each sprint review. Automated: telemetry event sequence analysis after REC-UXR-001 implementation.

---

## Guardrail G-UXR-003

### Title
Telemetry Must Not Collect PII

### Scope
- Applies to: Implementation Agent (telemetry stories), Senior Developer
- Time horizon: Permanent

### Rule
The telemetry system (REC-UXR-001) MUST NOT log any personally identifiable information (PII). Events MUST contain only: event category, action name, timestamp, and optional non-PII metadata (e.g., tab name, question count). Questionnaire answer content, decision text, and project names MUST NOT appear in telemetry.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UXR-003` + `SECURITY_FLAG`, immediate remediation required, telemetry.jsonl purged.

### Rationale
Based on Phase 2 Agent 08 security constraints and Agent 33 GDPR analysis. Even for a localhost tool, PII in logs creates risk if logs are accidentally committed or shared.

### Verification Method
Code review of telemetry event payloads. Automated: grep telemetry.jsonl for PII patterns (email regex, names from questionnaire answers).

---

## Guardrail Overview

| ID | Title | Scope | Priority | Verification |
|---|---|---|---|---|
| G-UXR-001 | UX Claims Evidence Labeling | All Phase 3 agents | Critical | Code review checklist |
| G-UXR-002 | Primary Flow ≤ 3 Steps | UI Designer, Implementation | High | Heuristic + telemetry analysis |
| G-UXR-003 | No PII in Telemetry | Implementation, Senior Dev | Critical | Code review + automated scan |

---

## QUESTIONNAIRE_REQUEST Items

| ID | Context | Requested For |
|---|---|---|
| QUE-UXR-TEAM-001 | What is the team composition and capacity for UX/frontend work? (Names, roles, headcount, SP/sprint) | Sprint plan capacity assumptions |
| QUE-UXR-USERS-001 | Who are the primary users of this webapp? How many active users are expected? | Persona validation |
| QUE-UXR-RESEARCH-001 | Has any informal user feedback been collected (verbal, email, chat)? If so, what were the top complaints? | Research data inventory |
| QUE-UXR-PRIORITIES-001 | Which UX aspect matters most: onboarding new users, reducing errors, or improving workflow speed? | Recommendation prioritization |

---

## HANDOFF CHECKLIST — UX Researcher (10)

- [x] All required sections are filled (not empty, not placeholder)
- [x] All UNCERTAIN: items are documented and escalated (2 items)
- [x] All INSUFFICIENT_DATA: items are documented and escalated (4 items)
- [x] Output complies with the contract in `.github/docs/contracts/`
- [x] Guardrails from `.github/docs/guardrails/04-ux-guardrails.md` have been checked
  - G-UX-01: CRITICAL_GAP documented (Design System missing)
  - G-UX-02: UX_FRICTION_FLAG documented (command launch 6 steps)
  - G-UX-03: Journey analysis based on code evidence ✅
  - G-UX-05: Deferred to Agent 11 (UX Designer) — heuristic evaluation is their deliverable
  - G-UX-08: Technical feasibility linked to Phase 2 ✅
  - G-UX-09: Task success baselines all INSUFFICIENT_DATA ✅
- [x] Output is machine-readable and ready as input for the next agent (Agent 11 — UX Designer)
- [x] No contradictory statements in this document
- [x] All findings include a source reference
- [x] Deliverable written to file (`.github/docs/phase-3/10-ux-researcher.md`)
- [x] All INSUFFICIENT_DATA items tagged with QUESTIONNAIRE_REQUEST (4 questions)
- [x] Step 0 questionnaire context acknowledged (NOT_INJECTED documented)
- [x] Every P1 recommendation has at least one sprint story ✅
- **STATUS: READY FOR HANDOFF TO AGENT 11 (UX Designer)**
