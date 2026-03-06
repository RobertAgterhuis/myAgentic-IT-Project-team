# Brand & Assets Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Brand & Assets Agent (Agent 30)

---

## PURPOSE
Ensures the Brand & Assets Agent produces design tokens, brand guidelines, and a brand assets report that form the visual identity foundation for the project. These outputs feed into the Storybook Agent's component inventory and the PR/Review Agent's brand compliance checks.

---

## OUTPUT FILES
**Location:**
- `.github/docs/brand/design-tokens.json`
- `.github/docs/brand/brand-guidelines.md`
- `.github/docs/brand/brand-assets-report.md`

**Format:** JSON + Markdown

---

## MANDATORY SECTIONS

### design-tokens.json
Valid JSON object containing (at minimum):
- **colors:** Primary, secondary, accent, background, text, error, warning, success
- **typography:** Font families, sizes, weights, line heights
- **spacing:** Base unit, scale
- **borders:** Radius values, widths
- **shadows:** Elevation levels
- **breakpoints:** Responsive breakpoints

### brand-guidelines.md
Must contain these 6 sections:
1. **Brand Overview** — Mission, vision, brand personality
2. **Logo Usage** — Logo variants, clear space, minimum sizes, prohibited usage
3. **Color System** — Color palette with hex/RGB values, usage guidelines, contrast ratios
4. **Typography** — Type scale, font pairings, usage contexts
5. **Imagery & Iconography** — Style guidelines, icon system, photography direction
6. **Voice & Tone** — Brand voice attributes, writing style guidelines

### brand-assets-report.md
1. **Asset Inventory** — List of all generated assets with file paths
2. **Design Token Summary** — Overview of token categories and counts
3. **Accessibility Compliance** — Color contrast ratios verified (WCAG AA minimum)
4. **Integration Notes** — How to consume tokens in implementation
5. **Handoff Checklist** — Standard handoff checklist per Universal Agent Rules

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `design-tokens.json` exists and is valid JSON (or `SKIPPED_NO_TOKEN` is documented)
- [ ] `brand-guidelines.md` exists with all 6 mandatory sections
- [ ] `brand-assets-report.md` exists with asset inventory
- [ ] Color contrast ratios meet WCAG AA (4.5:1 for normal text)
- [ ] Design tokens are referenced in brand guidelines (consistency)
- [ ] If `SKIPPED_NO_TOKEN`: brand-guidelines.md sections 1–6 still required

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All files produced, all checks passed
- `PARTIAL` — Some files produced, documented gaps
- `SKIPPED_NO_TOKEN` — Design tokens not applicable; brand-guidelines.md still required
- `BLOCKED` — Cannot produce output, escalation raised
