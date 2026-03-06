````markdown
# Contract: Session State
> Version 1.0 | Defines how the Orchestrator and agents track progress and resume an interrupted cycle

---

## PURPOSE

This contract defines:
1. The format of the session state
2. How agents update the state
3. How an interrupted session is detected and resumed
4. How conflicts in state are resolved

---

## SESSION STATE FILE

**Location:** `.github/docs/session/session-state.json`
**Owner:** Only the Orchestrator writes to this file. Other agents submit state updates **to** the Orchestrator via their HANDOFF CHECKLIST.

---

## COMPLETE JSON SCHEMA

```json
{
  "schema_version": "1.0",
  "session_id": "string — UUID or [YYYY-MM-DD]T[HH-MM-SS]",
  "cycle_type": "FULL_AUDIT | FULL_CREATE | PARTIAL_AUDIT | PARTIAL_CREATE | COMBO_AUDIT | COMBO_CREATE | FEATURE | REEVALUATE | SCOPE_CHANGE | HOTFIX | REFRESH",
  "scope": ["BUSINESS", "TECH", "UX", "MARKETING"],
  "project_type": "greenfield | existing | hybrid",
  "feature_name": "string | null",
  "github_project_name": "string | null — filled during Onboarding",
  "initiated_at": "ISO 8601",
  "last_updated": "ISO 8601",

  "status": "ONBOARDING | PHASE-1 | PHASE-2 | PHASE-3 | PHASE-4 | SYNTHESIS | SPRINT_GATE | PHASE-5 | REEVALUATE | COMPLETE | BLOCKED | AWAITING_HUMAN",

  "current_phase": "ONBOARDING | PHASE-1 | PHASE-2 | PHASE-3 | PHASE-4 | SYNTHESIS | PHASE-5 | null",
  "current_agent": "string — agent filename without extension | null",
  "current_step": "string — free-text description of what the active agent is doing | null",

  "completed_phases": ["ONBOARDING", "PHASE-1"],
  "completed_agents": ["25-onboarding-agent", "01-business-analyst"],

  "phase_outputs": {
    "onboarding": ".github/docs/onboarding/onboarding-output.md | null",
    "phase-1": {
      "01": ".github/docs/phase-1/01-business-analyst.md | null",
      "02": ".github/docs/phase-1/02-domain-expert.md | null",
      "03": ".github/docs/phase-1/03-sales-strategist.md | null",
      "04": ".github/docs/phase-1/04-financial-analyst.md | null",
      "34": ".github/docs/phase-1/34-product-manager.md | null",
      "critic_risk": ".github/docs/phase-1/critic-risk-validation.md | null"
    },
    "phase-2": {
      "05": "null",
      "06": "null",
      "07": "null",
      "08": "null",
      "09": "null",
      "33": "null",
      "critic_risk": "null"
    },
    "phase-3": {
      "10": "null",
      "11": "null",
      "12": "null",
      "13": "null",
      "32": "null",
      "35": "null",
      "critic_risk": "null"
    },
    "phase-4": {
      "14": "null",
      "15": "null",
      "16": "null",
      "critic_risk": "null"
    },
    "synthesis": "null",
    "sprintplan": "null"
  },

  "sprint_backlog": {
    "path": "null",
    "total_sprints": 0,
    "sprint_statuses": {}
  },

  "open_human_escalations": [
    {
      "escalation_id": "ESC-001",
      "raised_by": "agent name",
      "raised_at": "ISO 8601",
      "type": "ONBOARDING_BLOCKED | TOOL_INSTALL_REQUEST | SPRINT_IMPACT_FLAG | SCOPE_DECISION | OTHER",
      "question": "string — exact question to the user",
      "timeout_action": "PAUSE | CONTINUE_WITH_ASSUMPTION | HALT",
      "timeout_at": "ISO 8601 | null",
      "status": "OPEN | ANSWERED | TIMED_OUT",
      "answer": "string | null",
      "answered_at": "ISO 8601 | null"
    }
  ],

  "insufficient_data_items": [
    {
      "id": "INSUF-001",
      "agent": "string",
      "item": "string — what is missing",
      "impact": "string — which analyses are uncertain as a result",
      "status": "OPEN | RESOLVED | ACCEPTED_AS_UNKNOWN"
    }
  ],

  "tooling_gaps": [
    {
      "tool": "string",
      "category": "C | D",
      "blocks_phase": "PHASE-5 | null",
      "status": "OPEN | RESOLVED"
    }
  ],

  "blockers": [
    {
      "blocker_id": "BLK-001",
      "type": "INTERN | EXTERN | TOOLING | HUMAN_REQUIRED",
      "description": "string",
      "raised_by": "string",
      "blocks": "string — what cannot proceed",
      "status": "OPEN | RESOLVED",
      "resolved_at": "ISO 8601 | null"
    }
  ],

  "questionnaire_answer_summary": {
    "total_questions": 0,
    "answered": 0,
    "open": 0,
    "coverage_pct": 0,
    "context_blocks_prepared": [],
    "questionnaire_index_path": "BusinessDocs/questionnaire-index.md | null",
    "last_loaded_at": "ISO 8601 | null"
  },

  "scope_change_history": [
    {
      "sc_id": "SC-1",
      "dimension": "BUSINESS | TECH | UX | MARKETING | ALL",
      "triggered_at": "ISO 8601",
      "old_premise": "string",
      "new_premise": "string",
      "status": "IN_PROGRESS | RECONCILIATION | COMPLETE",
      "report_path": ".github/docs/synthesis/scope-change-1.md | null",
      "tickets_on_hold": ["SP-N-NNN"],
      "tickets_cancelled": [],
      "tickets_requeued": [],
      "brand_assets_reactivation_status": "NOT_APPLICABLE | PENDING | BRAND_ASSETS_WAITING | BRAND_ASSETS_PARTIAL | BRAND_ASSETS_COMPLETE | STORYBOOK_WAITING | STORYBOOK_PARTIAL | STORYBOOK_COMPLETE"
    }
  ]
}
```

---

## REEVALUATE TRIGGER FILE (WEB UI)

**Location:** `.github/docs/session/reevaluate-trigger.json`
**Written by:** Questionnaire & Decisions Manager web UI (`.github/webapp/server.js`)
**Read by:** Orchestrator (per RULE ORC-28 in `.github/skills/00-orchestrator.md`)

> **ORC-28 summary:** At every session start and before every Sprint Gate, check for this file with `status: "PENDING"`. If found, treat as equivalent to `REEVALUATE [scope]`. After processing, set `status` to `"CONSUMED"` and add `consumed_at`.

This file is NOT part of `session-state.json` — it is a separate signal file. The Orchestrator checks for its existence at every session start and before every Sprint Gate.

```json
{
  "requested_at": "ISO 8601",
  "scope": "ALL | BUSINESS | TECH | UX | MARKETING",
  "source": "questionnaire-webapp",
  "status": "PENDING | CONSUMED",
  "consumed_at": "ISO 8601 | null"
}
```

| Field | Description |
|-------|-------------|
| `requested_at` | Timestamp when the user clicked Reevaluate in the web UI |
| `scope` | Reevaluation scope — maps to `REEVALUATE [scope]` command |
| `source` | Always `"questionnaire-webapp"` for web UI triggers |
| `status` | `PENDING` = not yet consumed; `CONSUMED` = Orchestrator has processed it |
| `consumed_at` | Set by Orchestrator after processing; null while PENDING |

---

## COMMAND QUEUE FILE (WEB UI COMMAND CENTER)

**Location:** `.github/docs/session/command-queue.json`
**Written by:** Questionnaire & Decisions Manager web UI (`.github/webapp/server.js` — Command Center tab)
**Read by:** Orchestrator (per RULE ORC-29 in `.github/skills/00-orchestrator.md`)

> **ORC-29 summary:** At every session start and before every Sprint Gate, check for this file with `status: "PENDING"`. Read the `command` field and execute the full workflow for that command. After acknowledging, set `status` to `"CONSUMED"` and add `consumed_at`.

This file is a separate signal file (same pattern as `reevaluate-trigger.json`). The web UI writes it when a user launches a command from the Command Center. The Orchestrator checks for its existence at every session start and before every Sprint Gate.

```json
{
  "command": "CREATE | AUDIT | CREATE BUSINESS | ... | FEATURE | SCOPE CHANGE | HOTFIX | REEVALUATE | REFRESH ONBOARDING",
  "project": "string | null",
  "description": "string | null",
  "scope": "BUSINESS | TECH | UX | MARKETING | ALL | null",
  "requested_at": "ISO 8601",
  "status": "PENDING | CONSUMED",
  "consumed_at": "ISO 8601 | null",
  "source": "webapp",
  "clipboard_text": "string — the text the user should paste into Copilot Chat"
}
```

| Field | Description |
|-------|-------------|
| `command` | The system command to execute — must be one of the VALID_COMMANDS defined in server.js |
| `project` | Project name (for CREATE/AUDIT commands); null for commands that don't need it |
| `description` | Feature/hotfix description (for FEATURE, SCOPE CHANGE, HOTFIX); null otherwise |
| `scope` | Dimension scope (for SCOPE CHANGE, REEVALUATE); null otherwise |
| `requested_at` | Timestamp when the user launched the command in the web UI |
| `status` | `PENDING` = not yet consumed; `CONSUMED` = Orchestrator has processed it |
| `consumed_at` | Set by Orchestrator after processing; null while PENDING |
| `source` | Always `"webapp"` for Command Center triggers |
| `clipboard_text` | The exact text to paste into Copilot Chat (e.g. `CREATE MyApp`) |

---

## STATE MACHINE — VALID TRANSITIONS

```
ONBOARDING
  → PHASE-1          (after ONBOARDING_COMPLETE)
PHASE-1
  → PHASE-2          (after Critic + Risk PASSED)
PHASE-2
  → PHASE-3          (after Critic + Risk PASSED)
PHASE-3
  → PHASE-4          (after Critic + Risk PASSED)
PHASE-4
  → SYNTHESIS        (after Critic + Risk PASSED)
SYNTHESIS
  → SPRINT_GATE      (after Synthesis APPROVED)
SPRINT_GATE
  → PHASE-5          (after Sprint Gate choice IMPLEMENT)
  → SPRINT_GATE      (next sprint — iterative)
PHASE-5
  → SPRINT_GATE      (after Sprint Completion Report APPROVED)
  → COMPLETE         (all sprints COMPLETED or BACKLOG with user decision)

Every status → AWAITING_HUMAN   (on open human escalation)
AWAITING_HUMAN → [previous status]  (after answer received)
Every status → BLOCKED          (on unresolvable blocker)
BLOCKED → [previous status]     (after blocker resolved)
Every status → SCOPE_CHANGE     (on SCOPE CHANGE command — Sprint Gate PAUSED for affected dimension)
SCOPE_CHANGE → [previous status]   (after Sprint Gate Reconciliation APPROVED by user)
```

**PROHIBITION:** Do not skip any phase. Do not jump back to an earlier phase without an explicit `REEVALUATE` trigger.

---

## RESUMING SESSION AFTER INTERRUPTION

### Detection
At every new interaction the Orchestrator checks:
1. Does `.github/docs/session/session-state.json` exist?
2. Is `status` anything other than `COMPLETE`?

→ Yes: **Resumable session detected.** Present to user:

```
SESSION RESUMED
Session ID: [id]
Started: [date]
Last activity: [date]
Status: [status]
Last agent: [agent]
Open escalations: [N]

Choose:
  [1] RESUME — continue from where stopped
  [2] RESET — start new session (existing state is archived)
```

### On RESUME:
- Load all `phase_outputs` that are not `null` as context
- Continue from `current_agent` in `current_phase`
- Reopen all `open_human_escalations` with status `OPEN` — re-present them
- Load all `insufficient_data_items` with status `OPEN` as context-warnings

### On RESET:
- Rename current `session-state.json` to `session-state-[session_id]-archived.json`
- Initialize new session state via Onboarding Agent

---

## STATE UPDATE PROTOCOL (FOR AGENTS)

Every agent reports at the end of their HANDOFF CHECKLIST:

```markdown
## STATE UPDATE
- Agent: [name]
- Output path: [path to output file]
- Status: COMPLETE | PARTIAL | BLOCKED
- New INSUFFICIENT_DATA items: [list or NONE]
- New open escalations: [list or NONE]
- Next agent (suggestion): [name]
```

The Orchestrator processes this and writes the state update to `session-state.json`.

---

## CYCLE TYPE CANONICAL MAPPING

The `cycle_type` field in session-state.json maps CLI commands to internal cycle types as follows:

| User Command | `cycle_type` Value | `scope` Value |
|---|---|---|
| `CREATE [project]` | `FULL_CREATE` | `["BUSINESS","TECH","UX","MARKETING"]` |
| `AUDIT [project]` | `FULL_AUDIT` | `["BUSINESS","TECH","UX","MARKETING"]` |
| `CREATE BUSINESS [project]` | `PARTIAL_CREATE` | `["BUSINESS"]` |
| `CREATE TECH [project]` | `PARTIAL_CREATE` | `["TECH"]` |
| `CREATE UX [project]` | `PARTIAL_CREATE` | `["UX"]` |
| `CREATE MARKETING [project]` | `PARTIAL_CREATE` | `["MARKETING"]` |
| `AUDIT BUSINESS [project]` | `PARTIAL_AUDIT` | `["BUSINESS"]` |
| `AUDIT TECH [project]` | `PARTIAL_AUDIT` | `["TECH"]` |
| `AUDIT UX [project]` | `PARTIAL_AUDIT` | `["UX"]` |
| `AUDIT MARKETING [project]` | `PARTIAL_AUDIT` | `["MARKETING"]` |
| `CREATE TECH UX [project]` | `COMBO_CREATE` | `["TECH","UX"]` |
| `AUDIT BUSINESS MARKETING [project]` | `COMBO_AUDIT` | `["BUSINESS","MARKETING"]` |
| `FEATURE [name]: [desc]` | `FEATURE` | `["BUSINESS","TECH","UX","MARKETING"]` |
| `REEVALUATE [scope]` | `REEVALUATE` | `["[scope]"]` (or `["BUSINESS","TECH","UX","MARKETING"]` for ALL) |
| `SCOPE CHANGE [DIM]: [desc]` | `SCOPE_CHANGE` | `["[DIM]"]` (or all 4 for ALL) |
| `HOTFIX [desc]` | `HOTFIX` | `[]` |
| `REFRESH ONBOARDING` | `REFRESH` | `[]` |

The `scope` array determines which phase agents the Orchestrator activates. CONTINUE uses `scope` to determine the next eligible phase.

---

## STORY STATUS STATE MACHINE (UNIFIED)

Story statuses flow through the system across multiple agents. This table defines the canonical mapping to prevent status loss between agents:

### Canonical story statuses

| Status | Owner | Meaning |
|---|---|---|
| `QUEUED` | Sprint Plan / Orchestrator | Story is in the backlog, not yet started |
| `NOT_READY` | Orchestrator (ORC-14) | Story failed Definition of Ready — deferred to next sprint |
| `IN_PROGRESS` | Implementation Agent | Story is actively being implemented |
| `IMPLEMENTED` | Implementation Agent | Code/infra complete, ready for testing |
| `TESTING` | Test Agent | Story is being tested |
| `TEST_FAILED` | Test Agent | Test rejected — returned to Implementation Agent |
| `REVIEW` | PR/Review Agent | Story is in code review |
| `REVIEW_FAILED` | PR/Review Agent | Review rejected — returned to Implementation Agent |
| `COMPLETED` | Orchestrator | Story passed all gates, PR merged, documented |
| `BLOCKED` | Any agent | Story cannot proceed — escalation raised |
| `BACKLOG` | Orchestrator | Story deferred (sprint-level BACKLOG or cascade) |
| `CANCELLED` | Scope Change Agent | Story invalidated by scope change |

### Valid transitions

```
QUEUED → IN_PROGRESS | NOT_READY | BLOCKED | BACKLOG | CANCELLED
NOT_READY → QUEUED (moved to next sprint, max 2×) | BLOCKED (after 2× NOT_READY)
IN_PROGRESS → IMPLEMENTED | BLOCKED
IMPLEMENTED → TESTING
TESTING → COMPLETED (tests pass) | TEST_FAILED
TEST_FAILED → IN_PROGRESS (rework)
IN_PROGRESS → REVIEW (when tests pass and PR created)
REVIEW → COMPLETED | REVIEW_FAILED
REVIEW_FAILED → IN_PROGRESS (rework)
BLOCKED → IN_PROGRESS (blocker resolved) | CANCELLED
BACKLOG → QUEUED (re-presented at Sprint Gate)
```

### Mapping from legacy/agent-specific statuses

| Agent-specific status | Canonical status |
|---|---|
| Sprint plan `QUEUED` | `QUEUED` |
| Sprint plan `IN_PROGRESS` | `IN_PROGRESS` |
| Sprint plan `COMPLETED` | `COMPLETED` |
| Sprint plan `BACKLOG` | `BACKLOG` |
| Implementation `IMPLEMENTED` | `IMPLEMENTED` |
| Implementation `PARTIAL` | `IN_PROGRESS` (rework needed) |
| Implementation `BLOCKED` | `BLOCKED` |
| Test `APPROVED` | `COMPLETED` (for story-level; or `REVIEW` if PR review follows) |
| Test `REJECTED` | `TEST_FAILED` |

The Orchestrator is responsible for translating agent-specific statuses to canonical statuses when updating `session-state.json`.

---

## SCOPE FIELD

The `scope` field is an array of discipline names that determines which phases are active in the current cycle:

| Discipline | Phase |
|---|---|
| `BUSINESS` | Phase 1 — Requirements & Strategy |
| `TECH` | Phase 2 — Architecture & Design |
| `UX` | Phase 3 — Experience Design |
| `MARKETING` | Phase 4 — Brand & Growth |

**Rules:**
- For `FULL_CREATE` / `FULL_AUDIT`: `scope` contains all 4 disciplines
- For `PARTIAL_*`: `scope` contains exactly 1 discipline
- For `COMBO_*`: `scope` contains 2 or 3 disciplines
- For `FEATURE`: `scope` contains all 4 disciplines (full cycle per feature)
- For `HOTFIX` / `REFRESH`: `scope` is empty (no phase agents activated)
- CONTINUE uses `scope` + `completed_phases` to determine which phase to activate next

---

## ARCHIVING

After `COMPLETE`:
- Rename `session-state.json` to `session-state-[session_id]-complete.json`
- Store in `.github/docs/session/archive/`
- For feature cycles: also store in `Workitems/[FEATURENAME]/session/`

````
