# Critic Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Critic Agent (Agent 18)

---

## PURPOSE
Ensures every phase output undergoes rigorous quality, completeness, and compliance review before handoff. The Critic Agent validates all agent outputs within a phase against their respective contracts, anti-hallucination protocol, and guardrails, producing an itemized validation report with a clear APPROVED or FAILED verdict.

---

## OUTPUT FILE
**Location:** `.github/docs/[phase]/critic-risk-validation.md` (critic section)
**Format:** Markdown

---

## MANDATORY SECTIONS

### 1. Critic Validation Header
- Phase identifier (e.g., Phase 1, Phase 2)
- Date of validation
- List of agent outputs reviewed (agent name + file path)

### 2. Per-Agent Compliance Check
For each agent output in the phase:
- **Contract Compliance:** Does the output satisfy all MANDATORY SECTIONS of the agent's output contract? Itemized pass/fail per section.
- **Anti-Hallucination Compliance:** Are all claims sourced? Are `UNCERTAIN:` and `INSUFFICIENT_DATA:` prefixes used correctly? No fabricated metrics?
- **Completeness Check:** Are all required fields filled (no placeholders, no empty sections)?
- **Guardrail Compliance:** Does the output comply with applicable guardrails from `/.github/docs/guardrails/`?
- **Cross-Reference Check:** Are there contradictions between this output and other outputs in the same phase?

### 3. Findings Summary
- Total agents reviewed
- Total findings (itemized)
- Findings by severity: CRITICAL, MAJOR, MINOR, INFO
- Each finding must include: agent name, section, description, source reference

> **Severity Mapping to Standard Scale:**
>
> | Critic Severity | Standard Severity |
> |-----------------|-------------------|
> | `MAJOR` with `risk_score ≥ Critical` | `CRITICAL` |
> | `MAJOR` with `risk_score = High` | `HIGH` |
> | `MAJOR` (all other / default) | `HIGH` |
> | `MINOR` | `MEDIUM` |
> | `INFO` | `LOW` |

### 4. Verdict
- Overall phase verdict: `APPROVED` or `FAILED`
- Per-agent verdict: `APPROVED` or `FAILED`
- If FAILED: list of items that must be remediated before re-validation

### 5. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] All agent outputs in the phase have been reviewed (none skipped)
- [ ] Each agent has an explicit per-agent verdict (APPROVED or FAILED)
- [ ] Every FAILED verdict includes at least one itemized finding with source reference
- [ ] Anti-hallucination compliance is explicitly checked per agent
- [ ] No CRITICAL findings remain unaddressed when overall verdict is APPROVED
- [ ] Findings Summary totals are consistent with Per-Agent sections

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

---

## JSON Export

> No standalone JSON export for this contract. The Critic Agent's output is Markdown-only; findings are consumed by the Orchestrator from the structured Markdown sections.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
