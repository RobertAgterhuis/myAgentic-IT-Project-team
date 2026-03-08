# File System Reference

> Complete map of the repository — what each directory and key file does, which agents write where, and what's safe to modify.

---

## Top-level structure

```
myAgentic-IT-Project-team/
├── .github/                    ← System internals (agents, docs, webapp, CI)
├── BusinessDocs/               ← User-facing project data (briefs, questionnaires, official docs)
├── docs/                       ← Public documentation (GitHub Pages, manuals)
├── Workitems/                  ← Feature-specific workspaces (created by FEATURE command)
├── CONTRIBUTING.md             ← Contribution guidelines
├── LICENSE                     ← License file
├── Readme.md                   ← Project README
└── SECURITY.md                 ← Security policy
```

---

## `.github/` — System internals

### Agent skill files — `.github/skills/`

| File pattern | Purpose | Modified by |
|-------------|---------|------------|
| `00-orchestrator.md` | Orchestrator rules and flow | System maintainers only |
| `01-business-analyst.md` through `37-scope-change-agent.md` | One skill file per agent (38 total) | System maintainers only |

These files define agent behavior. **Do not modify** unless you're changing the system itself.

### System documentation — `.github/docs/`

| Path | Purpose | Written by | Safe to edit? |
|------|---------|-----------|---------------|
| `agent-index.md` | Lookup table for all skills, guardrails, contracts | System maintainers | No |
| `mode-guide.md` | CREATE vs AUDIT mode guidance | System maintainers | No |
| `README.md` | Overview of the docs/ structure | System maintainers | No |
| `analytics-events.json` | Event tracking definitions | System maintainers | No |

### Contracts — `.github/docs/contracts/`

25 contract files defining the input/output format for every agent type. These are **agent-facing specifications** — they tell each agent what to produce and what to expect as input.

Key contracts:
| File | Defines |
|------|---------|
| `session-state-contract.md` | Session state format, lifecycle, state machine |
| `human-escalation-protocol.md` | How agents ask you questions |
| `implementation-output-contract.md` | What the Implementation Agent produces |
| `test-output-contract.md` | Test report format |
| `pr-review-output-contract.md` | PR review and sprint completion format |
| `tooling-contract.md` | Required tools and verification |

**Do not modify** contracts unless you're changing agent behavior.

### Guardrails — `.github/docs/guardrails/`

10 guardrail files that define rules agents must follow:

| File | Scope |
|------|-------|
| `00-global-guardrails.md` | Universal rules (all agents) |
| `01-business-guardrails.md` | Phase 1 agents |
| `02-architecture-guardrails.md` | Phase 2 agents |
| `03-security-guardrails.md` | Security constraints |
| `04-ux-guardrails.md` | Phase 3 agents |
| `05-marketing-guardrails.md` | Phase 4 agents |
| `06-implementation-guardrails.md` | Phase 5 agents |
| `07-legal-guardrails.md` | Legal constraints |
| `08-content-guardrails.md` | Content rules |
| `09-questionnaire-guardrails.md` | Questionnaire formatting |

**Do not modify** unless you're changing system rules.

### Templates — `.github/docs/templates/`

4 template files used by agents to format their outputs (analysis, recommendations, sprint plan, guardrails). **Do not modify.**

### Playbooks — `.github/docs/playbooks/`

| File | Purpose |
|------|---------|
| `software-creation-playbook.md` | Full CREATE mode process |
| `commercial-software-audit-playbook.md` | AUDIT mode process |

Agent-facing process definitions. **Do not modify** unless changing the system flow.

### Decisions — `.github/docs/decisions.md` + `.github/docs/decisions/`

| Path | Purpose | Written by | Safe to edit? |
|------|---------|-----------|---------------|
| `decisions.md` | Index file — open questions + category registry | You + web UI + Orchestrator | **Yes** |
| `decisions/*.md` | Category files (11 technology stacks) | You + web UI + Orchestrator | **Yes** (header status, decision rows) |

This is your primary communication channel with the agent team. See the [Decisions help file](../.github/help/decisions.md) for details.

### Session state — `.github/docs/session/`

| File | Purpose | Written by | Safe to edit? |
|------|---------|-----------|---------------|
| `session-state.json` | Current cycle progress | Orchestrator + Onboarding Agent | **Carefully** (for recovery only) |
| `command-queue.json` | Queued command from web UI | Web UI Command Center | Transient — auto-consumed |
| `reevaluate-trigger.json` | Reevaluation trigger from web UI | Web UI Decisions tab | Transient — auto-consumed |
| `README.md` | Explains the session directory | — | No |

### Brand assets — `.github/docs/brand/`

| File | Purpose | Written by |
|------|---------|-----------|
| `brand-guidelines.md` | Color palette, typography, spacing, logo usage | Brand Strategist (Phase 4) + Brand & Assets Agent |
| `content-style-guide.md` | Tone of voice, writing rules | Content Strategist (Phase 3) |
| `design-tokens.json` | Machine-readable design tokens | Brand & Assets Agent (Canva or manual) |

Generated after Phase 4. **Safe to review and suggest changes** — changes take effect via the decision system or reevaluation.

### Storybook — `.github/docs/storybook/`

| File | Purpose | Written by |
|------|---------|-----------|
| `component-inventory.md` | UI component library + a11y baseline | Storybook Agent |

Generated after Phase 4, before Synthesis.

### Synthesis — `.github/docs/synthesis/`

| File | Purpose | Written by |
|------|---------|-----------|
| `final-report-master.md` | Executive summary, heatmap, risk matrix, roadmap | Synthesis Agent |
| `final-report-business.md` | Business discipline report | Synthesis Agent |
| `final-report-tech.md` | Tech discipline report | Synthesis Agent |
| `final-report-ux.md` | UX discipline report | Synthesis Agent |
| `final-report-marketing.md` | Marketing discipline report | Synthesis Agent |
| `cross-team-blocker-matrix.md` | All cross-team dependencies | Synthesis Agent |

You must **APPROVE** all 6 before Phase 5 starts. These are read-only after approval.

### Security — `.github/docs/security/`

| File | Purpose | Written by |
|------|---------|-----------|
| `security-handoff-context.md` | Security constraints for all Phase 5 agents | Security Architect (Phase 2) |
| `sprint-[SP-N]-secret-scan.md` | Secret scan results per sprint | PR/Review Agent |

### Audit trail — `.github/docs/audit/`

| File | Purpose |
|------|---------|
| `audit-log.jsonl` | Append-only log of all system actions |

Auto-generated. **Do not modify.**

### Retrospectives — `.github/docs/retrospectives/` (created in Phase 5)

| File | Purpose | Written by |
|------|---------|-----------|
| `sprint-[SP-N]-retrospective.md` | Per-sprint retrospective (immutable) | Retrospective Agent |
| `lessons-learned.md` | Cumulative lessons, top-3 injected into next sprint | Retrospective Agent |
| `velocity-log.json` | Machine-readable velocity data | Retrospective Agent |

### Metrics — `.github/docs/metrics/` (created in Phase 5)

| File | Purpose | Written by |
|------|---------|-----------|
| `sprint-[SP-N]-kpi.json` | KPI measurements per sprint | KPI Agent |
| `kpi-trend.md` | Trend analysis across sprints | KPI Agent |

---

## `BusinessDocs/` — Project data

| Path | Purpose | Written by | Safe to edit? |
|------|---------|-----------|---------------|
| `project-brief.md` | Your project requirements (saved from Command Center) | You (via web UI) | **Yes** |
| `Phase1-Business/` | Phase 1 analysis outputs + questionnaires | Phase 1 agents + Questionnaire Agent | Review only |
| `Phase2-Tech/` | Phase 2 analysis outputs + questionnaires | Phase 2 agents + Questionnaire Agent | Review only |
| `Phase3-UX/` | Phase 3 analysis outputs + questionnaires | Phase 3 agents + Questionnaire Agent | Review only |
| `Phase4-Marketing/` | Phase 4 analysis outputs + questionnaires | Phase 4 agents + Questionnaire Agent | Review only |
| `OfficialDocuments/` | Consolidated documents (product vision, financial model, etc.) | Questionnaire Agent | Review only |
| `questionnaire-index.md` | Master index of all questionnaires and answer status | Questionnaire Agent | Answers only |

### Questionnaire structure per phase:
```
BusinessDocs/Phase[N]-[Discipline]/
├── Questionnaires/
│   ├── [agent-name]-questionnaire.md     ← Questions for you
│   └── ...
├── [agent-name]-analysis.md              ← Agent output
├── [agent-name]-recommendations.md       ← Agent output
├── [agent-name]-sprintplan.md            ← Agent output
└── [agent-name]-guardrails.md            ← Agent output
```

---

## `docs/` — Public documentation

| File | Purpose | Written by | Safe to edit? |
|------|---------|-----------|---------------|
| `index.md` | GitHub Pages landing page | System maintainers | Yes |
| `user-manual.md` | User guide | Documentation Agent (Phase 5) | After sprint |
| `technical-manual.md` | API reference + architecture | Documentation Agent (Phase 5) | After sprint |
| `contributing.md` | Developer contribution guide | System maintainers | Yes |
| `data-dictionary.md` | Data entity catalog | System maintainers | Yes |
| `brand-guidelines.md` | Public copy of brand guide | Documentation Agent | After sprint |
| `decisions-architecture.md` | Decision system technical reference | System maintainers | Yes |
| `file-system-reference.md` | This file | System maintainers | Yes |

---

## `Workitems/` — Feature workspaces (on demand)

Created by the `FEATURE [name]` command. Each feature gets an isolated directory:

```
Workitems/
└── [FEATURENAME]/
    ├── 00-feature-request.md          ← Feature definition
    ├── Phase1-Business/               ← Mini-cycle outputs
    ├── Phase2-Tech/
    ├── Phase3-UX/
    ├── Phase4-Marketing/
    └── sprint-plan.md                 ← Feature-specific sprint plan
```

Feature workspaces have their own sprint IDs and Sprint Gate, independent of the main project cycle.

---

## `.github/webapp/` — Web UI application

| File | Purpose |
|------|---------|
| `server.js` | Express server (API + static files) |
| `mcp-server.js` | MCP server for Copilot integration |
| `index.html` | Single-page UI (Command Center, Pipeline, Questionnaires, Decisions, Agents) |
| `frontend-utils.js` | Shared UI utilities |
| `store.js` | State management |
| `schemas.js` | Validation schemas |
| `models.js` | Data models |
| `audit.js` | Audit logging |
| `cache.js` | Server-side caching |
| `strings.js` | UI string constants |
| `start.ps1` | PowerShell startup script |
| `utils/` | Utility modules |

### Tests: `.github/tests/` + `.github/webapp/*.test.js`

| Path | Purpose |
|------|---------|
| `tests/unit/` | Unit tests |
| `tests/integration/` | Integration tests |
| `webapp/*.test.js` | Webapp-specific tests |

Run with: `cd .github && npm test`

---

## CI/CD — `.github/workflows/`

| File | Purpose |
|------|---------|
| `ci.yml` | Continuous integration (lint + test) |
| `release.yml` | Release workflow |
| `my-agentic-team-board-sync.yml` | GitHub Project board synchronization |

---

## What's safe to delete?

| Path | Safe to delete? | Consequence |
|------|----------------|-------------|
| `session-state.json` | Yes | Loses current progress; can start fresh |
| `command-queue.json` | Yes | Loses queued (unconsumed) command |
| `reevaluate-trigger.json` | Yes | Cancels pending reevaluation |
| `BusinessDocs/` contents | With caution | Loses all phase outputs and questionnaire answers |
| `.github/docs/synthesis/` contents | With caution | Must re-run Synthesis Agent |
| Anything in `.github/skills/`, `contracts/`, `guardrails/` | **No** | Breaks agent behavior |
| `session-state-*-archived.json` | Yes | Old session archives, safe to clean up |
