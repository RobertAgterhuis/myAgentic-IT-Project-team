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

## JSON Export

The `design-tokens.json` file serves as the JSON export for this contract. Required top-level keys:

```json
{
  "colors": { },
  "typography": { },
  "spacing": { },
  "breakpoints": { },
  "shadows": { },
  "borders": { }
}
```

All six keys MUST be present. Contents follow the structure defined in the `design-tokens.json` section above.

---

## Refresh Protocol

When `BRAND_REFRESH_REQUIRED: YES` is set by the Reevaluate Agent, the Brand & Assets Agent re-executes with the reevaluation delta as input, produces updated tokens and guidelines, and increments the `version` field in `design-tokens.json`.

The refresh cycle:
1. Reevaluate Agent sets `BRAND_REFRESH_REQUIRED: YES` in its output
2. Orchestrator activates Brand & Assets Agent with reevaluation delta as input
3. Brand & Assets Agent produces updated `design-tokens.json` + `brand-guidelines.md`
4. `design-tokens.json` version field is incremented
5. Storybook Agent re-executes to update component inventory against new tokens
6. Synthesis is BLOCKED until refresh completes (per BRAND_REFRESH_REQUIRED flag)

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All files produced, all checks passed
- `PARTIAL` — Some files produced, documented gaps
- `SKIPPED_NO_TOKEN` — Design tokens not applicable; brand-guidelines.md still required
- `BLOCKED` — Cannot produce output, escalation raised
