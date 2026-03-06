# Risk Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Risk Agent (Agent 19)

---

## PURPOSE
Ensures every phase output is assessed for technical, business, security, and operational risks. The Risk Agent identifies, classifies, and rates all risks discovered in phase outputs, producing a structured risk assessment that feeds into the Synthesis Agent's Risk Matrix and sprint planning.

---

## OUTPUT FILE
**Location:** `.github/docs/[phase]/critic-risk-validation.md` (risk section)
**Format:** Markdown

---

## MANDATORY SECTIONS

### 1. Risk Assessment Header
- Phase identifier
- Date of assessment
- List of agent outputs assessed (agent name + file path)

### 2. Risk Inventory
For each identified risk:
- **Risk ID:** Unique identifier (e.g., `RISK-P2-001`)
- **Category:** `TECHNICAL` | `BUSINESS` | `SECURITY` | `OPERATIONAL` | `LEGAL` | `COMPLIANCE`
- **Severity:** `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
- **Likelihood:** `VERY_LIKELY` | `LIKELY` | `POSSIBLE` | `UNLIKELY`
- **Description:** Concrete description of the risk
- **Source:** Agent name, section, file path, line number where applicable
- **Impact:** What happens if this risk materializes
- **Mitigation:** Recommended mitigation strategy (or `INSUFFICIENT_DATA:` if unknown)
- **Owner:** Suggested responsible discipline (BUSINESS | TECH | UX | MARKETING)

### 3. Risk Summary Matrix
- Total risks by category
- Total risks by severity
- CRITICAL + HIGH risks listed explicitly with their Risk IDs

### 4. Cross-Phase Risk Dependencies
- Risks that span multiple phases or disciplines
- Risks that create blockers for other teams (tagged for cross-team-blocker-matrix)

### 5. Verdict
- Overall risk verdict: `APPROVED` or `FAILED`
- FAILED if any CRITICAL risk has no mitigation and no escalation
- List of risks requiring immediate attention

### 6. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] All six risk categories are explicitly assessed: `TECHNICAL`, `BUSINESS`, `SECURITY`, `OPERATIONAL`, `LEGAL`, `COMPLIANCE`
- [ ] Every risk has a unique Risk ID, severity, likelihood, and source reference
- [ ] No CRITICAL risk is left without a mitigation recommendation or `INSUFFICIENT_DATA:` escalation
- [ ] Risk Summary Matrix totals are consistent with Risk Inventory
- [ ] Cross-phase dependencies are identified and tagged for Synthesis
- [ ] Verdict is present and consistent with findings

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

---

## JSON Export

> No standalone JSON export for this contract. The Risk Agent's output is Markdown-only; risk items are consumed by the Synthesis Agent from the structured Markdown sections.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
