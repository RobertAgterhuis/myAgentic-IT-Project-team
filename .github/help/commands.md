# Commands Reference

## Create Commands

| Command | Description |
|---------|------------|
| `CREATE [project]` | Full solution creation — all 4 phases, synthesis, and implementation |
| `CREATE BUSINESS [project]` | Phase 1 only — Requirements & Strategy |
| `CREATE TECH [project]` | Phase 2 only — Architecture & Design |
| `CREATE UX [project]` | Phase 3 only — Experience Design |
| `CREATE MARKETING [project]` | Phase 4 only — Brand & Growth |
| `CREATE SYNTHESIS` | Combine all available phase outputs into final reports |

You can also combine 2–3 disciplines in one command:
- `CREATE TECH UX [project]` — runs Phase 2 + Phase 3
- `CREATE BUSINESS MARKETING [project]` — runs Phase 1 + Phase 4

Canonical execution order is always: BUSINESS → TECH → UX → MARKETING.

## Audit Commands

| Command | Description |
|---------|------------|
| `AUDIT [project]` | Full audit — analyze existing software across all 4 phases |
| `AUDIT BUSINESS [project]` | Phase 1 audit only |
| `AUDIT TECH [project]` | Phase 2 audit only |
| `AUDIT UX [project]` | Phase 3 audit only |
| `AUDIT MARKETING [project]` | Phase 4 audit only |
| `AUDIT SYNTHESIS` | Combine all available audit outputs |

## On-Demand Commands

| Command | Description |
|---------|------------|
| `FEATURE [name]: [description]` | Add a new feature — runs the full cycle (Phase 1–4 + Sprint Plan + Implementation) in an isolated workspace under `Workitems/[FEATURENAME]/` |
| `SCOPE CHANGE [DIMENSION]: [description]` | Major change in project direction. Dimensions: `BUSINESS`, `TECH`, `UX`, `MARKETING`, or `ALL` |
| `HOTFIX [description]` | Emergency fix — bypasses Sprint Gate, requires abbreviated regression testing |
| `REEVALUATE [scope]` | Re-run analysis with new information. Scopes: `ALL`, `BUSINESS`, `TECH`, `UX`, `MARKETING` |
| `REFRESH ONBOARDING` | Rescan workspace and tooling without repeating the intake interview |

## How commands work

1. Select a command in the Command Center sidebar
2. Fill in the required fields (project name, description, etc.)
3. Click **Queue Command** — this writes to the command queue file
4. Copy the generated command string and paste it into the Copilot chat
5. The Orchestrator picks up the command and starts the agent pipeline
