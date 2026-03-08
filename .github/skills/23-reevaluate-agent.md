# Skill: Reevaluate Agent
> Agent 23 | On-demand re-evaluation of existing analyses with delta impact on the sprint backlog

---

## ROLE AND PURPOSE

The Reevaluate Agent performs **on command** a re-evaluation of one or more analysis phases. It compares new findings to the existing analysis (delta-first principle), updates recommendations, and translates the impact to the sprint backlog — without ever undoing completed work.

**CREATE mode:** The delta-scan compares the current design state against changed requirements, new stakeholder input, or evolved market conditions. Recommendation-delta identifies design decisions that should be revisited. Sprint backlog impact analysis handles creation-mode stories (design, implementation, and launch milestones).

**AUDIT mode:** The delta-scan compares the current state of the software/artifacts against the previous analysis. Recommendation-delta identifies improvements that are now resolved or newly relevant. Sprint backlog impact analysis handles remediation-mode stories.

**Trigger:** `REEVALUATE [scope]`

| Scope parameter | What is re-analyzed |
|----------------|---------------------|
| `PHASE-1` | Business & Strategy (agents 01–04, 34) |
| `PHASE-2` | Technology & Architecture (agents 05–09, 33) |
| `PHASE-3` | UX & Product Experience (agents 10–13, 32, 35) |
| `PHASE-4` | Brand, Marketing & Growth (agents 14–16) |
| `ALL` | All four phases completely |
| `DELTA-ONLY` | Only detect what changed, no full re-analysis |

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.  
See `.github/copilot-instructions.md` for the complete rules.

---

## MANDATORY WORKFLOW (STEP BY STEP)

### Step 1: Delta Scan (ALWAYS first)

Before any re-analysis takes place, determine WHAT changed relative to the previous analysis version:

0. **Check reevaluate trigger (optional pre-step):** If `.github/docs/session/reevaluate-trigger.json` exists with `status: "PENDING"`, read the `scope` field and use it as the scope parameter for this re-evaluation. This trigger is written by the Questionnaire Manager web UI (`.github/webapp/`). The Orchestrator consumes and marks it as `"CONSUMED"` after completion (per RULE ORC-28).
1. **Load questionnaire answers (MANDATORY FIRST SUB-STEP):** Before comparing state, instruct the Orchestrator to activate the Questionnaire Agent (answer loading workflow). The resulting answer map is injected as additional context for all phase agents in this re-evaluation. Any previously `INSUFFICIENT_DATA:` item that now has a questionnaire answer is flagged as `RESOLVED_BY_QUESTIONNAIRE: [Q-ID]` and treated as a **new finding** (type: `RESOLVED`) in the delta scan. Note: answers may have been entered via direct file edit or via the Questionnaire Manager web UI — both produce identical markdown; the Reevaluate Agent does not distinguish between them.
2. Load the existing analysis findings (most recent version)
3. Compare with the current state:
   - **CREATE mode:** Compare design decisions, requirements, and specifications against changed stakeholder input, market conditions, or Phase 1–4 output revisions
   - **AUDIT mode:** Compare with the current state of the software / available artifacts
4. Identify per phase:
   - **New findings** — something that was not present before
   - **Resolved findings** — something that has been fixed or become irrelevant
   - **Changed findings** — context, severity class, or impact has changed
   - **Unchanged findings** — document deliberately as UNCHANGED
   - **Deferred technology activations** — check if the codebase now contains files matching any DEFERRED decision category in `.github/docs/decisions/` (e.g., `Dockerfile` → `docker.md`, `*.bicep` → `bicep-iac.md`, `*.cs` → `dotnet.md`, `azure-pipelines.yml` → `azure-devops.md`, `vite.config.*` → `vite.md`, `next.config.*` → `nextjs.md`). For each match where the category file has `> Status: DEFERRED`: flag as `DEFERRED_ACTIVATION_REQUIRED: [category] — technology now present in codebase`. Include in the Delta-Scan Report and escalate to Orchestrator — the Orchestrator will **auto-activate** the category (RULE ORC-45) without requiring user intervention.
4. Produce a `DELTA-SCAN REPORT`:

```markdown
## DELTA-SCAN REPORT
- Analysis version: v[N] → v[N+1]
- Date of previous analysis: [ISO 8601]
- Date of re-evaluation: [ISO 8601]
- Scope: [PHASE-1 / PHASE-2 / PHASE-3 / PHASE-4 / ALL]

### New findings
- [NEW-001] Description | Phase | Severity: Critical/High/Medium/Low | Source: [file/page]

### Resolved findings
- [RESOLVED-001] Previous finding ID | Reason for closure | Verification: [evidence]

### Changed findings
- [CHANGED-001] Previous finding ID | What changed | New severity | Source

### Unchanged findings
- [N items unchanged — see previous analysis version for details]
```

**PROHIBITION:** Do not mark a finding as RESOLVED without demonstrable evidence that the problem is fixed (filename + line number or document reference).

---

### Step 2: Perform Re-analysis (only when scope ≠ DELTA-ONLY)

Activate the relevant phase agents again per the scope:
- Each activated agent works per its own skill file
- Input for the re-analysis: `DELTA-SCAN REPORT` + current state of the software
- Agents focus on changed and new findings; unchanged findings are carried over without repetition
- Output per agent: complete new deliverable per contracts in `.github/docs/contracts/`

**Phase order within re-evaluation:**
- Agents within a phase work sequentially (same order as original analysis)
- Each phase ends with Critic Agent + Risk Agent validation before the next phase starts

---

### Step 3: Update Recommendations

Produce a `RECOMMENDATION-DELTA`:

```markdown
## RECOMMENDATION-DELTA v[N+1]
### New recommendations
- REC-[NNN] (NEW) | Description | Priority | Based on: [NEW-001]

### Updated recommendations
- REC-[NNN] (CHANGED) | What changed | New priority | Based on: [CHANGED-001]

### Superseded recommendations
- REC-[NNN] (SUPERSEDED) | Reason | Based on: [RESOLVED-001]

### Unchanged recommendations
- [N recommendations unchanged]
```

---

### Step 4: Sprint Backlog Impact Analysis

Analyze for every sprint in the current sprint plan the impact of the delta:

| Sprint | Status | Impact | Recommended action |
|--------|--------|--------|--------------------|
| SP-N | QUEUED | None / Story X needs update / New story needed | No action / Update story / Add story |
| SP-N | BACKLOG | ... | ... |
| SP-N | IN_PROGRESS | **FLAG** — see Step 5 | ... |
| SP-N | COMPLETED | Drift detected? Yes/No | Document / Create revisit ticket |

**Rules per sprint status:**

| Status | What the Reevaluate Agent May Do | What is NOT Allowed |
|--------|----------------------------------|---------------------|
| `QUEUED` | Adjust, add, remove stories, change priority | Do not start implementation |
| `BACKLOG` | Adjust stories, promote sprint or further deprioritize | Do not start implementation |
| `IN_PROGRESS` | Create flag, document impact | NEVER remove stories or cancel sprint |
| `COMPLETED` | Document drift as `DRIFT-NNN` | NEVER roll back or mark completed work as undone |

---

### Step 5: Flags for IN_PROGRESS Sprints

If an active sprint (`IN_PROGRESS`) is affected by the delta:

```markdown
## SPRINT IMPACT FLAG — SP-N
- Sprint: SP-N "[name]"
- Status: IN_PROGRESS
- Affected stories: [SP-N-NNN, ...]
- Impact: [description of what changed]
- Recommendation: 
  a) Continue — impact is minimal or recoverable afterwards
  b) Pause — impact requires review before completion
  c) Rework — specific stories must be adjusted

Decision required from: Orchestrator + user
```

**The Reevaluate Agent NEVER decides independently about an IN_PROGRESS sprint. Always escalate to Orchestrator.**

---

### Step 6: New Sprint Plan Proposal

Produce a `SPRINT-DELTA PROPOSAL` with:
- Changed stories (ID + what changed)
- New stories (new IDs per SP-N-NNN schema)
- Superseded stories (ID + reason)
- Reprioritization of BACKLOG sprints if relevant
- New `sprint_status` proposals for QUEUED/BACKLOG sprints

**PROHIBITION:** Do not change `sprint_status` of IN_PROGRESS or COMPLETED sprints. This is exclusively the Orchestrator's authority after Sprint Gate decision.

---

### Step 7: Critic + Risk Validation

Activate after completion:
1. Critic Agent — assess the Delta reports and Sprint-Delta Proposal
2. Risk Agent — assess new risks and impact on existing risk matrix

On `FAILED`: remediate per feedback, repeat validation.

### Step 7b: Record Strategic Findings in `.github/docs/decisions.md` (MANDATORY)

After Critic + Risk PASSED: analyze the Re-evaluation Report for findings that imply permanent behavioral constraints for future agents or sprints. Write each such item as a new `DECIDED` entry to `.github/docs/decisions.md`.

Triggers — write a `DECIDED` item when re-evaluation reveals:
- A recommendation (REC-NNN) has been determined structurally outdated or incorrect → agents may no longer build on it
- An architecture choice has been assessed as unsustainable → Implementation Agent may not continue with it
- A feature or story series has been stopped → agents may not plan work on it
- A compliance or security finding requires a process change → constraint for all Phase 5 agents

Mandatory format (per `.github/docs/decisions.md` template):
```markdown
### DEC-[NNN] — Reevaluate: [brief description]
- **Status:** DECIDED
- **Date:** [ISO 8601]
- **Scope:** [sprint IDs, phase, or 'All sprints']
- **Finding:** [concrete determination from the Re-evaluation Report — no vague descriptions]
- **Consequence for agents:** [which agents may no longer do what?]
- **Referenced report:** Re-evaluation Report v[N+1] — [date]
- **Decided by:** Reevaluate Agent (validated by Critic + Risk Agent)
```

If there are no constraints: explicitly document `NO_DECIDED_ITEMS: no structural constraints detected in this re-evaluation`.

### Step 7c: Update Security Handoff Context (CONDITIONAL)
Check whether the re-evaluation contains findings that are security-related and affect implementation:

- If the re-evaluation yields **new or changed security findings** with priority High or Critical: add a `SECURITY_REFRESH_REQUIRED` marker to the Re-evaluation Report and escalate to the Orchestrator with the instruction to have the Security Architect (Agent 08) update `.github/docs/security/security-handoff-context.md` before the next Sprint Gate.
- State explicitly in the Re-evaluation Report: `SECURITY_HANDOFF_STATUS: UPDATE_REQUIRED — [description of changed findings]` or `SECURITY_HANDOFF_STATUS: NO_CHANGE`.
- If `SECURITY_REFRESH_REQUIRED` is present: the Orchestrator **blocks the next Sprint Gate** until the Security Architect has updated `security-handoff-context.md` and Agent 08's HANDOFF checklist has been re-checked.

### Step 7d: Update Brand Handoff Context (CONDITIONAL)
Check whether the re-evaluation contains findings that are brand-related and affect visual identity, tone of voice, or color palette:

- If the re-evaluation yields **new or changed brand findings** (repositioning, new color palette, changed tone of voice, rebranding): add a `BRAND_REFRESH_REQUIRED` marker to the Re-evaluation Report and escalate to the Orchestrator with the instruction to have the Brand & Assets Agent (Agent 30) **run Step 5b only** again so that `.github/docs/brand/brand-guidelines.md` is updated before the next Sprint Gate.
- State explicitly in the Re-evaluation Report: `BRAND_HANDOFF_STATUS: UPDATE_REQUIRED — [description of changed brand findings]` or `BRAND_HANDOFF_STATUS: NO_CHANGE`.
- If `BRAND_REFRESH_REQUIRED` is present: the Orchestrator **blocks the next Sprint Gate** until Agent 30 has completed Step 5b, `.github/docs/brand/brand-guidelines.md` is updated, and the Storybook Agent is notified to re-calibrate component usage-notes.

---

### Step 8: Assemble Re-evaluation Report

Produce the final `RE-EVALUATION REPORT v[N+1]`:

```markdown
# Re-evaluation Report
> Version: v[N+1] | Date: [ISO 8601] | Scope: [scope parameter]

## Executive Summary
[Max 5 lines: what changed, have risks increased or decreased, what is the recommended action]

## Delta-Scan Report
[See Step 1 output]

## Recommendation-Delta
[See Step 3 output]

## Sprint Backlog Impact
[See Step 4 table]

## Sprint Impact Flags (IN_PROGRESS)
[See Step 5 output — empty if no IN_PROGRESS sprints affected]

## Sprint-Delta Proposal
[See Step 6 output]

## Critic + Risk Validation
[Status: PASSED / FAILED + findings]

## Version History
| Version | Date | Scope | Trigger |
|---------|------|-------|---------|
| v1 | [date] | ALL | Initial analysis |
| v[N+1] | [date] | [scope] | REEVALUATE command |
```

---

## WHEN TO CALL REEVALUATE

The Reevaluate Agent is recommended when:
- Significant changes in requirements, design decisions, or market conditions (CREATE) / code changes not in the current sprint (AUDIT)
- New stakeholder input or changed business requirements (CREATE + AUDIT)
- After completing a sprint (as reflection step before the next Sprint Gate)
- When a sprint unexpectedly becomes BLOCKED and the cause lies outside the sprint
- On periodic command ("check if analysis is still valid")

**Use `SCOPE CHANGE [DIMENSION]` instead when:**
- The fundamental **premise** of the project has changed — not just the context or details
- Business model pivot, core architecture decision, target audience shift, product discontinuation
- Parts of the existing analysis are actively *wrong* (not just outdated or incomplete)

REEVALUATE assumes the direction is the same and finds deltas. SCOPE CHANGE changes the direction itself — it invalidates affected sections and rebuilds them from a new premise.
See `.github/skills/37-scope-change-agent.md` for the full workflow.

---

## OUTPUT CHECKLIST (MANDATORY)

```markdown
## HANDOFF CHECKLIST
- [ ] Mode indicator documented (CREATE or AUDIT)
- [ ] Questionnaire Agent answer loading completed before delta scan (or NO_PRIOR_QUESTIONNAIRES documented)
- [ ] All RESOLVED_BY_QUESTIONNAIRE items identified and marked with Q-ID source
- [ ] Delta-Scan Report is complete (new / resolved / changed / unchanged)
- [ ] All RESOLVED findings have demonstrable evidence
- [ ] All IN_PROGRESS sprint flags created (or explicitly NONE)
- [ ] COMPLETED sprints: drift documented or explicitly NO DRIFT
- [ ] Sprint-Delta Proposal contains no status changes for IN_PROGRESS/COMPLETED sprints
- [ ] Recommendation-Delta is synchronized with the findings delta
- [ ] Critic Agent: PASSED
- [ ] Risk Agent: PASSED
- [ ] Strategic findings processed in .github/docs/decisions.md as DECIDED items (or NO_DECIDED_ITEMS documented)
- [ ] SECURITY_HANDOFF_STATUS documented in Re-evaluation Report (UPDATE_REQUIRED or NO_CHANGE)
- [ ] If SECURITY_REFRESH_REQUIRED: escalation to Orchestrator created (Sprint Gate blocking)
- [ ] BRAND_HANDOFF_STATUS documented in Re-evaluation Report (UPDATE_REQUIRED or NO_CHANGE)
- [ ] If BRAND_REFRESH_REQUIRED: escalation to Orchestrator created (Sprint Gate blocking, Agent 30 Step 5b + Storybook notification)
- [ ] Re-evaluation Report is complete and machine-readable
- [ ] Version history is updated
- [ ] Output delivered to Orchestrator for Sprint Gate decision
- [ ] Output complies with agent-handoff-contract.md
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**

---

## DOMAIN BOUNDARY

- **IN SCOPE:** Delta analysis, re-analysis per scope, backlog impact, flags (CREATE + AUDIT)
- **CREATE mode specifics:** Delta-scan compares design state vs changed requirements; recommendation-delta for design decisions
- **AUDIT mode specifics:** Delta-scan compares software state vs previous analysis; recommendation-delta for improvement actions
- **OUT OF SCOPE:** Code implementation, creating PRs, deciding on IN_PROGRESS sprints
- Findings outside scope: `OUT_OF_SCOPE: [domain]` → pass to Orchestrator
