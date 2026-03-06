````markdown
# Agent Handoff Contract
> Version: 1.0 | Applies to EVERY transfer of output between agents

---

## PURPOSE
This contract defines the mandatory handoff procedure that every agent must complete before its output proceeds to the next agent.
A handoff is NOT valid if this contract has not been fully completed.

---

## HANDOFF PROCEDURE (MANDATORY IN THIS ORDER)

### Step 1: Perform Self-Check
Before declaring a handoff, perform an explicit self-check:

```
1. Read your complete output from beginning to end
2. Check every section for completeness (no empty sections, no placeholders)
3. Check every finding for source citation
4. Check that the JSON schema is valid (syntactically correct, all required fields present)
5. Check internal consistency (no contradictory statements)
6. Check that your output provides the next agent with sufficient input
```

**If you cannot complete step 1:** Stop, fix the output, and repeat step 1.

### Step 2: Complete the Handoff Checklist
Produce the handoff checklist as the last section of your output:

```markdown
## HANDOFF CHECKLIST – [Agent name] – [Date]

### Deliverables Completeness
- [ ] Analysis document present and per analysis-output-contract.md
- [ ] Recommendations document present and per recommendations-output-contract.md
- [ ] Sprint Plan present and per sprintplan-output-contract.md
- [ ] Guardrails present and per guardrails-output-contract.md

### Quality Control
- [ ] All findings have a concrete source citation
- [ ] No empty sections or placeholder text
- [ ] No generated/fabricated metrics or KPI values
- [ ] All UNCERTAIN: items are documented
- [ ] All INSUFFICIENT_DATA: items are documented and escalated
- [ ] All INSUFFICIENT_DATA: items tagged with QUESTIONNAIRE_REQUEST in handoff message
- [ ] Step 0 questionnaire context acknowledged (CONSUMED or NOT_INJECTED documented)
- [ ] Internal consistency verified (no contradictory statements)

### Input for Next Agent
- [ ] JSON export available and syntactically valid
- [ ] All required input fields for next agent are present
- [ ] Blocked items are marked and escalated
- [ ] Cross-domain findings have been forwarded to Orchestrator

### Guardrails Compliance
- [ ] Global guardrails (00-global-guardrails.md) have been followed
- [ ] Domain-specific guardrails have been followed
- [ ] No GUARDRAIL_VIOLATION items unresolved

### Final Declaration
- [ ] AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS NOT CHECKED.
- STATUS: READY FOR HANDOFF / BLOCKED (strike through what does not apply)
- Unresolved items: [list or "none"]
```

### Step 3: Handle Blocking Items
If one or more items in the checklist are NOT checked:
1. Document the blocking item
2. Fix the item if you can do so yourself
3. Escalate to Orchestrator if external input is needed
4. Repeat step 1

**NEVER perform a handoff with outstanding checklist items.**

### Step 4: Produce Handoff Message

```json
{
  "handoff": {
    "from_agent": "string",
    "to_agent": "string | orchestrator",
    "phase_completed": "1 | 2 | 3 | 4",
    "date": "ISO 8601",
    "status": "READY | BLOCKED",
    "blocked_reason": "string | null",
    "deliverables": {
      "analysis": "path/to/analysis.md",
      "recommendations": "path/to/recommendations.md",
      "sprintplan": "path/to/sprintplan.md",
      "guardrails": "path/to/guardrails.md",
      "json_export": "path/to/export.json"
    },
    "uncertain_items": ["UNC-001"],
    "insufficient_data_items": ["IND-001"],
    "questionnaire_requests": ["IND-001"],
    "cross_domain_flags": ["OUT_OF_SCOPE: [domain]"],
    "security_flags": ["SECURITY_FLAG: [description]"],
    "checklist_complete": true
  }
}
```

---

## PHASE TRANSITIONS AND VALIDATION

| From | To | Required validation |
|-----|------|--------------------|
| Phase 1 → Phase 2 | Architect | Critic Agent + Risk Agent validation MANDATORY |
| Phase 2 → Phase 3 | UX Researcher | Critic Agent + Risk Agent validation MANDATORY |
| Phase 3 → Phase 4 | Brand Strategist | Critic Agent + Risk Agent validation MANDATORY |
| Phase 4 → Synthesis | Synthesis Agent | Critic Agent + Risk Agent validation MANDATORY |
| Every agent → Next in phase | Next agent | Handoff checklist MANDATORY |

---

## ESCALATION PATH

```
Agent cannot complete handoff
  ↓
Document blocking item in handoff message
  ↓
status: "BLOCKED"
  ↓
Orchestrator receives blocked handoff message
  ↓
Orchestrator decides: resolve / alternative path / escalate to human
```

````
