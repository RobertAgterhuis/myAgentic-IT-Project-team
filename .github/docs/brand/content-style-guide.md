# Content Style Guide
> **Version:** 1.0 | **Created:** 2026-03-07 | **Story:** SP-R2-002-007 (Issue #18)
> **Source:** Agent 32 (REC-CNT-001), Content Strategy Brief, Phase 3 audit findings
> **Audience:** Semi-technical and technical users (Q-32-004)

---

## 1. Voice & Tone

### Voice Attributes

The product voice is consistent across all contexts. These five attributes define **how we sound**:

| Attribute | Description | DO | DON'T |
|-----------|-------------|-----|-------|
| **Clear** | Plain language, no unexplained jargon | "Unable to save your answer." | "Write operation failed on persistence layer." |
| **Confident** | Declarative statements, no hedging | "Your changes have been saved." | "It seems like your changes may have been saved successfully." |
| **Action-oriented** | Tell users what to do, not just what happened | "Try saving again, or check your connection." | "An error occurred." |
| **Respectful** | Treat users as capable professionals | "This questionnaire has unanswered required questions." | "You forgot to fill in the required fields!" |
| **Concise** | Shortest phrasing that preserves meaning | "Saved 3 answers." | "The system has successfully saved a total of 3 answers for you." |

### Tone Spectrum

Tone **shifts by context** while the voice stays the same:

| Context | Tone | Energy | Example |
|---------|------|--------|---------|
| **Success** | Confident, matter-of-fact | Neutral — no exclamation marks for routine actions | "Answer saved for Q-001." |
| **Milestone success** | Encouraging, brief | Warm — exclamation allowed for significant events | "Session started!" |
| **Error** | Calm, helpful | Neutral — never alarming or blaming | "Unable to save. Your changes are still in the form — try again in a moment." |
| **Guidance** | Patient, instructional | Supportive — assume good intent | "Select a command from the sidebar to launch the agentic team." |
| **Validation** | Direct, actionable | Neutral — state what's needed | "Project name is required." |
| **Transactional** | Efficient, minimal | Low — just the essentials | "Saved 3 answers." |
| **Warning** | Informative, non-alarming | Measured — state consequence clearly | "Brief is large (> 50 KB). It will still be saved, but consider trimming." |

---

## 2. Terminology Glossary

Use these canonical terms consistently. Never substitute alternatives unless noted.

### Core Domain Terms

| Canonical Term | Definition | Never Use |
|----------------|-----------|-----------|
| **Questionnaire** | A set of questions for a specific agent role | "form", "survey", "quiz" |
| **Decision** | A tracked question requiring a human answer to unblock work | "issue", "ticket" (in UI copy) |
| **Agent** | An AI role performing a specific task in the workflow | "bot", "assistant" (in product context) |
| **Sprint** | A time-boxed iteration of implementation work | "iteration", "cycle" |
| **Phase** | A numbered stage of the multi-agent analysis process (Phase 1–5) | "step" (when referring to phases), "stage" |
| **Command** | A user-initiated action that triggers the agentic workflow | "action", "task" (in Command Center context) |
| **Pipeline** | The visual representation of agent execution progress | "workflow", "process" (in UI context) |
| **Session** | An active agentic processing cycle from command launch to completion | "run", "execution" |
| **Sprint Gate** | The checkpoint between sprints validating readiness | "gate check", "review" |
| **Story** | A unit of work within a sprint | "task", "work item" (in sprint context) |

### Status Terms

| Term | Context | Casing in UI |
|------|---------|-------------|
| **Open** | Decision awaiting an answer | UPPERCASE in badges/filters, sentence case in prose |
| **Decided** | Decision answered and resolved | UPPERCASE in badges/filters, sentence case in prose |
| **Deferred** | Decision postponed intentionally | UPPERCASE in badges/filters, sentence case in prose |
| **Expired** | Decision no longer relevant | UPPERCASE in badges/filters, sentence case in prose |
| **Required** | Questionnaire question that must be answered | UPPERCASE in status badges |
| **Optional** | Questionnaire question that may be skipped | UPPERCASE in status badges |
| **Answered** | Questionnaire question with a saved response | UPPERCASE in status badges |

### Action Verbs

| Verb | Use for | Example |
|------|---------|---------|
| **Save** | Persisting user input to disk | "Save All", "Save Changes" |
| **Create** | Adding a new item | "Create" (new decision button) |
| **Launch** | Starting a command/session | "Launch command" |
| **Export** | Downloading data as a file | "Export" (session data) |
| **Reevaluate** | Re-running analysis with updated input | "Reevaluate" |
| **Decide** | Marking a decision as answered | "Decide" (action on open decision) |
| **Defer** | Postponing a decision | "Defer" (action on open decision) |
| **Expire** | Marking a decision as no longer relevant | "Expire" (action on open decision) |
| **Reopen** | Returning a resolved item to open state | "Reopen" (action on decided/deferred decision) |

---

## 3. Error Message Framework

### Structure Template

Every error message follows this three-part pattern:

```
[What happened]. [Why / reassurance]. [What to do next].
```

- **What happened** — Describe the failure in plain language. Never expose raw server errors.
- **Why / reassurance** — Briefly explain the cause or reassure the user (e.g., "Your changes haven't been lost").
- **What to do next** — Give a concrete recovery action.

For short inline errors, parts 2 and 3 can be condensed, but part 3 (recovery action) should never be omitted.

### Error Categories & Templates

| Category | Trigger | Template | Example |
|----------|---------|----------|---------|
| **Network** | Server unreachable, timeout | "Unable to reach the server. Check your connection and try again." | "Unable to save. The server may be temporarily unavailable — try again in a moment." |
| **Validation** | Missing or invalid input | "[Field] is required." / "[Field] must be [constraint]." | "Project name is required." |
| **Conflict** | Concurrent edit, stale data | "This item was updated elsewhere. Refresh to see the latest version." | "This decision was modified by another session. Refresh and try again." |
| **Permission** | File locked, read-only | "Unable to write to [target]. The file may be locked or read-only." | "Unable to save answers. The questionnaire file may be locked — check if another process is using it." |
| **Unknown** | Unrecognized server error | "Something went wrong. Try again, or check the server logs for details." | "Something went wrong while exporting. Try again, or check the server logs." |

### Rules

1. **Never** expose raw error text from the server (e.g., `Failed: ENOENT: no such file`).
2. **Never** blame the user ("You entered an invalid value").
3. **Always** include a recovery action, even if it's "Try again."
4. **Always** use the `t-err` toast class for errors.
5. Use `t-info` for validation messages that prevent an action (not technically errors).

---

## 4. Success & Confirmation Patterns

### Success Messages

| Pattern | When to use | Example |
|---------|------------|---------|
| `[Action] [object].` | Routine save/update | "Answer saved for Q-001." |
| `[Action] [count] [object](s).` | Batch operations | "Saved 3 answers." |
| `[Object] [action].` | State change | "Session exported." |
| `[Action] — [next step].` | Cross-tool handoff | "Command queued — paste in Copilot Chat to start." |

### Rules

1. **No exclamation marks** for routine operations (save, update, create).
2. **Exclamation marks allowed** for significant milestones only (session started, sprint completed).
3. Use past tense for completed actions: "Saved", "Created", "Exported" — not "Saving", "Creating".
4. Always use `t-ok` toast class for success messages.
5. Include the **specific object** when possible: "Answer saved for Q-001" rather than just "Saved."

### Confirmation Dialogs

When asking for confirmation before a destructive or significant action:

| Element | Guideline | Example |
|---------|-----------|---------|
| **Title** | Action-specific, not generic | "Defer Decision D-004" (not "Confirm Action") |
| **Body** | State the consequence clearly | "This will mark D-004 as deferred. You can reopen it later." |
| **Primary button** | Repeat the specific action verb | "Defer Decision" (not "Confirm" or "OK") |
| **Cancel button** | Always "Cancel" (exception: this is the one allowed generic label) | "Cancel" |
| **Reason field** | If present, use a descriptive placeholder | "Brief rationale for deferring" (not "Why?") |

---

## 5. Button & Label Conventions

### Button Labels

| Rule | DO | DON'T |
|------|----|-------|
| Use verb + object for primary actions | "Save Changes", "Create Decision" | "Submit", "OK", "Done" |
| Use emoji prefix for toolbar buttons | "💾 Save All", "➕ New Decision" | Plain text without visual anchor |
| Use consistent verb for same action type | "Save" everywhere for persistence | "Save" in one place, "Update" in another |
| Keep labels to 1–3 words | "Export", "Reevaluate" | "Click here to export your session data" |

### Reserved Button Labels

| Label | Reserved for |
|-------|-------------|
| **Save All** | Batch-saving all pending questionnaire changes |
| **Save Changes** | Saving edits in a modal form |
| **Create** | Adding a new decision |
| **Cancel** | Dismissing a modal without action |
| **Reevaluate** | Triggering a re-analysis cycle |
| **Export** | Downloading session data as JSON |

### Form Labels

| Rule | DO | DON'T |
|------|----|-------|
| Use sentence case | "Decision scope" | "Decision Scope" or "DECISION SCOPE" |
| Be specific | "Decision scope (e.g., Phase 2, Sprint 3)" | "Scope" |
| Include format hints in placeholders | `placeholder="e.g., Phase 2, SP-3, All sprints"` | `placeholder="Enter value"` |

---

## 6. Pronoun & Grammar Conventions

### Person

| Context | Convention | Example |
|---------|-----------|---------|
| **Guidance and help text** | Second person ("you") | "Select a command from the sidebar to launch the agentic team." |
| **System messages** | Impersonal / object-focused | "Answer saved for Q-001." (not "Your answer was saved.") |
| **Error messages** | Impersonal — never blame | "Project name is required." (not "You must enter a project name.") |
| **Confirmation prompts** | Second person for questions | "This will mark the decision as deferred. Continue?" |

### Grammar Rules

| Rule | DO | DON'T |
|------|----|-------|
| **Sentence case** for all UI text | "Loading questionnaires…" | "Loading Questionnaires…" |
| **No period** on single-sentence toasts | "Saved 3 answers" | "Saved 3 answers." |
| **Period** on multi-sentence messages | "Unable to save. Try again in a moment." | "Unable to save Try again in a moment" |
| **Use an ellipsis** (…) for loading/in-progress states | "Loading questionnaires…" | "Loading questionnaires..." (three dots) |
| **Use an em dash** (—) for supplementary info | "Server unreachable — retrying automatically…" | "Server unreachable, retrying automatically" |
| **Oxford comma** in lists of 3+ items | "save, export, and reevaluate" | "save, export and reevaluate" |

---

## 7. Empty States

Every empty state should include three elements:

| Element | Purpose | Example |
|---------|---------|---------|
| **Icon** | Visual anchor, sets context | 🚀 (Command Center), 📋 (Questionnaires), ⚖ (Decisions) |
| **Title** | Name the state clearly | "Command Center" / "No decisions match filters" |
| **Description** | Guide the user to the next action | "Select a command from the sidebar to launch the agentic team." |

### Empty State Copy Per View

| View | Condition | Title | Description |
|------|-----------|-------|-------------|
| **Command Center** | No session active | "Command Center" | "Select a command from the sidebar to launch the agentic team. The pipeline below will show real-time progress once a session is active." |
| **Questionnaires** | No questionnaires found | *(icon only)* | "No questionnaires found." |
| **Decisions** | No decisions exist | "No decisions yet" | "Click **+ New Decision** to create one, or agents will add open questions during analysis." |
| **Decisions** | Filters yield no results | "No decisions match filters" | "Try adjusting the search or filter criteria." |
| **Pipeline** | Waiting for agents | "Waiting for agents…" | *(step-by-step progress indicators)* |

---

## 8. Content Checklist for PR Reviews

Use this checklist when reviewing any PR that adds or modifies user-facing copy:

### Voice & Tone
- [ ] Copy matches the voice attributes (clear, confident, action-oriented, respectful, concise)
- [ ] Tone is appropriate for the context (error, success, guidance, transactional, warning)
- [ ] No exclamation marks on routine actions (save, update, create)

### Terminology
- [ ] All domain terms match the glossary (Section 2)
- [ ] No prohibited synonyms used (e.g., "form" instead of "questionnaire")
- [ ] Status terms use correct casing convention (UPPERCASE in badges, sentence case in prose)

### Error Messages
- [ ] Error follows the three-part framework: what happened + why + what to do next
- [ ] No raw server error text exposed to users
- [ ] Recovery action is included
- [ ] Error never blames the user

### Success Messages
- [ ] Uses past tense for completed actions
- [ ] Includes specific object when possible
- [ ] No unnecessary exclamation marks

### Buttons & Labels
- [ ] Primary action buttons use verb + object pattern
- [ ] Confirmation buttons reflect the specific action (not generic "Confirm")
- [ ] Form labels use sentence case
- [ ] Cancel button labeled "Cancel" (not "Close", "Dismiss", "Never mind")

### Grammar & Formatting
- [ ] Sentence case used throughout
- [ ] Proper ellipsis character (…) for loading states
- [ ] Em dash (—) for supplementary info
- [ ] No period on single-sentence toast messages
- [ ] Pronouns follow the convention (Section 6)

### Accessibility
- [ ] All interactive elements have descriptive `aria-label` or visible text
- [ ] Error messages are announced to screen readers (via `role="alert"` or `aria-live`)
- [ ] Icons are decorative (hidden from AT) or have text alternatives

---

## Appendix A: Current UI Copy Audit Summary

Based on the Phase 3 audit (Agent 32), these inconsistencies were identified in the existing codebase. This section serves as a baseline for future improvements.

### Identified Inconsistencies (CI-001 through CI-005)

| ID | Issue | Current State | Recommended Fix |
|----|-------|--------------|----------------|
| CI-001 | Mixed pronouns | "Are you sure?" (2nd person) vs. "Project name is required" (impersonal) | Follow Section 6 conventions: impersonal for validation, 2nd person for guidance |
| CI-002 | Error tone variation | "Enter an answer first" (helpful) vs. "Failed: [raw error]" (terse) | Apply error framework (Section 3) to all error toasts |
| CI-003 | Success energy inconsistency | "Session started!" (enthusiastic) vs. "Saved Q-001" (flat) | Reserve exclamation for milestones only (Section 4) |
| CI-004 | Terse placeholder | Confirm reason: "Why?" | Change to "Brief rationale for this action" |
| CI-005 | Generic confirmation button | "Confirm" for all actions | Use action-specific labels: "Defer Decision", "Expire Decision", etc. |

### Error Message Migration Priority

All `toast('Failed: ' + e.message, 't-err')` calls should be replaced with framework-compliant messages. There are 10+ instances across decision management, questionnaire saving, reevaluation, command launching, and session export.

---

## Appendix B: Toast Message Reference

Quick reference for the toast message classes used in the codebase:

| Class | Purpose | Color | Use for |
|-------|---------|-------|---------|
| `t-ok` | Success | Green | Completed actions, confirmations |
| `t-err` | Error | Red | Failures, server errors |
| `t-info` | Information | Blue | Validation hints, neutral notices |
