````markdown
# Recommendations Output Contract
> Version: 1.0 | Applies to all recommendations deliverables of all agents

---

## PURPOSE
This contract defines the mandatory structure and quality requirements for the **Recommendations** deliverable.
Every recommendation must be substantiated, measurable, and dependency-aware.

---

## MANDATORY SCHEMA

### MARKDOWN STRUCTURE

```markdown
# Recommendations – [Discipline] – [Date]

## Metadata
- Agent: [name]
- Phase: [1 / 2 / 3 / 4]
- Based on analysis: [reference to analysis document]
- Date: [ISO 8601]

## Scope Change Impact — Recommendations *(SCOPE_CHANGE mode only — omit in normal cycles)*
> Required as the FIRST section (directly after Metadata) when `cycle_type: SCOPE_CHANGE` in session state. Used by Synthesis Agent (17) for SC-[N] impact summaries in department reports.

| Status | Recommendation ID | Reason |
|--------|------------------|--------|
| Still Applicable | REC-NNN | [one-line reason why still relevant under new premise] |
| Superseded | REC-NNN | [what changed that makes this recommendation no longer applicable] |
| Net-New | REC-NNN | [short description of recommendation with no equivalent in prior analysis] |

## Recommendation [REC-NNN]

### Problem
[Concrete description of the problem or design challenge – reference finding ID from analysis]
**Analysis reference:** [GAP-NNN / RISK-NNN / CS-NNN / DESIGN-NNN]

### Solution
[Concrete, specific solution – not generic]
**Implementation approach:**
1. Step 1: [what, how, by whom, when]
2. Step 2: [...]

### Impact
| Dimension | Expected effect | Rationale |
|----------|----------------|-----------|
| Revenue | [amount / % / INSUFFICIENT_DATA:] | [substantiation or data source] |
| Risk Reduction | [description + level] | [substantiation] |
| Cost | [amount / % / INSUFFICIENT_DATA:] | [substantiation] |
| UX | [description] | [substantiation] |

### Rationale
[Theoretical framework, proven approach, or data that substantiates the choice]

### Dependencies
- Requires: [other recommendation / technical requirement / external factor]
- Blocked by: [if applicable]
- Depends on output of: [agent name if applicable]

### Risk of Not Implementing
[What are the consequences if this recommendation is NOT implemented]

### Measurement Criterion
- KPI: [specific KPI]
- Baseline: [current value or INSUFFICIENT_DATA:]
- Target: [intended value]
- Measurement method: [how measured]
- Time horizon: [when to measure]

---

## PRIORITY MATRIX (MANDATORY)

| Recommendation ID | Impact | Effort | Priority | Sprint |
|----------------|--------|--------|------------|--------|
| REC-001 | High | Low | P1 | Sprint 1 |
| REC-002 | [...] | [...] | [...] | [...] |

Impact and Effort: High / Medium / Low (with explicit rationale in appendix)

## HANDOFF CHECKLIST
- [ ] All recommendations reference an analysis finding (GAP/RISK/CS/DESIGN ID)
- [ ] All impacts have rationale (no empty cells)
- [ ] All INSUFFICIENT_DATA: items are documented
- [ ] Measurement criteria are SMART formulated
- [ ] Priority matrix is fully completed
- [ ] Dependencies are documented
- [ ] No recommendations outside competence domain
- [ ] If cycle_type is SCOPE_CHANGE: Scope Change Impact — Recommendations section present as FIRST section (Still Applicable / Superseded / Net-New) (or `NOT_APPLICABLE` — normal cycle)
- [ ] JSON export is valid and complete
```

---

## JSON EXPORT SCHEMA

```json
{
  "metadata": {
    "agent": "string",
    "phase": "1 | 2 | 3 | 4",
    "date": "ISO 8601",
    "based_on_analysis": "string"
  },
  "recommendations": [
    {
      "id": "REC-001",
      "problem": "string",
      "analysis_reference": ["GAP-001", "RISK-001", "DESIGN-001"],
      "solution": {
        "description": "string",
        "steps": ["string"]
      },
      "impact": {
        "revenue": "string | null",
        "risk_reduction": "string",
        "cost": "string | null",
        "ux": "string | null",
        "rationale": "string"
      },
      "rationale": "string",
      "dependencies": {
        "requires": ["string"],
        "blocked_by": ["string"],
        "depends_on_agent": ["string"]
      },
      "risk_of_not_implementing": "string",
      "measurement": {
        "kpi": "string",
        "baseline": "string | null",
        "target": "string",
        "method": "string",
        "horizon": "string"
      },
      "priority": "P1 | P2 | P3",
      "effort": "High | Medium | Low",
      "sprint": "string"
    }
  ],
  "priority_matrix": [
    {
      "id": "REC-001",
      "impact": "High | Medium | Low",
      "effort": "High | Medium | Low",
      "priority": "P1 | P2 | P3",
      "sprint": "string"
    }
  ],
  "handoff_checklist": {
    "all_recs_reference_analysis": true,
    "all_impacts_have_rationale": true,
    "insufficient_data_documented": true,
    "smart_criteria": true,
    "priority_matrix_complete": true,
    "dependencies_documented": true,
    "no_out_of_scope_recs": true,
    "scope_change_impact_present": "true | NOT_APPLICABLE",
    "mode_consistent": "true",
    "json_valid": true,
    "ready_for_handoff": true
  }
}
```

---

## REJECTION CRITERIA
A recommendations document is REJECTED if:
- A recommendation has no reference to an analysis finding
- Impact fields are empty without `INSUFFICIENT_DATA:` marking
- Measurement criteria are missing or not SMART
- The priority matrix is missing
- A recommendation falls outside the competence domain

````
