# Story Completion Report — SP-R2-003-006 (WCAG AA Contrast Fixes)

**Story:** SP-R2-003-006 — Fix all WCAG 2.1 AA contrast failures  
**Issue:** [#26](https://github.com/RobertAgterhuis/myAgentic-IT-Project-team/issues/26)  
**Sprint:** SP-R2-003 (Code Quality + Testing)  
**SP:** 2  
**Status:** COMPLETE  
**Date:** 2026-03-07

---

## Summary

Audited all CSS color tokens in both light and dark themes against WCAG 2.1 AA contrast requirements. Identified and fixed 5 contrast failures across text colors and interactive element borders. Added a new `--border-control` design token for form element boundaries. Created an automated contrast verification test suite (20 tests) that validates all critical color pairings at build time.

---

## Acceptance Criteria Verification

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| 1 | All text ≥ 4.5:1 contrast | PASS | 12 text pairs verified in contrast.test.js |
| 2 | All non-text UI ≥ 3:1 contrast | PASS | 5 border pairs verified; buttons, inputs, selects updated to `--border-control` |
| 3 | Muted/secondary text updated | PASS | Light: `--text-sec` #64748b→#5b6b7e, `--text-muted` #627389→#5e6d80 |
| 4 | Design token system updated | PASS | design-tokens.json synced with all CSS changes |
| 5 | Automated contrast check in CI | PASS | contrast.test.js (20 tests) runs in vitest CI pipeline |
| 6 | Zero WCAG AA contrast failures | PASS | All 20 contrast tests pass |

---

## Changes Made

### CSS Token Changes (index.html)

**Light theme:**
| Token | Before | After | Rationale |
|-------|--------|-------|-----------|
| `--text-sec` | `#64748b` | `#5b6b7e` | 4.40:1→~5.0:1 on `--bg` (#f4f6fb) |
| `--text-muted` | `#627389` | `#5e6d80` | 4.48:1→~4.8:1 on `--bg` |
| `--border-control` | (new) | `#7e8b9a` | 3.2:1 on white — for interactive element borders |

**Dark theme:**
| Token | Before | After | Rationale |
|-------|--------|-------|-----------|
| `--text-muted` | `#7b8da1` | `#8494a7` | Improved contrast on dark surfaces |
| `--border-hover` | `#3b4168` | `#616e91` | 2.2:1→3.2:1 on surface (#1a1d2e) |
| `--border-control` | (new) | `#5f6a82` | 3.1:1 on dark surface — for interactive element borders |

### CSS Selector Changes
Six selectors updated from `var(--border)` to `var(--border-control)`:
1. `.btn` — neutral button border
2. `.card-ans textarea` — answer text area
3. `.card-foot .status-group select` — status dropdown
4. `.dec-answer-form textarea` — decision answer text area
5. `.modal .scope-pick select` — scope picker dropdown
6. `.form-group input, .form-group select, .form-group textarea` — all form inputs

`.btn:hover` — removed `border-color: var(--border-hover)` override (maintains `--border-control` on hover; background+shadow provide hover feedback).

### Design Token System
`design-tokens.json` updated with all new values + `border-control` token added for both themes.

### Test File Created
`contrast.test.js` — 20 tests:
- 12 text contrast assertions (4.5:1 minimum, both themes)
- 5 non-text/border contrast assertions (3:1 minimum, both themes)
- 3 utility self-check assertions

---

## Test Results

- **Tests:** 188/188 passing (20 new)
- **Coverage:** 93.61% statements
- **ESLint:** 0 violations

---

## Files Modified

| File | Change |
|------|--------|
| `.github/webapp/index.html` | CSS token values + form element border selectors |
| `.github/docs/brand/design-tokens.json` | Synced token values + added `border-control` |
| `.github/webapp/contrast.test.js` | New — automated WCAG contrast verification |
| `.github/docs/sprints/SP-R2-003-sprint-gate.md` | Story status → COMPLETE |
