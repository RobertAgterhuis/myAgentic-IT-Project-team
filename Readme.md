# Agentic IT Project Team – End-to-End Software Solution Creation & Audit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js ≥ 18](https://img.shields.io/badge/Node.js-%E2%89%A518-green.svg)](https://nodejs.org/)
[![Tests: 506 passing](https://img.shields.io/badge/Tests-506%20passing-brightgreen.svg)](#testing)
[![Coverage: 95%+](https://img.shields.io/badge/Coverage-95%25%2B-brightgreen.svg)](#testing)
[![ESLint: 0 errors](https://img.shields.io/badge/ESLint-0%20errors-brightgreen.svg)](#code-quality)

A **multi-agent system** of 38 specialized AI agents that creates complete, production-ready software solutions — or audits existing ones — through a structured four-phase analysis followed by autonomous sprint-by-sprint implementation.

> **Quick result:** A full Phase 1–4 cycle that takes 7–10 weeks manually completes in **5–10 working days** with this agentic team, requiring only **7–12 hours of active attention** from you.

---

## Features

- **38 specialized AI agents** — Business Analyst, Software Architect, UX Designer, Brand Strategist and 34 more
- **Dual-mode operation** — CREATE new solutions or AUDIT existing software
- **4-phase analysis pipeline** — Requirements → Architecture → UX/UI → Brand & Growth
- **Autonomous sprint execution** — Phase 5 implements story-by-story with testing, review, and KPI tracking
- **Command Center web UI** — Visual pipeline view, questionnaire management, and decision tracking
- **Built-in quality gates** — Critic + Risk agents validate every phase and sprint
- **Mutation audit trail** — Append-only JSON Lines log of all data mutations
- **Resumable sessions** — Checkpoint-and-yield design survives conversation resets
- **Accessibility baseline** — WCAG 2.1 AA compliant web UI with skip-nav, aria-live regions, keyboard navigation
- **Zero external runtime dependencies** — Pure Node.js HTTP server, no npm packages at runtime

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 (zero external dependencies) |
| Server | Native `http` module, localhost only (127.0.0.1:3000) |
| Data | File-based JSON/Markdown storage with atomic writes |
| Testing | [Vitest](https://vitest.dev/) + [@vitest/coverage-v8](https://vitest.dev/guide/coverage) |
| Linting | [ESLint 9](https://eslint.org/) (flat config, 7 rules) |
| AI Agents | [GitHub Copilot](https://github.com/features/copilot) agents in VS Code |
| License | MIT |

---

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| **GitHub account** | With repository access (the system creates a Kanban project automatically) |
| **GitHub Copilot** | Active subscription (Individual, Business, or Enterprise) |
| **VS Code** | Agents run as Copilot Agents in the VS Code editor |
| **Git** | Local installation for repository management |
| **Node.js ≥ 14** | For the Questionnaire & Decisions Manager web UI (`node .github/webapp/server.js`) |

---

## Quick Start

**1. Open this workspace in VS Code** with Copilot enabled.

**2. (Recommended) Launch the Command Center web UI:**

```bash
node .github/webapp/server.js
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

**3. Start a project** — in the Command Center:
- Select **CREATE** (or **AUDIT** for existing software)
- Enter a project name
- Optionally paste your full requirements in the **Project Brief** field (saved as a file, not sent to chat)
- Click **Queue Command** and paste the short command into Copilot Chat

Alternatively, type directly in Copilot Chat:
```text
CREATE MyProject
```

**4. Follow the agent pipeline:**
- The Orchestrator runs **one agent at a time** — type **CONTINUE** after each
- At **phase boundaries**, start a **new Copilot Chat** and type **CONTINUE** (all progress is preserved)
- Critic + Risk Agents validate every phase and every sprint automatically
- Track progress in the Command Center pipeline view

**5. Answer questionnaires & decisions** — when agents need your input, questions appear in the **Questionnaires** tab. Use the **Decisions** tab to create decisions or answer open questions. Answer them, then run `REEVALUATE` for improved results.

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `CREATE [project]` | Build a complete new software solution |
| `AUDIT [project]` | Comprehensive analysis of existing software |
| `CREATE BUSINESS\|TECH\|UX\|MARKETING [project]` | Partial run per discipline |
| `CREATE SYNTHESIS` | Merge previously completed partial designs |
| `FEATURE [name]: [description]` | Add new functionality (isolated full cycle) |
| `REEVALUATE [scope]` | Reassess after incremental changes |
| `SCOPE CHANGE [DIMENSION]: [description]` | Handle fundamental premise changes |
| `HOTFIX [description]` | Critical production fix (bypasses Sprint Gate) |
| `REFRESH ONBOARDING` | Re-scan codebase without re-asking intake questions |

---

## Project Structure

```
.github/
  copilot-instructions.md     ← System instructions (Orchestrator entry point)
  package.json                ← Dev dependencies and npm scripts
  vitest.config.mjs           ← Test configuration
  eslint.config.mjs           ← Lint configuration
  skills/                     ← 38 agent skill files (00-orchestrator … 37-scope-change-agent)
  docs/
    contracts/                ← Output contracts per deliverable type
    guardrails/               ← Domain guardrails (00-global … 09-questionnaire)
    playbooks/                ← Process playbooks (CREATE + AUDIT)
    templates/                ← Markdown templates for agent outputs
    onboarding/               ← Onboarding Agent output (generated at first run)
    session/                  ← Session state (generated at runtime)
    synthesis/                ← Final reports + blocker matrix (generated post-Phase 4)
    brand/                    ← Design tokens + brand assets (generated post-Phase 4)
    storybook/                ← Component inventory (generated post-Phase 4)
    decisions.md              ← YOUR decisions & open questions (edit this directly)
    mode-guide.md             ← CREATE vs AUDIT mode guide
    README.md                 ← Full documentation hub
  webapp/                     ← Questionnaire & Decisions Manager web UI
  help/                       ← Help content files for the web UI
  tests/
    unit/                     ← Unit tests (models, cache, schemas, sanitization, etc.)
    integration/              ← Integration tests (API, SSE, store, regression suite)

BusinessDocs/                 ← Questionnaires + official business documents (generated per phase)
docs/                         ← GitHub Pages site: user manual, technical manual, data dictionary, brand guidelines
Workitems/                    ← Isolated workspaces per FEATURE command (generated on demand)
```

---

## Key Concepts

- **Phases 1–4** produce Analysis → Recommendations → Sprint Plan → Guardrails per discipline
- **Phase 5** implements the solution sprint-by-sprint with automated testing, PR review, and KPI tracking
- **Critic + Risk Agents** validate every phase before handoff
- **`decisions.md`** is your direct communication channel — `DECIDED` entries become hard constraints; `HIGH` + `OPEN` entries block sprint start
- **Questionnaires** are generated for missing data — answer them, then `REEVALUATE` for improved results
- **All findings cite sources** — file, line number, or document reference (Anti-Hallucination Protocol)

---

## How the Agentic Team Works

The system is designed to be **reliable and resumable** even for large, complex projects. Three key design principles ensure stability:

### Project Brief as File
When launching a CREATE or AUDIT command via the Command Center, you can paste your full project requirements in the **Project Brief** field. This is saved to `BusinessDocs/project-brief.md` — a file the Onboarding Agent reads from disk. The chat command stays short, preventing context overload and network timeouts.

### One Agent at a Time (Checkpoint-and-Yield)
The Orchestrator runs exactly **one agent per conversation turn**. After each agent completes, its output is saved to disk, `session-state.json` is updated, and the Orchestrator yields — prompting you to type **CONTINUE**. This prevents memory overload and makes the entire process resumable. If anything fails, just type CONTINUE to pick up where you left off.

### Fresh Conversations per Phase
At phase boundaries (after Critic + Risk validation passes), the Orchestrator instructs you to **start a new Copilot Chat conversation** and type **CONTINUE**. This resets accumulated conversation history — preventing "JS heap out of memory" crashes — while `session-state.json` preserves all progress. The Command Center pipeline view is unaffected by conversation resets.

---

## Documentation

For the full guide including all agents, FAQ, troubleshooting, and ground rules, see:

**[`.github/docs/README.md`](.github/docs/README.md)**

---

## Testing

All dev tooling lives inside `.github/`. Run commands from that directory:

```bash
cd .github
npm install   # first time only
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (re-run on file changes)
npm run test:watch
```

The test suite includes **506 tests** across 20 files with **95%+ statement coverage**:
- **Unit tests** — models, sanitization, cache, schemas, audit trail, file locking, backup strategy
- **Integration tests** — API endpoints, SSE, store caching, decisions round-trip, regression suite
- Coverage thresholds enforced at 70% (statements, branches, functions, lines)

## Code Quality

```bash
cd .github
npm run lint
```

ESLint 9 flat config enforces 7 rules: `complexity` (max 8), `no-unused-vars`, `no-var`, `prefer-const`, `eqeqeq`, `no-eval`, `no-implied-eval`. Current status: **0 errors, 0 warnings**.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding standards, and PR process.

---

## License

[MIT](LICENSE) — Copyright (c) 2026 Robert Agterhuis
