# Questionnaires

## What are questionnaires?

During each analysis phase, agents may encounter topics where they need your input. Instead of blocking, they mark items as `INSUFFICIENT_DATA` and the **Questionnaire Agent** generates customer-facing questions for you.

These questionnaires appear in the **Questionnaires tab** of this webapp.

## How to answer

1. Switch to the **Questionnaires tab**
2. Browse questionnaire files in the left sidebar — they're grouped by phase
3. Each question card shows:
   - **Question ID** (e.g. `Q-TECH-001`)
   - **Priority** badge: `REQUIRED` or `OPTIONAL`
   - **Status** badge: `OPEN` or `ANSWERED`
   - **Context** about why this question matters
4. Type your answer in the text area
5. Set the status to `ANSWERED`
6. Click **Save All** (or press `Ctrl+S`) to persist changes

## Where are they stored?

Questionnaire files live in:
```
BusinessDocs/Phase1-Business/Questionnaires/
BusinessDocs/Phase2-Tech/Questionnaires/
BusinessDocs/Phase3-UX/Questionnaires/
BusinessDocs/Phase4-Marketing/Questionnaires/
```

An index is maintained at `BusinessDocs/questionnaire-index.md`.

## Re-evaluation after answering

After answering questionnaires, you can trigger a **Reevaluate** to have the agents re-run their analysis with your new answers:

1. Click the **Reevaluate** button in the header
2. Select the scope (ALL, or a specific phase)
3. Click **Reevaluate**
4. Copy the generated command into Copilot chat

Items resolved by your answers will be marked `RESOLVED_BY_QUESTIONNAIRE`.

---

## The Reevaluation Workflow in Detail

### What happens when you trigger REEVALUATE

The `REEVALUATE [scope]` command starts a multi-step process:

```
REEVALUATE [scope]
  → Questionnaire Agent loads all answered questions
  → Reevaluate Agent performs a Delta Scan (what changed?)
  → Phase agents re-analyze (only affected phases)
  → Critic + Risk validation on updated output
  → Questionnaire Agent generates new questions (if new gaps found)
  → Sprint backlog is updated with the impact
```

### Scope options

| Scope | What gets re-analyzed |
|-------|----------------------|
| `PHASE-1` | Business & Strategy (agents 01–04, 34) |
| `PHASE-2` | Technology & Architecture (agents 05–09, 33) |
| `PHASE-3` | UX & Product Experience (agents 10–13, 32, 35) |
| `PHASE-4` | Brand, Marketing & Growth (agents 14–16) |
| `ALL` | All four phases completely |
| `DELTA-ONLY` | Only detect what changed — no full re-analysis |

### How your answers are used

1. **Before the delta scan starts**, the Questionnaire Agent loads all answers you have provided (both via the web UI and via direct file edits — both work identically)
2. Each answered question that resolves a previously open `INSUFFICIENT_DATA:` item is flagged as `RESOLVED_BY_QUESTIONNAIRE: [Q-ID]`
3. These resolved items are treated as **new findings** in the delta scan (type: `RESOLVED`)
4. Phase agents receive your answers as injected context when they re-run their analysis

### What the delta scan produces

The Reevaluate Agent compares the current state against the previous analysis and classifies every finding:

| Classification | Meaning |
|---------------|---------|
| **NEW** | Something not present before |
| **RESOLVED** | Previously open item that is now fixed or answered |
| **CHANGED** | Severity, context, or impact has shifted |
| **UNCHANGED** | No change — carried over without repetition |

### Impact on the sprint backlog

The reevaluation also checks how changes affect existing sprint stories:

| Sprint Status | What Can Change | What Cannot Change |
|---------------|----------------|-------------------|
| `QUEUED` | Stories can be adjusted, added, removed, reprioritized | Cannot start implementation |
| `BACKLOG` | Stories can be adjusted, promoted, or deprioritized | Cannot start implementation |
| `IN_PROGRESS` | Impact is flagged for your decision (continue / pause / rework) | Stories are NEVER removed or cancelled |
| `COMPLETED` | Drift is documented if detected | Completed work is NEVER rolled back |

### When new gaps appear

If the re-analysis finds new `INSUFFICIENT_DATA:` items, the Questionnaire Agent generates **new questionnaires** after Critic + Risk validation. These appear in the Questionnaires tab for you to answer, and you can trigger another `REEVALUATE` cycle when ready.

### Triggering via the web UI vs. chat

You can trigger reevaluation two ways:

| Method | How |
|--------|-----|
| **Web UI** | Click the Reevaluate button → the webapp writes `reevaluate-trigger.json` → the Orchestrator picks it up automatically at the next Sprint Gate |
| **Chat** | Type `REEVALUATE [scope]` directly into Copilot chat |

Both methods produce the same result. The web UI trigger is picked up at the next Sprint Gate (Step 0), while the chat command runs immediately.

---

## See Also

- [Quality Gates](quality-gates.md) — how Critic + Risk validation works during reevaluation
- [Sprints](sprints.md) — how Sprint Gate handles reevaluation triggers
- [Decisions](decisions.md) — how decisions interact with reevaluation
- [Advanced Commands](advanced-commands.md) — REEVALUATE vs SCOPE CHANGE (when to use which)
