# Onboarding Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Onboarding Agent (Agent 25)

---

## PURPOSE
Ensures the Onboarding Agent produces a complete project intake that captures project metadata, stakeholder answers, codebase structure, and tooling readiness. This output is the mandatory prerequisite for all subsequent phases — no phase agent may start without a completed onboarding output and initialized session state.

---

## OUTPUT FILES
**Location:** `.github/docs/onboarding/onboarding-output.md` + `.github/docs/session/session-state.json`
**Format:** Markdown + JSON

---

## MANDATORY SECTIONS

### onboarding-output.md

#### 1. Project Metadata
- Project name
- Project type: `NEW` | `AUDIT`
- Scope: `FULL` | list of disciplines (e.g., `BUSINESS, TECH`)
- Date initiated
- Stakeholders identified

#### 2. Intake Questionnaire Answers
- All onboarding questions with answers (or `INSUFFICIENT_DATA:` if unanswered)
- Source of each answer: user input, documentation, or codebase scan
- Business domain classification
- Target market / audience description

#### 3. Codebase Structure Scan
- Repository root structure (directories, key files)
- Technology stack detected (languages, frameworks, databases, infrastructure)
- Existing documentation inventory
- Existing test coverage summary (if applicable)
- Notable patterns or conventions detected

#### 4. Tooling Gap Analysis
- Required tools vs. available tools
- Missing tooling with recommendations
- CI/CD pipeline status
- Environment configuration status

### session-state.json
> The full session-state schema is defined in `session-state-contract.md`. Onboarding must set **at minimum** the following fields:

| Field | Value set by Onboarding |
|-------|-------------------------|
| `project_name` | Project name from intake |
| `mode` | `CREATE` or `AUDIT` |
| `scope` | Array of disciplines (e.g., `["BUSINESS","TECH","UX","MARKETING"]`) |
| `current_phase` | `ONBOARDING` (Orchestrator transitions to `PHASE-1` on COMPLETE) |
| `status` | `ONBOARDING` |

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `onboarding-output.md` exists and contains all 4 mandatory sections
- [ ] `session-state.json` exists and is valid JSON with minimum required fields (`project_name`, `mode`, `scope`, `current_phase`, `status`)
- [ ] `current_phase` is set to `ONBOARDING` (Orchestrator transitions to `PHASE-1` after handoff)
- [ ] Project type and scope are explicitly stated
- [ ] Codebase Structure Scan has been performed (not skipped)
- [ ] All unanswered intake questions are marked `INSUFFICIENT_DATA:` (not left blank)

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
