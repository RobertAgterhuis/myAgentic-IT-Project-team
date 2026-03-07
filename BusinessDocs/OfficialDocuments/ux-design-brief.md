# UX Design Brief
> Version: v2 | Last updated: 2026-03-08T12:00:00Z | Source: Phase 3 agent outputs (10, 11, 12, 13) + Reevaluation R2
> Completeness: ~85% — updated with questionnaire answers (user demographics, geographic scope, audience proficiency, UI sync bug)

---

## User Research Summary

**Method:** Code-analysis-based heuristic evaluation (no direct user research conducted). Findings are derived from UI structure analysis, interaction pattern review, and cognitive walkthrough of key task flows. (Source: Agent 10)

**Key findings:**
- **Error recovery** is the #1 usability issue (4-agent consensus: Agents 10, 11, 13, 32). Raw `toast('Failed: ' + e.message)` messages provide no recovery guidance.
- **Cognitive load** for the questionnaire management flow is rated 6/10 (medium-high) — requires navigating multiple tabs, understanding file structure, and manual copy-paste for agent commands. (Source: Agent 10, GAP-UXR-004)
- **Task efficiency** is hampered by a 6-step process to launch an agent via clipboard paste. (Source: Agent 10, GAP-UXR-003)
- **Discoverability** is poor — features like F1 help, keyboard shortcuts, and tab filtering are not signposted. (Source: Agent 11, REC-UXD-004)

**INSUFFICIENT_DATA:** No actual user testing data available. Task success rates, drop-off rates, and cognitive load scores are all heuristic estimates. Validated data requires analytics implementation and usability testing (recommended in Sprint 5–6).

**USER-REPORTED BUG (Q-10-004):** UI feedback system sometimes out of sync with background tasks. This validates and escalates the existing heuristic finding on system status transparency. Priority: HIGH.

---

## User Personas

**Validated persona (Q-10-002, Q-32-004):**

> **"Alex" — The AI Project Orchestrator**
> - **Semi-technical to technical** users (Q-32-004: audience is semi-technical and technical)
> - Everyone using Agentic Code Generation (Q-10-002: primary users confirmed)
> - **Global audience** — available as toolset to download from GitHub (Q-13-001)
> - Daily user — works through phases, fills questionnaires, tracks decisions
> - Needs: clear progress visibility, efficient task flow, reliable error recovery
> - Frustrations: error messages without context, manual clipboard workflows, UI sync issues (Q-10-004)
> - **Team context:** 1 developer, 30 SP/sprint (Q-05-001, Q-06-001) — UX improvements must be implementable by solo developer

**INSUFFICIENT_DATA:** Q-10-002 — actual user demographics and count needed to validate or replace this persona.

**RESOLVED (Q-10-002):** Primary users confirmed as "everyone using Agentic Code Generation". Persona updated.

---

## User Journeys (critical paths)

Three critical task flows identified from code analysis:

### Journey 1: Questionnaire Management
`Open app → Navigate to Questionnaires tab → Select phase → Open questionnaire → Answer questions → Save`
- **Pain points:** No search/filter across questions, no progress indicator, no inline validation (Source: Agent 10, Agent 11)
- **Cognitive load:** 6/10 — user must understand phase structure to find the right questionnaire

### Journey 2: Decision Tracking
`Open app → Navigate to Decisions tab → Review decision cards → Add/filter decisions → Track status`
- **Assessment:** Best-performing flow. Card layout is clear, filtering works, contextual actions are accessible. (Source: Agent 11, Heuristic #4 rated "Good")
- **Minor issues:** No keyboard shortcut for common actions

### Journey 3: Agent Pipeline Execution
`Open app → Navigate to Agents tab → Select agent → Copy command → Open terminal → Paste → Run → Return to app → Check results`
- **Pain points:** 6-step process with context switching, requires clipboard paste, no real-time progress feedback (polling only). (Source: Agent 10, GAP-UXR-003)
- **Assessment:** Highest friction flow in the application

---

## Design Principles

Based on audit findings, the following design principles are recommended:

1. **Recovery over prevention** — Every error state must include a clear recovery path (Source: 4-agent consensus)
2. **Progressive disclosure** — Reduce cognitive load by showing complex information in layers (Source: Agent 11, REC-UXD-003)
3. **Transparency of system status** — Always show what the system is doing, especially during long operations (Source: Agent 11, Nielsen Heuristic #1)
4. **Inclusive by default** — Design for WCAG 2.1 AA compliance as baseline, not afterthought (Source: Agent 13)
5. **Content as UX** — Treat UI text as a design material, not an afterthought (Source: Agent 32)

---

## Accessibility Requirements

**Target conformance level:** WCAG 2.1 AA (Source: Agent 13)

**Current status:** 7 WCAG AA failures identified:

| WCAG SC | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1.1.1 | Emoji characters lack text alternatives | Level A | FAIL |
| 1.3.1 | Tab strip uses non-semantic `<div>` instead of `role="tablist"` | Level A | FAIL |
| 1.4.3 | Contrast ratio violations in secondary text and status badges | Level AA | FAIL |
| 2.1.1 | Interactive elements not fully keyboard-operable | Level A | PARTIAL |
| 3.3.1 | Error messages lack programmatic identification | Level A | FAIL |
| 3.3.3 | No error suggestions provided on input failures | Level AA | FAIL |
| 4.1.2 | Missing accessible names on some interactive elements | Level A | FAIL |

**Legal applicability (RESOLVED):** Internal-only product (Q-33-001) globally available on GitHub (Q-13-001). EAA (EU) and ADA (US) mandatory obligations do not apply to internal tools — accessibility improvements remain **ADVISORY** for best practice and are included in the sprint plan regardless.

---

## Content Guidelines (summary)

**Current state:** All UI copy is hardcoded in `index.html`. No content management system, no style guide, no content review process. (Source: Agent 32)

**Key content issues:**
1. **Voice inconsistency** — 5 instances where tone shifts between formal and casual within the same flow
2. **Error messages** — Raw exception text displayed to users (e.g., `Failed: ENOENT: no such file or directory`)
3. **No onboarding copy** — New users see the full interface with no guidance
4. **Action labels** — Generic labels like "Submit" and "Save" instead of contextual labels

**Recommended governance:** Create a content style guide (Sprint 1) defining voice, tone, error message framework, and terminology glossary. See Agent 32 output for detailed framework proposal. (Source: Agent 32, REC-CNT-001)

**INSUFFICIENT_DATA:** Q-32-001 (copy ownership), Q-32-004 (audience technical proficiency).
