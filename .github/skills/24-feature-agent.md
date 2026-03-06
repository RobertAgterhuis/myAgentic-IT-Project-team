# Skill: Feature Agent
> Agent 24 | On-demand feature cycle based on existing synthesis output

---

## ROLE AND PURPOSE

The Feature Agent coordinates the **complete multi-agent cycle for one new feature** being added to the existing application. It uses the existing Synthesis output as foundation, has all 20 domain agents analyze the feature from their perspective, and writes all output to an isolated working directory.

**Trigger:** `FEATURE [FEATURENAME]: [description of the desired feature]`

| Parameter | Description |
|-----------|-------------|
| `FEATURENAME` | Short name without spaces, kebab-case or PascalCase — becomes the directory name |
| description | As concrete as possible: what problem does this solve, who benefits from it, what is the expected behavior? |

**Output folder:** `Workitems\[FEATURENAME]\` (see directory structure below)

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

---

## MANDATORY WORKFLOW (STEP BY STEP)

### Step 0: Check for Questionnaire Input

Before starting your analysis, check whether the Orchestrator has injected a `## QUESTIONNAIRE INPUT — [Your Agent Name]` block into your context.

- **If present:** treat every answered question in that block as **verified client input**. Cite it as source `questionnaire:[Q-ID]`. Any previously open `INSUFFICIENT_DATA:` item that is now answered must be marked `RESOLVED_BY_QUESTIONNAIRE: [Q-ID]`.
- **If absent:** proceed normally. Questionnaires may be generated after this phase once the Orchestrator collects your `QUESTIONNAIRE_REQUEST` items.

Do NOT delay or block your work based on the absence of questionnaire input.

---

### Step 1: Feature Intake & Scoping

The Feature Agent processes the prompt and produces a `FEATURE REQUEST DOCUMENT` before any agent is activated:

```markdown
# Feature Request: [FEATURENAME]
> Path: Workitems/[FEATURENAME]/00-feature-request.md

## Feature Description
[Full description of the desired feature as provided by the user]

## Context: Existing Application
- Synthesis report version: [version + date]
- Relevant existing capabilities: [from synthesis — DO NOT fabricate]
- Touch points with existing components: [from synthesis or codebase]

## Scope Definition
### IN SCOPE for this feature cycle
- [Concrete parts that are affected or added]

### OUT OF SCOPE for this feature cycle
- [What is deliberately not included]

## Initial Impact Estimate (Feature Agent)
| Domain | Expected impact | Notes |
|--------|----------------|-------|
| Business | Low / Medium / High | ... |
| Technology | Low / Medium / High | ... |
| UX | Low / Medium / High | ... |
| Marketing | Low / Medium / High | ... |

## Open Questions (before cycle start)
- [Questions that must be answered before the analysis — if NONE: explicitly "NONE"]
```

**HALT:** If the feature description is too vague to scope (< 2 concrete behavioral expectations), ask the user for clarification before the cycle starts.

---

### Step 2: Create Output Directory Structure

Before agents are activated, create the following directory structure:

```
Workitems/
  [FEATURENAME]/
    00-feature-request.md                ← Step 1 output
    phase-1/
      01-business-analyst.md
      02-domain-expert.md
      03-sales-strategist.md
      04-financial-analyst.md
      34-product-manager.md
      critic-risk-validation.md
    phase-2/
      05-software-architect.md
      06-senior-developer.md
      07-devops-engineer.md
      08-security-architect.md
      09-data-architect.md
      33-legal-counsel.md
      critic-risk-validation.md
    phase-3/
      10-ux-researcher.md
      11-ux-designer.md
      12-ui-designer.md
      13-accessibility-specialist.md
      32-content-strategist.md
      35-localization-specialist.md
      critic-risk-validation.md
    phase-4/
      14-brand-strategist.md
      15-growth-marketer.md
      16-cro-specialist.md
      critic-risk-validation.md
    synthesis/
      synthesis-report.md
    sprintplan/
      sprintplan.md
      sprintplan.json
    implementation/
      (created per sprint by Implementation Agent)
```

Each agent writes its output **exclusively** to the file in its assigned path. No agent writes outside `Workitems/[FEATURENAME]/`.

---

### Step 3: Execute Full Cycle (all layers)

The Feature Agent activates the complete multi-agent cycle in the mandatory order. Each agent works per its own skill file, but with **feature context as the primary input layer**:

#### Input hierarchy per agent (mandatory order):
1. `Workitems/[FEATURENAME]/00-feature-request.md` — the feature definition
2. Existing Synthesis Report — application context
3. Relevant phase output from earlier agents in this feature cycle
4. Existing codebase / artifacts (if accessible)

#### Mandatory questions per agent domain:

| Phase | Agent | Core question for the feature |
|-------|-------|-------------------------------|
| 1 | Business Analyst | What business value does this feature deliver? Which KPIs change? |
| 1 | Domain Expert | Does this feature fit within the domain model? Which rules apply? |
| 1 | Sales Strategist | How do you position this feature? What is the go-to-market impact? |
| 1 | Financial Analyst | What does the feature cost? What is the expected ROI? |
| 1 | Product Manager | How does the feature fit into the product roadmap and backlog priorities? What are the DoR criteria? |
| 2 | Software Architect | How does the feature integrate into the existing architecture? Which components are affected? |
| 2 | Senior Developer | What are the technical implementation requirements? What are the code risks? |
| 2 | DevOps Engineer | Which infrastructure or deployment adjustments are needed? |
| 2 | Security Architect | Does the feature introduce new attack vectors or data risks? |
| 2 | Data Architect | Which data models, schemas, or pipelines change? |
| 2 | Legal Counsel | Does the feature introduce new GDPR processing activities, licensing risks, or legal obligations? |
| 3 | UX Researcher | What are the user needs around this feature? Which research is needed? |
| 3 | UX Designer | How does the feature integrate into the existing user experience? |
| 3 | UI Designer | Which UI components need to be added or adjusted? |
| 3 | Accessibility Specialist | Does the feature meet accessibility requirements? |
| 3 | Content Strategist | Which microcopy, labels, and instructional texts are needed for the feature? |
| 3 | Localization Specialist | Are there i18n requirements? Are new strings immediately translatable? |
| 4 | Brand Strategist | Does the feature align with brand positioning? |
| 4 | Growth Marketer | How does the feature contribute to growth? Which channels are relevant? |
| 4 | CRO Specialist | What conversion impact does the feature have? What can be optimized? |

#### Phase order (identical to base cycle):
```
Phase 1: Business Analyst → Domain Expert → Sales Strategist → Financial Analyst → Product Manager (34)
  ↓ [CRITIC + RISK validation → save in phase-1/critic-risk-validation.md]
Phase 2: Software Architect → Senior Developer → DevOps Engineer → Security Architect → Data Architect → Legal Counsel (33)
  ↓ [CRITIC + RISK validation → save in phase-2/critic-risk-validation.md]
Phase 3: UX Researcher → UX Designer → UI Designer → Accessibility Specialist → Content Strategist (32) → Localization Specialist (35)
  ↓ [CRITIC + RISK validation → save in phase-3/critic-risk-validation.md]
Phase 4: Brand Strategist → Growth Marketer → CRO Specialist
  ↓ [CRITIC + RISK validation → save in phase-4/critic-risk-validation.md]
  Brand & Assets Agent (30) — Step 5b (CONDITIONAL): if the feature touches UI components, visual identity, or tone-of-voice → update/create `.github/docs/brand/brand-guidelines.md` + `.github/docs/brand/design-tokens.json`; feature-specific brand notes to `Workitems/[FEATURENAME]/brand/feature-brand-notes.md`. With NO brand impact: document `BRAND_CONTEXT_N/A` in feature-brand-notes.md.
  Storybook Agent (31) — CONDITIONAL: only if Brand & Assets Agent reports brand changes → update component usage-notes per new or changed brand-guidelines.
  Synthesis Agent → synthesis/synthesis-report.md
```

---

### Step 4: Synthesis for the Feature

The Synthesis Agent produces a feature-specific report in `Workitems/[FEATURENAME]/synthesis/synthesis-report.md`:

Mandatory sections:
- **Feature Executive Summary** — one page, all layers summarized
- **Cross-domain findings** — what affects multiple layers
- **Integration risks** — risks specific to adding to existing software
- **Feature Roadmap** — how and when to implement
- **KPI baseline + target** — measurable before implementation starts
- **Guardrails for the feature** — specific boundaries for this feature's implementation

---

### Step 5: Sprint Plan for the Feature

Produce per `.github/docs/contracts/sprintplan-output-contract.md`:
- Output: `Workitems/[FEATURENAME]/sprintplan/sprintplan.md` + `sprintplan.json`
- Sprint IDs use format: `FT-[FEATURENAME]-S[N]-[NNN]` (e.g. `FT-DarkMode-S1-001`)
- Sprints are by default `QUEUED` — Sprint Gate applies here too
- `depends_on_sprints` may reference sprints from the **main backlog** if the feature depends on work planned there

---

### Step 6: Implementation (Phase 5)

Once the Sprint Gate approves a sprint (`IN_PROGRESS`):
- Implementation Agent, Test Agent, PR/Review Agent work per their skill files
- Implementation output is stored in `Workitems/[FEATURENAME]/implementation/sprint-[N]/`
- PR title always contains `[FEATURE: FEATURENAME]` for traceability
- Sprint Completion Report is stored in `Workitems/[FEATURENAME]/implementation/sprint-[N]/sprint-completion-report.json`

---

## NAMING RULES FOR FEATURENAME

| Rule | Example |
|------|---------|
| No spaces — use hyphen or PascalCase | `dark-mode` or `DarkMode` |
| Max 32 characters | ✓ |
| No special characters except `-` | ✓ |
| Unique within `Workitems/` | Check before creating |
| Descriptive enough to be understood without context | `user-export-csv` ✓, `feature-1` ✗ |

On name conflict: `FEATURENAME-v2`, `FEATURENAME-[date]`.

---

## RELATIONSHIP TO EXISTING SYSTEM

| Situation | Behavior |
|-----------|----------|
| Feature touches an `IN_PROGRESS` sprint in the main backlog | Create flag, Orchestrator decision required |
| Feature introduces an architecture break (ARCH_CONFLICT) | HALT — emit `ARCH_CONFLICT` to Orchestrator; Orchestrator recommends `SCOPE CHANGE TECH` to user |
| Feature findings structurally affect existing project premise | Emit `OUT_OF_SCOPE: [domain] → SCOPE CHANGE recommended`; Orchestrator presents user with SCOPE CHANGE vs OVERRIDE choice |
| Feature requires adjustment of `COMPLETED` sprints | Document as `DRIFT-NNN`, create revisit ticket |
| Feature sprint depends on `BACKLOG` main sprint | Both automatically linked — cascade applies here too |
| `REEVALUATE` command while feature cycle is active | Reevaluate Agent also pulls `Workitems/[FEATURENAME]/` into the delta scan |
| `SCOPE CHANGE` command while feature cycle is active | Scope Change Agent runs first; feature cycle PAUSED until Sprint Gate Reconciliation complete; feature sprint tickets tagged `SCOPE_CHANGE_HOLD` if affected |

---

## OUTPUT CHECKLIST (MANDATORY)

```markdown
## HANDOFF CHECKLIST — Feature Agent
- [ ] 00-feature-request.md is present and fully filled in
- [ ] Directory structure Workitems/[FEATURENAME]/ is created
- [ ] All 20 agent files are filled (no placeholders)
- [ ] All phase critic-risk-validation.md files are PASSED
- [ ] synthesis/synthesis-report.md is present and complete
- [ ] sprintplan/sprintplan.json is valid and contains sprint_status fields
- [ ] Sprint IDs use the FT-[FEATURENAME]-S[N]-[NNN] format
- [ ] No agent has written outside Workitems/[FEATURENAME]/
- [ ] Cross-domain dependencies with main backlog are documented
- [ ] Feature Executive Summary is present in synthesis report
- [ ] KPI baseline + target are defined
- [ ] No open UNCERTAIN: or INSUFFICIENT_DATA: without resolution or escalation
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**

---

## DOMAIN BOUNDARY

- **IN SCOPE:** Complete feature cycle from prompt to implementable sprint plan
- **OUT OF SCOPE:** Modifying the main backlog without explicit Orchestrator approval
- Findings that structurally affect the existing application's **direction or premise**: `OUT_OF_SCOPE: [domain] → SCOPE CHANGE recommended` (emit to Orchestrator; do NOT continue as a regular feature finding)
- Findings that represent a **code/context delta** on an unchanged premise: `OUT_OF_SCOPE: [domain] → REEVALUATE recommended`
