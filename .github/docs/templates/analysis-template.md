# Analysis Template
> Use this template for the analysis deliverable of each agent.
> See `.github/docs/contracts/analysis-output-contract.md` for the full requirements.

---

```markdown
# Analysis – [FILL IN DISCIPLINE] – [DATE ISO 8601]

## Metadata
- **Agent:** [name of the agent]
- **Phase:** [1 / 2 / 3 / 4]
- **Input received from:** [name of previous agent or "initial – no previous agent"]
- **Date:** [YYYY-MM-DD]
- **Software under analysis:** [name + version if available, otherwise INSUFFICIENT_DATA: — omit in CREATE mode]
- **Project name:** [name of the project — CREATE mode]
- **Mode:** [CREATE | AUDIT]
- **Analysis scope:** [what has and has not been analyzed, and why]

---

## 1. INPUT INVENTORY

> Document ALL available artifacts. This is mandatory before any analysis.

| Artifact type | Available | Description/Location | Impact if missing |
|---------------|-------------|---------------------|---------------------|
| [type] | Yes / No | [path or description] | [impact] |

**Missing artifacts that affect analysis quality:**
- `INSUFFICIENT_DATA: [artifact]` – Consequence: [description]

---

## 2. CURRENT STATE (AUDIT mode) / SOLUTION DESIGN (CREATE mode)

> **AUDIT mode:** Minimum 5 findings about the existing system. Each finding MUST have a source reference.
> **CREATE mode:** Minimum 5 design decisions or solution elements. Each MUST reference a requirement, constraint, or stakeholder input.

### CS-001 – [Finding title]
- **Finding:** [Concrete, specific description – no generic statements]
- **Source:** `[filename:linenumber]` or `[document name, page N]` or `[interview: name, date]` or `[requirement:ID]`
- **Impact:** High / Medium / Low
- **Notes:** [additional context if needed]

### CS-002 – [Finding title]
- **Finding:** 
- **Source:** 
- **Impact:** 

### CS-003 – [Finding title]
[...]

---

## 3. GAPS (AUDIT mode) / REQUIREMENTS GAPS (CREATE mode)

> Per gap: what is missing or inadequate, demonstrated with a source.

### GAP-001 – [Gap title]
- **Description:** [what is missing or suboptimal]
- **Source:** [how was this demonstrated?]
- **Risk if unresolved:** [description of consequence]
- **Priority:** Critical / High / Medium / Low

### GAP-002 – [Gap title]
[...]

---

## 4. RISKS

> Per risk: probability × impact scoring, mitigation option.

### RISK-001 – [Risk title]
- **Description:** [what could go wrong]
- **Probability:** High / Medium / Low
- **Impact:** High / Medium / Low
- **Risk score:** Critical / High / Medium / Low
- **Mitigation option(s):**
  1. [concrete mitigation]
- **Source:** [on what is this risk based]

---

## 5. KPI BASELINE

> Use ONLY data that is demonstrably available. Never estimate.

| KPI | Current value | Source | Measurement method | Status |
|-----|----------------|------|-------------|--------|
| [name] | [value or INSUFFICIENT_DATA:] | [source or n/a] | [method] | Available / INSUFFICIENT_DATA |

---

## 6. UNCERTAIN ITEMS

> Every assertion where you are not 100% certain of the source.

- `UNCERTAIN: [description]`
  - **Reason for uncertainty:** [...]
  - **Escalation action:** [to whom, for what]

---

## 7. INSUFFICIENT DATA ITEMS

> Mandatory sections that could not be filled due to missing input.

- `INSUFFICIENT_DATA: [section/field]`
  - **Missing:** [what]
  - **Impact on analysis:** [impact on completeness]
  - **Escalation:** [action]

---

## HANDOFF CHECKLIST

> All items must be checked before handoff. No exceptions.

- [ ] Input inventory completely documented
- [ ] Current State / Solution Design: minimum 5 findings, all with source reference
- [ ] Gaps: all gaps prioritized, all with source
- [ ] Risks: all risks scored with mitigation
- [ ] KPI Baseline: all known KPIs documented, missing ones as INSUFFICIENT_DATA:
- [ ] All UNCERTAIN: items documented and escalated
- [ ] All INSUFFICIENT_DATA: items documented and escalated
- [ ] JSON export below present and syntactically valid
- [ ] No empty sections or placeholder text ([TODO], [FILL IN], etc.)
- [ ] No contradictory statements in this document
- [ ] Global guardrails (00-global-guardrails.md) complied with
- [ ] Domain-specific guardrails complied with
- [ ] Self-review performed: output read from beginning to end

**STATUS: READY FOR HANDOFF / BLOCKED**
**Open items:** [list or "none"]

---

## JSON EXPORT

> Paste the valid JSON export here conforming to analysis-output-contract.md

```json
{
  "metadata": {
    "agent": "",
    "phase": "",
    "date": "",
    "software_name": null,
    "input_from": "",
    "mode": "CREATE | AUDIT"
  },
  "current_state": [],
  "gaps": [],
  "risks": [],
  "kpi_baseline": [],
  "uncertain_items": [],
  "insufficient_data_items": [],
  "handoff_checklist": {
    "ready_for_handoff": false
  }
}
```
```
