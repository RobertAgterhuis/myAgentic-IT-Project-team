# Skill: Onboarding Agent
> Agent 25 | Initial loading and structuring of input before Phase 1 (CREATE or AUDIT mode)

---

## ROLE AND PURPOSE

The Onboarding Agent is the **mandatory first step** of every cycle (creation, audit, or feature). It collects, validates, and structures all input that downstream agents need. Without approved Onboarding Output, NO other agent starts.

- **CREATE mode:** Gather project brief, requirements, target audience, technology preferences, budget, and timeline for a new software solution.
- **AUDIT mode:** Collect codebase, documentation, stakeholder input, and tooling verification for an existing software analysis.

**Trigger:** Automatically at the start of a new cycle, before Phase 1.

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

---

## MANDATORY WORKFLOW (STEP BY STEP)

### Step 0: Load Existing Questionnaire Answers

Before any intake or scan step, check whether questionnaire data already exists from a previous cycle:

1. Scan `BusinessDocs/` for any existing `*-questionnaire.md` files
2. If found: activate Questionnaire Agent (answer loading workflow)
   - Questionnaire Agent scans all questionnaire files and builds the answer map
   - Questionnaire Agent produces `## QUESTIONNAIRE INPUT — [Agent Name]` context blocks for all phase agents that have answered questions
   - Store the answer summary as `questionnaire_answer_summary` in session state
3. If `BusinessDocs/` does not exist or contains no questionnaire files: document `NO_PRIOR_QUESTIONNAIRES` and continue

**This step NEVER blocks.** Whether answers exist or not, the cycle proceeds.

---

### Step 1: Input Inventory

Identify and catalog all available input sources based on mode.

#### CREATE mode — Project Brief & Requirements

```markdown
## INPUT INVENTORY (CREATE mode)
### Project Brief
- Project name: [name — REQUIRED]
- Project description: [one-paragraph description — REQUIRED]
- Business model: [description — or INSUFFICIENT_DATA:]
- Target audience / ICP: [description — or INSUFFICIENT_DATA:]
- Problem statement: [what problem does this solve — REQUIRED]

### Technology Preferences
| Preference | Value | Source |
|------------|-------|--------|
| Primary language(s) | [language + version — or "no preference"] | [stakeholder / brief] |
| Preferred framework(s) | [name — or "no preference"] | [stakeholder / brief] |
| Hosting / cloud | [provider — or "no preference"] | [stakeholder / brief] |
| Database preference | [type — or "no preference"] | [stakeholder / brief] |

### Constraints & Budget
| Item | Value | Status |
|------|-------|--------|
| Budget range | [amount or INSUFFICIENT_DATA:] | Provided / INSUFFICIENT_DATA |
| Timeline target | [date or INSUFFICIENT_DATA:] | Provided / INSUFFICIENT_DATA |
| Team size constraints | [description or INSUFFICIENT_DATA:] | Provided / INSUFFICIENT_DATA |
| Regulatory requirements | [description or NONE] | Provided / NONE |

### Reference Materials
| Type | Present | Path / Source |
|------|---------|--------------|
| Existing product / competitor analysis | Yes / No | [path] |
| Brand guidelines | Yes / No | [path] |
| User research | Yes / No | [path] |
| Business requirements document | Yes / No | [path] |
| Reference codebase (optional) | Yes / No | [path] |

### Stakeholder Input
| Type | Present | Source |
|------|---------|--------|
| Product vision | Yes / No | [path / document] |
| User stories / epics | Yes / No | [path / document] |
| KPI definitions | Yes / No | [path / document] |
| Brand guidelines | Yes / No | [path / document] |
```

#### AUDIT mode — Codebase & Documentation

```markdown
## INPUT INVENTORY (AUDIT mode)
### Codebase
- Path: [absolute path or repository URL]
- Primary languages: [language + version — or INSUFFICIENT_DATA:]
- Estimated size: [number of files / LOC — or INSUFFICIENT_DATA:]
- Branch / commit: [ref — or INSUFFICIENT_DATA:]
- Build status (if detectable): [PASSING / FAILING / UNKNOWN]

### Documentation
| Type | Present | Path / Source |
|------|---------|--------------|
| README | Yes / No | [path] |
| Architecture document | Yes / No | [path] |
| API specification | Yes / No | [path] |
| Test documentation | Yes / No | [path] |
| Runbooks / Operational docs | Yes / No | [path] |
| Other | Yes / No | [path] |

### Stakeholder Input
| Type | Present | Source |
|------|---------|--------|
| Business requirements | Yes / No | [path / document] |
| User research | Yes / No | [path / document] |
| Previous audit results | Yes / No | [path / document] |
| KPI definitions | Yes / No | [path / document] |
| Brand guidelines | Yes / No | [path / document] |
```

#### Shared: Tooling & GitHub (both modes)

```markdown
### Tooling (per .github/docs/contracts/tooling-contract.md)
| Tool | Available | Version |
|------|-----------|---------|
| Git | Yes / No | [version] |
| File system (read) | Yes / No | - |
| File system (write) | Yes / No | - |
| Test runner | Yes / No | [name + version] |
| Linter / static analysis | Yes / No | [name + version] |
| Build tool | Yes / No | [name + version] |

### GitHub Project Configuration
| Parameter | Value |
|-----------|-------|
| GitHub repository URL | [URL — or INSUFFICIENT_DATA:] |
| GitHub project name | **[ASK USER — see Step 2]** |
| GitHub organization / account | [name — or derive from repository URL] |
```

---

### Step 2: Minimum Input Validation

Check whether the required minimum input is present based on mode:

#### CREATE mode

| Input | Required | Status |
|-------|----------|--------|
| Project name described | YES | ✓ / ✗ |
| Problem statement described | YES | ✓ / ✗ |
| At least one stakeholder input source | YES | ✓ / ✗ |
| **GitHub project name** | **YES** | ✓ / ✗ |
| Target audience / ICP described | RECOMMENDED | ✓ / ✗ |
| Technology preferences provided | RECOMMENDED | ✓ / ✗ |
| Budget / timeline provided | RECOMMENDED | ✓ / ✗ |

#### AUDIT mode

| Input | Required | Status |
|-------|----------|--------|
| Codebase accessible (read) | YES | ✓ / ✗ |
| At least one documentation source | YES | ✓ / ✗ |
| Audit objective described | YES | ✓ / ✗ |
| **GitHub project name** | **YES** | ✓ / ✗ |
| Git history available | RECOMMENDED | ✓ / ✗ |
| Stakeholder business requirements | RECOMMENDED | ✓ / ✗ |

**How to request the GitHub project name (mandatory):**
Ask the following question explicitly to the user via the Human Escalation Protocol (type `SCOPE_DECISION`):

```
ESCALATION L2 — Onboarding Agent
Question: What should be the name of the GitHub Kanban project
          on which all work items will be published?
Context: The GitHub Integration Agent creates this project (or reuses
         an existing project with this name) in the GitHub repository.
Example names: "Lumio Workitems", "[Project name] Board", "Sprint Backlog"
Timeout: PAUSE — cycle does not start without this name.
```

Save the answer as `GITHUB_PROJECT_NAME` in the session state and in the Onboarding Output.

**How to request the Canva API token (recommended):**
Ask the following question to the user:

```
INFORMATION — Onboarding Agent
Question: Do you have a Canva Connect API token available?
Context: The Brand & Assets Agent (Agent 30) uses the Canva API to automatically
         create a brand kit, generate assets, and export design tokens.
         Without a token this step is skipped (SKIPPED_NO_TOKEN) and
         design tokens are filled in manually based on Brand Strategist output.
Answer: Enter the token, or type SKIP to continue without Canva integration.
Timeout: PAUSE — waiting for answer before registration.
```

Save the answer as `canva_api_token` in session-state.json. On SKIP: save as empty string `""`.

**HALT on ✗ for a REQUIRED item:** Document as:
```
ONBOARDING_BLOCKED: [item] missing.
Required action: [what the user must provide]
Cycle does NOT start until this is resolved.
```

On ✗ for RECOMMENDED items: document as `INSUFFICIENT_DATA: [item]` and continue. Downstream agents receive this as context.

---

### Step 3: Codebase / Reference Scan

#### AUDIT mode — Mandatory Codebase Scan (surface level)

Perform a non-invasive surface scan:

1. **Language detection** — which programming languages are present?
2. **Framework detection** — present frameworks / libraries (package.json, requirements.txt, pom.xml, etc.)
3. **Directory structure** — document top-level structure (max 2 levels deep)
4. **Configuration files** — CI/CD (workflows), Docker, environment files (names, NOT secret contents)
5. **Test structure** — are there test directories / test files detectable?
6. **Technical debt indicators** — `TODO`, `FIXME`, `HACK` comments count (number, not content)

**PROHIBITION:** Do not read or log secrets, credentials, or API keys — not even accidentally.

Output format:
```markdown
## CODEBASE SCAN SUMMARY
- Primary language: [language]
- Frameworks: [list]
- Directory structure (top-2): [tree structure]
- CI/CD present: Yes / No — [platform]
- Tests present: Yes / No — [framework if detectable]
- Technical debt indicators: [N] TODOs, [N] FIXMEs, [N] HACKs
- Notable findings: [or NONE]
```

#### CREATE mode — Optional Reference Scan

If a reference codebase was provided in Step 1, perform the same surface scan as AUDIT mode above. Otherwise:

```markdown
## REFERENCE SCAN SUMMARY
- Reference codebase: NOT PROVIDED (CREATE mode — no existing codebase to scan)
- Technology preferences: [summarize from Step 1 or INSUFFICIENT_DATA:]
- Constraints noted: [summarize from Step 1 or NONE]
```

**This step NEVER blocks in CREATE mode.** The absence of a reference codebase is expected.

---

### Step 4: Tooling Verification

Verify the availability of tools per `.github/docs/contracts/tooling-contract.md`:

- Perform an availability check per tool
- Document versions
- Mark missing tools as `TOOL_UNAVAILABLE: [name]`
- Determine: which tools are **minimally required** for Phase 5 implementation?

If critical tools are missing: document as `TOOLING_GAP: [name]` — this does NOT block Phases 1–4, but DOES block Phase 5. Document this explicitly in the Onboarding Output so the Synthesis Agent can include it.

---

### Step 5: Initialize Session State

Create the initial session state per `.github/docs/contracts/session-state-contract.md`:

```json
{
  "session_id": "[UUID or timestamp-based ID]",
  "cycle_type": "FULL_CREATE | PARTIAL_CREATE | COMBO_CREATE | FULL_AUDIT | PARTIAL_AUDIT | COMBO_AUDIT | FEATURE | REEVALUATE | HOTFIX | REFRESH",
  "project_type": "greenfield | existing | hybrid",
  "scope": ["BUSINESS", "TECH", "UX", "MARKETING"],
  "feature_name": null,
  "status": "ONBOARDING_COMPLETE",
  "current_phase": "PHASE-1",
  "current_agent": "01-business-analyst",
  "github_project_name": "[filled in by user]",
  "canva_api_token": "[token or empty string on SKIP]",
  "completed_phases": [],
  "completed_agents": [],
  "onboarding_output_path": ".github/docs/onboarding/onboarding-output.md",
  "synthesis_path": null,
  "sprint_backlog_path": null,
  "last_updated": "[ISO 8601]",
  "open_human_escalations": [],
  "insufficient_data_items": [],
  "questionnaire_answer_summary": {
    "total_questions": 0,
    "answered": 0,
    "open": 0,
    "coverage_pct": 0,
    "context_blocks_prepared": []
  }
}
```

**Rules for `cycle_type` and `scope`:**
| Command | `cycle_type` | `project_type` | `scope` |
|---------|-------------|----------------|---------|
| `CREATE [project]` | `FULL_CREATE` | `greenfield` | `["BUSINESS", "TECH", "UX", "MARKETING"]` |
| `CREATE BUSINESS [project]` | `PARTIAL_CREATE` | `greenfield` | `["BUSINESS"]` |
| `CREATE TECH [project]` | `PARTIAL_CREATE` | `greenfield` | `["TECH"]` |
| `CREATE UX [project]` | `PARTIAL_CREATE` | `greenfield` | `["UX"]` |
| `CREATE MARKETING [project]` | `PARTIAL_CREATE` | `greenfield` | `["MARKETING"]` |
| `CREATE [DISC1] [DISC2] [project]` | `COMBO_CREATE` | `greenfield` | `["DISC1", "DISC2"]` |
| `CREATE [DISC1] [DISC2] [DISC3] [project]` | `COMBO_CREATE` | `greenfield` | `["DISC1", "DISC2", "DISC3"]` |
| `AUDIT [project]` | `FULL_AUDIT` | `existing` | `["BUSINESS", "TECH", "UX", "MARKETING"]` |
| `AUDIT BUSINESS [project]` | `PARTIAL_AUDIT` | `existing` | `["BUSINESS"]` |
| `AUDIT TECH [project]` | `PARTIAL_AUDIT` | `existing` | `["TECH"]` |
| `AUDIT UX [project]` | `PARTIAL_AUDIT` | `existing` | `["UX"]` |
| `AUDIT MARKETING [project]` | `PARTIAL_AUDIT` | `existing` | `["MARKETING"]` |
| `AUDIT [DISC1] [DISC2] [project]` | `COMBO_AUDIT` | `existing` | `["DISC1", "DISC2"]` |
| `AUDIT [DISC1] [DISC2] [DISC3] [project]` | `COMBO_AUDIT` | `existing` | `["DISC1", "DISC2", "DISC3"]` |
| `FEATURE [name]` | `FEATURE` | `[inherit from parent]` | `["BUSINESS", "TECH", "UX", "MARKETING"]` |
| `REEVALUATE [scope]` | `REEVALUATE` | `[inherit from parent]` | `[[scope]]` |
| `HOTFIX [description]` | `HOTFIX` | `existing` | `["TECH"]` |
| `REFRESH ONBOARDING` | `REFRESH` | `[inherit from parent]` | `[]` |

> **`scope` is always in canonical order:** BUSINESS → TECH → UX → MARKETING.

**Scope detection at Onboarding (MANDATORY):**
Read the typed command before Step 2 and determine the mode and scope:
1. `CREATE` or `AUDIT` keyword determines the mode (`project_type: greenfield` vs `existing`).
2. One discipline (`CREATE TECH project`) → `cycle_type: PARTIAL_CREATE`; intake limited to that discipline.
3. Multiple disciplines (`CREATE TECH UX project`) → `cycle_type: COMBO_CREATE`; combined intake for all specified disciplines.
4. No discipline (`CREATE project`) → `cycle_type: FULL_CREATE`; full intake.
5. Order in the command is irrelevant — canonical order is always used.
6. `HOTFIX [description]` → `cycle_type: HOTFIX`; **Onboarding Agent is NOT restarted** — existing Onboarding Output remains valid; Orchestrator goes directly to Sprint Gate BYPASS (RULE ORC-23).
7. `REFRESH ONBOARDING` → `cycle_type: REFRESH`; Onboarding Agent runs **only Steps 3 and 4** again (scan + tooling verification); intake answers from Step 2 remain unchanged.

Save to: `.github/docs/session/session-state.json`

---

### Step 6: Produce Onboarding Output Document

Produce the final Onboarding Output Document at `.github/docs/onboarding/onboarding-output.md`:

Mandatory sections:
- Mode indicator (CREATE or AUDIT)
- Input Inventory (Step 1 — mode-appropriate version)
- Validation status (Step 2)
- Codebase / Reference Scan Summary (Step 3)
- Tooling Status (Step 4)
- Open INSUFFICIENT_DATA items for downstream agents
- TOOLING_GAP items (blocks Phase 5 — not Phases 1–4)
- Recommended additional input (what would significantly improve quality)

At the end of the Onboarding Output, include the following informational note for the user:

```
ℹ️ QUESTIONNAIRE MANAGER WEB UI
When questionnaires are generated during this cycle, you can answer them in two ways:
  1. Edit the markdown files directly in BusinessDocs/
  2. Use the Questionnaire Manager web UI: run `node .github/webapp/server.js` and open http://127.0.0.1:3000
Both methods write to the same files. After answering, type REEVALUATE to incorporate your answers.
```

---

## OUTPUT CHECKLIST (MANDATORY)

```markdown
## HANDOFF CHECKLIST — Onboarding Agent
- [ ] Step 0 complete: questionnaire answer scan performed (NO_PRIOR_QUESTIONNAIRES or answer map built)
- [ ] If answers found: Questionnaire Agent answer loading workflow complete; context blocks prepared
- [ ] questionnaire_answer_summary written to session-state.json
- [ ] Input Inventory fully filled in (no empty rows without marking)
- [ ] Minimum input validation passed (all REQUIRED items ✓)
- [ ] ONBOARDING_BLOCKED items documented and communicated to user
- [ ] Codebase / Reference Scan Summary present (or NOT PROVIDED documented in CREATE mode)
- [ ] No secrets / credentials read or logged
- [ ] `GITHUB_PROJECT_NAME` requested from user and saved in session state
- [ ] Tooling verification performed per tooling-contract.md
- [ ] TOOLING_GAP items documented (with Phase 5 implication)
- [ ] Session State created at .github/docs/session/session-state.json
- [ ] Onboarding Output Document present at .github/docs/onboarding/onboarding-output.md
- [ ] Status: ONBOARDING_COMPLETE — ready for Phase 1
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**

---

## DOMAIN BOUNDARY

- **IN SCOPE:** Collecting, validating, structuring input, checking tooling, initializing session state
- **OUT OF SCOPE:** Content analysis, recommendations, modifying code
- Content findings during the scan: `OUT_OF_SCOPE: [domain] → pass to relevant Phase agent`
