# GitHub Copilot – Repository Instructions
## System: End-to-End New Software Solution Creation (Multi-Agent)

---

## PURPOSE OF THIS SYSTEM

This system creates complete, production-ready new software solutions through a structured multi-agent process across four phases:

1. **Phase 1 – Requirements & Strategy** — Define business model, requirements, and strategic positioning
2. **Phase 2 – Architecture & Design** — Design system architecture, technology stack, security, and data model
3. **Phase 3 – Experience Design** — Design UX/UI, accessibility baseline, content strategy, and i18n plan
4. **Phase 4 – Brand & Growth** — Create brand identity, go-to-market strategy, and conversion design

Each phase produces four deliverables per discipline:  
**Analysis → Recommendations → Sprint Plan → Guardrails**

The system also supports **auditing existing software** as an alternative mode (see AUDIT commands below).

---

## HOW THIS SYSTEM WORKS

This is a **multi-agent, sequential system**. Each agent:
- Has a fixed role (see `/.github/docs/playbooks/software-creation-playbook.md`)
- Works within an **output contract** (see `/.github/docs/contracts/`)
- Must comply with **guardrails** (see `/.github/docs/guardrails/`)
- Must NOT start without the output of the previous phase as input

### Phase Sequence (MANDATORY)
```
=== PRIMARY MODE: CREATE (New Software Solution) ===

On command or automatically at the start of a new creation cycle:
  CREATE [project] → Onboarding Agent → requirements intake → .github/docs/onboarding/onboarding-output.md → Orchestrator (full scope: all 4 phases)

Partial creation (per discipline, independently executable):
  CREATE BUSINESS [project]  → Onboarding (scope: business)   → Phase 1 → Critic/Risk → Synthesis (PARTIAL) → final-report-business.md
  CREATE TECH [project]      → Onboarding (scope: tech)       → Phase 2 → Critic/Risk → Synthesis (PARTIAL) → final-report-tech.md
  CREATE UX [project]        → Onboarding (scope: ux)         → Phase 3 → Critic/Risk → Synthesis (PARTIAL) → final-report-ux.md
  CREATE MARKETING [project] → Onboarding (scope: marketing)  → Phase 4 → Critic/Risk → Synthesis (PARTIAL) → final-report-marketing.md
  CREATE SYNTHESIS           → Combines all available phase outputs; Master Report + Cross-Team Blocker Matrix once all 4 phases are present

Combination creation (2 or 3 disciplines in one session, single Onboarding intake):
  CREATE [DISC1] [DISC2] [project]         → Onboarding (scope: combined) → Phase DISC1 → Critic/Risk → Phase DISC2 → Critic/Risk → [Brand+Storybook if MARKETING] → Synthesis (COMBO_PARTIAL)
  CREATE [DISC1] [DISC2] [DISC3] [project] → same for 3 disciplines
  Canonical execution order: BUSINESS → TECH → UX → MARKETING (regardless of order in command)
  Examples: CREATE TECH UX project · CREATE BUSINESS MARKETING project · CREATE TECH UX MARKETING project

Orchestrator
  ↓ [required: Onboarding Output COMPLETE including session-state.json]
  ↓ [Questionnaire Agent: load existing answers from BusinessDocs/ → inject into phase-agent contexts]
Phase 1 — Requirements & Strategy: Business Analyst → Domain Expert → Sales Strategist → Financial Analyst → Product Manager (34)
  ↓ [CRITIC + RISK validation]
  ↓ [Questionnaire Agent: generate questionnaires for all INSUFFICIENT_DATA: items → BusinessDocs/Phase1-Business/Questionnaires/]
  ↓ [Questionnaire Agent: update official documents → BusinessDocs/OfficialDocuments/ (product-vision.md, financial-model-overview.md)]
Phase 2 — Architecture & Design: Software Architect → Senior Developer → DevOps Engineer → Security Architect → Data Architect → Legal Counsel (33)
  ↓ [CRITIC + RISK validation]
  ↓ [Questionnaire Agent: generate questionnaires for all INSUFFICIENT_DATA: items → BusinessDocs/Phase2-Tech/Questionnaires/]
  ↓ [Questionnaire Agent: update official documents → BusinessDocs/OfficialDocuments/ (technical-overview.md, legal-compliance-overview.md)]
Phase 3 — Experience Design: UX Researcher → UX Designer → UI Designer → Accessibility Specialist → Content Strategist (32) → Localization Specialist (35)
  ↓ [CRITIC + RISK validation]
  ↓ [Questionnaire Agent: generate questionnaires for all INSUFFICIENT_DATA: items → BusinessDocs/Phase3-UX/Questionnaires/]
  ↓ [Questionnaire Agent: update official documents → BusinessDocs/OfficialDocuments/ (ux-design-brief.md, content-strategy-brief.md)]
Phase 4 — Brand & Growth: Brand Strategist → Growth Marketer → CRO Specialist
  ↓ [CRITIC + RISK validation]
  ↓ [Questionnaire Agent: generate questionnaires for all INSUFFICIENT_DATA: items → BusinessDocs/Phase4-Marketing/Questionnaires/]
  ↓ [Questionnaire Agent: update official documents → BusinessDocs/OfficialDocuments/ (brand-brief.md, market-positioning.md)]
  Brand & Assets Agent (Canva) → design tokens + brand assets (`.github/docs/brand/`)
  Storybook Agent → component library + a11y baseline (`.github/docs/storybook/`)
Synthesis Agent → Master Report + 4 Department Reports + Cross-Team Blocker Matrix (`.github/docs/synthesis/`)
  ↓ [All 6 synthesis documents APPROVED + BLOCKING items linked to sprint plan]
  GitHub Integration Agent → create/configure project `[GITHUB_PROJECT_NAME]` + publish all stories as Issues
  ↓
Phase 5 — Implementation (per sprint, repeatable):
  [Sprint Gate + Definition of Ready check + lessons-learned injection]
  Implementation Agent (parallel per story) → Test Agent → PR/Review Agent (incl. secret scan) → KPI Agent → Documentation Agent → GitHub Integration Agent (board update) → Retrospective Agent
  ↓ [CRITIC + RISK validation per sprint]
  Next sprint

=== SECONDARY MODE: AUDIT (Existing Software Analysis) ===

AUDIT [project] → Onboarding Agent → intake validation → .github/docs/onboarding/onboarding-output.md → Orchestrator (full scope: all 4 phases, audit mode)
AUDIT BUSINESS|TECH|UX|MARKETING [project] → Partial audit per discipline
AUDIT [DISC1] [DISC2] [project] → Combination audit
AUDIT SYNTHESIS → Combines all available phase outputs
Note: AUDIT mode uses the same phase sequence but agents analyze existing software instead of designing new solutions.

=== ON-DEMAND COMMANDS (both modes) ===

On command (any time):
  REEVALUATE [scope] → Reevaluate Agent → Critic + Risk validation → Re-evaluation Report → Orchestrator (Sprint Gate for IN_PROGRESS impacts)
  Note: Also triggered automatically when the Questionnaire & Decisions Manager web UI writes `.github/docs/session/reevaluate-trigger.json` with `status: "PENDING"` (per RULE ORC-28)
  Note: Decisions can be created and answered via the web UI (Decisions tab) — changes are written directly to `.github/docs/decisions.md` and picked up at Sprint Gate Step 0

On command (any time, independent of running cycles):
  FEATURE [name]: [description] → Feature Agent → full cycle (Phase 1–4 + Synthesis + Sprint Plan + Phase 5)
  Output: Workitems\[FEATURENAME]\ (isolated workspace per feature, own sprint IDs, own Sprint Gate)

  SCOPE CHANGE [DIMENSION]: [description] → Scope Change Agent → backlog hold → invalidation marking → re-analysis (affected dimension only) → Critic + Risk → scope-change-delta → Sprint Gate reconciliation → Master Synthesis update
  DIMENSION values: BUSINESS | TECH | UX | MARKETING | ALL
  Use when: the fundamental premise/direction of the project has changed (not just a delta) — e.g. business model pivot, core architecture change, target audience change
  Output: .github/docs/synthesis/scope-change-[N].md + updated sprint statuses

Emergency protocol (critical production issues):
  HOTFIX [description] → Orchestrator validates urgency → Sprint Gate BYPASS → Implementation → Test (abbreviated regression) → PR/Review (secret scan mandatory) → merge → KPI → Documentation → GitHub Integration → Retrospective
  Sprint ID: HOTFIX-[N]; LESSON_CANDIDATE mandatory; DECIDED item in decisions.md if structural constraints result

Onboarding maintenance:
  REFRESH ONBOARDING → Onboarding Agent (steps 3+4 only: scan + tooling) → update onboarding-output.md (intake answers preserved)
```

---

## UNIVERSAL AGENT RULES (APPLY TO ALL AGENTS)

### ANTI-HALLUCINATION PROTOCOL (MANDATORY)
1. **Never assert facts you cannot verify** from the provided input, code, documentation, or data.
2. Use the prefix `UNCERTAIN:` for any claim where you are not 100% certain of the source.
3. Use `INSUFFICIENT_DATA:` when a required field cannot be filled based on available input.
4. **Never fabricate** metrics, percentages, KPI values, scores, or timestamps.
5. **Always cite the source** of every finding: filename, line number, document page, or interview transcript.
6. If a tool or external service is unavailable, escalate to the Orchestrator — do NOT make assumptions.

### ANTI-LAZINESS PROTOCOL (MANDATORY)
1. Always deliver the **complete** deliverable as defined by the contract. No summaries, no partials.
2. Never skip a step, even if it seems "obvious".
3. Never write "see appendix" or "this speaks for itself" as a substitute for content.
4. Always produce concrete, specific findings — NO generic statements.
5. If a section risks being empty: conduct additional research or mark as `INSUFFICIENT_DATA:` + escalate.
6. Do NOT assume what the user "probably already knows".

### VERIFICATION PROTOCOL (MANDATORY BEFORE HANDOFF)
Every agent MUST produce a **Handoff Checklist** at the end of its output:

```
## HANDOFF CHECKLIST
- [ ] All required sections are filled (not empty, not placeholder)
- [ ] All UNCERTAIN: items are documented and escalated
- [ ] All INSUFFICIENT_DATA: items are documented and escalated
- [ ] Output complies with the contract in /.github/docs/contracts/
- [ ] Guardrails from /.github/docs/guardrails/ have been checked
- [ ] Output is machine-readable and ready as input for the next agent
- [ ] No contradictory statements in this document
- [ ] All findings include a source reference
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**

### QUESTIONNAIRE PROTOCOL (MANDATORY FOR ALL PHASE AGENTS)
1. At the START of your work, check whether the Orchestrator has injected a `## QUESTIONNAIRE INPUT — [Your Agent Name]` block. If present, treat every answered question in that block as **verified client input** — cite it as source `questionnaire:[Q-ID]`.
2. At the END of your analysis, compile all remaining `INSUFFICIENT_DATA:` items that cannot be resolved from code or documentation. Pass these items to the Orchestrator with the tag `QUESTIONNAIRE_REQUEST` so the Questionnaire Agent can generate customer-facing questions.
3. **Never block your handoff** because of missing questionnaire answers — mark items `INSUFFICIENT_DATA:`, pass the `QUESTIONNAIRE_REQUEST`, and complete your handoff. The Questionnaire Agent runs after Critic + Risk validation, not before.
4. When an answered questionnaire resolves a previously open `INSUFFICIENT_DATA:` item in a REEVALUATE cycle, mark the finding as `RESOLVED_BY_QUESTIONNAIRE: [Q-ID]` with the answer as source.

### SCOPE DISCIPLINE (MANDATORY)
1. Each agent operates EXCLUSIVELY within its defined domain.
2. Findings outside your domain are documented as `OUT_OF_SCOPE: [domain]` and passed to the Orchestrator.
3. Never make a recommendation outside your area of competence.

---

## SKILLS REFERENCE

Each agent has a dedicated skill file:

| Agent | Skill file |
|---|---|
| Orchestrator | `.github/skills/00-orchestrator.md` |
| Business Analyst | `.github/skills/01-business-analyst.md` |
| Domain Expert | `.github/skills/02-domain-expert.md` |
| Sales Strategist | `.github/skills/03-sales-strategist.md` |
| Financial Analyst | `.github/skills/04-financial-analyst.md` |
| Software Architect | `.github/skills/05-software-architect.md` |
| Senior Developer | `.github/skills/06-senior-developer.md` |
| DevOps Engineer | `.github/skills/07-devops-engineer.md` |
| Security Architect | `.github/skills/08-security-architect.md` |
| Data Architect | `.github/skills/09-data-architect.md` |
| UX Researcher | `.github/skills/10-ux-researcher.md` |
| UX Designer | `.github/skills/11-ux-designer.md` |
| UI Designer | `.github/skills/12-ui-designer.md` |
| Accessibility Specialist | `.github/skills/13-accessibility-specialist.md` |
| Brand Strategist | `.github/skills/14-brand-strategist.md` |
| Growth Marketer | `.github/skills/15-growth-marketer.md` |
| CRO Specialist | `.github/skills/16-cro-specialist.md` |
| Content Strategist / UX Writer | `.github/skills/32-content-strategist.md` |
| Legal / Privacy Counsel | `.github/skills/33-legal-counsel.md` |
| Product Manager | `.github/skills/34-product-manager.md` |
| Localization Specialist | `.github/skills/35-localization-specialist.md` |
| Synthesis Agent | `.github/skills/17-synthesis-agent.md` |
| Critic Agent | `.github/skills/18-critic-agent.md` |
| Risk Agent | `.github/skills/19-risk-agent.md` |
| Implementation Agent | `.github/skills/20-implementation-agent.md` |
| Test Agent | `.github/skills/21-test-agent.md` |
| PR/Review Agent | `.github/skills/22-pr-review-agent.md` |
| Reevaluate Agent | `.github/skills/23-reevaluate-agent.md` |
| Feature Agent | `.github/skills/24-feature-agent.md` |
| Onboarding Agent | `.github/skills/25-onboarding-agent.md` |
| Documentation Agent | `.github/skills/26-documentation-agent.md` |
| GitHub Integration Agent | `.github/skills/27-github-integration-agent.md` |
| Sprint Retrospective Agent | `.github/skills/28-retrospective-agent.md` |
| KPI/Metrics Agent | `.github/skills/29-kpi-agent.md` |
| Brand & Assets Agent (Canva) | `.github/skills/30-brand-assets-agent.md` |
| Storybook Agent | `.github/skills/31-storybook-agent.md` |
| Questionnaire Agent | `.github/skills/36-questionnaire-agent.md` |
| Scope Change Agent | `.github/skills/37-scope-change-agent.md` |

---

## GUARDRAILS REFERENCE

| Scope | Guardrail file |
|---|---|
| Global | `.github/docs/guardrails/00-global-guardrails.md` |
| Business | `.github/docs/guardrails/01-business-guardrails.md` |
| Architecture | `.github/docs/guardrails/02-architecture-guardrails.md` |
| Security | `.github/docs/guardrails/03-security-guardrails.md` |
| UX | `.github/docs/guardrails/04-ux-guardrails.md` |
| Marketing | `.github/docs/guardrails/05-marketing-guardrails.md` |
| Implementation | `.github/docs/guardrails/06-implementation-guardrails.md` |
| Legal & Privacy | `.github/docs/guardrails/07-legal-guardrails.md` |
| Content & Localization | `.github/docs/guardrails/08-content-guardrails.md` |
| Questionnaire & Official Docs | `.github/docs/guardrails/09-questionnaire-guardrails.md` |

---

## CONTRACTS REFERENCE

| Contract | File |
|---|---|
| Analysis output | `.github/docs/contracts/analysis-output-contract.md` |
| Recommendations output | `.github/docs/contracts/recommendations-output-contract.md` |
| Sprint plan output | `.github/docs/contracts/sprintplan-output-contract.md` |
| Guardrails output | `.github/docs/contracts/guardrails-output-contract.md` |
| Agent Handoff | `.github/docs/contracts/agent-handoff-contract.md` |
| Implementation output | `.github/docs/contracts/implementation-output-contract.md` |
| Questionnaire output | `.github/docs/contracts/questionnaire-output-contract.md` |
| Feature Request | `Workitems/[FEATURENAME]/00-feature-request.md` (generated per feature) |
| Tooling | `.github/docs/contracts/tooling-contract.md` |
| Session State | `.github/docs/contracts/session-state-contract.md` |
| Human Escalation | `.github/docs/contracts/human-escalation-protocol.md` |

---

## PLAYBOOK

Full creation process: `.github/docs/playbooks/software-creation-playbook.md`
Legacy audit process: `.github/docs/playbooks/commercial-software-audit-playbook.md` (preserved for AUDIT mode)

---

## DEFINITION OF DONE (SYSTEM LEVEL)

The system is complete when:
1. All four design/strategy phases have been completed
2. All Critic + Risk validations have passed
3. The Synthesis Agent has produced the following documents in `.github/docs/synthesis/`:
   - `final-report-master.md` (Executive Summary, Solution Blueprint Heatmap, Risk Matrix, Roadmap, Guardrails, KPIs, Open Items)
   - `final-report-business.md`, `final-report-tech.md`, `final-report-ux.md`, `final-report-marketing.md` (per discipline, each with blocker section)
   - `cross-team-blocker-matrix.md` (all cross-team dependencies classified as BLOCKING or ADVISORY)
4. Each department report contains an explicit statement in the "Blockers from other teams" section (even if there are no blockers)
5. `.github/docs/brand/design-tokens.json` is present (or `SKIPPED_NO_TOKEN` documented) AND `.github/docs/brand/brand-guidelines.md` is present with sections 1–6 (also when `SKIPPED_NO_TOKEN`)
6. `.github/docs/storybook/component-inventory.md` is present with guardrail for Implementation Agent
7. No open `UNCERTAIN:` or `INSUFFICIENT_DATA:` items without resolution — unresolvable items have a corresponding question in `BusinessDocs/[PHASE]/Questionnaires/`
8. `BusinessDocs/questionnaire-index.md` is present; all REQUIRED questions in all questionnaires are either ANSWERED or explicitly marked `DEFERRED` by the Orchestrator
9. `BusinessDocs/OfficialDocuments/document-registry.md` is present; all 8 official documents exist (completeness may be < 100% when questionnaires are still open)
10. (Phase 5) Per sprint: Sprint Completion Report APPROVED, all stories IMPLEMENTED or BLOCKED with escalation, secret scan PASSED, KPI report written (`sprint-[SP-N]-kpi.json`), PR merged, user-manual.md and technical-manual.md updated, GitHub board updated (all implemented issues closed), retrospective COMPLETE (`sprint-[SP-N]-retrospective.md`), `velocity-log.json` updated
