````markdown
# Contract: Questionnaire Agent Output
> Version 1.0 | Agent 36 – Questionnaire Agent

---

## PURPOSE

This contract defines the mandatory output schemas for the three workflows of the Questionnaire Agent:

1. **Questionnaire Generation** — files written to `BusinessDocs/[PHASE]/Questionnaires/`
2. **Answer Loading** — answer map, summary, and agent context blocks passed to Orchestrator
3. **Official Document Generation** — 8 living documents in `BusinessDocs/OfficialDocuments/`

The Orchestrator validates against this contract via RULE ORC-25 and RULE ORC-26 (defined in `.github/skills/00-orchestrator.md`).  
The Questionnaire Agent validates its own output against this contract before every handoff.

### Cross-reference: ORC-25 (Questionnaire and official document lifecycle)
After every phase Critic + Risk PASSED, the Orchestrator: (1) collects `QUESTIONNAIRE_REQUEST` items from phase agent handoffs, (2) activates the Questionnaire Agent generation workflow, (3) activates the Questionnaire Agent document generation workflow for official documents. Open questionnaires NEVER block the cycle. On REEVALUATE, answer loading runs before phase agents. This activation MUST NOT be skipped (G-GLOB-56).

### Cross-reference: ORC-26 (Official document completeness gate)
Before activating the Synthesis Agent, the Orchestrator verifies `document-registry.md` exists with all 8 rows, all 8 official documents exist, and completeness is checked. Missing documents trigger a scaffold request; completeness < 50% warns but does not block.

---

## ANSWER SOURCES

Questionnaire answers may arrive through any of the following channels. All channels write to the same `BusinessDocs/` markdown files — the markdown file is the **single source of truth**.

| Channel | Description | File modified directly? |
|---------|-------------|-------------------------|
| Direct file edit | User edits the `*-questionnaire.md` file in their editor | Yes |
| Questionnaire Manager web UI | User fills in answers via `http://127.0.0.1:3000` (source: `.github/webapp/`) | Yes — the server writes to the same `*-questionnaire.md` files |
| Future integrations | Any tool or API that writes answers to the standardized markdown format | Yes |

The Questionnaire Agent's Answer Loading workflow does NOT distinguish between channels. It reads the markdown files and builds the answer map identically regardless of how the answers were entered.

### Answer injection timing

Answers may arrive at any time (including between phases). The system consumes them at these defined points:

| Trigger | Injection pathway | Who activates |
|---------|-------------------|---------------|
| Phase boundary (normal cycle) | Orchestrator loads answers at "On phase start" step 3 — injects answered questions as `## QUESTIONNAIRE INPUT` context blocks into the next phase's agents | Orchestrator (automatic) |
| `REEVALUATE [scope]` command | Questionnaire Agent re-runs the Answer Loading workflow, then affected phase agents re-execute with updated context | Orchestrator via ORC-25 step 5 |
| Web UI reevaluate trigger | `reevaluate-trigger.json` with `status: "PENDING"` is treated as equivalent to `REEVALUATE [scope]` per ORC-28 | Orchestrator (automatic at session start / Sprint Gate) |
| New cycle start | All existing answered questionnaires are loaded — answers carry forward unless the Questionnaire Agent flags them with `answer_age_status: PRIOR_CYCLE` or `POTENTIALLY_STALE` | Questionnaire Agent |

**Key rule:** Answers that arrive between phases are NOT silently lost — they are automatically picked up at the next phase boundary. No REEVALUATE is required for inter-phase answers to take effect.

### Reevaluate trigger file

The web UI writes a trigger file at `.github/docs/session/reevaluate-trigger.json` when the user clicks "Reevaluate":

```json
{
  "requested_at": "ISO 8601",
  "scope": "ALL | BUSINESS | TECH | UX | MARKETING",
  "source": "questionnaire-webapp",
  "status": "PENDING | CONSUMED"
}
```

The Orchestrator checks for this file per RULE ORC-28 and treats `status: "PENDING"` as equivalent to a `REEVALUATE [scope]` command. After consumption, the Orchestrator sets `status` to `"CONSUMED"` and adds `consumed_at`.

---

## WORKFLOW 1: QUESTIONNAIRE FILE SCHEMA

### Mandatory file structure

Every questionnaire file at `BusinessDocs/[PHASE]/Questionnaires/[NN]-[agent-slug]-questionnaire.md` MUST contain:

```markdown
# Questionnaire: [Agent Name]
> Phase: [Phase name] | Generated: [ISO 8601] | Version: v[N]
> **Instructions:** Please fill in your answers directly below each question.
> For yes/no questions, delete the option that does not apply.
> Questions marked [REQUIRED] must be answered for the analysis to proceed.
> Questions marked [OPTIONAL] improve analysis quality but are not blocking.
> When done, save this file — the system will pick up your answers automatically.
> **Tip:** You can also use the Questionnaire Manager web UI for a guided experience: run `node .github/webapp/server.js` and open http://127.0.0.1:3000

---

## Section 1: [Logical topic group]

### Q-[NN]-001 [REQUIRED/OPTIONAL]
**Question:** [Plain-language question — no jargon]
**Why we need this:** [One sentence explaining its impact on the analysis]
**Expected format:** [Free text / Yes or No / Number / URL / List of items / Date]
**Example:** [example answer]

**Your answer:**
> *(fill in here)*

---

## Answer Status
| Question ID | Status | Last updated |
|-------------|--------|--------------|
| Q-[NN]-001  | OPEN   | [date]       |
```

### Question ID format

`Q-[NN]-[NNN]` where:
- `[NN]` = agent number (matches requesting agent, 2 digits, zero-padded)
- `[NNN]` = sequential question number within this questionnaire file (001, 002, …)
- IDs are **immutable** once assigned — they NEVER change across versions

### Classification rules

Every question MUST be classified as exactly one of:
- `[REQUIRED]` — missing answer means analysis has a confirmed gap; Orchestrator tracks as open
- `[OPTIONAL]` — missing answer reduces quality but does not block

### Answer Status table

MUST be present at the end of every questionnaire file.  
Valid status values: `OPEN`, `ANSWERED`, `DEFERRED`.  
`DEFERRED` is set only by the Orchestrator, never by the Questionnaire Agent.

### VALIDATION CRITERIA (Orchestrator uses these)

A questionnaire file is INVALID if:
- Q-IDs are absent or do not follow the `Q-[NN]-[NNN]` format
- Any question is missing `[REQUIRED]` or `[OPTIONAL]` classification
- Answer Status table is absent
- Plain-language requirement violated (technical jargon without explanation present)
- `**Your answer:**` block is missing from any question

---

## WORKFLOW 1: QUESTIONNAIRE INDEX SCHEMA

`BusinessDocs/questionnaire-index.md` MUST contain:

```markdown
# Questionnaire Index
> Last updated: [ISO 8601]

| File | Phase | Agent | Questions | Answered | Status |
|------|-------|-------|-----------|----------|--------|
| Phase1-Business/Questionnaires/01-business-analyst-questionnaire.md | Phase 1 | Business Analyst | [N] | [N] | OPEN / PARTIAL / COMPLETE |
```

Valid `Status` values:
- `OPEN` — 0 questions answered
- `PARTIAL` — at least 1 but not all questions answered
- `COMPLETE` — all questions answered

### VALIDATION CRITERIA

Index is INVALID if:
- File is missing when at least one questionnaire exists
- Status values are not from the allowed set
- Answered count exceeds total question count

---

## WORKFLOW 1: QUESTIONNAIRE_GENERATED HANDOFF SIGNAL

After generation the Questionnaire Agent returns to the Orchestrator:

```
QUESTIONNAIRE_GENERATED
Files: [list of file paths created or updated]
Required questions (new): [count]
Optional questions (new): [count]
Index updated: [YES / NO]
Next step: Customer fills in questionnaires → REEVALUATE or new cycle to consume answers
```

---

## WORKFLOW 2: ANSWER LOADING OUTPUTS

### Answer map (JSON, passed to Orchestrator)

```json
{
  "answer_map": [
    {
      "question_id": "Q-01-001",
      "agent": "01-business-analyst",
      "phase": "Phase1-Business",
      "question": "string",
      "answer": "string",
      "status": "ANSWERED",
      "answer_age_status": "NONE | PRIOR_CYCLE | STALE_MAJOR_VERSION | VERSION_UNDETECTABLE | POTENTIALLY_STALE",
      "conflict": "NONE | ANSWER_CONFLICT_UNCONFIRMED",
      "loaded_at": "ISO 8601"
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

All fields are REQUIRED. `coverage_pct` = `(answered / total_questions) × 100`, rounded to one decimal.

### Answer summary (Markdown, included in session state)

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
```

### Agent context block (per relevant phase agent)

```markdown
## QUESTIONNAIRE INPUT — [Agent Name]
The following questions were answered by the client and MUST be treated as verified input.
Cite as source: questionnaire:[Q-ID]

| Question ID | Question | Answer |
|-------------|----------|--------|
| Q-[NN]-001  | [question text] | [answer] |
```

Context blocks are ONLY generated for agents that have at least one ANSWERED question in their questionnaire. Agents without answered questions receive NO context block — they document `NOT_INJECTED` in their Step 0.

### Session state update

The Questionnaire Agent MUST update `questionnaire_answer_summary` in the session state after answer loading (see `.github/docs/contracts/session-state-contract.md`).

### VALIDATION CRITERIA

Answer loading output is INVALID if:
- `coverage_pct` is missing or mathematically incorrect
- `answer_age_status` field absent from any answer map entry
- `stale_answers` object absent from the answer map root
- `ANSWER_CONFLICT` detected but `conflict` field not set to `ANSWER_CONFLICT_UNCONFIRMED`
- Answer map contains entries with `status` ≠ `ANSWERED` for filled-in questions
- Context block is generated for an agent with 0 answered questions
- Context block omits staleness warning when `answer_age_status` ≠ `NONE`
- Session state `questionnaire_answer_summary` not updated

---

## WORKFLOW 3: OFFICIAL BUSINESS DOCUMENT SCHEMA

### Common header (REQUIRED on every official document)

```markdown
# [Document Title]
> Version: v[N] | Last updated: [ISO 8601] | Status: [DRAFT / REVIEWED / APPROVED]
> Source phases: [Phase N, Phase M, ...]
> Completeness: [%] — sections with INSUFFICIENT_DATA not included in percentage
```

### Mandatory section presence per document

| Document | Required sections |
|----------|------------------|
| `brand-brief.md` | Brand Positioning, Target Audience, Brand Voice & Tone, Visual Identity, Core Brand Messages, Competitive Differentiation |
| `product-vision.md` | Product Purpose, Target Users, Core Problem Being Solved, Key Features, Success Metrics, Roadmap Direction |
| `technical-overview.md` | Tech Stack, Architecture Pattern, Key Integrations, Infrastructure, Security Posture, Known Debt |
| `market-positioning.md` | Market Segment, Ideal Customer Profile, Competitive Landscape, Value Proposition, Go-to-Market |
| `ux-design-brief.md` | UX Principles, User Flows, Design System Status, Accessibility Baseline, Known UX Debt |
| `legal-compliance-overview.md` | Applicable Regulations, Data Processing Summary, Key Risks, Open Compliance Items |
| `content-strategy-brief.md` | Voice & Tone, Content Types, Localization Scope, Channel Strategy, Content Gaps |
| `financial-model-overview.md` | Revenue Model, Pricing Structure, Cost Structure, KPI Baseline, Financial Risks |

### Section content rules

- Every section MUST contain at minimum one of: (a) verified content from phase agent output, (b) verified content from answered questionnaire data, (c) `INSUFFICIENT_DATA: [reason]`
- `INSUFFICIENT_DATA:` is NOT a rejection criterion — it is the correct signal when data is not yet available
- No section may be blank or contain placeholder text other than `INSUFFICIENT_DATA:`

### Version management

- Version MUST increment on every update (v1 → v2 → …)
- Previous version content MUST be preserved as a collapsible `<details>` block at the bottom of the file
- Sections with no new data since the last version are marked `*(unchanged — v[N-1])*`

### VALIDATION CRITERIA (Orchestrator uses these for ORC-26)

An official document is REJECTED if:
- Version header is absent
- Any required section is completely absent (not even `INSUFFICIENT_DATA:`)
- A section contains fabricated data (no source citation and not marked `INSUFFICIENT_DATA:`)
- Previous version block absent on v2+
- Completeness percentage is missing or mathematically inconsistent with `INSUFFICIENT_DATA:` count

---

## WORKFLOW 3: DOCUMENT REGISTRY SCHEMA

`BusinessDocs/OfficialDocuments/document-registry.md` MUST contain:

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

All 8 rows MUST be present. Missing rows = `MISSING_DOCUMENT` flag to Orchestrator.

### VALIDATION CRITERIA

Registry is INVALID if:
- Fewer than 8 rows present
- Completeness % contradicts the document's actual `INSUFFICIENT_DATA:` count
- `Last updated` timestamps are absent

---

## HANDOFF CHECKLIST (Questionnaire Agent self-validation)

```markdown
## HANDOFF CHECKLIST — Questionnaire Agent — [Workflow] — [Date]

### Workflow: Questionnaire Generation
- [ ] All INSUFFICIENT_DATA items from requesting agent are covered by ≥1 question
- [ ] All questions classified [REQUIRED] or [OPTIONAL]
- [ ] Q-IDs follow Q-[NN]-[NNN] format, no duplicates
- [ ] Answer Status table present in every questionnaire file
- [ ] Plain business language verified — no unexplained jargon
- [ ] questionnaire-index.md updated
- [ ] QUESTIONNAIRE_GENERATED signal produced

### Workflow: Answer Loading
- [ ] All questionnaire files under BusinessDocs/ scanned
- [ ] Answer map JSON valid and coverage_pct correct
- [ ] Answer Summary markdown produced
- [ ] Agent context blocks produced ONLY for agents with ≥1 ANSWERED question
- [ ] session-state questionnaire_answer_summary updated

### Workflow: Document Generation
- [ ] All affected official documents written/updated with version increment
- [ ] No fabricated data — all unverified sections marked INSUFFICIENT_DATA:
- [ ] Previous version preserved in <details> block (v2+)
- [ ] Required sections present in every document
- [ ] document-registry.md updated with all 8 rows
- [ ] Completeness % consistent with INSUFFICIENT_DATA: count

### Universal
- [ ] No data fabricated — sources cited or INSUFFICIENT_DATA: used
- [ ] Output complies with .github/docs/guardrails/09-questionnaire-guardrails.md
- STATUS: READY / BLOCKED
```

**THE QUESTIONNAIRE AGENT MAY NOT HAND OFF IF ANY APPLICABLE CHECKBOX IS UNCHECKED.**

````
