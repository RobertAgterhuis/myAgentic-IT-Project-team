# Onboarding

## What is onboarding?

Onboarding is the **mandatory first step** of every project cycle — whether you run `CREATE`, `AUDIT`, or `FEATURE`. The Onboarding Agent collects, validates, and structures all the input that the 38 downstream agents need. No other agent starts until onboarding is complete.

---

## What happens during onboarding?

The process has 5 steps, executed in order:

### Step 0 — Load prior answers
If you've run a previous cycle, the agent checks `BusinessDocs/` for existing questionnaire answers. Found answers are automatically made available to all future phase agents, so you never need to repeat yourself.

### Step 1 — Input inventory
The agent catalogs everything available:

**In CREATE mode**, it looks for:
- **Project name** (required)
- **Problem statement** (required)
- **Business model** and target audience
- **Technology preferences** — language, framework, hosting, database
- **Constraints** — budget, timeline, team size, regulatory requirements
- **Reference materials** — competitor analysis, brand guidelines, user research, existing code

**In AUDIT mode**, it looks for:
- **Codebase path or repository URL** (required)
- **Audit objective** (required)
- **Documentation** — README, architecture docs, API specs, test docs
- **Previous audit results**

**In both modes**, it checks tooling (Git, file system, test runner, linter, build tool) and GitHub configuration.

> **Tip — use the Project Brief field.** In the Command Center, paste your full requirements into the **Project Brief** field before sending the command. This saves the brief as `BusinessDocs/project-brief.md`, which the Onboarding Agent reads directly from disk. This avoids context window overload and network timeouts.

### Step 2 — Minimum input validation
The agent checks whether required fields are present:

| Input | Required (CREATE) | Required (AUDIT) |
|-------|-------------------|-------------------|
| Project name / description | YES | — |
| Problem statement | YES | — |
| At least one stakeholder input | YES | — |
| Codebase accessible | — | YES |
| Audit objective | — | YES |
| At least one documentation source | — | YES |
| **GitHub project name** | **YES (both)** | **YES (both)** |

**If a required item is missing**, the cycle halts:
```
ONBOARDING_BLOCKED: [item] missing.
Required action: [what you need to provide]
Cycle does NOT start until this is resolved.
```

**If a recommended item is missing**, it's recorded as `INSUFFICIENT_DATA:` and downstream agents are told. They'll work with what's available and may generate questionnaire questions for you later.

### Step 3 — Codebase / reference scan

**AUDIT mode:** The agent performs a non-invasive surface scan — language detection, framework detection, directory structure (2 levels), CI/CD configuration, test structure, and a count of `TODO`/`FIXME`/`HACK` comments. It never reads secrets or credentials.

**CREATE mode:** If you provided a reference codebase, the same scan runs. Otherwise this step is skipped — that's normal for greenfield projects.

### Step 4 — Tooling verification
The agent checks which tools are available (Git, file system access, test runner, linter, build tool) and documents their versions. Missing tools are flagged as `TOOLING_GAP` — this doesn't block Phases 1–4 (analysis and design), but it will block Phase 5 (implementation) if critical tools are missing.

### Step 5 — Session state finalized
The agent updates `session-state.json` to `ONBOARDING_COMPLETE` and records the output path, GitHub project name, and any `INSUFFICIENT_DATA` items. The Orchestrator takes over from here.

---

## Questions the system will ask you

During onboarding, you'll be asked at least two questions directly:

### 1. GitHub project name (mandatory)
```
What should be the name of the GitHub Kanban project
on which all work items will be published?
Example names: "Lumio Workitems", "[Project name] Board", "Sprint Backlog"
```
This name is used by the GitHub Integration Agent to create (or reuse) a project board.

### 2. Canva API token (optional)
```
Do you have a Canva Connect API token available?
The Brand & Assets Agent uses it to automatically create brand assets.
Without a token this step is skipped and design tokens are filled manually.
Enter the token, or type SKIP to continue without Canva integration.
```

---

## What makes a good project brief?

The quality of your onboarding input directly affects the quality of all 38 downstream agents. Here's what makes a brief effective:

**Include:**
- A clear problem statement — *what problem does this solve and for whom?*
- Target audience description — *who uses this and what are their needs?*
- Technology preferences — even "no preference" is useful information
- Constraints — budget, timeline, team size, regulatory requirements
- Reference materials — competitor URLs, existing brand guidelines, user research

**Avoid:**
- Vague goals like "build a good app" — be specific about what success looks like
- Conflicting requirements without prioritization — state what matters most
- Missing context — don't assume the agents know your industry domain

**How much detail is enough?**
More is better. A one-paragraph brief produces generic results. A 2–3 page brief with specific requirements, constraints, and examples produces targeted, actionable outputs across all phases.

---

## What happens after onboarding?

The Orchestrator routes to Phase 1 (Business Analysis). From here, the cycle proceeds automatically through all phases:

```
Onboarding → Phase 1 (Business) → Critic/Risk → Phase 2 (Tech) → Critic/Risk
  → Phase 3 (UX) → Critic/Risk → Phase 4 (Marketing) → Critic/Risk
  → Brand & Assets → Storybook → Synthesis → GitHub Publication → Phase 5 (Sprints)
```

At each phase boundary, you'll be asked to start a fresh Copilot Chat conversation and type `CONTINUE`. All progress is preserved in `session-state.json`.

---

## INSUFFICIENT_DATA vs. ONBOARDING_BLOCKED

| Label | Meaning | Your action |
|-------|---------|-------------|
| `ONBOARDING_BLOCKED` | A required item is missing. Cycle will not start. | Provide the missing input. |
| `INSUFFICIENT_DATA` | A recommended item is missing. Cycle continues. | Optionally provide later via a questionnaire answer. |

Items marked `INSUFFICIENT_DATA` during onboarding become candidates for **questionnaire questions** — the Questionnaire Agent may ask you about them after Phase 1 or later phases complete. Your answers are injected into agent context automatically.

---

## Re-running onboarding

If your project setup changes (e.g., new tooling installed, repository moved), you can refresh the scan without re-answering intake questions:

```
REFRESH ONBOARDING
```

This runs Steps 3 and 4 only (codebase scan + tooling verification) and updates `onboarding-output.md`. Your original intake answers are preserved.
