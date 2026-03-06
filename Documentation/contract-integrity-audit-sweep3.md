# Contract & Playbook Integrity Audit — Sweep 3
> Auditor: Senior Documentation & Contract Integrity Auditor
> Date: 2026-03-06
> Scope: All 25 contracts, 2 playbooks, agent-index.md
> Prior sweep fixes confirmed: C1–C5 already applied

---

## SUMMARY

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH     | 6 |
| MEDIUM   | 10 |
| LOW      | 6 |
| **Total** | **24** |

---

## FINDINGS TABLE

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| C2-001 | CRITICAL | Completeness | Agent-index contracts reference lists only 11 of 25 contracts |
| C2-002 | CRITICAL | Schema | Onboarding session-state schema contradicts actual session-state contract |
| C2-003 | HIGH | Consistency | Risk contract internal contradiction — 6 categories defined, validation says "four" |
| C2-004 | HIGH | Consistency | Story status vocabulary divergence across 3 contracts |
| C2-005 | HIGH | Completeness | Agent handoff contract only accommodates Phase 1–4 deliverable structure |
| C2-006 | HIGH | DeadRef | ORC-35 referenced in 14+ contracts without inline summary |
| C2-007 | HIGH | Schema | Session-state escalation type enum is a subset of escalation protocol types |
| C2-008 | HIGH | Alignment | Playbooks list only 5 Phase 5 agents; copilot-instructions.md lists 9 |
| C2-009 | MEDIUM | Consistency | Critic severity scale (MAJOR/MINOR/INFO) differs from all other contracts |
| C2-010 | MEDIUM | Consistency | Test verdict APPROVED/REJECTED vs implementation reference PASSED/FAILED |
| C2-011 | MEDIUM | Consistency | REEVALUATE scope vocabulary mismatch between playbook and session-state |
| C2-012 | MEDIUM | Completeness | 13 contracts lack JSON export schema despite handoff requiring json_export |
| C2-013 | MEDIUM | Consistency | Mode field exists only in analysis contract; 3 other core contracts reference mode_consistent without defining mode |
| C2-014 | MEDIUM | DeadRef | Guardrail 09 exists but implementation contract and both playbooks reference 00–08 only |
| C2-015 | MEDIUM | Completeness | decisions.md schema undefined but referenced in copilot-instructions and session-state |
| C2-016 | MEDIUM | Completeness | Phase 5 agent outputs not tracked in session-state phase_outputs |
| C2-017 | LOW | Consistency | Validation criteria format divergence: old contracts use REJECTION CRITERIA, new use VALIDATION CRITERIA |
| C2-018 | LOW | DeadRef | "Step F2" dead reference in both playbooks — no Step F2 in sprint plan contract |
| C2-019 | LOW | Alignment | Feature Request entry in agent-index points to generated file, not feature-output-contract.md |
| C2-020 | LOW | Consistency | Sprint plan JSON has REQUEUED status not in session-state canonical list |
| C2-021 | LOW | Consistency | Scope change contract uses SCOPE_CHANGE_HOLD without SC-[N] suffix required by sprint plan |
| C2-022 | LOW | Completeness | Individual output contracts don't specify output file paths — only session-state does |
| C2-023 | MEDIUM | Consistency | Recommendations/sprintplan/guardrails JSON handoff_checklist references mode_consistent but contracts define no metadata mode field |
| C2-024 | MEDIUM | Alignment | Audit playbook says "Approved sprint plans from all 20 specialist agents" — correct count but misleading since sprint plans are per discipline, not per agent |

---

## DETAILED FINDINGS

---

### C2-001 — Agent-index contracts reference lists only 11 of 25 contracts
**Severity:** CRITICAL
**Category:** Completeness
**Source:** `.github/docs/agent-index.md` — CONTRACTS REFERENCE section

**Description:**
The CONTRACTS REFERENCE table in agent-index.md lists only 11 entries:

1. analysis-output-contract.md
2. recommendations-output-contract.md
3. sprintplan-output-contract.md
4. guardrails-output-contract.md
5. agent-handoff-contract.md
6. implementation-output-contract.md
7. questionnaire-output-contract.md
8. Feature Request (generated file, not a contract)
9. tooling-contract.md
10. session-state-contract.md
11. human-escalation-protocol.md

The following **14 contracts** are physically present in `.github/docs/contracts/` but **missing** from the index:

- `synthesis-output-contract.md`
- `critic-output-contract.md`
- `risk-output-contract.md`
- `onboarding-output-contract.md`
- `test-output-contract.md`
- `pr-review-output-contract.md`
- `kpi-output-contract.md`
- `documentation-output-contract.md`
- `github-integration-output-contract.md`
- `brand-assets-output-contract.md`
- `storybook-output-contract.md`
- `retrospective-output-contract.md`
- `reevaluate-output-contract.md`
- `scope-change-output-contract.md`
- (Also `feature-output-contract.md` — the index lists the generated file but not the contract)

**Why it matters:** Agents are told in copilot-instructions.md to "Read that file when you need to look up a specific agent's skill file, a guardrail scope, or a contract path." Any agent looking up its contract via the index will fail to find it for 14 of the 25 contracts.

**Fix:** Add all 25 contracts (including feature-output-contract.md properly pointing to `.github/docs/contracts/feature-output-contract.md`) to the CONTRACTS REFERENCE table. Remove or relabel the `Workitems/[FEATURENAME]/00-feature-request.md` entry as "Feature Request (generated per feature)" rather than a contract.

---

### C2-002 — Onboarding session-state schema contradicts actual session-state contract
**Severity:** CRITICAL
**Category:** Schema
**Source:** `onboarding-output-contract.md` (session-state.json section) vs `session-state-contract.md`

**Description:**
The onboarding contract defines a session-state schema with these field names and values:

```json
{
  "projectName": "string",
  "projectType": "NEW | AUDIT",
  "scope": "...",
  "currentPhase": "ONBOARDING_COMPLETE",
  "completedPhases": [],
  "activeSprint": null,
  "onboardingFile": "path",
  "timestamp": "ISO 8601"
}
```

The actual session-state contract uses completely different field names:

| Onboarding says | Session-state says |
|---|---|
| `projectName` | `github_project_name` (different semantics too) |
| `projectType: "NEW \| AUDIT"` | `cycle_type: "FULL_CREATE \| FULL_AUDIT \| ..."` + `project_type: "greenfield \| existing \| hybrid"` |
| `currentPhase` | `current_phase` (snake_case) |
| `completedPhases` | `completed_phases` (snake_case) |
| `activeSprint` | `sprint_backlog` (entirely different structure) |
| `onboardingFile` | `phase_outputs.onboarding` |
| `timestamp` | `initiated_at` + `last_updated` |
| (not present) | `session_id`, `schema_version`, `scope`, `status`, etc. |

**Why it matters:** If the Onboarding Agent follows its own contract and writes camelCase fields with different semantics, the session-state file will be invalid and no subsequent agent can parse it.

**Fix:** Replace the session-state.json section in `onboarding-output-contract.md` with a reference to the canonical schema: "The Onboarding Agent initializes `session-state.json` per the schema in `session-state-contract.md`. At minimum the following fields MUST be set:" followed by the session-state field names in snake_case.

---

### C2-003 — Risk contract internal contradiction: 6 categories defined, validation says "four"
**Severity:** HIGH
**Category:** Consistency
**Source:** `risk-output-contract.md` — Section 2 vs Validation Criteria

**Description:**
The Risk Inventory section defines **6** risk categories:
`TECHNICAL | BUSINESS | SECURITY | OPERATIONAL | LEGAL | COMPLIANCE`

But the Validation Criteria section says:
> "All **four** risk categories are explicitly assessed (technical, business, security, operational)"

This contradicts the contract's own schema — LEGAL and COMPLIANCE categories are defined but not required by validation.

**Why it matters:** The Risk Agent may skip LEGAL and COMPLIANCE categories and still pass validation, even though the contract schema includes them.

**Fix:** Either (a) update validation to say "All **six** risk categories" and list all six, or (b) reduce the schema to four categories and move LEGAL/COMPLIANCE to an optional sub-classification.

---

### C2-004 — Story status vocabulary divergence across 3 contracts
**Severity:** HIGH
**Category:** Consistency
**Source:** `session-state-contract.md` (canonical list) vs `sprintplan-output-contract.md` vs `scope-change-output-contract.md`

**Description:**
Three contracts define story status values with conflicting vocabularies:

| Status | Session-state canonical | Sprint plan JSON | Scope change contract |
|---|---|---|---|
| `REQUEUED` | ❌ absent | ✅ present | ✅ present |
| `BACKLOG (CASCADE from SP-N)` | ❌ absent | ✅ present | ❌ absent |
| `SCOPE_CHANGE_HOLD SC-[N]` | ❌ absent as canonical | ✅ present | ❌ uses `SCOPE_CHANGE_HOLD` (no suffix) |
| `SCOPE_CHANGE_CANCELLED SC-[N]` | ❌ absent as canonical | ✅ present | ❌ uses `CANCELLED` |
| `NOT_READY` | ✅ present | ❌ absent | ❌ absent |
| `IMPLEMENTED` | ✅ present | ❌ absent | ❌ absent |
| `TESTING` | ✅ present | ❌ absent | ❌ absent |
| `TEST_FAILED` | ✅ present | ❌ absent | ❌ absent |
| `REVIEW` | ✅ present | ❌ absent | ❌ absent |
| `REVIEW_FAILED` | ✅ present | ❌ absent | ❌ absent |

The session-state contract has 12 canonical statuses. The sprint plan uses 7 (with 2 not in canonical). The scope change contract uses 3 different labels.

**Why it matters:** Agents writing status values use different strings for the same concept. The Orchestrator's status mapping table will fail for statuses that don't match.

**Fix:** Add `REQUEUED` and `BACKLOG (CASCADE from SP-N)` to the canonical status list in session-state-contract. Ensure scope-change-output-contract uses `SCOPE_CHANGE_HOLD SC-[N]` with the suffix. Add a note that sprint plan statuses are a subset (pre-implementation) of the full canonical list.

---

### C2-005 — Agent handoff contract only accommodates Phase 1–4 deliverable structure
**Severity:** HIGH
**Category:** Completeness
**Source:** `agent-handoff-contract.md` — Step 2 + Step 4

**Description:**
The handoff checklist (Step 2) requires:
```
- [ ] Analysis document present and per analysis-output-contract.md
- [ ] Recommendations document present and per recommendations-output-contract.md
- [ ] Sprint Plan present and per sprintplan-output-contract.md
- [ ] Guardrails present and per guardrails-output-contract.md
```

The handoff message JSON (Step 4) requires:
```json
"deliverables": {
  "analysis": "path",
  "recommendations": "path",
  "sprintplan": "path",
  "guardrails": "path",
  "json_export": "path"
}
```

This structure assumes every agent produces all four standard deliverables. But **21 of 38 agents** don't: Implementation Agent, Test Agent, PR/Review Agent, KPI Agent, Documentation Agent, Retrospective Agent, GitHub Integration Agent, Synthesis Agent, Critic Agent, Risk Agent, Reevaluate Agent, Feature Agent, Scope Change Agent, Onboarding Agent, Questionnaire Agent, Brand & Assets Agent, and Storybook Agent all have different output structures.

**Why it matters:** Phase 5 and utility agents cannot produce valid handoff messages per this contract. They either skip the handoff contract entirely (violating the "applies to EVERY transfer" rule) or produce non-conformant handoffs.

**Fix:** Refactor the handoff contract to use a generic deliverables structure:
```json
"deliverables": [
  { "type": "string", "path": "string", "contract_ref": "string" }
]
```
And make the checklist conditional: "Check all applicable items for your agent type."

---

### C2-006 — ORC-35 referenced in 14+ contracts without inline summary
**Severity:** HIGH
**Category:** DeadRef
**Source:** All Phase 5 + utility contracts that say "The Orchestrator checks (per ORC-35):"

**Description:**
The following contracts reference "ORC-35" without an inline summary of what that rule says:
- critic-output-contract.md
- risk-output-contract.md
- synthesis-output-contract.md
- onboarding-output-contract.md
- test-output-contract.md
- pr-review-output-contract.md
- kpi-output-contract.md
- documentation-output-contract.md
- github-integration-output-contract.md
- brand-assets-output-contract.md
- storybook-output-contract.md
- retrospective-output-contract.md
- reevaluate-output-contract.md
- scope-change-output-contract.md
- feature-output-contract.md

The C1 fix from the prior sweep added inline summaries for ORC-25, ORC-26, ORC-28, and ORC-29 (in questionnaire and session-state contracts), but ORC-35 in these 14+ newer contracts was not given the same treatment.

**Why it matters:** Agents cannot resolve what ORC-35 means without looking up the orchestrator skill file, which violates the self-contained contract principle established by the C1 fix.

**Fix:** Add a `### Cross-reference: ORC-35 (validation criteria enforcement)` block in each contract's validation section, summarizing: "The Orchestrator validates every agent output against that agent's contract before accepting the handoff. All validation criteria checkboxes must pass."

---

### C2-007 — Session-state escalation type enum is a subset of escalation protocol types
**Severity:** HIGH
**Category:** Schema
**Source:** `session-state-contract.md` (open_human_escalations.type) vs `human-escalation-protocol.md` (WHEN TO ESCALATE table)

**Description:**
Session-state defines the escalation type enum as:
`"ONBOARDING_BLOCKED | TOOL_INSTALL_REQUEST | SPRINT_IMPACT_FLAG | SCOPE_DECISION | OTHER"`

The Human Escalation Protocol defines **10** escalation types:
`ONBOARDING_BLOCKED | TOOL_INSTALL_REQUEST | SPRINT_GATE | SPRINT_IMPACT_FLAG | SCOPE_DECISION | SCOPE_CHANGE_DECISION | AGENT_CONFLICT | SECURITY_DECISION | DESTRUCTIVE_GIT_OP | OTHER`

**Missing from session-state:** `SPRINT_GATE`, `SCOPE_CHANGE_DECISION`, `AGENT_CONFLICT`, `SECURITY_DECISION`, `DESTRUCTIVE_GIT_OP`

**Why it matters:** Any escalation of type SPRINT_GATE (the most common escalation) cannot be represented in session-state's type field. The Orchestrator must either use the catch-all "OTHER" or violate the enum constraint.

**Fix:** Synchronize the session-state escalation type enum to include all 10 types from the escalation protocol.

---

### C2-008 — Playbooks list only 5 Phase 5 agents; copilot-instructions lists 9
**Severity:** HIGH
**Category:** Alignment
**Source:** Both playbooks (Phase 5 agent list) vs `copilot-instructions.md` (Phase 5 sequence)

**Description:**
Both playbooks list Phase 5 agents as:
1. Implementation Agent
2. Test Agent
3. PR/Review Agent
4. Critic Agent
5. Risk Agent

copilot-instructions.md defines the Phase 5 per-sprint sequence as:
> Implementation Agent → Test Agent → PR/Review Agent → **KPI Agent** → **Documentation Agent** → **GitHub Integration Agent** → Retrospective Agent

And the Critic + Risk validation happens per sprint too. So the full set is 9 agents: Implementation, Test, PR/Review, Critic, Risk, KPI, Documentation, GitHub Integration, Retrospective.

**Missing from playbooks:** KPI Agent, Documentation Agent, GitHub Integration Agent, Retrospective Agent.

**Why it matters:** The playbook is the canonical process reference. Agents looking at the playbook for the Phase 5 workflow will miss 4 mandatory agents and their contracts.

**Fix:** Update both playbooks' Phase 5 "Agents (Per Sprint, In Order)" to include all 9 agents in the correct sequence.

---

### C2-009 — Critic severity scale differs from all other contracts
**Severity:** MEDIUM
**Category:** Consistency
**Source:** `critic-output-contract.md` Section 3 vs `analysis-output-contract.md`, `risk-output-contract.md`

**Description:**
The Critic Agent uses severity levels: `CRITICAL, MAJOR, MINOR, INFO`
All other contracts use: `Critical / High / Medium / Low`

The Critic's findings feed into sprint gate decisions, yet the mapping from MAJOR→High and MINOR→Medium is never documented.

**Fix:** Either align the Critic to the standard scale (CRITICAL/HIGH/MEDIUM/LOW) or add an explicit mapping table in the critic contract.

---

### C2-010 — Test verdict naming mismatch with implementation contract
**Severity:** MEDIUM
**Category:** Consistency
**Source:** `test-output-contract.md` Section 6 vs `implementation-output-contract.md` (Definition of DONE)

**Description:**
- Test contract verdict: `APPROVED | REJECTED`
- Implementation contract references: `PASSED / FAILED` for Critic Agent validation
- Implementation contract's Sprint Definition of Done says: "Critic Agent validation PASSED"
- But Critic contract uses: `APPROVED | FAILED`

Three different naming conventions for the same binary decision: APPROVED/REJECTED, PASSED/FAILED, and APPROVED/FAILED.

**Fix:** Standardize all agent verdicts to one pair. Recommendation: `APPROVED | FAILED` (matching the Critic contract), with a mapping note for the Test Agent's `REJECTED` = `FAILED`.

---

### C2-011 — REEVALUATE scope vocabulary mismatch
**Severity:** MEDIUM
**Category:** Consistency
**Source:** Both playbooks vs `session-state-contract.md` vs `reevaluate-trigger.json`

**Description:**
- Playbooks define REEVALUATE scope as: `PHASE-1 | PHASE-2 | PHASE-3 | PHASE-4 | ALL | DELTA-ONLY`
- Session-state maps scope to disciplines: `["BUSINESS"] | ["TECH"] | ["UX"] | ["MARKETING"]`
- Reevaluate trigger JSON uses: `ALL | BUSINESS | TECH | UX | MARKETING`

The playbooks use phase numbers; the session-state and trigger file use discipline names. `DELTA-ONLY` from the playbook has no equivalent in the session-state contract.

**Fix:** Align the playbooks to use discipline names instead of phase numbers. Add `DELTA-ONLY` as a supported scope value in the session-state reevaluate scope, or document it as a modifier on the command (not a scope value).

---

### C2-012 — 13 contracts lack JSON export schema
**Severity:** MEDIUM
**Category:** Completeness
**Source:** `agent-handoff-contract.md` Step 4 requires `json_export` path

**Description:**
The handoff message (Step 4) requires a `json_export` deliverable path. However, the following 13 contracts do not define any JSON export schema:

critic, risk, synthesis, test, PR/review, documentation, GitHub integration, storybook, reevaluate, scope-change, feature, onboarding (partial — only embedded session-state), brand-assets (partial — only design-tokens.json)

The four core contracts (analysis, recommendations, sprintplan, guardrails) all have full JSON schemas. The questionnaire, KPI, and retrospective contracts have partial JSON schemas.

**Fix:** For each new contract, either (a) add a JSON export schema section or (b) explicitly state "No standalone JSON export — machine-readable output is embedded in [file path]" so agents know what to put in the handoff message's json_export field.

---

### C2-013 — Mode field in analysis contract only; recommendations/sprintplan/guardrails JSON handoff_checklist expects mode_consistent
**Severity:** MEDIUM
**Category:** Consistency
**Source:** `recommendations-output-contract.md`, `guardrails-output-contract.md` (JSON handoff_checklist) vs their metadata sections

**Description:**
The analysis-output-contract defines `"mode": "CREATE | AUDIT"` in both metadata markdown and JSON schema. Its handoff_checklist has `"mode_consistent": "true"`.

The recommendations and guardrails contracts also have `"mode_consistent": "true"` in their JSON handoff_checklist, but neither contract defines a `mode` field in its metadata section or JSON schema. An agent checking `mode_consistent` has no mode value to validate against.

**Fix:** Add `Mode: [CREATE | AUDIT]` to the metadata section and `"mode": "CREATE | AUDIT"` to the JSON schema of recommendations, sprintplan, and guardrails contracts.

---

### C2-014 — Guardrail 09 not referenced by implementation contract or playbooks
**Severity:** MEDIUM
**Category:** DeadRef
**Source:** `implementation-output-contract.md` (Input table) + both playbooks (Phase 5 Required Input)

**Description:**
The implementation contract says: `Guardrails (all phases) | .github/docs/guardrails/00-08`
Both playbooks say: `Guardrails (.github/docs/guardrails/00–08)`
But agent-index.md shows guardrail 09 exists: `.github/docs/guardrails/09-questionnaire-guardrails.md`

**Fix:** Update all references from `00–08` to `00–09`.

---

### C2-015 — decisions.md schema undefined
**Severity:** MEDIUM
**Category:** Completeness
**Source:** `copilot-instructions.md` + `session-state-contract.md` (command-queue.json)

**Description:**
copilot-instructions.md states: "Decisions can be created and answered via the web UI (Decisions tab) — changes are written directly to `.github/docs/decisions.md`"
The session-state contract's command-queue.json documents the web UI integration, but no contract defines the schema for `.github/docs/decisions.md` — no field definitions, no status values, no validation criteria.

**Fix:** Create a `decisions-schema` section in either an existing contract (e.g., session-state or questionnaire) or a new dedicated contract defining the decisions.md format, valid status values (DECIDED, OPEN_QUESTION), and validation rules.

---

### C2-016 — Phase 5 agent outputs not tracked in session-state phase_outputs
**Severity:** MEDIUM
**Category:** Completeness
**Source:** `session-state-contract.md` (phase_outputs section)

**Description:**
The session-state tracks Phase 1–4 agent outputs individually (e.g., `phase-1.01`, `phase-1.02`) and synthesis/sprintplan. But there is no `phase-5` section for tracking outputs of: Implementation, Test, PR/Review, KPI, Documentation, GitHub Integration, or Retrospective agents.

Phase 5 outputs are tracked implicitly via `sprint_backlog` and sprint completion reports, but there's no way for the Orchestrator to verify which Phase 5 agent outputs exist per sprint.

**Fix:** Add a `phase-5` section to phase_outputs, keyed by sprint ID, containing paths to each agent's output per sprint (e.g., `SP-1.implementation`, `SP-1.test`, `SP-1.pr_review`, etc.).

---

### C2-017 — Validation criteria format divergence
**Severity:** LOW
**Category:** Consistency
**Source:** All 25 contracts

**Description:**
The original 4 contracts (analysis, recommendations, sprintplan, guardrails) use a "REJECTION CRITERIA" section — describing what causes rejection.
The 14 newer contracts use a "VALIDATION CRITERIA" section — describing what the Orchestrator checks.
The remaining contracts (handoff, session-state, human escalation, tooling, questionnaire) use contract-specific formats.

**Fix:** Standardize on one format (VALIDATION CRITERIA recommended) and add a "REJECTION shorthand" at the end stating "Output is REJECTED if any checkbox above fails."

---

### C2-018 — "Step F2" dead reference in playbooks
**Severity:** LOW
**Category:** DeadRef
**Source:** Both playbooks (Phase 5 Parallel Tracks section)

**Description:**
Both playbooks say: "Stories in the same sprint that have NO mutual dependencies (identified in **Step F2** of the sprint plans)"
There is no "Step F2" defined anywhere in the sprint plan contract or any other contract.

**Fix:** Replace "Step F2" with "the Parallel Tracks section" or "the Dependency Overview table" — referencing the actual section name in the sprintplan-output-contract.

---

### C2-019 — Feature Request entry in agent-index misclassified
**Severity:** LOW
**Category:** Alignment
**Source:** `agent-index.md` CONTRACTS REFERENCE

**Description:**
The agent-index lists: `Feature Request | Workitems/[FEATURENAME]/00-feature-request.md (generated per feature)`
This points to a generated file, not to `feature-output-contract.md` which is the actual contract. The contract file is not listed at all.

**Fix:** Replace the Feature Request entry with: `Feature output | .github/docs/contracts/feature-output-contract.md` and optionally keep the generated file as a separate "Feature Request (template)" entry.

---

### C2-020 — Sprint plan REQUEUED status not in canonical list
**Severity:** LOW
**Category:** Consistency
**Source:** `sprintplan-output-contract.md` (story_status enum) vs `session-state-contract.md` (canonical statuses)

**Description:**
The sprint plan JSON schema includes `REQUEUED` as a valid `story_status`. The session-state canonical story status list has no `REQUEUED` entry, and the "Valid transitions" section doesn't mention transitions to/from REQUEUED.

**Fix:** Add `REQUEUED` to the session-state canonical status table with definition "Story reinstated after scope change hold" and transition `SCOPE_CHANGE_HOLD → REQUEUED → QUEUED`.

---

### C2-021 — Scope change contract SCOPE_CHANGE_HOLD missing SC-[N] suffix
**Severity:** LOW
**Category:** Consistency
**Source:** `scope-change-output-contract.md` Section 3 vs `sprintplan-output-contract.md`

**Description:**
Sprint plan contract uses: `SCOPE_CHANGE_HOLD SC-[N]` and `SCOPE_CHANGE_CANCELLED SC-[N]` (with scope-change ID suffix)
Scope change contract Section 3 uses: `SCOPE_CHANGE_HOLD | CANCELLED | REQUEUED` (no suffix)

**Fix:** Align scope-change-output-contract to use `SCOPE_CHANGE_HOLD SC-[N]` format to match sprint plan.

---

### C2-022 — Individual contracts don't specify output file paths
**Severity:** LOW
**Category:** Completeness
**Source:** analysis-output-contract.md, recommendations-output-contract.md, sprintplan-output-contract.md, guardrails-output-contract.md

**Description:**
The four core output contracts define the markdown structure and JSON schema but do not specify WHERE the output file should be written. The session-state contract defines paths (e.g., `.github/docs/phase-1/01-business-analyst.md`) but the individual contracts are silent on location, forcing agents to rely on session-state knowledge for file placement.

Newer contracts (test, PR/review, KPI, etc.) DO specify output file locations.

**Fix:** Add an "OUTPUT FILE" section to the four core contracts specifying the path pattern: `.github/docs/phase-[N]/[NN]-[agent-slug]-[deliverable-type].md`

---

### C2-023 — Recommendations/sprintplan/guardrails JSON handoff_checklist references mode_consistent without metadata mode
**Severity:** MEDIUM
**Category:** Consistency
**Source:** `recommendations-output-contract.md`, `guardrails-output-contract.md` JSON schemas

**Description:**
Both contracts include `"mode_consistent": "true"` in their JSON `handoff_checklist` object. However, their JSON metadata schema has no `"mode"` field, making `mode_consistent` unverifiable.

The analysis contract correctly includes both `"mode": "CREATE | AUDIT"` in metadata AND `"mode_consistent"` in handoff_checklist.

**Fix:** Add `"mode": "CREATE | AUDIT"` to the metadata object of recommendations, sprintplan, and guardrails JSON schemas.

---

### C2-024 — Audit playbook misleading agent count
**Severity:** MEDIUM
**Category:** Alignment
**Source:** `commercial-software-audit-playbook.md` Phase 5 Required Input

**Description:**
The audit playbook says: "Approved sprint plans from all **20 specialist agents**"
While the agent count (5 + 6 + 6 + 3 = 20) is arithmetic correct, it's misleading because sprint plans are consolidated per discipline/phase, not produced per individual agent. Each phase produces one sprint plan (not per-agent plans), so the reference should say "from all 4 phases" or "from all specialist agents across 4 phases."

**Fix:** Change to: "Approved sprint plans from all 4 phases (produced by the 20 specialist agents)"

---

## CROSS-REFERENCE MATRIX: Which contracts are affected by each finding

| Finding | Contracts requiring changes |
|---------|---------------------------|
| C2-001 | agent-index.md |
| C2-002 | onboarding-output-contract.md |
| C2-003 | risk-output-contract.md |
| C2-004 | session-state-contract.md, sprintplan-output-contract.md, scope-change-output-contract.md |
| C2-005 | agent-handoff-contract.md |
| C2-006 | 14 contracts (all except analysis, recommendations, sprintplan, guardrails, handoff, implementation, questionnaire, tooling, session-state, human-escalation, agent-index) |
| C2-007 | session-state-contract.md |
| C2-008 | software-creation-playbook.md, commercial-software-audit-playbook.md |
| C2-009 | critic-output-contract.md |
| C2-010 | test-output-contract.md OR implementation-output-contract.md |
| C2-011 | software-creation-playbook.md, commercial-software-audit-playbook.md |
| C2-012 | 13 contracts (see finding detail) |
| C2-013 | recommendations-output-contract.md, sprintplan-output-contract.md, guardrails-output-contract.md |
| C2-014 | implementation-output-contract.md, both playbooks |
| C2-015 | New contract or extension to session-state-contract.md |
| C2-016 | session-state-contract.md |
| C2-017 | 14 newer contracts (adopt unified format) |
| C2-018 | Both playbooks |
| C2-019 | agent-index.md |
| C2-020 | session-state-contract.md |
| C2-021 | scope-change-output-contract.md |
| C2-022 | analysis, recommendations, sprintplan, guardrails contracts |
| C2-023 | recommendations, sprintplan, guardrails contracts |
| C2-024 | commercial-software-audit-playbook.md |

---

## RECOMMENDED FIX PRIORITY

### Batch 1 — CRITICAL + quick wins (fix first)
1. **C2-001** — Add 14 missing contracts to agent-index.md (10 min edit)
2. **C2-002** — Replace onboarding contract's session-state section with canonical reference
3. **C2-007** — Sync session-state escalation type enum (5 min edit)
4. **C2-019** — Fix Feature Request entry in agent-index (2 min edit)

### Batch 2 — HIGH severity
5. **C2-003** — Fix risk contract category count
6. **C2-004** — Canonicalize story status vocabulary (multi-file edit)
7. **C2-005** — Refactor handoff contract deliverables to generic structure
8. **C2-006** — Add ORC-35 inline summaries to 14 contracts (template, batch apply)
9. **C2-008** — Add 4 missing agents to playbook Phase 5 sections

### Batch 3 — MEDIUM severity
10. **C2-009** through **C2-016**, **C2-023**, **C2-024**

### Batch 4 — LOW severity
11. **C2-017** through **C2-022**
