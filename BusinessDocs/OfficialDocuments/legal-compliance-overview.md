# Legal & Compliance Overview
> Version: v2 | Last updated: 2026-03-08T12:00:00Z | Source: Phase 2 agent output (33-legal-counsel) + Reevaluation R2
> Completeness: ~85% — updated with questionnaire answers (license, IP ownership, deployment scope, PII status, product classification)

---

## Applicable Regulations

| Regulation | Applicability | Status | Condition |
|-----------|--------------|--------|-----------|
| **GDPR** (EU General Data Protection Regulation) | **NOT APPLICABLE** | Resolved | Localhost only (Q-07-001), no personal data processed (Q-09-002), no retention needed (Q-09-003) |
| **EAA** (European Accessibility Act) | ADVISORY | Recommended | Product is internal only (Q-33-001), globally available on GitHub (Q-13-001). EAA mandatory obligations do not apply to internal tools — remains ADVISORY for best practice. |
| **ADA** (Americans with Disabilities Act) | ADVISORY | Recommended | Same as EAA — global availability (Q-13-001) makes ADA compliance recommended |
| **Section 508** | NOT APPLICABLE | Resolved | Not a US government contract |
| **ePrivacy Directive** | NOT APPLICABLE | Resolved | No cookies or tracking implemented, no plans to add |

**RESOLVED:** All regulatory applicability determined. GDPR: NOT APPLICABLE (localhost + no PII). EAA/ADA: ADVISORY (internal-only product per Q-33-001, global GitHub availability per Q-13-001). All 33 questions answered.

---

## Current Compliance Status

### Intellectual Property
| Item | Status | Finding |
|------|--------|---------|
| LICENSE file | **RESOLVED** | MIT license selected (Q-33-003). Implementation: add LICENSE file with MIT text — 1 SP (Source: Agent 33, GAP-LEG-001) |
| Copyright notices | **RESOLVED** | Owner: Robert Agterhuis, individual (Q-33-004). Implementation: add copyright headers — 2 SP (Source: Agent 33, GAP-LEG-002) |
| Trademark registration | **LOW RISK** | Q-33-005 not asked — individual-owned internal tool, trademark risk is minimal |
| IP ownership | **RESOLVED** | Owned by Robert Agterhuis, individual (Q-33-004). No employment/contractor IP assignment concerns. |
| Third-party licenses | **COMPLIANT** | Zero dependencies — no third-party license compliance needed (Source: Agent 33) |

### Privacy & Data Protection
| Item | Status | Finding |
|------|--------|---------|
| Privacy Policy | **NOT REQUIRED** | Localhost only (Q-07-001), no user accounts, no PII (Q-09-002) — privacy policy not needed |
| Data Processing Agreement | **NOT REQUIRED** | No third-party processors for this localhost tool |
| Data retention policy | **NOT REQUIRED** | No retention needed (Q-09-003), no personal data |
| Lawful basis for processing | **NOT APPLICABLE** | No personal data processed (Q-09-002), GDPR does not apply |

### Terms of Service
| Item | Status | Finding |
|------|--------|---------|
| Terms of Service | **NOT REQUIRED** | Internal tool (Q-33-002), localhost only — ToS not needed |
| Acceptable Use Policy | **NOT REQUIRED** | Single-user tool (Q-09-004) — AUP not needed |

---

## Open Legal Risks

| Risk | Severity | Condition | Resolution |
|------|----------|-----------|------------|
| **No LICENSE file** | MEDIUM | Unconditional | REC-LEG-001: Add MIT LICENSE file (1 SP, license chosen: Q-33-003, owner: Q-33-004) |
| **No copyright notices** | LOW | Unconditional | REC-LEG-002: Add copyright headers (Robert Agterhuis, Q-33-004) |
| **GDPR non-compliance** | ~~CRITICAL~~ **SUPERSEDED** | Not applicable | Localhost only + no PII → GDPR does not apply (Q-07-001, Q-09-002) |
| **No data breach procedure** | ~~HIGH~~ **SUPERSEDED** | Not applicable | Localhost only → no breach risk (Q-07-001) |
| **No contributor agreement** | LOW | Only if community contributions accepted | REC-LEG-008: Consider DCO for MIT-licensed GitHub project |

---

## Privacy Architecture

**Current state:** No privacy architecture exists. The application does not currently implement:
- User accounts or authentication
- Personal data collection or storage (questionnaire answers MAY contain PII — INSUFFICIENT_DATA: Q-09-002)
- Cookies or tracking
- Data encryption at rest or in transit (localhost HTTP only)
- Data subject rights (access, deletion, portability)

**Assessment:** For the current localhost-only deployment, the privacy risk is LOW. If deployed, a comprehensive privacy architecture must be implemented BEFORE deployment per G-SEC-AUDIT-05 and DEC-T-010.

---

## Required Actions

| Priority | Action | Depends on | Estimated effort |
|----------|--------|-----------|-----------------|
| P0 | Add MIT LICENSE file | Resolved (Q-33-003: MIT) | 1 SP |
| P0 | Add copyright headers (Robert Agterhuis) | Resolved (Q-33-004) | 2 SP |
| P2 (optional) | Privacy Policy draft | NOT REQUIRED — localhost + no PII | 0 SP |
| ~~P1~~ | ~~GDPR compliance package~~ | **SUPERSEDED** — not applicable | 0 SP (was 20 SP) |
| ~~P2~~ | ~~Terms of Service~~ | **NOT REQUIRED** — internal-only tool (Q-33-001, Q-33-002) | 0 SP |
| P2 (conditional) | Data breach procedure | Q-07-001 | 3 SP |
| P3 | Contributor License Agreement | Q-33-003 (if open source) | 2 SP |

**Total unconditional effort: ~3 SP (LICENSE + copyright)**
**Total conditional effort: ~35 SP (if all conditions trigger)**
