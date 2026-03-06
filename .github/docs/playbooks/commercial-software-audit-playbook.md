# Commercial Software Audit – Complete Playbook
> End-to-end audit process for existing commercial software

---

## OVERVIEW

This playbook describes the complete audit process from A to Z. It covers five phases over 14–17 weeks and produces a final report and implemented code with Executive Summary, Capability Heatmap, Risk Matrix, 12-month roadmap, Guardrail document, KPI baseline + targets, and Sprint Completion Reports per implemented sprint.

**The order is non-negotiable.** Strategy → Technology → Experience → Growth → Implementation.

---

## PHASE 1: BUSINESS & STRATEGY (2–3 weeks)

### Objective
Complete understanding of the current business model, capabilities, business rules, and strategic position before any technical or UX analysis starts.

### Agents (In Order)
1. **Business Analyst** (skill: `01-business-analyst.md`)
2. **Domain Expert** (skill: `02-domain-expert.md`)
3. **Sales Strategist** (skill: `03-sales-strategist.md`)
4. **Financial Analyst** (skill: `04-financial-analyst.md`)
5. **Product Manager** (skill: `34-product-manager.md`)

### Required Input
- Complete codebase (or access to it)
- Product documentation (requirements, specs, wiki, README)
- Business documentation (financial, pricing, ICP, CRM exports)
- Domain information (industry, compliance framework)
- Optional: stakeholder interviews, support ticket data, analytics exports

### Required Output (Phase 1)
```json
{
  "capabilities": [],
  "business_rules": [],
  "risk_assessment": [],
  "kpi_baseline": {},
  "gap_analysis": {
    "market": [],
    "product": [],
    "revenue": [],
    "operations": []
  },
  "priority_matrix": [],
  "icp": {},
  "sales_cycle": [],
  "financial_summary": {}
}
```

### Validation
After Phase 1: **Critic Agent** + **Risk Agent** validation mandatory.
Phase 2 does NOT start without both validations APPROVED.

### Post-Phase 1: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** (skill: `36-questionnaire-agent.md`) — collects all `INSUFFICIENT_DATA:` items from Phase 1 agents and generates customer-facing questionnaires in `BusinessDocs/Phase1-Business/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/product-vision.md` and `financial-model-overview.md` based on verified Phase 1 output and any answered questionnaire data

Questionnaire generation NEVER blocks Phase 2. Answers fed back via REEVALUATE or new AUDIT.

---

## PHASE 2: TECHNOLOGY & ARCHITECTURE (3–4 weeks)

### Objective
Complete picture of the technical state of the software: architecture, code quality, infrastructure, security, and data — assessed against the strategic ambitions from Phase 1.

### Agents (In Order)
1. **Software Architect** (skill: `05-software-architect.md`)
2. **Senior Developer** (skill: `06-senior-developer.md`)
3. **DevOps Engineer** (skill: `07-devops-engineer.md`)
4. **Security Architect** (skill: `08-security-architect.md`)
5. **Data Architect** (skill: `09-data-architect.md`)
6. **Legal / Privacy Counsel** (skill: `33-legal-counsel.md`)

### Required Input
- Phase 1 output (complete)
- Complete codebase with git history
- CI/CD configuration files
- Infrastructure documentation / IaC files
- Database schemas
- Security scan output (if available)

### Required Output (Phase 2)
```json
{
  "architecture_gaps": [],
  "tech_debt_score": {"dimensions": {}, "total": 0},
  "scalability_risks": [],
  "security_findings": [],
  "ci_cd_maturity_level": 0,
  "observability_gaps": [],
  "data_lineage_map": {},
  "legal_compliance_gaps": []
}
```

### Validation
After Phase 2: **Critic Agent** + **Risk Agent** validation mandatory.

### Post-Phase 2: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** — generates questionnaires in `BusinessDocs/Phase2-Tech/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/technical-overview.md` and `legal-compliance-overview.md`

---

## PHASE 3: UX & PRODUCT EXPERIENCE (2–3 weeks)

### Objective
Complete picture of the user experience, assessed against the technical frameworks from Phase 2 and the business goals from Phase 1.

### Agents (In Order)
1. **UX Researcher** (skill: `10-ux-researcher.md`)
2. **UX Designer** (skill: `11-ux-designer.md`)
3. **UI Designer** (skill: `12-ui-designer.md`)
4. **Accessibility Specialist** (skill: `13-accessibility-specialist.md`)
5. **Content Strategist / UX Writer** (skill: `32-content-strategist.md`)
6. **Localization Specialist** (skill: `35-localization-specialist.md`)

### Required Input
- Phase 1 + Phase 2 output (complete)
- Access to the live product or screenshots/recordings
- Analytics data (page flows, funnel data)
- Usability test data (if available)
- Design files (Figma, Sketch, etc. – if available)

### Required Output (Phase 3)
```json
{
  "journey_gaps": [],
  "cognitive_load_scores": [],
  "accessibility_score": "WCAG-AA",
  "heuristic_evaluation": [],
  "design_debt_estimate": {},
  "friction_points": [],
  "content_gaps": [],
  "localization_readiness": {}
}
```

### Validation
After Phase 3: **Critic Agent** + **Risk Agent** validation mandatory.

### Post-Phase 3: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** — generates questionnaires in `BusinessDocs/Phase3-UX/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/ux-design-brief.md` and `content-strategy-brief.md`

---

## PHASE 4: BRAND, MARKETING & GROWTH (2 weeks)

### Objective
Optimize the external image and growth strategy based on the product reality established in the preceding phases.

### Agents (In Order)
1. **Brand Strategist** (skill: `14-brand-strategist.md`)
2. **Growth Marketer** (skill: `15-growth-marketer.md`)
3. **CRO Specialist** (skill: `16-cro-specialist.md`)

### Required Input
- Phase 1 through Phase 3 output (complete)
- Marketing materials (website, sales decks, social media)
- Analytics data (web, advertising, email)
- CRM data (funnel, conversion)

### Required Output (Phase 4)
```json
{
  "message_alignment_score": 0,
  "funnel_dropoffs": [],
  "experiment_backlog": [],
  "brand_consistency_audit": [],
  "competitive_positioning": {},
  "seo_analysis": {}
}
```

### Validation
After Phase 4: **Critic Agent** + **Risk Agent** validation mandatory.

### Post-Phase 4: Questionnaire Agent
After Critic + Risk PASSED:
1. **Questionnaire Agent** — generates questionnaires in `BusinessDocs/Phase4-Marketing/Questionnaires/`
2. **Questionnaire Agent** — creates or updates `BusinessDocs/OfficialDocuments/brand-brief.md` and `market-positioning.md`

### Post-Phase 4: Brand & Storybook
After Critic + Risk validation:
1. **Brand & Assets Agent** (skill: `30-brand-assets-agent.md`) — design tokens + brand assets (`.github/docs/brand/`)
2. **Storybook Agent** (skill: `31-storybook-agent.md`) — component library + a11y baseline (`.github/docs/storybook/`)

---

## SYNTHESIS (1 week)

### Objective
Consolidation of all phase outputs into one coherent final report for decision-makers.

### Agent
**Synthesis Agent** (skill: `17-synthesis-agent.md`)

### Required Output (Final Report)
1. Executive Summary (board-level, max 2 pages)
2. Capability Heatmap
3. Risk Matrix (consolidated)
4. 12-month roadmap
5. Combined Guardrail Document
6. KPI Baseline + Target Dashboard
7. Open Items Register

---

## POST-SYNTHESIS: GITHUB INTEGRATION

After Synthesis is APPROVED, the **GitHub Integration Agent** (skill: `27-github-integration-agent.md`) publishes all sprint stories as GitHub Issues in `INITIAL_PUBLICATION` mode. This creates the project board, labels, milestones, and issues before any sprint begins.

---

## SPRINT GATE

### Definition
The Sprint Gate is the decision point between Synthesis and each sprint in Phase 5. It gates entry into implementation and recurs between sprints.

### Inputs
- Synthesis outputs (all 6 documents APPROVED)
- `.github/docs/decisions.md` (decided items since last gate)
- `.github/docs/session/reevaluate-trigger.json` (if `status: "PENDING"`)
- Sprint Completion Report from previous sprint (if not first sprint)
- Lessons learned from previous sprint (if not first sprint)

### Sprint Gate Steps
1. **Step 0 — Check Decisions + Reevaluate Triggers:** Load decisions.md for new DECIDED items; check reevaluate-trigger.json for PENDING triggers. If PENDING reevaluate found, execute REEVALUATE before proceeding.
2. **Step 1 — Present Sprint:** Present the next sprint's stories to user for `IMPLEMENT` or `BACKLOG` decision per story. Apply Definition of Ready check. Inject lessons-learned from previous sprints.

### Outputs
- Sprint activation decision: `IMPLEMENT` | `BACKLOG` per story
- Updated story statuses in session-state.json
- Lessons-learned injection into agent contexts

### Transition
On `IMPLEMENT` decision → Phase 5 activates for the selected sprint.

---

## PHASE 5: AUTONOMOUS IMPLEMENTATION (Ongoing per sprint)

### Objective
Actual implementation of the approved sprint stories from Phases 1–4, fully autonomous and traceable, with automated tests, guardrail validation, and Sprint Completion Reports per sprint.

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
- Approved sprint plans from all 4 phases (produced by the specialist agents)
- Codebase (read + write access)
- Architecture decisions Phase 2 (Software Architect + Senior Developer output)
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

## ON-DEMAND COMMANDS

These commands can be triggered at any time, independent of the running sprint cycle:

### REEVALUATE [scope]
Re-analyzes one or more phases after the code or context has changed — direction stays the same, findings are updated via delta.

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
Changes the fundamental premise on which the audit was built — not a delta, but a direction change.

Use when: business model pivot, core architecture change, target audience shift, product discontinuation — situations where parts of the existing audit become actively *wrong*.

| Dimension | Affected analysis |
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
Re-runs steps 3+4 of the Onboarding Agent (codebase scan + tooling check) without re-asking intake questions.
Useful after significant code changes when a full REEVALUATE is premature.

---

## GOVERNANCE STRUCTURE

| Meeting | Frequency | Participants | Purpose |
|---------|-----------|------------|------|
| Agent Handoff Review | Per handoff | Orchestrator | Quality control |
| Phase Review | End of each phase | Critic + Risk + Orchestrator | Go/No-Go decision |
| Stakeholder Update | Weekly | Product owner / client | Progress reporting |
| Final Presentation | Week 12 | All stakeholders | Final report presentation |

---

## TIME ESTIMATE

| Phase | Duration |
|------|------|
| Phase 1: Business & Strategy | 2–3 weeks |
| Phase 2: Technology & Architecture | 3–4 weeks |
| Phase 3: UX & Product Experience | 2–3 weeks |
| Phase 4: Brand, Marketing & Growth | 2 weeks |
| Synthesis & Roadmap | 1 week |
| Phase 5: Implementation (per sprint) | 2 weeks/sprint × [n sprints] |
| **Total (analysis + first sprint)** | **12–14 weeks** |

---

## DEFINITION OF DONE (SYSTEM)

The audit process is COMPLETE when:
1. All four analysis phases are Critic + Risk APPROVED
2. The Synthesis Agent has produced the final report
3. The final report contains all 7 required components
4. No open `CRITICAL_FINDING` or `CRITICAL_GAP` items without resolution
5. No open `CRITICAL_MISALIGNMENT` items without resolution
6. KPI baseline is documented (or `INSUFFICIENT_DATA:` with escalations resolved)

The implementation process (Phase 5) is COMPLETE per sprint when:
7. All stories in the sprint are IMPLEMENTED or BLOCKED (with escalation)
8. Sprint Completion Report JSON is present and APPROVED by Critic + Risk Agent
9. KPI measurement per sprint has been performed and documented
10. No new `CRITICAL_FINDING` without resolution in the sprint output
11. The PR has been merged into the main branch

---

## CORE PRINCIPLE

> **Optimizing without strategic validation leads to local improvements without structural value.**

The order:
**Strategy → Technology → Experience → Growth → Implementation**

is deliberate and immutable.
