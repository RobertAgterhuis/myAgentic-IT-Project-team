# Decision System — Technical Architecture

> This document describes the internal architecture of the decision system: file layout, data flow, agent interactions, category lifecycle, and enforcement mechanisms. For a user-facing guide, see `.github/help/decisions.md`.

---

## 1. File architecture

### Index file

**Path:** `.github/docs/decisions.md`

The index file serves two purposes:

1. **Open Questions table** — uncategorized items (type `DECIDED` or `OPEN_QUESTION`, status `OPEN`/`DECIDED`/`DEFERRED`/`EXPIRED`).
2. **Category Registry table** — a lookup table mapping each technology category to its file, decision count, status (`ACTIVE`/`PARTIAL`/`DEFERRED`), and applicability flag.

The index file is the Orchestrator's first read target at every Sprint Gate.

### Category files

**Path:** `.github/docs/decisions/[stack].md`

Each category file groups decisions for one technology stack. File names are lowercase-kebab (e.g. `typescript-eslint.md`, `bicep-iac.md`).

**Header block** (mandatory, lines 1–5):

```markdown
# [Category Name] Decisions

> Stack: [name] | Status: ACTIVE|PARTIAL|DEFERRED | Applicable: YES|NO
```

`PARTIAL` files additionally contain a "Deferred Decisions" subsection for individually deferred rows. `DEFERRED` files include a `> Deferred-Reason:` line explaining why.

**Body:** A markdown table with columns `ID | Priority | Scope | Decision | Notes | Date`. Each row is one `DECIDED` item.

### Current categories

| File | Stack | Typical status |
|------|-------|---------------|
| `transformation.md` | Transformation patterns | ACTIVE |
| `reevaluation.md` | Reevaluation rules | ACTIVE |
| `github-actions.md` | CI/CD with GitHub Actions | ACTIVE or PARTIAL |
| `typescript-eslint.md` | TypeScript + ESLint config | ACTIVE or PARTIAL |
| `cross-cutting.md` | Cross-cutting concerns | ACTIVE or PARTIAL |
| `bicep-iac.md` | Infrastructure as Code (Bicep) | DEFERRED |
| `azure-devops.md` | Azure DevOps pipelines | DEFERRED |
| `dotnet.md` | .NET / C# | DEFERRED |
| `docker.md` | Docker / containers | DEFERRED |
| `vite.md` | Vite build tooling | DEFERRED |
| `nextjs.md` | Next.js framework | DEFERRED |

---

## 2. Data flow diagram

```
                         ┌──────────────────────────────┐
                         │         Web UI (webapp)       │
                         │   POST /api/decisions/...     │
                         └──────────┬───────────────────┘
                                    │ reads / writes
                                    ▼
                    ┌───────────────────────────────┐
                    │  .github/docs/decisions.md    │  ◄── index file
                    │  (Open Questions + Registry)  │
                    └──────────┬────────────────────┘
                               │ Registry references
                               ▼
              ┌────────────────────────────────────┐
              │  .github/docs/decisions/*.md        │  ◄── category files
              │  (ACTIVE / PARTIAL / DEFERRED)      │
              └──────────┬─────────────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
          ▼              ▼                  ▼
   ┌────────────┐ ┌────────────┐   ┌─────────────┐
   │ Sprint     │ │ Decision   │   │ Phase 5     │
   │ Gate       │ │ injection  │   │ enforcement │
   │ (Step 0)   │ │ (Step 5)   │   │ (triple-    │
   │            │ │            │   │  check)     │
   └────────────┘ └────────────┘   └─────────────┘
```

---

## 3. Orchestrator interactions

### 3a. Sprint Gate — Step 0 (decision loading)

Executed before every sprint. Defined in the Orchestrator skill file (RULE ORC-06+).

1. **Read index:** Extract all items from `.github/docs/decisions.md` with status `OPEN` or `DECIDED`.
2. **Scan category directory:** For each `.md` file in `.github/docs/decisions/`, read the `> Status:` header line.
   - `DEFERRED` → **skip entirely**.
   - `ACTIVE` or `PARTIAL` → read all `DECIDED` rows. For `PARTIAL` files, also note individually deferred rows (informational only).
3. **Filter OPEN HIGH:** Items where `priority = HIGH` and `scope` matches the current sprint or its stories → **block the Sprint Gate**. Present to the user with instructions to answer.
4. **Filter OPEN MEDIUM/LOW:** List as informational, non-blocking.
5. **Store constraints:** Aggregate all `DECIDED` items (from index + active categories) into a sprint-scoped constraint set for injection in step 5 of sprint start.

### 3b. Sprint start — Step 5 (decision injection)

After the Sprint Gate passes and the user chooses `IMPLEMENT`:

1. Load all `DECIDED` items from index + ACTIVE/PARTIAL category files.
2. Skip DEFERRED category files. Skip individually deferred rows within PARTIAL files.
3. Filter by scope → keep only decisions relevant to the current sprint, its stories, or the active agents.
4. Inject the filtered set as **hard constraints** into each agent's context block.
5. Log which decisions (with category source) were injected in the Orchestrator Log.

### 3c. Deferred category auto-activation (ORC-45)

When any agent reports one of these signals:
- `DEFERRED_TECH_REQUIRED` — Implementation Agent needs the technology before coding.
- `DEFERRED_TECH_DETECTED` — Test Agent or PR/Review Agent finds deferred tech in code/diff.
- `DEFERRED_ACTIVATION_REQUIRED` — any other agent.

The Orchestrator executes a six-step activation:

| Step | Action |
|------|--------|
| 1 | Open the category file → change `Status: DEFERRED` → `ACTIVE`, `Applicable: NO` → `YES`, remove `Deferred-Reason` line. |
| 2 | Update the matching row in the index file Category Registry table. |
| 3 | Append audit trail to the category file: `> Activated: [date] | Trigger: [signal] | Agent: [name] | Story: [SP-ID]`. |
| 4 | Update `session-state.json` with `category_activated: [file]`. |
| 5 | Notify user (informational, non-blocking). |
| 6 | Read all `DECIDED` items from the newly activated file → inject as hard constraints → resume the halted agent. |

**Exception path:** User types `SKIP ACTIVATION [category]` → Orchestrator writes a `DECIDED` exception item to the index file and reverts the category to `DEFERRED` if already activated.

---

## 4. Enforcement chain (Phase 5 triple-check)

Three agents independently validate decision compliance. A violation at any point blocks progress.

### 4a. Implementation Agent (pre-coding)

**Trigger:** Definition of Ready check, before writing any code.

1. Load all `DECIDED` items (index + ACTIVE/PARTIAL categories). Skip DEFERRED.
2. Every `DECIDED` item is a hard constraint — do not write code that conflicts.
3. If the story requires a technology matching a DEFERRED category → **HALT**. Report `DEFERRED_TECH_REQUIRED: [category]`. Wait for Orchestrator auto-activation (ORC-45), then resume with newly active constraints.
4. Document: `DECISIONS_LOADED: [N] — active constraints: [summary]`.

### 4b. Test Agent (post-coding)

**Trigger:** Step 6b of test execution, after functional tests pass.

1. Load decisions (same read pattern: index + ACTIVE/PARTIAL, skip DEFERRED).
2. Filter by scope overlap with the current story's domain (file types, framework).
3. Verify each applicable `DECIDED` item against the implementation code.
4. On violation: `DEC-VIOLATION: [DEC-ID] — [expected vs actual]`. Return to Implementation Agent.
5. Deferred technology detection: if code introduces files matching a DEFERRED category → `DEFERRED_TECH_DETECTED: [category]`. Escalate to Orchestrator.
6. Document in Test Report: `DECISION COMPLIANCE: Applicable: [N], Compliant: [N], Violations: [list or NONE]`.

### 4c. PR/Review Agent (pre-merge)

**Trigger:** Step 2g and 2h of PR review.

**Decision compliance (2g):**

1. Load decisions (same pattern).
2. Scope-match by file extension in the PR diff:
   - `.js`/`.ts`/`.mjs` → TypeScript/ESLint, Cross-Cutting
   - `.yml`/`.yaml` in `.github/workflows/` → GitHub Actions
   - `Dockerfile`, `docker-compose.*` → Docker
   - `.bicep` → Bicep/IaC
   - `.cs`/`.csproj` → .NET
   - All files → Cross-Cutting, Transformation
3. Verify each applicable decision against the diff.
4. On violation: `DEC-REVIEW: VIOLATION [DEC-ID]` → return PR, block merge.

**Deferred technology detection (2h):**

| File pattern in diff | DEFERRED category |
|---------------------|-------------------|
| `Dockerfile`, `docker-compose.*`, `.dockerignore` | `docker.md` |
| `*.bicep`, `*.arm.json`, `azuredeploy.*` | `bicep-iac.md` |
| `*.cs`, `*.csproj`, `*.sln`, `global.json` | `dotnet.md` |
| `azure-pipelines.yml`, `.azure-devops/` | `azure-devops.md` |
| `vite.config.*`, `vitest.config.*` | `vite.md` |
| `next.config.*`, `pages/`, `app/` (Next.js imports) | `nextjs.md` |

On match with a DEFERRED category → block merge → escalate to Orchestrator for auto-activation.

---

## 5. Guardrail references

| Guardrail | File | Scope |
|-----------|------|-------|
| **G-GLOB-58** | `.github/docs/guardrails/00-global-guardrails.md` | All Phase 5 agents must validate against `DECIDED` items. Skip DEFERRED for compliance but scan for activation triggers. |
| **IMPL-GUARD-32** | `.github/docs/guardrails/06-implementation-guardrails.md` | Decision compliance triple-check: Implementation → Test → PR/Review. All three must independently verify. |
| **IMPL-GUARD-33** | `.github/docs/guardrails/06-implementation-guardrails.md` | HALT before introducing deferred technology. Escalate to Orchestrator for ORC-45 auto-activation. |

---

## 6. Orchestrator rules index

| Rule | Purpose |
|------|---------|
| **ORC-45** | Deferred Decision Category Activation (6-step auto-activate + exception path) |
| **ORC-06** | Backlogged sprints are never activated by the Implementation Agent |
| **ORC-07** | All-backlog prompt when no queued sprints remain |

---

## 7. Web UI ↔ file synchronization

The web UI (`node .github/webapp/server.js`, port 3000) reads and writes the same markdown files:

| API endpoint | File affected | Operation |
|-------------|---------------|-----------|
| `GET /api/decisions` | `decisions.md` + `decisions/*.md` | Parse and return all decisions |
| `POST /api/decisions` | `decisions.md` | Append new item to Open Questions table |
| `PUT /api/decisions/:id` | `decisions.md` or `decisions/[cat].md` | Update status, answer, priority, scope |
| `POST /api/decisions/activate-category` | `decisions/[cat].md` + `decisions.md` | Change DEFERRED → ACTIVE in header + registry |

The Orchestrator reads the same files — changes made via the web UI are picked up at the next Sprint Gate automatically.

---

## 8. Session state integration

`session-state.json` tracks decision-related state:

- `category_activated: [file]` — set by ORC-45 when a deferred category is auto-activated mid-sprint.
- Sprint constraints are not persisted in session state; they are recomputed at each Sprint Gate from the decision files.

---

## 9. Reevaluate trigger

When the web UI's Decisions tab writes `.github/docs/session/reevaluate-trigger.json` with `status: "PENDING"`, the Orchestrator picks it up at the next Sprint Gate (Step 0) and invokes the Reevaluate Agent per ORC-28. This allows decision changes to trigger a formal re-evaluation cycle.
