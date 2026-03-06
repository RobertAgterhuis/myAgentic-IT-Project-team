# Guardrail Template
> Use this template for the guardrail deliverable of each agent.
> See `.github/docs/contracts/guardrails-output-contract.md` for the full requirements.

---

```markdown
# Guardrails – [FILL IN DISCIPLINE] – [DATE ISO 8601]

## Metadata
- **Agent:** [name]
- **Phase:** [1 / 2 / 3 / 4]
- **Based on analysis:** [reference to analysis document]
- **Date:** [YYYY-MM-DD]

---

> ⚠️ REMINDER: A guardrail is a TESTABLE, BINDING decision rule.
> Formulate as a prohibition or obligation. Start with a verb.
> Every guardrail MUST have a violation action and verification method.
>
> INVALID: "Ensure good code quality"
> VALID: "Code must not be merged without code review by a senior (G-DISC-001)"

---

## G-[DISC]-001 – [Guardrail title]

### Scope
- **Applies to:** [which agents / phases / artifacts / decisions]
- **Time horizon:** [permanent / until sprint N / review date YYYY-MM-DD]

### Rule
> Start with a verb. Formulate concretely and testably.

[E.g.: "Must not be merged" / "Must always contain" / "Requires approval from" / "Is prohibited unless"]

### Violation Action
> What happens concretely when this guardrail is violated?

1. Mark as `GUARDRAIL_VIOLATION: G-[DISC]-001`
2. [Concrete follow-up action – e.g. "Block handoff", "Escalate to Orchestrator", "Revert the change"]
3. [Remediation step]

### Rationale
> Why is this a guardrail? Reference a concrete finding.

**Based on:** [RISK-NNN] / [GAP-NNN] / [CS-NNN]
[Description: what risk or gap justifies this guardrail?]

### Verification Method
> How do you verify whether an artifact complies with this guardrail?

[E.g.: "Automated test in CI pipeline", "Checklist item in code review", "Manual audit at sprint review", "Automated linting rule"]

---

## G-[DISC]-002 – [Guardrail title]

### Scope
[...]

### Rule
[...]

### Violation Action
[...]

### Rationale
[...]

### Verification Method
[...]

---

## G-[DISC]-NNN – [...]

[Repeat the above structure for each guardrail]

---

## GUARDRAIL OVERVIEW

| ID | Title | Applies to | Priority | Verification Method |
|----|-------|------------------|------------|-------------------|
| G-[DISC]-001 | [...] | [...] | Critical / High / Medium | [...] |
| G-[DISC]-002 | [...] | [...] | [...] | [...] |

---

## HANDOFF CHECKLIST

- [ ] All guardrails are formulated testably (start with verb, concrete condition)
- [ ] All guardrails have an explicit violation action
- [ ] All guardrails have a rationale referencing an analysis finding
- [ ] All guardrails have a concrete verification method
- [ ] Overview table is complete and consistent with individual guardrails
- [ ] No duplicates with existing guardrails in `/.github/docs/guardrails/`
- [ ] JSON export present and syntactically valid
- [ ] Self-review performed

**STATUS: READY FOR HANDOFF / BLOCKED**

---

## JSON EXPORT

```json
{
  "metadata": {
    "agent": "",
    "phase": "",
    "date": "",
    "based_on_analysis": ""
  },
  "guardrails": [
    {
      "id": "G-DISC-001",
      "title": "",
      "scope": {
        "applies_to": [],
        "time_horizon": "permanent"
      },
      "rule": "",
      "violation_action": "",
      "rationale": "",
      "analysis_reference": [],
      "verification_method": "",
      "priority": "Critical | High | Medium"
    }
  ],
  "handoff_checklist": {
    "ready_for_handoff": false
  }
}
```
```
