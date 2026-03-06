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
- **`session-state.json`** — Written by the Orchestrator and agents during execution
- **`/api/progress`** — The webapp polls this endpoint every few seconds

The pipeline auto-refreshes — no need to manually reload.

## Pending commands

When a command is queued but not yet picked up, a yellow warning bar appears at the top of the pipeline area showing the pending command and its timestamp.
