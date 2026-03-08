# Troubleshooting & Session Recovery

## Session states — what they mean

The system tracks its progress in `.github/docs/session/session-state.json`. Understanding the status helps you diagnose where things stand:

| Status | Meaning | What to do |
|--------|---------|-----------|
| `ONBOARDING` | Onboarding has started but not completed | Provide any missing required input, then type CONTINUE |
| `ONBOARDING_COMPLETE` | Ready for Phase 1 | Type CONTINUE to start Phase 1 |
| `PHASE-1` through `PHASE-4` | Inside a design phase | Type CONTINUE to advance through agents |
| `POST_PHASE_4` | Brand & Assets / Storybook agents running | Type CONTINUE |
| `SYNTHESIS` | Synthesis Agent is producing reports | Review and APPROVE when presented |
| `SPRINT_GATE` | Waiting for your IMPLEMENT/BACKLOG choice | Choose [1] or [2] as prompted |
| `PHASE-5` | Inside a sprint cycle | Type CONTINUE to advance through agent pipeline |
| `AWAITING_HUMAN` | An agent needs your input | Answer the open escalation (see below) |
| `BLOCKED` | Unresolvable blocker detected | Read the blocker details and resolve the underlying issue |
| `REEVALUATE` | A reevaluation cycle is running | Wait for it to complete, then type CONTINUE |
| `SCOPE_CHANGE` | A scope change is being processed | Wait for reconciliation, then APPROVE |
| `HOTFIX` | Emergency hotfix in progress | Follow the hotfix flow |
| `COMPLETE` | All work is finished | No action needed |

---

## Resuming after interruption

When you open a new Copilot Chat conversation, the Orchestrator automatically checks for an existing session. If one is found, you see:

```
SESSION RESUMED
Session ID: [id]
Started: [date]
Last activity: [date]
Status: [current status]
Last agent: [agent name]
Open escalations: [count]

Choose:
  [1] RESUME — continue from where stopped
  [2] RESET — start new session (existing state is archived)
```

**RESUME** picks up exactly where you left off — all phase outputs, escalations, and decision constraints are reloaded.

**RESET** archives the current session file (renamed to `session-state-[id]-archived.json`) and starts fresh via the Onboarding Agent.

> **Tip:** At phase boundaries, the Orchestrator will tell you to start a fresh Copilot Chat conversation. This is by design — it prevents "JS heap out of memory" errors. Just open a new chat and type `CONTINUE`.

---

## Understanding human escalations

When an agent needs your input, it produces a standardized block:

```
HUMAN INPUT REQUIRED

Escalation ID: ESC-001
Type: SCOPE_DECISION
Raised by: Implementation Agent

Situation: [what's happening]
Question: [what you need to decide]
  [1] Option A — [consequence]
  [2] Option B — [consequence]

Impact of no answer (timeout action: HALT):
[what happens if you don't respond]
```

### Escalation types and how to respond

| Type | How serious | What to do |
|------|-------------|-----------|
| `ONBOARDING_BLOCKED` | **Cycle stopped** | Provide the missing input (project name, codebase path, etc.) |
| `TOOL_INSTALL_REQUEST` | **Cycle stopped** | Install the requested tool, then confirm |
| `SPRINT_GATE` | **Sprint waiting** | Choose IMPLEMENT or BACKLOG |
| `SPRINT_IMPACT_FLAG` | **Sprint paused** | Review the impact and decide how to proceed |
| `SCOPE_DECISION` | **Cycle stopped** | Answer the question — often about unclear requirements |
| `SCOPE_CHANGE_DECISION` | **Cycle stopped** | Choose between SCOPE CHANGE or OVERRIDE |
| `AGENT_CONFLICT` | **Step paused** | Break the tie — the agents can't agree |
| `SECURITY_DECISION` | **Cycle stopped** | A security issue needs your judgment |
| `DESTRUCTIVE_GIT_OP` | **Cycle stopped** | Confirm or reject a destructive operation (force push, etc.) |
| `OTHER` | **Step paused** | Read the question and respond |

### Timeout behavior

- **HALT** types: The entire cycle stops until you answer. Nothing proceeds.
- **PAUSE** types: The specific step waits, but independent parallel work may continue.

### How to answer

Simply type the number of your choice (e.g., `1`) or provide free text if there are no numbered options. The Orchestrator links your answer to the escalation and resumes the cycle.

---

## Common problems

### "CONTINUE" doesn't seem to work
1. Make sure `session-state.json` exists at `.github/docs/session/session-state.json`.
2. Check the `status` field — if it's `AWAITING_HUMAN` or `BLOCKED`, the system is waiting for specific input, not a generic CONTINUE.
3. If the status is `COMPLETE`, there's nothing more to do. Start a new cycle with a CREATE or AUDIT command.

### Session seems stuck at AWAITING_HUMAN
An agent asked you a question and is waiting for your answer. Look for the `open_human_escalations` array in `session-state.json` — each entry shows the question, type, and what's expected. Answer the open escalation to resume.

### Agent keeps returning work (loop)
If the same story bounces between Implementation → Test → Implementation more than twice, the Orchestrator will escalate via `AGENT_CONFLICT`. This usually means:
- Acceptance criteria are contradictory — clarify them.
- A decision constraint conflicts with the story requirements — update the decision or the story.
- A tooling issue prevents the test from passing — check the test output.

### Sprint Gate keeps blocking
Check `.github/docs/decisions.md` for any `OPEN` + `HIGH` priority decisions whose scope matches the sprint. Answer or defer them. Use the web UI Decisions tab for a visual overview.

### "JS heap out of memory" in Copilot Chat
This happens when a conversation accumulates too much context (many agents worth of output). **This is expected behavior.** Start a new Copilot Chat conversation and type `CONTINUE`. All progress is preserved in `session-state.json`.

### Phase output seems missing
Phase outputs are written to disk, not stored in chat. Check:
- `BusinessDocs/Phase1-Business/` for Phase 1 outputs
- `BusinessDocs/Phase2-Tech/` for Phase 2 outputs
- `BusinessDocs/Phase3-UX/` for Phase 3 outputs
- `BusinessDocs/Phase4-Marketing/` for Phase 4 outputs
- `.github/docs/synthesis/` for synthesis reports

If a file is referenced but doesn't exist, the Orchestrator may need to re-run the agent. Type `CONTINUE` and the Orchestrator will detect the gap.

### Server won't start (webapp)
- Ensure Node.js ≥ 18 is installed: `node --version`
- Check port 3000 is available: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (macOS/Linux)
- Set a different port: `$env:SERVER_PORT = 3001; node .github/webapp/server.js`

### Web UI shows "Server unreachable"
- Verify the server is still running in your terminal.
- Check the terminal for error messages.
- The UI retries automatically — wait a few seconds.

### Decisions not saving
- Check that `.github/docs/decisions.md` exists and is writable.
- Look for error messages in the browser console (F12 → Console tab).
- The server creates backups before writing — check for `.bak` files if data seems lost.

### Questionnaires not showing up
- Verify questionnaire files exist in `BusinessDocs/` subdirectories.
- Check that the server can read the files (correct working directory).
- Refresh the page — questionnaires are loaded on tab activation.

### Tests fail after pulling updates
```bash
cd .github
npm install          # Update dev dependencies
npm test             # Re-run tests
npm run lint         # Check for lint issues
```

---

## Manual session state recovery

If `session-state.json` is corrupted or in an unexpected state, you can fix it manually:

1. Open `.github/docs/session/session-state.json` in your editor.
2. Check `status` — set it to the correct state from the state machine table above.
3. Check `current_agent` and `current_phase` — set them to where you want to resume.
4. Clear `open_human_escalations` if stale: set to `[]`.
5. Save the file and start a new Copilot Chat conversation. Type `CONTINUE`.

**To start completely fresh:** Delete `session-state.json` and run your CREATE or AUDIT command again. The Orchestrator creates a new session.

> **Caution:** Deleting `session-state.json` does not delete phase outputs or decisions. Those files remain in `BusinessDocs/`, `.github/docs/synthesis/`, and `.github/docs/decisions/`. A new session will not automatically reuse them unless you run `REFRESH ONBOARDING`.

---

## When to ask for help

If none of the above resolves your issue:
1. Check the Orchestrator Log (printed in chat) for the most recent action and error.
2. Check `session-state.json` for the full state.
3. Open an Issue on the repository with: the status field, the last agent name, and any error messages from the terminal or Copilot Chat.
