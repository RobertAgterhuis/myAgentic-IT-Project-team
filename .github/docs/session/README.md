# Session (Runtime Directory)

This directory is populated at runtime by the Orchestrator and webapp:

- **`session-state.json`** — Created by the Orchestrator when a CREATE/AUDIT cycle starts. Tracks current phase, agent, and completed work.
- **`reevaluate-trigger.json`** — Written by the webapp when the user clicks "Reevaluate". Picked up by the Orchestrator per rule ORC-28.

Both files are generated automatically — do not create them manually.
