# Global Guardrails – All Agents
> Applies to EVERY agent in the system, without exception.

<!-- IDs G-GLOB-07–09, 18–19, 25–29, 34–39, 44–49 reserved for future use -->
<!-- TODO: Create dedicated guardrails for Documentation (26), KPI (29), Retrospective (28), GitHub Integration (27), and Synthesis (17) agents. Until then, these agents follow global guardrails only. -->

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
| G-GLOB-20 | Every agent MUST produce a fully completed **HANDOFF CHECKLIST** at the end of its output. The canonical handoff checklist template is the one in copilot-instructions.md VERIFICATION PROTOCOL section (9 items). Domain-specific agents may extend it but must never reduce it. |
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

## 6. MEMORY AND CONTEXT MANAGEMENT

| Rule | Required action |
|---|---|
| G-GLOB-50 | Write all deliverables to disk files, NOT as inline chat output. The chat message contains only a brief summary (max 20 lines), the file path, and the handoff status. |
| G-GLOB-51 | Never read an entire file into context when only a specific section is needed. Use targeted line ranges or search. |
| G-GLOB-52 | Never re-read a predecessor agent’s full output into chat when only specific findings are needed. Read the file from disk and extract only what is required. |
| G-GLOB-53 | If output exceeds 400 lines, split across multiple files and produce a summary + file manifest in chat. |
| G-GLOB-54 | At phase boundaries, support the Orchestrator’s instruction to start a fresh conversation. All state is in `session-state.json` — conversation history is disposable. |
| G-GLOB-55 | Never embed large code blocks, tables, or full file contents inline in chat when they can be written to a file and referenced by path. |
| G-GLOB-56 | The Questionnaire Agent MUST be activated after every phase Critic + Risk validation to generate questions for all `QUESTIONNAIRE_REQUEST` and `INSUFFICIENT_DATA:` items. No agent, user instruction, or override may skip, bypass, or suppress this activation. Even when zero `QUESTIONNAIRE_REQUEST` items exist, the Questionnaire Agent MUST still run to independently verify no gaps were missed by the phase agents. Violation: `GUARDRAIL_VIOLATION: G-GLOB-56`. |
| G-GLOB-57 | All security-relevant findings MUST be marked as `SECURITY_FLAG:`. The canonical handoff checklist item "All security-relevant findings marked as SECURITY_FLAG:" applies universally to every agent. Violation: `GUARDRAIL_VIOLATION: G-GLOB-57`. |

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
