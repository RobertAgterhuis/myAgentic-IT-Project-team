# New Software Solution Creation – Complete Playbook
> End-to-end creation process for new commercial software products

---

## OVERVIEW

This playbook describes the complete creation process from A to Z. It covers five phases and produces a final Solution Blueprint with Executive Summary, Solution Blueprint Heatmap, Risk Matrix, 12-month roadmap, Guardrail document, KPI targets, and Sprint Completion Reports per implemented sprint.

**The order is non-negotiable.** Strategy → Technology → Experience → Growth → Implementation.

---

## PHASE 1: REQUIREMENTS & STRATEGY (2–3 weeks)

### Objective
Complete definition of the business model, product vision, requirements, strategic positioning, and financial projections for the new software product before any technical or UX design starts.

### Agents (In Order)
1. **Business Analyst** (skill: `01-business-analyst.md`)
2. **Domain Expert** (skill: `02-domain-expert.md`)
3. **Sales Strategist** (skill: `03-sales-strategist.md`)
4. **Financial Analyst** (skill: `04-financial-analyst.md`)
5. **Product Manager** (skill: `34-product-manager.md`)

### Required Input
- Project brief (product idea, target market, value proposition)
- Business documentation (financial constraints, budget, timeline)
- Domain information (industry, compliance framework, target audience)
- Optional: stakeholder interviews, market research, competitor analysis
- Optional: reference codebase or existing prototype (if available)

### Required Output (Phase 1)
```json
{
  "product_vision": {},
  "business_model_canvas": {},
  "business_rules": [],
  "risk_assessment": [],
  "kpi_targets": {},
  "gap_analysis": {
    "market": [],
    "product": [],
    "revenue": [],
    "operations": []
  },
  "priority_matrix": [],
  "icp": {},
  "go_to_market_strategy": {},
  "financial_projections": {}
}
```

### Validation
After Phase 1: **Critic Agent** + **Risk Agent** validation mandatory.
Phase 2 does NOT start without both validations APPROVED.

### Post-Phase 1: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** (skill: `36-questionnaire-agent.md`) — collects all `INSUFFICIENT_DATA:` items from Phase 1 agents and generates customer-facing questionnaires in `BusinessDocs/Phase1-Business/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/product-vision.md` and `financial-model-overview.md` based on verified Phase 1 output and any answered questionnaire data

Questionnaire generation NEVER blocks Phase 2. Answers fed back via REEVALUATE or new CREATE cycle.
Non-technical stakeholders can use the Questionnaire & Decisions Manager web UI: `node .github/webapp/server.js` → http://127.0.0.1:3000
Decisions can also be created and answered from the **Decisions** tab in the web UI — changes are written directly to `.github/docs/decisions.md`.

---

## PHASE 2: ARCHITECTURE & DESIGN (3–4 weeks)

### Objective
Complete architecture design, technology stack selection, security design, and data model for the new software product — designed to fulfill the strategic ambitions from Phase 1.

### Agents (In Order)
1. **Software Architect** (skill: `05-software-architect.md`)
2. **Senior Developer** (skill: `06-senior-developer.md`)
3. **DevOps Engineer** (skill: `07-devops-engineer.md`)
4. **Security Architect** (skill: `08-security-architect.md`)
5. **Data Architect** (skill: `09-data-architect.md`)
6. **Legal / Privacy Counsel** (skill: `33-legal-counsel.md`)

### Required Input
- Phase 1 output (complete)
- Technology preferences (if any)
- Infrastructure constraints (cloud provider, budget, compliance)
- Optional: reference architecture, existing patterns to follow
- Optional: reference codebase (if building on an existing foundation)

### Required Output (Phase 2)
```json
{
  "architecture_decisions": [],
  "technology_stack": {},
  "system_design": {},
  "api_contracts": [],
  "security_design": {},
  "data_model": {},
  "ci_cd_design": {},
  "infrastructure_design": {},
  "legal_requirements": [],
  "non_functional_requirements": {}
}
```

### Validation
After Phase 2: **Critic Agent** + **Risk Agent** validation mandatory.

### Post-Phase 2: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** — generates questionnaires in `BusinessDocs/Phase2-Tech/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/technical-overview.md` and `legal-compliance-overview.md`

Answers fed back via REEVALUATE or new cycle. Web UI available: `node .github/webapp/server.js` → http://127.0.0.1:3000 (questionnaires + decisions management)

---

## PHASE 3: EXPERIENCE DESIGN (2–3 weeks)

### Objective
Complete UX/UI design, accessibility baseline, content strategy, and internationalization plan for the new product — designed against the technical architecture from Phase 2 and the business goals from Phase 1.

### Agents (In Order)
1. **UX Researcher** (skill: `10-ux-researcher.md`)
2. **UX Designer** (skill: `11-ux-designer.md`)
3. **UI Designer** (skill: `12-ui-designer.md`)
4. **Accessibility Specialist** (skill: `13-accessibility-specialist.md`)
5. **Content Strategist / UX Writer** (skill: `32-content-strategist.md`)
6. **Localization Specialist** (skill: `35-localization-specialist.md`)

### Required Input
- Phase 1 + Phase 2 output (complete)
- User personas and ICP from Phase 1
- Architecture constraints from Phase 2
- Optional: user research data, competitor UX analysis
- Optional: design files or brand guidelines (if available)

### Required Output (Phase 3)
```json
{
  "user_personas": [],
  "user_journeys": [],
  "information_architecture": {},
  "wireframes": [],
  "design_system": {},
  "accessibility_requirements": {},
  "content_strategy": {},
  "microcopy_guidelines": {},
  "localization_plan": {}
}
```

### Validation
After Phase 3: **Critic Agent** + **Risk Agent** validation mandatory.

### Post-Phase 3: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** — generates questionnaires in `BusinessDocs/Phase3-UX/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/ux-design-brief.md` and `content-strategy-brief.md`

Answers fed back via REEVALUATE or new cycle. Web UI available: `node .github/webapp/server.js` → http://127.0.0.1:3000 (questionnaires + decisions management)

---

## PHASE 4: BRAND & GROWTH (2 weeks)

### Objective
Create the brand identity and growth strategy for the new product based on the product reality established in the preceding phases.

### Agents (In Order)
1. **Brand Strategist** (skill: `14-brand-strategist.md`)
2. **Growth Marketer** (skill: `15-growth-marketer.md`)
3. **CRO Specialist** (skill: `16-cro-specialist.md`)

### Required Input
- Phase 1 through Phase 3 output (complete)
- Brand preferences (if any)
- Marketing budget (if known)
- Competitive positioning from Phase 1

### Required Output (Phase 4)
```json
{
  "brand_identity": {},
  "brand_voice_tone": {},
  "growth_model": {},
  "acquisition_channels": [],
  "conversion_funnel_design": {},
  "experiment_backlog": [],
  "launch_plan": {},
  "seo_strategy": {}
}
```

### Validation
After Phase 4: **Critic Agent** + **Risk Agent** validation mandatory.

### Post-Phase 4: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** — generates questionnaires in `BusinessDocs/Phase4-Marketing/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/brand-brief.md` and `market-positioning.md`

Answers fed back via REEVALUATE or new cycle. Web UI available: `node .github/webapp/server.js` → http://127.0.0.1:3000 (questionnaires + decisions management)

### Post-Phase 4: Brand & Storybook
After Critic + Risk validation:
1. **Brand & Assets Agent** (skill: `30-brand-assets-agent.md`) — design tokens + brand assets (`.github/docs/brand/`)
2. **Storybook Agent** (skill: `31-storybook-agent.md`) — component library + a11y baseline (`.github/docs/storybook/`)

---

## PHASE 5: AUTONOMOUS IMPLEMENTATION (Ongoing per sprint)

### Objective
Actual implementation of the designed software product per the approved sprint stories from Phases 1–4, fully autonomous and traceable, with automated tests, guardrail validation, and Sprint Completion Reports per sprint.

### Agents (Per Sprint, In Order)
1. **Implementation Agent** (skill: `20-implementation-agent.md`) — writes code per story
2. **Test Agent** (skill: `21-test-agent.md`) — validates implementation against acceptance criteria
3. **PR/Review Agent** (skill: `22-pr-review-agent.md`) — final review, create PR, close sprint
4. ↓ **Critic Agent** (skill: `18-critic-agent.md`) — validate sprint output
5. ↓ **Risk Agent** (skill: `19-risk-agent.md`) — risk assessment per sprint
6. **KPI Agent** (skill: `29-kpi-agent.md`) — measure sprint KPIs and emit alerts
7. **Documentation Agent** (skill: `26-documentation-agent.md`) — update user/technical manuals and changelog
8. **GitHub Integration Agent** (skill: `27-github-integration-agent.md`) — update project board and close issues
9. **Retrospective Agent** (skill: `28-retrospective-agent.md`) — sprint retrospective, velocity log, lessons learned

### Required Input
- Synthesis Final Report (complete, Critic + Risk APPROVED)
- Approved sprint plans from all specialist agents
- Architecture decisions from Phase 2 (Software Architect + Senior Developer output)
- Design system from Phase 3 (UI Designer + Storybook Agent output)
- Guardrails (`.github/docs/guardrails/00–09`)
- Implementation Output Contract (`.github/docs/contracts/implementation-output-contract.md`)

**HALT:** Phase 5 NEVER starts without a fully APPROVED Synthesis Final Report and validated sprint plans (Critic + Risk PASSED per phase).

### Execution Per Sprint

```
For each sprint (SP-1, SP-2, ...):
  1. Orchestrator: activate stories per sprint plan (parallel tracks = simultaneously)
  2. Per story: Implementation Agent → Test Agent (return if REJECTED)
  3. After all stories: PR/Review Agent assembles sprint PR
  4. Critic Agent validates Sprint Completion Report
  5. Risk Agent assesses new findings
  6. On PASSED: merge PR, activate next sprint
  7. On FAILED: return to Implementation Agent per finding
```

### Parallel Tracks

Stories in the same sprint that have NO mutual dependencies (identified in the Parallel Tracks section of the sprint plans) are picked up **simultaneously** by multiple Implementation Agent instances. The PR/Review Agent assembles all story outputs into one sprint PR after all stories are APPROVED.

### Required Output (Per Sprint)
```json
{
  "sprint_id": "SP-N",
  "sprint_goal": "",
  "stories_implemented": [],
  "sprint_completion_report": {},
  "pr_url": "",
  "kpi_measurement": {},
  "new_critical_findings": [],
  "blockers_open": [],
  "critic_status": "PASSED | FAILED",
  "risk_status": "PASSED | FAILED"
}
```

### Validation Per Sprint
After each sprint: **Critic Agent** + **Risk Agent** validation mandatory.
Next sprint does NOT start without both validations APPROVED.

---

## SYNTHESIS (1 week)

### Objective
Consolidation of all phase outputs into one coherent Solution Blueprint for decision-makers and implementation teams.

### Agent
**Synthesis Agent** (skill: `17-synthesis-agent.md`)

### Required Output (Final Report)
1. Executive Summary (board-level, max 2 pages)
2. Solution Blueprint Heatmap (readiness across dimensions)
3. Risk Matrix (consolidated)
4. 12-month roadmap (build milestones)
5. Combined Guardrail Document
6. KPI Target Dashboard
7. Open Items Register

---

## ON-DEMAND COMMANDS

These commands can be triggered at any time, independent of the running sprint cycle:

### REEVALUATE [scope]
Re-analyzes one or more phases after requirements or context has changed — direction stays the same, design decisions are updated via delta.

| Scope | What is re-analyzed |
|-------|---------------------|
| `BUSINESS` | Phase 1 only |
| `TECH` | Phase 2 only |
| `UX` | Phase 3 only |
| `MARKETING` | Phase 4 only |
| `ALL` | All four phases |
| `DELTA-ONLY` | Valid modifier: detect what changed, no full re-analysis |

Agent: `23-reevaluate-agent.md` → Critic + Risk → Re-evaluation Report → Orchestrator (Sprint Gate impact)

### SCOPE CHANGE [DIMENSION]: [description]
Changes the fundamental premise on which the solution design was built — not a delta, but a direction change.

Use when: business model pivot, core architecture change, target audience shift — situations where parts of the existing design become actively *wrong*.

| Dimension | Affected design |
|-----------|------------------|
| `BUSINESS` | Phase 1 agents |
| `TECH` | Phase 2 agents |
| `UX` | Phase 3 agents |
| `MARKETING` | Phase 4 agents |
| `ALL` | All phases |

Agent: `37-scope-change-agent.md` → Backlog Hold → Invalidation marking → Re-analysis → Critic + Risk → Sprint Gate Reconciliation → Master Synthesis update
Output: `.github/docs/synthesis/scope-change-[N].md` + updated sprint statuses

### FEATURE [name]: [description]
Runs the complete Phase 1–4 + Synthesis + Sprint Plan cycle for a single new feature in an isolated workspace.

Output: `Workitems/[FEATURENAME]/` — own sprint IDs, own Sprint Gate, no impact on main backlog without Orchestrator approval.
Agent: `24-feature-agent.md`

### HOTFIX [description]
Emergency protocol for critical production issues. Bypasses Sprint Gate.

Agent pipeline: Implementation → Test (abbreviated) → PR/Review (secret scan mandatory) → merge → KPI → Documentation → GitHub Integration → Retrospective
Sprint ID: `HOTFIX-[N]` | Mandatory: LESSON_CANDIDATE + DECIDED item if structural constraint results.

### REFRESH ONBOARDING
Re-runs steps 3+4 of the Onboarding Agent (project scan + tooling check) without re-asking intake questions.
Useful after significant changes when a full REEVALUATE is premature.

---

## GOVERNANCE STRUCTURE

| Meeting | Frequency | Participants | Purpose |
|---------|-----------|------------|------|
| Agent Handoff Review | Per handoff | Orchestrator | Quality control |
| Phase Review | End of each phase | Critic + Risk + Orchestrator | Go/No-Go decision |
| Stakeholder Update | Weekly | Product owner / client | Progress reporting |
| Final Presentation | Week 12 | All stakeholders | Solution Blueprint presentation |

---

## TIME ESTIMATE

| Phase | Duration |
|------|------|
| Phase 1: Requirements & Strategy | 2–3 weeks |
| Phase 2: Architecture & Design | 3–4 weeks |
| Phase 3: Experience Design | 2–3 weeks |
| Phase 4: Brand & Growth | 2 weeks |
| Synthesis & Roadmap | 1 week |
| Phase 5: Implementation (per sprint) | 2 weeks/sprint × [n sprints] |
| **Total (design + first sprint)** | **12–14 weeks** |

---

## DEFINITION OF DONE (SYSTEM)

The creation process is COMPLETE when:
1. All four design phases are Critic + Risk APPROVED
2. The Synthesis Agent has produced the Solution Blueprint
3. The Solution Blueprint contains all 7 required components
4. No open `CRITICAL_FINDING` or `CRITICAL_GAP` items without resolution
5. No open `CRITICAL_MISALIGNMENT` items without resolution
6. KPI targets are documented (or `INSUFFICIENT_DATA:` with escalations resolved)

The implementation process (Phase 5) is COMPLETE per sprint when:
7. All stories in the sprint are IMPLEMENTED or BLOCKED (with escalation)
8. Sprint Completion Report JSON is present and APPROVED by Critic + Risk Agent
9. KPI measurement per sprint has been performed and documented
10. No new `CRITICAL_FINDING` without resolution in the sprint output
11. The PR has been merged into the main branch

---

## CORE PRINCIPLE

> **Building without strategic validation leads to features without market value.**

The order:
**Strategy → Technology → Experience → Growth → Implementation**

is deliberate and immutable.
