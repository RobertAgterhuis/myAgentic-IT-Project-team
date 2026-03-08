# Sprints & Implementation (Phase 5)

## What is Phase 5?

Phase 5 is where the designs from Phases 1–4 become working software. The system breaks the work into **sprints** — time-boxed implementation cycles where stories (units of work) flow through a pipeline of agents.

Phase 5 only begins after:
1. All four design phases are complete.
2. The Synthesis Agent has produced 6 documents (master report, 4 department reports, cross-team blocker matrix).
3. You have **APPROVED** all synthesis outputs.
4. The GitHub Integration Agent has published all stories as GitHub Issues.

---

## Sprint lifecycle

Each sprint follows this cycle:

```
Sprint Gate (you choose IMPLEMENT or BACKLOG)
  ↓
Definition of Ready check (are stories ready?)
  ↓
Implementation Agent (writes code per story)
  ↓
Test Agent (validates code + decision compliance)
  ↓
PR/Review Agent (reviews diff, secret scan, merge)
  ↓
KPI Agent (measures sprint metrics)
  ↓
Documentation Agent (updates manuals + changelog)
  ↓
GitHub Integration Agent (closes issues, updates board)
  ↓
Retrospective Agent (velocity analysis, lessons learned)
  ↓
Next Sprint Gate
```

This is a **closed loop** — the Orchestrator controls each handoff. You don't need to trigger agents manually.

---

## The Sprint Gate

The Sprint Gate is the most important decision point in the system. It runs **before every sprint** and determines whether the sprint proceeds.

### What happens at the gate

1. **Decision check** — The Orchestrator reads all open decisions from `.github/docs/decisions.md` and the decision category files.
   - `OPEN` + `HIGH` priority + scope matches this sprint → **gate blocks** until you answer.
   - `OPEN` + `MEDIUM`/`LOW` → reported as informational, no block.
   - All `DECIDED` items are loaded as constraints for the sprint.

2. **Sprint presentation** — You see:
   ```
   SPRINT GATE – SP-1: "Core Authentication"
   Goal: Implement user login, registration, and session management
   Stories: 5 | Story points: 21 | Depends on: NONE

   Choose an action:
     [1] IMPLEMENT – activate this sprint now
     [2] BACKLOG – defer this sprint
   ```

3. **Your choice:**
   - **IMPLEMENT** → Sprint starts. Stories are assigned to agents.
   - **BACKLOG** → Sprint is deferred. All dependent sprints are also deferred (cascade). The system moves to the next queued sprint.

### When the gate blocks

If you have an unanswered `HIGH` priority decision whose scope matches the sprint, you'll see:

```
⚠️ SPRINT GATE BLOCKED – Outstanding decision required
Decision ID: DEC-007
Question: Which database engine for user storage?
Scope: SP-1
→ Answer via .github/docs/decisions.md or the web UI Decisions tab.
→ Type RESUME to restart the Sprint Gate.
```

The sprint cannot proceed until you answer or defer the decision.

### Lessons learned injection

If previous sprints have completed, the Orchestrator also loads the top-3 lessons from `lessons-learned.md` and adjusts story point estimates based on actual velocity data.

---

## Story types

Not all stories go through the full code pipeline. The system recognizes these types:

| Type | Pipeline | Your role |
|------|----------|-----------|
| **CODE** | Implementation → Test → PR/Review | Automated. You review PRs. |
| **INFRA** | Implementation → Test → PR/Review | Automated. Infrastructure changes. |
| **CONFIG** | Implementation → Test → PR/Review | Automated. Configuration-only changes. |
| **DESIGN** | Manual | You create the design artifact. Mark as COMPLETED or BLOCKED at the next Sprint Gate. |
| **CONTENT** | Manual | You write the content. Mark as COMPLETED or BLOCKED at the next Sprint Gate. |
| **ANALYSIS** | Manual | You produce the analysis document. Mark at Sprint Gate. |
| **DOCS** | Documentation Agent | Automated. Agent updates manuals. |

Manual story types (DESIGN, CONTENT, ANALYSIS) **never block** code stories in the same sprint. If a code story depends on a manual deliverable that isn't ready, the code story is deferred to the next sprint.

---

## Definition of Ready

Before a story enters implementation, it must pass a readiness check:

**For CODE and INFRA stories:**
- At least 2 concrete acceptance criteria
- All dependencies resolved or explicitly accepted
- Completable in one sprint (≤ 8 story points)

**For DOCS, CONFIG, and other non-CODE stories:**
- At least 1 acceptance criterion
- A deliverable path (file or artifact location)
- An assigned owner

A story that fails the Definition of Ready is moved to the next sprint automatically. After 2 consecutive failures, you're asked to **SPLIT**, **OVERRIDE**, **REMOVE**, or **DEFER** the story.

---

## Decision enforcement during sprints

Every `DECIDED` item from your decisions is enforced at three checkpoints:

| Checkpoint | Agent | What happens on violation |
|-----------|-------|--------------------------|
| Before coding | Implementation Agent | Halts and reports the conflict |
| During testing | Test Agent | Returns code to Implementation Agent |
| At PR review | PR/Review Agent | Blocks merge until resolved |

If a story requires a technology whose decisions are `DEFERRED` (e.g. Docker, .NET), the system automatically activates that decision category without needing your input.

For full details, see the [Decisions help file](decisions.md).

---

## The GitHub board

The GitHub Integration Agent manages a Kanban board with 5 columns:

| Column | Stories land here when… |
|--------|------------------------|
| **Backlog** | Sprint is queued or deferred |
| **Ready** | Sprint is queued and story has no blockers |
| **In Progress** | Sprint is active, story is being implemented |
| **In Review** | A PR is open for the story |
| **Done** | PR is merged and tests pass |

After every sprint, the agent closes implemented issues and labels blocked ones. You can track progress at any time from your GitHub project board.

### Issue structure

Each published Issue includes:
- Sprint ID and story ID in the title
- Story type, priority, and acceptance criteria in the body
- Labels for type (`type: code`, `type: infra`, etc.) and priority (`priority: high`, etc.)
- Sprint milestone assignment

---

## Sprint completion

After the PR/Review Agent merges code, several things happen automatically:

1. **KPI Agent** measures sprint metrics (velocity, defect rate, code coverage, etc.) and writes a report to `.github/docs/metrics/sprint-[SP-N]-kpi.json`.
2. **Documentation Agent** updates `docs/user-manual.md`, `docs/technical-manual.md`, and `CHANGELOG.md` based on what was implemented.
3. **GitHub Integration Agent** closes completed issues and updates the board.
4. **Retrospective Agent** analyzes the sprint, calculates velocity, detects patterns, and writes lessons learned.

Only after the retrospective is complete does the next Sprint Gate open.

---

## Velocity and learning

The Retrospective Agent maintains two cumulative files:

- **`velocity-log.json`** — Machine-readable velocity data per sprint (planned vs. actual story points, completion rate).
- **`lessons-learned.md`** — Human-readable lessons, ranked by urgency, injected into the next sprint's context.

If velocity drops below 80% for 2+ consecutive sprints, the Orchestrator warns you at the Sprint Gate and suggests adjusting capacity.

---

## Backlogged sprints

When you choose **BACKLOG** at a Sprint Gate:
- The sprint and all its dependents are deferred.
- Backlogged sprints are re-presented after every active sprint completes.
- If all remaining sprints are backlogged, the Orchestrator asks: *"All remaining sprints are in the backlog. Do you want to implement a sprint after all, or is the current implementation cycle complete?"*

---

## When Phase 5 ends

Phase 5 is complete when:
- All sprints are either IMPLEMENTED or permanently BACKLOGGED.
- Every implemented sprint has: secret scan PASSED, KPI report written, PRs merged, manuals updated, GitHub board updated, retrospective complete.
- No unresolved `BLOCKING` items remain in the sprint plan.

---

## Quick reference

| What you do | When |
|------------|------|
| Answer OPEN HIGH decisions | Before sprint start (Sprint Gate blocks) |
| Choose IMPLEMENT or BACKLOG | At every Sprint Gate |
| Review PRs | When the PR/Review Agent creates them |
| Complete DESIGN/CONTENT/ANALYSIS stories | During the sprint, mark at next Sprint Gate |
| Read retrospective and KPI reports | After each sprint completes |
