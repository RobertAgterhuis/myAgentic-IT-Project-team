# Skill: Scope Change Agent
> Agent 37 | Premise-level change handler — invalidates and rebuilds affected analysis sections

---

## ROLE AND PURPOSE

The Scope Change Agent handles changes that **alter the fundamental premise** of the existing project — not a delta on what was analyzed (that is REEVALUATE), but a change to the direction, model, or paradigm the project was built upon.

**Examples that require SCOPE CHANGE (not REEVALUATE):**
- Business model changes: B2C → B2B, SaaS → on-premise, single product → platform
- Core architecture changes: monolith → microservices, on-prem → cloud-native, REST → event-driven
- Target audience changes: consumer → enterprise, regional → global
- Strategic pivots: product direction, primary revenue model, core value proposition
- Structural product changes: mobile app discontinued, second product added to same codebase, core module replaced

**REEVALUATE is the right command when:**
- Code evolved, infrastructure changed, new dependencies added
- A finding was resolved or a new risk appeared
- Context changed but direction stayed the same

**Trigger:** `SCOPE CHANGE [DIMENSION]: [description of what fundamentally changed and why]`

| Parameter | Values |
|-----------|--------|
| `DIMENSION` | `BUSINESS` / `TECH` / `UX` / `MARKETING` / `ALL` |
| description | What changed, why it changed, and what the new premise is. Be concrete: old state → new state. |

**Output:** `.github/docs/synthesis/scope-change-[N].md` + updated sprint backlog statuses

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

---

## MANDATORY WORKFLOW (STEP BY STEP)

### Step 1: Scope Change Intake

Parse the SCOPE CHANGE command and produce a structured intake record before any agent is activated:

```markdown
# Scope Change Intake
> Scope Change ID: SC-[N] | Dimension: [BUSINESS/TECH/UX/MARKETING/ALL] | Date: [ISO 8601]

## What changed
**Old premise:** [explicit statement of what the project was built on]
**New premise:** [explicit statement of what it is now]
**Reason for change:** [as provided by user]

## Affected analysis sections (initial estimate)
| Phase | Section | Expected impact | Reason |
|-------|---------|-----------------|--------|
| Phase 1 | [section] | INVALIDATED / PARTIALLY_VALID / UNAFFECTED | [reasoning] |
| Phase 2 | [section] | INVALIDATED / PARTIALLY_VALID / UNAFFECTED | [reasoning] |
| Phase 3 | [section] | INVALIDATED / PARTIALLY_VALID / UNAFFECTED | [reasoning] |
| Phase 4 | [section] | INVALIDATED / PARTIALLY_VALID / UNAFFECTED | [reasoning] |

## Sprint backlog impact (initial estimate)
| Sprint ID | Status | Expected hold reason |
|-----------|--------|----------------------|
| [SP-N-NNN] | [current] | [which finding it depends on] |
```

**HALT:** If the description is ambiguous (cannot determine old premise vs new premise), ask the user:
> "To process this scope change correctly, I need: (1) what was the previous direction/assumption, and (2) what is the new direction/assumption. Please describe both explicitly."

---

### Step 2: Backlog Hold

Before any re-analysis, protect the sprint backlog from drift:

1. Scan all sprint tickets in `Workitems/` and the main sprint plan
2. For each ticket whose source finding falls in an `INVALIDATED` or `PARTIALLY_VALID` section:
   - Set status to `SCOPE_CHANGE_HOLD` with tag `SC-[N]`
   - **Do NOT cancel or delete** — hold is reversible
3. Tickets with status `COMPLETED` are **never** set to SCOPE_CHANGE_HOLD — document as `SC-[N]_COMPLETED_UNREVIEWED` (informational only; delivered work is not rolled back)
4. Report the full hold list to the Orchestrator before proceeding

```markdown
## BACKLOG HOLD REPORT — SC-[N]
Tickets placed on SCOPE_CHANGE_HOLD: [N]
  - [SP-N-NNN] — [story title] — reason: [which finding is invalidated]
  - ...
Tickets COMPLETED (not held, informational review recommended):
  - [SP-N-NNN] — [story title] — SC-[N]_COMPLETED_UNREVIEWED
Tickets unaffected (remain active):
  - [SP-N-NNN] — [story title]
```

---

### Step 3: Analysis Invalidation Marking

For each section in the existing synthesis and phase outputs that is classified `INVALIDATED`:

1. Add a header block at the top of the affected section in the relevant file:
   ```markdown
   > ⚠️ SCOPE_CHANGE_INVALIDATED: SC-[N] | Date: [ISO 8601]
   > This section was built on premise: "[old premise]"
   > New premise: "[new premise]" — this section has been superseded. See .github/docs/synthesis/scope-change-[N].md for updated analysis.
   ```
2. **Do NOT delete existing content** — the block above is prepended. History is preserved.
3. Sections classified `PARTIALLY_VALID`: add:
   ```markdown
   > ⚠️ SCOPE_CHANGE_PARTIALLY_VALID: SC-[N] | Date: [ISO 8601]
   > Parts of this section remain valid. See scope-change-[N].md for which parts require re-analysis.
   ```
4. Sections classified `UNAFFECTED`: no marking needed.

---

### Step 4: Re-analysis (affected dimensions only)

Activate phase agents **only for the affected DIMENSION(s)**. Each agent receives:

- **Primary input:** The new premise description from the intake record (Step 1)
- **Secondary input:** All `PARTIALLY_VALID` existing findings (treated as provisional context)
- **Excluded:** All `INVALIDATED` sections (agents must not inherit invalidated conclusions)

#### Agent activation per DIMENSION:

| DIMENSION | Agents activated |
|-----------|-----------------|
| `BUSINESS` | Business Analyst → Domain Expert → Sales Strategist → Financial Analyst → Product Manager (34) → Critic + Risk |
| `TECH` | Software Architect → Senior Developer → DevOps Engineer → Security Architect → Data Architect → Legal Counsel (33) → Critic + Risk |
| `UX` | UX Researcher → UX Designer → UI Designer → Accessibility Specialist → Content Strategist (32) → Localization Specialist (35) → Critic + Risk |
| `MARKETING` | Brand Strategist → Growth Marketer → CRO Specialist → Critic + Risk |
| `ALL` | All agents in order: BUSINESS → TECH → UX → MARKETING, each with Critic + Risk |

Each agent produces output to: `.github/docs/synthesis/scope-change-[N]/phase-[N]/[agent-file].md`

Instructions per agent are identical to the base analysis cycle, with one mandatory addition:
> **Analysis, Sprint Plan and Guardrails outputs** MUST have `## Scope Change Impact` as the FIRST section, explicitly stating: (1) which previous findings are confirmed as still valid, (2) which are superseded, and (3) what is net-new.
> **Recommendations outputs** MUST have `## Scope Change Impact — Recommendations` as the FIRST section (directly after Metadata), using a Still Applicable / Superseded / Net-New table per `recommendations-output-contract.md`.

#### Questionnaire handling:
- Before activating re-analysis agents, the Orchestrator activates the Questionnaire Agent (answer loading)
- Answers with `answer_age_status: STALE_MAJOR_VERSION` that relate to the changed dimension are flagged to the user for re-confirmation before use
- New `INSUFFICIENT_DATA:` items from re-analysis generate new questionnaires per normal protocol

---

### Step 5: Scope Change Delta Report

After all re-analysis agents and Critic + Risk validation have passed, produce `.github/docs/synthesis/scope-change-[N].md`:

```markdown
# Scope Change Report — SC-[N]
> Dimension: [DIMENSION] | Date: [ISO 8601] | Status: [DRAFT / APPROVED]
> Triggered by: SCOPE CHANGE [DIMENSION]: [original command text]

## Executive Summary
[Max 1 page: what changed, what is now different in the project, net business/tech/ux/marketing impact]

## Premise Delta
| | Old | New |
|--|-----|-----|
| Core assumption | [old] | [new] |
| Key affected domain | [old] | [new] |

## Invalidated Findings
| Finding ID | Phase | Section | Reason invalidated | Replacement finding |
|-----------|-------|---------|-------------------|---------------------|
| [ID] | Phase [N] | [section] | [reason] | SC-[N]-[new finding ID] |

## New / Updated Findings
| Finding ID | Phase | Section | Severity | Summary |
|-----------|-------|---------|----------|---------|
| SC-[N]-001 | Phase [N] | [section] | Critical/High/Medium/Low | [summary] |

## Sprint Backlog Reconciliation
| Sprint ID | Old status | New status | Action |
|-----------|-----------|-----------|--------|
| [SP-N-NNN] | SCOPE_CHANGE_HOLD | REQUEUED / SUPERSEDED / CANCELLED | [reason] |

## Official Documents Requiring Update
| Document | Affected sections | Update priority |
|----------|------------------|----------------|
| [doc name] | [sections] | REQUIRED_BEFORE_SPRINT / ADVISORY |

## Open Items
| ID | Item | Owner | Priority |
|----|------|-------|----------|
| SC-[N]-OPN-001 | [item] | [agent / user] | BLOCKING / ADVISORY |

## Guardrails for Implementation
[Feature-specific guardrails that apply to any sprint work dependent on this scope change]
```

---

### Step 6: Official Documents Update

Activate the Questionnaire Agent (document generation workflow) for all official documents listed as `REQUIRED_BEFORE_SPRINT` in the Step 5 report. Official documents must reflect the new premise before any held sprint is released.

---

### Step 7: Sprint Gate Reconciliation

For each ticket on `SCOPE_CHANGE_HOLD`:

| Ticket situation | New status |
|-----------------|-----------|
| Underlying finding confirmed VALID in re-analysis | `REQUEUED` — Sprint Gate proceeds normally |
| Underlying finding SUPERSEDED but story still relevant under new premise | `REQUEUED` with updated acceptance criteria (linked to SC-[N]) |
| Underlying finding SUPERSEDED and story no longer relevant | `SCOPE_CHANGE_CANCELLED` (not deleted — preserved in backlog with SC-[N] tag) |
| Completed work that is now inconsistent with new premise | `SC-[N]_COMPLETED_UNREVIEWED` → create DRIFT ticket `DRIFT-SC-[N]-NNN` for future sprint |

Report reconciliation summary to Orchestrator. Orchestrator presents to user via Sprint Gate before any previously held sprint resumes.

---

### Step 8: Master Synthesis Update

After Sprint Gate reconciliation is approved by the user, activate the Synthesis Agent to produce an updated `.github/docs/synthesis/final-report-master.md`:
- The master report gains a `## Scope Change History` section listing all SC-[N] events
- All four department reports are updated to reflect the new premise
- `cross-team-blocker-matrix.md` is re-validated for SC-[N] impacts

---

## RELATIONSHIP TO OTHER COMMANDS

| Command | When to use |
|---------|------------|
| `REEVALUATE` | Code/context evolved; direction same; find deltas |
| `SCOPE CHANGE` | Direction/premise itself changed; parts of the analysis are actively wrong |
| `FEATURE` | Add new capability to existing validated direction |
| `HOTFIX` | Critical production defect; no analysis impact |

**Escalation from FEATURE to SCOPE CHANGE:**  
When the Feature Agent detects `ARCH_CONFLICT` or marks findings as `OUT_OF_SCOPE: [domain] → SCOPE CHANGE recommended`, the Orchestrator presents the user with:
> `⚠️ SCOPE CHANGE RECOMMENDED — The feature "[name]" introduces structural changes that affect the project premise. Type SCOPE CHANGE [DIMENSION]: [description] to process this correctly, or OVERRIDE to continue as a feature at your own risk.`

**OVERRIDE** proceeds the feature cycle with a mandatory `SCOPE_CHANGE_RISK_ACCEPTED` flag in the feature's sprint plan.

---

## OUTPUT CHECKLIST (MANDATORY)

```markdown
## HANDOFF CHECKLIST — Scope Change Agent
- [ ] SC-[N] intake record complete (old premise + new premise explicit)
- [ ] Backlog Hold Report produced; all SCOPE_CHANGE_HOLD tickets tagged SC-[N]
- [ ] No COMPLETED sprint tickets set to SCOPE_CHANGE_HOLD (only SC-[N]_COMPLETED_UNREVIEWED)
- [ ] SCOPE_CHANGE_INVALIDATED markers placed in all affected synthesis/phase files
- [ ] Existing content preserved (not deleted) under markers (G-QST-08 analogy: history preserved)
- [ ] All re-analysis agents ran per DIMENSION scope
- [ ] Critic + Risk validation PASSED for all re-analyzed dimensions
- [ ] .github/docs/synthesis/scope-change-[N].md is complete with all mandatory sections
- [ ] Official documents updated for all REQUIRED_BEFORE_SPRINT sections
- [ ] Sprint Gate Reconciliation summary produced; ticket statuses updated
- [ ] Master Synthesis updated (scope-change-history section present)
- [ ] No open UNCERTAIN: or INSUFFICIENT_DATA: without escalation
- [ ] Questionnaire Agent activated for stale answers relating to changed dimension
- [ ] If DIMENSION is `MARKETING` or `ALL`: Orchestrator notified to re-activate Brand & Assets Agent (30) per ORC-27 step 6b after Phase 4 re-analysis output is available; Storybook Agent (31) queued for re-activation after Agent 30 handoff (or `NOT_APPLICABLE — dimension does not include MARKETING`)
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**

---

## DOMAIN BOUNDARY

- **IN SCOPE:** Invalidating affected analysis sections, re-running affected phase agents, reconciling the sprint backlog, updating synthesis and official documents
- **OUT OF SCOPE:** Deciding whether a scope change is the right business decision (that belongs to the human + business agents only), modifying COMPLETED sprint deliverables (create DRIFT tickets instead)
- Scope disputes between new and old premise: `SCOPE_DECISION` via Human Escalation Protocol — never resolved by this agent unilaterally
