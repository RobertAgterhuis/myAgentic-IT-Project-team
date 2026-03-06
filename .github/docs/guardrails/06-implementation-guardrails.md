# Guardrails: Implementation (Phase 5)
> Version 1.0 | Applies to: Implementation Agent, Test Agent, PR/Review Agent

---

## PURPOSE

These guardrails safeguard the quality, security, and traceability of every autonomous code implementation. They are supplementary to the global guardrails (`00-global-guardrails.md`) and the phase-specific guardrails from the analysis period.

---

## SECTION 1: SCOPE DISCIPLINE

**IMPL-GUARD-01 (CRITICAL):** An Implementation Agent implements EXCLUSIVELY the sprint story for which it has been activated (SP-N-NNN). Changes outside the story scope require an explicit `SCOPE_EXTENSION:` notification with approval from the Orchestrator.

**IMPL-GUARD-02 (CRITICAL):** The implementation MUST be traceable to an approved recommendation (REC-NNN) via the sprint plan. No code without a recommendation reference.

**IMPL-GUARD-03:** When in doubt about scope: HALT, document as `UNCERTAIN: scope`, escalate to Orchestrator. NEVER expand the scope independently.

---

## SECTION 2: ARCHITECTURE INTEGRITY

**IMPL-GUARD-04 (CRITICAL):** Every architecture choice in the implementation MUST be consistent with the decisions in the Phase 2 output (Software Architect + Senior Developer). On conflict: HALT + `ARCH_CONFLICT: [description]` + escalate.

**IMPL-GUARD-05:** Do not introduce new external dependencies without:
- Explicit mention in the sprint story or architecture decision
- `DEPENDENCY_ADDED: [name, version, reason]` notification in the output

**IMPL-GUARD-06:** Existing API contracts (internal and external) may NOT be broken by implementation. Breaking changes require `BREAKING_CHANGE: [description, impact, migration path]`. See ORC-21 for the authoritative definition of 'breaking change'.

**IMPL-GUARD-07:** Database schema changes require:
- Forward compatibility (migration up)
- Backward compatibility (migration down) UNLESS explicitly exempted by Data Architect output
- `SCHEMA_CHANGE: [table, column/index, reason]` documentation

---

## SECTION 3: CODE QUALITY

**IMPL-GUARD-08:** The implementation MUST follow the existing code conventions identified in the Phase 2 Senior Developer analysis. No deviating style without `STYLE_EXCEPTION: [reason]`.

**IMPL-GUARD-09:** No hardcoded credentials, API keys, tokens, or secrets in code. Upon detection: HALT, `SECURITY_VIOLATION: hardcoded secret`, escalate immediately to Security Architect.

**IMPL-GUARD-10:** No `TODO`, `FIXME`, `HACK`, or `XXX` comments in implemented code unless accompanied by a story reference and estimated resolution date.

**IMPL-GUARD-11:** Dead code (unreachable code, unused variables, unused imports) may not be introduced.

---

## SECTION 4: TEST REQUIREMENTS

**IMPL-GUARD-12 (CRITICAL):** Every acceptance criterion of the sprint story MUST be covered by at least one automated test. No exceptions.

**IMPL-GUARD-13 (CRITICAL):** Regression is NOT allowed. If existing tests fail after implementation: HALT, analyze root cause, fix BEFORE handoff.

**IMPL-GUARD-14:** Test types per acceptance criterion:
- Unit test: for isolated logic
- Integration test: for interaction between components
- End-to-end test: for user flows (where applicable)
- Choose the most appropriate type — document the choice

**IMPL-GUARD-15:** Test coverage may not decrease relative to the baseline. `COVERAGE_DELTA` in IMPL-OUTPUT-B MUST be ≥ 0.

---

## SECTION 5: SECURITY

**IMPL-GUARD-16 (CRITICAL):** All input from outside the system boundary (user input, API responses, file uploads) MUST be validated and sanitized.

**IMPL-GUARD-17 (CRITICAL):** No SQL string concatenation with user input. Always use parameterized queries or ORM.

**IMPL-GUARD-18:** Authentication and authorization checks may not be bypassed or disabled, not even in test/debug code.

**IMPL-GUARD-19:** Logging may NEVER contain personally identifiable information (PII), passwords, or tokens.

**IMPL-GUARD-20:** Security findings from Phase 2 (Security Architect) classified as P1 or P2 are NOT ignored when touching related code. Document `SEC_FINDING_PRESENT: [id]` when the story modifies adjacent code.

---

## SECTION 6: TRACEABILITY AND DOCUMENTATION

**IMPL-GUARD-21:** Every commit MUST contain a clear conventional commit message with story reference:
- Format: `[type](scope): description [SP-N-NNN]`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

**IMPL-GUARD-22:** Public API changes (endpoints, SDK interfaces, events) require updated documentation in the same commit.

**IMPL-GUARD-23:** The Sprint Completion Report JSON MUST be machine-readable and valid for transfer to the Final Report.

---

## SECTION 7: AUTONOMOUS DECISION LIMITS

**IMPL-GUARD-24 (CRITICAL):** The Implementation Agent may decide INDEPENDENTLY on:
- Choice of algorithmic implementation within the story scope
- Internal structure of new files
- Test naming and test structure
- Refactoring of code WITHIN the modified files (no scope extension)

**IMPL-GUARD-25 (CRITICAL):** The Implementation Agent MUST ALWAYS escalate when:
- Architecture choices contradict Phase 2 decisions
- Discovery of a new CRITICAL_FINDING (security, data, architecture)
- Conflict between two guardrails
- Ambiguity about acceptance criteria
- A blocker arises during implementation

**IMPL-GUARD-26:** Escalation format:
```
ESCALATE:
  Type: ARCH_CONFLICT | CRITICAL_FINDING | GUARDRAIL_CONFLICT | AC_UNCLEAR | NEW_BLOCKER
  Story: SP-N-NNN
  Description: [exactly what was discovered]
  Impact estimate: [which other stories/systems are affected]
  Recommended action: [what the agent thinks should happen]
  Status: HALT — awaiting Orchestrator decision
```

---

## SECTION 8: KPI AND MEASUREMENT

**IMPL-GUARD-27:** After completion of a sprint the Sprint KPI MUST be measured per the SMART goals from the sprint plan. No estimation — actual measurement or `MEASUREMENT_IMPOSSIBLE: [reason]` with escalation.

**IMPL-GUARD-28:** If a KPI target is NOT met after sprint: document as `KPI_MISS: [id, target, realized, analysis]` in the Sprint Completion Report. No cover-up actions.

---

## GUARD 29–30: TRACK INDEPENDENCE (CRITICAL)

**IMPL-GUARD-29 (CRITICAL):** The Implementation Agent processes EXCLUSIVELY stories with `story_type` `CODE` or `INFRA`. Upon receiving a story with type `DESIGN`, `CONTENT`, `ANALYSIS`, `DOCS`, or `CONFIG`: **HALT**, `ROUTING_ERROR: story_type [type] does not belong in the implementation pipeline`, escalate to Orchestrator.

**IMPL-GUARD-30 (CRITICAL):** A blocker on a DESIGN-, CONTENT-, or ANALYSIS-story may NEVER be registered as a blocker on a CODE- or INFRA-story. Upon detection: `CROSS_TRACK_BLOCKER: [story-id of blocker source] has type [type] and may not block story [code-story-id]`, escalate to Orchestrator.

**IMPL-GUARD-31 (CRITICAL):** Feature Implementation Isolation — Implementation Agents running under a FEATURE cycle scope MUST NOT modify files outside `Workitems/[FEATURENAME]/` and the project source directories. Cross-boundary changes require `SCOPE_EXTENSION:` + Orchestrator approval.

---

## VIOLATED? THEN DO THIS:

| Guard code | On violation |
|-----------|--------------|
| IMPL-GUARD-01/02 | HALT, document, await Orchestrator |
| IMPL-GUARD-04 | HALT, `ARCH_CONFLICT:`, escalate |
| IMPL-GUARD-09 | HALT, `SECURITY_VIOLATION:`, escalate immediately |
| IMPL-GUARD-12 | Story is NOT done, write test |
| IMPL-GUARD-13 | HALT, fix regression BEFORE handoff |
| IMPL-GUARD-25 | HALT, escalate per IMPL-GUARD-26 format |
| IMPL-GUARD-29 | HALT, `ROUTING_ERROR:`, escalate to Orchestrator |
| IMPL-GUARD-30 | HALT, `CROSS_TRACK_BLOCKER:`, escalate to Orchestrator |
