# Reevaluate Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Reevaluate Agent (Agent 23)

---

## PURPOSE
Ensures that when questionnaire answers arrive, decisions change, or scope adjustments occur, a structured re-evaluation is performed against affected phase outputs. The Reevaluate Agent produces a delta analysis with impact flags that feed into Sprint Gate reconciliation and, if needed, triggers brand asset refresh.

---

## OUTPUT FILE
**Location:** `.github/docs/reevaluate/reevaluation-report-[N].md`
**Format:** Markdown

---

## MANDATORY SECTIONS

### 1. Reevaluation Header
- Report number (sequential N)
- Trigger: `QUESTIONNAIRE_ANSWER` | `DECISION_CHANGE` | `SCOPE_ADJUSTMENT` | `MANUAL`
- Date of reevaluation
- Scope of reevaluation (which phases/agents/documents are affected)
- Trigger source reference (file path, question ID, or decision ID)

### 2. Delta Analysis
For each affected item:
- **Item ID:** Reference to original finding, recommendation, or data point
- **Original Value:** What the item stated before
- **New Value:** What the item should state now (based on new input)
- **Source:** Questionnaire answer ID, decision ID, or change description
- **Affected Document:** File path of the document to be updated

### 3. Impact Assessment
- Phases impacted: list of phase identifiers
- Agents impacted: list of agent names whose output changes
- Sprint items impacted: list of Story IDs / Sprint IDs affected
- **Sprint Impact Flag:** `IN_PROGRESS` items that require Sprint Gate hold
- **BRAND_REFRESH_REQUIRED:** `YES` | `NO` — set to YES if design tokens, brand guidelines, or visual identity are affected

### 4. Recommendations
- Items that require re-execution of a phase agent
- Items that can be patched in-place
- Items deferred to next sprint

### 5. Critic + Risk Validation Reference
- Confirm that Critic + Risk validation has been triggered for affected outputs
- Reference to updated critic-risk-validation.md (if available)

### 6. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] Trigger type is explicitly stated
- [ ] Delta Analysis contains at least one item (otherwise reevaluation is unnecessary)
- [ ] Every delta item has original value, new value, and source reference
- [ ] Impact Assessment covers phases, agents, and sprint items
- [ ] BRAND_REFRESH_REQUIRED flag is present (YES or NO)
- [ ] Sprint Impact Flags are set for any `IN_PROGRESS` items
- [ ] Critic + Risk validation is referenced or scheduled

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
