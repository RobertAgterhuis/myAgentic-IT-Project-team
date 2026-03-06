````markdown
# Contract: Implementation Output
> Version 1.0 | Phase 5 – Autonomous Implementation

---

## PURPOSE OF THIS CONTRACT

This contract defines what a **fully implemented sprint story** means in the autonomous implementation system. Every output of the Implementation Agent, Test Agent, and PR/Review Agent MUST comply with this contract before a handoff takes place.

---

## INPUT (MANDATORY PRESENT BEFORE IMPLEMENTATION STARTS)

> **SCOPE:** This contract applies exclusively to stories with `story_type` **`CODE`** or **`INFRA`**. Stories of type `DESIGN`, `CONTENT`, or `ANALYSIS` are **NOT** processed by the Implementation Agent pipeline. Upon receiving a story with a different type: `ROUTING_ERROR` → escalate to Orchestrator.

| Field | Source | Required |
|------|------|-----------|
| Sprint story (SP-N-NNN) | Approved sprint plan from Phases 1–4 | YES |
| story_type | Sprint story column "Type" — MUST be `CODE` or `INFRA` | YES |
| sprint_status | Sprint story column "sprint_status" — MUST be `IN_PROGRESS` | YES |
| Architecture decisions | Phase 2 output (Software Architect + Senior Developer) | YES |
| Tech stack definition | Phase 2 output | YES |
| Guardrails (all phases) | `.github/docs/guardrails/00-09` | YES |
| Acceptance criteria | Sprint story column "Acceptance Criteria" | YES |
| Blocker status | Sprint story column "Blocker" — MUST be `NONE` or INTERNALLY resolved | YES |
| Codebase access | Git repository (read + write) | YES |

**HALT:** If any of the above mandatory inputs is missing, if `story_type` is not `CODE` or `INFRA`, if `sprint_status` is not `IN_PROGRESS`, or if the Blocker status is `EXTERN: [open]` → do NOT start implementation. Escalate to Orchestrator.

---

## OUTPUT PER STORY (MANDATORY)

**Output file path:** `.github/docs/phase-5/sprint-[SP-N]/impl-[STORY-ID].md`

### A. Code Changes
```
IMPL-OUTPUT-A:
- Changed files: list of absolute paths
- Added files: list of absolute paths
- Deleted files: list of absolute paths
- Reason per change: one sentence per file linked to acceptance criterion
```

**PROHIBITION:** Do not change code outside the story scope without an explicit `SCOPE_EXTENSION: [reason]` notification.

### B. Test Coverage
```
IMPL-OUTPUT-B:
- New tests: file path + test name + which acceptance criterion it covers
- Changed tests: file path + reason
- Coverage delta: [before implementation] → [after implementation]
- All existing tests: PASSED / FAILED (with details on FAILED)
```

**PROHIBITION:** A story is NOT complete if existing tests break due to the implementation.  
**PROHIBITION:** A story is NOT complete if there is no test for every acceptance criterion.

### C. Guardrail Validation
```
IMPL-OUTPUT-C:
Per guardrail file (00–09):
- Status: COMPLIANT / VIOLATION / NOT_APPLICABLE
- On VIOLATION: describe exactly which rule, why, and what the remediation action is
```

**PROHIBITION:** A story with an unresolved VIOLATION may NOT proceed to Test Agent.

### D. Story Completion Declaration
```
IMPL-OUTPUT-D:
Story ID: SP-N-NNN
Recommendation reference: REC-NNN
Status: IMPLEMENTED / PARTIAL / BLOCKED
Acceptance criteria:
  - AC-1: COVERED BY [testname] | PASSED/FAILED
  - AC-2: COVERED BY [testname] | PASSED/FAILED
Outstanding items: [NONE or description]
Escalations: [NONE or ESCALATE: description]
```

---

## OUTPUT PER SPRINT (MANDATORY AFTER ALL STORIES)

### Sprint Completion Report
```json
{
  "sprint_id": "SP-N",
  "stories": [
    {
      "story_id": "SP-N-NNN",
      "status": "IMPLEMENTED | PARTIAL | BLOCKED",
      "acceptance_criteria_passed": true,
      "tests_added": 0,
      "tests_passed": 0,
      "tests_failed": 0,
      "guardrail_violations": [],
      "changed_files": []
    }
  ],
  "sprint_kpi_measurement": {
    "kpi_id": "KPI-NNN",
    "baseline": null,
    "measured_after_sprint": null,
    "target_met": null
  },
  "blockers_resolved": [],
  "blockers_open": [],
  "parallel_tracks_executed": [],
  "new_critical_findings": []
}
```

**PROHIBITION:** `new_critical_findings` may NEVER be filled without escalation to Orchestrator.

---

## JSON Export

The Sprint Completion Report JSON (see "OUTPUT PER SPRINT" section above) serves as the JSON export for this contract.

---

## DEFINITION OF DONE (PER STORY)

A story is DONE when:
- [ ] All code changes have been applied
- [ ] All acceptance criteria are covered by tests
- [ ] All existing tests PASSED (no regression)
- [ ] Guardrail validation: COMPLIANT or documented VIOLATION with remediation action
- [ ] Story Completion Declaration is completed
- [ ] Code review by PR/Review Agent is APPROVED

## DEFINITION OF DONE (PER SPRINT)

A sprint is DONE when:
- [ ] All stories in the sprint are DONE (or BLOCKED with escalation)
- [ ] Sprint KPI measurement has been executed and documented
- [ ] Sprint Completion Report JSON is machine-readable and complete
- [ ] All INTERN blockers are resolved
- [ ] No new CRITICAL_FINDING without resolution
- [ ] Critic Agent validation PASSED
- [ ] Risk Agent validation PASSED

---

## HANDOFF CHECKLIST (IMPLEMENTATION AGENT → TEST AGENT)
```
## IMPLEMENTATION HANDOFF CHECKLIST – [Story ID] – [Date]
- [ ] IMPL-OUTPUT-A present (changed files documented)
- [ ] IMPL-OUTPUT-B present (tests written per acceptance criterion)
- [ ] IMPL-OUTPUT-C present (guardrail validation complete)
- [ ] IMPL-OUTPUT-D present (story completion declaration)
- [ ] No scope extension without SCOPE_EXTENSION notification
- [ ] No EXTERN-open blockers
- [ ] No new CRITICAL_FINDING without escalation
```

## HANDOFF CHECKLIST (TEST AGENT → PR/REVIEW AGENT)
```
## TEST HANDOFF CHECKLIST – [Sprint ID] – [Date]
- [ ] All stories: acceptance criteria tests PASSED
- [ ] All existing tests PASSED (no regression)
- [ ] Coverage delta documented
- [ ] Sprint Completion Report JSON present
- [ ] No VIOLATION in IMPL-OUTPUT-C without resolution
```

## HANDOFF CHECKLIST (PR/REVIEW AGENT → ORCHESTRATOR)
```
## PR HANDOFF CHECKLIST – [Sprint ID] – [Date]
- [ ] PR created with correct description and story references
- [ ] All checks green (CI/CD, tests, linting)
- [ ] Guardrail review COMPLIANT
- [ ] Sprint Completion Report attached to PR
- [ ] KPI measurement documented
- [ ] Orchestrator Log updated
```

---

## VALIDATION CRITERIA (AUTOMATIC REJECT)

An output is automatically rejected if:
1. One or more acceptance criteria are not covered by a test
2. Existing tests break due to the implementation (regression)
3. A VIOLATION in guardrail validation is documented without remediation action
4. Story Completion Declaration is missing
5. New `CRITICAL_FINDING` without escalation is present
6. Sprint KPI measurement is missing in Sprint Completion Report

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

````
