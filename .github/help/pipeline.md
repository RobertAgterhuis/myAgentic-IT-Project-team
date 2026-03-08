# Pipeline & Progress

## Pipeline visualization

When a session is active, the Command Center shows a **real-time pipeline view** of agent progress. Each phase is displayed as a card with:

- **Phase icon and name** — e.g. 📋 Phase 1 — Requirements & Strategy
- **Status badge** — `PENDING`, `ACTIVE` (pulsing), or `DONE`
- **Agent dots** — Each agent in the phase is shown with a colored dot:
  - ⚪ **Gray** — Pending (not started)
  - 🔵 **Blue/Purple** (pulsing) — Currently active
  - 🟢 **Green** — Completed

## Progress bar

A shimmer-animated progress bar at the top shows overall completion percentage across all phases.

## Sprint tracker

Below the pipeline, completed and in-progress sprints are listed with:
- Sprint ID (e.g. `SP-1`, `SP-2`)
- Story point completion
- Status

## How progress is tracked

Progress data comes from two sources:
- **`session-state.json`** — Written by the Orchestrator and agents during execution. This is the single source of truth for all progress.
- **`/api/progress`** — The webapp polls this endpoint every **10 seconds**

The pipeline auto-refreshes — no need to manually reload.

## Waiting state

After you queue a command but before you paste it in Copilot Chat, the pipeline area shows a **waiting state** with:

- A pulsing amber indicator showing the queued command
- A step-by-step checklist of what's happened and what's next
- A tip that the page auto-refreshes every 10 seconds

**Be patient** — after you paste the command in Copilot Chat, the Orchestrator immediately creates `session-state.json` (per ORC-46) and starts the Onboarding Agent. The waiting state will transition to the full pipeline view within seconds once the Orchestrator writes the initial session state.

## One agent at a time

Unlike a traditional batch process, the agentic team runs **one agent per conversation turn**. After each agent completes:

1. The agent writes its output to a file on disk
2. The Orchestrator updates `session-state.json` and `pipeline-progress.json`
3. The Orchestrator yields and asks you to type **CONTINUE**
4. The pipeline view updates to show the completed agent (green dot) and the next agent

This is by design — it prevents memory overload and makes the process fully resumable.

## Fresh conversations per phase

At **phase boundaries** (e.g., after Phase 1 is complete and Critic + Risk validation passes), the Orchestrator will ask you to **start a new Copilot Chat conversation**. This is necessary because:

- VS Code's Copilot Chat worker has a memory limit (~512MB–1GB)
- Accumulated conversation context from many agents and tool calls grows large
- A fresh conversation resets the memory, preventing "JS heap out of memory" crashes
- All progress is preserved in `session-state.json` — simply type **CONTINUE** in the new conversation

The pipeline view in the Command Center is unaffected by conversation resets — it always reflects the latest state from `session-state.json`.

## Pending commands

When a command is queued but not yet picked up, a yellow warning bar appears at the top of the pipeline area showing the pending command and its timestamp.
