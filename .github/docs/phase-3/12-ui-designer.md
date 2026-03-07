# Analysis – UI Designer – 2026-03-07

## Metadata
- Agent: UI Designer (12)
- Phase: 3 – Experience Design
- Input received from: UX Researcher (10) + UX Designer (11)
- Date: 2026-03-07
- Software under analysis: Agentic System — Command Center (webapp)
- Mode: AUDIT

---

## Step 0: Questionnaire Input Check

**Status:** NOT_INJECTED — No `## QUESTIONNAIRE INPUT — UI Designer` block present. Proceeding normally.

---

## 1. Design System Foundation Audit (Step 1)

### 1.1 Formal Design System Presence

- **Formal design system:** ABSENT
- **Tool (Figma, Storybook, Zeroheight):** NONE
- **`CRITICAL_GAP: Design System missing`** (per G-UX-01)
- Source: File search for `figma`, `storybook`, `design-system`, `component-library` — no results. `.github/docs/brand/` directory not populated. `.github/docs/storybook/` directory not populated.

### 1.2 De Facto Design Token Layer

Despite no formal design system, the application HAS a comprehensive CSS custom property layer functioning as de facto design tokens:

**Color tokens (light theme):**
- `--bg`: #ffffff, `--bg-card`: #f8f9fa, `--bg-sidebar`: #f1f3f5
- `--text`: #1a1a2e, `--text-sec`: #4a4a68, `--text-muted`: #8888a0
- `--primary`: #4361ee, `--primary-hover`: #3a56d4, `--primary-light`: #eef1fd
- `--success`: #2d6a4f, `--success-light`: #d4edda
- `--warning`: #b45309, `--warning-light`: #fff3cd
- `--error`: #c62828, `--error-light`: #fde8e8
- `--border`: #dee2e6
- Source: `index.html:L11-40`

**Color tokens (dark theme):**
- `--bg`: #0f0f1a, `--bg-card`: #1a1a2e, `--bg-sidebar`: #16162a
- `--text`: #e0e0e8, `--text-sec`: #a0a0b8, `--text-muted`: #6868808
- `--primary`: #5e7ce2, `--primary-hover`: #7a9af0
- Additional semantic colors with dark-appropriate values
- Source: `index.html:L42-65`

**Spacing tokens:**
- Implicitly defined via hardcoded values: `4px`, `6px`, `8px`, `10px`, `12px`, `16px`, `20px`, `24px`, `32px`
- Not extracted as custom properties — spacing is inline throughout CSS
- Source: scattered across all CSS rules (L67-665)
- **GAP-UID-001:** Spacing values are not tokenized as custom properties

**Border radius tokens:**
- `--radius-sm`: 6px, `--radius`: 10px, `--radius-lg`: 14px
- Source: `index.html:L37-39`

**Shadow tokens:**
- Not tokenized — shadows are hardcoded: `box-shadow: 0 1px 4px rgba(0,0,0,.06)` (cards), `0 8px 32px` (modals)
- Source: `.card` L175, `.modal` L360
- **GAP-UID-002:** Shadow values not tokenized

**Motion tokens:**
- `transition: background .15s, color .15s` on buttons (L139)
- `transition: box-shadow .15s` on cards (L175)
- No formal token for duration or easing
- **GAP-UID-003:** Motion values not tokenized

### 1.3 Token Assessment Summary

| Token Category | Status | Coverage | Gap |
|---|---|---|---|
| Colors | ✅ Tokenized | 95% — comprehensive light/dark | Minor: some inline colors remain (e.g., `rgba()` shadows) |
| Typography | Partial | Font family tokenized; sizes/weights hardcoded | GAP-UID-004: Type scale not tokenized |
| Spacing | ❌ Not tokenized | 0% — all inline values | GAP-UID-001 |
| Border radius | ✅ Tokenized | 100% — 3-tier scale | — |
| Shadows | ❌ Not tokenized | 0% | GAP-UID-002 |
| Motion | ❌ Not tokenized | 0% | GAP-UID-003 |
| Z-index | ❌ Not tokenized | Inline: `z-index: 10050` (modals), `10000` (header) | GAP-UID-005 |

---

## 2. Visual Consistency Audit (Step 2)

### 2.1 Color Palette Consistency

| Aspect | Rating | Finding | Source |
|--------|--------|---------|--------|
| Primary color usage | Consistent | `--primary` used for all buttons, links, active states, tab indicators | `.btn` L139, `.tab[aria-selected]` L249, `.sb-item.active` L200 |
| Semantic colors | Consistent | Green=success, amber=warning, red=error, blue=info — used uniformly in badges, toasts, pipeline | `.badge` L277-297, `.toast` L385-395 |
| Text hierarchy | Consistent | `--text` for primary, `--text-sec` for secondary, `--text-muted` for tertiary | Throughout all components |
| Dark mode coverage | Good | All color tokens have dark mode equivalents; no hardcoded colors that break in dark mode | `[data-theme="dark"]` block L42-65 |
| Deviations | Minor | (1) Inline `background: var(--success-light)` with inline `border` in command success box (L1900-1902) — not using a component class. (2) Some `rgba()` shadows don't have dark mode variants. | L1900, shadows passim |

### 2.2 Typography Consistency

| Aspect | Rating | Finding | Source |
|--------|--------|---------|--------|
| Font family | Consistent | Body: `Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`. Monospace: `'SF Mono', 'Cascadia Code', Consolas, monospace`. Applied globally via CSS. | L78-79 |
| Font sizes | Mostly consistent | Base: 14px. Headings: 18px (sidebar title), 16px (card title), 14px (body), 13px (secondary), 12px (badges). Scale: 12/13/14/16/18 — reasonable but not a formal type scale (no modular ratio). | Various `.card` L175, `.sidebar` L190, sizes scattered |
| Font weights | Consistent | 400 (body), 600 (headings, buttons, badges), 700 (title, strong). Used uniformly. | L79-80, `.btn` L140 |
| Line heights | Minor gap | Body: 1.55. Cards and some elements don't specify — inheriting globally. Mostly fine but headings could benefit from tighter line heights for larger sizes. | L80, global inherit |
| Deviations | Minor | (1) Some inline `font-size` via `style=` attribute: command success box (L1900-1904). (2) Help panel markdown rendering inherits base styles without overrides for headings. | L1900, markdown rendering L2040-2070 |

### 2.3 Spacing & Grid Consistency

| Aspect | Rating | Finding | Source |
|--------|--------|---------|--------|
| Spacing scale | Inconsistent | Mix of values: 4px, 6px, 8px, 10px, 12px, 14px, 16px, 20px, 24px, 32px, 40px. Not a strict 4px/8px system — 6px, 10px, 14px break the pattern. | Throughout CSS L67-665 |
| Card padding | Consistent | Cards use 20px padding uniformly. | `.card` L175 |
| Gap usage | Mostly consistent | Flex gaps: 12px, 16px used commonly. Grid gap in decision cards: not specified. | `.card-list` L180 uses `gap: 16px` |
| Section spacing | Consistent | `margin-bottom: 16px` for sections, `24px` for larger gaps. | Various |
| Deviations | Medium | (1) Sidebar items use `padding: 10px 14px` — 14px is non-standard in any scale. (2) Filter bar items use `8px` gap while card lists use `16px` — inconsistent horizontal rhythm. | `.sb-item` L195, filter bar L305 |

### 2.4 Component Uniformity

| Component | Status | Finding | Source |
|-----------|--------|---------|--------|
| Buttons | Consistent | Primary (`.btn .b-primary`), save (`.b-save`), danger (`.b-danger`), small (`.btn-sm`). Uniform border-radius, padding, font-weight. | L139-175 |
| Cards | Consistent | Uniform card class with border, radius, padding, shadow. Used across questionnaires, decisions. | L175-188 |
| Badges | Consistent | Status badges (`.b-open`, `.b-answered`, `.b-deferred`, `.b-expired`, `.b-decided`) with semantic colors. | L277-297 |
| Modals | Consistent | Uniform overlay, modal container, header, body, footer pattern. Backdrop blur applied. | L350-380 |
| Toasts | Consistent | Positioned fixed bottom-right, 3 types (`.t-ok`, `.t-err`, `.t-info`), auto-dismiss. | L385-400 |
| Inputs | Mostly consistent | Textarea styling (`.card textarea`) is defined. Other inputs (`.modal input, .modal select`) share styling. Minor: command form inputs may not inherit all styles. | L205-215 (textarea), L370 (modal inputs) |
| Progress bars | Consistent | Pipeline progress bars with `--primary` fill, rounded, same height. | L410-440 (pipeline styles) |

---

## 3. Visual Hierarchy Analysis (Step 3)

### 3.1 Command Center Tab

| Aspect | Assessment | Evidence |
|--------|-----------|----------|
| Primary CTA | Clear — "Launch Command" button is visually prominent (primary color, larger padding) | `buildForm()` generates primary button |
| Information hierarchy | Good — sidebar for navigation, main for content. Clear separation. | Layout CSS L95-130 |
| Competing elements | Minor — header has 6 action buttons that compete for attention on smaller screens. At 1200px+ this is manageable. | Header L671-690, responsive L610-640 |
| Scanning pattern | Left-to-right: sidebar (commands) → main (form/pipeline). Standard F-pattern. | Layout structure |

### 3.2 Questionnaires Tab

| Aspect | Assessment | Evidence |
|--------|-----------|----------|
| Primary CTA | Per card: "Save" button (green) draws attention. "Save All" in header is secondary (outline style). | Card save button L1270, header save L677 |
| Information hierarchy | Good — sidebar anchors orientation (which questionnaire), main shows card sequence. | Layout pattern consistent |
| Competing elements | Medium — when many open questions have prominent green badges + yellow dirty indicators, visual noise increases. | Badge count with many open items |
| Scanning pattern | Top-to-bottom card scan. Question text → textarea → status + save. Clear Z-pattern per card. | Card layout `renderQ()` |

### 3.3 Decisions Tab

| Aspect | Assessment | Evidence |
|--------|-----------|----------|
| Primary CTA | Contextual per card — action buttons (Decide, Defer, Answer) are semantically colored. "Decide & Close" (green) is most prominent. | Decision card rendering L1370 |
| Information hierarchy | Good — filter bar → card list. Priority badges provide quick scanning. | Filter bar + cards |
| Competing elements | Minor — multiple action buttons per card (up to 4) can be visually busy. | Card action zone |
| Scanning pattern | Filter bar (set context) → scan cards by priority badge → dive into card. | Layout |

---

## 4. Typography & Color Analysis (Step 4)

### 4.1 Typography Analysis

| Metric | Value | Assessment |
|--------|-------|-----------|
| Base font size | 14px | Slightly below WCAG recommendation of 16px for body text. `ACCESSIBILITY_FLAG:` Forward to Agent 13. |
| Minimum font size | 11px (badge text, some timestamps) | Below recommended minimum of 12px. `ACCESSIBILITY_FLAG:` |
| Font family | Inter + system fallbacks | Excellent readability — Inter designed for screen use. |
| Type scale ratio | ~1.14 (12→13→14→16→18) | Not a standard modular scale. Close enough for current scope but lacks formal structure. |
| Max line length | ~800px (main area without sidebar) | Could exceed 75ch on wide screens — above optimal 66ch for readability. |
| Contrast (body text on light bg) | #1a1a2e on #ffffff = 15.7:1 | Excellent — exceeds WCAG AAA. |
| Contrast (secondary text) | #4a4a68 on #ffffff = 7.8:1 | Good — exceeds WCAG AA (4.5:1). |
| Contrast (muted text) | #8888a0 on #ffffff = 3.5:1 | Below WCAG AA for normal text (4.5:1). `ACCESSIBILITY_FLAG:` Forward to Agent 13. |

### 4.2 Color Analysis

| Aspect | Assessment | Evidence |
|--------|-----------|----------|
| Brand alignment | `INSUFFICIENT_DATA:` — No brand guidelines exist yet (Phase 4 pending). | `.github/docs/brand/` unpopulated |
| Semantic consistency | Consistent — green=success, amber=warning, red=error, blue=primary/info. | Token definitions + usage throughout |
| Status colors | Consistent — open (green), answered (blue), deferred (amber), decided (teal), expired (red). Decision-specific palette is clear and distinguishable. | Badge CSS L277-297 |
| Contrast compliance | Mostly AA — 2 flags forwarded to Accessibility Specialist: muted text (3.5:1), small badge text contrast. | See §4.1 |
| Color blindness | `UNCERTAIN:` Semantic colors rely on hue differentiation (green/amber/red). Users with red-green color blindness may have difficulty distinguishing open (green) from error (red) states. Need pattern/icon reinforcement. | Badge colors L277-297 |

---

## 5. Component Library Assessment (Step 5)

### 5.1 Current Component Inventory

| Component | Present | Documentation | Variants | Reusable |
|-----------|---------|--------------|----------|----------|
| Button (`.btn`) | ✅ | None | 5 (primary, save, danger, small, disabled) | Yes — CSS class-based |
| Card (`.card`) | ✅ | None | 1 (standard) | Yes — generic container |
| Badge (`.badge`) | ✅ | None | 6 (open, answered, deferred, decided, expired, priority) | Yes — CSS class-based |
| Modal (`.modal-overlay`) | ✅ | None | 5 instances | Partially — structure is consistent but each modal has custom content |
| Toast (`.toast`) | ✅ | None | 3 (ok, error, info) | Yes — `toast()` JS function |
| Sidebar Item (`.sb-item`) | ✅ | None | 2 (default, active) | Yes — CSS class-based |
| Tab (`.tab`) | ✅ | None | 2 (default, selected) | Yes — ARIA tab pattern |
| Progress Bar | ✅ | None | 1 (pipeline) | Partially — HTML generated in `renderPipeline()` |
| Input/Textarea | ✅ | None | 2 (default, focused) | Yes — CSS styled |
| Filter Bar | ✅ | None | 1 | No — inline HTML in decisions tab |

### 5.2 Missing Components (compared to standard UI kit)

| Component | Needed | Context |
|-----------|--------|---------|
| Icon system | Yes | Currently using emoji — inconsistent cross-platform rendering |
| Tooltip | Yes | Multiple elements need contextual help (Agent 11 findings) |
| Loading skeleton | Yes | No loading states for async content |
| Empty state | Yes | No designed empty states (just text) |
| Alert/Banner | Yes | Agent 11 REC-UXD-001 requires persistent error banner |
| Breadcrumb | No | 2-level navigation doesn't require breadcrumbs |
| Pagination | Maybe | For large questionnaire lists (future scaling) |

### 5.3 Outdated / Problematic Components

- **Emoji icons:** Not a component pattern — literal Unicode/HTML entities used throughout. Cross-platform rendering varies. `ACCESSIBILITY_FLAG:` — forward to Agent 13 for screen reader evaluation.
- **`document.execCommand('copy')` fallback:** Deprecated API used as clipboard fallback. Source: `copyClipboard()` L1948-1955. Not a visual component but indicates technical debt.

---

## 6. Self-Check

- [x] Design system presence assessed — ABSENT (CRITICAL_GAP documented)
- [x] De facto token layer fully inventoried (colors ✅, typography partial, spacing ❌, radius ✅, shadows ❌, motion ❌, z-index ❌)
- [x] Visual consistency audit per category (colors, typography, spacing, components)
- [x] Visual hierarchy assessed per primary tab
- [x] Typography analysis with contrast ratios and accessibility flags
- [x] Color analysis with semantic consistency and color blindness note
- [x] Component library inventory with missing components identified
- [x] All ACCESSIBILITY_FLAG items documented for Agent 13
- [x] All findings have source references to index.html line numbers

---

# Recommendations – UI Designer – 2026-03-07

## Metadata
- Agent: UI Designer (12)
- Phase: 3
- Based on analysis: Design system audit + visual consistency + component inventory
- Date: 2026-03-07
- Mode: AUDIT

---

## Recommendation REC-UID-001

### Problem
No formal design system exists. CSS custom properties serve as de facto tokens but spacing, shadows, motion, and z-index are not tokenized. This leads to inconsistent spacing values (6px, 10px, 14px breaking the 4px/8px scale) and unmaintainable visual definitions.
**Analysis reference:** CRITICAL_GAP (G-UX-01), GAP-UID-001, GAP-UID-002, GAP-UID-003, GAP-UID-005

### Solution
Establish a formal design token system by extracting and normalizing existing CSS values into custom properties:
1. **Spacing tokens:** Define a 4px-base spacing scale: `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 20px`, `--space-6: 24px`, `--space-8: 32px`, `--space-10: 40px`. Replace all inline spacing values.
2. **Shadow tokens:** Define `--shadow-sm`, `--shadow-md`, `--shadow-lg` matching current values.
3. **Motion tokens:** Define `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--easing-default: ease`.
4. **Z-index tokens:** Define `--z-dropdown: 1000`, `--z-header: 10000`, `--z-modal: 10050`.
5. **Type scale tokens:** Define `--text-xs: 11px`, `--text-sm: 12px`, `--text-base: 14px`, `--text-md: 16px`, `--text-lg: 18px`.
6. Export as `design-tokens.json` for `.github/docs/brand/`.

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | High — prevents visual inconsistency and regression | Tokenization enables automated consistency checking |
| Cost | Medium — 5 SP | Systematic refactoring of ~665 lines of CSS |
| UX | Medium — consistent spacing and motion improve perceived quality | Addresses 5 token gaps |

### Dependencies
- Blocked by: NONE
- Phase 4 Brand Strategist will refine color values (current values remain valid)

### Risk of Not Implementing
Visual inconsistency grows with each new feature. Spacing deviations accumulate. New contributors introduce their own magic numbers. Dark mode may break as values are added ad-hoc.

### Measurement Criterion
- KPI: Token coverage (% of CSS values using custom properties)
- Baseline: ~40% (colors + radius tokenized; spacing/shadows/motion/z-index are not)
- Target: ≥ 90% token coverage
- Measurement method: CSS lint rule counting `var(--` vs hardcoded values
- Time horizon: Sprint 1

---

## Recommendation REC-UID-002

### Problem
Emoji-based icons render inconsistently across platforms (Windows, macOS, Linux) and are problematic for accessibility. No icon system provides consistent visual language.
**Analysis reference:** Component assessment §5.3, Agent 10 GAP-UXR-005

### Solution
Replace emoji icons with an SVG icon system:
1. Create a small SVG icon sprite (inline `<svg>` definitions or external sprite sheet) for: save, reevaluate, help, export, theme, copy, close, arrow, check, warning, error, info, plus, edit, filter.
2. Use `<svg>` elements with `role="img"` and `aria-label` for accessibility.
3. Define icon sizing tokens (`--icon-sm: 16px`, `--icon-md: 20px`, `--icon-lg: 24px`) tied to the spacing scale.
4. Icons inherit current text color via `currentColor` for automatic theme support.

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Medium — consistent rendering; accessibility compliance | Eliminates cross-platform emoji variance |
| Cost | Medium — 3 SP | SVG creation + replacement across ~15 emoji usage points |
| UX | Medium — professional, accessible, consistent icons | Visual quality improvement |

### Dependencies
- `DEPENDENT_ON: Accessibility Specialist` — Agent 13 to validate ARIA attributes on SVG icons
- Blocked by: NONE

### Risk of Not Implementing
Emojis continue to render differently per OS; screen readers announce Unicode code points or nothing; professional appearance is compromised.

### Measurement Criterion
- KPI: Emoji icon count remaining in codebase
- Baseline: ~15 emoji usage points
- Target: 0 emoji icons (100% SVG replacement)
- Measurement method: grep for `&#\d+;` patterns in index.html
- Time horizon: Sprint 2

---

## Recommendation REC-UID-003

### Problem
Muted text color (`--text-muted: #8888a0`) has contrast ratio 3.5:1 against white background — below WCAG AA requirement of 4.5:1 for normal text.
**Analysis reference:** Typography & Color Analysis §4.1, ACCESSIBILITY_FLAG

### Solution
Adjust `--text-muted` to achieve WCAG AA compliance:
1. Light theme: Change `--text-muted` from `#8888a0` to `#6d6d85` (contrast ratio ~5.1:1).
2. Dark theme: Verify `--text-muted` dark value (#686880) against `--bg` dark (#0f0f1a) — if below 4.5:1, adjust similarly.
3. Document contrast ratios in `design-tokens.json` for future validation.

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | High — WCAG AA compliance for all text | Legal/accessibility compliance |
| Cost | Low — 1 SP | Single CSS variable change + verification |
| UX | Low — subtle color shift, improved readability for low-vision users | Accessibility improvement |

### Dependencies
- `OUT_OF_SCOPE: Accessibility Specialist` — Full contrast audit delegated to Agent 13
- Blocked by: NONE

### Risk of Not Implementing
WCAG AA violation — muted text unreadable for users with low vision or in bright environments.

### Measurement Criterion
- KPI: Minimum contrast ratio across all text tokens
- Baseline: 3.5:1 (muted text)
- Target: ≥ 4.5:1 for all text (WCAG AA)
- Measurement method: Automated contrast ratio checker on token values
- Time horizon: Sprint 1

---

## Recommendation REC-UID-004

### Problem
No loading state components exist. Async operations show no visual feedback during fetch. Empty states are plain text without visual design.
**Analysis reference:** Component assessment §5.2 (missing: loading skeleton, empty state)

### Solution
Define and implement 3 state components:
1. **Loading skeleton:** CSS-only pulsing placeholder cards matching card dimensions. Applied during initial `load()` and questionnaire switching.
2. **Empty state:** Centered illustration-free component with icon, title, description, and optional CTA button. Used for: no questionnaires selected, no decisions found (after filter), no pipeline data.
3. **Inline spinner:** Small rotating spinner for individual save/action buttons during async operations.

### Impact
| Dimension | Expected effect | Rationale |
|---|---|---|
| Revenue | INSUFFICIENT_DATA: | Internal tool |
| Risk Reduction | Low | Quality-of-life improvement |
| Cost | Low — 2 SP | Pure CSS skeletons + minor JS integration |
| UX | Medium — eliminates "blank screen" moments during loading | Perceived performance improvement |

### Dependencies
- Blocked by: NONE

### Risk of Not Implementing
Users see blank screens during loading, causing confusion about whether the system is working.

### Measurement Criterion
- KPI: Blank-screen duration (time between user action and visual feedback)
- Baseline: Variable (full page blank during initial load)
- Target: ≤ 100ms to first visual feedback (skeleton appears)
- Measurement method: Performance timing (paint events)
- Time horizon: Sprint 2

---

## PRIORITY MATRIX

| Recommendation ID | Impact | Effort | Priority | Sprint | Rationale |
|---|---|---|---|---|---|
| REC-UID-001 | High | Medium | P1 | Sprint 1 | Addresses CRITICAL_GAP, enables all future UI consistency |
| REC-UID-003 | High | Low | P1 | Sprint 1 | Quick win — WCAG compliance fix |
| REC-UID-002 | Medium | Medium | P2 | Sprint 2 | Strategic — icon system for professionalism + accessibility |
| REC-UID-004 | Medium | Low | P2 | Sprint 2 | Quick win — perceived performance |

---

# Sprint Plan – UI Designer – 2026-03-07

## Metadata
- Agent: UI Designer (12)
- Phase: 3
- Based on recommendations: REC-UID-001 through REC-UID-004
- Date: 2026-03-07
- Total scope: 2 sprints
- Mode: AUDIT

## Assumptions
- Team composition: `INSUFFICIENT_DATA:` — Reusing Agent 10 assumption pending QUE-UXR-TEAM-001
  - Team UX-Dev: 1 full-stack developer — capacity: 10 SP/sprint (assumed)
- Sprint duration: 2 weeks
- Technology stack: Vanilla CSS/HTML/JS — all changes in `index.html`
- Prerequisites: None — Sprint 1 can start immediately

---

## Sprint 1 – Token Foundation & Contrast Fix

### Goal
Establish a complete design token system and fix the WCAG contrast violation, enabling consistent UI development going forward.

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | SP | Dependencies | Blocker | Rec |
|---|---|---|---|---|---|---|---|---|
| SP-UID-1-001 | As a developer I want spacing tokens as CSS custom properties so that all spacing is consistent | CODE | UX-Dev | Given the CSS file, when I search for padding/margin/gap values, then ≥80% use `var(--space-N)` tokens from a defined 4px-base scale | 2 | NONE | NONE | REC-UID-001 |
| SP-UID-1-002 | As a developer I want shadow tokens so that elevation is consistent | CODE | UX-Dev | Given card, modal, and dropdown elements, when I inspect their shadows, then all use `var(--shadow-sm/md/lg)` tokens | 1 | NONE | NONE | REC-UID-001 |
| SP-UID-1-003 | As a developer I want motion and z-index tokens so that transitions and layering are predictable | CODE | UX-Dev | Given transition and z-index values, when I inspect the CSS, then all use `var(--duration-*)`, `var(--easing-*)`, `var(--z-*)` tokens | 1 | NONE | NONE | REC-UID-001 |
| SP-UID-1-004 | As a developer I want a design-tokens.json export so that the token system is documented | DESIGN | UX-Dev | Given the token system is defined, when I open `.github/docs/brand/design-tokens.json`, then it contains all color, spacing, typography, shadow, motion, z-index tokens in structured JSON | 1 | SP-UID-1-001, SP-UID-1-002, SP-UID-1-003 | NONE | REC-UID-001 |
| SP-UID-1-005 | As a low-vision user I want muted text to meet WCAG AA contrast so that I can read all text | CODE | UX-Dev | Given `--text-muted` in light theme, when I check contrast against `--bg`, then the ratio is ≥ 4.5:1; same for dark theme | 1 | NONE | NONE | REC-UID-003 |

### Parallel Tracks

| Track | Type | Stories | Team(s) | Start condition |
|---|---|---|---|---|
| Track 1 (Tokenization) | CODE | SP-UID-1-001, SP-UID-1-002, SP-UID-1-003 | UX-Dev | Sprint 1 start (parallel, no dependencies) |
| Track 2 (Export) | DESIGN | SP-UID-1-004 | UX-Dev | After Track 1 completes |
| Track 3 (Contrast fix) | CODE | SP-UID-1-005 | UX-Dev | Sprint 1 start (independent) |

### Blocker Register
No blockers for Sprint 1.

### Sprint 1 Goal & Definition of Done
- **Outcome:** A complete, documented token system; all text meets WCAG AA contrast.
- **KPI targets:** ≥ 80% inline CSS values replaced with tokens; muted text contrast ≥ 4.5:1.
- **Definition of Done:** All 5 stories complete, `design-tokens.json` present, contrast verified.

---

## Sprint 2 – Icon System & State Components

### Goal
Replace emoji icons with accessible SVG system; add loading and empty state components for perceived performance.

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | SP | Dependencies | Blocker | Rec |
|---|---|---|---|---|---|---|---|---|
| SP-UID-2-001 | As a user I want consistent SVG icons so that the UI looks professional on all platforms | CODE | UX-Dev | Given any icon in the UI, when rendered on Windows/macOS/Linux, then it appears identical (SVG, not emoji); given a screen reader, then each icon has an `aria-label` | 3 | NONE | NONE | REC-UID-002 |
| SP-UID-2-002 | As a user I want loading skeletons so that I see immediate visual feedback during data loading | CODE | UX-Dev | Given a data fetch is in progress, when the main area renders, then pulsing placeholder cards appear matching card dimensions; given data arrives, then skeletons are replaced | 1 | NONE | NONE | REC-UID-004 |
| SP-UID-2-003 | As a user I want designed empty states so that I understand what to do when no data is available | CODE | UX-Dev | Given no questionnaire is selected, when I view the main area, then an empty state with icon + title + description is shown; same for empty decision filter results and no pipeline data | 1 | NONE | NONE | REC-UID-004 |

### Parallel Tracks

| Track | Type | Stories | Team(s) | Start condition |
|---|---|---|---|---|
| Track 1 (Icons) | CODE | SP-UID-2-001 | UX-Dev | Sprint 2 start |
| Track 2 (States) | CODE | SP-UID-2-002, SP-UID-2-003 | UX-Dev | Sprint 2 start |

### Blocker Register
No blockers for Sprint 2.

### Sprint 2 Goal & Definition of Done
- **Outcome:** Consistent, accessible icons; no blank screens during loading or empty states.
- **KPI targets:** 0 emoji icons remaining; skeleton shown within 100ms of data request.
- **Definition of Done:** All 3 stories complete, code reviewed, no emoji HTML entities in index.html.

---

## Traceability: Recommendations → Stories

| Recommendation | Priority | Stories | Covered |
|---|---|---|---|
| REC-UID-001 (Token system) | P1 | SP-UID-1-001, SP-UID-1-002, SP-UID-1-003, SP-UID-1-004 | ✅ |
| REC-UID-002 (SVG icons) | P2 | SP-UID-2-001 | ✅ |
| REC-UID-003 (Contrast fix) | P1 | SP-UID-1-005 | ✅ |
| REC-UID-004 (State components) | P2 | SP-UID-2-002, SP-UID-2-003 | ✅ |

**No P1 recommendation without a story. ✅**

---

# Guardrails – UI Designer – 2026-03-07

## Metadata
- Agent: UI Designer (12)
- Phase: 3
- Date: 2026-03-07
- Mode: AUDIT

---

## Guardrail G-UID-001

### Title
All Spacing, Shadow, Motion, and Z-Index Values Must Use Design Tokens

### Scope
- Applies to: Implementation Agent (all frontend stories), UI Designer
- Time horizon: Permanent (from Sprint 1 completion)

### Rule
Every CSS `padding`, `margin`, `gap`, `box-shadow`, `transition-duration`, `animation-duration`, and `z-index` value MUST use a `var(--*)` token. Hardcoded pixel values for these properties are PROHIBITED in new code.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UID-001`, block PR merge, developer must replace with token reference.

### Rationale
GAP-UID-001 through GAP-UID-005 — 5 categories of untokenized values lead to inconsistency and maintenance burden.

### Verification Method
Automated: CSS lint rule or grep checking `padding:|margin:|gap:|box-shadow:|z-index:` for non-`var(` values. Manual: code review checklist.

### Overlap Check
Addition to G-UX-01 (Design system mandatory). This guardrail operationalizes the token system.

---

## Guardrail G-UID-002

### Title
All Text Colors Must Meet WCAG AA Contrast (4.5:1 Minimum)

### Scope
- Applies to: UI Designer, Implementation Agent (theme-related stories)
- Time horizon: Permanent

### Rule
Every text color token MUST have a documented contrast ratio against its expected background. Minimum: 4.5:1 for normal text (≥ 14px), 3:1 for large text (≥ 18px bold or ≥ 24px). New color tokens MUST include contrast verification.

### Violation Action
Mark as `GUARDRAIL_VIOLATION: G-UID-002` + `ACCESSIBILITY_FLAG`, block PR merge.

### Rationale
GAP-UID: `--text-muted` at 3.5:1 fails WCAG AA. Prevents future token additions from introducing similar violations.

### Verification Method
Automated: contrast ratio checker run against `design-tokens.json` color pairs. Manual: browser devtools accessibility audit during sprint review.

### Overlap Check
New — complements G-UX-06 (WCAG compliance level documentation) from UX guardrails.

---

## Guardrail Overview

| ID | Title | Scope | Priority | Verification |
|---|---|---|---|---|
| G-UID-001 | Design Tokens for All Layout Values | Implementation, UI Designer | High | CSS lint + code review |
| G-UID-002 | WCAG AA Contrast for All Text | UI Designer, Implementation | Critical | Automated contrast checker |

---

## QUESTIONNAIRE_REQUEST Items

| ID | Context | Requested For |
|---|---|---|
| QUE-UID-BRAND-001 | Are there existing brand guidelines, color preferences, or logo assets to inform the design system? | Token color values (currently using defaults) |
| QUE-UID-ICONS-001 | Is there a preferred icon style (outlined, filled, rounded) for the SVG icon replacements? | REC-UID-002 implementation |

---

## HANDOFF CHECKLIST — UI Designer (12)

- [x] MODE: AUDIT
- [x] Design system presence assessed — ABSENT (CRITICAL_GAP documented)
- [x] De facto token layer inventoried (6 categories, coverage documented)
- [x] Visual consistency audit complete (colors, typography, spacing, components)
- [x] Visual hierarchy assessed per primary tab (3 tabs)
- [x] Typography + color analysis with contrast ratios and ACCESSIBILITY_FLAGs
- [x] Component library inventory with missing components identified
- [x] Design debt implicitly covered in recommendations (token system = systematic fix)
- [x] All claims based on actual CSS/HTML analysis with line number references
- [x] Self-check performed
- [x] Recommendations: every recommendation references GAP/finding
- [x] Recommendations: all impact fields filled or marked INSUFFICIENT_DATA:
- [x] Recommendations: all measurement criteria are SMART
- [x] Sprint Plan: assumptions documented
- [x] Sprint Plan: all stories have ≥ 1 acceptance criterion
- [x] Sprint Plan: all P1/P2 recommendations have ≥ 1 story (traceability ✅)
- [x] Guardrails: testably formulated, violation action, verification method, GAP reference
- [x] All 4 deliverables present: Analysis ✓ Recommendations ✓ Sprint Plan ✓ Guardrails ✓
- [x] Questionnaire input check: NOT_INJECTED documented
- [x] ACCESSIBILITY_FLAG items forwarded to Agent 13 (3 flags: base font 14px, min font 11px, muted contrast)
- **STATUS: READY FOR HANDOFF TO AGENT 13 (Accessibility Specialist)**
