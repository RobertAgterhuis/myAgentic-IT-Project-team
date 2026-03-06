# Storybook Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Storybook Agent (Agent 31)

---

## PURPOSE
Ensures the Storybook Agent produces a component inventory and storybook setup report that serve as the leading design system reference for the Implementation Agent. The component inventory is the authoritative source for UI component specifications, accessibility baselines, and implementation guardrails.

---

## OUTPUT FILES
**Location:**
- `.github/docs/storybook/component-inventory.md`
- `.github/docs/storybook/storybook-setup-report.md`

**Format:** Markdown

---

## MANDATORY SECTIONS

### component-inventory.md

#### 1. Component Inventory Header
- Date generated
- Design tokens source reference (path to `design-tokens.json`)
- Brand guidelines source reference (path to `brand-guidelines.md`)

#### 2. Component Catalog
For each component:
- **Component Name**
- **Category:** `ATOM` | `MOLECULE` | `ORGANISM` | `TEMPLATE` | `PAGE`
- **Description:** Purpose and usage context
- **Props / Variants:** Configurable properties and visual variants
- **Design Token References:** Which tokens this component consumes
- **Accessibility Requirements:** ARIA roles, keyboard navigation, screen reader behavior
- **States:** Default, hover, focus, active, disabled, error, loading

#### 3. Implementation Agent Guardrail
- Explicit instruction block for the Implementation Agent:
  - Component inventory is the leading reference — deviations require justification
  - All components must consume design tokens (no hardcoded values)
  - Accessibility requirements are mandatory, not optional
  - Component naming conventions to follow

#### 4. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

### storybook-setup-report.md

#### 1. Setup Summary
- Storybook version recommended
- Framework integration (React, Vue, Angular, etc.)
- Addon recommendations

#### 2. Configuration
- Directory structure for stories
- Naming conventions
- Theme configuration using design tokens

#### 3. Accessibility Testing Setup
- a11y addon configuration
- Automated accessibility testing rules

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `component-inventory.md` exists with component catalog
- [ ] `storybook-setup-report.md` exists with setup configuration
- [ ] Implementation Agent Guardrail section is present in component-inventory.md
- [ ] Every component has accessibility requirements specified
- [ ] Design token references are present per component (no orphaned components)
- [ ] Component categories follow the ATOM/MOLECULE/ORGANISM/TEMPLATE/PAGE taxonomy

---

## JSON Export

> No standalone JSON export. The Implementation Agent consumes `component-inventory.md` as structured Markdown. Component metadata is encoded in the inventory table columns.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
