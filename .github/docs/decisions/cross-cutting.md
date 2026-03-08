# Decisions: Cross-cutting Enterprise
> Stack: cross-cutting | Status: ACTIVE | Applicable: PARTIAL

---

## Active Decisions

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-262 | HIGH | Phase 2, Phase 3 (API Governance) | What API lifecycle governance is required for contract versioning, compatibility, and deprecation? | All APIs require versioned contracts, backward compatibility by default, automated contract tests in CI, and formal deprecation windows with migration guidance before breaking changes. | 2026-03-07 |
| DEC-267 | MEDIUM | Phase 5 (Non-Functional Testing) | What non-functional test strategy is mandatory for performance, resilience, and regression prevention? | Require load/performance tests for critical paths, resilience/failure-mode tests for key dependencies, and release-blocking performance regression thresholds in CI/CD. | 2026-03-07 |
| DEC-269 | MEDIUM | Phase 4, Phase 5 (Release Lifecycle) | What product/release lifecycle governance is required for feature flags, versioning, and decommissioning? | Enforce semantic versioning, feature-flag ownership with expiry dates, release notes for all production changes, and formal sunset plans for deprecated capabilities. | 2026-03-07 |
| DEC-270 | MEDIUM | All phases (Documentation & ADRs) | What documentation governance baseline is required for architecture, operations, and decision traceability? | Maintain ADRs for major technical decisions, service/runbook documentation as release prerequisites, and quarterly doc ownership reviews to prevent stale guidance. | 2026-03-07 |

## Deferred Decisions (not applicable to current codebase)

| ID | Priority | Scope | Decision | Deferred Reason | Date |
|----|-----------|-------|-----------|-----------------|-------|
| DEC-261 | — | — | What end-to-end identity and authorization model is mandatory for users, service... | No identity system — localhost app, no Microsoft Entra ID (DEC-R2-001) | 2026-03-08 |
| DEC-263 | — | — | What Azure network/edge architecture baseline is required for ingress, segmentat... | No Azure — network/hub-spoke architecture not applicable | 2026-03-08 |
| DEC-264 | — | — | What application-level data governance model is required for classification, enc... | Over-scoped data governance for file-based localhost app (DEC-R2-006) | 2026-03-08 |
| DEC-265 | — | — | What workload-level continuity and disaster recovery standard is mandatory beyon... | No production — business continuity/DR not applicable for localhost (DEC-R2-001) | 2026-03-08 |
| DEC-266 | — | — | What SRE operating model is required for SLOs, error budgets, incident severity,... | Solo developer — no SRE team or operating model (DEC-R2-005) | 2026-03-08 |
| DEC-268 | — | — | What cadence is required for threat modeling, security validation, and remediati... | Over-scoped threat modeling/pen testing for localhost dev tool | 2026-03-08 |
