# Advanced Commands — FEATURE, SCOPE CHANGE & HOTFIX

The [Commands Reference](commands.md) lists every command. This page goes deeper into the three on-demand commands that operate **outside** the normal phase cycle: FEATURE, SCOPE CHANGE, and HOTFIX.

---

## FEATURE — Add a New Feature

```
FEATURE [name]: [description]
```

Use this when you want to add a new feature to an existing application that has already completed the main design cycle (Phases 1–4 + Synthesis).

### What Happens

1. **Intake** — The Feature Agent parses your description and produces a Feature Request Document (`Workitems/[FEATURENAME]/00-feature-request.md`). If the description is too vague (fewer than 2 concrete behavioral expectations), the system asks for clarification.

2. **Full mini-cycle** — All 20 domain agents analyze the feature from their perspective, in the same Phase 1 → 2 → 3 → 4 order as the main cycle. Each phase gets its own Critic + Risk validation.

3. **Synthesis** — A feature-specific synthesis report is produced with cross-domain findings, integration risks, KPI targets, and feature-specific guardrails.

4. **Sprint Plan** — Stories are generated with IDs like `FT-[FEATURENAME]-S1-001`. These have their own Sprint Gate, independent from the main sprint cycle.

5. **Implementation** — Each sprint follows the same Implementation → Test → PR/Review → KPI → Documentation → GitHub flow.

### Isolated Workspace

Everything lives in `Workitems/[FEATURENAME]/`:

```
Workitems/
  [FEATURENAME]/
    00-feature-request.md
    phase-1/
    phase-2/
    phase-3/
    phase-4/
    synthesis/
    sprintplan/
    implementation/
```

No feature agent writes outside this directory. The existing project is used as read-only context.

### Good Feature Descriptions

| Quality | Example |
|---------|---------|
| Too vague | `FEATURE dark-mode: add dark mode` |
| Good | `FEATURE dark-mode: Add a dark mode toggle to the settings page that persists the user's preference in localStorage, applies a dark color scheme across all pages, and respects the OS-level prefers-color-scheme setting` |

The more specific you are about **who benefits**, **what the behavior should be**, and **what constraints apply**, the better the agents can analyze the feature.

### When to Use FEATURE vs a Regular Sprint Story

| Situation | Use |
|-----------|-----|
| New capability that touches business, tech, UX, and marketing | `FEATURE` |
| Bug fix or small improvement within an existing component | Regular sprint story |
| Adding a page that requires new data models, API endpoints, and UI | `FEATURE` |
| Changing the text on a button | Regular sprint story |

---

## SCOPE CHANGE — Change Project Direction

```
SCOPE CHANGE [DIMENSION]: [description]
```

Use this when the **fundamental premise** of your project has changed — not just a detail, but the direction itself.

### When SCOPE CHANGE is Appropriate

| Appropriate (SCOPE CHANGE) | Not appropriate (use REEVALUATE instead) |
|----------------------------|------------------------------------------|
| Business model pivot: B2C → B2B | New dependency was added |
| Architecture change: monolith → microservices | Code evolved, some findings are outdated |
| Target audience change: consumer → enterprise | A finding was resolved or a new risk appeared |
| Revenue model change: subscription → marketplace | Infrastructure was updated |
| Core module replaced entirely | A bug was found and fixed |

### DIMENSION Values

| Dimension | What Gets Re-Analyzed |
|-----------|----------------------|
| `BUSINESS` | Phase 1 agents: Business Analyst, Domain Expert, Sales Strategist, Financial Analyst, Product Manager |
| `TECH` | Phase 2 agents: Software Architect, Senior Developer, DevOps Engineer, Security Architect, Data Architect, Legal Counsel |
| `UX` | Phase 3 agents: UX Researcher, UX Designer, UI Designer, Accessibility Specialist, Content Strategist, Localization Specialist |
| `MARKETING` | Phase 4 agents: Brand Strategist, Growth Marketer, CRO Specialist + Brand Assets + Storybook |
| `ALL` | All agents across all 4 phases |

### What Happens

1. **Intake** — The Scope Change Agent asks you to clarify the old premise vs. the new premise if your description is ambiguous.

2. **Backlog Hold** — All sprint tickets whose source findings are affected get status `SCOPE_CHANGE_HOLD`. Nothing is deleted — holds are reversible. Already completed tickets are tagged `SC-[N]_COMPLETED_UNREVIEWED` (informational only, not rolled back).

3. **Invalidation Marking** — Affected sections in existing phase outputs get a visible warning header (`SCOPE_CHANGE_INVALIDATED` or `SCOPE_CHANGE_PARTIALLY_VALID`). Original content is preserved underneath.

4. **Re-Analysis** — Only the affected dimension's agents run. They receive the new premise as primary input and are forbidden from inheriting conclusions from invalidated sections. Every re-analysis output must start with a `## Scope Change Impact` section.

5. **Critic + Risk** — The re-analysis goes through quality gates with additional scope-change-specific checks.

6. **Delta Report** — A scope change report is produced at `.github/docs/synthesis/scope-change-[N].md` with invalidated findings, new findings, sprint reconciliation, and updated guardrails.

7. **Sprint Reconciliation** — Held tickets are either REQUEUED (still valid), SUPERSEDED (replaced by new work), or CANCELLED. The Sprint Gate enforces this before any sprint resumes.

8. **Official Documents** — Documents that need updating are flagged as `REQUIRED_BEFORE_SPRINT`. The Questionnaire Agent updates them before held sprints are released.

### Good Scope Change Descriptions

| Quality | Example |
|---------|---------|
| Too vague | `SCOPE CHANGE BUSINESS: we're changing direction` |
| Good | `SCOPE CHANGE BUSINESS: Pivoting from B2C subscription model to B2B enterprise licensing. Previous assumption was individual consumers paying monthly; new model is annual contracts with IT procurement departments. Pricing, onboarding flow, and support model all change.` |

Always state: **old assumption → new assumption → why**.

---

## HOTFIX — Emergency Production Fix

```
HOTFIX [description]
```

Use this for **critical production issues only** — things that are actively breaking the application or exposing security vulnerabilities.

### Criticality Thresholds

A HOTFIX is appropriate when:
- **Security vulnerability** is actively exploitable
- **Data loss or corruption** is occurring
- **Application is down** or critical functionality is broken
- **Compliance deadline** is being missed

A HOTFIX will be **rejected** if:
- It's a feature request or enhancement
- It's a non-blocking bug that can wait for the next sprint
- It's a performance issue that doesn't affect availability

If rejected, you'll see: `⚠️ HOTFIX REJECTED — [description] does not meet criticality thresholds. Use a regular sprint story instead.`

### What Happens

```
HOTFIX [description]
  → Orchestrator validates criticality
  → Sprint Gate BYPASS (Definition of Ready skipped)
  → Implementation Agent (hotfix scope only)
  → Test Agent (abbreviated: repaired functionality + 1-layer regression)
  → PR/Review Agent (secret scan mandatory)
  → Merge
  → KPI Agent + Documentation Agent + GitHub Integration Agent
  → Retrospective Agent
  → LESSON_CANDIDATE auto-generated
```

Key differences from a normal sprint:
- **Sprint Gate is bypassed** — no Definition of Ready check
- **Testing is abbreviated** — only the repaired functionality plus one layer of related modules
- **Sprint ID** uses `HOTFIX-[N]` format (numbered separately)
- **A LESSON_CANDIDATE is always generated** — every hotfix produces a learning entry
- If the hotfix implies a structural constraint, a `DECIDED` item is added to `.github/docs/decisions.md`

### Concurrency with Active Sprints

If a regular sprint is running when a HOTFIX is triggered:
- The sprint is **not paused** unless the hotfix touches overlapping files
- Overlapping `IN_PROGRESS` stories move to `BLOCKED` with reason `HOTFIX_OVERLAP: HOTFIX-[N]`
- After the hotfix merges, tests re-run for all blocked stories
- Hotfix PRs always have merge priority over regular sprint PRs

---

## Choosing the Right Command

| Situation | Command |
|-----------|---------|
| Adding a significant new feature | `FEATURE [name]: [description]` |
| Project direction fundamentally changed | `SCOPE CHANGE [DIMENSION]: [description]` |
| Critical production issue | `HOTFIX [description]` |
| Code evolved, findings are outdated | `REEVALUATE [scope]` |
| Need to re-scan workspace and tooling | `REFRESH ONBOARDING` |
| Resume after an interruption | `CONTINUE` |

---

## Interaction Between Advanced Commands

### FEATURE + SCOPE CHANGE
If a scope change invalidates an in-progress feature, the feature's held tickets follow the same `SCOPE_CHANGE_HOLD` process. The feature must re-evaluate against the new premise before resuming.

### HOTFIX + SCOPE CHANGE
A hotfix can run during a scope change cycle. The hotfix takes priority — scope change re-analysis pauses if there's file overlap and resumes after the hotfix merges.

### HOTFIX + Active Sprint
Hotfix PRs always take merge priority. Overlapping stories are blocked until the hotfix is merged and regression tests pass.

---

## See Also

- [Commands Reference](commands.md) — full command list with syntax
- [Sprints](sprints.md) — how regular Sprint Gate and sprint cycles work
- [Quality Gates](quality-gates.md) — Critic + Risk validation during FEATURE and SCOPE CHANGE
- [Troubleshooting](troubleshooting.md) — what to do when commands fail or sessions stall
