```markdown
# Content & Localization Guardrails – Phase 3 Agents
> Applies to: Content Strategist / UX Writer (32), Localization Specialist (35)

---

## DOMAIN: CONTENT STRATEGY & LOCALIZATION

### G-CNT-01 – No Production-Ready Copy
**Rule:** The Content Strategist delivers exclusively guidelines, frameworks, and audit findings. Copy examples are ALWAYS illustrative and marked as "e.g." or "direction:".  
**Prohibition:** NEVER write production-ready texts, slogans, final UI labels, or marketing claims.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-CNT-01` — content is not considered a deliverable.

### G-CNT-02 – Voice & Tone Judgments Require Concrete Evidence
**Rule:** Statements about voice & tone (e.g. "inconsistent", "too formal", "misleading") MUST be substantiated with at least two concrete example fragments from the available material.  
**Prohibition:** No subjective voice & tone judgments without a quote from the analyzed product.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-CNT-02`.

### G-CNT-03 – Content Gap Analysis Completeness
**Rule:** The content gap analysis MUST assess all six journey moments (first impression, onboarding, first use of core feature, error/problem, success moment, churn/exit points). Not applicable is permitted provided it is documented as `INSUFFICIENT_DATA:` with rationale.  
**Violation:** If journey moments are completely absent without documentation, the gap analysis is incomplete.

### G-CNT-04 – i18n Architectural Issues Escalate to Tech
**Rule:** When the Localization Specialist identifies hardcoded strings, missing locale-aware formatting, or structural i18n deficiencies, these are documented as `I18N_ISSUE` AND `OUT_OF_SCOPE: TECH` — the implementation solution belongs to the Senior Developer / Software Architect.  
**Prohibition:** The Localization Specialist writes NO code and accepts NO CODE stories as owner.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-CNT-04`.

### G-CNT-05 – Cultural Claims Require Verifiable Source
**Rule:** Statements about cultural suitability (e.g. "red is unlucky in this market", "this symbol is taboo") MUST reference a verifiable source (academic research, recognized localization guide, LISA standard, or documented customer feedback).  
**Prohibition:** No cultural generalizations without source.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-CNT-05`.

### G-CNT-06 – Consistency with UX and Accessibility Output
**Rule:** Content Strategist recommendations may NOT conflict with findings from UX Researcher, UX Designer, UI Designer, or Accessibility Specialist. Conflicts are documented as `CONTENT_CONFLICT:` and forwarded to the Orchestrator for decision.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-CNT-06`.

### G-CNT-07 – Localization Specialist Does NOT Start Without Content Strategist Output
**Rule:** The Localization Specialist (35) may NOT start before the Content Strategist (32) has fully completed their output — specifically: voice & tone guideline and content structure are mandatory input for the localization strategy.  
**Violation:** Mark as `BLOCKED` and escalate to Orchestrator.

### G-CNT-08 – Market Recommendations Consistent with Phase 1 Strategy
**Rule:** New market recommendations from the Localization Specialist MUST be consistent with the Domain Expert and Sales Strategist output from Phase 1. Recommendations that conflict with the established product-market combinations are documented as `L10N_CONFLICT:` with reference to the conflicting Phase 1 finding.

---

## HANDOFF REQUIREMENTS (PHASE 3 – CONTENT & LOCALIZATION CLOSURE)
After the Localization Specialist (last Phase 3 agent) the combined Phase 3 output MUST be available for the Critic Agent. Specifically for Content & Localization:
- Content Strategist: Style Guide + Voice & Tone guideline included as deliverable in sprint plan (or `INSUFFICIENT_DATA:` documented)
- Localization Specialist: i18n architecture audit complete, all `I18N_ISSUE` items documented
- No production-ready copy present in the output
- All cultural claims provided with source
- `I18N_ISSUE` items with `OUT_OF_SCOPE: TECH` forwarded to Orchestrator

Absence of the above blocks handoff to Critic Agent.

```
