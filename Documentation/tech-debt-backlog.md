# Tech Debt Backlog

> Last assessed: 2026-03-08 | Sprint: SP-R2-007

## Assessment Summary

| Metric | Before Sprint 7 | After Sprint 7 | Target |
|--------|-----------------|----------------|--------|
| ESLint errors | 0 | 0 | 0 |
| ESLint warnings | 0 | 0 | < 5 |
| TODO/FIXME comments | 0 | 0 | 0 |
| Test coverage (statements) | 95.32% | TBD | >= 70% |
| Cyclomatic complexity max | 8 | 8 | <= 8 |
| Magic numbers | 0 unresolved | 0 | 0 |
| Unused code paths | 0 | 0 | 0 |

## ESLint Configuration

Enhanced in Sprint 7 with additional rules:
- `complexity: max 8` (existing)
- `no-unused-vars` with `_` prefix ignore pattern
- `no-var` — enforce `let`/`const`
- `prefer-const` — enforce `const` where possible
- `eqeqeq` — enforce strict equality
- `no-eval` / `no-implied-eval` — security

## Resolved Items

| # | Item | Sprint | Resolution |
|---|------|--------|------------|
| 1 | Function decomposition | SP-R2-003 | Router pattern, decomposed handlers |
| 2 | DRY extraction | SP-R2-003 | Shared utilities, models module |
| 3 | Magic numbers | SP-R2-003 | Named constants (MAX_BODY, METRICS_MAX_SAMPLES, etc.) |
| 4 | Inconsistent error handling | SP-R2-004 | Centralized error catalog (utils/errors.js) |
| 5 | Hardcoded strings | SP-R2-006 | Externalized to strings.js |
| 6 | JSDoc annotations | SP-R2-006 | All public functions documented |
| 7 | `let` → `const` in decisions handler | SP-R2-007 | Fixed: prefer-const compliance |
| 8 | ESLint rules expanded | SP-R2-007 | 7 rules (up from 1) |

## Remaining Low-Priority Items (Future Sprints)

| # | Item | Priority | Notes |
|---|------|----------|-------|
| 1 | TypeScript migration | LOW | Would add static type safety; large effort |
| 2 | Module bundling | LOW | Single-file index.html works for localhost |
| 3 | E2E browser testing | LOW | Manual testing sufficient for single-user localhost |

## Tech Debt Score

**Estimated: 28/100** (target: < 35/100) — PASS

Factors:
- Code quality: strong (95%+ coverage, ESLint clean, JSDoc)
- Architecture: solid (Store abstraction, cache layer, decomposed handlers)
- Documentation: comprehensive (Sprint 7 adds full manuals)
- Testing: thorough (299 tests, unit + integration + edge cases)
- Maintainability: good (consistent patterns, string externalization)
