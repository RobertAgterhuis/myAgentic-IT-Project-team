# Decisions & Open Questions

> This file is your direct communication channel with the Agentic Team.  
> The Orchestrator consults this file at every Sprint Gate and at the start of each sprint.  
> Fill it in yourself — agents automatically adapt their behavior based on the status below.
>
> **Web UI available:** Run `node .github/webapp/server.js` and open http://127.0.0.1:3000 → **Decisions** tab to view, create, and answer decisions in a visual interface. The web UI writes directly to this file.

---

## How does this file work?

| Column | Explanation |
|-------|--------|
| **ID** | Unique ID, format `DEC-NNN` |
| **Type** | `DECIDED` (you have decided) or `OPEN_QUESTION` (waiting for your answer) |
| **Status** | `OPEN` · `DECIDED` · `DEFERRED` · `EXPIRED` |
| **Priority** | `HIGH` · `MEDIUM` · `LOW` |
| **Scope** | Which phase, agent, or sprint this affects (e.g. `Phase 2`, `SP-3`, `PR/Review Agent`, `All sprints`) |
| **Decision / Question** | What has been decided or what needs to be answered |
| **Your answer / Notes** | Fill this in for OPEN_QUESTION so the Orchestrator can process it |
| **Date** | Date of entry or last update |

**Orchestrator behavior rules:**
- `OPEN` + priority `HIGH` + sprint touches the scope → **Sprint Gate blocks** until you answer
- `OPEN` + priority `MEDIUM/LOW` → Orchestrator reports it but does not block
- `DECIDED` → Orchestrator injects the decision as a hard constraint into all relevant agents
- `DEFERRED` → Orchestrator ignores until date or scope trigger
- `EXPIRED` → Orchestrator ignores entirely

---

## Open Questions (waiting for your answer)

| ID | Priority | Scope | Question | Your answer | Date |
|----|-----------|-------|-------|---------------|-------|

| | | | *(No open questions)* | | |
---

## Decision Categories

> Decided items are organized by technology stack in separate files under `.github/docs/decisions/`.
> The Orchestrator reads **ACTIVE** category files at Sprint Gate and injects their decisions as hard constraints.
> **DEFERRED** categories are skipped — the Orchestrator auto-activates them when the agentic team detects the technology is needed (RULE ORC-45). You can also activate manually via the web UI.

| Stack | File | Count | Status | Applicable |
|-------|------|-------|--------|------------|
| Transformation | [transformation.md](decisions/transformation.md) | 15 | ACTIVE | YES |
| Reevaluation | [reevaluation.md](decisions/reevaluation.md) | 9 | ACTIVE | YES |
| GitHub Actions | [github-actions.md](decisions/github-actions.md) | 24 | ACTIVE | PARTIAL |
| TypeScript / ESLint | [typescript-eslint.md](decisions/typescript-eslint.md) | 24 | ACTIVE | PARTIAL |
| Cross-cutting | [cross-cutting.md](decisions/cross-cutting.md) | 10 | ACTIVE | PARTIAL |
| Bicep / IaC | [bicep-iac.md](decisions/bicep-iac.md) | 29 | DEFERRED | NO |
| Azure DevOps | [azure-devops.md](decisions/azure-devops.md) | 19 | DEFERRED | NO |
| .NET / C# | [dotnet.md](decisions/dotnet.md) | 19 | DEFERRED | NO |
| Docker | [docker.md](decisions/docker.md) | 20 | DEFERRED | NO |
| Vite | [vite.md](decisions/vite.md) | 11 | DEFERRED | NO |
| NextJS | [nextjs.md](decisions/nextjs.md) | 13 | DEFERRED | NO |

**Total:** 193 decisions (50 active, 32 individually deferred in partial categories, 111 category-deferred)

### Uncategorized Decisions

> New decisions created via the webapp land here. Move them to a category file when appropriate.

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-100 | — | — | *(Add a decision here)* | | |

---

## Deferred & Expired items

| ID | Status | Scope | Subject | Reason | Date |
|----|--------|-------|-----------|-------|-------|

---

## Change Log

- 2026-03-07T17:42:05.245Z | `create` | `DEC-111` | source: webapp
- 2026-03-07T17:41:36.176Z | `create` | `DEC-110` | source: webapp
- 2026-03-07T17:41:15.853Z | `create` | `DEC-109` | source: webapp
- 2026-03-07T17:40:56.503Z | `create` | `DEC-108` | source: webapp
- 2026-03-07T17:40:34.041Z | `create` | `DEC-107` | source: webapp
- 2026-03-07T17:40:08.639Z | `create` | `DEC-106` | source: webapp
- 2026-03-07T17:39:43.057Z | `create` | `DEC-105` | source: webapp
- 2026-03-07T17:39:09.707Z | `create` | `DEC-104` | source: webapp
- 2026-03-07T17:38:31.307Z | `create` | `DEC-103` | source: webapp
- 2026-03-07T17:37:46.624Z | `create` | `DEC-102` | source: webapp
_(auto-populated by the webapp)_

---

## Examples

### Example: Open question (blocking)
| ID | Priority | Scope | Question | Your answer | Date |
|----|-----------|-------|-------|---------------|-------|
| DEC-002 | HIGH | Phase 2, SP-1 | Which cloud platform to use: Azure or AWS? | Azure — always use managed services where possible | 2026-03-01 |

### Example: Decided item
| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-101 | HIGH | All sprints | Do not integrate any third-party payment systems outside Stripe | Compliance requirement from legal | 2026-03-01 |


