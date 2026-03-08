# COMBO_PARTIAL Synthesis – TECH + UX – 2025-06-25

## Metadata
- Synthesized Phases: Phase 2 (TECH), Phase 3 (UX)
- Mode: AUDIT (COMBO_PARTIAL — 2 of 4 disciplines)
- Date: 2025-06-25T00:00:00Z
- Application: Questionnaire & Decisions Manager (Command Center Web Application)
- Missing Disciplines: BUSINESS (Phase 1), MARKETING (Phase 4) — not in scope for this COMBO_AUDIT

---

## 1. Executive Summary

The Questionnaire & Decisions Manager is a well-engineered, zero-dependency Node.js developer tool that serves as the web UI for a multi-agent AI project orchestration system. The COMBO_AUDIT of TECH and UX disciplines reveals a codebase that punches above its weight: 98.67% test coverage, strong accessibility foundations (WCAG 2.1 AA conditional), and a coherent implicit design system — all achieved without a single runtime dependency.

**Overall Health Score:**

| Discipline | Score | Summary |
|-----------|-------|---------|
| Technology & Architecture | 78/100 | Solid modular monolith; well-tested; gaps in CI maturity and frontend scaling |
| UX & Product Experience | 74/100 | Strong accessibility and error handling; design system not formalized; cognitive load issues for large datasets |
| **Combined** | **76/100** | **Good foundation with identified scaling concerns** |

**Critical Findings Requiring Action:**

| Priority | Finding | Discipline | Remediation |
|----------|---------|-----------|-------------|
| High | Design system not formalized (CRITICAL_GAP per G-UX-01) | UX | Extract tokens to JSON + create component inventory (10h) |
| Medium | CSP `unsafe-inline` for script-src and style-src | TECH | Architectural constraint of single-file SPA; accept risk or extract CSS/JS |
| Medium | Cognitive overload for large questionnaire files (score 7.0) | UX | Default collapsed sections + pagination (7h) |
| Medium | server.js monolithic handler file (1,223 lines) | TECH | Extract into router, handlers, middleware modules |
| Medium | No SAST / npm audit in CI | TECH | Add Semgrep + npm audit step to CI pipeline |
| Medium | WCAG contrast ratios unverified | UX | Run axe-core or Lighthouse automated testing (2h) |

---

## 2. Cross-Team Dependency Analysis

### 2.1 TECH → UX Dependencies

| ID | TECH Finding | UX Impact | Status |
|----|-------------|-----------|--------|
| DEP-T2U-001 | Single-file frontend (RISK-001) | All UX recommendations must work within monolithic index.html | ADVISORY — all recommendations verified feasible |
| DEP-T2U-002 | Zero-dependency constraint | UX cannot recommend external libraries (axe-core only as dev dep) | ADVISORY — all recommendations use native APIs |
| DEP-T2U-003 | CSP unsafe-inline (GAP-005) | Design system extraction must maintain inline approach or nonce-based CSP | BLOCKING — token extraction to JSON is unaffected, but CSS/JS extraction would require CSP update |
| DEP-T2U-004 | No build step | UX cannot recommend compiled CSS (Sass/PostCSS) or bundled JS | ADVISORY — recommendations use vanilla CSS/JS |

### 2.2 UX → TECH Dependencies

| ID | UX Finding | TECH Impact | Status |
|----|-----------|-------------|--------|
| DEP-U2T-001 | Global search (REC-UX-006) | Requires client-side search implementation; adds complexity to monolithic JS | ADVISORY — marked DEPENDENT_ON_TECH |
| DEP-U2T-002 | Automated accessibility testing (REC-UX-007) | Adding axe-core as dev dependency + CI step | ADVISORY — compatible with zero-runtime-dep constraint |
| DEP-U2T-003 | Pagination for large lists (REC-UX-008) | Pure JS logic; must integrate with existing render pipeline | ADVISORY — no architecture change needed |
| DEP-U2T-004 | String externalization (DD-010) | Refactoring inline strings to STRINGS object; monolithic file concern | ADVISORY — aligns with TECH RISK-001 mitigation |

### 2.3 Cross-Team Blocker Summary

| Type | Count | Details |
|------|-------|---------|
| BLOCKING | 1 | DEP-T2U-003: CSS/JS extraction blocked by CSP unsafe-inline — must coordinate CSP policy update if files are extracted |
| ADVISORY | 7 | All other dependencies are informational and non-blocking |

---

## 3. Combined Gap Matrix

| ID | Gap | Source Phase | Priority | Effort (h) | Cross-Phase Impact |
|----|-----|------------|----------|------------|-------------------|
| GAP-005 | CSP unsafe-inline | TECH | Medium | 4-16 | BLOCKING for UX design system extraction if CSS externalised |
| GAP-008 | server.js monolithic | TECH | Medium | 8 | ADVISORY for UX (all frontend changes in index.html) |
| GAP-002 | No SAST in CI | TECH | Medium | 2 | None |
| GAP-003 | No npm audit in CI | TECH | Medium | 1 | None |
| GAP-009 | No markdown corruption recovery | TECH | Medium | 4 | None |
| DD-001 | No formal design tokens file | UX | High | 4 | None |
| DD-002 | No component inventory | UX | High | 6 | None |
| DD-003 | Questionnaire sections expanded by default | UX | Medium | 1 | None |
| DD-006 | No global search | UX | Medium | 8 | DEPENDENT_ON_TECH (monolithic JS) |
| DD-009 | Contrast ratios unverified | UX | Medium | 2 | None |
| DD-013 | No pagination for large lists | UX | Medium | 6 | None |
| DD-014 | Decision transitions unexplained | UX | Medium | 1.5 | None |

---

## 4. Combined Risk Matrix

| ID | Risk | Phase | Probability | Impact | Score | Mitigation Priority |
|----|------|-------|-------------|--------|-------|-------------------|
| RISK-001 | Single-file frontend scaling | TECH | Medium | Medium | Medium | Sprint 1 |
| RISK-002 | Markdown-as-database fragility | TECH | Low | High | Medium | Sprint 2 |
| RISK-UX-001 | Design system divergence | UX | Medium | Medium | Medium | Sprint 1 |
| RISK-UX-002 | Cognitive overload (>20 questions) | UX | Medium | Medium | Medium | Sprint 1 |
| RISK-UX-003 | Unverified contrast ratios | UX | Low | High | Medium | Sprint 1 |
| RISK-003 | No HTTPS | TECH | Low | High | Low | Accept (localhost) |
| RISK-004 | ReDoS potential | TECH | Low | Medium | Low | Sprint 2 |
| RISK-005 | Backup overflow | TECH | Low | Low | Low | Sprint 3 |
| RISK-UX-004 | i18n readiness | UX | Low | Low | Low | Backlog |
| RISK-UX-005 | No task success data | UX | Medium | Low | Low | Backlog |

---

## 5. Recommended Sprint Plan (COMBO_PARTIAL)

### Sprint 1: Foundation & Quick Wins (Priority: High + Medium-Immediate)

| Story | Source | Effort (h) | Type |
|-------|--------|------------|------|
| Extract CSS custom properties to `design-tokens.json` | DD-001 | 4 | UX |
| Create component inventory documentation | DD-002 | 6 | UX |
| Default questionnaire sections to collapsed | DD-003 | 1 | UX |
| Add contextual tooltips to command parameter fields | DD-005 | 2 | UX |
| Run automated contrast testing (axe-core) | DD-009 | 2 | UX |
| Add Semgrep SAST to CI pipeline | GAP-002 | 2 | TECH |
| Add npm audit to CI pipeline | GAP-003 | 1 | TECH |
| **Sprint Total** | | **18h** | |

### Sprint 2: Scaling & Resilience

| Story | Source | Effort (h) | Type |
|-------|--------|------------|------|
| Add pagination for questionnaire files >20 questions | DD-013 | 6 | UX |
| Add breadcrumb navigation to Questionnaires tab | DD-004 | 3 | UX |
| Add markdown corruption detection + user notification | GAP-009 | 4 | TECH |
| Explain decision status transitions in UI | DD-014 | 1.5 | UX |
| Add `aria-busy` to skeleton loaders | DD-012 | 0.5 | UX |
| Add `role="article"` to card elements | DD-008 | 1 | UX |
| **Sprint Total** | | **16h** | |

### Sprint 3: Enhancement

| Story | Source | Effort (h) | Type |
|-------|--------|------------|------|
| Implement global search (questionnaires + decisions) | DD-006 | 8 | TECH/UX |
| Complete string externalization to STRINGS object | DD-010 | 4 | UX |
| Add collapsible groups to command sidebar | DD-011 | 2 | UX |
| Tokenize line-height values | DD-007 | 1 | UX |
| **Sprint Total** | | **15h** | |

### Backlog (Low Priority / Conditional)

| Story | Source | Effort (h) | Condition |
|-------|--------|------------|-----------|
| Rate limiting | GAP-001 | 4 | If tool exposed beyond localhost |
| API versioning | GAP-006 | 2 | If external API consumers exist |
| IaC (Dockerfile) | GAP-007 | 4 | If team deployment required |
| server.js decomposition | GAP-008 | 8 | When adding new endpoints becomes painful |
| i18n framework | i18n assessment | 7 | If multi-language required (QR-UX-004) |

---

## 6. KPI Tracking Recommendations

| KPI | Baseline | Target | Measurement |
|-----|----------|--------|-------------|
| Test coverage (statements) | 98.67% | ≥98% | CI pipeline |
| Test coverage (branches) | 88.05% | ≥90% | CI pipeline |
| WCAG compliance | AA (conditional) | AA (confirmed) | axe-core in CI |
| Design debt hours | 42h | ≤20h after Sprint 2 | Sprint burndown |
| Cognitive load max score | 7.0 | ≤6.0 | Post-Sprint 2 reassessment |
| CI maturity | Level 2 | Level 3 after Sprint 1 | Pipeline assessment |
| Heuristic problems | 4/10 | ≤2/10 | Post-Sprint 2 reevaluation |

---

## 7. Open Items

### INSUFFICIENT_DATA (Pending Questionnaire Responses)

| ID | Question | Phase | Impact on Synthesis |
|----|----------|-------|-------------------|
| QR-UX-001 | Analytics data availability | UX | Cannot establish task success baselines |
| QR-UX-002 | Usability test history | UX | Cannot validate persona and journey |
| QR-UX-003 | Accessibility test results | UX | Cannot confirm WCAG AA compliance |
| QR-UX-004 | Multi-language requirement | UX | i18n priority determination |
| QR-UX-005 | Design specifications existence | UX | Design system source of truth |

### Phases Not Covered (COMBO_PARTIAL)

| Phase | Discipline | Status | Impact |
|-------|-----------|--------|--------|
| Phase 1 | BUSINESS | Not in scope | No business model, requirements, or financial analysis |
| Phase 4 | MARKETING | Not in scope | No brand identity, GTM strategy, or conversion design |

**Note:** A full synthesis (`final-report-master.md` + `cross-team-blocker-matrix.md`) requires all 4 phases. This COMBO_PARTIAL synthesis covers TECH + UX only. Run `CREATE SYNTHESIS` after completing remaining phases if needed.

---

## HANDOFF CHECKLIST (Synthesis – COMBO_PARTIAL)
- [x] All phase outputs integrated (Phase 2 TECH + Phase 3 UX)
- [x] Cross-team dependencies identified and classified (1 BLOCKING, 7 ADVISORY)
- [x] Combined gap matrix produced (12 items)
- [x] Combined risk matrix produced (10 items)
- [x] Sprint plan produced (3 sprints + backlog)
- [x] KPI tracking recommendations provided
- [x] Open items documented (5 INSUFFICIENT_DATA, 2 phases not in scope)
- [x] COMBO_PARTIAL scope limitations explicitly stated
- [x] Deliverable written to file per MEMORY MANAGEMENT PROTOCOL
