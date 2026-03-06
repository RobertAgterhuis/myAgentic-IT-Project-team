# devAgentic – End-to-End Software Solution Creation & Audit

A **multi-agent system** of 38 specialized AI agents that creates complete, production-ready software solutions — or audits existing ones — through a structured four-phase analysis followed by autonomous sprint-by-sprint implementation.

> **Quick result:** A full Phase 1–4 cycle that takes 7–10 weeks manually completes in **5–10 working days** with this agentic team, requiring only **7–12 hours of active attention** from you.

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

**2. Start a project** — type in the Copilot Chat:

```text
CREATE MyProject
```

The Onboarding Agent will ask intake questions. Answer them completely — output quality depends on it.

> Auditing existing software? Use `AUDIT MyProject` instead.

**3. Track progress** — generated files appear in `.github/docs/`. A GitHub Kanban project is created automatically.

**4. (Optional) Launch the web UI** for managing questionnaires and decisions:

```bash
node .github/webapp/server.js
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

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

BusinessDocs/                 ← Questionnaires + official business documents (generated per phase)
Documentation/                ← User manual + technical manual (generated in Phase 5)
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

## Documentation

For the full guide including all agents, FAQ, troubleshooting, and ground rules, see:

**[`.github/docs/README.md`](.github/docs/README.md)**
