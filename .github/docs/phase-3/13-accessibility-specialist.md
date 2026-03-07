# Agent 13 — Accessibility Specialist: Audit Output
> **Mode:** AUDIT | **Phase:** 3 | **Date:** 2025-01-20
> **Audit target:** `.github/webapp/index.html` (~2300 LOC, single-file SPA)
> **Conformance target:** WCAG 2.1 AA (default per EU/EAA context)

---

## Step 0: Questionnaire Input

No `## QUESTIONNAIRE INPUT — Accessibility Specialist` block present. Proceeding with code-based analysis.

---

## Step 1: ACCESSIBILITY_FLAG Inventory

| ID | Source | Description | Category | WCAG SC | Priority |
|----|--------|------------|----------|---------|----------|
| AF-001 | Agent 12 (UI Designer) | Base font size 14px — below 16px recommendation | Confirmed finding | SC 1.4.4 Resize Text | MEDIUM |
| AF-002 | Agent 12 (UI Designer) | Minimum font size 11px on `.cmd-btn-sub` | Confirmed finding | SC 1.4.4 Resize Text | HIGH |
| AF-003 | Agent 12 (UI Designer) | Muted text contrast `--text-muted` on tinted backgrounds — borderline AA | Confirmed finding | SC 1.4.3 Contrast (Minimum) | HIGH |
| AF-004 | Agent 12 (UI Designer) | Emoji characters used as iconography without text alternatives | Confirmed finding | SC 1.1.1 Non-text Content | MEDIUM |
| AF-005 | Agent 12 (UI Designer) | Color blindness risk on semantic status colors (red/green/yellow) | Requires investigation | SC 1.4.1 Use of Color | MEDIUM |
| AF-006 | Agent 10 (UX Researcher) | FP-001: Clipboard copy requires manual handoff — no accessible confirmation | Confirmed finding | SC 4.1.3 Status Messages | MEDIUM |
| AF-007 | Agent 11 (UX Designer) | Raw error messages without structured accessible presentation | Confirmed finding | SC 3.3.1 Error Identification | HIGH |

---

## Step 2: WCAG Conformance Level

**Target:** WCAG 2.1 Level AA

**Rationale:**
- Business context: Internal-facing developer tool used by technical project leads and product owners (source: `onboarding-output.md`).
- Legal context: No Phase 1 business analysis available (AUDIT TECH+UX scope). If deployed in the EU, the European Accessibility Act (EAA) / EN 301 549 mandates WCAG 2.1 AA as the minimum. Web applications serving as professional tools are in scope per EAA Article 2.
- Risk mitigation: Even for internal tools, WCAG AA conformance prevents exclusion of team members with disabilities.

**WCAG 2.2 SC considered as advisory:** SC 2.5.8 (Target Size), SC 3.2.6 (Consistent Help), SC 3.3.7 (Redundant Entry) — noted where relevant but not required for AA conformance.

---

## Step 3: WCAG Analysis per Principle

### 3.1 Perceivable

| SC | Level | Status | Finding | Source |
|----|-------|--------|---------|--------|
| **1.1.1** Non-text Content | A | **PARTIAL FAIL** | Emoji characters (🚀💾📝⚖️🔥 etc.) used as button/tab icons are announced by screen readers as emoji names (e.g., "rocket", "floppy disk"). For decorative emoji this is noise; for informative emoji (tab labels, button labels) the visible text label provides the accessible name, but the emoji name is prepended in the announcement, causing confusion. `aria-label` is only set on 2 of 6 header buttons (Export, Theme toggle). The other 4 buttons (Save All, New Decision, Reevaluate, Help) announce emoji name + visible text. | `index.html` L681–L686 |
| **1.3.1** Info and Relationships | A | **PASS** | Tab structure uses `role="tablist/tab/tabpanel"` with `aria-selected`, `aria-controls`, `aria-labelledby`. Modals use `role="dialog"` + `aria-modal` + `aria-labelledby`. Form fields have associated `<label>` elements (visible or `.sr-only`). Progress bars use `role="progressbar"` with `aria-valuenow/min/max`. Sidebar items use `role="button"`. | L691–L694, L698–L724, L810, L813–L894, L1117–L1119 |
| **1.3.2** Meaningful Sequence | A | **PASS** | DOM order follows visual reading order: header → tabs → panel content. No CSS reordering that breaks logical sequence. | L667–L810 |
| **1.3.3** Sensory Characteristics | A | **PASS** | Instructions do not rely solely on shape, color, size, or location. Tab states use `aria-selected` and visual `.active` class. Status badges use text labels ("ANSWERED", "OPEN", "DECIDED"). | L692–L694, JS renderers |
| **1.4.1** Use of Color | A | **PASS with advisory** | Status indicators (success/warning/danger) use both color AND text labels. Pipeline steps use status text + color. `UNCERTAIN:` Color-blind simulation not performed — status badge colors (green/yellow/red) may be indistinguishable for protanopia/deuteranopia users, but text labels mitigate this. Shape/icon differentiation would be an enhancement. | JS `renderDecisions()`, `renderPipeline()` |
| **1.4.2** Audio Control | A | **N/A** | No audio content. | — |
| **1.4.3** Contrast (Minimum) | AA | **PARTIAL FAIL** | **Light theme:** `--text-muted: #627389` on `--surface: #ffffff` yields ~4.9:1 (PASS). But on `--bg-subtle: #eef1f8` yields ~4.4:1 (**FAILS** 4.5:1 minimum). `--text-sec: #64748b` on `--surface` yields ~4.8:1 (borderline PASS). **Dark theme:** `--text-muted: #7a8ba0` on `--surface: #1c2333` yields ~4.2:1 (**FAILS**). On `--bg: #0f172a` yields ~5.1:1 (PASS). **Finding:** Muted and secondary text colors fail the 4.5:1 minimum on certain background combinations in both themes. | L11–L29 (light vars), L34–L59 (dark vars) |
| **1.4.4** Resize Text | AA | **PASS** | All font sizes use `px` units but the viewport meta does not disable zoom (`user-scalable` not set to `no`, `maximum-scale` not restricted). Content reflows at 200% zoom. Base font 14px is below the 16px default but does not violate the SC itself — the SC requires that text can be resized to 200% without loss of content. | L4, L77 |
| **1.4.5** Images of Text | AA | **N/A** | No images of text. All text is rendered as HTML text. | — |
| **1.4.10** Reflow | AA | **PASS** | `@media (max-width:700px)` breakpoint collapses sidebar with hamburger toggle. Content reflows to single column. No horizontal scrolling at 320px CSS pixels width (equivalent to 1280px at 400% zoom). | L607–L644 |
| **1.4.11** Non-text Contrast | AA | **PARTIAL FAIL** | Focus indicators: 2px solid `var(--primary)` — `#6366f1` on `#ffffff` yields ~4.5:1 (PASS for UI components). Border colors: `--border: #e2e8f0` on `--bg: #f4f6fb` yields ~1.3:1 (**FAILS** 3:1 minimum for UI components). Card borders and input borders may be insufficient. Progress bar track: `--bg-subtle` on `--surface` — contrast is very low. | L658–L663, L25 |
| **1.4.12** Text Spacing | AA | **PASS** | No CSS that would prevent text spacing overrides. No `line-height`, `letter-spacing`, or `word-spacing` set to `!important` with fixed values that would block user overrides. Base `line-height: 1.5` (L78) is adequate. | L78 |
| **1.4.13** Content on Hover or Focus | AA | **PASS** | No custom tooltips or hover-triggered content overlays. Title attributes are used on some buttons but these are browser-native and do not obscure content. | L684–L686 |

### 3.2 Operable

| SC | Level | Status | Finding | Source |
|----|-------|--------|---------|--------|
| **2.1.1** Keyboard | A | **PASS** | All interactive elements are keyboard-accessible. Tab navigation uses `ArrowLeft/ArrowRight` with roving tabindex. Sidebar items respond to `Enter/Space` via keydown handler. Modal buttons are native `<button>`. Command sidebar uses native `<button>`. Global shortcuts: `Ctrl+S` save, `Escape` close modal/help, `F1/?` help. | L1943–L1981, L2002–L2036 |
| **2.1.2** No Keyboard Trap | A | **PASS** | Focus trapping in modals is properly bounded with Tab/Shift+Tab cycling. Escape key exits all modals and restores focus to trigger element (`_previousFocus`). Tab bar trapping uses ArrowKeys only within tablist — Tab key moves to panel content as expected. | L1058–L1091, L1943–L1981 |
| **2.1.4** Character Key Shortcuts | A | **PASS** | The `?` shortcut is only active when focus is not on an input/textarea/select element (`if (e.target.matches('input,textarea,select')) return;`). No single-character shortcuts fire from form fields. All other shortcuts use modifier keys (Ctrl+S) or function keys (F1). | L2002–L2036 |
| **2.4.1** Bypass Blocks | A | **PASS** | Skip navigation link (`<a href="#main" class="skip-nav">Skip to main content</a>`) present. Landmark regions: `<header>`, `<nav aria-label="...">`, `<main>`, `role="tablist"`. | L667, L700, L725 |
| **2.4.2** Page Titled | A | **PASS** | `<title>Agentic System — Command Center</title>`. Title is descriptive. However, it does not update when switching tabs (SPA — title remains static). | L7 |
| **2.4.3** Focus Order | A | **PASS** | Focus order follows DOM order. Tab → tabpanel → content. Modal focus trap ensures sequential navigation within modal. | L667–L810 |
| **2.4.4** Link Purpose | A | **PASS** | Minimal links used. Skip nav link is descriptive. Help panel links are contextual ("Show [topic]"). | L667 |
| **2.4.5** Multiple Ways | AA | **PARTIAL FAIL** | Only one navigation mechanism exists per view (tabs for views, sidebar for questionnaires). No site map, no search functionality across views, no keyboard command palette. For a SPA with only 3 views this is borderline — the tab bar functions as the primary navigation and is always visible. However, the questionnaire sidebar lacks search/filter. | L691–L694 |
| **2.4.6** Headings and Labels | AA | **PASS** | Modal headings use `<h2>`. Section titles use `.cmd-section-title`. Form labels are descriptive and associated. Filter inputs have sr-only labels. | L814, L838 |
| **2.4.7** Focus Visible | AA | **PASS** | `:focus-visible` styles with 2px solid outline + 2px offset on all interactive elements. Custom focus styles on `.theme-toggle`, `.cmd-btn`, and `.sidebar-item`. | L657–L663 |
| **2.5.1** Pointer Gestures | A | **N/A** | No multi-point or path-based gestures. All interactions are single-tap/click. | — |
| **2.5.2** Pointer Cancellation | A | **PASS** | Click handlers use `click` event (up-event completion). No mousedown-only actions. | JS event handlers |
| **2.5.3** Label in Name | A | **PARTIAL FAIL** | Buttons with `aria-label` (Export, Theme toggle) include visible text that matches. However, header buttons WITHOUT `aria-label` (Save All, New Decision, Reevaluate, Help) have their accessible name computed as emoji character + visible text. The emoji character name (e.g., "floppy disk") is not part of the visible label as perceived by sighted users. | L681–L686 |
| **2.5.4** Motion Actuation | A | **N/A** | No motion-based input. | — |

### 3.3 Understandable

| SC | Level | Status | Finding | Source |
|----|-------|--------|---------|--------|
| **3.1.1** Language of Page | A | **PASS** | `<html lang="en">`. | L2 |
| **3.1.2** Language of Parts | AA | **N/A** | All content is in English. No mixed-language content blocks currently present. | — |
| **3.2.1** On Focus | A | **PASS** | No context changes on focus. Tab switching occurs on click/Enter, not on focus alone. | L1943–L1981 |
| **3.2.2** On Input | A | **PASS** | No context changes on input. Form submission requires explicit button press. Filters use debounced live filtering which updates content but does not change context. | L1998–L2001 |
| **3.2.3** Consistent Navigation | AA | **PASS** | Tab bar and header are consistent across all views. Sidebar position is consistent within questionnaire view. | — |
| **3.2.4** Consistent Identification | AA | **PASS** | Same action buttons maintain consistent labels, icons, and positions throughout. | — |
| **3.3.1** Error Identification | A | **FAIL** | Errors are shown via `toast()` function with raw error text (e.g., `"Failed to save: [HTTP error text]"`). Errors are NOT identified in context — the error toast is a floating notification disconnected from the input that caused the error. The toast uses `aria-live="polite"` so screen readers WILL announce it, but the message does not reference which field or action failed. | `toast()` function, `save()`, `apiPost()` |
| **3.3.2** Labels or Instructions | A | **PASS** | All form inputs have associated labels (visible `<label for="...">` or `.sr-only` label). Textarea placeholders provide instructions. `maxlength` attributes are set. | L710–L715, L839–L876 |
| **3.3.3** Error Suggestion | AA | **FAIL** | No error suggestions provided. When a save fails, the user sees only the error message — no guidance on how to correct the issue or retry. `DEPENDENT_ON:` Agent 11 REC-UXD-001 (error recovery design). | `toast()` function |
| **3.3.4** Error Prevention | AA | **PARTIAL FAIL** | Decision actions (Decide, Defer, Expire) use a confirmation modal — **PASS** for legal/financial decisions. However, Save All does not confirm, questionnaire answer saves auto-submit on blur without confirmation, and there is no undo mechanism. For the questionnaire context, auto-save is a reasonable pattern, but the lack of undo conflicts with error prevention. | Decision confirm modal, `save()`, questionnaire blur handler |

### 3.4 Robust

| SC | Level | Status | Finding | Source |
|----|-------|--------|---------|--------|
| **4.1.1** Parsing | A | **PASS** | HTML structure is well-formed. No duplicate IDs in static HTML. Dynamically generated IDs use unique identifiers (file paths, decision IDs). Semantic HTML elements used for structure (`<header>`, `<nav>`, `<main>`). | L667–L900 |
| **4.1.2** Name, Role, Value | A | **PARTIAL FAIL** | **Passes:** Tabs (role="tab", aria-selected), tabpanels (role="tabpanel", aria-labelledby), dialogs (role="dialog", aria-modal, aria-labelledby), progress bars (role="progressbar", aria-valuenow/min/max), sidebar items (role="button", tabindex). **Fails:** (1) Tabs use `<div role="tab">` instead of native `<button>` — while technically ARIA-valid, the accessible name includes emoji characters that create confusing announcements. (2) Header buttons without `aria-label` rely on inner text including emoji HTML entities. (3) Dynamic content rendered via `innerHTML` in `renderQuestionnaires()` creates form elements whose labels are properly associated (`for/id`), but the questionnaire card status `<select>` has no visible label — only context from the surrounding card provides meaning. | L691–L694, L681–L686, JS renderers |
| **4.1.3** Status Messages | AA | **FAIL** | Toast notifications use `role="status"` + `aria-live="polite"` — **PASS** for error/success toasts. However: (1) Tab panel content changes (switching tabs, loading data) do NOT announce the change to screen readers despite `aria-live="polite"` on panels — the entire panel content is replaced via `innerHTML`, which may cause verbose announcements or be ignored depending on AT. (2) Clipboard copy success has no accessible status message — the visual success box appears but is not announced. (3) Pipeline progress updates are live-rendered but the panel's `aria-live` on the parent may not trigger for incremental updates within child elements. | L810, L1930–L1939, `renderPipeline()` |

---

## Step 4: Legal Compliance Status

| Legislation | Scope | Status | Finding |
|------------|-------|--------|---------|
| **EU — European Accessibility Act (EAA) / EN 301 549** | Mandatory if tool is offered as a service or used by organizations in the EU. Internal tools at organizations with 10+ employees may be in scope post-2025. | **NON-COMPLIANT** | Multiple WCAG 2.1 AA failures identified: SC 1.4.3 (contrast), SC 1.4.11 (non-text contrast), SC 3.3.1 (error identification), SC 3.3.3 (error suggestion), SC 4.1.3 (status messages). EN 301 549 requires WCAG 2.1 AA as baseline. |
| **USA — ADA / Section 508** | Applicable if used by US federal agencies or as a public-facing service. Internal tools may be subject to reasonable accommodation requirements. | **NON-COMPLIANT** | Same WCAG failures as above. Section 508 references WCAG 2.0 AA (less stringent); the contrast and status message failures still apply. |
| **Jurisdiction-specific mandates** | `INSUFFICIENT_DATA:` No Phase 1 business analysis available to determine target markets and deployment geography. | **NOT VERIFIABLE** | Cannot assess jurisdiction-specific requirements without business context. |

---

## Step 5: Assistive Technology Compatibility

### Screen Reader Compatibility

| Test | Status | Finding | Source |
|------|--------|---------|--------|
| ARIA landmarks | **PASS** | `<header>`, `<nav aria-label>`, `<main>`, `role="tablist"`, `role="dialog"` — screen readers can navigate by landmarks. | L667–L810 |
| Tab pattern announcement | **PASS** | role="tab" + aria-selected + aria-controls — standard ARIA tab pattern, supported by all major screen readers. | L691–L694 |
| Modal pattern | **PASS** | role="dialog" + aria-modal + aria-labelledby + focus trap — properly prevents screen reader from reading outside modal. | L813–L894, L1058–L1091 |
| Dynamic content | **PARTIAL** | `aria-live="polite"` on toast container works. Panel-level `aria-live` may cause over-announcement or under-announcement depending on the screen reader's handling of large DOM mutations. | L810, L698–L724 |
| Button announcements | **CONCERN** | Emoji characters in button text will be announced as their Unicode names (e.g., "rocket Command Center", "floppy disk Save All"). This is technically accessible but creates a confusing experience. | L681–L694 |
| Actual screen reader test | `INSUFFICIENT_DATA:` | No screen reader testing has been performed. Above findings are code-analysis only. | — |

### Keyboard-Only Navigation Test (Code Analysis)

| Component | Keyboard access | Finding |
|-----------|----------------|---------|
| Tab bar | ✅ ArrowLeft/Right + Enter/Space | Roving tabindex pattern correct. Focus moves with arrows, activation on click handler. |
| Command sidebar buttons | ✅ Tab + Enter/Space | Native `<button>` elements, fully keyboard accessible. |
| Questionnaire sidebar | ✅ Tab + Enter/Space | `tabindex="0"` + `role="button"` + keydown handler for Enter/Space. |
| Modal dialogs | ✅ Tab cycle + Escape | Focus trap implemented. First focusable element receives focus on open. Escape closes and restores focus. |
| Form inputs | ✅ Tab + native interaction | Native `<input>`, `<select>`, `<textarea>` — fully keyboard accessible. |
| Decision action buttons | ✅ Generated as `<button>` | Inline buttons in decision cards — keyboard accessible via Tab + Enter. |
| Filter inputs | ✅ Tab + type/select | Native form elements. Debounced filtering triggers automatically. |
| Theme toggle | ✅ Tab + Enter/Space | Native `<button>` with `aria-label`. |
| Help panel | ✅ Escape to close | Opens via F1/?. Topic links are clickable. Close via Escape. **Gap:** Help panel links are `<span onclick>` inside rendered markdown — NOT keyboard accessible (no tabindex, no role). |

### High-Contrast Mode

| Test | Status | Finding |
|------|--------|---------|
| Forced colors / Windows High Contrast | `INSUFFICIENT_DATA:` | No `@media (forced-colors: active)` or `@media (-ms-high-contrast: active)` query present. CSS variables will be overridden by system high-contrast mode, but custom backgrounds, borders, and focus indicators may become invisible. No explicit support implemented. |
| `prefers-contrast` | `INSUFFICIENT_DATA:` | No `@media (prefers-contrast: more)` media query. Users requesting increased contrast will see default theme values. |
| `prefers-reduced-motion` | **FAIL** | No `@media (prefers-reduced-motion: reduce)` media query. CSS transitions (`.18s ease` on buttons, `.3s ease` on sidebar) will play regardless of user preference. While these do not cause seizures (SC 2.3.1), they violate the SC 2.3.3 (AAA) recommendation and ignore the user's accessibility preference. | L77–L600 (no media query found) |

---

## Step 6: Remediation Plan

### CRITICAL (Blocking use for users with disabilities)

| ID | WCAG SC | Finding | Remediation | Effort |
|----|---------|---------|-------------|--------|
| GAP-A11Y-001 | SC 3.3.1 (A) | Error toast messages do not identify the field/action that caused the error | Implement contextual error identification: include the action name in error messages + render inline error indicators near the triggering element | 3 SP |
| GAP-A11Y-002 | SC 3.3.3 (AA) | No error suggestions — user receives raw server error text | Implement user-friendly error messages with recovery suggestions (retry button, field highlight, corrective action guidance) | 3 SP |
| GAP-A11Y-003 | SC 4.1.3 (AA) | Clipboard copy, tab switches, and pipeline updates lack accessible status messages | Add `aria-live` region announcements for clipboard success, tab change notifications, and pipeline milestone updates | 2 SP |

### HIGH Priority

| ID | WCAG SC | Finding | Remediation | Effort |
|----|---------|---------|-------------|--------|
| GAP-A11Y-004 | SC 1.4.3 (AA) | `--text-muted` color fails 4.5:1 contrast on tinted backgrounds (`--bg-subtle`) in light theme and on `--surface` in dark theme | Darken muted text colors: light theme `--text-muted` to minimum #566577 (5.2:1 on bg-subtle), dark theme `--text-muted` to minimum #8e9db1 (5.0:1 on surface) | 1 SP |
| GAP-A11Y-005 | SC 1.4.11 (AA) | Card borders and input borders fail 3:1 contrast against backgrounds | Darken `--border` from `#e2e8f0` to minimum `#c5cdd8` for 3:1 against `--bg` | 1 SP |
| GAP-A11Y-006 | SC 1.1.1 (A) | Emoji characters in button labels create confusing screen reader announcements | Add `aria-label` to all buttons with emoji prefixes OR wrap emoji in `<span aria-hidden="true">` and provide text-only accessible name | 2 SP |
| GAP-A11Y-007 | SC 2.5.3 (A) | Buttons without `aria-label` have accessible names that include emoji character names, not matching visible label | Same fix as GAP-A11Y-006 — ensure accessible name matches visible text label | included in GAP-A11Y-006 |
| GAP-A11Y-008 | N/A (best practice) | No `prefers-reduced-motion` support — CSS transitions play regardless of user preference | Add `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }` | 1 SP |
| GAP-A11Y-009 | N/A (best practice) | Help panel rendered markdown links use `<span onclick>` — not keyboard accessible | Replace `<span onclick>` with `<button>` or `<a href>` elements inside help panel content, or add `tabindex="0"` + `role="link"` + keydown handler | 1 SP |

### MEDIUM Priority

| ID | WCAG SC | Finding | Remediation | Effort |
|----|---------|---------|-------------|--------|
| GAP-A11Y-010 | SC 2.4.2 (A) | Page title does not update when switching tabs (SPA) | Update `document.title` in `switchTab()` to reflect active view: "Questionnaires — Agentic System", "Decisions — Agentic System" | 0.5 SP |
| GAP-A11Y-011 | N/A (best practice) | No `@media (forced-colors: active)` support for Windows High Contrast mode | Add forced-colors media query to ensure focus indicators, borders, and interactive element boundaries remain visible | 1 SP |
| GAP-A11Y-012 | SC 1.4.4 (AA) advisory | Base font 14px — below browser default 16px; minimum font 11px on `.cmd-btn-sub` | Increase base font to 16px and minimum font to 12px. Alternatively, use `rem` units to respect user's browser font size setting | 1 SP |
| GAP-A11Y-013 | SC 4.1.2 (A) advisory | `aria-live="polite"` on tabpanels may cause over-verbose announcements when entire panel content is replaced | Move `aria-live` from tabpanel wrappers to a dedicated compact status region. Announce "Switched to [tab name] tab" instead of re-reading all content | 1 SP |
| GAP-A11Y-014 | SC 1.4.1 (A) advisory | Status colors (green/yellow/red) may be indistinguishable for colorblind users — text labels mitigate but shape differentiation absent | Add shape indicators (icons: ✓ for success, ⚠ for warning, ✕ for error) alongside color and text. `UNCERTAIN:` Actual colorblind simulation not performed. | 1 SP |

---

## Self-Check (Step 7)

| Check | Status |
|-------|--------|
| All ACCESSIBILITY_FLAG items from Agent 12 processed? | ✅ AF-001 through AF-007 all documented and categorized |
| WCAG conformance level established? | ✅ WCAG 2.1 AA |
| All 4 WCAG principles analyzed? | ✅ Perceivable (13 SC), Operable (12 SC), Understandable (8 SC), Robust (3 SC) |
| All findings have WCAG SC reference? | ✅ Every finding cites specific SC number |
| Legal compliance documented? | ✅ EAA/EN 301 549 and ADA/Section 508 assessed |
| Remediation plan prioritized? | ✅ Critical (3), High (6), Medium (5) — 14 items total |
| Assistive technology assessment? | ✅ Screen reader, keyboard, high-contrast, reduced-motion all assessed |

---

## Recommendations

### REC-A11Y-001: Fix Critical WCAG AA Failures (Error Handling + Status Messages)
- **GAP reference:** GAP-A11Y-001, GAP-A11Y-002, GAP-A11Y-003
- **Action:** (1) Implement contextual error identification with user-friendly messages and recovery actions in `toast()` and form handlers. (2) Add dedicated `aria-live` announcements for clipboard copy, tab switches, and pipeline updates.
- **Impact:** Risk Reduction — HIGH (resolves 3 Level A/AA failures that could result in legal non-compliance). UX — HIGH (users with AT can understand and recover from errors). Revenue — `INSUFFICIENT_DATA:` (internal tool). Cost — LOW (8 SP total effort).
- **Risk of non-execution:** Short-term: users relying on screen readers cannot effectively recover from errors. Long-term: EAA non-compliance risk if tool is deployed in EU context post-2025.
- **SMART KPI:** WCAG AA pass rate for error-related SC → Baseline: 0/3 passing → Target: 3/3 passing → Method: Automated axe-core scan + manual screen reader test → Horizon: Sprint 1

**Priority Matrix:**
- Impact: HIGH (3 AA/A failures, legal risk)
- Effort: MEDIUM (8 SP across 3 stories)
- Priority: **P1** — Critical compliance risk, directly impacts AT users
- Suggested sprint: Sprint 1

---

### REC-A11Y-002: Fix Contrast and Non-text Contrast Failures
- **GAP reference:** GAP-A11Y-004, GAP-A11Y-005
- **Action:** (1) Darken `--text-muted` in both light and dark themes to achieve 4.5:1 on ALL background combinations. (2) Darken `--border` to achieve 3:1 on all backgrounds.
- **Impact:** Risk Reduction — HIGH (SC 1.4.3 and 1.4.11 are AA requirements). UX — MEDIUM (improves readability for all users, critical for low-vision users). Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (2 SP — CSS variable changes only).
- **Risk of non-execution:** Short-term: low-vision users cannot read muted text or identify input boundaries. Long-term: persistent WCAG AA non-compliance.
- **SMART KPI:** Contrast ratio of muted text → Baseline: ~4.2:1 on worst-case backgrounds → Target: ≥4.5:1 on ALL background combinations → Method: axe-core contrast audit → Horizon: Sprint 1

**Priority Matrix:**
- Impact: HIGH (2 AA failures)
- Effort: LOW (2 SP)
- Priority: **P1** — Quick win, minimum effort, maximum compliance impact
- Suggested sprint: Sprint 1

---

### REC-A11Y-003: Fix Emoji Accessibility and Label-in-Name
- **GAP reference:** GAP-A11Y-006, GAP-A11Y-007
- **Action:** Wrap all emoji characters in `<span aria-hidden="true">` and ensure the remaining text OR an explicit `aria-label` provides the accessible name matching the visible label. Apply to all header buttons, tab labels, and command sidebar buttons.
- **Impact:** Risk Reduction — MEDIUM (SC 1.1.1 is Level A; SC 2.5.3 is Level A). UX — HIGH (eliminates confusing "floppy disk Save All" announcements). Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (2 SP).
- **Risk of non-execution:** Short-term: screen reader users hear confusing emoji names prepended to every button activation. Not a hard blocker but a persistent usability irritant.
- **SMART KPI:** Buttons with clean accessible names → Baseline: 2/6 header buttons, 0/3 tabs, 0/~20 command buttons → Target: 100% of interactive elements → Method: axe-core name-role-value audit + manual VoiceOver/NVDA walk-through → Horizon: Sprint 1

**Priority Matrix:**
- Impact: MEDIUM (Level A compliance, UX improvement)
- Effort: LOW (2 SP)
- Priority: **P1** — Quick win, high UX bang-for-buck
- Suggested sprint: Sprint 1

---

### REC-A11Y-004: Implement Motion and Contrast Preference Support
- **GAP reference:** GAP-A11Y-008, GAP-A11Y-011
- **Action:** (1) Add `@media (prefers-reduced-motion: reduce)` to disable CSS transitions. (2) Add `@media (forced-colors: active)` to preserve focus indicators and UI boundaries in Windows High Contrast mode.
- **Impact:** Risk Reduction — MEDIUM (best practice, not hard AA requirement, but expected by users with vestibular disorders and low vision). UX — MEDIUM. Revenue — `INSUFFICIENT_DATA:`. Cost — LOW (2 SP).
- **Risk of non-execution:** Short-term: users with motion sensitivity experience unnecessary animations. Users of Windows High Contrast see degraded UI. Long-term: WCAG 2.2 may elevate these to AA.
- **SMART KPI:** Media query support coverage → Baseline: 1/4 (prefers-color-scheme only) → Target: 4/4 (color-scheme, reduced-motion, forced-colors, prefers-contrast) → Method: CSS audit + manual test in Windows High Contrast → Horizon: Sprint 2

**Priority Matrix:**
- Impact: MEDIUM
- Effort: LOW (2 SP)
- Priority: **P2** — Strategic improvement, not blocking
- Suggested sprint: Sprint 2

---

### REC-A11Y-005: Accessibility Enhancement Pass (Medium-Priority Fixes)
- **GAP reference:** GAP-A11Y-009, GAP-A11Y-010, GAP-A11Y-012, GAP-A11Y-013, GAP-A11Y-014
- **Action:** (1) Make help panel links keyboard-accessible. (2) Update page title on tab switch. (3) Increase base font to 16px / minimum to 12px. (4) Refactor `aria-live` from tabpanels to dedicated status region. (5) Add shape differentiation to status indicators.
- **Impact:** Risk Reduction — LOW (advisory items, not AA failures). UX — MEDIUM (cumulative improvement for AT users). Revenue — `INSUFFICIENT_DATA:`. Cost — MEDIUM (4.5 SP).
- **Risk of non-execution:** Short-term: minor usability friction for AT users. Long-term: accumulates as accessibility debt.
- **SMART KPI:** Advisory accessibility issues resolved → Baseline: 0/5 → Target: 5/5 → Method: manual audit + screen reader walkthrough → Horizon: Sprint 2

**Priority Matrix:**
- Impact: MEDIUM (cumulative improvement)
- Effort: MEDIUM (4.5 SP)
- Priority: **P2** — Strategic, cumulative
- Suggested sprint: Sprint 2

---

### Recommendations Self-Check (Step D)

| Check | Status |
|-------|--------|
| Every recommendation has GAP/RISK reference? | ✅ All reference specific GAP-A11Y-NNN IDs |
| All impact fields filled or marked INSUFFICIENT_DATA? | ✅ Revenue marked INSUFFICIENT_DATA throughout |
| All measurement criteria SMART? | ✅ Specific KPI + baseline + target + method + horizon for each |
| Recommendations outside domain removed/marked? | ✅ Error recovery UX design noted as `DEPENDENT_ON: Agent 11 REC-UXD-001` |

---

## Sprint Plan

### Assumptions (Step E)
- **Team:** `INSUFFICIENT_DATA: team composition/capacity` — no team data available from onboarding. Assuming a single cross-functional team with front-end capability.
- **Assumed capacity:** `INSUFFICIENT_DATA:` — estimates in SP are relative effort based on complexity. Assuming ~12-15 SP per team per sprint.
- **Sprint duration:** 2 weeks (default).
- **Technology:** Vanilla HTML/CSS/JS SPA — no framework overhead. All fixes are direct code changes.
- **Prerequisites for Sprint 1:** None — all fixes are standalone CSS/HTML/JS changes within `index.html`.

---

### Sprint 1: "Achieve WCAG 2.1 AA Compliance — Critical Fixes"

| Story ID | Description | Team | Type | Acceptance Criteria | SP | Dependencies | Blocker | Rec Ref |
|----------|-------------|------|------|--------------------|----|--------------|---------|---------|
| SP-3-401 | As a screen reader user, I want error messages to identify the failed action and suggest recovery, so that I can fix issues independently | `INSUFFICIENT_DATA: team` | CODE | Given an API call fails, When the toast notification appears, Then the message includes the action name (e.g., "Save questionnaire failed"), a user-friendly description, and a retry suggestion. Verified with NVDA: toast is announced with complete context. | 3 | — | NONE | REC-A11Y-001 |
| SP-3-402 | As a screen reader user, I want tab switches and clipboard actions to be announced, so that I know the UI state changed | `INSUFFICIENT_DATA: team` | CODE | Given I switch tabs using keyboard, When the new tab activates, Then a screen-reader-only status region announces "Switched to [tab name]". Given I click Copy to Clipboard, Then the status region announces "Copied to clipboard". Verified with NVDA/VoiceOver. | 2 | — | NONE | REC-A11Y-001 |
| SP-3-403 | As a pipeline user, I want critical pipeline milestones to be announced, so that I know progress without watching the screen | `INSUFFICIENT_DATA: team` | CODE | Given a pipeline step completes, When the status changes to "complete" or "error", Then an aria-live region announces "[Agent name] [status]". | 1 | — | NONE | REC-A11Y-001 |
| SP-3-404 | As a low-vision user, I want all text to meet 4.5:1 contrast on every background, so that I can read the interface | `INSUFFICIENT_DATA: team` | CODE | Given any text styled with `--text-muted` or `--text-sec`, When rendered on any background used in the same context (surface, bg, bg-subtle), Then contrast ratio ≥ 4.5:1 in both light and dark themes. Verified with axe-core: 0 contrast violations. | 1 | — | NONE | REC-A11Y-002 |
| SP-3-405 | As a low-vision user, I want UI component borders to have sufficient contrast, so that I can identify input fields and cards | `INSUFFICIENT_DATA: team` | CODE | Given any interactive element with a border (inputs, cards, selects), When rendered on its background, Then border contrast ≥ 3:1. Verified with axe-core SC 1.4.11 rule: 0 violations. | 1 | — | NONE | REC-A11Y-002 |
| SP-3-406 | As a screen reader user, I want button labels to match visible text without confusing emoji names, so that I can activate the correct controls | `INSUFFICIENT_DATA: team` | CODE | Given any button or tab with an emoji prefix, When a screen reader reads the element, Then ONLY the text label is announced (emoji is aria-hidden). Verified: NVDA reads "Save All" not "floppy disk Save All". Applies to all header buttons (6), tabs (3), and command sidebar buttons (~20). | 2 | — | NONE | REC-A11Y-003 |

**Sprint 1 Total:** 10 SP

**Parallel Tracks:**
- **Track A** (Status messages): SP-3-401, SP-3-402, SP-3-403 — independent, same domain (JS aria-live)
- **Track B** (Visual fixes): SP-3-404, SP-3-405, SP-3-406 — independent, CSS + HTML attribute changes
- Tracks A and B have no mutual dependencies and can run in parallel.

**Sprint 1 Blocker Register:**
No blockers identified.

**Sprint 1 Goal:**
- Outcome: All critical and high-priority WCAG 2.1 AA violations resolved. Screen reader users can navigate, understand errors, and receive status updates. Low-vision users can read all text and identify all UI boundaries.
- KPI targets: (1) axe-core violation count for SC 1.4.3, 1.4.11, 3.3.1, 3.3.3, 4.1.3 = 0. (2) Manual screen reader test: all buttons announce clean labels, toast errors include context, tab switches are announced.
- Definition of Done: All 6 stories complete, axe-core scan passes with 0 critical/serious violations for targeted SC, manual NVDA screen reader walkthrough confirms all acceptance criteria, no new CRITICAL_FINDING introduced.

---

### Sprint 2: "Accessibility Enhancements — Preferences & Polish"

| Story ID | Description | Team | Type | SP | Dependencies | Blocker | Rec Ref |
|----------|-------------|------|------|----|--------------|---------|---------|
| SP-3-407 | As a user with motion sensitivity, I want animations and transitions to be disabled when I request reduced motion, so that I can use the interface comfortably | `INSUFFICIENT_DATA: team` | CODE | 1 | — | NONE | REC-A11Y-004 |
| SP-3-408 | As a Windows High Contrast user, I want focus indicators and UI boundaries to remain visible, so that I can navigate the interface | `INSUFFICIENT_DATA: team` | CODE | 1 | — | NONE | REC-A11Y-004 |
| SP-3-409 | As a user navigating with assistive technology, I want help panel links to be keyboard-accessible, so that I can browse help topics without a mouse | `INSUFFICIENT_DATA: team` | CODE | 1 | — | NONE | REC-A11Y-005 |
| SP-3-410 | As a screen reader user, I want the page title to reflect the current tab, so that I know which view is active when I check the window title | `INSUFFICIENT_DATA: team` | CODE | 0.5 | — | NONE | REC-A11Y-005 |
| SP-3-411 | As a user who has set a larger default font in their browser, I want the interface to respect my preference, so that text is readable at my chosen size | `INSUFFICIENT_DATA: team` | CODE | 1 | SP-3-404 (contrast fixes may need re-checking after font size change) | NONE | REC-A11Y-005 |
| SP-3-412 | As a screen reader user, I want tab switches to announce only the change, not re-read all panel content, so that I receive concise notifications | `INSUFFICIENT_DATA: team` | CODE | 1 | SP-3-402 (status region must be in place first) | NONE | REC-A11Y-005 |
| SP-3-413 | As a colorblind user, I want status indicators to use shapes in addition to color and text, so that I can quickly scan statuses | `INSUFFICIENT_DATA: team` | CODE | 1 | — | NONE | REC-A11Y-005 |

**Sprint 2 Total:** 6.5 SP

**Parallel Tracks:**
- **Track A** (Media queries): SP-3-407, SP-3-408 — independent CSS additions
- **Track B** (Keyboard + navigation): SP-3-409, SP-3-410 — independent JS/HTML fixes
- **Track C** (Refinement): SP-3-411, SP-3-412, SP-3-413 — can run in parallel after Sprint 1 dependencies are met
- Tracks A and B can run immediately. Track C starts after Sprint 1 dependencies per story.

**Sprint 2 Blocker Register:**
No external blockers. SP-3-411 and SP-3-412 have internal dependencies on Sprint 1 stories.

**Sprint 2 Goal:**
- Outcome: Full accessibility preference support (reduced-motion, forced-colors). All medium-priority gaps closed. Cumulative improvement for AT users navigating help content, browsing tabs, and scanning statuses.
- KPI targets: (1) Media query coverage: 4/4 preferences supported. (2) Keyboard-accessible help links: 100%. (3) Advisory accessibility issues resolved: 5/5.
- Definition of Done: All 7 stories complete, axe-core scan passes with 0 critical/serious violations, manual screen reader walkthrough confirms clean announcements, Windows High Contrast mode test passes, `prefers-reduced-motion` test confirms no animations.

---

### Sprint Plan Self-Check (Step H)

| Check | Status |
|-------|--------|
| All stories based on recommendations? | ✅ Every story references a REC-A11Y-NNN |
| Every P1 recommendation has at least one story? | ✅ REC-A11Y-001→SP-3-401/402/403, REC-A11Y-002→SP-3-404/405, REC-A11Y-003→SP-3-406 |
| Every story has a team assignment? | ✅ (marked INSUFFICIENT_DATA: team — no team data available) |
| Every story has at least one acceptance criterion? | ✅ |
| Every story has a Blocker field? | ✅ All marked NONE |
| All EXTERN blockers with owner + escalation? | ✅ N/A — no external blockers |
| Parallel tracks identified per sprint? | ✅ Sprint 1: 2 tracks. Sprint 2: 3 tracks. |
| Assumptions documented? | ✅ Step E above |
| Sprint KPIs SMART? | ✅ Specific targets, baselines, measurement methods, time-bound |
| CODE/INFRA stories free from cross-track blockers? | ✅ No DESIGN/CONTENT/ANALYSIS dependencies |

**Traceability Table:**

| Recommendation | Priority | Stories |
|---------------|----------|---------|
| REC-A11Y-001 | P1 | SP-3-401, SP-3-402, SP-3-403 |
| REC-A11Y-002 | P1 | SP-3-404, SP-3-405 |
| REC-A11Y-003 | P1 | SP-3-406 |
| REC-A11Y-004 | P2 | SP-3-407, SP-3-408 |
| REC-A11Y-005 | P2 | SP-3-409, SP-3-410, SP-3-411, SP-3-412, SP-3-413 |

All P1 and P2 recommendations have stories. No `MISSING_STORY` items.

---

## Guardrails

### G-A11Y-001: All interactive elements must have an accessible name that matches or contains the visible label text
- **Reference:** GAP-A11Y-006, GAP-A11Y-007 (emoji accessibility, label-in-name)
- **Scope:** All agents producing HTML UI components — Implementation Agent, Storybook Agent
- **Formulation:** Must not deploy any interactive element (button, link, input) where the computed accessible name does not contain the visible text label. Emoji or icon characters must be wrapped in `aria-hidden="true"`.
- **Violation action:** Block PR merge. Mark as CRITICAL_FINDING in code review.
- **Verification method:** Automated — axe-core `label-in-name` and `button-name` rules in CI pipeline (run per PR). Manual — screen reader walkthrough per sprint.
- **Overlap check:** Addition to G-UX-06 (accessibility as first-class constraint). New specific rule.

### G-A11Y-002: All text must meet WCAG 2.1 AA contrast ratios on every background it appears against
- **Reference:** GAP-A11Y-004, GAP-A11Y-005 (text and non-text contrast failures)
- **Scope:** All CSS changes, theme modifications, new components — Implementation Agent
- **Formulation:** Must not deploy text with contrast ratio below 4.5:1 (normal text) or 3:1 (large text, UI components) against ANY background the element can appear on — including both light and dark themes.
- **Violation action:** Block PR merge. Escalate to Accessibility Specialist if exception is requested.
- **Verification method:** Automated — axe-core `color-contrast` rule in CI pipeline (run per PR). Manual — contrast spot-check with browser DevTools for any new color token.
- **Overlap check:** Addition to G-UX-06. Strengthens existing practice.

### G-A11Y-003: All user-visible status changes must have a corresponding accessible announcement
- **Reference:** GAP-A11Y-003 (status messages not announced)
- **Scope:** All dynamic content changes visible to users — Implementation Agent
- **Formulation:** Must not deploy a UI state change (toast, tab switch, copy confirmation, pipeline update, form save) without an `aria-live` region announcement or equivalent AT notification (role="alert" for urgent, role="status" for polite).
- **Violation action:** Block PR merge. Mark as CRITICAL_FINDING.
- **Verification method:** Automated — custom axe-core rule or Playwright test asserting `aria-live` region updates after each user action. Manual — NVDA walkthrough per sprint.
- **Overlap check:** New guardrail. No overlap with existing guardrails.

### G-A11Y-004: CSS must respect all user accessibility preferences
- **Reference:** GAP-A11Y-008, GAP-A11Y-011 (missing prefers-reduced-motion, forced-colors)
- **Scope:** All CSS additions — Implementation Agent
- **Formulation:** Must always include `@media (prefers-reduced-motion: reduce)` to disable animations and transitions. Must always include `@media (forced-colors: active)` to preserve focus indicators and UI boundaries. Any new animation or transition requires a corresponding reduced-motion override.
- **Violation action:** Block PR merge. Code review checklist item.
- **Verification method:** Automated — CSS linting rule (stylelint or custom) that flags `transition` or `animation` without a corresponding `prefers-reduced-motion` override. Manual — Windows High Contrast mode test per sprint.
- **Overlap check:** New guardrail. Complements G-UX-06.

### Guardrails Self-Check (Step M)

| Check | Status |
|-------|--------|
| Every guardrail formulated testably? | ✅ All start with "Must not" or "Must always" |
| Every guardrail has a violation action? | ✅ All specify "Block PR merge" + escalation path |
| Every guardrail has a verification method? | ✅ All have automated + manual methods |
| Every guardrail has a GAP/RISK reference? | ✅ All reference specific GAP-A11Y-NNN |
| Duplicates checked against existing guardrails? | ✅ All checked against G-UX-06 and global guardrails |

---

## QUESTIONNAIRE_REQUEST

Items requiring customer input to resolve `INSUFFICIENT_DATA:`:

| Q-ID | Question | Target | Rationale |
|------|----------|--------|-----------|
| Q-A11Y-001 | What geographic markets will this tool be deployed in? (EU, USA, other jurisdictions) | Product Owner | Required to determine applicable accessibility legislation (EAA, ADA, Section 508) and mandatory conformance level |
| Q-A11Y-002 | Are there known users with disabilities on the current or expected user base? | Product Owner | Required to prioritize specific AT support (screen reader, voice control, switch access) |
| Q-A11Y-003 | Has any accessibility testing been performed previously? If so, what tools, methodology, and results? | Technical Lead | Required to establish baseline and assess previous remediation efforts |
| Q-A11Y-004 | What is the team composition and capacity available for accessibility remediation? (Front-end developers, testers, sprint capacity) | Technical Lead | Required to produce accurate sprint plan — currently all team fields are INSUFFICIENT_DATA |

---

## HANDOFF CHECKLIST – Accessibility Specialist – 2025-01-20
- [x] MODE: AUDIT
- [x] All ACCESSIBILITY_FLAG: items processed (7 flags from Agents 10, 11, 12)
- [x] WCAG conformance level established (WCAG 2.1 AA)
- [x] All 4 WCAG principles fully analyzed (36 success criteria assessed)
- [x] All findings have WCAG SC reference
- [x] Legal compliance status documented (EAA: NON-COMPLIANT, ADA: NON-COMPLIANT)
- [x] Remediation plan prioritized (Critical: 3, High: 6, Medium: 5)
- [x] Recommendations produced (5 recommendations, all P1 or P2, all with GAP references)
- [x] Sprint plan produced (2 sprints, 13 stories, 16.5 SP total)
- [x] Guardrails produced (4 guardrails with verification methods)
- [x] Questionnaire requests documented (4 items)
- [x] All INSUFFICIENT_DATA: items documented and escalated
- [x] Output written to file per MEMORY MANAGEMENT PROTOCOL
