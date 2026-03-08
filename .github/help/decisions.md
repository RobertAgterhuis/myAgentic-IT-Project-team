# Decisions — Complete Guide

## What are decisions?

Decisions are the single source of truth for every explicit choice that governs how the agentic team builds your software. They live in `.github/docs/decisions.md` (the **index file**) and in per-technology **category files** under `.github/docs/decisions/`. Every agent — from the Implementation Agent writing code to the PR/Review Agent approving merges — reads these decisions and treats `DECIDED` items as **hard constraints**.

There are two entry types you can create:

- **DECIDED** — A choice you have already made (e.g. "Use PostgreSQL for the database"). The agents will enforce it immediately.
- **OPEN QUESTION** — Something you want the agentic team to answer or that requires your input before a sprint can proceed.

---

## Decision lifecycle

### Statuses

| Status | Meaning | Orchestrator behavior |
|--------|---------|----------------------|
| `OPEN` | Awaiting a decision or answer | **HIGH** priority + sprint scope match → blocks Sprint Gate. **MEDIUM/LOW** → reported but non-blocking. |
| `DECIDED` | Decision has been made and recorded | Injected as a hard constraint into every relevant agent at sprint start. |
| `DEFERRED` | Postponed for later | Ignored by the Orchestrator until the technology is actually needed (see *Deferred categories* below). |
| `EXPIRED` | Deadline passed without resolution | Ignored entirely. |

### Typical flow

```
You create an item (DECIDED or OPEN)
  ↓
OPEN items are presented at the next Sprint Gate
  ↓  answer it → status becomes DECIDED
  ↓  postpone → status becomes DEFERRED
DECIDED items become hard constraints for all agents
```

### Immutability rule

Once a decision is `DECIDED`, agents treat it as law. To change it:
1. Edit the decision text via the web UI or the markdown file.
2. The changed decision takes effect at the **next Sprint Gate** — code already merged under the old decision is not retroactively changed.
3. If you want to undo a decision entirely, set its status to `DEFERRED` or remove it.

---

## Priority levels

| Priority | Impact |
|----------|--------|
| **HIGH** | Can block a Sprint Gate. If `OPEN`, the sprint cannot start until you answer. |
| **MEDIUM** | Reported to you at the Sprint Gate but does not block progress. |
| **LOW** | Informational. Listed but never blocks. |

Blocking decisions have a **pulsing red badge** and a **red left border** in the web UI.

---

## Decision categories (technology stacks)

Decided items are organized by technology into separate files under `.github/docs/decisions/`. Each file has a header that includes its **Status**:

| Category status | Meaning |
|-----------------|---------|
| **ACTIVE** | All decisions in this file are enforced as hard constraints. |
| **PARTIAL** | Most decisions are enforced; some individual rows are marked `DEFERRED` within the file. |
| **DEFERRED** | The entire category is inactive. Agents skip the file completely until the technology is needed. |

### Which categories exist?

The **Category Registry** table in `.github/docs/decisions.md` lists all categories with their file, decision count, and status. Categories cover stacks like Transformation, GitHub Actions, TypeScript/ESLint, Cross-cutting, Bicep/IaC, Azure DevOps, .NET, Docker, Vite, and NextJS (among others as the project evolves).

### Deferred categories — automatic activation

Deferred categories are **not ignored forever**. When any agent detects that the codebase now requires a deferred technology (e.g. a story needs Docker), the following happens automatically:

1. The agent reports `DEFERRED_TECH_REQUIRED` or `DEFERRED_TECH_DETECTED` to the Orchestrator.
2. The Orchestrator **auto-activates** the category (changes `DEFERRED` → `ACTIVE` in both the category file header and the index table) — **no user action required**.
3. All `DECIDED` items in that category become hard constraints immediately.
4. An audit trail line is appended to the category file with the activation date and trigger.
5. You receive an informational notice: `ℹ️ AUTO-ACTIVATED DEFERRED CATEGORY — [stack name]`.

**To revert an auto-activation:** change the Status back to `DEFERRED` in the category file header via the web UI or a manual edit. To introduce the technology *without* activating its decisions, type `SKIP ACTIVATION [category]` — the Orchestrator records an exception decision.

### Why are some categories deferred?

During Phases 1–4, the agentic team pre-defines decisions for technologies the project *may* need. If the technology isn't used initially, the category stays `DEFERRED` so it doesn't clutter the active constraint set. The moment the technology becomes relevant in Phase 5 (implementation), the category activates on demand.

---

## Sprint Gate interaction

At every Sprint Gate the Orchestrator:

1. **Reads** all `OPEN` + `HIGH` items whose scope matches the upcoming sprint → **blocks** the gate until you answer them.
2. **Lists** `OPEN` + `MEDIUM`/`LOW` items as informational (non-blocking).
3. **Loads** all `DECIDED` items from the index file and all ACTIVE/PARTIAL category files → stores them as **sprint constraints**.
4. **Skips** DEFERRED category files entirely.
5. **Injects** the loaded constraints into every relevant agent's context at sprint start.

### What happens if I don't answer?

- A `HIGH` + `OPEN` decision matching the sprint scope **will not let the sprint start**. You must answer or defer it.
- `MEDIUM`/`LOW` decisions are reported once and do not block.

---

## Enforcement during implementation

Decisions are enforced at **three checkpoints** in Phase 5 (the "triple-check"):

| Checkpoint | Agent | What it does |
|-----------|-------|--------------|
| 1. Before coding | **Implementation Agent** | Loads all `DECIDED` items as hard constraints. Halts if a story requires deferred technology. |
| 2. During testing | **Test Agent** | Validates that the code is consistent with every applicable decision. Returns violations to the Implementation Agent. |
| 3. At PR review | **PR/Review Agent** | Re-checks decision compliance on the diff. Blocks merge on any violation. Also scans for deferred technology markers. |

A violation at any checkpoint produces a `DEC-VIOLATION: [DEC-ID]` entry and the work is returned for remediation before it can proceed.

---

## Relationship to questionnaires

Decisions and questionnaires are complementary:

- **Questionnaires** are generated by the Questionnaire Agent when agents encounter `INSUFFICIENT_DATA:` items. They ask *you* for information.
- **Decisions** are choices you make proactively (or in response to a question). Once answered, they become constraints.

When a questionnaire answer resolves an open decision, the decision is updated to `DECIDED` with a cross-reference (`↔ Q-TECH-001`). The purple badge in the web UI indicates this link.

---

## How to manage decisions in the web UI

### Creating a decision
1. Click **New Decision** in the header.
2. Choose type: `DECIDED` or `OPEN QUESTION`.
3. Set priority (`HIGH`, `MEDIUM`, `LOW`) and scope (e.g. `Phase 2`, `SP-3`, `All sprints`).
4. Enter the decision text and optional notes.
5. Click **Create**.

### Answering an open question
1. Find the open decision card.
2. Type your answer in the answer field.
3. Click **Decide** to convert it to `DECIDED`.

### Editing a decision
Click the **Edit** button on any decision card to modify its priority, scope, text, or notes.

### Filtering decisions
Use the filter bar at the top of the Decisions tab to search by text, priority, or status.

### Activating a deferred category manually
In the Category Registry section of the Decisions tab, click the **Activate** button next to a deferred category. This changes its status to `ACTIVE` immediately.

---

## When should you create decisions proactively?

You don't have to wait for the system to ask. Good moments to add decisions:

- **Before Phase 2 starts** — technology preferences, cloud provider choices, language constraints.
- **Before any Sprint Gate** — if you know a sprint will require a specific approach.
- **When you disagree with a recommendation** — override it with a `DECIDED` item and the agents will comply.
- **After a retrospective** — capture "from now on we always do X" as a permanent decision.

---

## File locations

| What | Path |
|------|------|
| Decision index (open questions + category registry) | `.github/docs/decisions.md` |
| Category files (per technology stack) | `.github/docs/decisions/*.md` |
| Technical architecture reference | `docs/decisions-architecture.md` |
