# Decisions: Reevaluation (Scope Constraints)
> Stack: reevaluation | Status: ACTIVE | Applicable: YES

---

## Decided Items

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-R2-001 | HIGH | Phase 2, Phase 3, All sprints | Deployment scope is **localhost only**. All network-security findings are ADVISORY, not mandatory. | Source: Q-07-001, Q-08-001. Future internal deployment may trigger SCOPE CHANGE. 30+ conditional findings downgraded. | 2026-03-08 |
| DEC-R2-002 | HIGH | Phase 2 (Legal) | **GDPR is not applicable.** All GDPR compliance work (32 SP) is SUPERSEDED. | Source: Q-07-001 (localhost), Q-09-002 (no PII), Q-09-003 (no retention). Privacy Policy, DPA, breach procedure all NOT REQUIRED. | 2026-03-08 |
| DEC-R2-003 | MEDIUM | Phase 2 (Legal) | License: **MIT**. IP owner: **Robert Agterhuis** (individual). | Source: Q-33-003, Q-33-004. LICENSE file and copyright headers are P0 items in Sprint 1. | 2026-03-08 |
| DEC-R2-004 | HIGH | Phase 3 (Localization) | **English only** — no localization, no i18n infrastructure, no RTL support required. | Source: Q-35-001, Q-35-002. All localization sprint work SUPERSEDED. BLK-003 (i18n approach) SUPERSEDED. ~40 SP removed. | 2026-03-08 |
| DEC-R2-005 | HIGH | All sprints | **Solo developer** — 1 full-time developer, 30 SP per 2-week sprint. Sequential execution only. | Source: Q-05-001, Q-06-001. No parallel Tech+UX tracks. All sprints merged into single sequential track. | 2026-03-08 |
| DEC-R2-006 | MEDIUM | Phase 2 (Data) | **File-based storage only** — no database migration. All data improvements must work with filesystem. | Source: Q-06-002. Data layer recommendations adjusted to file-based patterns (temp-file-then-rename, JSON schema validation). | 2026-03-08 |
| DEC-R3-001 | MEDIUM | All phases | **All 7 remediation sprints complete; implementation phase concluded.** No further remediation sprints unless user explicitly requests SP-R2-008. Only 4 LOW/MEDIUM items remain (~11 SP). | Source: reevaluation-report-3.md Section 5. All v2 recommendations closed. 188/188 SP delivered. | 2026-03-08 |
| DEC-R3-002 | HIGH | Phase 2, Phase 3 | **Risk profile confirmed LOW for localhost deployment.** 0 OWASP critical/high, CSP headers, input sanitization, secret scanning. Aggregate risk score 14 (was 93 at v1). | Source: reevaluation-report-3.md Section 6. Agents should not escalate security findings beyond ADVISORY for localhost scope. | 2026-03-08 |
| DEC-R3-003 | LOW | Phase 3 (Accessibility) | **WCAG heading hierarchy is the sole remaining compliance gap.** Advisory, not blocking. ARIA landmarks provide alternative navigation. | Source: reevaluation-report-3.md NEW-R3-001. Implementation Agent may fix as part of any future frontend work (~1 SP). | 2026-03-08 |
