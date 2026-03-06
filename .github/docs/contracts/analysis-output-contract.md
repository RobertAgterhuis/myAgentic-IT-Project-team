````markdown
# Analysis Output Contract
> Version: 1.0 | Applies to all analysis deliverables of all agents

---

## PURPOSE
This contract defines the mandatory structure and quality requirements for the **Analysis** deliverable of every agent.
An analysis that does not comply with this contract is **returned** by the Critic Agent.

---

## Output File Path

`.github/docs/phases/phase-N-[discipline]-analysis.md`

Where `N` is the phase number (1–4) and `[discipline]` is the lowercase discipline name (e.g., `phase-1-business-analysis.md`).

---

## MANDATORY SCHEMA (Markdown + JSON)

Every analysis deliverable consists of two parts:
1. **Markdown report** (human-readable)
2. **JSON data export** (machine-readable, for agent handoff)

---

## PART 1: MARKDOWN STRUCTURE

```markdown
# Analysis – [Discipline] – [Date]

## Metadata
- Agent: [name of the agent]
- Phase: [1 / 2 / 3 / 4]
- Input received from: [previous agent or "initial"]
- Date: [ISO 8601]
- Software under analysis: [name + version if available]
- Mode: [CREATE | AUDIT]

## Scope Change Impact *(SCOPE_CHANGE mode only — omit in normal cycles)*
> Required as the FIRST section when `cycle_type: SCOPE_CHANGE` in session state.
### Still Valid
- [Finding ID from prior analysis]: [one sentence why still applicable under the new premise]
### Superseded
- [Finding ID from prior analysis]: [what changed and why no longer applicable under the new premise]
### Net-New
- [Description of net-new finding with no equivalent in the prior analysis]

## 1. Current State (AUDIT mode) / Solution Design (CREATE mode)
### 1.1 [Topic A]
- Finding: [concrete description]
- Source: [filename:linenumber / document:page / interview:reference / requirement:ID]
- Impact: [High / Medium / Low]

### 1.2 [Topic B]
[...]

## 2. Gaps (AUDIT mode) / Requirements Gaps (CREATE mode)
### 2.1 [Gap title]
- Description: [what is missing or falls short]
- Source: [demonstrated via...]
- Risk if unresolved: [description]
- Priority: [Critical / High / Medium / Low]

## 3. Risks
### 3.1 [Risk title]
- Description: [what could go wrong]
- Probability: [High / Medium / Low]
- Impact: [High / Medium / Low]
- Risk score: [High × High = Critical, etc.]
- Mitigation options: [minimum 1 concrete option]
- Source: [...]

## 4. KPI Baseline
| KPI | Current value | Source | Measurement method |
|-----|----------------|------|-------------|
| [name] | [value or INSUFFICIENT_DATA:] | [source] | [how measured] |

## 5. UNCERTAIN Items
- `UNCERTAIN: [description]` – Reason: [why uncertain] – Escalation: [action]

## 6. INSUFFICIENT_DATA Items
- `INSUFFICIENT_DATA: [section/field]` – Missing: [what] – Consequence: [impact on analysis]

## HANDOFF CHECKLIST
- [ ] All sections (1-4) are fully completed
- [ ] All findings have a source citation
- [ ] No empty sections or placeholders
- [ ] All UNCERTAIN: items are documented
- [ ] All INSUFFICIENT_DATA: items are documented and escalated
- [ ] All INSUFFICIENT_DATA: items tagged with QUESTIONNAIRE_REQUEST in handoff
- [ ] Step 0 questionnaire context acknowledged (CONSUMED or NOT_INJECTED documented)
- [ ] If cycle_type is SCOPE_CHANGE: `## Scope Change Impact` section present as FIRST section with Still Valid / Superseded / Net-New sub-sections (or `NOT_APPLICABLE` — normal cycle)
- [ ] JSON export below is valid and complete
- [ ] No contradictory findings
- [ ] Output complies with global guardrails (00-global-guardrails.md)
- [ ] Domain-specific guardrails have been checked
```

---

## PART 2: JSON EXPORT SCHEMA

```json
{
  "metadata": {
    "agent": "string",
    "phase": "1 | 2 | 3 | 4",
    "date": "ISO 8601",
    "software_name": "string | null",
    "input_from": "string",
    "mode": "CREATE | AUDIT"
  },
  "current_state": [
    {
      "id": "CS-001",
      "topic": "string",
      "finding": "string",
      "source": "string",
      "impact": "High | Medium | Low",
      "design_decision_id": "string | null"
    }
  ],
  "gaps": [
    {
      "id": "GAP-001",
      "title": "string",
      "description": "string",
      "source": "string",
      "risk_if_unresolved": "string",
      "priority": "Critical | High | Medium | Low"
    }
  ],
  "risks": [
    {
      "id": "RISK-001",
      "title": "string",
      "description": "string",
      "probability": "High | Medium | Low",
      "impact": "High | Medium | Low",
      "score": "Critical | High | Medium | Low",
      "mitigations": ["string"],
      "source": "string"
    }
  ],
  "kpi_baseline": [
    {
      "kpi": "string",
      "value": "string | null",
      "source": "string | null",
      "measurement_method": "string",
      "data_status": "Available | INSUFFICIENT_DATA"
    }
  ],
  "uncertain_items": [
    {
      "id": "UNC-001",
      "description": "string",
      "reason": "string",
      "escalation_action": "string"
    }
  ],
  "insufficient_data_items": [
    {
      "id": "IND-001",
      "section": "string",
      "missing": "string",
      "consequence": "string"
    }
  ],
  "questionnaire_requests": [
    {
      "id": "IND-001",
      "question_context": "string"
    }
  ],
  "handoff_checklist": {
    "all_sections_complete": true,
    "all_findings_sourced": true,
    "no_empty_sections": true,
    "uncertain_documented": true,
    "insufficient_data_documented": true,
    "questionnaire_requests_listed": true,
    "questionnaire_context_documented": true,
    "json_export_valid": true,
    "no_contradictions": true,
    "global_guardrails_checked": true,
    "domain_guardrails_checked": true,
    "scope_change_impact_present": "true | NOT_APPLICABLE",
    "mode_consistent": "true",
    "ready_for_handoff": true
  }
}
```

---

## QUALITY REQUIREMENTS

| Requirement | Standard |
|-----|------|
| Minimum number of findings | 5 per section (Current State, Gaps, Risks) unless INSUFFICIENT_DATA |
| Source citation | Present for every finding |
| KPI fields | Minimum 3 KPIs or explicit INSUFFICIENT_DATA per missing one |
| JSON validation | Valid JSON without syntax errors |
| Handoff checklist | All items checked (`true`) or escalation documented |

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

---

## VALIDATION CRITERIA (Critic Agent uses these)
An analysis is REJECTED if:
- One or more sections are empty or contain placeholders
- A finding has no source citation
- The JSON export is missing or invalid
- The Handoff Checklist is not complete
- `ready_for_handoff: false`

````
