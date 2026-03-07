# Decisions & Open Questions

> This file is your direct communication channel with the Agentic Team.  
> The Orchestrator consults this file at every Sprint Gate and at the start of each sprint.  
> Fill it in yourself — agents automatically adapt their behavior based on the status below.
>
> **Web UI available:** Run `node .github/webapp/server.js` and open http://127.0.0.1:3000 → **Decisions** tab to view, create, and answer decisions in a visual interface. The web UI writes directly to this file.

---

## How does this file work?

| Column | Explanation |
|-------|--------|
| **ID** | Unique ID, format `DEC-NNN` |
| **Type** | `DECIDED` (you have decided) or `OPEN_QUESTION` (waiting for your answer) |
| **Status** | `OPEN` · `DECIDED` · `DEFERRED` · `EXPIRED` |
| **Priority** | `HIGH` · `MEDIUM` · `LOW` |
| **Scope** | Which phase, agent, or sprint this affects (e.g. `Phase 2`, `SP-3`, `PR/Review Agent`, `All sprints`) |
| **Decision / Question** | What has been decided or what needs to be answered |
| **Your answer / Notes** | Fill this in for OPEN_QUESTION so the Orchestrator can process it |
| **Date** | Date of entry or last update |

**Orchestrator behavior rules:**
- `OPEN` + priority `HIGH` + sprint touches the scope → **Sprint Gate blocks** until you answer
- `OPEN` + priority `MEDIUM/LOW` → Orchestrator reports it but does not block
- `DECIDED` → Orchestrator injects the decision as a hard constraint into all relevant agents
- `DEFERRED` → Orchestrator ignores until date or scope trigger
- `EXPIRED` → Orchestrator ignores entirely

---

## Open Questions (waiting for your answer)

| ID | Priority | Scope | Question | Your answer | Date |
|----|-----------|-------|-------|---------------|-------|

---

## Decided Items (agents act on these)

### Transformation Decisions (DEC-T series)

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-T-001 | HIGH | All phases | System operates in dual-mode: CREATE (primary) and AUDIT (secondary) | CREATE mode is the default. AUDIT mode is preserved for backward compatibility. Both modes share the same agent pipeline, contracts, and guardrails. | 2025-07-18 |
| DEC-T-002 | HIGH | All agents | Every phase agent has explicit CREATE and AUDIT subsections | Each agent skill file contains mode-specific instructions under clearly labeled headers. Agents switch behavior based on `cycle_type` in session state. | 2025-07-18 |
| DEC-T-003 | HIGH | Phase 1 | Phase 1 agents design new business models and requirements (CREATE) instead of analyzing existing ones (AUDIT) | Business Analyst defines the business model. Domain Expert maps the problem space. Sales Strategist designs go-to-market. Financial Analyst builds revenue projections. Product Manager produces the product roadmap. | 2025-07-18 |
| DEC-T-004 | HIGH | Phase 2 | Phase 2 agents design new architecture (CREATE) instead of auditing existing code | Software Architect designs from scratch using ADRs. Senior Developer defines implementation standards. DevOps plans CI/CD pipelines. Security Architect defines security posture. Data Architect designs data models. Legal Counsel maps compliance requirements. | 2025-07-18 |
| DEC-T-005 | HIGH | Phase 3 | Phase 3 agents design new UX/UI (CREATE) instead of evaluating existing interfaces | UX Researcher creates personas and journey maps from market research. UX Designer produces information architecture and wireframes. UI Designer creates visual design system. Accessibility Specialist defines WCAG baseline. Content Strategist designs content model. Localization Specialist plans i18n architecture. | 2025-07-18 |
| DEC-T-006 | HIGH | Phase 4 | Phase 4 agents create new brand identity (CREATE) instead of auditing existing brand | Brand Strategist designs brand from positioning through visual identity. Growth Marketer designs acquisition funnels. CRO Specialist designs conversion optimization framework. | 2025-07-18 |
| DEC-T-007 | HIGH | Synthesis | Synthesis Agent frames output as "Solution Blueprint" (CREATE) or "Capability Heatmap" (AUDIT) | Master report structure adapts to mode. Cross-Team Blocker Matrix applies to both modes. | 2025-07-18 |
| DEC-T-008 | MEDIUM | Onboarding | Onboarding intake adapts to mode: project brief + goals (CREATE) vs. codebase + documentation (AUDIT) | Onboarding Agent detects mode from the command and adjusts its intake questionnaire accordingly. | 2025-07-18 |
| DEC-T-009 | HIGH | Session state | Session state contract supports 11 cycle types including CREATE variants | FULL_CREATE, PARTIAL_CREATE, COMBO_CREATE added alongside existing AUDIT variants. FEATURE, REEVALUATE, SCOPE_CHANGE, HOTFIX, REFRESH are mode-agnostic. | 2025-07-18 |
| DEC-T-010 | MEDIUM | copilot-instructions | copilot-instructions.md routes CREATE and AUDIT commands through the same pipeline with mode differentiation | Command table in copilot-instructions includes CREATE commands (primary), AUDIT commands (secondary), and on-demand commands (both modes). | 2025-07-18 |
| DEC-T-011 | HIGH | Playbooks | Two separate playbooks: software-creation-playbook.md (CREATE) and commercial-software-audit-playbook.md (AUDIT) | The creation playbook was written from scratch. The audit playbook was preserved as-is for backward compatibility. | 2025-07-18 |
| DEC-T-012 | MEDIUM | Contracts, Guardrails | Contracts and guardrails are mode-agnostic with targeted mode-specific sections where needed | analysis-output-contract and sprintplan-output-contract received terminology updates. session-state-contract was rewritten. All guardrails apply universally. | 2025-07-18 |
| DEC-T-013 | LOW | Phase 5 | Phase 5 implementation pipeline requires zero changes for dual-mode support | Implementation, Test, PR/Review, Documentation, GitHub Integration, KPI, and Retrospective agents are inherently mode-agnostic — they operate on sprint stories regardless of origin mode. | 2025-07-18 |
| DEC-T-014 | LOW | Support agents | Support agents (Reevaluate, Feature, Questionnaire, Scope Change, Brand & Assets, Storybook) require zero changes | These agents operate on structured input independent of the originating mode. | 2025-07-18 |
| DEC-T-015 | MEDIUM | All phases | Critic and Risk agents validate CREATE outputs using the same scoring rubric as AUDIT | Quality gates do not differentiate by mode — the same standards apply to designed solutions as to audited solutions. Critic Agent received minor context updates. | 2025-07-18 |

### Reevaluation Decisions (DEC-R2 series)

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-R2-001 | HIGH | Phase 2, Phase 3, All sprints | Deployment scope is **localhost only**. All network-security findings are ADVISORY, not mandatory. | Source: Q-07-001, Q-08-001. Future internal deployment may trigger SCOPE CHANGE. 30+ conditional findings downgraded. | 2026-03-08 |
| DEC-R2-002 | HIGH | Phase 2 (Legal) | **GDPR is not applicable.** All GDPR compliance work (32 SP) is SUPERSEDED. | Source: Q-07-001 (localhost), Q-09-002 (no PII), Q-09-003 (no retention). Privacy Policy, DPA, breach procedure all NOT REQUIRED. | 2026-03-08 |
| DEC-R2-003 | MEDIUM | Phase 2 (Legal) | License: **MIT**. IP owner: **Robert Agterhuis** (individual). | Source: Q-33-003, Q-33-004. LICENSE file and copyright headers are P0 items in Sprint 1. | 2026-03-08 |
| DEC-R2-004 | HIGH | Phase 3 (Localization) | **English only** — no localization, no i18n infrastructure, no RTL support required. | Source: Q-35-001, Q-35-002. All localization sprint work SUPERSEDED. BLK-003 (i18n approach) SUPERSEDED. ~40 SP removed. | 2026-03-08 |
| DEC-R2-005 | HIGH | All sprints | **Solo developer** — 1 full-time developer, 30 SP per 2-week sprint. Sequential execution only. | Source: Q-05-001, Q-06-001. No parallel Tech+UX tracks. All sprints merged into single sequential track. | 2026-03-08 |
| DEC-R2-006 | MEDIUM | Phase 2 (Data) | **File-based storage only** — no database migration. All data improvements must work with filesystem. | Source: Q-06-002. Data layer recommendations adjusted to file-based patterns (temp-file-then-rename, JSON schema validation). | 2026-03-08 |

### Operational Decisions

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|

---

## Deferred & Expired items

| ID | Status | Scope | Subject | Reason | Date |
|----|--------|-------|-----------|-------|-------|

---

## Change Log

_(auto-populated by the webapp)_

---

## Examples

### Example: Open question (blocking)
| ID | Priority | Scope | Question | Your answer | Date |
|----|-----------|-------|-------|---------------|-------|
| DEC-002 | HIGH | Phase 2, SP-1 | Which cloud platform to use: Azure or AWS? | Azure — always use managed services where possible | 2026-03-01 |

### Example: Decided item
| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-101 | HIGH | All sprints | Do not integrate any third-party payment systems outside Stripe | Compliance requirement from legal | 2026-03-01 |
