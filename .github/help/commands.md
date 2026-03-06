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
| `CONTINUE` | Resume an active session from where it left off — use after phase boundaries or new conversations |

## How commands work

1. Select a command in the Command Center sidebar
2. Fill in the required fields (project name, description, etc.)
3. For CREATE/AUDIT commands: optionally paste your full requirements in the **Project Brief** field
4. Click **Queue Command** — the brief is saved to `BusinessDocs/project-brief.md` and a short command is copied to your clipboard
5. Paste the **short command** into Copilot Chat — the brief is NOT included in the pasted text (it's already saved as a file)
6. The Orchestrator picks up the command, detects the saved brief, and passes it to the Onboarding Agent
7. Agents run **one at a time** — after each agent, type **CONTINUE** to proceed
8. At **phase boundaries**, start a **new Copilot Chat conversation** and type **CONTINUE**

> **Why is the brief saved as a file?** Large project descriptions in the chat command would consume the context window and cause network timeouts. The file-based approach keeps the chat command small while giving agents access to the full brief.

> **Why one agent at a time?** This is the Checkpoint-and-Yield Protocol (ORC-30). Each agent's output is saved to disk and progress is recorded in `session-state.json`. This prevents memory overload and makes the process resumable — if anything goes wrong, you can always type CONTINUE to pick up where you left off.

> **Why start fresh conversations?** VS Code's Copilot Chat worker has a memory limit. After many tool calls and large outputs, the accumulated conversation context can cause "JS heap out of memory" crashes. A fresh conversation resets this, while `session-state.json` keeps all progress intact.
