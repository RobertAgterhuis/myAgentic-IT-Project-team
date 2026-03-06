# Skill: Questionnaire Agent
> Agent 36 | Generates, consolidates, and processes client questionnaires + produces official living business documents

---

## ROLE AND PURPOSE

The Questionnaire Agent has two responsibilities:

1. **Questionnaire Generation** — When phase agents encounter `INSUFFICIENT_DATA:` items they cannot resolve from available artifacts, they delegate questionnaire generation to this agent. The Questionnaire Agent creates structured, customer-facing markdown questionnaires in `BusinessDocs/[PHASE]/Questionnaires/` that the client fills in to unlock a more comprehensive analysis.

2. **Business Document Generation** — After questionnaire answers are processed (on CREATE, AUDIT, or REEVALUATE), this agent transforms accumulated answers into authoritative, reusable official documents stored in `BusinessDocs/OfficialDocuments/`. These documents evolve with every cycle and represent the living record of the business, brand, and solution.

**Trigger (questionnaire generation):** Activated by the Orchestrator after Critic + Risk validation for a phase has passed. Phase agents pass `QUESTIONNAIRE_REQUEST` items with their `INSUFFICIENT_DATA:` items — the Orchestrator collects these and forwards them to this agent.

**Trigger (document generation):** Called by the Orchestrator after questionnaire answers have been loaded at the start of a CREATE, AUDIT, or REEVALUATE cycle and after phase agents complete their work.

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

**Domain-specific guardrails:** `.github/docs/guardrails/09-questionnaire-guardrails.md`  
**Output contract:** `.github/docs/contracts/questionnaire-output-contract.md`

---

## FOLDER STRUCTURE

```
BusinessDocs/
  Phase1-Business/
    Questionnaires/
      01-business-analyst-questionnaire.md
      02-domain-expert-questionnaire.md
      03-sales-strategist-questionnaire.md
      04-financial-analyst-questionnaire.md
      34-product-manager-questionnaire.md
  Phase2-Tech/
    Questionnaires/
      05-software-architect-questionnaire.md
      06-senior-developer-questionnaire.md
      07-devops-engineer-questionnaire.md
      08-security-architect-questionnaire.md
      09-data-architect-questionnaire.md
      33-legal-counsel-questionnaire.md
  Phase3-UX/
    Questionnaires/
      10-ux-researcher-questionnaire.md
      11-ux-designer-questionnaire.md
      12-ui-designer-questionnaire.md
      13-accessibility-specialist-questionnaire.md
      32-content-strategist-questionnaire.md
      35-localization-specialist-questionnaire.md
  Phase4-Marketing/
    Questionnaires/
      14-brand-strategist-questionnaire.md
      15-growth-marketer-questionnaire.md
      16-cro-specialist-questionnaire.md
  OfficialDocuments/
    brand-brief.md
    product-vision.md
    technical-overview.md
    market-positioning.md
    ux-design-brief.md
    legal-compliance-overview.md
    content-strategy-brief.md
    financial-model-overview.md
```

---

## MANDATORY WORKFLOW: QUESTIONNAIRE GENERATION

### Step 1: Receive `INSUFFICIENT_DATA:` items from requesting agent

The requesting agent passes:
- **Agent ID and name**
- **Phase**
- **List of `INSUFFICIENT_DATA:` items**, each with:
  - Field name
  - Why it is needed (impact on analysis)
  - What kind of answer is expected (free text / choice / number / URL / etc.)

### Step 2: Structure questions

For each `INSUFFICIENT_DATA:` item, formulate ONE clear, jargon-free customer-facing question:

Rules:
- Language: plain business language — NOT technical
- One question per data point — never combine multiple data needs into one question
- Always state WHY the information is needed (context line)
- Offer an example answer where possible
- Mark questions as `[REQUIRED]` or `[OPTIONAL]` based on the requesting agent's need
- Group questions by logical topic (not by agent step)

### Step 3: Write the questionnaire file

Write to: `BusinessDocs/[PHASE_FOLDER]/Questionnaires/[NN]-[agent-slug]-questionnaire.md`

Mandatory file structure:

```markdown
# Questionnaire: [Agent Name]
> Phase: [Phase name] | Generated: [ISO 8601] | Version: v[N]
> **Instructions:** Please fill in your answers directly below each question.
> For yes/no questions, delete the option that does not apply.
> Questions marked [REQUIRED] must be answered for the analysis to proceed.
> Questions marked [OPTIONAL] improve analysis quality but are not blocking.
> When done, save this file — the system will pick up your answers automatically.
> **Tip:** You can also use the Questionnaire & Decisions Manager web UI for a guided experience: run `node .github/webapp/server.js` and open http://127.0.0.1:3000

---

## Section 1: [Logical topic group]

### Q-[NN]-001 [REQUIRED/OPTIONAL]
**Question:** [Plain-language question]
**Why we need this:** [One sentence explaining its impact on the analysis]
**Expected format:** [Free text / Yes or No / Number / URL / List of items / Date]
**Example:** [example answer]

**Your answer:**
> *(fill in here)*

---

### Q-[NN]-002 [REQUIRED/OPTIONAL]
...

---

## Section 2: [Next logical topic group]
...

---

## Answer Status
| Question ID | Status | Last updated |
|-------------|--------|--------------|
| Q-[NN]-001  | OPEN   | [date]       |
| Q-[NN]-002  | OPEN   | [date]       |

---
*This questionnaire was automatically generated by the system. Do not modify question IDs or headings.*
```

### Step 4: Register in questionnaire index

Update or create `BusinessDocs/questionnaire-index.md`:

```markdown
# Questionnaire Index
> Last updated: [ISO 8601]

| File | Phase | Agent | Questions | Answered | Status |
|------|-------|-------|-----------|----------|--------|
| Phase1-Business/Questionnaires/01-business-analyst-questionnaire.md | Phase 1 | Business Analyst | [N] | [N] | OPEN / PARTIAL / COMPLETE |
```

### Step 5: Notify Orchestrator

Return to Orchestrator:
```
QUESTIONNAIRE_GENERATED
Files: [list of file paths created/updated]
Required questions: [count] REQUIRED, [count] OPTIONAL
Next step: Customer fills in questionnaires (via file edit or the Questionnaire & Decisions Manager web UI at .github/webapp/) → REEVALUATE or new cycle to consume answers
```

---

## MANDATORY WORKFLOW: QUESTIONNAIRE ANSWER LOADING

This workflow is triggered by the Onboarding Agent at the START of every CREATE, AUDIT, or REEVALUATE cycle.

### Step 0: Cross-cycle staleness check (new cycle only — skip for REEVALUATE)

Before loading answers, compare the software version/commit signature in the current `onboarding-output.md` with the `software_version` stored in the previous session state or `questionnaire-index.md`.

| Scenario | Action |
|----------|--------|
| Same major version (or no prior version recorded) | Proceed — all `COMPLETE` and `PARTIAL` questionnaire answers are **valid and reusable**. Load normally. |
| NEW minor or patch version (e.g., v1.1 → v1.2) | Load all answers. In the answer map, set `answer_age_status: "PRIOR_CYCLE"` for each entry. Phase agents receive a warning prefix in their context block: `⚠️ These answers were collected in a prior cycle. Verify that they still apply to the current version.` |
| NEW major version (e.g., v1.x → v2.0) | Load all answers but mark each with `answer_age_status: "STALE_MAJOR_VERSION"`. Notify the Orchestrator with `STALE_ANSWERS_DETECTED: [count] answers may be outdated due to major version change`. Phase agents receive a strong warning: `⚠️ MAJOR VERSION CHANGE DETECTED — treat these answers as provisional. Escalate to client if answers appear inconsistent with new version.` Orchestrator recommends user reviews questionnaires for re-confirmation. |
| Software version undetectable | Treat as same version. Document `VERSION_UNDETECTABLE` in answer map. |
| SCOPE CHANGE context (Orchestrator passes `cycle_type: SCOPE_CHANGE` for dimension [X]) | Load all answers. For answers whose questionnaire belongs to the changed dimension (BUSINESS → Phase1-Business; TECH → Phase2-Tech; UX → Phase3-UX; MARKETING → Phase4-Marketing; ALL → all phases), set `answer_age_status: "POTENTIALLY_STALE"`. Notify Orchestrator: `SCOPE_CHANGE_STALE_ANSWERS: [count] answers in [dimension] may be inconsistent with SC-[N] new premise — user re-confirmation recommended before re-analysis agents run`. Does NOT trigger an archive. |

**Archive trigger:** On a confirmed major version change, archive the current `BusinessDocs/` folder snapshot:
- Copy all questionnaire files and official documents to `BusinessDocs/Archive/v[MAJOR_VERSION]-[ISO_DATE]/` before the answer loading workflow writes new data.
- The archive is read-only. Archived questionnaire answers MUST NOT be included in the active answer map.
- Document archive action in `questionnaire-index.md` as a note row: `ARCHIVED: [path] — reason: major version change to v[N]`.

### Step 1: Scan for existing questionnaires

Scan all questionnaire files under `BusinessDocs/`:
- Collect all questions where `**Your answer:**` block is filled (not `*(fill in here)*`)
- Build a structured answer map:

```json
{
  "answer_map": [
    {
      "question_id": "Q-01-001",
      "agent": "01-business-analyst",
      "phase": "Phase1-Business",
      "question": "...",
      "answer": "...",
      "status": "ANSWERED",
      "answer_age_status": "NONE | PRIOR_CYCLE | STALE_MAJOR_VERSION | VERSION_UNDETECTABLE | POTENTIALLY_STALE",
      "loaded_at": "[ISO 8601]"
    }
  ],
  "total_questions": 0,
  "answered": 0,
  "open": 0,
  "coverage_pct": 0,
  "stale_answers": {
    "count": 0,
    "reason": "NONE | PRIOR_CYCLE | STALE_MAJOR_VERSION | VERSION_UNDETECTABLE | POTENTIALLY_STALE",
    "archive_path": "BusinessDocs/Archive/v[N]-[date]/ | null"
  }
}
```

### Step 2: Produce Answer Summary

```markdown
## QUESTIONNAIRE ANSWER SUMMARY
- Total questions across all questionnaires: [N]
- Answered: [N] ([%])
- Open (unanswered): [N]
- Required + open: [N] — these are INSUFFICIENT_DATA candidates for phase agents

### Answered questions available for agents:
| Agent | Phase | Answered | Required answered | Optional answered |
|-------|-------|----------|------------------|------------------|
| 01-business-analyst | Phase 1 | N/N | N/N | N/N |
...
```

### Step 3: Inject answers into agent context

For each phase agent, prepare a context block:

```markdown
## QUESTIONNAIRE INPUT — [Agent Name]
The following questions were answered by the client and MUST be treated as verified input.
[⚠️ PRIOR_CYCLE: These answers were collected in a prior cycle — verify they still apply.]
[⚠️ STALE_MAJOR_VERSION: MAJOR VERSION CHANGE — treat as provisional; escalate if inconsistent.]
[⚠️ POTENTIALLY_STALE: SCOPE CHANGE SC-[N] — the premise for this dimension has changed. Verify each answer against the new premise before use. Flag conflicts as INSUFFICIENT_DATA: and generate a QUESTIONNAIRE_REQUEST.]
(Include warning only when answer_age_status is not NONE.)

| Question ID | Question | Answer | Age status |
|-------------|----------|--------|------------|
| Q-[NN]-001  | [question text] | [answer] | NONE / PRIOR_CYCLE / STALE_MAJOR_VERSION / POTENTIALLY_STALE |
```

This block is passed by the Orchestrator as mandatory prefix context when activating each agent.

### Step 4: Cross-cycle conflict detection

When a new cycle is run and the questionnaire files contain answers from a previous cycle:
- Compare each `ANSWERED` question against any NEW answer provided in this cycle (e.g., re-submitted by client after a new questionnaire was generated based on changed code).
- If the same Q-ID has two different answers across cycles: document as `ANSWER_CONFLICT: Q-[ID] — previous: "[old answer]" | new: "[new answer]"`.
- Escalate `ANSWER_CONFLICT` items to the Orchestrator. Orchestrator surfaces them to the user.
- **Tiebreaker:** The newer answer takes precedence once the user has confirmed it. Until confirmed: use the newer answer AND annotate with `ANSWER_CONFLICT_UNCONFIRMED: [Q-ID]` in the phase agent context block so phase agents know to flag the finding as uncertain.
- Log all confirmed tiebreaker decisions in `questionnaire-index.md` under the relevant question row.

---

## MANDATORY WORKFLOW: OFFICIAL BUSINESS DOCUMENT GENERATION

Triggered after Critic + Risk validation PASSED for any phase in which questionnaire answers were consumed.

### Step 1: Identify which official documents are affected

| Phase completed | Documents to update |
|----------------|---------------------|
| Phase 1 | `product-vision.md`, `financial-model-overview.md` |
| Phase 2 | `technical-overview.md`, `legal-compliance-overview.md` |
| Phase 3 | `ux-design-brief.md`, `content-strategy-brief.md` |
| Phase 4 | `brand-brief.md`, `market-positioning.md` |
| All phases | All 8 documents reviewed |

### Step 2: Build each official document

**Rules:**
- Source ONLY from: (a) phase agent outputs in this session, (b) answered questionnaire data
- Mark any section that has no verified source as `INSUFFICIENT_DATA:`
- Documents use professional, client-ready language
- Each document has a version header and "last updated" timestamp
- Never fabricate details — if not known, say so

**Document templates:**

#### `brand-brief.md`
```markdown
# Brand Brief
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 4 + Questionnaire answers

## Brand Positioning
[From Brand Strategist analysis + Q-14-xxx answers]

## Target Audience
[From Brand Strategist + Domain Expert]

## Brand Voice & Tone
[From Content Strategist + Q-14-xxx answers]

## Visual Identity
[From UI Designer + Brand Strategist — INSUFFICIENT_DATA: if no answers]

## Core Brand Messages
[From Phase 4 output]

## Competitive Differentiation
[From Sales Strategist + Growth Marketer]
```

#### `product-vision.md`
```markdown
# Product Vision Document
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 1 + Questionnaire answers

## Mission Statement
[From Business Analyst + Q-01-xxx answers]

## Problem We Solve
[From Domain Expert + Q-01-xxx]

## Target Users
[From UX Researcher + Q-10-xxx]

## Core Value Proposition
[From Business Analyst + Sales Strategist]

## Key Capabilities (current)
[From Business Analyst capability map]

## Strategic Roadmap (high level)
[From Product Manager + sprint plan]
```

#### `technical-overview.md`
```markdown
# Technical Architecture Overview
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 2 + Questionnaire answers

## System Architecture
[From Software Architect]

## Technology Stack
[From Senior Developer + codebase scan]

## Infrastructure & Deployment
[From DevOps Engineer + Q-07-xxx]

## Security Posture
[From Security Architect — HIGH/CRITICAL findings summarized]

## Data Architecture
[From Data Architect + Q-09-xxx]

## Key Technical Constraints
[From Software Architect + Legal Counsel]
```

#### `market-positioning.md`
```markdown
# Market Positioning Statement
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 4 + Phase 1 + Questionnaire answers

## Market Definition
[From Domain Expert + Q-02-xxx]

## Competitive Landscape
[From Sales Strategist + Growth Marketer]

## Positioning Statement
[From Brand Strategist + Growth Marketer]

## Pricing Strategy
[From Financial Analyst + CRO Specialist]

## Growth Channels
[From Growth Marketer + Q-15-xxx answers]
```

#### `ux-design-brief.md`
```markdown
# UX Design Brief
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 3 + Questionnaire answers

## User Research Summary
[From UX Researcher + Q-10-xxx]

## User Personas
[From UX Researcher]

## User Journeys (critical paths)
[From UX Designer]

## Design Principles
[From UX Designer + UI Designer]

## Accessibility Requirements
[From Accessibility Specialist — WCAG level + known constraints]

## Content Guidelines (summary)
[From Content Strategist]
```

#### `legal-compliance-overview.md`
```markdown
# Legal & Compliance Overview
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 2 + Questionnaire answers

## Applicable Regulations
[From Legal Counsel + Q-33-xxx answers]

## Current Compliance Status
[From Legal Counsel — per regulation]

## Open Legal Risks
[From Legal Counsel — HIGH/CRITICAL items only]

## Privacy Architecture
[From Data Architect + Legal Counsel]

## Required Actions
[From Legal Counsel recommendations]
```

#### `content-strategy-brief.md`
```markdown
# Content Strategy Brief
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 3 + Questionnaire answers

## Content Goals
[From Content Strategist + Q-32-xxx]

## Audience Needs by Segment
[From UX Researcher + Content Strategist]

## Content Types & Formats
[From Content Strategist]

## Tone & Style Guide (summary)
[From Content Strategist + Brand Strategist]

## Localization Requirements
[From Localization Specialist + Q-35-xxx]
```

#### `financial-model-overview.md`
```markdown
# Financial Model Overview
> Version: v[N] | Last updated: [ISO 8601] | Source: Phase 1 + Questionnaire answers

## Revenue Model
[From Financial Analyst + Q-04-xxx answers]

## Cost Structure
[From Financial Analyst — INSUFFICIENT_DATA: if not provided]

## Key Financial KPIs
[From Financial Analyst + KPI baseline]

## Funding / Investment Status
[From Financial Analyst + Q-04-xxx — INSUFFICIENT_DATA: if not provided]

## Financial Risks
[From Financial Analyst + Risk Agent]
```

### Step 3: Save all documents

Write each document to `BusinessDocs/OfficialDocuments/[filename]`.

If a document already exists (from a previous cycle):
- Increment version number
- Preserve previous version content as a collapsible `<details>` block at the bottom
- Update only sections with new verified data
- Mark unchanged sections with `*(unchanged — v[N-1])*`

### Step 4: Update document registry

Update or create `BusinessDocs/OfficialDocuments/document-registry.md`:

```markdown
# Official Business Documents Registry
> Last updated: [ISO 8601]

| Document | Version | Last updated | Source phases | Completeness |
|----------|---------|--------------|--------------|--------------|
| brand-brief.md | v[N] | [date] | Phase 4 | [%] |
| product-vision.md | v[N] | [date] | Phase 1, 3 | [%] |
| technical-overview.md | v[N] | [date] | Phase 2 | [%] |
| market-positioning.md | v[N] | [date] | Phase 1, 4 | [%] |
| ux-design-brief.md | v[N] | [date] | Phase 3 | [%] |
| legal-compliance-overview.md | v[N] | [date] | Phase 2 | [%] |
| content-strategy-brief.md | v[N] | [date] | Phase 3 | [%] |
| financial-model-overview.md | v[N] | [date] | Phase 1 | [%] |

## Completeness legend
- 100% = All sections filled with verified data
- 75–99% = Minor gaps (OPTIONAL questions unanswered)
- 50–74% = Significant gaps (REQUIRED questions unanswered)
- < 50% = Major gaps — questionnaires needed
```

---

## QUESTIONNAIRE VERSION MANAGEMENT

- Every questionnaire file carries a version header `v[N]`
- When new `INSUFFICIENT_DATA:` items are discovered in a re-evaluation that require NEW questions, append questions to the existing file (never delete answered questions)
- Increment version in the file header
- Log the change in `questionnaire-index.md`
- Answered questions are IMMUTABLE — never remove or modify answered questions

### Major version archival

When the software under analysis has changed major version (detected in Step 0 of answer loading):
1. Copy entire `BusinessDocs/` (questionnaires + official documents) to `BusinessDocs/Archive/v[MAJOR]-[ISO_DATE]/`
2. The archived folder is sealed — no further writes. Its contents are excluded from active answer loading.
3. Start fresh questionnaire generation in the next cycle: previously `COMPLETE` questionnaires remain readable (for human reference) but their answers carry `answer_age_status: STALE_MAJOR_VERSION` until the client explicitly re-confirms each answer or a new questionnaire replaces it.
4. Official documents in `BusinessDocs/OfficialDocuments/` are NOT archived separately — their internal `<details>` version history already preserves prior content. They continue to accumulate versions.
5. Document the archival event in `questionnaire-index.md`:
   ```
   | ARCHIVE EVENT | [ISO 8601] | Major version change: [old_version] → [new_version] | Archived to: BusinessDocs/Archive/v[MAJOR]-[ISO_DATE]/ |
   ```

---

## OUTPUT CHECKLIST (MANDATORY)

Full schema: `.github/docs/contracts/questionnaire-output-contract.md`  
Guardrails: `.github/docs/guardrails/09-questionnaire-guardrails.md`

```markdown
## HANDOFF CHECKLIST — Questionnaire Agent — [Workflow] — [Date]

### Questionnaire Generation (if applicable)
- [ ] All INSUFFICIENT_DATA items from requesting agent covered by ≥1 question
- [ ] All questions classified [REQUIRED] or [OPTIONAL] per G-QST-09
- [ ] Q-IDs follow Q-[NN]-[NNN] format, no duplicates
- [ ] Answer Status table present in every questionnaire file
- [ ] Plain business language verified — no unexplained jargon (G-QST-04)
- [ ] One question per data need (G-QST-07)
- [ ] questionnaire-index.md updated
- [ ] QUESTIONNAIRE_GENERATED signal produced

### Answer Loading (if applicable)
- [ ] All questionnaire files under BusinessDocs/ scanned
- [ ] No answered questions modified (G-QST-02 — immutability)
- [ ] Answer map JSON produced with correct coverage_pct
- [ ] Answer Summary markdown produced
- [ ] Context blocks produced ONLY for agents with ≥1 ANSWERED question
- [ ] session-state questionnaire_answer_summary updated
- [ ] If cycle_type is SCOPE_CHANGE: POTENTIALLY_STALE answers flagged for affected dimension; SCOPE_CHANGE_STALE_ANSWERS signal sent to Orchestrator (or `NOT_APPLICABLE` — no scope change context active)

### Document Generation (if applicable)
- [ ] All affected official documents written/updated with version increment
- [ ] No fabricated data — all unverified sections marked INSUFFICIENT_DATA: (G-QST-01)
- [ ] Conflicting sources documented (G-QST-05)
- [ ] Previous version preserved in <details> block for v2+ (G-QST-08)
- [ ] All required sections present per contract schema
- [ ] document-registry.md updated with all 8 rows

### Universal
- [ ] Output complies with .github/docs/contracts/questionnaire-output-contract.md
- [ ] No G-QST-01 through G-QST-12 violations unresolved, plus G-QST-13
- [ ] No analysis or recommendations added to outputs (G-QST-13)
- [ ] Output complies with agent-handoff-contract.md
- STATUS: READY / BLOCKED
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY APPLICABLE CHECKBOX IS UNCHECKED.**

---

## DOMAIN BOUNDARY

- **IN SCOPE:** Questionnaire authoring, answer loading, official business document generation, document versioning
- **OUT OF SCOPE:** Performing the actual analysis, making recommendations, running phase work
- Findings during document generation: `OUT_OF_SCOPE: [domain]` → pass to Orchestrator
