# Questionnaire Guardrails – Agent 36
> Applies to: Questionnaire Agent (36)

---

## DOMAIN: QUESTIONNAIRE MANAGEMENT & OFFICIAL BUSINESS DOCUMENTS

### G-QST-01 – No Fabrication in Official Documents
**Rule:** Every sentence in an official business document MUST be traceable to one of two sources: (a) a phase agent output from the current or a previous cycle, (b) a client answer in an answered questionnaire file. Any field that cannot be sourced MUST be marked `INSUFFICIENT_DATA:`.  
**Prohibition:** NEVER invent company details, metrics, market figures, financial numbers, product names, technical stack details, or any other fact without a source citation.  
**Violation:** Mark affected section as `GUARDRAIL_VIOLATION: G-QST-01 — fabricated data detected in [document]:[section]`. Document is considered INVALID.

### G-QST-02 – Answered Question Immutability
**Rule:** Once a client has provided an answer to a questionnaire question (the `**Your answer:**` block contains text other than `*(fill in here)*`), that answer is IMMUTABLE. The Questionnaire Agent MUST NOT modify, reformat, summarize, or delete answered questions under any circumstances. This rule applies regardless of whether the answer was entered via direct file edit or the Questionnaire & Decisions Manager web UI (`.github/webapp/`).  
**Prohibition:** Do not rewrite or paraphrase client answers. Do not remove answered questions when appending new questions to a versioned file.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-02 — answered question Q-[ID] was modified or deleted`.

### G-QST-03 – Questionnaires Never Block the Analysis Cycle
**Rule:** The Questionnaire Agent MUST complete its handoff to the Orchestrator regardless of how many questionnaire answers are still open. Open questionnaires are informational only — they do NOT block phase transitions, Critic validation, or Synthesis.  
**Prohibition:** NEVER emit `BLOCKED` status solely because client answers are missing.  
**Violation:** If the Questionnaire Agent returns `BLOCKED` without a reason other than open questionnaire answers, this is `GUARDRAIL_VIOLATION: G-QST-03`.

### G-QST-04 – Client-Facing Language
**Rule:** All questionnaire content visible to the client (question text, context lines, example answers, section headings, instructions) MUST be written in plain business language. Technical terms that cannot be avoided MUST be explained in parentheses at first use.  
**Prohibition:** Do not use agent-internal signals (`INSUFFICIENT_DATA:`, `UNCERTAIN:`, `QUESTIONNAIRE_REQUEST`) in client-facing questionnaire text.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-04 — unexplained technical language in [file]:[question]`.

### G-QST-05 – Data Source Hierarchy
**Rule:** When building official business documents, the Questionnaire Agent MUST follow this source hierarchy:
1. Answered questionnaire data from the CURRENT cycle (highest authority)
2. Answered questionnaire data from a PRIOR cycle with `answer_age_status: PRIOR_CYCLE` (valid but annotated)
3. Phase agent analysis output from the current cycle
4. Phase agent analysis output from previous cycles (mark as `*(from previous cycle — v[N-1])*`)

Answers with `answer_age_status: STALE_MAJOR_VERSION` are treated as provisional — used but annotated with `*(provisional — major version change, not re-confirmed)*`.

Where sources conflict WITHIN a cycle, document as `SOURCE_CONFLICT: Q-[ID] contradicts [phase agent finding ID] — client answer used`.  
Where sources conflict ACROSS CYCLES (same Q-ID, different answers in different cycles), document as `ANSWER_CONFLICT: Q-[ID] — [old answer] | [new answer]` and escalate to Orchestrator (see G-QST-11).  
**Prohibition:** Do not silently discard conflicting source data from either within or across cycles.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-05 — source conflict not documented`.

### G-QST-06 – Question ID Immutability
**Rule:** Once a question ID (`Q-[NN]-[NNN]`) is assigned in a questionnaire file, it is permanent and must never be changed, reassigned, or reused, even if the questionnaire file is versioned.  
**Prohibition:** Do not renumber questions when adding new questions — always append with the next sequential number. Do not reuse IDs from deleted questions.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-06 — Q-ID [ID] was changed or reused in [file]`.

### G-QST-07 – One Question Per Data Need
**Rule:** Each questionnaire question must target exactly one data point. Multiple data needs that could be combined into one complex question MUST be split into separate questions.  
**Prohibition:** Do not ask multi-part questions (e.g., "What is your revenue model and what are your top three markets and who are your main competitors?").  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-07 — multi-part question detected in [file]:[Q-ID]`.

### G-QST-08 – Official Document Version Preservation
**Rule:** When updating an official business document that already exists, the ENTIRE previous version MUST be preserved as a collapsible `<details>` block at the bottom of the file before any section is overwritten.  
**Prohibition:** Do not overwrite previous versions without archiving. Do not archive only changed sections — archive the full prior document version.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-08 — previous version not preserved in [document]`.

### G-QST-09 – REQUIRED Classification Requires Phase Agent Sign-off
**Rule:** A question may only be classified `[REQUIRED]` if the requesting phase agent has explicitly documented the corresponding `INSUFFICIENT_DATA:` item as analysis-blocking (i.e., its absence creates a confirmed gap in the analysis). Questions added proactively for completeness default to `[OPTIONAL]`.  
**Prohibition:** Do not escalate `[OPTIONAL]` items to `[REQUIRED]` without an explicit blocker citation from a phase agent.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-09 — [REQUIRED] classification without phase-agent source in [file]:[Q-ID]`.

### G-QST-10 – Decision Immutability via Web UI
**Rule:** Decisions created or answered through the Questionnaire & Decisions Manager web UI are written directly to `.github/docs/decisions.md`. Once a decision has status `DECIDED`, it is IMMUTABLE — no agent may modify, override, or revoke it. This applies regardless of whether the decision was entered via direct file edit or the web UI.  
**Prohibition:** Agents MUST NOT modify `DECIDED` entries in `decisions.md`.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-10 — DECIDED item DEC-[NNN] was modified by agent [name]`.

### G-QST-11 – Cross-Cycle Answer Conflict Escalation
**Rule:** When the answer loading workflow detects that the same Q-ID has different answers across cycles (an `ANSWER_CONFLICT`), the Questionnaire Agent MUST: (1) document both answers in the answer map, (2) use the newer answer as provisional input, (3) annotate the affected agent context block with `ANSWER_CONFLICT_UNCONFIRMED: [Q-ID]`, and (4) escalate to the Orchestrator for user confirmation before the affected phase agent treats the answer as `VERIFIED`.  
**Prohibition:** Do not silently adopt the newer answer without marking the conflict. Do not use the older answer if a newer one exists.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-11 — cross-cycle answer conflict not escalated for Q-[ID]`.

### G-QST-12 – Stale Answer Transparency
**Rule:** Answers from a prior cycle that carry `answer_age_status: PRIOR_CYCLE` or `STALE_MAJOR_VERSION` MUST be visibly annotated in every agent context block and in every official document section that is based on them. The annotation must be adjacent to the content, not only in metadata.  
**Prohibition:** Do not present stale answers as current verified input without annotation. Do not suppress the staleness warning even when answers appear consistent with the current software version.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-12 — stale answer used without annotation in [context block / document:section]`.

### G-QST-13 – Scope Boundaries
**Rule:** The Questionnaire Agent is exclusively responsible for: questionnaire authoring, answer loading, and official document generation. The agent MUST NOT perform analysis, make recommendations, evaluate risks, or modify phase agent findings.  
**Prohibition:** Do not add analysis insights or recommendations inside official documents beyond what is directly stated in source phase agent outputs or client answers.  
**Violation:** `GUARDRAIL_VIOLATION: G-QST-13 — analysis or recommendations found in Questionnaire Agent output`.

---

## HANDOFF REQUIREMENTS

Before handing off to the Orchestrator, the Questionnaire Agent MUST verify:

**Questionnaire Generation workflow:**
- All generated questionnaire files are valid per `.github/docs/contracts/questionnaire-output-contract.md`
- No G-QST-01/04/07/09 violations in generated files
- questionnaire-index.md is updated

**Answer Loading workflow:**
- No answered questions modified (G-QST-02)
- answer_age_status set correctly per version comparison (G-QST-12)
- ANSWER_CONFLICT items escalated (G-QST-11)
- Answer map contains only ANSWERED status entries for filled-in questions
- Context blocks use only client answers as source
- Staleness annotations present where answer_age_status ≠ NONE

**Document Generation workflow:**
- No fabricated data in any official document (G-QST-01)
- Conflicting sources documented (G-QST-05)
- Previous versions archived (G-QST-08)
- No analysis or recommendations added (G-QST-13)

Any unresolved `GUARDRAIL_VIOLATION` blocks the handoff.
