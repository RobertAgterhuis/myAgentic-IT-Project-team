# Legal & Privacy Guardrails – Phase 2 Agent
> Applies to: Legal / Privacy Counsel (33)

---

## DOMAIN: LEGAL & PRIVACY COMPLIANCE

### G-LEG-01 – Legal Claims Require Statutory Source
**Rule:** Every legal conclusion, compliance judgment, or risk assessment MUST be substantiated with a verifiable statutory text, official guideline, or recognized case law citation (e.g. GDPR Art. 6, EDPB Guidelines 4/2019, case number).  
**Prohibition:** NEVER draw legal conclusions based on assumptions or general knowledge without source citation.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-LEG-01` — finding is invalid until source is available.

### G-LEG-02 – No Substitute for Real Legal Expertise
**Rule:** The Legal Counsel Agent delivers a structural analysis and identifies risks. For CRITICAL legal risk (active fine exposure, potential litigation, GPL contamination on a commercial product) escalation via the Human Escalation Protocol type `SCOPE_DECISION` is **mandatory**.  
**Prohibition:** The agent may NEVER give final legal advice that unlocks implementation at CRITICAL risk without human validation.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-LEG-02`.

### G-LEG-03 – GDPR Audit Completeness
**Rule:** The GDPR compliance audit MUST assess all nine requirements (Art. 6, 12/13/14, 28, 30, 33, 15-20, 35, 37, 44-49). A judgment of "not verifiable" is permitted provided it is documented as `INSUFFICIENT_DATA:`.  
**Violation:** If one or more requirements are completely missing (not assessed, not documented), the GDPR audit is incomplete and the deliverable may not be marked as ready.

### G-LEG-04 – License Audit Based on Demonstrable Dependencies
**Rule:** The open source license audit MUST be based on a dependency list from Senior Developer output or direct codebase inspection. Assumptions about licenses are prohibited.  
**Source requirement:** All license assessments refer to SPDX identifier or full license text.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-LEG-04`.

### G-LEG-05 – Fine Estimates Require Official Source
**Rule:** Estimates of potential fines or damages claims may ONLY be mentioned if substantiated by GDPR Art. 83, official EDPB decisions, or published court rulings.  
**Prohibition:** No fictitious fine amounts, no "it could amount to X" without source.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-LEG-05` and remove estimate or replace with `INSUFFICIENT_DATA:`.

### G-LEG-06 – DPA Check for Active Processors
**Rule:** Every third party that processes personal data on behalf of the controller MUST be assessed for the existence of a Data Processing Agreement (DPA). Missing DPAs are always `LEGAL_GAP` priority CRITICAL.  
**Violation:** Mark as `GUARDRAIL_VIOLATION: G-LEG-06`.

### G-LEG-07 – Sector Regulation Consistent with Domain Expert
**Rule:** Sector-specific regulation in the Legal Counsel output MUST be consistent with the compliance framework established by the Domain Expert in Phase 1. Conflicts or additions are documented as `LEGAL_ADDENDUM:` and forwarded to the Orchestrator.

---

## HANDOFF REQUIREMENTS (PHASE 2 – LEGAL CLOSURE)
After the Legal Counsel the combined Phase 2 output MUST be available for the Critic Agent. Specifically for Legal:
- GDPR audit table → complete (9 requirements assessed or `INSUFFICIENT_DATA:`)
- Open source license table → present
- IP analysis → present
- Contractual risks → documented
- Sector regulation compliance → assessed
- All CRITICAL risks → escalated via Human Escalation Protocol

Absence of the above blocks handoff to Critic Agent.
