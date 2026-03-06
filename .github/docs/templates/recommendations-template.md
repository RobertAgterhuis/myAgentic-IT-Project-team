# Recommendations Template
> Use this template for the recommendations deliverable of each agent.
> See `.github/docs/contracts/recommendations-output-contract.md` for the full requirements.

---

```markdown
# Recommendations – [FILL IN DISCIPLINE] – [DATE ISO 8601]

## Metadata
- **Agent:** [name]
- **Phase:** [1 / 2 / 3 / 4]
- **Based on analysis:** [reference to analysis document]
- **Date:** [YYYY-MM-DD]

---

## REC-001 – [Short title of the recommendation]

### Problem
[Concrete description of the problem this recommendation solves]
**Analysis reference:** [GAP-NNN] and/or [RISK-NNN] and/or [CS-NNN]

### Solution
[Concrete, specific solution. NOT generic. NOT "improve X".]

**Implementation approach:**
1. **Step 1:** [What, How, By whom, When]
2. **Step 2:** [...]
3. **Step 3:** [...]

### Impact

| Dimension | Expected effect | Rationale / Data source |
|----------|----------------|---------------------|
| Revenue | [amount / % / INSUFFICIENT_DATA:] | [substantiation – or reason for INSUFFICIENT_DATA] |
| Risk Reduction | [description + before/after level] | [substantiation] |
| Cost | [amount / % savings / INSUFFICIENT_DATA:] | [substantiation] |
| UX | [description] | [substantiation] |

### Rationale
[Theoretical framework OR proven approach OR data that substantiates the choice.
Reference frameworks, literature, or measurement data. NO "this is best practice" without explanation.]

### Dependencies
- **Required before execution:** [other recommendation ID / technical requirement / external factor]
- **Blocked by:** [if applicable – otherwise "none"]
- **Dependent on output from:** [agent name – if applicable]

### Risk of NOT implementing
[What are the concrete consequences if this recommendation is not implemented?]

### Measurement Criterion
- **KPI:** [specific, measurable KPI]
- **Baseline:** [current value or INSUFFICIENT_DATA:]
- **Target:** [intended value after implementation]
- **Measurement method:** [how and where to measure]
- **Time horizon:** [when is the result measurable – e.g. "after 1 sprint", "after 3 months"]

---

## REC-002 – [Short title]

[Repeat the above structure]

---

## REC-NNN – [...]

[...]

---

## PRIORITY MATRIX (MANDATORY)

> Sort by priority. Justify every Impact and Effort estimate.

| Recommendation ID | Description | Impact | Effort | Priority | Suggested Sprint |
|----------------|-------------|--------|--------|------------|---------------------|
| REC-001 | [...] | High / Medium / Low | High / Medium / Low | P1 / P2 / P3 | Sprint [N] |

**Impact rationale:**
- REC-001: [why High/Medium/Low impact]
- REC-002: [...]

**Effort rationale:**
- REC-001: [why High/Medium/Low effort]
- REC-002: [...]

---

## HANDOFF CHECKLIST

- [ ] Every recommendation references an analysis finding (GAP/RISK/CS ID)
- [ ] No empty impact cells (or explicitly INSUFFICIENT_DATA:)
- [ ] All impacts have a rationale or data source
- [ ] All measurement criteria are SMART (Specific, Measurable, Achievable, Realistic, Time-bound)
- [ ] Dependencies are fully documented
- [ ] Priority matrix is fully completed
- [ ] No recommendations outside the competence domain of this agent
- [ ] JSON export present and syntactically valid
- [ ] No generated/estimated impact figures without data source
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
  "recommendations": [],
  "priority_matrix": [],
  "handoff_checklist": {
    "ready_for_handoff": false
  }
}
```
```
