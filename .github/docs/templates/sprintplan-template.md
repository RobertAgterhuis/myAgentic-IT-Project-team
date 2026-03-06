# Sprint Plan Template
> Use this template for the sprint plan deliverable of each agent.
> See `.github/docs/contracts/sprintplan-output-contract.md` for the full requirements.

---

```markdown
# Sprint Plan – [FILL IN DISCIPLINE] – [DATE ISO 8601]

## Metadata
- **Agent:** [name]
- **Phase:** [1 / 2 / 3 / 4]
- **Based on recommendations:** [reference to recommendations document]
- **Date:** [YYYY-MM-DD]
- **Total scope:** [N sprints]

---

## ⚠️ MANDATORY ASSUMPTIONS (FILL IN BEFORE SPRINT PLAN)

> If these assumptions are not available: mark as INSUFFICIENT_DATA: and do NOT create a fictitious plan.

- **Team composition:** [roles + number of people – e.g. "2 backend developers, 1 designer"]
- **Sprint duration:** [N weeks – default 2 weeks]
- **Capacity per sprint:** [story points or hours – e.g. "40 story points per sprint"]
- **Technology stack:** [relevant for execution]
- **Prerequisites:** [what must be in place before sprint 1 starts]
- **Blocked items:** [what CANNOT start without external input or decision]

**Assumption status:** Fully available / Partially available (INSUFFICIENT_DATA: [items]) / Not available (HALT)

---

## SPRINT 1 – [Sprint name]

### Sprint Goal
> What is the OUTCOME (result for the business/user), not just the output?

[Describe the concrete result that is visible to a user or stakeholder after this sprint]

### Stories

| Story ID | Description | Acceptance Criteria | Story Points | Dependencies | Recommendation Ref |
|----------|-------------|-------------------|--------------|-----------------|-----------------|
| SP-1-001 | [concrete, specific task] | [SMART, testable – minimum 1 criterion] | [number] | [story ID or "none"] | REC-NNN |
| SP-1-002 | [...] | [...] | [...] | [...] | [...] |

> **Acceptance criteria format:** "Given [context], when [action], then [expected result]"

### Sprint KPIs

| KPI | Baseline | Target after sprint | Measurement method | Measurement owner |
|-----|----------|-----------------|-------------|----------------------|
| [name] | [value or INSUFFICIENT_DATA:] | [concrete value] | [how to measure] | [role] |

### Definition of Done – Sprint 1
- [ ] All stories have met their acceptance criteria
- [ ] Code review performed for all changed code
- [ ] Automated tests passed
- [ ] KPI measurement performed and documented
- [ ] Documentation updated where applicable
- [ ] No new `CRITICAL_FINDING` introduced
- [ ] Demo performed for stakeholder

---

## SPRINT 2 – [Sprint name]

### Sprint Goal
[...]

### Stories

| Story ID | Description | Acceptance Criteria | Story Points | Dependencies | Recommendation Ref |
|----------|-------------|-------------------|--------------|-----------------|-----------------|
| SP-2-001 | [...] | [...] | [...] | SP-1-001 | REC-NNN |

### Sprint KPIs
[...]

### Definition of Done – Sprint 2
[Repeat DoD structure]

---

## DEPENDENCY OVERVIEW

> Document all cross-story dependencies.

| Story | Depends on | Reason |
|-------|----------------|-------|
| SP-2-001 | SP-1-001 | [why this order is required] |

---

## SPRINT PLAN RISK LOG

| Risk | Probability | Impact | Mitigation | Sprint |
|--------|------|--------|-----------|--------|
| [description] | High/Medium/Low | High/Medium/Low | [concrete action] | [sprint N] |

---

## HANDOFF CHECKLIST

- [ ] Mandatory assumptions are explicitly documented (or INSUFFICIENT_DATA:)
- [ ] Every story has at least one SMART acceptance criterion
- [ ] Every story has a story point estimate (or INSUFFICIENT_DATA: with reason)
- [ ] Sprint KPIs are formulated as SMART
- [ ] Sprint goals are outcome-oriented (not just output)
- [ ] Dependencies are fully documented
- [ ] Definition of Done is present per sprint
- [ ] No fictitious capacity assumptions (or explicitly labeled as assumption)
- [ ] Risk log present
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
    "based_on_recommendations": "",
    "total_sprints": 0
  },
  "assumptions": {
    "team_composition": "",
    "sprint_duration_weeks": 2,
    "capacity_per_sprint": "",
    "prerequisites": [],
    "blocked_items": []
  },
  "sprints": [],
  "dependency_map": [],
  "risk_log": [],
  "handoff_checklist": {
    "ready_for_handoff": false
  }
}
```
```
