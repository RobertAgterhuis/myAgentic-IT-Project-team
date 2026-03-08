# User Manual — Agentic IT Project Team

> Version 1.0 | Last updated: 2026-03-08

This guide covers everything you need to use the Agentic IT Project Team system: starting projects, managing questionnaires and decisions, using the Command Center, and troubleshooting common issues.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Command Center](#the-command-center)
3. [Questionnaires](#questionnaires)
4. [Decisions](#decisions)
5. [Available Commands](#available-commands)
6. [Pipeline Progress](#pipeline-progress)
7. [Real-Time Updates (SSE)](#real-time-updates-sse)
8. [Accessibility Features](#accessibility-features)
9. [FAQ](#faq)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### 1. Prerequisites

- **VS Code** with [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- **Node.js ≥ 18** — [download here](https://nodejs.org/)
- **Git** — [download here](https://git-scm.com/)

### 2. Launch the Web UI

```bash
node .github/webapp/server.js
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser. The server runs locally — no internet connection needed, no data leaves your machine.

### 3. Start Your First Project

1. Open the **Command Center** tab (selected by default).
2. Click **CREATE** to start a new software solution, or **AUDIT** to analyze existing software.
3. Enter a project name and optionally paste your full requirements in the **Project Brief** field.
4. Click **Queue Command** — a short command string is copied to your clipboard.
5. Paste the command into **Copilot Chat** in VS Code.
6. The Orchestrator agent begins the pipeline automatically.

### 4. Continue the Pipeline

After each agent completes its work:
- Type **CONTINUE** in Copilot Chat to proceed to the next agent.
- At phase boundaries, start a **new Copilot Chat conversation** and type **CONTINUE** (progress is preserved).
- The Command Center pipeline view shows your current position.

---

## The Command Center

The Command Center is the home screen of the web UI. It provides:

### Command Sidebar
A categorized list of all available commands. Click any button to fill in the command form:
- **Create New Solution** — CREATE, CREATE BUSINESS, CREATE TECH, etc.
- **Audit Existing Software** — AUDIT, AUDIT BUSINESS, AUDIT TECH, etc.
- **On-Demand** — FEATURE, REEVALUATE, SCOPE CHANGE, HOTFIX
- **Session** — CONTINUE, REFRESH ONBOARDING

### Pipeline View
A horizontal progress bar showing all phases and their status:
- **Green** = completed
- **Blue** = in progress
- **Gray** = not started

Click on any phase to see its details and which agents have completed.

### Command History
A log of all commands you've sent during this session, with timestamps and status.

---

## Questionnaires

When agents encounter missing information, they generate **questionnaires** — structured sets of questions with context about why each answer matters.

### Viewing Questionnaires
1. Click the **Questionnaires** tab.
2. The sidebar lists all questionnaires grouped by phase.
3. A badge counter shows how many questions remain unanswered.

### Answering Questions
1. Select a questionnaire from the sidebar.
2. For each question, type your answer in the text area below it.
3. Click **Save** to persist your answer.
4. The status badge updates from **OPEN** to **ANSWERED**.

### Answer Validation
- Answers are checked for **secret patterns** (AWS keys, GitHub tokens, private keys). If detected, a warning appears — you should remove credentials from your answers.
- Markdown characters are sanitized to prevent formatting injection.

### After Answering
Once you've answered the key questions, run `REEVALUATE [scope]` in Copilot Chat. The system re-runs analysis with your new answers, producing better results.

---

## Decisions

The **Decisions** tab is your direct communication channel with the agent team. Decisions you create here become hard constraints that all agents follow.

### Decision Types
| Status | Meaning |
|--------|---------|
| **OPEN** | Waiting for your answer |
| **DECIDED** | Active constraint — all agents follow this |
| **DEFERRED** | Parked for later |
| **EXPIRED** | No longer relevant |

### Priority Levels
| Priority | Effect |
|----------|--------|
| **HIGH** | Blocks sprint start if scope overlaps and status is OPEN |
| **MEDIUM** | Reported but doesn't block |
| **LOW** | Informational only |

### Creating a Decision
1. Click **+ New Decision** in the Decisions tab.
2. Fill in priority, scope, and your decision or question.
3. Click **Create** — the decision is assigned an ID and written to `decisions.md`.

### Answering an Open Question
1. Find the open question in the Decisions tab.
2. Type your answer in the answer field.
3. Click **Answer** — status changes to DECIDED if it was a question from the agents.

### Filtering
Use the search bar, priority dropdown, and status dropdown to filter decisions.

---

## Available Commands

| Command | Mode | Purpose |
|---------|------|---------|
| `CREATE [project]` | CREATE | Full 4-phase solution design + implementation |
| `CREATE BUSINESS [project]` | CREATE | Phase 1 only — requirements & strategy |
| `CREATE TECH [project]` | CREATE | Phase 2 only — architecture & design |
| `CREATE UX [project]` | CREATE | Phase 3 only — experience design |
| `CREATE MARKETING [project]` | CREATE | Phase 4 only — brand & growth |
| `CREATE SYNTHESIS` | CREATE | Combine all completed phase outputs |
| `AUDIT [project]` | AUDIT | Full analysis of existing software |
| `AUDIT BUSINESS\|TECH\|UX\|MARKETING` | AUDIT | Partial audit per discipline |
| `FEATURE [name]: [description]` | Both | Add feature with isolated full cycle |
| `REEVALUATE [scope]` | Both | Re-analyze after changes |
| `SCOPE CHANGE [DIM]: [description]` | Both | Handle fundamental direction changes |
| `HOTFIX [description]` | Both | Emergency fix — bypasses Sprint Gate |
| `CONTINUE` | Both | Proceed to next agent in pipeline |
| `REFRESH ONBOARDING` | Both | Re-scan codebase, keep intake answers |

### Combination Commands
You can combine 2–3 disciplines in one session:
```
CREATE TECH UX MyProject
CREATE BUSINESS MARKETING MyProject
AUDIT TECH UX MARKETING MyProject
```
Execution order is always: BUSINESS → TECH → UX → MARKETING.

---

## Pipeline Progress

The pipeline view in the Command Center shows 7 phase groups:

1. **Onboarding** — Project intake and initial scanning
2. **Phase 1: Business** — Requirements & strategy (5 agents)
3. **Phase 2: Tech** — Architecture & design (6 agents)
4. **Phase 3: UX** — Experience design (6 agents)
5. **Phase 4: Marketing** — Brand & growth (3 agents)
6. **Synthesis** — Cross-team integration + final reports
7. **Phase 5: Implementation** — Sprint-by-sprint coding

Each agent within a phase shows its completion status. The critical path progresses sequentially.

---

## Real-Time Updates (SSE)

The web UI maintains a **Server-Sent Events** connection to the server for real-time updates:
- **Data changes** are pushed instantly (no need to refresh).
- A **connection status indicator** (green/red dot) shows the SSE connection state.
- If the server becomes unreachable, a banner appears: _"Server unreachable — retrying automatically"_.
- Reconnection is automatic with exponential backoff.

---

## Accessibility Features

The web UI is designed for WCAG 2.1 AA compliance:

- **Skip-to-content link** — Press Tab on page load to skip to main content.
- **Keyboard navigation** — All tabs, buttons, and form fields are keyboard-accessible.
- **Screen reader support** — `aria-live` regions announce status changes and errors.
- **Focus management** — Focus is trapped in modal dialogs and restored on close.
- **Reduced motion** — Animations are disabled when `prefers-reduced-motion` is set.
- **Font size controls** — Small/Default/Large text options in the header.
- **Dark mode** — Toggle via the moon icon in the header.
- **High contrast** — CSS custom properties adapt to system contrast preferences.
- **Form validation** — Inline error messages with `role="alert"` for screen readers.

---

## FAQ

**Q: Can I run this without VS Code?**
A: The web UI works in any browser, but the AI agents require VS Code with GitHub Copilot.

**Q: Does any data leave my machine?**
A: No. The server runs on `127.0.0.1` only. All data is stored locally in your repository as files.

**Q: What happens if VS Code crashes mid-pipeline?**
A: All progress is saved to `session-state.json`. Just reopen VS Code, start a new Copilot Chat, and type `CONTINUE`.

**Q: Can I skip phases?**
A: Yes — use partial commands like `CREATE TECH MyProject` to run only Phase 2.

**Q: How do I reset the project?**
A: Delete the session state file at `.github/docs/session/session-state.json` and start fresh.

**Q: Can I run multiple projects simultaneously?**
A: Not in the same repository. Each repository supports one active session.

**Q: How many story points per sprint?**
A: The default is 30 SP per 2-week sprint (configurable via decisions).

---

## Troubleshooting

### Server won't start
- Ensure Node.js ≥ 18 is installed: `node --version`
- Check port 3000 is available: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
- The server binds to `127.0.0.1` only — if you need a different port, set the `SERVER_PORT` environment variable.

### Web UI shows "Server unreachable"
- Verify the server is still running in your terminal.
- Check the terminal for error messages.
- The UI retries automatically — wait a few seconds.

### Copilot Chat doesn't respond to commands
- Ensure GitHub Copilot is active (check the Copilot icon in VS Code status bar).
- Start a **new** Copilot Chat conversation if the current one is too long.
- Verify the workspace includes the `.github/copilot-instructions.md` file.

### Tests fail after pulling updates
```bash
npm install          # Update dev dependencies
npm test             # Re-run tests
npm run lint         # Check for lint issues
```

### "JS heap out of memory" errors
This happens when a Copilot Chat conversation accumulates too much context. Start a new conversation and type `CONTINUE` — all progress is preserved in session state.

### Questionnaires not showing up
- Verify questionnaire files exist in `BusinessDocs/` subdirectories.
- Check that the server can read the files (correct working directory).
- Refresh the page — questionnaires are loaded on tab activation.

### Decisions not saving
- Check that `.github/docs/decisions.md` exists and is writable.
- Look for error messages in the browser console (F12 → Console tab).
- The server creates backups before writing — check for `.bak` files if data seems lost.
