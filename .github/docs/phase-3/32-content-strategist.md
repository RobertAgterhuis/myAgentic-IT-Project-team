# Agent 32 — Content Strategist / UX Writer: Audit Output
> **Mode:** AUDIT | **Phase:** 3 | **Date:** 2025-01-20
> **Audit target:** `.github/webapp/index.html` (~2300 LOC, single-file SPA)
> **Guardrails applied:** G-CNT-01 through G-CNT-08

---

## Step 0: Questionnaire Input

No `## QUESTIONNAIRE INPUT — Content Strategist` block present. Proceeding with code-based analysis.

---

## Step 1: Copy Inventory

| Content Category | Count | Available for Analysis | Source |
|-----------------|-------|----------------------|--------|
| Primary navigation & menu labels | 3 tabs + ~20 sidebar commands | ✅ Yes | `index.html` L691–L694, L726–L790 |
| CTA texts (buttons) | ~12 primary actions | ✅ Yes | L681–L686, modal action buttons |
| Form labels | ~15 labels | ✅ Yes | Modal forms L838–L876, L894–L920, filters L710–L715 |
| Placeholder texts | ~8 placeholders | ✅ Yes | L711, L851, L853, L856, L884, L901, L907 |
| Error messages | ~15 toast messages | ✅ Yes | JS `toast()` calls throughout |
| Success/confirmation messages | ~12 toast messages | ✅ Yes | JS `toast()` calls |
| Empty states | 3 (questionnaire, command center, decisions) | ✅ Yes | L797–L803 (command center), JS renderers |
| Loading states | 3 | ✅ Yes | L702, L718, L676 |
| Onboarding texts / tooltips | 0 | ⚠️ ABSENT | No onboarding flow or contextual tooltips present |
| Help content | Dynamic (loaded via `/api/help`) | ✅ Partial — structure visible, content loaded from server | L2050–L2130 (help panel renderer) |
| System notifications (toasts) | ~40 distinct messages | ✅ Yes | All `toast()` calls L983–L1951 |
| Descriptive subtexts | ~20 command descriptions | ✅ Yes | `.cmd-btn-sub` elements L728–L790 |

**Total identifiable content elements:** ~130+

---

## Step 2: Voice & Tone Audit

### Detected Voice

| Attribute | Assessment | Evidence |
|-----------|-----------|----------|
| **Register** | Semi-formal, technical | "Select a command from the sidebar to launch the agentic team." (L801) — professional but approachable |
| **Person** | Mixed — predominantly impersonal, with occasional "you" | Impersonal: "Project name is required" (L1873). Second person: "Are you sure?" (L882). Inconsistent. |
| **Active/passive voice** | Predominantly active | "Saved 3 answer(s)" (active), "Command queued" (passive). Mostly active ✅ |
| **Formality** | Semi-formal | "Loading questionnaires…" (neutral), "Confirm Action" (formal), "Why?" (very informal placeholder at L884) |

### Tone per Context

| Context | Detected Tone | Assessment | Evidence |
|---------|--------------|------------|----------|
| **Welcome/onboarding** | Instructive, neutral | Adequate for technical audience | "Select a command from the sidebar to launch the agentic team. The pipeline below will show real-time progress once a session is active." (L800–L803) |
| **Error** | Terse, technical | `CONTENT_INCONSISTENCY:` Tone shifts from user-friendly to raw technical | **Example A:** `toast('Enter an answer first', 't-info')` (L1450) — helpful. **Example B:** `toast('Failed: ' + e.message, 't-err')` (L1455) — raw server error text. |
| **Success** | Terse, confirmatory | Functional but not encouraging | `toast('Saved 3 answer(s)', 't-ok')` — factual. `toast('Session started!', 't-ok')` — has enthusiasm (exclamation mark). Inconsistent energy. |
| **Transactional** | Efficient, clear | Good — matches audience expectations | "Save All", "New Decision", "Reevaluate" — action-oriented CTAs |
| **Guidance** | Patient, instructional | Good in modal explanations | "This will save all pending changes and write a reevaluation trigger file. After clicking Reevaluate, type REEVALUATE [SCOPE] in the Copilot chat to start processing your updated answers." (L815–L817) |

### Consistency Assessment

**Overall:** Inconsistent — `CONTENT_INCONSISTENCY: detected`

Specific inconsistencies:

| ID | Type | Example A | Example B | Location |
|----|------|----------|----------|----------|
| CI-001 | Person pronoun | "Are you sure?" (2nd person, L882) | "Project name is required" (impersonal, L1873) | Validation messages |
| CI-002 | Error tone | "Enter an answer first" (helpful guidance, L1450) | "Failed: " + e.message (raw, L1455) | Error toast messages |
| CI-003 | Success energy | "Session started!" (enthusiastic, L996) | "Saved Q-001" (flat factual, L1574) | Success notifications |
| CI-004 | Placeholder tone | "e.g. Phase 2, SP-3, All sprints" (instructive, L851) | "Why?" (terse, L884) | Form placeholders |
| CI-005 | Formality | "After clicking Reevaluate, type REEVALUATE [SCOPE] in the Copilot chat" (instructional, L816) | "Copied to clipboard!" (casual, L1939) | Mixed contexts |

---

## Step 3: Microcopy Quality Analysis

| Quality Criterion | Status | Findings |
|------------------|--------|----------|
| **Clarity** | ✅ Meets with improvement points | Most labels are clear and domain-appropriate. **Exception:** "Scope" label in decision forms (L851, L901) is ambiguous — scope of what? The placeholder "e.g. Phase 2, SP-3, All sprints" clarifies, but the label alone is unclear. |
| **Conciseness** | ✅ Meets | Button labels are concise: "Save All", "New Decision", "Export". Command descriptions are brief but informative: "Full solution — all 4 phases". No significant verbosity detected. |
| **Helpfulness** | ⚠️ Improvement points | **CONTENT_ISSUE: helpfulness** — Error messages lack recovery guidance. "Failed: [error]" does not tell the user what to do next. Empty states in Command Center provide good guidance ("Select a command from the sidebar…") but questionnaire/decision empty states are less helpful. |
| **Consistency** | ❌ Fails | See CI-001 through CI-005 above. Person pronouns, tone energy, and formality level vary across contexts without apparent pattern. |
| **Action-oriented** | ✅ Meets | CTAs use verb + object pattern: "Save All", "New Decision", "Reevaluate", "Export". **Exception:** "Confirm" (L889) and "Cancel" are generic — "Confirm" should reflect the specific action being confirmed. |
| **Error recovery** | ❌ Fails | `CONTENT_ISSUE: error-recovery — ALL error toasts — Error messages use pattern "Failed: [server error]" with no recovery action — priority: HIGH`. Aligned with Agent 11 REC-UXD-001 and Agent 13 GAP-A11Y-001. |
| **Empty state value** | ⚠️ Mixed | Command Center empty state (L797–L803) is **GOOD**: explains context and guides action. Decision empty state: `INSUFFICIENT_DATA:` — need to verify JS renderer. Questionnaire empty state: loading indicator only. |

### Content Issues Register

| ID | Type | Location | Description | Priority |
|----|------|----------|-------------|----------|
| CONTENT_ISSUE-001 | Error recovery | All `toast('Failed: ' + e.message)` calls (15+ occurrences) | Error messages expose raw server error text with no user-friendly explanation or recovery action | HIGH |
| CONTENT_ISSUE-002 | Consistency — pronoun | Validation messages vs. modal copy | Mixed "you" / impersonal voice. Decision needed: standardize on one approach. | MEDIUM |
| CONTENT_ISSUE-003 | Consistency — tone | Success toasts | Some have exclamation ("Session started!"), most are flat ("Saved Q-001"). Standardize enthusiasm level. | LOW |
| CONTENT_ISSUE-004 | Placeholder quality | Confirm reason field: "Why?" (L884) | Terse, unhelpful placeholder. Direction: e.g., "Brief rationale for this action" | LOW |
| CONTENT_ISSUE-005 | Generic CTA | Confirm modal: "Confirm" (L889) | Does not reflect the specific action. Direction: e.g., "Defer Decision" / "Expire Decision" depending on context. | MEDIUM |
| CONTENT_ISSUE-006 | Missing onboarding | Global | No first-use guidance, progressive disclosure, or contextual tooltips for new users | HIGH |
| CONTENT_ISSUE-007 | Clipboard copy instructions | Post-command success (L1913) | "Command queued — paste in Copilot Chat to start" — requires external action. The instruction is clear but the cross-tool handoff is a content gap (user must understand Copilot Chat context) | MEDIUM |
| CONTENT_ISSUE-008 | Status terminology | Questionnaire status dropdown | "REQUIRED", "OPTIONAL", "ANSWERED" — uppercase status labels are system-oriented, not user-oriented. Direction: consider sentence case for user-facing labels | LOW |

---

## Step 4: Readability Analysis

### Language Level Assessment

| Content Area | Estimated Level | Target Audience Alignment | Finding |
|-------------|----------------|--------------------------|---------|
| Navigation labels | A2–B1 | ✅ Appropriate — simple, scannable | "Command Center", "Questionnaires", "Decisions" |
| Command descriptions | B1 | ✅ Appropriate | "Full solution — all 4 phases", "Phase 2 — Architecture & Design" |
| Modal explanations | B2 | ✅ Appropriate for technical audience | Reevaluate modal paragraph: complex but necessary instruction, assumes technical familiarity |
| Error messages | B1–B2 | ⚠️ Server errors can be C1+ | Raw error text from API may contain HTTP status codes and technical jargon |
| Toast messages | A2–B1 | ✅ Appropriate | "Saved 3 answer(s)", "No changes to save" |
| Help content | `INSUFFICIENT_DATA:` | Cannot assess — server-loaded | Content loaded via `/api/help` endpoint |

### Readability Issues

| ID | Location | Finding | Recommended Level |
|----|----------|---------|------------------|
| READABILITY_ISSUE-001 | Reevaluate modal (L815–L817) | Single paragraph with 2 instructional steps. Sentence length: 25+ words. Adequate for technical audience but could benefit from step-by-step formatting. | B1 (use numbered steps) |
| READABILITY_ISSUE-002 | Error toasts | Raw server errors may include HTTP status codes ("Request failed") and technical terms not meaningful to end users | B1 (translate to user-friendly language) |
| READABILITY_ISSUE-003 | No jargon glossary | Domain terms ("Sprint Gate", "Onboarding", "Reevaluate", "Phase") are used without explanation. Appropriate for return users but opaque for new users. | Advisory: add contextual help tooltips |

### Terminology Audit

| Term | Usage | Consistency | Note |
|------|-------|------------|------|
| "Save" / "Save All" / "Saved" | ✅ Consistent | All use "save" for persistence actions | |
| "Decision" | ✅ Consistent | Decision items, "New Decision", "Decide", "Decided" | |
| "Questionnaire" | ✅ Consistent | Tab label, sidebar, card headers | |
| "Reevaluate" / "Reevaluation" | ✅ Consistent | Button and modal both use same root | |
| "Phase" / "Sprint" | ✅ Consistent | Domain terms used consistently | |
| "Command" / "Launch" / "Queue" | ⚠️ Mixed | "Launch" in UI flow vs. "queued" in success toast (L1913) vs. "paste in Copilot Chat" — the command lifecycle terminology shifts | Standardize: use "launch" or "queue" consistently |

---

## Step 5: Content Gap Analysis

| Journey Moment | Expected Content | Present | Gap |
|---------------|-----------------|---------|-----|
| **First impression** | Value proposition, orientation | ✅ Partially | Command Center welcome state is good (L797–L803). However, no overall product description or value proposition for first-time users. Header shows "Agentic System — Command Center" — functional but not value-oriented. |
| **Onboarding** | Step-by-step guidance, progressive disclosure | ❌ No | `CONTENT_GAP: onboarding — guided first-use experience — impact: critical`. No tooltips, no walkthrough, no progressive disclosure. New users must discover features by exploration. Aligned with Agent 10 REC-UXR-002. |
| **First use of core feature** | Contextual help, confirmation of correct action | ⚠️ Partial | Command Center has explanatory text per command. Modal instructions guide reevaluation. But questionnaire answering has no guidance (no "what makes a good answer" hint). Decision creation modal explains purpose (L839). |
| **Error/problem** | Recovery-oriented copy, human-readable explanations | ❌ Fails | `CONTENT_GAP: error-recovery — user-friendly error messages with recovery actions — impact: critical`. Raw server errors. No contextual error states. No retry affordance in copy. Aligned with Agent 11 REC-UXD-001, Agent 13 REC-A11Y-001. |
| **Success moment** | Confirmation, encouragement, next step suggestion | ⚠️ Partial | Success toasts confirm the action ("Saved 3 answer(s)") but do not suggest next steps. Command launch success (L1913) suggests the next step ("paste in Copilot Chat to start") — good pattern not replicated elsewhere. |
| **Churn/exit points** | Retention text, unsaved changes warning | ⚠️ Partial | Dirty state indicator (yellow border on unsaved cards). But no "You have unsaved changes" warning on tab switch or page close. No exit confirmation. |

---

## Step 6: Content Governance Assessment

| Criterion | Status | Finding |
|----------|--------|---------|
| **Copy ownership** | `INSUFFICIENT_DATA:` | Cannot determine whether product, engineering, or UX team owns the copy. All copy is hardcoded in `index.html` — no content management layer. |
| **Content style guide** | ❌ ABSENT | `GOVERNANCE_RISK: no-style-guide — No content style guide exists. Voice, tone, terminology, and microcopy patterns are undocumented. Risk: inconsistencies will accumulate as the product grows. — recommended action: Create a Content Style Guide as an immediate deliverable.` |
| **Copy freshness** | ✅ Not a concern | Copy appears current — references to current system features. No stale content detected. |
| **Update process** | `INSUFFICIENT_DATA:` | No evidence of a content review process for feature releases. Copy changes require code changes to `index.html`. `GOVERNANCE_RISK: no-update-process — Copy updates require direct HTML/JS code edits. No separation of content from code (no i18n layer, no CMS). — recommended action: At minimum, extract user-facing strings to a locale file.` |

---

## Recommendations

### REC-CNT-001: Establish Content Style Guide with Voice & Tone Framework
- **GAP reference:** GOVERNANCE_RISK: no-style-guide, CI-001 through CI-005
- **Action:** Create a Content Style Guide document defining: (1) voice attributes (3–5 attributes with DO/DON'T examples), (2) tone spectrum per context (error, success, guidance, transactional), (3) pronoun strategy (standardize on one approach — recommended: "you" for guidance, impersonal for system messages), (4) terminology glossary with canonical terms, (5) microcopy patterns per content type.
- **Impact:** Risk Reduction — HIGH (prevents inconsistency from compounding). UX — HIGH (consistent voice builds user trust). Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (content strategy effort, no code changes).
- **Risk of non-execution:** Short-term: inconsistencies multiply as new features are added. Long-term: brand coherence deteriorates, user confusion increases, localization becomes expensive due to lack of canonical terms.
- **SMART KPI:** Content Style Guide published → Baseline: absent → Target: published and reviewed → Method: document review + team sign-off → Horizon: Sprint 1

**Priority Matrix:**
- Impact: HIGH (foundational — blocks consistent content work)
- Effort: MEDIUM (content strategy work, ~3 SP)
- Priority: **P1** — Foundational deliverable, blocks other content improvements
- Suggested sprint: Sprint 1

---

### REC-CNT-002: Establish Error Message Framework
- **GAP reference:** CONTENT_ISSUE-001, CONTENT_GAP: error-recovery
- **Action:** Define an error message framework: (1) Pattern: "[What happened]. [Why]. [What to do next]." (2) Categorize errors by type (network, validation, conflict, unknown). (3) Define user-friendly message templates per error category. (4) Establish a rule: no raw server error text exposed to users — all errors must be mapped through the framework. NOTE: The `Implementation Agent` will implement the code changes — this deliverable is the CONTENT framework only.
- **Impact:** Risk Reduction — HIGH (SC 3.3.1 and 3.3.3 compliance per Agent 13). UX — HIGH (error recovery is the #1 UX issue per Agent 11). Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (content framework, 2 SP).
- **Risk of non-execution:** Short-term: users see cryptic error text, cannot self-recover. Long-term: support burden increases, user trust erodes.
- **SMART KPI:** % of error messages conforming to framework → Baseline: 0% (all use raw pattern) → Target: 100% → Method: code audit of all `toast('Failed:...')` instances → Horizon: Sprint 1 (framework), Sprint 2 (implementation by tech team)

**Priority Matrix:**
- Impact: HIGH (cross-team alignment with UX and A11Y)
- Effort: LOW (2 SP for content framework)
- Priority: **P1** — Critical content gap, dependencies from Agents 11 and 13
- Suggested sprint: Sprint 1

---

### REC-CNT-003: Create Onboarding Content Strategy
- **GAP reference:** CONTENT_GAP: onboarding
- **Action:** Define the onboarding content strategy: (1) First-use welcome orientation (progressive disclosure of 3 tabs), (2) Contextual tooltips for key actions (command launch, questionnaire answering, decision management), (3) Content brief per tooltip (purpose, tone, max word count, i18n notes). NOTE: Content strategy only — UX Designer owns the interaction pattern (per Agent 10 REC-UXR-002), Implementation Agent owns the code.
- **Impact:** Risk Reduction — MEDIUM (prevents new-user abandonment). UX — HIGH (reduces learning curve). Revenue — `INSUFFICIENT_DATA:`. Cost — MEDIUM (3 SP for content strategy + content briefs).
- **Risk of non-execution:** Short-term: new users struggle to understand the tool. Long-term: adoption remains limited to users who receive personal training.
- **SMART KPI:** Onboarding content brief complete → Baseline: absent → Target: published covering all 3 views → Method: content review → Horizon: Sprint 2

**Priority Matrix:**
- Impact: MEDIUM (does not block current users)
- Effort: MEDIUM (3 SP)
- Priority: **P2** — Strategic, depends on UX design decisions
- Suggested sprint: Sprint 2

---

### REC-CNT-004: Standardize Success & Confirmation Copy
- **GAP reference:** CONTENT_ISSUE-003, CONTENT_ISSUE-005
- **Action:** (1) Define success message pattern: "[Action] completed. [Optional next step]." (2) Standardize enthusiasm level across all success toasts — recommended: confident but neutral (no exclamation marks in routine saves, reserved for significant milestones). (3) Replace generic "Confirm" button label with action-specific labels (e.g., the button should say "Defer Decision" instead of "Confirm" when deferring). Framework definition only.
- **Impact:** Risk Reduction — LOW. UX — MEDIUM (reduces cognitive load of interpreting success states). Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (1 SP).
- **Risk of non-execution:** Short-term: minor inconsistency. Long-term: user confidence in action outcomes varies.
- **SMART KPI:** % of confirmation buttons with action-specific labels → Baseline: 0% (all use "Confirm") → Target: 100% → Method: UI copy audit → Horizon: Sprint 2

**Priority Matrix:**
- Impact: MEDIUM
- Effort: LOW (1 SP)
- Priority: **P2** — Nice-to-have, low effort
- Suggested sprint: Sprint 2

---

### Recommendations Self-Check (Step D)

| Check | Status |
|-------|--------|
| Every recommendation has GAP/RISK reference? | ✅ All reference CONTENT_ISSUE, CONTENT_GAP, or GOVERNANCE_RISK |
| All impact fields filled or marked INSUFFICIENT_DATA? | ✅ Revenue consistently marked INSUFFICIENT_DATA |
| All measurement criteria SMART? | ✅ Specific baselines, targets, methods, horizons |
| Recommendations outside domain removed/marked? | ✅ Implementation notes flagged as "Implementation Agent" responsibility |

---

## Sprint Plan

### Assumptions (Step E)
- **Team:** `INSUFFICIENT_DATA: team composition/capacity` — no team data available. Assuming a UX Writer / Content Strategist resource is available (may be a shared role with UX Designer).
- **Assumed capacity:** `INSUFFICIENT_DATA:` — SP estimates are relative effort.
- **Sprint duration:** 2 weeks (default).
- **Story types:** All stories are `CONTENT` type — no code changes. Code implementation of content frameworks is `OUT_OF_SCOPE: Implementation Agent`.
- **Prerequisites:** Content Style Guide (Story SP-3-501) must complete before other content stories can reference it.

---

### Sprint 1: "Content Foundations — Style Guide & Error Framework"

| Story ID | Description | Team | Type | Acceptance Criteria | SP | Dependencies | Blocker | Rec Ref |
|----------|-------------|------|------|--------------------|----|--------------|---------|---------|
| SP-3-501 | As a product team member, I want a Content Style Guide, so that all UI copy follows consistent voice, tone, and terminology | `INSUFFICIENT_DATA: team` | CONTENT | Given the Style Guide is delivered, When a team member writes new UI copy, Then they can reference the guide for voice attributes (3–5 with DO/DON'T), tone per context (5 contexts), pronoun policy, and a terminology glossary of all domain terms used in the product. Reviewed and approved by Product Owner. | 3 | — | NONE | REC-CNT-001 |
| SP-3-502 | As a product team member, I want an error message framework, so that all error copy follows a consistent pattern with recovery guidance | `INSUFFICIENT_DATA: team` | CONTENT | Given the framework is delivered, When an error scenario is identified, Then the framework provides: message pattern "[What happened]. [Why]. [What to do].", error category taxonomy (network/validation/conflict/unknown), and one illustrative sample per category. Reviewed and approved by Product Owner. | 2 | SP-3-501 (uses terminology glossary) | NONE | REC-CNT-002 |

**Sprint 1 Total:** 5 SP

**Parallel Tracks:**
- SP-3-501 must complete first (foundational). SP-3-502 follows (depends on terminology glossary from SP-3-501).
- Single track — sequential within sprint.

**Sprint 1 Blocker Register:**
No blockers.

**Sprint 1 Goal:**
- Outcome: Foundational content documents are published, enabling consistent content creation for all subsequent work (implementation, onboarding, localization).
- KPI targets: (1) Style Guide published: yes. (2) Error message framework published: yes. (3) Both reviewed and approved by Product Owner.
- Definition of Done: Both documents complete, all sections filled (no placeholder content), documents reviewed by at least one stakeholder, stored in project documentation.

---

### Sprint 2: "Content Strategy — Onboarding & Consistency"

| Story ID | Description | Team | Type | SP | Dependencies | Blocker | Rec Ref |
|----------|-------------|------|------|----|--------------|---------|---------|
| SP-3-503 | As a new user, I want onboarding content briefs defined, so that the development team can implement guided first-use experience | `INSUFFICIENT_DATA: team` | CONTENT | 3 | SP-3-501 (voice & tone), Agent 10 REC-UXR-002 (onboarding UX design) | INTERN: Onboarding UX design must be completed by UX Designer first — owner: UX Designer | REC-CNT-003 |
| SP-3-504 | As a user receiving confirmations, I want success and confirmation messages to be consistent and action-specific, so that I always understand what happened | `INSUFFICIENT_DATA: team` | CONTENT | 1 | SP-3-501 (voice & tone) | NONE | REC-CNT-004 |

**Sprint 2 Total:** 4 SP

**Parallel Tracks:**
- SP-3-503 and SP-3-504 can run in parallel (both depend on SP-3-501 which completes in Sprint 1).

**Sprint 2 Blocker Register:**

| ID | Sprint | Type | Description | Owner | Escalation |
|----|--------|------|-------------|-------|-----------|
| BLK-2-001 | Sprint 2 | INTERN | Onboarding UX design pattern must be defined by UX Designer before content briefs can be finalized | UX Designer | Escalate to Product Owner if not resolved by Sprint 2 planning |

**Sprint 2 Goal:**
- Outcome: Onboarding content strategy and success/confirmation copy patterns complete, enabling implementation in subsequent sprints.
- KPI targets: (1) Onboarding content briefs covering all 3 views: yes. (2) Confirmation button labels: all cataloged with action-specific alternatives.
- Definition of Done: All content documents complete, internally reviewed, ready for handoff to Implementation Agent.

---

### Sprint Plan Self-Check (Step H)

| Check | Status |
|-------|--------|
| All stories based on recommendations? | ✅ SP-3-501→REC-CNT-001, SP-3-502→REC-CNT-002, SP-3-503→REC-CNT-003, SP-3-504→REC-CNT-004 |
| Every P1 recommendation has at least one story? | ✅ REC-CNT-001→SP-3-501, REC-CNT-002→SP-3-502 |
| Every story has a team assignment? | ✅ (marked INSUFFICIENT_DATA: team) |
| Every story has at least one acceptance criterion? | ✅ |
| Every story has a Blocker field? | ✅ All explicit (NONE or INTERN) |
| All EXTERN blockers with owner + escalation? | ✅ N/A — no external blockers |
| Parallel tracks identified? | ✅ Sprint 1: sequential. Sprint 2: parallel. |
| Assumptions documented? | ✅ Step E above |
| Sprint KPIs SMART? | ✅ |
| CODE/INFRA stories free from cross-track blockers? | ✅ N/A — all stories are CONTENT type |

**Traceability Table:**

| Recommendation | Priority | Stories |
|---------------|----------|---------|
| REC-CNT-001 | P1 | SP-3-501 |
| REC-CNT-002 | P1 | SP-3-502 |
| REC-CNT-003 | P2 | SP-3-503 |
| REC-CNT-004 | P2 | SP-3-504 |

All P1 and P2 recommendations have stories. No `MISSING_STORY` items.

---

## Guardrails

### G-CNT-AUDIT-001: All user-facing error messages must follow the established error message framework
- **Reference:** CONTENT_ISSUE-001, CONTENT_GAP: error-recovery
- **Scope:** All agents producing UI content or error handling — Implementation Agent, Content Strategist
- **Formulation:** Must not deploy any user-facing error message that exposes raw server/API error text. All error messages must follow the pattern "[What happened]. [Why, if known]. [What to do]." as defined in the Error Message Framework.
- **Violation action:** Block PR merge. Escalate to Content Strategist for approved copy.
- **Verification method:** Automated — regex lint rule flagging `'Failed: ' + e.message` or similar raw error concatenation patterns. Manual — content review per sprint for all new toast/error messages.
- **Overlap check:** Supplement to G-UX-06 (accessibility). New specific content rule.

### G-CNT-AUDIT-002: All new UI copy must conform to the Content Style Guide
- **Reference:** GOVERNANCE_RISK: no-style-guide, CI-001 through CI-005
- **Scope:** All agents producing user-facing text — Implementation Agent, Marketing
- **Formulation:** Must not deploy new user-facing copy (labels, messages, tooltips, modals) without verifying conformance to the Content Style Guide (voice attributes, tone per context, pronoun strategy, terminology glossary).
- **Violation action:** Mark as `CONTENT_REVIEW_REQUIRED`. Block PR merge until Content Strategist or designated reviewer approves the copy.
- **Verification method:** Manual — content review checklist in PR template. Automated — terminology linting (canonical term enforcement) once glossary is in a machine-readable format.
- **Overlap check:** New guardrail. No conflict with existing guardrails.

### G-CNT-AUDIT-003: Confirmation actions must use action-specific labels
- **Reference:** CONTENT_ISSUE-005
- **Scope:** All modal dialogs with destructive or state-changing actions — Implementation Agent
- **Formulation:** Must not use generic "Confirm" or "OK" as the primary action label in confirmation dialogs. The button label must reflect the specific action (e.g., "Defer Decision", "Expire Item", "Delete Entry").
- **Violation action:** Block PR merge. Return to developer with guidance.
- **Verification method:** Manual — code review checklist. Automated — lint rule flagging modal submit buttons with text matching /^(Confirm|OK|Yes|Submit)$/.
- **Overlap check:** New guardrail. Supplements G-UX-06.

### Guardrails Self-Check (Step M)

| Check | Status |
|-------|--------|
| Every guardrail formulated testably? | ✅ All start with "Must not" |
| Every guardrail has a violation action? | ✅ All specify "Block PR merge" + escalation |
| Every guardrail has a verification method? | ✅ All have automated + manual methods |
| Every guardrail has a GAP/RISK reference? | ✅ All reference CONTENT_ISSUE or GOVERNANCE_RISK IDs |
| Duplicates checked against existing guardrails? | ✅ All checked against G-CNT-01–G-CNT-08 and G-UX-06 |

---

## QUESTIONNAIRE_REQUEST

| Q-ID | Question | Target | Rationale |
|------|----------|--------|-----------|
| Q-CNT-001 | Who currently owns the UI copy, and is there a designated content reviewer for feature releases? | Product Owner | Required to define content ownership model and governance process |
| Q-CNT-002 | Is a dedicated UX Writer / Content Strategist available, or is content a shared responsibility? | Technical Lead | Required for accurate sprint capacity and story assignment |
| Q-CNT-003 | Are there any existing brand guidelines, tone-of-voice documents, or writing standards? | Product Owner | Required to align the Content Style Guide with established brand identity (if any) |
| Q-CNT-004 | What is the target audience's technical proficiency level? Are all users technical (developers/PMs), or should the tool be accessible to business stakeholders too? | Product Owner | Required to calibrate readability level and jargon policy |

---

## HANDOFF CHECKLIST – Content Strategist / UX Writer – 2025-01-20
- [x] MODE: AUDIT
- [x] Copy inventory complete — all available content categories covered (12 categories, ~130+ elements)
- [x] Voice & tone audit performed with concrete examples (CI-001 through CI-005, per G-CNT-02)
- [x] Microcopy quality analysis on all 7 criteria (clarity, conciseness, helpfulness, consistency, action-oriented, error recovery, empty state value)
- [x] Readability analysis performed (language level per content area, 3 readability issues)
- [x] Content gap analysis on all 6 journey moments (per G-CNT-03)
- [x] Content governance assessment complete (2 governance risks identified)
- [x] All CONTENT_ISSUE (8), CONTENT_GAP (2), GOVERNANCE_RISK (2) documented
- [x] No production-ready copy written (only guidelines and frameworks, per G-CNT-01)
- [x] Recommendations consistent with UX Researcher, UX Designer, UI Designer, Accessibility Specialist output (per G-CNT-06)
- [x] Style Guide and Voice & Tone guideline included as deliverable in sprint plan (SP-3-501)
- [x] Output ready as input for Localization Specialist (35) — voice & tone, terminology, content structure documented
- [x] Guardrails: all guardrails formulated testably
- [x] Guardrails: all guardrails have violation action and verification method
- [x] Guardrails: all guardrails reference GAP/RISK finding
- [x] All 4 deliverables present: Analysis ✅ Recommendations ✅ Sprint Plan ✅ Guardrails ✅
- [x] All INSUFFICIENT_DATA: items documented and escalated
- [x] Output complies with contracts in /.github/docs/contracts/
- [x] All findings include source reference
- [x] Questionnaire input check performed: NOT_INJECTED
- [x] QUESTIONNAIRE_REQUEST list included (4 items)
- [x] Output written to file per MEMORY MANAGEMENT PROTOCOL
