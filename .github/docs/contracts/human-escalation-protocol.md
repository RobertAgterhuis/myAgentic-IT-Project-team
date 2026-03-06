````markdown
# Contract: Human Escalation Protocol
> Version 1.0 | Defines how agents ask questions to the user, how answers are processed, and how the cycle resumes after human input

---

## PURPOSE

Agents work autonomously but sometimes encounter situations that require a human decision. This protocol ensures that:
1. Every question to the user is standardized and complete
2. The cycle correctly waits or continues depending on the escalation type
3. Timeouts are explicitly handled
4. Answers are traceably processed in the session state

---

## WHEN TO ESCALATE (MANDATORY TRIGGERS)

| Trigger | Type | Timeout action |
|---------|------|--------------|
| Mandatory input missing (ONBOARDING_BLOCKED) | `ONBOARDING_BLOCKED` | `HALT` |
| Tool installation required (TOOL_INSTALL_REQUEST) | `TOOL_INSTALL_REQUEST` | `HALT` |
| Sprint Gate decision (IMPLEMENT / BACKLOG) | `SPRINT_GATE` | `PAUSE` — re-propose at next interaction |
| Sprint Impact Flag on IN_PROGRESS sprint | `SPRINT_IMPACT_FLAG` | `PAUSE` |
| Scope definition unclear (< 2 concrete behavioral expectations) | `SCOPE_DECISION` | `HALT` |
| Feature Agent emits `ARCH_CONFLICT` or `OUT_OF_SCOPE → SCOPE CHANGE recommended` by Orchestrator | `SCOPE_CHANGE_DECISION` | `HALT` |
| Unresolvable conflict between agents (> 2 returns without resolution) | `AGENT_CONFLICT` | `PAUSE` |
| Security-related decision required (SECURITY_DECISION) | `SECURITY_DECISION` | `HALT` |
| Destructive git operation requires confirmation | `DESTRUCTIVE_GIT_OP` | `HALT` |
| Other — agent cannot decide autonomously | `OTHER` | `PAUSE` |

### Timeout actions:

| Action | Meaning |
|-------|-----------|
| `HALT` | Cycle stops completely. No further agent activity. Wait for answer. |
| `PAUSE` | Pause current step. Independent parallel steps may continue. |
| `CONTINUE_WITH_ASSUMPTION` | Only permitted if the agent explicitly documents a safe default — NEVER for HALT types |

---

## ESCALATION FORMAT (MANDATORY FOR ALL AGENTS)

```markdown
---
## HUMAN INPUT REQUIRED

**Escalation ID:** ESC-[NNN]
**Type:** [type from table above]
**Raised by:** [agent name]
**Timestamp:** [ISO 8601]

**Situation:**
[Short, factual description of what is happening — max 4 lines. NO opinion, NO recommendation.]

**Question:**
[One clear question. If there are multiple options, list them numbered:]
  [1] [option A] — [what this means for the cycle]
  [2] [option B] — [what this means for the cycle]

**Impact of no answer (timeout action: [HALT / PAUSE]):**
[What happens if the user does not respond]

**Information that helps with decision:**
[Relevant context — path to document, finding ID, etc. — or NONE]

---
```

---

## ANSWER PROCESSING

### Format of a valid answer:
The user responds with the number of their choice, or free text if there are no options.

### Orchestrator processes the answer:

1. Link the answer to `escalation_id` in `open_human_escalations`
2. Set `status` to `ANSWERED`, fill in `answer` and `answered_at`
3. Process the decision:
   - For Sprint Gate: update `sprint_status` per choice
   - For ONBOARDING_BLOCKED: restart Onboarding Agent once input is supplied
   - For TOOL_INSTALL_REQUEST: wait for confirmation, verify tool, update tooling status
   - For SCOPE_DECISION: update `00-feature-request.md` or intake document
   - For SCOPE_CHANGE_DECISION: if answer is `SCOPE CHANGE` → activate Scope Change Agent per ORC-27; if answer is `OVERRIDE` → log `SCOPE_CHANGE_RISK_ACCEPTED` in the feature sprint plan and continue feature cycle
   - For AGENT_CONFLICT: pass the decision to the relevant agents as a tiebreaker instruction
4. Update session state: remove escalation from `open_human_escalations`, log in session history
5. Resume the cycle from the paused/blocked point

---

## TIMEOUT HANDLING

If the user does not respond within the set timeout:

| Timeout action | Orchestrator behavior |
|--------------|---------------------|
| `HALT` | Set status to `AWAITING_HUMAN`. Log: `ESCALATION_TIMEOUT: ESC-[NNN]`. Nothing further. Wait. |
| `PAUSE` | Log: `ESCALATION_TIMEOUT: ESC-[NNN] — paused, dependent steps waiting`. Parallel steps without dependency may continue. |
| `CONTINUE_WITH_ASSUMPTION` | Log assumption explicitly: `ASSUMPTION: [what is assumed]. Reason: no answer within [timeout].` Set `status` to `TIMED_OUT`. Document as `UNCERTAIN:` in downstream output. |

**PROHIBITION:** `CONTINUE_WITH_ASSUMPTION` is NEVER permitted for type `HALT`. A HALT escalation always waits for human confirmation, no matter how long it takes.

---

## MULTIPLE OPEN ESCALATIONS

If there are multiple open escalations:

1. Present them **in order of urgency**: `HALT` types first, then `PAUSE` types
2. Present them **one at a time** — do not bundle in one prompt
3. After each answer: process, update state, then next escalation
4. If all `HALT` escalations are answered and only `PAUSE` escalations remain open: cycle may resume, `PAUSE` escalations are offered at the next interaction

### High-volume escalation batching (> 5 outstanding)

When more than 5 escalations are outstanding simultaneously:

1. **Group by type**: present all `HALT` escalations first, then `PAUSE`
2. **Batch presentation**: present up to **3 escalations per message** (rather than one-at-a-time) to reduce user fatigue. Each escalation retains its full format — batching only affects how many fit in a single prompt.
3. **Auto-resolve candidates**: before presenting, scan for escalations that can be resolved by answers already given. For example, if ESC-003 depends on the same decision as ESC-001 (already answered), auto-resolve ESC-003 with `RESOLVED_BY: ESC-001` and inform the user.
4. **Priority ceiling**: if > 10 escalations are outstanding, the Orchestrator MUST emit a `LESSON_CANDIDATE: ESCALATION_OVERLOAD` and recommend the user address root causes (e.g., missing onboarding input, unclear scope) rather than resolving one-by-one.
5. **Summary header**: when batching, prefix the message with a summary: `📋 [N] escalations outstanding ([H] HALT, [P] PAUSE). Showing batch [B] of [T].`

---

## TRACEABILITY

Every escalation is permanently logged in:

```json
{
  "escalation_log": [
    {
      "escalation_id": "ESC-001",
      "type": "SPRINT_GATE",
      "agent": "00-orchestrator",
      "raised_at": "ISO 8601",
      "question": "Do you want to implement sprint SP-1 or place it on the backlog?",
      "answer": "BACKLOG",
      "answered_at": "ISO 8601",
      "cascade_effect": "SP-2 and SP-3 also placed on BACKLOG"
    }
  ]
}
```

Location: `.github/docs/session/escalation-log.json`
For feature cycles: also `Workitems/[FEATURENAME]/session/escalation-log.json`

---

## ANTI-SPAM PROTOCOL

Agents may NOT escalate for:
- Decisions they can make autonomously per their skill file
- Questions whose answer can demonstrably be inferred from the available input
- Confirmations of actions that have no risk or scope impact

**PROHIBITION:** Do not create an escalation purely to "be certain". Only escalate if an autonomous decision demonstrably falls outside the agent's authority.

````
