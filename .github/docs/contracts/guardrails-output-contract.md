````markdown
# Guardrails Output Contract
> Version: 1.0 | Applies to all guardrail deliverables of all agents

---

## PURPOSE
This contract defines the structure for the **Guardrails** deliverable per discipline.
A guardrail is a TESTABLE, BINDING decision rule — NOT a vague guideline.

---

## Output File Path

`.github/docs/phases/phase-N-[discipline]-guardrails.md`

Where `N` is the phase number (1–4) and `[discipline]` is the lowercase discipline name (e.g., `phase-4-marketing-guardrails.md`).

---

## DEFINITION OF A GUARDRAIL
A guardrail:
- Formulates a **prohibition** or **obligation** in concrete terms
- Is **testable**: you can determine whether a decision or artifact violates the guardrail
- Has a **violation action**: what happens if the guardrail is breached
- Has a **scope**: for whom and when the guardrail applies
- Has a **rationale**: why this is a guardrail

**NOT valid as a guardrail:** "Ensure good code quality"  
**VALID:** "Code may not be merged to production without 80% test coverage (G-ARCH-10)"

---

## MANDATORY SCHEMA

### MARKDOWN STRUCTURE

```markdown
# Guardrails – [Discipline] – [Date]

## Metadata
- Agent: [name]
- Phase: [1 / 2 / 3 / 4]
- Date: [ISO 8601]
- Based on analysis: [reference]
- Mode: [CREATE | AUDIT]

## Scope Change Impact *(SCOPE_CHANGE mode only — omit in normal cycles)*
> Required as the FIRST section when `cycle_type: SCOPE_CHANGE` in session state.
### Still Valid
- [G-DISC-NNN]: [one sentence — guardrail still applicable under the new premise]
### Superseded
- [G-DISC-NNN]: [what changed that makes this guardrail no longer applicable or requiring revision]
### Net-New
- [G-DISC-NNN new]: [description of guardrail with no equivalent in the prior analysis]

## Guardrail [G-DISC-NNN]

### Title
[Short, descriptive name]

### Scope
- Applies to: [which agents / phases / artifacts]
- Time horizon: [permanent / until sprint N / review date]

### Rule
[Concrete, testable formulation. Start with a verb: "May not", "Must always", "Requires", etc.]

### Violation Action
[What happens on breach? E.g.: "Mark as GUARDRAIL_VIOLATION: G-DISC-NNN, block handoff, escalate to Orchestrator"]

### Rationale
[Why is this a guardrail? Based on which finding or risk? Reference RISK-NNN or GAP-NNN]

### Verification Method
[How do you verify whether an artifact complies? E.g.: "Automated test present in CI", "Code review checklist item", "Manual audit at every sprint review"]

---

## Guardrail Overview

| ID | Title | Scope | Priority | Verification |
|----|-------|-------|------------|-------------|
| G-DISC-001 | [...] | [...] | Critical / High / Medium | [...] |

## HANDOFF CHECKLIST
- [ ] All guardrails are formulated as testable
- [ ] All guardrails have a violation action
- [ ] All guardrails have a rationale with source reference
- [ ] All guardrails have a verification method
- [ ] Overview table is complete
- [ ] No duplicates with existing guardrails in /.github/docs/guardrails/
- [ ] If cycle_type is SCOPE_CHANGE: `## Scope Change Impact` section present as FIRST section with Still Valid / Superseded / Net-New sub-sections (or `NOT_APPLICABLE` — normal cycle)
- [ ] JSON export is valid
```

---

## JSON EXPORT SCHEMA

```json
{
  "metadata": {
    "agent": "string",
    "phase": "1 | 2 | 3 | 4",
    "date": "ISO 8601",
    "based_on_analysis": "string",
    "mode": "CREATE | AUDIT"
  },
  "guardrails": [
    {
      "id": "G-DISC-001",
      "title": "string",
      "scope": {
        "applies_to": ["string"],
        "time_horizon": "string"
      },
      "rule": "string",
      "violation_action": "string",
      "rationale": "string",
      "analysis_reference": ["RISK-001", "GAP-001"],
      "verification_method": "string",
      "priority": "Critical | High | Medium"
    }
  ],
  "handoff_checklist": {
    "all_testable": true,
    "all_have_violation_action": true,
    "all_have_rationale": true,
    "all_have_verification": true,
    "overview_complete": true,
    "no_duplicates_with_existing": true,
    "scope_change_impact_present": "true | NOT_APPLICABLE",
    "json_valid": true,
    "ready_for_handoff": true
  }
}
```

---

## VALIDATION CRITERIA
A guardrail document is REJECTED if:
- A guardrail is not formulated as testable
- A violation action is missing
- A rationale does not reference an analysis finding
- A verification method is missing

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

````
