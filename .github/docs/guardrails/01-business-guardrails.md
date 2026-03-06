```markdown
# Business Guardrails – Phase 1 Agents
> Applies to: Business Analyst, Domain Expert, Sales Strategist, Financial Analyst, Product Manager
> Mode: CREATE + AUDIT (differences noted per rule)

---

## DOMAIN: BUSINESS & STRATEGY

### G-BUS-01 – Revenue Hypothesis Required
**Rule:** No feature or recommendation may be included in the sprint plan without an explicit, testable revenue hypothesis.  
**Format:** "If we execute [action], we expect [metric] to improve by [range] based on [rationale]."  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-BUS-01` and remove from sprint plan.

### G-BUS-02 – Centralized Business Rules
**Rule:** Business rules are NEVER implemented as hardcoded logic. They are identified, defined, and documented in a central rule inventory.  
**CREATE mode:** Define business rules for the new solution from requirements, domain research, and stakeholder input.  
**AUDIT mode:** Identify existing business rules from codebase and documentation.  
**Verification:** Verify that business rules are traceable to an authoritative source (BPMN, decision table, specification document, or validated requirement).  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-BUS-02`.

### G-BUS-03 – ICP Validation
**Rule:** Recommendations for product or sales may NOT be made before the Ideal Customer Profile (ICP) has been established based on demonstrable data.  
**Source requirement:** ICP must be based on: existing customer data, interviews, CRM data, or market research – NOT on assumptions.

### G-BUS-04 – Gap Analysis Completeness
**Rule:** The gap analysis MUST cover all four dimensions: Market, Product, Revenue, Operations.  
**Violation:** If any dimension is missing, the gap analysis is incomplete and the document may NOT be marked as ready.

### G-BUS-05 – Priority Matrix Mandatory
**Rule:** Every set of recommendations must be accompanied by an impact-effort matrix.  
**Format:** 2×2 matrix (high/low impact × high/low effort), filled with concrete items – no generic categories.

### G-BUS-06 – Financial Analysis Independence
**Rule:** The Financial Analyst bases all KPI estimates EXCLUSIVELY on provided financial data.  
**Prohibition:** Never use industry benchmarks as a substitute for missing company data. Mark as `INSUFFICIENT_DATA:` and escalate.

### G-BUS-07 – Sales Cycle Design & Documentation
**Rule:** The Sales Strategist ALWAYS documents the complete sales cycle with all steps, handoffs, and friction points.  
**CREATE mode:** Design the intended sales cycle for the new solution, including channel strategy, conversion funnel, and pricing touchpoints.  
**AUDIT mode:** Document the current sales cycle based on provided evidence.

### G-BUS-08 – No Strategic Leap
**Rule:** Strategic recommendations that are not directly traceable to a finding from the Analysis are blocked.  
**Violation:** Mark as `UNSUBSTANTIATED_RECOMMENDATION` and remove from deliverable.

---

## HANDOFF REQUIREMENTS (PHASE 1 SPECIFIC)
After Phase 1 the output MUST be available as structured JSON or Markdown with the following fields (per `analysis-output-contract.md`):
- `capabilities[]`
- `business_rules[]`
- `risk_assessment[]`
- `kpi_baseline{}`
- `gap_analysis{}`
- `priority_matrix[]`

Any missing field blocks the start of Phase 2.

```
