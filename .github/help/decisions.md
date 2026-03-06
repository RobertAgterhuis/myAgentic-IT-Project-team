# Decisions

## What are decisions?

Decisions are explicit records of choices made during the project. They're tracked in `.github/docs/decisions.md` and picked up by the Orchestrator at each Sprint Gate.

There are two types:
- **DECIDED** — A decision you've already made (e.g. "Use PostgreSQL for the database")
- **OPEN QUESTION** — Something that needs input from the agentic team

## Status lifecycle

| Status | Meaning |
|--------|---------|
| `OPEN` | Awaiting a decision or answer |
| `DECIDED` | Decision has been made and recorded |
| `DEFERRED` | Postponed for later consideration |
| `EXPIRED` | Deadline passed without resolution |

## Priority levels

- **HIGH** — Blocking or critical; affects sprint execution
- **MEDIUM** — Important but not immediately blocking
- **LOW** — Nice-to-have or informational

## Blocking decisions

Decisions marked as `BLOCKING` have a pulsing red badge and a red left border. These require urgent attention because they can block sprint progress.

## How to manage decisions

### Creating a decision
1. Click **New Decision** in the header
2. Choose type (DECIDED or OPEN QUESTION)
3. Set priority and scope
4. Enter the decision text and optional notes
5. Click **Create**

### Answering an open question
1. Find the open decision card
2. Type your answer in the answer field
3. Click **Decide** to mark it as DECIDED

### Editing a decision
Click the **Edit** button on any decision card to modify its priority, scope, text, or notes.

### Filtering decisions
Use the filter bar at the top of the Decisions tab to search by text, priority, or status.

## Cross-references

Some decisions reference questionnaire items (shown as a purple badge like `↔ Q-TECH-001`). This links the decision to a specific questionnaire question.
