# Component Inventory
> **Version:** 1.0 | **Generated:** 2026-03-08 | **Source:** Phase 3 UX Audit (Section 5.6)
> **Design Tokens:** `.github/docs/brand/design-tokens.json`
> **Brand Guidelines:** `.github/docs/brand/brand-guidelines.md`
> **Application:** Questionnaire & Decisions Manager — single-page HTML/CSS/JS (index.html)

---

## 1. Component Catalog

### 1.1 Button

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Primary interaction element for form submission, navigation, and destructive actions. Three visual variants differentiated by background color. |
| **Variants** | `primary` (solid `--primary` bg), `secondary` (outlined, `--border` border), `danger` (solid `--danger` bg) |
| **Props** | `disabled` (boolean), `type` (submit / button), icon (optional inline SVG) |
| **Design Token References** | `color.primary`, `color.primary-dark` (hover), `color.danger`, `color.surface`, `color.text`, `typography.font-weight.medium`, `typography.font-size.md`, `border-radius.md`, `motion.duration.fast`, `motion.easing.default` |
| **Accessibility** | `focus-visible` ring (2px solid `--primary`, 2px offset). Native `<button>` element. Disabled state uses `aria-disabled` or `disabled` attribute. |
| **States** | Default, hover (darken via `primary-dark`), focus-visible (ring), active (scale 0.98), disabled (opacity 0.5, pointer-events none), loading (not implemented — `RECOMMENDATION: Add loading state`) |

---

### 1.2 Card

| Field | Value |
|-------|-------|
| **Category** | MOLECULE |
| **Description** | Container for questionnaire items (`.q-card`) and decision items (`.dec-card`). Displays title, metadata, status badge, and action area. |
| **Variants** | Questionnaire card, Decision card (different metadata fields) |
| **Props** | Title (question text / decision title), ID badge, status badge, phase badge, metadata (category, priority, deadline), expandable content area |
| **Design Token References** | `color.surface`, `color.border`, `color.text`, `color.text-sec`, `shadow.light.sm` / `shadow.dark.sm`, `border-radius.lg`, `spacing.md`, `spacing.lg`, `typography.font-size.lg` (title), `typography.font-size.sm` (meta) |
| **Accessibility** | Partial — no `role="article"` yet (see DD-008). Interactive elements inside card are keyboard accessible. Status communicated via badge text + icon. |
| **States** | Default, hover (shadow elevation to `shadow.md`), selected/expanded (border highlight `--primary-light`), loading (skeleton variant) |

---

### 1.3 Modal Dialog

| Field | Value |
|-------|-------|
| **Category** | ORGANISM |
| **Description** | Overlay dialog for answering questions, editing decisions, confirming destructive actions, and viewing details. Includes backdrop, focus trap, and close mechanisms. |
| **Variants** | Standard (form content), Confirmation (yes/no), Detail view (read-only) |
| **Props** | Title, body content, action buttons (confirm/cancel), closable (boolean), backdrop-click-to-close |
| **Design Token References** | `color.surface-raised`, `color.text`, `color.border`, `shadow.light.lg` / `shadow.dark.lg`, `border-radius.xl`, `spacing.xl`, `z-index.modal`, `z-index.modal-backdrop`, `motion.duration.normal`, `motion.easing.default` |
| **Accessibility** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to title. Focus trap implemented — Tab cycles within modal. Escape key closes. Focus returns to trigger element on close. |
| **States** | Hidden, opening (fade + scale animation), visible, closing (reverse animation) |

---

### 1.4 Toast

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Ephemeral notification message for success, error, and informational feedback. Auto-dismisses after timeout. |
| **Variants** | `success` (green), `error` (red), `info` (primary) |
| **Props** | Message text, variant/type, duration (ms), dismissible (boolean) |
| **Design Token References** | `color.success`, `color.danger`, `color.primary`, `color.surface-raised`, `color.text`, `border-radius.lg`, `shadow.light.md`, `z-index.toast`, `motion.duration.normal`, `motion.easing.entrance` |
| **Accessibility** | Uses `aria-live="polite"` region. Toast text is announced by screen readers. Auto-dismiss respects `prefers-reduced-motion`. |
| **States** | Hidden, entering (slide-in from top-right), visible, exiting (fade-out) |

---

### 1.5 Tab Bar

| Field | Value |
|-------|-------|
| **Category** | MOLECULE |
| **Description** | Horizontal navigation for switching between main application views: Questionnaires, Decisions, Commands, Pipeline, Settings. |
| **Variants** | Desktop (horizontal, full labels), Mobile (icon-only below breakpoint `--bp-sm`) |
| **Props** | Tab items (label, icon, id), active tab ID, badge count (optional) |
| **Design Token References** | `color.primary`, `color.text`, `color.text-sec`, `color.border`, `color.surface`, `typography.font-size.sm`, `typography.font-weight.medium`, `spacing.sm`, `spacing.md`, `border-radius.md`, `motion.duration.fast` |
| **Accessibility** | `role="tablist"` on container, `role="tab"` on each tab, `role="tabpanel"` on content. `aria-selected="true"` on active tab. Arrow key navigation between tabs. `tabindex="0"` on active, `tabindex="-1"` on inactive. |
| **States** | Default, hover (text color to `--primary`), active/selected (underline indicator + `--primary` color), focus-visible (ring) |

---

### 1.6 Input / Textarea

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Standard form controls for text entry. Used in answer forms, decision editing, command parameters, and settings. |
| **Variants** | Single-line input, multi-line textarea, search input (with icon) |
| **Props** | `label`, `placeholder`, `required`, `disabled`, `readonly`, `maxlength`, error message |
| **Design Token References** | `color.surface`, `color.text`, `color.border`, `color.primary` (focus border), `color.danger` (error border), `typography.font-size.md`, `typography.font-family.sans`, `border-radius.md`, `spacing.sm`, `spacing.md` |
| **Accessibility** | `<label>` element associated via `for`/`id`. `aria-invalid="true"` on error state. `aria-describedby` pointing to error message element. `aria-required="true"` when required. |
| **States** | Default, focus (border-color `--primary`, ring), filled, error (`--danger` border, error message visible), disabled (opacity 0.5), readonly |

---

### 1.7 Progress Bar

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Visual progress indicator showing completion percentage for questionnaires, sprint progress, and pipeline stages. |
| **Variants** | Standard (single color), Segmented (multi-color for questionnaire completion by status) |
| **Props** | `value` (0–100), `max`, label text, color override |
| **Design Token References** | `color.primary` (fill), `color.border` (track background), `color.success`, `color.warning`, `color.danger` (segmented variant), `border-radius.full`, `spacing.xs` |
| **Accessibility** | `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label` with descriptive text. |
| **States** | Empty (0%), partial, complete (100%), indeterminate (not currently used) |

---

### 1.8 Badge

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Small inline label for status, phase, category, and priority metadata on cards and list items. |
| **Variants** | Status badge (ANSWERED / OPEN / REQUIRED / DEFERRED / DECIDED / EXPIRED), Phase badge (Phase 1–5 + Synthesis), Priority badge, Category badge |
| **Props** | Label text, variant (determines color), icon (Unicode symbol for colorblind safety) |
| **Design Token References** | `color.success`, `color.warning`, `color.danger`, `color.primary`, `color.accent`, `color.text`, `typography.font-size.caption`, `typography.font-weight.semibold`, `border-radius.full`, `spacing.xs`, `spacing.sm` |
| **Accessibility** | Partial — colorblind-safe via Unicode symbols (✓, ○, ◇, !, ✕). `RECOMMENDATION: Add sr-only label for screen readers to convey status semantically.` |
| **States** | Static — no interactive states |

---

### 1.9 Select / Dropdown

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Native `<select>` element used for filter options (phase, status, category, priority) and form fields. |
| **Variants** | Standard select, Filter select (smaller, inline in filter bar) |
| **Props** | `label`, options list, selected value, `disabled`, `required` |
| **Design Token References** | `color.surface`, `color.text`, `color.border`, `color.primary` (focus), `typography.font-size.md`, `border-radius.md`, `spacing.sm` |
| **Accessibility** | Native `<select>` provides full keyboard and screen reader support. `<label>` association via `for`/`id`. |
| **States** | Default, focus (ring), disabled (opacity 0.5) |

---

### 1.10 Skeleton Loader

| Field | Value |
|-------|-------|
| **Category** | ATOM |
| **Description** | Placeholder shimmer animation displayed while data loads. Mimics card structure to reduce perceived loading time. |
| **Variants** | Card skeleton, List skeleton |
| **Props** | Count (number of skeleton items to show) |
| **Design Token References** | `color.border` (base), `color.surface` (shimmer highlight), `border-radius.lg`, `motion.duration.slow`, `motion.easing.default` |
| **Accessibility** | Partial — `RECOMMENDATION: Add aria-busy="true" on parent container during loading, aria-busy="false" when content loads.` |
| **States** | Animating (continuous shimmer loop), done (replaced by real content) |

---

### 1.11 Sidebar Navigation

| Field | Value |
|-------|-------|
| **Category** | ORGANISM |
| **Description** | Left sidebar with phase-specific navigation, connection status indicator, and contextual actions. Collapsible on smaller viewports. |
| **Variants** | Expanded (with labels), Collapsed (icon-only, below `--bp-md`) |
| **Props** | Navigation items (label, icon, href/action, active state), connection status (connected/disconnected), collapse toggle |
| **Design Token References** | `color.surface`, `color.text`, `color.text-sec`, `color.primary` (active item), `color.border`, `color.success` / `color.danger` (status dot), `typography.font-size.label`, `spacing.sm`, `spacing.md`, `motion.duration.fast` |
| **Accessibility** | Implied `role="navigation"` via semantic structure. Active item indicated by visual highlight + `aria-current="page"` (if applicable). Connection status uses color dot + text label. |
| **States** | Expanded, collapsed, item: default / hover / active / focus-visible |

---

### 1.12 Filter Bar

| Field | Value |
|-------|-------|
| **Category** | MOLECULE |
| **Description** | Horizontal bar with search input, select filters (phase, status, category, priority), and a result count display. Positioned above card grids. |
| **Variants** | Single-instance — consistent across Questionnaires and Decisions tabs |
| **Props** | Search input, filter selects (phase, status, category, priority), active filter count, result count text |
| **Design Token References** | `color.surface`, `color.border`, `color.text`, `color.text-sec`, `spacing.sm`, `spacing.md`, `border-radius.md`, `typography.font-size.sm` |
| **Accessibility** | All filter controls are native form elements with labels. Search input has `aria-label` or visible label. Filter changes announced via live region (result count update). |
| **States** | Default, filtering (active filter indicators), empty results (message display) |

---

## 2. Missing Components (Recommended)

| Component | Category | Rationale | Priority | Source |
|-----------|----------|-----------|----------|--------|
| Tooltip | ATOM | Contextual help for command parameters, field hints | Medium | DD-005, H10 finding |
| Breadcrumb | MOLECULE | Navigation hierarchy within questionnaire sections | Medium | DD-004, IA-GAP-01 |

---

## 3. Implementation Agent Guardrail

> **MANDATORY for Implementation Agent (Agent 20)**
>
> 1. This **Component Inventory** is the leading reference for UI implementation. Any deviation from the component specifications above requires written justification in the PR description.
> 2. All components **MUST** consume design tokens from `design-tokens.json`. Hardcoded color, spacing, typography, or shadow values are prohibited.
> 3. **Accessibility requirements are mandatory**, not optional. Every component must implement the ARIA roles, keyboard navigation, and screen reader behavior documented in its entry.
> 4. **Component naming conventions:**
>    - CSS class prefix: descriptive, kebab-case (e.g., `.q-card`, `.dec-card`, `.filter-bar`)
>    - JavaScript function prefix: `render` + PascalCase (e.g., `renderCard()`, `renderModal()`)
>    - IDs: kebab-case, unique per instance
> 5. New components not in this inventory must be **added to this document** before implementation begins (Definition of Ready gate).
> 6. All interactive components must be keyboard-operable and have visible focus indicators.
> 7. Status communication must always use **color + icon + text** (never color alone).

---

## 4. Handoff Checklist

- [x] All 12 identified components are documented
- [x] Each component has Category, Description, Variants, Props, Token References, Accessibility, States
- [x] Missing components documented with rationale
- [x] Implementation Agent guardrail is explicit and actionable
- [x] Design token references map to actual tokens in `design-tokens.json`
- [x] Accessibility requirements cite specific ARIA patterns
- [x] INSUFFICIENT_DATA items documented: Badge sr-only label, Skeleton aria-busy, Button loading state
- [x] Output written to file per MEMORY MANAGEMENT PROTOCOL
- [x] No contradictory statements
