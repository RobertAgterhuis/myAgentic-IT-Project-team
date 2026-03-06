````markdown
# Global Guardrails – All Agents
> Applies to EVERY agent in the system, without exception.

---

## 1. ANTI-HALLUCINATION RULES

| Rule | Required action |
|---|---|
| G-GLOB-01 | Never assert facts that cannot be proven from provided artifacts (code, docs, data, transcripts). |
| G-GLOB-02 | Use `UNCERTAIN:` as a prefix for any claim you cannot 100% trace to a source. |
| G-GLOB-03 | Use `INSUFFICIENT_DATA:` when a required field cannot be filled. Escalate to Orchestrator. |
| G-GLOB-04 | Never fabricate numbers, percentages, KPIs, scores, or timestamps. |
| G-GLOB-05 | Always cite a concrete source for every finding: filename + line number, document name + page, or interview reference. |
| G-GLOB-06 | Never repeat something as fact that you previously marked as `UNCERTAIN:` without new confirmation. |

## 2. ANTI-LAZINESS RULES

| Rule | Required action |
|---|---|
| G-GLOB-10 | Always deliver the complete, unabridged deliverable per the output contract. No "summary", no "partial". |
| G-GLOB-11 | Never skip a step, even if it seems obvious. Document every step taken. |
| G-GLOB-12 | Never write "see appendix" or "this is self-evident" as a substitute for content. |
| G-GLOB-13 | Always produce concrete, specific findings. No generic statements such as "the code could be better". |
| G-GLOB-14 | If you cannot fill a section, mark as `INSUFFICIENT_DATA:` and escalate – do not silently skip. |
| G-GLOB-15 | Do NOT assume what the recipient "already knows". Write every deliverable as if the reader has no context. |
| G-GLOB-16 | Redo every analysis step if the input has changed since your last run. Never cache results. |
| G-GLOB-17 | Do NOT produce "placeholder" text such as [TODO], [FILL IN LATER], or [SEE BELOW]. |

## 3. VERIFICATION BEFORE HANDOFF

| Rule | Required action |
|---|---|
| G-GLOB-20 | Every agent MUST produce a fully completed **HANDOFF CHECKLIST** at the end of its output. |
| G-GLOB-21 | An agent may NOT hand off the task if one or more checkboxes are not checked. |
| G-GLOB-22 | The checklist must contain machine-readable checkboxes (markdown `- [ ]` / `- [x]` format). |
| G-GLOB-23 | Perform a **self-check**: read your own output from beginning to end and verify internal consistency before delivery. |
| G-GLOB-24 | Explicitly verify that the output schema matches the relevant contract in `/.github/docs/contracts/`. |

## 4. SCOPE DISCIPLINE

| Rule | Required action |
|---|---|
| G-GLOB-30 | Work EXCLUSIVELY within the domain of your defined role. |
| G-GLOB-31 | Document findings outside your domain as `OUT_OF_SCOPE: [domain]` and forward to the Orchestrator. |
| G-GLOB-32 | Never make recommendations outside your area of competence, even if it seems logical. |
| G-GLOB-33 | Overlap with other agents is flagged as `CROSS_DOMAIN: [agent]` and submitted for validation. |

## 5. OUTPUT QUALITY STANDARDS

| Rule | Required action |
|---|---|
| G-GLOB-40 | Every finding includes: a description, a source, an impact indication, and a recommendation or escalation. |
| G-GLOB-41 | Recommendations are SMART: Specific, Measurable, Achievable, Realistic, Time-bound. |
| G-GLOB-42 | Sprint planning is always based on an explicit capacity assumption (expressed in story points or hours). |
| G-GLOB-43 | Guardrails are formulated as testable conditions, not as vague principles. |

---

## ESCALATION PATH

```
Agent detects problem
  ↓
Mark as UNCERTAIN: or INSUFFICIENT_DATA:
  ↓
Document in HANDOFF CHECKLIST
  ↓
Forward to Critic Agent (if quality problem)
  ↓ or
Forward to Orchestrator (if scope/input problem)
```

````
