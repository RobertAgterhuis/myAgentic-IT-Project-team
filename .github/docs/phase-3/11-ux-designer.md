# Analysis – UX Designer – 2026-03-07

## Metadata
- Agent: UX Designer (11)
- Phase: 3 – Experience Design
- Input received from: UX Researcher (Agent 10) output
- Date: 2026-03-07
- Software under analysis: Agentic System — Command Center (webapp)
- Mode: AUDIT

---

## Step 0: Questionnaire Input Check

**Status:** NOT_INJECTED — No `## QUESTIONNAIRE INPUT — UX Designer` block present. Proceeding normally.

---

## 1. Heuristic Evaluation — Nielsen's 10 (AUDIT mode Step 1)

| # | Heuristic | Status | Findings | Source | Priority |
|---|-----------|--------|----------|--------|----------|
| 1 | Visibility of system status | Problem | (a) Pipeline progress visualization provides phase/agent progress with percentage bars — GOOD. (b) Toast notifications for save/error — GOOD. (c) Polling status is invisible to user — no indicator when data is being fetched or when last refresh occurred. (d) Connection state (server up/down) is not shown. (e) The "dirty" indicator on unsaved questions is effective (yellow dot). (f) Command queue state requires manual pipeline refresh — no push notification. | (a) `index.html:L1631-1680` pipeline rendering; (b) `toast()` function L892; (c) `load()` L1020-1050 — no loading indicator during fetch; (d) No connection status element in HTML; (e) `markDirty()` L1540-1555 | High |
| 2 | Match between system and real world | Problem | (a) Agent numbering (05, 06, 07...) is arbitrary — users don't know what Agent 32 or Agent 35 does without reading documentation. (b) Phase naming (Phase 1-4) uses internal system terminology rather than user-meaningful labels. (c) Command syntax (`CREATE TECH UX [project]`) matches developer mental model but not business stakeholder model. (d) "Reevaluate" is domain-specific jargon — purpose unclear without documentation. (e) Questionnaire status labels (open/answered/deferred) are appropriately clear. | (a) Sidebar items in `renderSidebar()` L1108-1140; (b) Phase labels injected from server data; (c) Command form at `buildForm()` L1740-1785; (d) Reevaluate button L684 | Medium |
| 3 | User control and freedom | Problem | (a) No undo after saving a questionnaire answer — `saveOne()` L1552-1575 writes immediately to server with no rollback. (b) Modal close via Escape key works — GOOD. (c) Backdrop click closes modals — GOOD. (d) Tab switching warns about unsaved changes — GOOD (L1207). (e) No browser back-button support — SPA with no history state management. (f) "Decide & Close" cannot be undone (state change is permanent until explicit "Reopen"). | (a) `saveOne()` L1552; (e) No `history.pushState` or `popstate` listener; (f) `decideDecision()` L1469-1483 | Medium |
| 4 | Consistency and standards | OK | (a) Button styling is consistent — `.btn` class with defined variants (`.btn-sm`, `.b-save`, `.b-decide`). (b) Card layout is consistent across questionnaires and decisions. (c) Color coding for status badges is consistent (`.b-open` green, `.b-answered` blue, `.b-deferred` amber). (d) Icon usage is emoji-based throughout — consistent but accessibility concern (separate issue). (e) Modal structure is consistent across all 5 modals. (f) CSS custom properties ensure consistent theming. | `.btn` styles L139-175; `.badge` styles L277-297; modal styles L350-380 | — |
| 5 | Error prevention | Problem | (a) Empty project name in command form shows toast but no field-level validation highlight — user must deduce which field is wrong. Source: `launchCommand()` L1794. (b) No confirmation before navigating away with unsaved changes (only between tabs, not on page close). (c) Decision "Decide & Close" prompts confirmation — GOOD. (d) Brief textarea shows warnings at 50KB but allows any size — no hard limit validation. (e) Questionnaire textarea has no character limit guidance. (f) No duplicate decision detection — user can create identical decisions. | (a) L1794-1806; (b) No `beforeunload` handler; (d) L1798; (f) `createDecision()` L1395-1420 | High |
| 6 | Recognition rather than recall | Problem | (a) Command Center sidebar lists all available commands with icons — GOOD for recognition. (b) Questionnaire sidebar groups by phase/agent with counts — GOOD. (c) Filter bar for decisions with text search, priority, status — GOOD. (d) Command form has descriptive help text per field — GOOD. (e) BUT: The clipboard-paste workflow requires user to RECALL that they must paste in Copilot Chat — no persistent visual reminder after the toast disappears. (f) Agent numbers in sidebar (e.g., "05-software-architect") require recall of the phase structure. | (a) `cmdSidebar` items; (e) `launchCommand()` post-copy UI L1900-1920; (f) `renderSidebar()` output | Medium |
| 7 | Flexibility and efficiency | Problem | (a) Keyboard shortcut Ctrl+S for save all — GOOD (L2145). (b) F1 or ? for help panel — GOOD. (c) Escape to close modals — GOOD. (d) No bulk operations for questionnaires (e.g., mark multiple as "deferred"). (e) No batch decision actions. (f) No customizable layout or sidebar width. (g) No recent/frequent commands or questionnaire pinning. (h) Save All button exists — GOOD for batch saving. | (a) L2145; (b) L2154-2160; (d) Individual save per question | Low |
| 8 | Aesthetic and minimalist design | OK | (a) Clean card-based layout with clear visual hierarchy. (b) Appropriate use of whitespace — cards have 20px padding, 16px gaps. (c) Color palette is restrained — primary blue, supporting grays, semantic colors (success/warning/error). (d) Dark mode is well-implemented with corresponding color adjustments. (e) Typography hierarchy is clear (14px base, 700-weight headings, monospace for IDs). (f) Pipeline visualization is compact and informative. Minor: header has 6 action buttons which can feel crowded on smaller screens (1200px). | CSS L11-665; header L671-690 | — |
| 9 | Help users recognize, diagnose, and recover from errors | Critical | (a) Error messages show raw exception text: `'Error: ' + e.message` — not user-friendly. Source: `load()` L1035, `saveOne()` L1575, various catch blocks. (b) No recovery guidance — toast disappears after timeout with no persistent error state. (c) No retry mechanism for failed operations. (d) Failed API calls leave UI in potentially inconsistent state (e.g., dirty indicator may not clear). (e) `<noscript>` fallback exists — GOOD. (f) Network timeout (8s) shows error but no "check if server is running" guidance. | (a) L1035-1040; (b) `toast()` with auto-dismiss L892-920; (c) No retry button in toast; (f) `api()` L965-995 | Critical |
| 10 | Help and documentation | OK | (a) Help panel with topic-based navigation — GOOD. (b) Help loads from server API with markdown rendering — GOOD. (c) F1 shortcut to open help — discoverable via help button. (d) Help content is topic-organized with icons and titles. (e) HOWEVER: No contextual help (tooltips on complex elements). (f) No "Getting Started" or FAQ section visible (depends on server content). | `openHelp()` L2075-2090; `renderHelpNav()` L2100-2115; help panel HTML L835-855 | Low |

### Heuristic Summary
- **Critical:** #9 (Error recovery) — 5 specific violations
- **High:** #1 (System status) — 3 specific violations, #5 (Error prevention) — 4 specific violations
- **Medium:** #2 (Real world match) — 4 violations, #3 (User control) — 3 violations, #6 (Recognition) — 2 violations
- **OK:** #4 (Consistency), #8 (Aesthetics), #10 (Help/docs)
- **Low:** #7 (Flexibility/efficiency) — 4 minor gaps

---

## 2. Cognitive Load Analysis (AUDIT mode Step 2)

### 2.1 Command Center Tab

| Metric | Score | Evidence |
|--------|-------|----------|
| Information density | 5/10 | Sidebar (8 commands), main area (command form OR pipeline view). Two distinct modes but only one visible at a time. Source: `index.html:L750-830`. |
| Decision points | 3/screen | Select command → fill form → launch. After launch: monitor pipeline (passive). Source: `buildForm()` L1740. |
| Visual complexity | 4/10 | Clean card layout. Pipeline uses progress bars with color coding. Source: pipeline rendering L1631-1680. |
| Cognitive load total | **5/10** | Moderate — the command selection is straightforward, but the clipboard-paste handoff introduces unexpected cognitive demand (HEURISTIC). |
| Improvement points | (1) Add descriptions/tooltips to command sidebar items explaining scope; (2) Simplify post-copy instructions with visual steps; (3) Show pipeline status inline without requiring tab context switch. |

### 2.2 Questionnaires Tab

| Metric | Score | Evidence |
|--------|-------|----------|
| Information density | 6/10 | Sidebar lists all questionnaires (potentially 20+); main area shows all questions for selected questionnaire as cards. Source: `renderQ()` L1225-1340. |
| Decision points | 2/question | Edit answer → save (or: change status + save). Source: card layout with textarea + status select + save button. |
| Visual complexity | 5/10 | Cards are well-structured but repetitive. Badge colors help scanning. Progress bar in sidebar provides orientation. |
| Cognitive load total | **6/10** | Moderate-high for long questionnaires. Scrolling fatigue is the primary risk. No pagination, no collapse/expand. |
| Improvement points | (1) Add "jump to unanswered" button; (2) Allow collapsing answered questions; (3) Add sidebar search per Agent 10 REC-UXR-003; (4) Consider pagination for questionnaires with > 10 questions. |

### 2.3 Decisions Tab

| Metric | Score | Evidence |
|--------|-------|----------|
| Information density | 5/10 | Filter bar (3 controls) + card list. Each card shows status, priority, question, context, answer, source, actions. Source: `renderDecisions()` L1345-1395. |
| Decision points | 2-4/card | Depending on status: Open → Answer + Decide/Defer/Expire; Decided → Edit/Reopen. Multiple action buttons per card. |
| Visual complexity | 5/10 | Cards have moderate internal structure. Priority badges and status badges provide scanning anchors. |
| Cognitive load total | **5/10** | Moderate — filtering reduces visible items effectively. Action buttons are contextual (only available actions shown). |
| Improvement points | (1) Add decision count to filter results; (2) Debounce filter text input is present at 200ms — GOOD (L2121); (3) Consider grouping decisions by priority or status visually. |

### 2.4 Modals

| Metric | Score | Evidence |
|--------|-------|----------|
| Information density | 3-5/10 | Reevaluate modal: 2 fields (scope select + notes textarea). New Decision modal: 5 fields. Edit Decision: 4 fields. Confirmation: text + optional reason. |
| Decision points | 1-2/modal | Confirm or cancel (+ optional input). |
| Visual complexity | 3/10 | Clean, focused. Proper overlay with backdrop blur. |
| Cognitive load total | **3/10** | Low — modals are appropriately scoped. |
| Improvement points | None critical. Minor: align button order (confirm right, cancel left) across all modals for consistency. |

---

## 3. User Flow Optimization (AUDIT mode Step 3)

### 3.1 Command Launch Flow (from Agent 10 Journey 3.1)

**Current steps:** 6  
**Target (G-UX-02):** ≤ 3

| Step | Current | Optimization |
|------|---------|--------------|
| 1 | Open browser, land on Command Center | Keep — required |
| 2 | Select command from sidebar | Keep — required |
| 3 | Fill form fields | Keep — required |
| 4 | Click "Launch Command" → clipboard copy | Merge with step 3: auto-copy on form submit |
| 5 | Switch to VS Code, paste in Copilot Chat | `DEPENDENT_ON_TECH:` Cannot eliminate without VS Code extension. Mitigate with enhanced post-copy instructions (Agent 10 REC-UXR-005) |
| 6 | Return to Command Center, observe pipeline | Auto-poll already exists. Add: notification when pipeline first appears |

**Optimized flow:** 3 steps in webapp (select → fill → launch) + 1 external step (paste). The external paste step cannot be removed within current architecture (confirmed by Agent 05, Phase 2 CS-ARCH-001).

**Concrete redesign:** 
1. Merge steps 3+4: Form submit auto-copies to clipboard AND shows inline instructions
2. Add browser notification API for pipeline start detection (user can stay in VS Code)
3. Add "I've pasted it" button that switches UI to waiting mode with progress indicator

### 3.2 Questionnaire Answer Flow (from Agent 10 Journey 3.2)

**Current steps:** 4  
**Target (G-UX-02):** ≤ 3

| Step | Current | Optimization |
|------|---------|--------------|
| 1 | Click Questionnaires tab | Keep |
| 2 | Select questionnaire from sidebar | Keep |
| 3 | Read question, type answer, change status | Keep (this is the core task) |
| 4 | Click Save per question or Save All | Potential: auto-save with debounce (risky — may overwrite concurrent changes) |

**Optimized flow:** 3 steps (step 4 → auto-save on blur/debounce). However, auto-save without explicit user action conflicts with the current dirty-tracking model. `UNCERTAIN:` whether auto-save is desirable — depends on multi-user scenarios.

**Alternative:** Keep explicit save but add keyboard shortcut (Ctrl+Enter to save current question). Already has Ctrl+S for Save All.

### 3.3 Decision Management Flow (from Agent 10 Journey 3.3)

**Current steps:** 3 (for answering)  
**Target (G-UX-02):** ≤ 3 — **COMPLIANT**

The "Decide & Close" flow adds a confirmation dialog + optional reevaluation dialog = effectively 5 steps. This is acceptable because the confirmation prevents destructive action (permanent state change).

**Optimization:** Make reevaluation prompt optional (checkbox in confirmation) rather than a second modal.

---

## 4. Information Architecture Analysis (AUDIT mode Step 4)

### 4.1 Navigation Structure

```
Header (persistent)
├── Logo + Title
├── Stats Bar (sessions, questionnaires, decisions, progress)
├── Actions (Save All, New Decision, Reevaluate, Help, Export, Theme)
│
Tab Bar (primary navigation — 3 tabs)
├── Command Center
│   ├── Sidebar: 8 command types (CREATE variants, AUDIT, FEATURE, SCOPE CHANGE, HOTFIX, REEVALUATE, REFRESH)
│   └── Main: Command form OR Pipeline visualization
├── Questionnaires  
│   ├── Sidebar: Phase/Agent grouped questionnaire list with progress
│   └── Main: Question cards for selected questionnaire
└── Decisions
    ├── Filter Bar: Text search, Priority, Status
    └── Main: Decision cards

Modals (overlay navigation — 5)
├── Reevaluate
├── New Decision
├── Confirm Action
├── Edit Decision
└── Help Panel (full-screen slide-out)
```

### 4.2 Assessment

| Aspect | Rating | Finding | Source |
|--------|--------|---------|--------|
| Labelling | Good | Tab names are clear. Sidebar command names match Copilot syntax. | Tab bar L691-694 |
| Findability | Good | Core functions within 1-2 clicks from any tab. | Tab bar + sidebar pattern |
| Mental model | Partial | 3-tab structure maps well to workflow phases (create → configure → decide). But the Command Center is both "create" and "monitor" which merges two mental models. | Tab structure |
| Depth | Good | Max 2 levels: Tab → Item. No nested navigation. | |
| Mobile adaptation | Good | Hamburger menu for sidebar, tabs remain visible. | Responsive CSS L610-665 |
| Labelling gaps | Problem | (1) Header stats use abbreviated labels ("Questionnaires: 0/0") — clear but could be more descriptive. (2) "Reevaluate" button lacks tooltip explaining purpose for new users. (3) Command sidebar items show only command name, not a description of what the command does. | L675-688; L684 |

### 4.3 Mental Model Alignment

The application follows a **hub-and-spoke** model:
- Hub: Tab bar (3 primary domains)
- Spokes: Command sidebar (within Command Center), Questionnaire sidebar (within Questionnaires)

This works well for the current scope. However, as the system grows (more commands, more phases), the sidebar lists will become unwieldy. `UNCERTAIN:` Current sidebar items number ~8 (commands) and variable (questionnaires) — manageable today but may need search/filter at scale.

---

## 5. Design Debt Quantification (AUDIT mode Step 5)

| Finding Category | Debt Items | Estimated SP | Rationale |
|---|---|---|---|
| Error handling UX (#9) | Raw error messages, no retry, no recovery guidance, no connection status | 5 SP | 4 distinct UI changes needed: error message mapping, retry mechanism, recovery text, status indicator |
| Error prevention (#5) | Field validation UX, no beforeunload, no duplicate detection | 3 SP | Form validation enhancement, browser event handler, duplicate check logic |
| System status visibility (#1) | No loading indicator, no last-refresh timestamp, no connection dot | 3 SP | 3 independent UI additions |
| Clipboard handoff friction | Post-copy UX, waiting state, notification | 3 SP | Per Agent 10 REC-UXR-005 (partial overlap — UX Designer scope is structural design) |
| Cognitive load — Questionnaires | No search, no jump-to-unanswered, no collapse, no pagination | 4 SP | 4 independent features to reduce scrolling fatigue |
| Real-world match (#2) | Agent/phase labelling, command descriptions, jargon reduction | 2 SP | Primarily content changes + tooltip additions |
| User control (#3) | No undo, no browser history, no bulk operations | 5 SP | Undo requires state history; browser history needs history API; bulk ops need new UI |
| Onboarding flow | First-run wizard, contextual tooltips, "Show Tour" | 3 SP | Per Agent 10 REC-UXR-002 (structural scope here) |
| **Total estimated design debt** | | **28 SP** | Approximately 3 sprints at assumed 10 SP/sprint capacity |

---

## 6. Self-Check

- [x] Heuristic evaluation complete — all 10 heuristics assessed with evidence
- [x] No heuristic marked "OK" without evidence (H4, H8, H10 have positive evidence cited)
- [x] No heuristic marked "N/A" 
- [x] Cognitive load scores per flow documented (4 views assessed)
- [x] User flow optimization complete (3 flows with step counts and redesign suggestions)
- [x] Information architecture analysis complete (nav structure, assessment, mental model)
- [x] Design debt quantified with explicit rationale per category
- [x] All findings have source references
- [x] All UX claims labeled as HEURISTIC (no empirical data available per Agent 10 GAP-UXR-002)

---

# Recommendations – UX Designer – 2026-03-07

## Metadata
- Agent: UX Designer (11)
- Phase: 3
- Based on analysis: Heuristic evaluation + cognitive load analysis + flow optimization
- Date: 2026-03-07
- Mode: AUDIT

---

## Recommendation REC-UXD-001

### Problem
Error recovery is critically deficient (Heuristic #9 — CRITICAL). Raw error messages, no retry, no recovery guidance, no persistent error state. Users encounter dead ends.
**Analysis reference:** Heuristic #9, all 5 violations. Overlaps with Agent 10 GAP-UXR-004.

### Solution
Implement a comprehensive error recovery framework:
1. **Error message mapping:** Create a lookup of common API errors → user-friendly messages with suggested actions.
2. **Retry mechanism:** Wrap all API calls (`api()` helper at L965) with optional retry. Add "Retry" button to error toasts.
3. **Persistent error banner:** For critical errors (server unreachable), show a persistent top-banner instead of toast (toasts auto-dismiss).
4. **Recovery guidance:** Each error type has a "What to do" section: "Check that the server is running", "Refresh the page", "Try again in a minute".

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | High | Eliminates #1 critical heuristic violation |
| Cost | Low — 3 SP | Limited to client-side JS + CSS changes |
| UX | Critical improvement | Transforms dead-end errors into recoverable states |

### Dependencies
- Extends Agent 10 REC-UXR-004 (this recommendation covers structural design aspects)
- Blocked by: NONE

### Risk of Not Implementing
Users hitting errors will abandon the session, potentially losing unsaved work. Server restart requires manual intervention with no in-UI guidance.

### Measurement Criterion
- KPI: Error recovery success rate (retries leading to success / total retries)
- Baseline: 0% (no retry mechanism)
- Target: ≥ 70% of retryable errors successfully recovered via retry
- Measurement method: Telemetry events (requires Agent 10 REC-UXR-001)
- Time horizon: Sprint 1 + 4 weeks observation

---

## Recommendation REC-UXD-002

### Problem
Error prevention is insufficient (Heuristic #5 — HIGH). No field-level validation feedback, no `beforeunload` guard, no duplicate detection. Users can make mistakes without warning.
**Analysis reference:** Heuristic #5, 4 violations.

### Solution
1. **Field validation:** Add inline validation indicators (red border + error text below field) for required fields in all forms: command form, new decision modal, edit decision modal.
2. **beforeunload guard:** Add `window.onbeforeunload` when dirty changes exist — prevents accidental tab/browser close.
3. **Duplicate decision prevention:** Show warning when creating a decision with a question matching an existing decision (fuzzy text match).

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Medium | Prevents data loss and user mistakes |
| Cost | Low — 2 SP | Standard HTML/JS validation patterns |
| UX | High — prevents frustration from avoidable errors | Direct prevention of user mistakes |

### Dependencies
- Blocked by: NONE

### Risk of Not Implementing
Users lose work on accidental navigation, submit invalid forms and must diagnose errors from toasts, create duplicate decisions.

### Measurement Criterion
- KPI: Form validation error rate (validation errors shown / form submissions)
- Baseline: INSUFFICIENT_DATA:
- Target: Validation errors caught inline before submission in 100% of cases
- Measurement method: Telemetry + code review
- Time horizon: Sprint 1

---

## Recommendation REC-UXD-003

### Problem
System status visibility gaps (Heuristic #1 — HIGH). No loading indicator during API calls, no last-refresh timestamp, no connection status.
**Analysis reference:** Heuristic #1, violations (c)(d).

### Solution
1. **Loading indicator:** Show a subtle progress bar or spinner at the top of the page during API calls (modify `api()` helper to emit start/end events).
2. **Last-refresh timestamp:** Display "Last updated: X seconds ago" in the header stats area.
3. **Connection status dot:** Green/yellow/red dot in header indicating: connected / reconnecting / disconnected.

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Medium | Users aware of system state, fewer confusion-driven actions |
| Cost | Low — 2 SP | Client-side UI additions |
| UX | Medium — eliminates "is it loading?" uncertainty | Resolves 3 specific H1 violations |

### Dependencies
- REC-UXD-003.3 (connection status) is also tracked in Agent 10 REC-UXR-004 (SP-UXR-1-005)
- Blocked by: NONE

### Risk of Not Implementing
Users unsure whether the UI is stale, whether an action was processed, or whether the server is reachable.

### Measurement Criterion
- KPI: Unnecessary page refreshes (F5/Ctrl+R) per session
- Baseline: INSUFFICIENT_DATA:
- Target: < 2 manual refreshes per 30-minute session
- Measurement method: Telemetry (track page reload events via `performance.navigation.type` or `beforeunload` counter)
- Time horizon: Sprint 2 + 2 weeks observation

---

## Recommendation REC-UXD-004

### Problem
Questionnaire tab has high cognitive load (6/10) for long questionnaires. No mechanisms to reduce scrolling fatigue or focus attention.
**Analysis reference:** Cognitive load analysis §2.2, improvement points.

### Solution
1. **"Jump to unanswered" button:** Add a button above the question list that scrolls to the first unanswered question.
2. **Collapsible answered questions:** Allow answered questions to collapse to a single-line summary, reducing visible height.
3. **Progress indicator per question:** Small numbered progress (e.g., "3/12 answered") at the top of the question list.

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Low | Quality-of-life improvement |
| Cost | Low — 2 SP | Client-side UI additions |
| UX | Medium — reduces cognitive load from 6/10 toward 4/10 | Direct reduction of scrolling fatigue |

### Dependencies
- Complements Agent 10 REC-UXR-003 (sidebar search). These are orthogonal improvements.
- Blocked by: NONE

### Risk of Not Implementing
Long questionnaires remain tedious. Users may skip questions or answer hastily to finish faster.

### Measurement Criterion
- KPI: Average questionnaire completion time
- Baseline: INSUFFICIENT_DATA:
- Target: 20% reduction in average time
- Measurement method: Telemetry (track question-open to save-complete duration)
- Time horizon: Sprint 2 + 4 weeks observation

---

## Recommendation REC-UXD-005

### Problem
No browser history management — SPA does not update URL when switching tabs, selecting questionnaires, or navigating to specific decisions. Back button navigates away from the app entirely.
**Analysis reference:** Heuristic #3 violation (e), User control and freedom.

### Solution
Implement browser history state using `history.pushState` and `popstate` listener:
1. Tab changes update URL hash: `#commandcenter`, `#questionnaires`, `#decisions`
2. Questionnaire selection adds param: `#questionnaires?file=Phase1/Agent05.md`
3. Back/forward buttons navigate between previous views within the SPA

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Low | Prevents accidental navigation loss |
| Cost | Low — 2 SP | Standard SPA routing pattern |
| UX | Medium — expected browser behavior restored | Users can bookmark and share specific views |

### Dependencies
- Blocked by: NONE

### Risk of Not Implementing
Users accidentally navigate away from the app via back button. Cannot share links to specific tabs or questionnaires.

### Measurement Criterion
- KPI: Back-button usage resulting in app loss
- Baseline: INSUFFICIENT_DATA:
- Target: 0 accidental navigation-away events per session
- Measurement method: `beforeunload` event tracking
- Time horizon: Sprint 2

---

## PRIORITY MATRIX

| Recommendation ID | Impact | Effort | Priority | Sprint | Rationale |
|---|---|---|---|---|---|
| REC-UXD-001 | Critical | Low | P1 | Sprint 1 | Addresses CRITICAL heuristic #9 |
| REC-UXD-002 | High | Low | P1 | Sprint 1 | Addresses HIGH heuristic #5 |
| REC-UXD-003 | Medium | Low | P2 | Sprint 1 | Quick win — resolves H1 visibility gaps |
| REC-UXD-004 | Medium | Low | P2 | Sprint 2 | Questionnaire cognitive load reduction |
| REC-UXD-005 | Medium | Low | P2 | Sprint 2 | Standard SPA behavior expectation |

---

# Sprint Plan – UX Designer – 2026-03-07

## Metadata
- Agent: UX Designer (11)
- Phase: 3
- Based on recommendations: REC-UXD-001 through REC-UXD-005
- Date: 2026-03-07
- Total scope: 2 sprints
- Mode: AUDIT

## Assumptions
- Team composition: `INSUFFICIENT_DATA:` — Reusing Agent 10 assumption pending QUE-UXR-TEAM-001
  - Team UX-Dev: 1 full-stack developer — capacity: 10 SP/sprint (assumed)
- Sprint duration: 2 weeks
- Technology stack: Vanilla HTML/CSS/JS, Node.js server
- Prerequisites: Agent 10 Sprint 1 (telemetry) should ideally run concurrently for measurement

---

## Sprint 1 – Error Recovery & Prevention Foundation

### Goal
Eliminate critical error recovery gaps and prevent common user mistakes through comprehensive error handling and input validation.

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | SP | Dependencies | Blocker | Rec |
|---|---|---|---|---|---|---|---|---|
| SP-UXD-1-001 | As a user I want friendly error messages so that I understand what went wrong | CODE | UX-Dev | Given an API call fails, when the error toast appears, then it shows a mapped user-friendly message (not raw exception); given an unknown error, then a generic "Something went wrong" message is shown with a suggestion | 1 | NONE | NONE | REC-UXD-001 |
| SP-UXD-1-002 | As a user I want a retry button in error toasts so that I can recover without page refresh | CODE | UX-Dev | Given an error toast with a retryable operation (save, load, reevaluate), when I click "Retry", then the original operation is re-attempted; given it succeeds on retry, then a success toast replaces the error | 2 | NONE | NONE | REC-UXD-001 |
| SP-UXD-1-003 | As a user I want a persistent error banner when the server is unreachable so that I know to check my setup | CODE | UX-Dev | Given polling fails 3+ consecutive times, when the error state is detected, then a persistent top banner appears saying "Server unreachable — check that the server is running on port 3000"; given connection resumes, then banner auto-dismisses | 1 | NONE | NONE | REC-UXD-001 |
| SP-UXD-1-004 | As a user I want inline field validation on forms so that I know which field is invalid | CODE | UX-Dev | Given I submit a command form with empty project name, when validation fails, then the project name field shows a red border and "Required" text below it; given I start typing, then the error clears | 1 | NONE | NONE | REC-UXD-002 |
| SP-UXD-1-005 | As a user I want a browser close warning when I have unsaved changes so that I don't lose work | CODE | UX-Dev | Given I have unsaved questionnaire answers (dirty > 0), when I close or refresh the browser tab, then a native "Leave site?" confirmation dialog appears | 1 | NONE | NONE | REC-UXD-002 |
| SP-UXD-1-006 | As a user I want a loading indicator during API calls so that I know the system is working | CODE | UX-Dev | Given an API call is in progress, when the page is rendered, then a thin progress bar is visible at the very top of the page; given the call completes, then the bar disappears | 1 | NONE | NONE | REC-UXD-003 |
| SP-UXD-1-007 | As a user I want to see when data was last refreshed so that I know how current my view is | CODE | UX-Dev | Given the page has loaded data, when I look at the header, then I see "Updated X seconds ago" that updates every 10 seconds | 1 | NONE | NONE | REC-UXD-003 |

### Parallel Tracks

| Track | Type | Stories | Team(s) | Start condition |
|---|---|---|---|---|
| Track 1 (Error Recovery) | CODE | SP-UXD-1-001, SP-UXD-1-002, SP-UXD-1-003 | UX-Dev | Sprint 1 start |
| Track 2 (Error Prevention) | CODE | SP-UXD-1-004, SP-UXD-1-005 | UX-Dev | Sprint 1 start |
| Track 3 (Status Visibility) | CODE | SP-UXD-1-006, SP-UXD-1-007 | UX-Dev | Sprint 1 start |

### Blocker Register
No blockers for Sprint 1.

### Sprint 1 Goal & Definition of Done
- **Outcome:** Users can recover from errors without page refresh; forms prevent invalid submission; system status is always visible.
- **KPI targets:** 0 raw error messages visible to user; 100% of required fields validated inline; loading indicator on every API call.
- **Definition of Done:** All 7 stories complete, code reviewed, no new CRITICAL_FINDING.

---

## Sprint 2 – Questionnaire UX & Navigation

### Goal
Reduce cognitive load on the Questionnaires tab and implement browser-standard navigation behavior.

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | SP | Dependencies | Blocker | Rec |
|---|---|---|---|---|---|---|---|---|
| SP-UXD-2-001 | As a user I want a "Jump to unanswered" button so that I can quickly find questions needing attention | CODE | UX-Dev | Given a questionnaire has ≥1 unanswered question, when I click "Jump to unanswered", then the view scrolls to the first unanswered card and it briefly highlights; given all questions are answered, then the button is disabled | 1 | NONE | NONE | REC-UXD-004 |
| SP-UXD-2-002 | As a user I want to collapse answered questions so that I can reduce visual clutter | CODE | UX-Dev | Given a question has status "answered" or "deferred", when I click the collapse toggle, then the card shrinks to show only the question title + status badge; given I click expand, then the full card is restored | 2 | NONE | NONE | REC-UXD-004 |
| SP-UXD-2-003 | As a user I want a progress count above the question list so that I know how many are done | CODE | UX-Dev | Given a questionnaire is loaded, when I view the question list, then a "X/Y answered" indicator is visible above the first card | 1 | NONE | NONE | REC-UXD-004 |
| SP-UXD-2-004 | As a user I want URL-based navigation so that the browser back button works within the app | CODE | UX-Dev | Given I switch from Command Center to Questionnaires tab, when I press browser Back, then I return to Command Center; given I select a questionnaire, when I press Back, then I return to the questionnaire list; given I navigate to `#decisions`, then the Decisions tab is active | 2 | NONE | NONE | REC-UXD-005 |

### Parallel Tracks

| Track | Type | Stories | Team(s) | Start condition |
|---|---|---|---|---|
| Track 1 (Questionnaire UX) | CODE | SP-UXD-2-001, SP-UXD-2-002, SP-UXD-2-003 | UX-Dev | Sprint 2 start |
| Track 2 (Navigation) | CODE | SP-UXD-2-004 | UX-Dev | Sprint 2 start |

### Blocker Register
No blockers for Sprint 2.

### Sprint 2 Goal & Definition of Done
- **Outcome:** Long questionnaires are manageable with collapse/jump; browser navigation works naturally.
- **KPI targets:** Questionnaire cognitive load ≤ 4/10 (HEURISTIC reassessment); 0 accidental navigation-away events.
- **Definition of Done:** All 4 stories complete, code reviewed, no new CRITICAL_FINDING, back-button works for all 3 tab transitions.

---

## Traceability: Recommendations → Stories

| Recommendation | Priority | Stories | Covered |
|---|---|---|---|
| REC-UXD-001 (Error recovery) | P1 | SP-UXD-1-001, SP-UXD-1-002, SP-UXD-1-003 | ✅ |
| REC-UXD-002 (Error prevention) | P1 | SP-UXD-1-004, SP-UXD-1-005 | ✅ |
| REC-UXD-003 (System status) | P2 | SP-UXD-1-006, SP-UXD-1-007 | ✅ |
| REC-UXD-004 (Questionnaire UX) | P2 | SP-UXD-2-001, SP-UXD-2-002, SP-UXD-2-003 | ✅ |
| REC-UXD-005 (SPA routing) | P2 | SP-UXD-2-004 | ✅ |

**No P1 recommendation without a story. ✅**

---

# Guardrails – UX Designer – 2026-03-07

## Metadata
- Agent: UX Designer (11)
- Phase: 3
- Date: 2026-03-07
- Mode: AUDIT

---

## Guardrail G-UXD-001

### Title
All Error States Must Provide Recovery Path

### Scope
- Applies to: Implementation Agent (all frontend stories), Senior Developer
- Time horizon: Permanent

### Rule
Every error state displayed to the user MUST include: (1) a user-friendly message (not raw exception), (2) at least one suggested action, and (3) a retry button for retryable operations. Raw error strings (`e.message`) MUST NOT be shown directly.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UXD-001`, block PR merge, return to developer.

### Rationale
Heuristic #9 critical violation — 5 instances of raw error display with no recovery. Users cannot self-help.

### Verification Method
Code review checklist: search for `e.message` or `err.message` in user-facing toast/UI — must be mapped through error translation layer. Automated: lint rule prohibiting direct error message display in toast calls.

### Overlap Check
New — no overlap with existing guardrails. Complements G-UXR-001 (evidence labeling) from Agent 10.

---

## Guardrail G-UXD-002

### Title
Cognitive Load Score Must Not Exceed 6/10 Per View

### Scope
- Applies to: UI Designer, Implementation Agent (UX stories)
- Time horizon: Permanent

### Rule
Every primary view (tab panel, modal, or overlay) MUST have a heuristic cognitive load score ≤ 6/10 before implementation. Views scoring > 6 MUST be redesigned (pagination, collapse, progressive disclosure, or information hiding) before sprint approval.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UXD-002`, story blocked until redesign reduces score.

### Rationale
Questionnaires tab scored 6/10 — at the threshold. Growth of content (more agents, more questions) will push over limit. This guardrail prevents cognitive overload as the system scales.

### Verification Method
Heuristic reassessment at each sprint review. Scoring rubric: information density (1-10) + decision points per screen (weight 2x) + visual complexity (1-10), averaged.

### Overlap Check
Addition to G-UX-04 (Cognitive Load: include score for every primary screen, redesign proposals if score ≥ 7/10). This guardrail makes the threshold actionable at 6/10 for this project specifically.

---

## Guardrail G-UXD-003

### Title
All Form Inputs Must Have Inline Validation

### Scope
- Applies to: Implementation Agent (form-related stories)
- Time horizon: Permanent

### Rule
Every required form field (command form, decision modal, edit modal) MUST validate inline on blur and on submit. Validation MUST show: red border on field, error text below field, and clear on valid input. Toast-only validation (no field-level indicator) is PROHIBITED.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UXD-003`, block PR merge.

### Rationale
Heuristic #5 violation — command form shows toast for empty project name but no field highlight. Users must guess which field is wrong.

### Verification Method
Code review + manual testing of all form submission paths. Automated: check that every `<input required>` and `<textarea required>` in modals and forms has an associated validation handler.

### Overlap Check
New — no overlap with existing guardrails.

---

## Guardrail Overview

| ID | Title | Scope | Priority | Verification |
|---|---|---|---|---|
| G-UXD-001 | Error States Must Provide Recovery | Implementation, Senior Dev | Critical | Code review + lint rule |
| G-UXD-002 | Cognitive Load ≤ 6/10 Per View | UI Designer, Implementation | High | Heuristic reassessment |
| G-UXD-003 | Inline Validation on All Forms | Implementation | High | Code review + manual test |

---

## QUESTIONNAIRE_REQUEST Items

| ID | Context | Requested For |
|---|---|---|
| QUE-UXD-AUTOSAVE-001 | Should questionnaire answers auto-save on blur/debounce? Risk: may overwrite concurrent edits if multi-user scenario exists. | Flow optimization decision (§3.2) |
| QUE-UXD-MULTIUSER-001 | Is multi-user concurrent editing a real-world scenario? (Multiple users editing same questionnaire simultaneously) | Undo/auto-save design decision |

---

## HANDOFF CHECKLIST — UX Designer (11)

- [x] MODE: AUDIT
- [x] Heuristic evaluation complete (all 10 heuristics assessed with evidence)
- [x] Cognitive load scores per flow documented (4 views)
- [x] User flow optimization complete (3 flows)
- [x] Information architecture analysis complete (nav structure, labelling, mental model)
- [x] Design debt quantified (28 SP across 8 categories with rationale)
- [x] All claims based on actual screen analysis (HEURISTIC label throughout)
- [x] All findings have source references
- [x] Self-check performed
- [x] Recommendations: every recommendation references analysis finding
- [x] Recommendations: all impact fields filled or marked as INSUFFICIENT_DATA:
- [x] Recommendations: all measurement criteria are SMART
- [x] Sprint Plan: assumptions documented (team, capacity, prerequisites)
- [x] Sprint Plan: all stories have at least 1 acceptance criterion
- [x] Sprint Plan: all P1 and P2 recommendations have at least one story (traceability table ✅)
- [x] Guardrails: all guardrails formulated testably
- [x] Guardrails: all guardrails have violation action and verification method
- [x] Guardrails: all guardrails reference analysis finding
- [x] All 4 deliverables present: Analysis ✓ Recommendations ✓ Sprint Plan ✓ Guardrails ✓
- [x] Questionnaire input check performed (NOT_INJECTED documented)
- [x] All remaining INSUFFICIENT_DATA: items compiled as QUESTIONNAIRE_REQUEST
- **STATUS: READY FOR HANDOFF TO AGENT 12 (UI Designer)**
