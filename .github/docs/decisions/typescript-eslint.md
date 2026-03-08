# Decisions: TypeScript / ESLint
> Stack: typescript-eslint | Status: ACTIVE | Applicable: PARTIAL

---

## Active Decisions

| ID | Priority | Scope | Decision | Notes | Date |
|----|-----------|-------|-----------|-------------|-------|
| DEC-237 | HIGH | Phase 3 (ESLint Baseline) | Must all JavaScript/TypeScript packages use a single shared ESLint baseline configuration with drift prohibited by default? | Yes. Use a shared repo-level ESLint baseline (flat config preferred) with package-level overrides only by approved exception. | 2026-03-07 |
| DEC-238 | HIGH | Phase 3 (Lint Merge Gate) | What lint policy is blocking for merge (errors/warnings, changed-files scope, autofix expectations)? | Lint errors are blocking in CI; warnings are non-blocking but tracked; changed-files lint is required on PR and full-repo lint runs on main/release. | 2026-03-07 |
| DEC-245 | MEDIUM | Phase 3 (ESLint Plugin Governance) | What plugin governance policy is required (approved list, version pinning, security review cadence)? | Maintain an approved plugin allowlist, pin plugin versions, and review plugin security/maintenance status monthly; unapproved plugins require security sign-off. | 2026-03-07 |
| DEC-246 | MEDIUM | Phase 3 (Rule Severity Model) | What severity policy is required for stylistic vs correctness rules, and how are warning backlogs governed? | Correctness/security rules are errors (blocking); stylistic rules are warnings initially with tracked backlog and defined promotion-to-error milestones each sprint. | 2026-03-07 |
| DEC-247 | MEDIUM | Phase 3 (Prettier Integration) | What integration model is required between ESLint and Prettier (eslint-config-prettier, formatter ownership)? | Prettier owns formatting and ESLint owns code-quality/correctness; use eslint-config-prettier to avoid conflicts and enforce formatting via pre-commit and CI checks. | 2026-03-07 |
| DEC-258 | LOW | Phase 3 (Editor Tooling Baseline) | What minimum editor/tooling settings are required for contributors (format-on-save, ESLint extension, TS SDK pinning)? | Recommend format-on-save, ESLint integration, and workspace TypeScript SDK pinning; provide shared editor settings file for consistency. | 2026-03-07 |
| DEC-259 | LOW | Phase 3 (Autofix Workflow) | What policy governs automatic lint fixes in CI vs local development? | Autofix runs locally/pre-commit; CI validates clean state and does not push code changes automatically to protected branches. | 2026-03-07 |
| DEC-260 | MEDIUM | Phase 3 (CI Failure Triage) | What triage workflow is required for persistent lint/typecheck failures (owner assignment, SLA, escalation)? | Persistent failures require owner assignment within 1 business day, fix SLA by severity, and escalation to engineering lead when SLA is breached. | 2026-03-07 |

## Deferred Decisions (not applicable to current codebase)

| ID | Priority | Scope | Decision | Deferred Reason | Date |
|----|-----------|-------|-----------|-----------------|-------|
| DEC-239 | — | — | What TypeScript strictness baseline is mandatory across projects (`strict`, `noU... | No TypeScript in codebase | 2026-03-08 |
| DEC-240 | — | — | Must `tsc --noEmit` (or equivalent project typecheck) be a required blocking CI ... | No TypeScript — tsc typecheck gate not applicable | 2026-03-08 |
| DEC-241 | — | — | What policy applies to `any`, `@ts-ignore`, and `@ts-expect-error` usage? | No TypeScript — any/@ts-ignore policy not applicable | 2026-03-08 |
| DEC-242 | — | — | Which module/import safety rules are mandatory (`no-cycle`, unresolved imports, ... | No TypeScript — import/module safety rules not applicable | 2026-03-08 |
| DEC-243 | — | — | Must all projects extend approved base `tsconfig` presets with controlled except... | No TypeScript — tsconfig governance not applicable | 2026-03-08 |
| DEC-244 | — | — | What is the required policy for typed ESLint rules using TypeScript project boun... | No TypeScript — parser/project boundaries not applicable (also: not a monorepo) | 2026-03-08 |
| DEC-248 | — | — | What performance standards are required for lint/typecheck in CI (caching, incre... | No TypeScript — lint/typecheck performance not applicable | 2026-03-08 |
| DEC-249 | — | — | Are TypeScript project references mandatory in monorepos, and what dependency bo... | Not a monorepo — TS project references not applicable | 2026-03-08 |
| DEC-250 | — | — | What policy governs `paths` aliases and import roots to avoid runtime mismatch a... | No TypeScript — path aliases policy not applicable | 2026-03-08 |
| DEC-251 | — | — | What policy applies to `allowJs`/`checkJs` and gradual migration of JavaScript c... | No TypeScript — JS interop policy not applicable (codebase is already pure JS) | 2026-03-08 |
| DEC-252 | — | — | What standard is required for declaration files/maps (`declaration`, `declaratio... | No TypeScript — declaration output not applicable | 2026-03-08 |
| DEC-253 | — | — | What guarantees are required for exported type contracts (breaking-change detect... | No TypeScript — public API typing not applicable | 2026-03-08 |
| DEC-254 | — | — | What governance is required for ESLint disables and TypeScript suppressions (exp... | No TypeScript — suppression governance not applicable | 2026-03-08 |
| DEC-255 | — | — | What lint/typecheck exemption policy applies to generated files and external ven... | No TypeScript — generated code exemptions not applicable at current scale | 2026-03-08 |
| DEC-256 | — | — | What type-safety standards apply to test code and test utilities versus producti... | No TypeScript — testing type safety not applicable | 2026-03-08 |
| DEC-257 | — | — | What cadence is required for TypeScript/ESLint major and minor upgrades, includi... | No TypeScript — upgrade cadence not applicable | 2026-03-08 |
