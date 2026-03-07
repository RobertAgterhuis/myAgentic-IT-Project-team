# Localization Specialist — Phase 3 — AUDIT Mode

> **Agent:** 35-localization-specialist  
> **Phase:** 3 — Experience Design  
> **Mode:** AUDIT  
> **Cycle:** COMBO_AUDIT (TECH + UX)  
> **Input:** Content Strategist output (Agent 32), Phase 3 agents 10–13, Phase 2 architecture output  
> **Questionnaire Input Check:** NOT_INJECTED — no `## QUESTIONNAIRE INPUT — Localization Specialist` block present in context. Proceeding normally.

---

## Step 0: Questionnaire Input Check

No questionnaire input block was injected by the Orchestrator. Proceeding with standard audit analysis. All `INSUFFICIENT_DATA:` items will be compiled as `QUESTIONNAIRE_REQUEST` items at the end of this deliverable.

---

## Step 1: Current Locale Coverage Inventory

### Supported Languages

| Language | UI Coverage | Documentation Coverage | Customer Service | i18n Mechanism | Status |
|----------|------------|----------------------|-----------------|---------------|--------|
| English (en) | FULL | FULL (all Markdown documentation in English) | `INSUFFICIENT_DATA:` | NONE (hardcoded strings) | Only supported language |

### Languages Absent but Potentially Relevant

| Language | Strategic Relevance | Source |
|----------|-------------------|--------|
| `INSUFFICIENT_DATA:` | No Phase 1 (Business) output available — COMBO_AUDIT scope is TECH + UX only. Target markets, international expansion strategy, and language priorities are undefined. | Missing: Domain Expert, Sales Strategist, Product Manager outputs |

**Summary:** The application supports English only. All UI text is hardcoded in HTML and JavaScript — no i18n library, no translation files, no locale selection mechanism. The `<html lang="en">` attribute is correctly set (source: `index.html` L2). UTF-8 charset is declared (source: `index.html` L4).

`INSUFFICIENT_DATA:` Target language priorities cannot be determined without Phase 1 Business output. This is a scope limitation of the COMBO_AUDIT (TECH + UX) cycle.

---

## Step 2: i18n Architecture Audit

### 2a: Hardcoded Strings Detection

**Finding:** ALL user-facing strings are hardcoded directly in HTML markup and JavaScript template literals. There is no string externalization layer — no locale files, no translation keys, no i18n library.

#### Hardcoded String Categories (based on Agent 32 Copy Inventory)

| Category | Count (approx.) | Location Type | Example | Source |
|----------|-----------------|--------------|---------|--------|
| HTML static text | ~25 | `<h2>`, `<p>`, `<span>`, `<button>` tags | `"Command Center"` (tab label), `"Select a command from the sidebar…"` (empty state) | `index.html` L681–L860 |
| Button labels | ~15 | HTML `<button>` elements and JS-injected markup | `"Save All"`, `"New Decision"`, `"Export"`, `"Confirm"`, `"Cancel"` | `index.html` L746–L889 |
| Toast messages | ~40 | JS `toast()` calls with string literals/templates | `toast('Session started!', 't-ok')`, `toast('Failed: ' + e.message, 't-err')` | `index.html` L960–L2100 (throughout JS) |
| Modal content | ~10 | HTML `<p>` and JS-injected `innerHTML` | `"Are you sure? This action cannot be easily undone."` (L882) | `index.html` L830–L920 |
| Template literals with embedded text | ~30 | JS template literals in render functions | `` `Saved ${updates.length} answer(s)` ``, `` `${decisions.open.length} decision(s)` `` | `index.html` L1100–L1800 |
| Status/badge labels | ~10 | JS conditionals producing markup | `"OPEN"`, `"DECIDED"`, `"DEFERRED"`, `"ANSWERED"`, `"REQUIRED"` | `index.html` L1300–L1500 |
| Placeholder text | ~8 | HTML `placeholder` attributes and JS | `"Type your answer here..."`, `"Why?"`, `"e.g. Phase 2, SP-3, All sprints"` | `index.html` L850–L910 |
| Noscript fallback | 1 | `<noscript>` tag | `"This application requires JavaScript to run."` | `index.html` L668 |
| ARIA labels | ~5 | `aria-label` attributes | `"Export project data"`, `"Toggle theme"` | `index.html` L744–L756 |
| **TOTAL** | **~130+** | | | |

**Critical architectural issues:**

`I18N_ISSUE: HARDCODED_STRING — index.html L681–L860 (HTML) — All static UI labels, headings, tab names, button text, modal copy, and placeholder text are hardcoded in English directly in HTML markup. No translation key mechanism exists. — impact: CRITICAL`

`I18N_ISSUE: HARDCODED_STRING — index.html L960–L2100 (JS) — All ~40 toast messages and ~30 template literal strings with dynamic content are hardcoded in JavaScript functions. Extract+replace requires refactoring every render function. — impact: CRITICAL`

`I18N_ISSUE: HARDCODED_STRING — index.html L1100–L1800 (JS template render functions) — Renderer functions (renderSidebar, renderMain, renderDecision, pipeline renderers) embed English text in template literals with HTML markup. String extraction requires separating translatable text from markup structure. — impact: CRITICAL`

`I18N_ISSUE: HARDCODED_STRING — index.html L1280–L1167 (JS dynamic labels) — Computed strings like "${decisions.open.length} decision(s)" and "${questionnaires.length} questionnaire(s) across ${new Set(...).size} phase(s)" use English grammar patterns (pluralization via "(s)" suffix) that do not work for most other languages. — impact: HIGH`

### 2b: Date, Time, Number and Currency Formatting

| Format Type | Present | Locale-Aware | Finding | Source |
|------------|---------|-------------|---------|--------|
| Date display | YES — `${esc(d.date)}` in decision cards | NO — raw string passthrough | Dates are displayed as received from the server API (Markdown-parsed). No `Intl.DateTimeFormat` or locale-aware formatting is applied. The date field is rendered via simple `esc()` (XSS-safe escaping) with no formatting logic. | `index.html` L1369, L1397, L1422 |
| Number display | YES — counts in template literals | NO — raw numeric interpolation | Counts are displayed via `${updates.length}`, `${decisions.open.length}`, etc. No `Intl.NumberFormat` is used. For English this is adequate, but languages with different digit grouping (e.g., 1.000 vs 1,000) would display incorrectly. | `index.html` L1150–L1167 |
| Currency | NO | N/A | No currency values displayed in the UI. Not applicable for current feature set. | N/A |
| Timezone | NO | N/A | No timezone-specific display detected. Server timestamps are passed through as-is. | N/A |

`I18N_ISSUE: LOCALE_FORMAT — DATE — Decision card dates rendered as raw strings via esc(d.date) without locale-aware formatting. No Intl.DateTimeFormat usage. — priority: HIGH`

`I18N_ISSUE: LOCALE_FORMAT — NUMBER — Numeric counts displayed via raw template literal interpolation. No Intl.NumberFormat usage for digit grouping. — priority: MEDIUM`

### 2c: RTL Support

| Aspect | Finding | Source |
|--------|---------|--------|
| `dir` attribute | NOT PRESENT — no `dir="ltr"` or `dir="rtl"` on `<html>` or any element | `index.html` L2 |
| CSS logical properties | NOT USED — all CSS uses physical properties (`margin-left`, `padding-left`, `text-align: left`, `right: 20px`) | `index.html` L228 (toast-box: `right: 20px`), L279 (`margin-left: 6px`), L376 (`margin-left: 4px`), L399 (`text-align: left`), L608 (`padding-left: 22px`) |
| Flexbox direction | Uses `flex-direction: column` and `flex-direction: row` — these respond to writing direction IF `dir` is set, but explicit `text-align: left` overrides would break | `index.html` L80, L162, L572 |
| Icon mirroring | NOT CONSIDERED — emoji icons used (📊, 📋, 📌, 📅, ⚠️) which are unicode and do not need mirroring; however, navigation flow is LTR-assumed | Various lines |
| RTL testing | ABSENT — no RTL testing tooling or configuration detected | Full codebase scan |

`I18N_ISSUE: RTL_SUPPORT — CSS uses physical properties (margin-left, padding-left, text-align: left, right) instead of CSS logical properties (margin-inline-start, padding-inline-start, text-align: start, inset-inline-end). RTL languages would display with broken layout. — priority: HIGH`

`I18N_ISSUE: RTL_SUPPORT — No dir attribute specified on <html> element. While LTR is the browser default, explicit dir="ltr" is best practice and dir="rtl" support requires attribute switching mechanism. — priority: MEDIUM`

### 2d: Pluralization and Grammar

| Aspect | Finding | Source |
|--------|---------|--------|
| Pluralization mechanism | ABSENT — uses English "(s)" suffix pattern | `index.html` L1155, L1167, L1595 |
| Example patterns | `"${updates.length} answer(s)"`, `"${decisions.open.length} decision(s)"`, `"${questionnaires.length} questionnaire(s) across ${new Set(...).size} phase(s)"` | `index.html` L1595, L1155, L1167 |
| ICU MessageFormat | NOT USED | Full codebase — no ICU or i18n library |
| Language-specific rules | NOT CONSIDERED — English-only assumption | N/A |

The `(s)` pattern is a naive English approximation that:
- Is grammatically incorrect even in English (should be "1 answer" / "2 answers", not "1 answer(s)")
- Does not work for ANY other language (e.g., German: "1 Antwort" / "2 Antworten"; Russian has 3 plural forms; Arabic has 6 plural forms)

`I18N_ISSUE: PLURALIZATION — Naive "(s)" suffix used for pluralization in 3+ template literals. No plural-rules engine (ICU MessageFormat, Intl.PluralRules, or equivalent). This pattern cannot be localized and is grammatically incorrect even in English for count=1. — priority: HIGH`

### 2e: String Extractability

| Aspect | Finding | Source |
|--------|---------|--------|
| Resource files | ABSENT — no `.json`, `.properties`, `.po`, `.xliff`, or other locale resource files | File system scan |
| Translation keys | ABSENT — no key-based string lookup mechanism | Full JS codebase |
| Context mechanism | ABSENT — no translator context, comments, or maximum length annotations | Full JS codebase |
| String concatenation patterns | PRESENT — `'Failed: ' + e.message` concatenates static + dynamic text, making extraction complex | `index.html` ~15 occurrences |
| Embedded HTML in strings | PRESENT — template literals mix translatable text with HTML markup (`<span class="badge badge-blocking">&#9888; BLOCKS SPRINT GATE</span>`) | `index.html` L1362 |

`I18N_ISSUE: HARDCODED_STRING — index.html (all JS render functions) — No string extractability: UI strings are embedded in template literals mixed with HTML markup and dynamic expressions. Automated string extraction tools (e.g., i18next-parser, formatjs extract) cannot extract these without significant refactoring. A manual extraction + refactoring effort is required. — impact: CRITICAL`

### i18n Architecture Readiness Summary

| Criterion | Status | Score |
|-----------|--------|-------|
| String externalization | ❌ ABSENT | 0/10 |
| Locale-aware date formatting | ❌ ABSENT | 0/10 |
| Locale-aware number formatting | ❌ ABSENT | 0/10 |
| RTL layout support | ❌ ABSENT | 0/10 |
| Pluralization framework | ❌ ABSENT | 0/10 |
| String extractability | ❌ ABSENT | 0/10 |
| Language declaration | ✅ PRESENT (`<html lang="en">`) | 8/10 |
| Character encoding | ✅ PRESENT (`<meta charset="UTF-8">`) | 10/10 |
| **Overall i18n readiness** | **❌ NOT READY** | **2.25/10** |

The application has zero internationalization infrastructure. The `lang` attribute and UTF-8 encoding are the only i18n-positive findings.

---

## Step 3: Cultural Suitability Check

### Color Palette Assessment

| Element | Color | Cultural Risk | Assessment |
|---------|-------|--------------|------------|
| Primary/accent (`--primary: #4f8cff`) | Blue | LOW — blue is generally positive across cultures (trust, professionalism) | No action required. Source: Aslam, M.M. (2006). "Are You Selling the Right Colour? A Cross-cultural Review of Colour as a Marketing Cue." _Journal of Marketing Communications_ 12(1), 15–30. |
| Success (`--success: #22c55e`) | Green | LOW for most markets. MEDIUM for some Middle Eastern contexts where green has religious significance and should be used respectfully | Advisory only. Source: Madden, T.J., Hewett, K. & Roth, M.S. (2000). "Managing Images in Different Cultures." _Journal of International Marketing_ 8(4), 90–107. |
| Error/danger (`--danger: #ef4444`) | Red | LOW for error signaling — universally understood for warnings/errors | No action required |
| Warning (`--warning: #f59e0b`) | Amber/yellow | LOW — universally associated with caution | No action required |

### Iconography Assessment

| Element | Type | Cultural Risk | Assessment |
|---------|------|--------------|------------|
| UI icons | Unicode emoji (📊📋📌📅⏳⚙️🔧💾📄🎯⚡🔍📑) | LOW — emoji are globally recognized. However, emoji rendering varies by OS/platform, which could affect visual consistency. | Advisory: Agent 13 already flagged emoji accessibility issues (GAP-A11Y-006, GAP-A11Y-007). If emoji are replaced with SVG icons, cultural neutrality should be verified for any replacement symbols. |
| Symbols | Checkmarks (✓), warning triangles (⚠️), status dots | LOW — universal symbolic language for status indication | No action required |

### Content/Imagery Assessment

| Element | Finding | Cultural Risk |
|---------|---------|--------------|
| No images or illustrations | Application uses no photographic or illustrative content — purely text + emoji + CSS | N/A — no cultural risk from imagery |
| Marketing slogans | No slogans or taglines present — application is a developer tool | N/A |
| Date conventions | Dates are rendered as raw strings from server — format not controlled by UI | MEDIUM — if localized, date format must be locale-specific (DD/MM/YYYY vs MM/DD/YYYY vs YYYY-MM-DD). See I18N_ISSUE: LOCALE_FORMAT — DATE above. |

**Overall cultural suitability:** LOW RISK for the current English-only, internal developer tool. Cultural risks are predominantly in date formatting and potential green color sensitivities for specific Middle Eastern markets.

`L10N_CULTURAL_RISK: date-format — all markets — Date display format is not locale-controlled; expanding to European/Asian markets would require locale-aware date formatting to avoid US-centric (MM/DD/YYYY) vs. international (DD/MM/YYYY) confusion — source: ISO 8601, CLDR date pattern standards`

---

## Step 4: Translation Workflow Assessment

| Aspect | Status | Finding |
|--------|--------|---------|
| Active translation workflow | ❌ ABSENT | No evidence of any translation process. Application is English-only with no translation history. |
| Translation Management System (TMS) | ❌ ABSENT | No Crowdin, Phrase, Lokalise, Transifex, or other TMS integration detected. |
| Glossary / term lists | ❌ ABSENT | No formal glossary exists. Agent 32 identified consistent terminology usage for core concepts ("Decision", "Questionnaire", "Phase", "Sprint") but no documented glossary. |
| Translation type | N/A | No translation has been performed. |
| Feature translation process | N/A | No process — all content is English-only developer-authored copy. |
| CI/CD translation integration | ❌ ABSENT | Phase 2 DevOps audit (Agent 07) identified no translation pipeline. Build process serves `index.html` directly with no locale compilation step. |

`L10N_WORKFLOW_RISK: no-workflow — No translation workflow exists. Before any localization can begin, a complete workflow must be established: TMS selection, glossary development, translator onboarding, review process, CI/CD integration. — recommended action: Defer until i18n architecture is implemented (OUT_OF_SCOPE: TECH for architecture, this agent for workflow design)`

`L10N_WORKFLOW_RISK: no-glossary — Despite consistent core terminology (Agent 32 Terminology Audit), no formal translatable glossary exists. Domain terms ("Sprint Gate", "Reevaluate", "Phase", "Onboarding Agent") must be defined as non-translatable or with canonical translations per language before translation work begins. — recommended action: Create terminology glossary as part of Content Style Guide (REC-CNT-001 from Agent 32)`

`L10N_WORKFLOW_RISK: string-code-coupling — All translatable strings are embedded in source code (index.html). Any translation update requires a code deployment. This blocks independent translation cycles and prevents translator access without developer involvement. — recommended action: Extract strings to locale resource files as prerequisite (OUT_OF_SCOPE: TECH)`

---

## Step 5: New Market Recommendations

### Technical Readiness Context

`INSUFFICIENT_DATA:` Phase 1 (Business) was not executed in this COMBO_AUDIT cycle. Therefore:
- No Domain Expert output for target market identification
- No Sales Strategist output for international expansion strategy
- No Product Manager output for roadmap priorities

The following market assessment is based solely on technical readiness and the application's current nature as a developer productivity tool.

### Market Readiness Matrix (based on technical assessment only)

| Market | Language(s) | Technical Readiness | Cultural Adaptation | Translation Complexity | Strategic Priority |
|--------|------------|--------------------|--------------------|----------------------|-------------------|
| Netherlands / Belgium (NL) | Dutch (nl) | BLOCKING | LOW | LOW (SVO grammar, similar to English) | `INSUFFICIENT_DATA:` |
| Germany / Austria / Switzerland (DACH) | German (de) | BLOCKING | LOW | MEDIUM (compound nouns, 3 genders, different plural rules, longer strings) | `INSUFFICIENT_DATA:` |
| France / Belgium (FR) | French (fr) | BLOCKING | LOW | MEDIUM (gendered nouns, different plural rules, longer strings) | `INSUFFICIENT_DATA:` |
| Spain / Latin America | Spanish (es) | BLOCKING | LOW | MEDIUM (regional variants es-ES vs es-419) | `INSUFFICIENT_DATA:` |
| Japan | Japanese (ja) | BLOCKING | HIGH (date formats, honoric speech levels, layout density) | HIGH (CJK line breaking, no spaces, different counting systems) | `INSUFFICIENT_DATA:` |
| Middle East | Arabic (ar) | BLOCKING | HIGH (RTL, calendar systems) | HIGH (RTL layout, 6 plural forms, different numeral system option) | `INSUFFICIENT_DATA:` |

### Blocking Requirements for ALL Markets

The following technical prerequisites must be resolved before ANY language can be added:

1. **String externalization** — Extract all ~130+ hardcoded strings to locale resource files (I18N_ISSUE: HARDCODED_STRING) → `OUT_OF_SCOPE: TECH`
2. **i18n library integration** — Implement a string lookup mechanism with ICU MessageFormat support for plurals, gender, interpolation → `OUT_OF_SCOPE: TECH`
3. **Locale-aware formatting** — Implement `Intl.DateTimeFormat` and `Intl.NumberFormat` for all date/number displays → `OUT_OF_SCOPE: TECH`
4. **CSS logical properties migration** — Replace physical CSS properties with logical equivalents for RTL readiness → `OUT_OF_SCOPE: TECH` (except RTL markets, this is a prerequisite only for Arabic, Hebrew, etc.)
5. **Pluralization engine** — Replace `(s)` pattern with ICU plural rules → `OUT_OF_SCOPE: TECH`

**Technical dependency:** Items 1–3 and 5 are BLOCKING for all markets. Item 4 is BLOCKING only for RTL markets.

---

## Step 6: Self-Check (Phase 3 Closure)

### Localization Agent Self-Check

- [x] All existing locale gaps are documented with `I18N_ISSUE` tags (8 issues registered)
- [x] Cultural risks are sourced with verifiable citations (Aslam 2006, Madden et al. 2000, ISO 8601, CLDR)
- [x] Translation workflow risks are identified with recommended actions (3 `L10N_WORKFLOW_RISK` items)
- [x] All architecture issues properly tagged as `OUT_OF_SCOPE: TECH` per G-CNT-04

### Phase 3 Closure Verification (as last Phase 3 agent)

| Agent | Deliverable | Status | File |
|-------|------------|--------|------|
| 10 — UX Researcher | `.github/docs/phase-3/10-ux-researcher.md` | ✅ COMPLETE | 8 friction points, 5 recommendations, 9 stories, 3 guardrails |
| 11 — UX Designer | `.github/docs/phase-3/11-ux-designer.md` | ✅ COMPLETE | 10 heuristics assessed, 5 recommendations, 11 stories, 3 guardrails |
| 12 — UI Designer | `.github/docs/phase-3/12-ui-designer.md` | ✅ COMPLETE | Design system audit, 5 token gaps, 4 recommendations, 8 stories, 2 guardrails |
| 13 — Accessibility Specialist | `.github/docs/phase-3/13-accessibility-specialist.md` | ✅ COMPLETE | WCAG 2.1 AA audit, 14 remediation items, 5 recommendations, 13 stories, 4 guardrails |
| 32 — Content Strategist | `.github/docs/phase-3/32-content-strategist.md` | ✅ COMPLETE | Copy inventory, voice & tone, 8 content issues, 4 recommendations, 4 stories, 3 guardrails |
| 35 — Localization Specialist | This document | ✅ COMPLETE | i18n architecture audit, 8 I18N_ISSUEs, 3 L10N_WORKFLOW_RISKs, 1 L10N_CULTURAL_RISK |

**All 6 Phase 3 agents have produced complete deliverables. Phase 3 output is ready for Critic Agent validation.**

### Cross-Agent Consistency Checks

| Check | Result | Detail |
|-------|--------|--------|
| i18n findings consistent with Content Strategist voice & tone output? | ✅ YES | Agent 32 identified ~130+ hardcoded content elements, voice & tone inconsistencies (CI-001–CI-005), and governance gap (no content management layer). This agent confirms all strings are hardcoded with no externalization. Terminology glossary (Agent 32) aligns with this agent's glossary recommendation. |
| i18n findings consistent with Software Architect architecture (Phase 2)? | ✅ YES | Phase 2 Agent 05 identified "No translation layer between external format (markdown) and internal representation" (L145), tight coupling (8/10), and hardcoded regex patterns. This is consistent with the zero i18n readiness score found here. |
| All i18n blockers communicated to Orchestrator? | ✅ YES | 5 BLOCKING prerequisites documented in Step 5 with `OUT_OF_SCOPE: TECH` tags. These must be resolved by Implementation Agent (Phase 5) before localization work can begin. |
| Accessibility alignment? | ✅ YES | Agent 13 SC 3.1.1 finding (`<html lang="en">` PASSES) is consistent with our locale inventory (English correctly declared). Agent 13 emoji issues (GAP-A11Y-006/007) are noted in our cultural suitability check as advisory for icon replacement. |

---

## Recommendations

### REC-L10N-001: Implement i18n String Externalization Architecture
- **Finding reference:** I18N_ISSUE: HARDCODED_STRING (4 instances — CRITICAL), I18N_ISSUE: PLURALIZATION (HIGH)
- **Action:** Extract all ~130+ hardcoded UI strings from `index.html` into locale resource files (recommended: JSON format, e.g., `locales/en.json`). Implement a lightweight i18n string lookup function supporting: (1) key-based string retrieval, (2) interpolation for dynamic values, (3) ICU MessageFormat or `Intl.PluralRules` for pluralization. Replace all `(s)` patterns with proper plural forms. NOTE: This is an `OUT_OF_SCOPE: TECH` architecture change — the Localization Specialist defines the requirements, the Implementation Agent executes.
- **Impact:** Risk Reduction — CRITICAL (unblocks ALL future localization). UX — MEDIUM (improves English plural correctness). Revenue — `INSUFFICIENT_DATA:` (depends on target market strategy). Cost — HIGH (significant refactoring: every render function must be updated).
- **Risk of non-execution:** Localization to any language is permanently blocked. English plural display remains grammatically incorrect. Content Strategy governance (REC-CNT-001 from Agent 32) cannot be effectively implemented without string externalization.
- **SMART KPI:** Hardcoded UI strings in source code → Baseline: ~130+ → Target: 0 → Method: automated lint rule (no string literals in render functions) → Horizon: Sprint 1 (architecture), Sprint 2 (full extraction)

**Priority Matrix:**
- Impact: CRITICAL (blocks all localization)
- Effort: HIGH (~8 SP total across 2 sprints)
- Priority: **P1** — Foundational prerequisite
- Suggested sprint: Sprint 1 (architecture + extraction framework), Sprint 2 (complete extraction)

---

### REC-L10N-002: Implement Locale-Aware Formatting
- **Finding reference:** I18N_ISSUE: LOCALE_FORMAT — DATE (HIGH), I18N_ISSUE: LOCALE_FORMAT — NUMBER (MEDIUM)
- **Action:** Replace all raw date display (`${esc(d.date)}`) with `Intl.DateTimeFormat` calls using the user's locale. Replace numeric count displays with `Intl.NumberFormat` for proper digit grouping. Recommended approach: create a `formatDate(dateStr, locale)` and `formatNumber(num, locale)` utility pair that wraps the `Intl` API.
- **Impact:** Risk Reduction — HIGH (prevents confusing date/number display for international users). UX — MEDIUM. Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (2 SP — straightforward `Intl` API usage).
- **Risk of non-execution:** Dates display in source format (potentially US-centric) for international users. Digit grouping may confuse users in locales using dot as thousands separator.
- **SMART KPI:** % of date/number displays using Intl API → Baseline: 0% → Target: 100% → Method: code search for raw date/number display in render functions → Horizon: Sprint 1

**Priority Matrix:**
- Impact: HIGH (UX quality for any locale)
- Effort: LOW (2 SP)
- Priority: **P1** — Quick win, low effort
- Suggested sprint: Sprint 1

---

### REC-L10N-003: Migrate CSS to Logical Properties for RTL Readiness
- **Finding reference:** I18N_ISSUE: RTL_SUPPORT (2 instances — HIGH + MEDIUM)
- **Action:** Replace physical CSS properties with CSS logical property equivalents: `margin-left` → `margin-inline-start`, `padding-left` → `padding-inline-start`, `text-align: left` → `text-align: start`, `right: 20px` → `inset-inline-end: 20px`. Add `dir="ltr"` to `<html>` element explicitly. This is a prerequisite for RTL language support but also a CSS best practice.
- **Impact:** Risk Reduction — HIGH (unblocks RTL market expansion). UX — LOW (no visible change for LTR users). Revenue — `INSUFFICIENT_DATA:`. Cost — MEDIUM (3 SP — systematic CSS refactoring, requires testing).
- **Risk of non-execution:** Arabic, Hebrew, and other RTL languages cannot be supported. Layout breaks for RTL users.
- **SMART KPI:** Physical CSS properties in stylesheet → Baseline: 16+ instances → Target: 0 → Method: CSS lint rule for physical properties → Horizon: Sprint 2
  
**Priority Matrix:**
- Impact: HIGH (blocks RTL markets)
- Effort: MEDIUM (3 SP)
- Priority: **P2** — Required only when RTL markets are targeted
- Suggested sprint: Sprint 2

---

### REC-L10N-004: Establish Translation Management Workflow
- **Finding reference:** L10N_WORKFLOW_RISK: no-workflow, L10N_WORKFLOW_RISK: no-glossary, L10N_WORKFLOW_RISK: string-code-coupling
- **Action:** (1) Select and configure a TMS (recommendation: Crowdin or Phrase — both integrate with JSON locale files and support ICU MessageFormat, GitHub integration, in-context editing). (2) Create a domain terminology glossary based on Agent 32's terminology audit (canonical terms: "Decision", "Questionnaire", "Phase", "Sprint", "Reevaluate", plus domain-specific terms to mark as non-translatable: "Sprint Gate", "Copilot Chat"). (3) Define per-language translation approach: Tier 1 → professional + linguistic review; Tier 2 → MT + post-edit. (4) Integrate TMS into CI/CD pipeline for automated locale file sync. NOTE: This recommendation is DEFERRED until REC-L10N-001 (string externalization) is implemented and target languages are defined (requires Phase 1 Business output).
- **Impact:** Risk Reduction — HIGH (prevents ad-hoc translation that leads to inconsistency). UX — HIGH (professional translation quality). Revenue — `INSUFFICIENT_DATA:`. Cost — MEDIUM (3 SP for TMS setup + glossary; ongoing translation cost is `INSUFFICIENT_DATA:`).
- **Risk of non-execution:** Translation work, if initiated, will be inconsistent and ungoverned. No terminology consistency across languages.
- **SMART KPI:** TMS operational with CI/CD integration → Baseline: absent → Target: configured and tested → Method: CI/CD pipeline verification → Horizon: Sprint 2 (after string externalization)

**Priority Matrix:**
- Impact: HIGH (foundational for any localization)
- Effort: MEDIUM (3 SP)
- Priority: **P2** — Depends on REC-L10N-001 completion and Phase 1 target market decisions
- Suggested sprint: Sprint 2

---

### Recommendations Self-Check
- [x] Every recommendation references specific findings (I18N_ISSUE, L10N_WORKFLOW_RISK, L10N_CULTURAL_RISK)
- [x] Every recommendation has SMART KPI
- [x] Priority matrix applied
- [x] Architecture changes tagged as `OUT_OF_SCOPE: TECH`
- [x] Dependencies documented (REC-L10N-004 depends on REC-L10N-001)

---

## Sprint Plan

### Assumptions
- `INSUFFICIENT_DATA:` Team capacity, sprint duration, and external translator availability are unknown. Assuming 2-week sprints based on Phase 2 convention.
- `INSUFFICIENT_DATA:` Target languages are undefined (no Phase 1 output). Sprint plan covers i18n ARCHITECTURE readiness only — actual translation work is out of scope until languages are defined.
- Story type `CODE` stories require developer implementation (`OUT_OF_SCOPE: TECH` — defined here, executed by Implementation Agent).
- Story type `CONTENT` stories can be executed by the Content/Localization team.
- Dependencies: i18n architecture (CODE) must be ready before translation workflow (CONTENT) can begin.

### Sprint 1: i18n Architecture Foundation (10 SP)

| Story ID | Title | Type | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|------|-----|----------|-------------|-------------------|
| SP-3-601 | Implement i18n string lookup function with ICU pluralization support | CODE | 3 | P1 | None | i18n function exists; supports key lookup, interpolation, and plural rules via Intl.PluralRules; English locale file loaded by default; automated test for plural forms |
| SP-3-602 | Extract all hardcoded HTML strings to locale resource file | CODE | 3 | P1 | SP-3-601 | All static HTML text (labels, buttons, headings, placeholders, ARIA labels) replaced with i18n function calls; en.json contains all extracted keys; visual regression test passes |
| SP-3-603 | Extract all hardcoded JS strings to locale resource file | CODE | 2 | P1 | SP-3-601 | All toast messages, template literal strings, and dynamic labels replaced with i18n function calls; pluralization uses Intl.PluralRules (not "(s)" suffix); automated lint rule rejects new hardcoded strings |
| SP-3-604 | Implement locale-aware date and number formatting | CODE | 2 | P1 | SP-3-601 | All date displays use Intl.DateTimeFormat; all number displays use Intl.NumberFormat; utility functions accept locale parameter; English formatting unchanged (backward compatible) |

### Sprint 2: RTL Readiness + Translation Workflow (6 SP)

| Story ID | Title | Type | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|------|-----|----------|-------------|-------------------|
| SP-3-605 | Migrate CSS to logical properties for RTL support | CODE | 3 | P2 | None (can run parallel with Sprint 1) | All physical CSS properties (margin-left, padding-left, text-align: left, right) replaced with logical equivalents; dir="ltr" added to <html>; visual regression test passes for LTR; manual RTL verification with dir="rtl" shows correct mirroring |
| SP-3-606 | Create domain terminology glossary for translation | CONTENT | 1 | P2 | Agent 32 Content Style Guide (SP-3-501) | Glossary document covers all domain terms identified in Agent 32 terminology audit; each term classified as translatable / non-translatable / contextual; glossary approved by product owner |
| SP-3-607 | Configure TMS and CI/CD integration | CODE | 2 | P2 | SP-3-602, SP-3-603 (locale files exist) | TMS connected to locale file repository; CI/CD pipeline includes locale file validation step; test translation round-trip (en.json → TMS → updated locale file) succeeds |

### Parallel Tracks
- **Track A (CODE — Sprint 1):** SP-3-601 → SP-3-602 + SP-3-603 (parallel after 601) → SP-3-604
- **Track B (CODE — Sprint 2):** SP-3-605 (independent — can start in Sprint 1 or 2)
- **Track C (CONTENT — Sprint 2):** SP-3-606 (depends on Agent 32 SP-3-501 Content Style Guide)
- **Track D (CODE — Sprint 2):** SP-3-607 (depends on Track A completion)

### Cross-Team Dependencies

| Dependency | From | To | Type |
|-----------|------|-----|------|
| String externalization architecture | REC-L10N-001 (this agent) | Implementation Agent (Phase 5) | BLOCKING — code change |
| Content Style Guide + terminology | Agent 32 REC-CNT-001 (SP-3-501) | SP-3-606 (glossary) | BLOCKING — content input |
| Locale files in CI/CD | SP-3-607 | DevOps Engineer (Phase 2 Agent 07) | DEPENDENT — pipeline change |
| Target language selection | Phase 1 Business output | REC-L10N-004 (TMS configuration) | BLOCKING — strategic decision |

---

## Guardrails

### G-L10N-001: No Hardcoded UI Strings in Source Code
- **Rule:** Must not commit new user-facing text strings directly in HTML or JavaScript source code. All translatable text must use the i18n key lookup function with keys defined in locale resource files.
- **Scope:** All developers contributing to `.github/webapp/index.html` or any future UI component files. Applies from the moment SP-3-601 (i18n function) is implemented.
- **Finding reference:** I18N_ISSUE: HARDCODED_STRING (4 CRITICAL instances), I18N_ISSUE: PLURALIZATION (HIGH)
- **Violation action:** PR blocked by automated lint rule. If lint rule not yet implemented: code reviewer must reject PR with mandatory revision.
- **Verification method:** Automated ESLint rule (custom or via `eslint-plugin-i18n-json`) scanning for string literals in render functions. Supplemented by CI check that compares used i18n keys against locale file keys (missing key = build failure).
- **Overlap check:** NEW — no existing guardrail covers this. Supplements G-CNT-AUDIT-002 (Agent 32: "New copy must conform to Style Guide") by adding the technical enforcement layer.

### G-L10N-002: Locale-Aware Formatting for All User-Facing Date and Number Values
- **Rule:** Must always use `Intl.DateTimeFormat` for date display and `Intl.NumberFormat` for number display. Raw date strings and unformatted numeric interpolation are prohibited in user-visible output.
- **Scope:** All render functions and toast messages displaying dates or numbers. Applies after SP-3-604 is implemented.
- **Finding reference:** I18N_ISSUE: LOCALE_FORMAT — DATE (HIGH), I18N_ISSUE: LOCALE_FORMAT — NUMBER (MEDIUM)
- **Violation action:** Code reviewer must reject PR. Automated check (lint rule or unit test) blocks merge.
- **Verification method:** Code review checklist item: "Are all date/number displays using Intl API?" Automated: grep for raw date/number display patterns in render functions.
- **Overlap check:** NEW — no existing guardrail covers formatting.

### G-L10N-003: CSS Logical Properties for New Layout Code
- **Rule:** Must not use physical CSS properties (`margin-left`, `margin-right`, `padding-left`, `padding-right`, `text-align: left/right`, `left`, `right`, `float: left/right`) in new or modified CSS. Must use CSS logical property equivalents (`margin-inline-start`, `padding-inline-start`, `text-align: start`, `inset-inline-start`, etc.).
- **Scope:** All CSS additions or modifications to the stylesheet. Applies after SP-3-605 is completed for existing code; applies IMMEDIATELY for any new CSS added.
- **Finding reference:** I18N_ISSUE: RTL_SUPPORT (HIGH)
- **Violation action:** Code reviewer must reject PR with specific property replacement guidance. Automated: Stylelint rule blocks merge.
- **Verification method:** Stylelint logical properties plugin (`stylelint-use-logical-properties-and-values` or custom rule). CI pipeline check.
- **Overlap check:** NEW — no existing guardrail covers CSS property direction. Supplements G-A11Y-004 (Agent 13: "CSS respects user preferences") by adding layout direction as a user preference dimension.

### Guardrails Self-Check
- [x] Every guardrail formulated as testable (all start with "Must not" or "Must always")
- [x] Every guardrail has a violation action (PR block, code reviewer rejection)
- [x] Every guardrail has a verification method (lint rules, CI checks, code review)
- [x] Every guardrail references an analysis finding (I18N_ISSUE IDs)
- [x] Overlap checked against existing guardrails (all NEW, supplements documented)

---

## QUESTIONNAIRE_REQUEST Items

The following items cannot be resolved from code analysis or documentation. They require client input and should be routed through the Questionnaire Agent.

| ID | Question | Context | Priority | Blocking |
|----|----------|---------|----------|----------|
| Q-L10N-001 | What are the target markets and languages for this application? (e.g., Netherlands/Dutch, Germany/German, France/French, global English only?) | Required to define language tier priorities (Tier 1/2/3) and translation approach. Without Phase 1 Business output, market strategy is undefined. | HIGH | Blocks REC-L10N-004 (TMS configuration) and actual translation work |
| Q-L10N-002 | Are there plans to support right-to-left (RTL) languages (Arabic, Hebrew)? If so, what is the timeline priority? | Determines whether CSS logical properties migration (REC-L10N-003) should be P1 or P2 | MEDIUM | Affects sprint prioritization of SP-3-605 |
| Q-L10N-003 | Is there budget for professional translation services, or will machine translation with post-editing be the approach? | Determines translation workflow design and TMS feature requirements | MEDIUM | Affects REC-L10N-004 scope |
| Q-L10N-004 | Who owns content and translation decisions — product team, engineering, or a dedicated localization function? | Required for governance model and workflow responsibility assignment | MEDIUM | Affects workflow design |

---

## HANDOFF CHECKLIST – Localization Specialist – Phase 3

- [x] MODE: AUDIT

--- AUDIT mode items ---
- [x] Locale coverage inventory complete (Step 1: English-only, no i18n mechanism)
- [x] i18n architecture audit complete (Step 2: 8 I18N_ISSUE items across 5 subcategories — all ABSENT/CRITICAL)
- [x] Cultural suitability check performed (Step 3: LOW overall risk, 1 L10N_CULTURAL_RISK for date format)
- [x] Translation workflow assessment complete (Step 4: ABSENT — 3 L10N_WORKFLOW_RISK items)
- [x] New market recommendations prepared per priority market (Step 5: 6 markets assessed, all BLOCKING on architecture)
- [x] All I18N_ISSUE, L10N_CULTURAL_RISK, L10N_WORKFLOW_RISK documented (8 + 1 + 3 = 12 findings total)
- [x] All cultural claims supplied with verifiable source (Aslam 2006, Madden et al. 2000, ISO 8601, CLDR)

--- Shared items ---
- [x] Phase 3 Closure: combined output of all 6 agents verified complete for Critic Agent (Step 6 table)
- [x] i18n findings consistent with Content Strategist and Software Architect output (Step 6 cross-checks)
- [x] Guardrails: all 3 guardrails are formulated testably
- [x] Guardrails: all 3 guardrails have violation action and verification method
- [x] Guardrails: all 3 guardrails reference an I18N_ISSUE analysis finding
- [x] All 4 deliverables present: Analysis ✅ Recommendations ✅ Sprint Plan ✅ Guardrails ✅
- [x] All UNCERTAIN: items documented and escalated (none — all findings are verifiable from source code)
- [x] All INSUFFICIENT_DATA: items documented and escalated (4 items: target markets, team capacity, translation budget, content ownership)
- [x] Output complies with contracts in /.github/docs/contracts/
- [x] All findings include a source reference (line numbers, file paths, Phase 2/3 agent references)
- [x] Questionnaire input check performed: NOT_INJECTED
- [x] All remaining INSUFFICIENT_DATA: items compiled as QUESTIONNAIRE_REQUEST list (4 items: Q-L10N-001 through Q-L10N-004)
- [x] Output complies with agent-handoff-contract.md

**HANDOFF STATUS: COMPLETE — Ready for Critic Agent (Agent 18) validation.**
