# Glossary

Quick reference for terms, flags, statuses, and concepts used throughout the system.

---

## A

**Accessibility Specialist** (Agent 13) — Phase 3 agent defining WCAG compliance standards and producing an accessibility testing plan.

**ACTIVE** (Decision Category Status) — A decision category whose rules are enforced by all agents immediately. See [Decisions](decisions.md).

**ADVISORY** (Dependency Type) — Non-blocking cross-team dependency. Coordination is helpful but not required for a team to proceed. Opposite of BLOCKING.

**Analysis** (Deliverable Type) — First output type from phase agents. Must contain minimum 5 sourced findings, identified gaps, scored risks, and a KPI baseline.

**Anti-Hallucination Protocol** — Mandatory rule requiring agents to never assert unverifiable facts, prefix uncertain claims with `UNCERTAIN:`, mark gaps as `INSUFFICIENT_DATA:`, never fabricate metrics, and always cite sources.

**Anti-Laziness Protocol** — Mandatory rule requiring agents to deliver complete deliverables (no summaries or partials), never skip steps, and produce concrete findings rather than generic statements.

**APPROVED** (Critic Verdict) — Output passed all quality checks. Phase can proceed.

**AUDIT** (System Mode) — Alternative to CREATE mode. Analyzes existing software instead of designing new solutions, using the same four-phase structure. Command: `AUDIT [project]`.

**AUTO-ACTIVATE** — Mechanism where a deferred decision category automatically becomes ACTIVE when an agent detects the technology in the codebase.

## B

**Backlog** (Sprint Status / Board Column) — Sprint stories queued for future implementation. Not yet selected for a Sprint Gate.

**BLOCKED** (Story Status / Board Column) — A story cannot proceed due to unresolved dependencies, missing decisions, or external blockers.

**BLOCKING** (Dependency Type) — Critical cross-team dependency. A team cannot start without this from another team. Must appear as BLOCKED in the sprint plan. Opposite of ADVISORY.

**Brand & Assets Agent** (Agent 30) — Post-Phase 4 agent that converts brand strategy into digital assets (brand guidelines, design tokens, Canva assets). See [Synthesis](synthesis.md#brand--assets-agent).

**Brand Strategist** (Agent 14) — Phase 4 agent creating brand identity, positioning, and visual direction.

**Business Analyst** (Agent 01) — Phase 1 agent performing market analysis and requirements definition.

## C

**Canva Integration** — Optional API integration for generating visual brand assets. Status `SKIPPED_NO_TOKEN` if no token was provided during onboarding.

**Checkpoint-and-Yield** — Design pattern where one agent runs per conversation turn, writes output to disk, and the Orchestrator prompts you to type CONTINUE before the next agent starts.

**COMPLETED** (Story Status) — Story has been implemented, tested, reviewed, and merged. The linked GitHub issue is closed.

**Content Strategist** (Agent 32) — Phase 3 agent defining content model, voice & tone guidelines, and UX writing standards.

**CONTINUE** (Command) — Resume an active session from where it left off. Works with session-state.json to maintain state across conversations.

**Contract Compliance** — Critic Agent check ensuring agent output matches the predefined output contracts (Analysis, Recommendations, Sprint Plan, Guardrails).

**CREATE** (System Mode) — Primary mode. Designs and builds a new software solution through four phases. Command: `CREATE [project]`.

**Critic Agent** (Agent 18) — Quality guardian that validates phase output for contract compliance, anti-hallucination, internal consistency, completeness, and decision register compliance. See [Quality Gates](quality-gates.md).

**CRITIC_DECISION_CONFLICT** (Flag) — Recommendation contradicts a DECIDED item. Raised by Critic Agent.

**CRITIC_REVIEW_SUSPICIOUS** (Flag) — Critic returned PASSED with zero findings despite open UNCERTAIN/INSUFFICIENT_DATA items. Orchestrator requires justification.

**CRO Specialist** (Agent 16) — Phase 4 agent designing conversion funnels and optimizing user paths.

**Cross-Team Blocker Matrix** — Synthesis document mapping BLOCKING and ADVISORY dependencies between teams. See [Synthesis](synthesis.md#cross-team-blocker-matrix).

## D

**Data Architect** (Agent 09) — Phase 2 agent designing data models, schemas, and pipelines.

**DECIDED** (Decision Status) — A choice has been made and recorded. Becomes a hard constraint enforced by all agents at three checkpoints: before coding, during testing, at PR review. See [Decisions](decisions.md).

**Decision Register** — Collection of decisions in `.github/docs/decisions.md` plus category files under `.github/docs/decisions/`.

**DEFERRED** (Decision Status) — Decision postponed until the technology is actually needed. Deferred categories are ignored by agents until auto-activated.

**Definition of Ready** — Checklist a story must pass before entering implementation. CODE/INFRA stories need ≥ 2 acceptance criteria and ≤ 8 story points; other types need ≥ 1 criterion. See [Sprints](sprints.md#definition-of-ready).

**Delta Scan** — First step of the Reevaluate Agent. Compares current state to previous analysis and classifies findings as NEW, RESOLVED, CHANGED, or UNCHANGED.

**Department Report** — Self-contained synthesis report per discipline (Business, Technology, UX, Marketing) with 8 standard sections. See [Synthesis](synthesis.md#department-reports).

**Design Tokens** — Machine-readable design system definitions (colors, typography, spacing) in `.github/docs/brand/design-tokens.json`. Converted to CSS/JS by the Storybook Agent.

**DevOps Engineer** (Agent 07) — Phase 2 agent designing CI/CD pipelines and deployment strategies.

**Documentation Agent** (Agent 26) — Updates user manual, technical manual, and changelog after sprint implementation.

**Domain Expert** (Agent 02) — Phase 1 agent providing industry-specific knowledge and domain validation.

## E–F

**EXPIRED** (Decision Status) — Deadline passed without resolution. Ignored by Orchestrator and agents.

**FEATURE** (Command) — Adds a new feature via a full mini-cycle in an isolated workspace under `Workitems/[FEATURENAME]/`. Command: `FEATURE [name]: [description]`. See [Advanced Commands](advanced-commands.md#feature--add-a-new-feature).

**Feature Agent** (Agent 24) — Coordinates independent feature development cycles from analysis through implementation.

**Financial Analyst** (Agent 04) — Phase 1 agent creating revenue models and financial projections.

## G

**GitHub Integration Agent** (Agent 27) — Manages the GitHub project board: publishes issues, updates labels, closes completed issues, maintains board columns.

**Growth Marketer** (Agent 15) — Phase 4 agent identifying growth channels and acquisition strategies.

**Guardrails** (Deliverable Type) — Fourth output type from phase agents. Testable rules/constraints with explicit violation response actions.

## H

**HALLUCINATION_FLAG** (Flag) — Numbers, percentages, or KPIs cited without a verifiable source. Raised by Critic Agent.

**Handoff Checklist** — 9-point verification checklist every agent must complete before yielding control.

**HOTFIX** (Command) — Emergency fix for critical production issues. Bypasses Sprint Gate, requires abbreviated testing. Command: `HOTFIX [description]`. See [Advanced Commands](advanced-commands.md#hotfix--emergency-production-fix).

## I

**Implementation Agent** (Agent 20) — Writes production code per sprint stories. First checkpoint for decision enforcement.

**INCOMPLETE** (Flag) — Mandatory section missing or contains only placeholder content. Raised by Critic Agent.

**INCONSISTENCY_FLAG** (Flag) — An `UNCERTAIN:` claim later repeated as established fact. Raised by Critic Agent.

**INSUFFICIENT_DATA:** (Prefix) — Required information that cannot be filled from available input. Triggers the Questionnaire Agent to generate questions for you.

**IN_PROGRESS** (Sprint Status) — Sprint is actively being implemented.

## K–L

**KPI Agent** (Agent 29) — Measures sprint metrics (velocity, defect rate, code coverage, cycle time) and writes sprint KPI reports.

**Legal Counsel** (Agent 33) — Phase 2 agent ensuring regulatory compliance (GDPR, licensing, privacy).

**LESSON_CANDIDATE** — Learning entry auto-generated after every hotfix and available for retrospective review.

**Lessons-Learned Injection** — Sprint Gate process where the Orchestrator loads top-3 lessons from previous sprints and adjusts estimates based on actual velocity.

**Localization Specialist** (Agent 35) — Phase 3 agent creating the internationalization (i18n) plan and locale support matrix.

## M–O

**Master Report** — Executive-level synthesis document with Executive Summary, Heatmap, Risk Matrix, Roadmap, Guardrails, KPIs, and Open Items. See [Synthesis](synthesis.md#the-master-report).

**Memory Management Protocol** — Mandatory rule preventing memory overload: write deliverables to disk (not chat), use targeted file reads, split outputs > 400 lines, start fresh conversations at phase boundaries.

**NEEDS_REVISION** (Critic Verdict) — Output failed one or more checks. Agent receives specific remediation instructions. Maximum 3 revision cycles per phase.

**NEEDS_REVIEW** (Risk Assessment Verdict) — One or more HIGH risks present in phase output. Mitigation required before proceeding.

**Onboarding Agent** (Agent 25) — Conducts project intake, scans workspace/tooling, and produces the onboarding output. See [Onboarding](onboarding.md).

**OPEN** (Decision Status) — Unanswered question or unresolved choice. HIGH-priority OPEN items matching sprint scope block the Sprint Gate.

**Orchestrator** (Agent 00) — Master coordinator managing phase sequencing, rule enforcement, session state, quality gates, and control flow.

**OUT_OF_SCOPE** — Prefix for findings outside an agent's domain. Passed to Orchestrator without recommendation.

## P

**PARTIAL_RUN** — Synthesis mode when not all 4 phases are complete. Only available department reports are produced; Master Report and Blocker Matrix are withheld.

**Phase 1 — Requirements & Strategy** — First design phase (5 agents): business model, requirements, strategy, financial analysis.

**Phase 2 — Architecture & Design** — Second design phase (6 agents): system architecture, security, data model, compliance.

**Phase 3 — Experience Design** — Third design phase (6 agents): UX/UI design, content strategy, accessibility, i18n.

**Phase 4 — Brand & Growth** — Fourth design phase (3 agents + Brand & Assets + Storybook): brand identity, go-to-market, conversion design.

**Phase 5 — Implementation** — Sprint-based execution phase. Repeatable cycle per sprint. See [Sprints](sprints.md).

**Phase Boundary** — Break point after each design phase. Triggers a fresh Copilot Chat conversation to avoid memory overload.

**PLANNING_RISK** (Flag) — Sprint plan has unrealistic capacity or scheduling assumptions. Raised by Risk Agent.

**PR/Review Agent** (Agent 22) — Performs code review, secret scanning, and decision compliance checks on pull requests. Third decision enforcement checkpoint.

**Product Manager** (Agent 34) — Phase 1 agent owning product roadmap and feature prioritization.

**Project Brief** — Your requirements, pasted in the Command Center. Saved to `BusinessDocs/project-brief.md` and read by the Onboarding Agent.

## Q–R

**Quality Gate** — Two-stage validation (Critic + Risk) after each phase. Phase cannot proceed unless both pass. See [Quality Gates](quality-gates.md).

**Questionnaire Agent** (Agent 36) — Generates customer-facing questions from `INSUFFICIENT_DATA:` items. See [Questionnaires](questionnaires.md).

**Questionnaire Protocol** — Mandatory rule: agents check for injected questionnaire answers at start, compile remaining gaps at end, and never block handoff on missing answers.

**Recommendations** (Deliverable Type) — Second output type from phase agents. Prioritized actions with effort, impact, SMART criteria, and source references.

**Reevaluate Agent** (Agent 23) — Re-analyzes selected phases when new information is available. Performs delta scan and updates sprint backlog. See [Questionnaires — Reevaluation](questionnaires.md#the-reevaluation-workflow-in-detail).

**REEVALUATE** (Command) — Triggers re-analysis with new information. Scopes: ALL, PHASE-1 through PHASE-4, DELTA-ONLY.

**REFRESH ONBOARDING** (Command) — Rescans workspace and tooling without repeating intake questions. Updates onboarding-output.md while preserving answers.

**Retrospective Agent** (Agent 28) — Analyzes sprint performance, calculates velocity, detects patterns, updates lessons-learned.md and velocity-log.json.

**Risk Agent** (Agent 19) — Independent risk assessor checking strategic alignment, implementation feasibility, compliance, and cross-domain risks. Second part of quality gate. See [Quality Gates](quality-gates.md).

## S

**SCOPE CHANGE** (Command) — Handles fundamental project direction changes (business model pivot, architecture change, target audience change). Dimensions: BUSINESS, TECH, UX, MARKETING, ALL. See [Advanced Commands](advanced-commands.md#scope-change--change-project-direction).

**SCOPE_CHANGE_HOLD** (Story Status) — Sprint stories affected by a scope change are held pending reconciliation. Reversible. Completed work is tagged `COMPLETED_UNREVIEWED` instead.

**Scope Discipline** — Mandatory rule: each agent operates exclusively within its defined domain.

**SCOPE_VIOLATION** (Flag) — Recommendation outside the agent's domain. Raised by Critic Agent.

**Security Architect** (Agent 08) — Phase 2 agent performing threat modeling and security architecture.

**Senior Developer** (Agent 06) — Phase 2 agent assessing implementation feasibility and code standards.

**session-state.json** — Single source of truth for progress. Records agent completion, phase progress, sprint queue, decisions, and blockers. Enables CONTINUE command.

**SKIPPED_NO_TOKEN** (Brand Status) — Brand & Assets Agent ran without Canva API token. Guidelines and design tokens are still produced from text; only Canva-dependent assets are skipped.

**Software Architect** (Agent 05) — Phase 2 agent designing system architecture and selecting technology stack.

**Sprint** — Time-boxed implementation cycle in Phase 5. See [Sprints](sprints.md).

**Sprint Gate** — Decision checkpoint before every sprint. Checks open decisions, loads constraints, injects lessons learned, and lets you choose IMPLEMENT or BACKLOG. See [Sprints](sprints.md#the-sprint-gate).

**Sprint ID** — Unique identifier. Format: `SP-[N]` for regular sprints, `FT-[FEATURENAME]-S[N]-[NNN]` for feature sprints, `HOTFIX-[N]` for hotfixes.

**Sprint Plan** (Deliverable Type) — Third output type from phase agents. Contains capacity assumptions, stories with acceptance criteria, and Definition of Done.

**Story** — Single unit of work within a sprint. Types: CODE, INFRA, CONFIG, DESIGN, CONTENT, ANALYSIS, DOCS.

**Story Point** — Relative estimation unit for complexity. Definition of Ready requires CODE/INFRA ≤ 8 points.

**Storybook Agent** (Agent 31) — Sets up and maintains the component library. Produces component-inventory.md and design tokens (CSS/JS). Enforces Rule ORC-18. See [Synthesis](synthesis.md#storybook-agent).

**STRATEGIC_MISALIGNMENT** (Flag) — Phase output conflicts with business goals from Phase 1. Raised by Risk Agent.

**Synthesis Agent** (Agent 17) — Combines all phase outputs into 6 final reports. See [Synthesis](synthesis.md).

## T–U

**Test Agent** (Agent 21) — Validates code quality and decision compliance. Returns code to Implementation Agent if violations found. Second decision enforcement checkpoint.

**UNCERTAIN:** (Prefix) — Unverified claim. Used to distinguish uncertain assertions from verified findings. Cannot later be repeated as fact.

**UNVERIFIED_CLAIM** (Flag) — Assertion not traceable to input artifacts. Raised by Critic Agent.

**UI Designer** (Agent 12) — Phase 3 agent creating visual design and component patterns.

**UX Designer** (Agent 11) — Phase 3 agent producing information architecture and interaction design.

**UX Researcher** (Agent 10) — Phase 3 agent conducting user research and creating personas/journey maps.

## V–W

**Velocity** — Sprint performance metric: planned vs. actual story point completion rate. Below 80% for 2+ consecutive sprints triggers an Orchestrator warning.

**Verification Protocol** — Mandatory 9-point Handoff Checklist every agent must complete before yielding control.

---

## See Also

- [Commands Reference](commands.md) — all available commands
- [Agents](agents.md) — full agent list with descriptions
- [Pipeline](pipeline.md) — the phase execution sequence
- [Getting Started](getting-started.md) — how to begin
