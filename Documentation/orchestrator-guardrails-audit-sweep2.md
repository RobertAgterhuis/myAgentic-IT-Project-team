# Orchestrator & Global Guardrails — Audit Sweep 2

> Auditor: Systems Architect
> Date: 2026-03-06
> Scope: `.github/skills/00-orchestrator.md` (ORC-01 – ORC-37) + `.github/docs/guardrails/00-global-guardrails.md` (G-GLOB-01 – G-GLOB-56)
> Basis: All items from Sweep 1 (O1–O10, O13–O17, O19, O24) are EXCLUDED — only NEW findings.

---

## SUMMARY TABLE

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| O2-001 | CRITICAL | CrossRef | Agent-index CONTRACTS REFERENCE missing 15 contracts |
| O2-002 | CRITICAL | MissingRule | TESTING → REVIEW transition missing from story state machine |
| O2-003 | CRITICAL | MissingRule | Phase 5 availability for PARTIAL / COMBO cycles undefined |
| O2-004 | HIGH | MissingRule | No retry budget for Critic/Risk validation loop |
| O2-005 | HIGH | Conflict | G-GLOB-16 "redo on input change" vs ORC-33 "never re-run completed agents" |
| O2-006 | HIGH | MissingRule | No priority ordering between ORC-28 and ORC-29 concurrent trigger files |
| O2-007 | HIGH | MissingRule | No concurrency protocol for HOTFIX + active regular sprint |
| O2-008 | HIGH | Completeness | ORC-22 LESSON_CANDIDATE trigger table incomplete |
| O2-009 | HIGH | MissingRule | No corruption handling for web UI signal files |
| O2-010 | MEDIUM | Ambiguity | Step numbering collision in "On Phase 5 sprint start" (two step 6) |
| O2-011 | MEDIUM | MissingRule | No meta-validation of Critic/Risk Agent output thoroughness |
| O2-012 | MEDIUM | MissingRule | REEVALUATE state missing from session-state transition diagram |
| O2-013 | MEDIUM | MissingRule | No Definition of Ready for non-CODE stories |
| O2-014 | MEDIUM | MissingRule | No SCOPE CHANGE → FEATURE cycle interaction rule |
| O2-015 | MEDIUM | Completeness | pipeline-progress.json referenced in ORC-30 with no schema/contract |
| O2-016 | MEDIUM | MissingRule | No maximum sprint duration or early-termination mechanism |
| O2-017 | LOW | Scalability | command-queue.json holds one command — no audit history |
| O2-018 | LOW | Scalability | scope_change_history array unbounded |
| O2-019 | LOW | Ambiguity | G-GLOB-42 sprint capacity assumption — no owner specified |
| O2-020 | LOW | Ambiguity | HOTFIX scope field empty-array semantics undocumented |
| O2-021 | LOW | Ambiguity | ORC-30 exception list does not address lightweight end-of-sprint agents |

---

## DETAILED FINDINGS

---

### O2-001 — Agent-index CONTRACTS REFERENCE missing 15 contracts
**Severity:** CRITICAL | **Category:** CrossRef

**Description:**
`.github/docs/agent-index.md` § CONTRACTS REFERENCE lists only 10 contracts (the original set). After sweep 1 item O5, 15 additional contracts were created on disk:

| Missing from index |
|---|
| `brand-assets-output-contract.md` |
| `critic-output-contract.md` |
| `documentation-output-contract.md` |
| `feature-output-contract.md` |
| `github-integration-output-contract.md` |
| `kpi-output-contract.md` |
| `onboarding-output-contract.md` |
| `pr-review-output-contract.md` |
| `reevaluate-output-contract.md` |
| `retrospective-output-contract.md` |
| `risk-output-contract.md` |
| `scope-change-output-contract.md` |
| `storybook-output-contract.md` |
| `synthesis-output-contract.md` |
| `test-output-contract.md` |

Any agent that looks up its contract via the agent-index will fail to find it. ORC-35 step 7 says "Agents without output contracts: validated only for HANDOFF CHECKLIST completeness", so these 15 agents may be under-validated despite their contracts existing on disk.

**Fix:** Add all 25 contracts to `.github/docs/agent-index.md` § CONTRACTS REFERENCE. Consider generating the index dynamically or adding a guardrail requiring the index to stay in sync after contract creation.

---

### O2-002 — TESTING → REVIEW transition missing from story state machine
**Severity:** CRITICAL | **Category:** MissingRule

**Description:**
The story state machine in `session-state-contract.md` defines:
```
TESTING → COMPLETED (tests pass) | TEST_FAILED
```
But the orchestrator pipeline is: Implementation → **Test Agent** → **PR/Review Agent** → merge. After the Test Agent approves, the story should move to `REVIEW` status before reaching `COMPLETED`. The transition `TESTING → REVIEW` does not exist in the state machine.

Additionally, the mapping table says:
> Test `APPROVED` → `COMPLETED` (for story-level; **or `REVIEW` if PR review follows**)

The "or" makes this ambiguous — for CODE/INFRA stories, PR review **always** follows, so the mapping should always be `REVIEW`, but the state machine only allows `TESTING → COMPLETED`.

**Impact:** The Orchestrator cannot correctly track story status between the Test Agent handoff and PR/Review Agent handoff. Stories jump from TESTING to COMPLETED, skipping the REVIEW state entirely.

**Fix:**
1. Add `TESTING → REVIEW` as a valid transition (when tests pass AND PR review follows)
2. Keep `TESTING → COMPLETED` only for edge cases where no PR review is required (if any exist)
3. Resolve the ambiguous mapping: for CODE/INFRA stories, Test APPROVED always maps to `REVIEW`

---

### O2-003 — Phase 5 availability for PARTIAL / COMBO cycles undefined
**Severity:** CRITICAL | **Category:** MissingRule

**Description:**
The partial cycle sequence says:
```
→ Synthesis Agent (mode: PARTIAL)
→ Optional: GitHub Integration Agent to publish stories from this report
```
This implies Phase 5 (sprint implementation) is possible for partial cycles, but:
1. No rule explicitly enables or disables Sprint Gate / Phase 5 for partial cycles
2. A `CREATE UX` partial cycle would result in UX sprint stories but **no `component-inventory.md`** (Storybook only runs after Marketing). ORC-18 would then block every UI component story in Phase 5
3. A `CREATE BUSINESS` partial cycle produces strategy stories (type ANALYSIS/CONTENT) but no CODE stories — is Phase 5 meaningful?
4. A `CREATE TECH` cycle without UX/Marketing would produce CODE stories but no design assets or brand guidelines

**Fix:** Add **ORC-38: Phase 5 eligibility for PARTIAL/COMBO cycles** with rules:
- PARTIAL cycle: Phase 5 is available only if the sprint plan contains stories whose `story_type` is executable within the completed disciplines
- If MARKETING is not in scope and sprint plan contains UI stories: Orchestrator warns user and either (a) blocks UI stories until MARKETING is added, or (b) allows user to provide component-inventory.md manually
- If BUSINESS-only or ANALYSIS-only sprint: Phase 5 only tracks manual stories (DESIGN/CONTENT/ANALYSIS) — no Implementation Agent activation

---

### O2-004 — No retry budget for Critic/Risk validation loop
**Severity:** HIGH | **Category:** MissingRule

**Description:**
ORC-35 defines a 3-retry budget for agent contract validation. But the phase-level Critic + Risk validation cycle has no retry limit:
```
Phase agent produces output → Critic/Risk FAILED → return to agent → re-produce → Critic/Risk FAILED → return to agent → ...
```
This loop can repeat indefinitely if the agent cannot satisfy the Critic/Risk requirements.

**Fix:** Add to the "On phase completion" section: "Maximum 3 Critic/Risk validation cycles per phase. After 3 failures, escalate via Human Escalation Protocol type `OTHER` with the outstanding Critic/Risk findings. Options: (1) ACCEPT_WITH_RISK — proceed with documented validation gaps; (2) MANUAL — user addresses the findings; (3) RETRY_SIMPLIFIED — one more attempt with reduced Critic thresholds."

---

### O2-005 — G-GLOB-16 "redo on input change" vs ORC-33 "never re-run completed agents"
**Severity:** HIGH | **Category:** Conflict

**Description:**
- **G-GLOB-16:** "Redo every analysis step if the input has changed since your last run. Never cache results."
- **ORC-33 step 5:** "Never re-run completed agents. Only agents NOT in `completed_agents` are eligible for activation."

If a DECIDED item in `decisions.md` changes an input assumption for a completed Phase 1 agent while Phase 2 is running, G-GLOB-16 says redo the Phase 1 analysis, but ORC-33 forbids re-running completed agents. The intended mechanism is REEVALUATE, but this carve-out is never stated explicitly.

**Fix:** Add a clarification clause to G-GLOB-16: "Within a running cycle, this rule applies to the active agent's own analysis steps. For completed agents in earlier phases, input changes are handled exclusively through the `REEVALUATE` command (see ORC rules). ORC-33 takes precedence within a running session."

---

### O2-006 — No priority ordering between ORC-28 and ORC-29 concurrent trigger files
**Severity:** HIGH | **Category:** MissingRule

**Description:**
Both ORC-28 (reevaluate-trigger.json) and ORC-29 (command-queue.json) are checked "at every session start and before every Sprint Gate." If both files have `status: "PENDING"` simultaneously, the Orchestrator has no ordering rule.

Scenarios:
- `reevaluate-trigger.json` = REEVALUATE ALL + `command-queue.json` = SCOPE CHANGE TECH → which runs first?
- `command-queue.json` = FEATURE X + `reevaluate-trigger.json` = REEVALUATE BUSINESS → race condition

A SCOPE CHANGE could invalidate a REEVALUATE, or a REEVALUATE could be wasted effort if a SCOPE CHANGE follows immediately.

**Fix:** Add priority ordering rule: "When both signal files are PENDING, process in this order: (1) SCOPE CHANGE (highest — structural change supersedes re-evaluation) (2) REEVALUATE (3) FEATURE (4) all other commands. If `command-queue.json` contains a SCOPE CHANGE, consume and DISCARD a simultaneous REEVALUATE (set to CONSUMED with note `SUPERSEDED_BY_SCOPE_CHANGE`)."

---

### O2-007 — No concurrency protocol for HOTFIX + active regular sprint
**Severity:** HIGH | **Category:** MissingRule

**Description:**
ORC-23 says: "Orchestrator informs the running regular sprint (if any) about impact and any necessary story adjustments." But "informs" is vague:
1. Is the regular sprint PAUSED during the HOTFIX? Or does it continue in parallel?
2. If the HOTFIX changes files also being modified by a CODE story in the regular sprint, is there a merge conflict protocol?
3. Which takes priority if both attempt to merge a PR?
4. What happens to the regular sprint's Test Agent results if the production codebase changed under it?

**Fix:** Add **ORC-23b: HOTFIX concurrency rules:**
- The regular sprint is NOT paused unless the HOTFIX modifies files that overlap with IN_PROGRESS stories (determined by file-path intersection)
- On overlap: affected stories are set to `BLOCKED: HOTFIX-[N] in progress` and resumed after HOTFIX merge
- After HOTFIX merge: Test Agent MUST re-run tests for all IN_PROGRESS stories in the regular sprint (baseline has changed)
- HOTFIX PRs always merge before regular sprint PRs

---

### O2-008 — ORC-22 LESSON_CANDIDATE trigger table incomplete
**Severity:** HIGH | **Category:** Completeness

**Description:**
ORC-22 lists 7 triggering events. The following significant events are missing:

| Missing Event | Source Rule | Recommended Type |
|---|---|---|
| `AGENT_FAILURE` (agent failed 3× and was skipped/manual) | ORC-37 | `AGENT_FAILURE` |
| `PERSISTENT_CONTRACT_FAILURE` (3× contract validation failure) | ORC-35 | `CONTRACT_FAILURE` |
| HOTFIX completion | ORC-23 (says "mandatory" but not in ORC-22 table) | `HOTFIX_COMPLETED` |
| `SCOPE_CHANGE_HOLD` affecting >5 stories | ORC-27 | `SCOPE_DISRUPTION` |
| `READY_OVERRIDE` (forced DoR bypass) | ORC-14 | `RISK_ACCEPTED` |

ORC-23 independently mandates a LESSON_CANDIDATE for every HOTFIX, but this requirement exists in its own rule rather than in the canonical ORC-22 table. This creates a fragmented source of truth.

**Fix:** Add the 5 missing events to the ORC-22 table and consolidate ORC-23's standalone LESSON_CANDIDATE mandate as a row reference to ORC-22.

---

### O2-009 — No corruption handling for web UI signal files
**Severity:** HIGH | **Category:** MissingRule

**Description:**
ORC-09 has explicit corruption handling for `session-state.json` (archive → recover → fresh start). But `reevaluate-trigger.json` (ORC-28) and `command-queue.json` (ORC-29) have no equivalent. If the web UI's `server.js` crashes mid-write (e.g., power loss, process kill), these files could be truncated JSON. The Orchestrator would then fail to parse them with no recovery procedure.

**Fix:** Add to ORC-28 and ORC-29: "If the signal file exists but cannot be parsed as valid JSON, log `SIGNAL_FILE_CORRUPTED: [filename]`, delete the corrupted file, and inform the user: `⚠️ [filename] was corrupted and has been removed. Re-submit the command via the web UI or Copilot Chat.` Do NOT block the session."

---

### O2-010 — Step numbering collision in "On Phase 5 sprint start"
**Severity:** MEDIUM | **Category:** Ambiguity

**Description:**
Under "On Phase 5 sprint start" the numbered steps are:
```
1. Verify Synthesis Final Report is fully APPROVED
2. Select stories for sprint SP-N
3. Identify parallel tracks
4. Read story_type and route
5. Decision injection (mandatory)
6. Definition of Ready check ← FIRST step 6
6. Lessons learned injection  ← SECOND step 6 (should be 7)
7. Activate Implementation Agent ← should be 8
8. Document sprint start        ← should be 9
```

**Fix:** Renumber steps 6b through 9 correctly.

---

### O2-011 — No meta-validation of Critic/Risk Agent output thoroughness
**Severity:** MEDIUM | **Category:** MissingRule

**Description:**
The Critic and Risk Agents are the quality gates for every phase and every sprint. But no rule validates the quality of *their* output. A Critic Agent that always returns `PASSED` with zero findings (rubber-stamping) would go undetected.

ORC-35 technically applies to all agents ("When an agent completes and hands off output"), but the "On phase completion" orchestrator flow doesn't apply ORC-35 to Critic/Risk — it only checks PASSED/FAILED.

**Fix:** Add: "The Orchestrator validates Critic/Risk output per ORC-35. Additionally: if the Critic Agent returns PASSED with zero findings on a phase that contains any `UNCERTAIN:` or `INSUFFICIENT_DATA:` items, the Orchestrator flags `CRITIC_REVIEW_SUSPICIOUS: zero findings despite open uncertainty items` and requires the Critic to explicitly justify the PASSED verdict for each open item."

---

### O2-012 — REEVALUATE state missing from session-state transition diagram
**Severity:** MEDIUM | **Category:** MissingRule

**Description:**
The session-state contract's STATE MACHINE section defines `Every status → SCOPE_CHANGE` but does NOT define `Every status → REEVALUATE`, even though `REEVALUATE` is a valid `status` value and `cycle_type`. The REEVALUATE flow changes the active phase and agent, but has no defined transitions in or out.

**Fix:** Add to the state machine:
```
Every status → REEVALUATE      (on REEVALUATE command — preserves prior cycle_type)
REEVALUATE → [previous status]  (after Re-evaluation Report approved and Sprint Gate reconciled)
```

---

### O2-013 — No Definition of Ready for non-CODE stories
**Severity:** MEDIUM | **Category:** MissingRule

**Description:**
"On Phase 5 sprint start" step 6 says: "Definition of Ready check (mandatory per CODE/INFRA story)." DESIGN, CONTENT, and ANALYSIS stories bypass the DoR check entirely. A DESIGN story with no deliverable path, no acceptance criteria, and no assigned owner would still enter `IN_PROGRESS`.

**Fix:** Add a lightweight DoR for non-CODE stories:
- Story has at least 1 concrete acceptance criterion
- Story references a deliverable file path
- Story has an assigned owner (user or external team)
On failure: mark as `NOT_READY` per ORC-14.

---

### O2-014 — No SCOPE CHANGE → FEATURE cycle interaction rule
**Severity:** MEDIUM | **Category:** MissingRule

**Description:**
ORC-27 step 4 says "PAUSE Sprint Gate for all IN_PROGRESS and QUEUED sprints in the affected dimension." Feature cycles create isolated sprint plans in `Workitems/[FEATURENAME]/`. It's unclear whether:
1. A feature sprint in the affected dimension is also paused
2. The feature's isolated backlog is also scanned for `SCOPE_CHANGE_HOLD` tagging
3. A feature whose premise depends on the old scope is still valid after the scope change

**Fix:** Add to ORC-27: "Scope change hold scanning includes feature backlogs in `Workitems/*/`. Feature sprints in the affected dimension are set to `SCOPE_CHANGE_HOLD SC-[N]`. After reconciliation, the Feature Agent reassess feature viability against the new scope. If the feature premise is invalidated, escalate via Human Escalation Protocol type `SCOPE_DECISION` with option to CANCEL the feature."

---

### O2-015 — pipeline-progress.json referenced in ORC-30 with no schema/contract
**Severity:** MEDIUM | **Category:** Completeness

**Description:**
ORC-30 step 3: "Updates `.github/docs/session/pipeline-progress.json` for the web UI." This file:
- Has no schema defined in any contract
- Has no guardrail governing its content
- Is the sole data source for the web UI's progress visualization
- Could become out of sync with `session-state.json` with no mechanism to detect or correct drift

**Fix:** Either (a) define a `pipeline-progress-contract.md` with the JSON schema, or (b) eliminate the file and have the web UI read directly from `session-state.json` (reducing dual-source risk). Option (b) is recommended.

---

### O2-016 — No maximum sprint duration or early-termination mechanism
**Severity:** MEDIUM | **Category:** MissingRule

**Description:**
ORC-03 defines the sprint loop but has no timeout. If an Implementation Agent is stuck on a complex story with repeated test failures, the sprint runs indefinitely. There's no:
- Maximum calendar duration per sprint
- Maximum number of Test Agent → Implementation Agent return cycles per story
- Mechanism for the Orchestrator to force-close a sprint with remaining BLOCKED stories

**Fix:** Add: "Maximum 5 test-fix cycles per story per sprint. After 5 cycles, the story is marked `BLOCKED: test loop exceeded` and escalated. The Orchestrator may force-close a sprint if >50% of stories are BLOCKED, moving them to the next sprint and writing a Sprint Completion Report (PARTIAL)."

---

### O2-017 — command-queue.json holds one command — no audit history
**Severity:** LOW | **Category:** Scalability

**Description:**
`command-queue.json` is a single-entry file. When consumed, `status` is set to `CONSUMED` and `consumed_at` is filled. But the next command overwrites the file entirely. There is no log of previously submitted commands.

**Fix:** Add an `command-history` array to `session-state.json` or a separate `command-history.json` file. Each consumed command is appended with timestamp and outcome.

---

### O2-018 — scope_change_history array unbounded
**Severity:** LOW | **Category:** Scalability

**Description:**
`scope_change_history` in session-state.json grows by one entry per SCOPE CHANGE. After >5 scope changes:
- The array becomes large and increases context consumption
- Sprint Gate Reconciliation must consider cumulative hold/cancel/requeue from all prior changes
- The Synthesis Agent's "Scope Change History" section becomes unwieldy
- `tickets_on_hold` / `tickets_cancelled` / `tickets_requeued` across entries may reference the same tickets, creating cross-reference complexity

**Fix:** Add a guardrail: "After 5 scope changes in a single session, the Orchestrator warns: `⚠️ High scope change frequency (SC-[N]). Consider a full REEVALUATE ALL or project reset.` After 10 scope changes: require user confirmation to continue (`SCOPE_CHANGE_FATIGUE: project stability at risk`)."

---

### O2-019 — G-GLOB-42 sprint capacity assumption — no owner specified
**Severity:** LOW | **Category:** Ambiguity

**Description:**
G-GLOB-42: "Sprint planning is always based on an explicit capacity assumption (expressed in story points or hours)." But no rule specifies who defines the capacity:
- The Product Manager (34) seems logical but is a design-phase agent, not a Phase 5 agent
- The Sprint Plan output contract requires capacity but doesn't say who provides it
- The Orchestrator doesn't ask the user for capacity at Sprint Gate

**Fix:** Add to Sprint Gate flow: "The Orchestrator prompts the user for sprint capacity at the first Sprint Gate. Capacity is stored in session-state.json as `sprint_capacity_sp` (story points) and reused for subsequent sprints unless the user overrides. If `velocity-log.json` contains ≥2 sprints, the Orchestrator suggests capacity based on average measured velocity."

---

### O2-020 — HOTFIX scope field empty-array semantics undocumented
**Severity:** LOW | **Category:** Ambiguity

**Description:**
The canonical mapping defines HOTFIX as `scope: []`. For all other cycle types, `scope` determines which phase agents to activate. For HOTFIX, no phase agents run — the pipeline is Implementation → Test → PR/Review → KPI → Documentation → GitHub Integration → Retrospective. But the empty array is never explicitly documented as meaning "skip phase agents, run implementation pipeline only."

**Fix:** Add a note to the canonical mapping table: "HOTFIX: `scope: []` indicates no design-phase agents are activated. The Orchestrator routes directly to the Phase 5 implementation pipeline (ORC-23)."

---

### O2-021 — ORC-30 exception list does not address lightweight end-of-sprint agents
**Severity:** LOW | **Category:** Ambiguity

**Description:**
ORC-30 exceptions allow Critic + Risk and Questionnaire Agent to run in one turn. But the end-of-sprint chain — KPI Agent → Documentation Agent → GitHub Integration Agent → Retrospective Agent — involves 4 sequential lightweight agents. With one-agent-per-turn, this requires 4 user interactions of "CONTINUE" just for post-merge bookkeeping.

The rule doesn't clarify whether these short agents (each producing small JSON or markdown files) may be batched.

**Fix:** Add an exception: "Post-merge bookkeeping agents (KPI Agent, Documentation Agent, GitHub Integration Agent sprint update, Retrospective Agent) MAY run as a batch in a single turn when each agent's output is <100 lines and no BLOCKED handoff occurs. If any agent produces a BLOCKED or DOC_MISSING handoff, the batch stops and the Orchestrator yields."

---

## CROSS-REFERENCE INTEGRITY CHECKS

| Reference in ORC | Target | Status |
|---|---|---|
| ORC-18 → `.github/docs/storybook/component-inventory.md` | Generated by Storybook Agent (31) | ✅ Defined |
| ORC-21 → `.github/docs/decisions.md` | Manual/web UI file | ✅ Defined |
| ORC-25 → `.github/docs/contracts/questionnaire-output-contract.md` | Disk file | ✅ Exists |
| ORC-27 → `.github/skills/37-scope-change-agent.md` | Disk file | ✅ Exists |
| ORC-28 → `.github/docs/session/reevaluate-trigger.json` | Schema in session-state-contract | ✅ Defined |
| ORC-29 → `.github/docs/session/command-queue.json` | Schema in session-state-contract | ✅ Defined |
| ORC-30 → `.github/docs/session/pipeline-progress.json` | **No schema anywhere** | ❌ **O2-015** |
| ORC-35 → `.github/docs/contracts/` per agent | 15 contracts exist on disk but **not in agent-index** | ❌ **O2-001** |
| G-GLOB-56 → ORC-25 | Consistent | ✅ Aligned |
| Session-state `REEVALUATE` status → state machine transitions | **Not defined** | ❌ **O2-012** |
| Story state machine `TESTING → ?` → actual pipeline flow | **REVIEW transition missing** | ❌ **O2-002** |

---

## STATISTICS

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 6 |
| MEDIUM | 7 |
| LOW | 5 |
| **Total** | **21** |

| Category | Count |
|----------|-------|
| MissingRule | 10 |
| Completeness | 3 |
| Ambiguity | 4 |
| Conflict | 1 |
| CrossRef | 1 |
| Scalability | 2 |
