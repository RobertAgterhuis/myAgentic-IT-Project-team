# Synthesis Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Synthesis Agent (Agent 17)

---

## PURPOSE
Ensures the Synthesis Agent produces the complete set of six documents that consolidate all phase outputs into actionable executive reports, department-specific reports, and a cross-team blocker matrix. These documents represent the final deliverables of the design/strategy phases and gate entry into Phase 5 (Implementation).

---

## OUTPUT FILES
**Location:** `.github/docs/synthesis/`
**Format:** Markdown
**Required files (6):**
1. `final-report-master.md`
2. `final-report-business.md`
3. `final-report-tech.md`
4. `final-report-ux.md`
5. `final-report-marketing.md`
6. `cross-team-blocker-matrix.md`

---

## MANDATORY SECTIONS

### final-report-master.md
1. **Executive Summary** — High-level overview of the entire solution
2. **Solution Blueprint Heatmap** — Status per discipline (GREEN/YELLOW/RED)
3. **Risk Matrix** — Consolidated from all phase Risk Agent outputs
4. **Roadmap** — Phased implementation timeline with sprint mapping
5. **Guardrails** — Consolidated guardrails that apply to implementation
6. **KPIs** — Success metrics per discipline with targets and measurement method
7. **Open Items** — All unresolved `UNCERTAIN:` and `INSUFFICIENT_DATA:` items with owner

### final-report-business.md / final-report-tech.md / final-report-ux.md / final-report-marketing.md
Each department report must contain:
1. **Summary** — Key findings and decisions for this discipline
2. **Findings** — Detailed findings from the phase, with source references
3. **Recommendations** — Actionable recommendations with priority
4. **Sprint Plan Items** — Stories/tasks derived from this discipline, mapped to sprint IDs
5. **Blockers from Other Teams** — Explicit section listing cross-team dependencies (even if none exist, state "No blockers identified")

### cross-team-blocker-matrix.md
1. **Matrix Header** — Date, phases included, disciplines covered
2. **Blocker Inventory** — Each dependency with:
   - Blocker ID
   - Source discipline → Target discipline
   - Description
   - Classification: `BLOCKING` or `ADVISORY`
   - Resolution status: `OPEN` | `RESOLVED` | `DEFERRED`
3. **Summary** — Total blockers by classification and status

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] All 6 files are present in `.github/docs/synthesis/`
- [ ] Master report contains all 7 mandatory sections
- [ ] Each department report contains all 5 mandatory sections
- [ ] Every department report has an explicit "Blockers from Other Teams" section (even if empty)
- [ ] Cross-team blocker matrix classifies every dependency as BLOCKING or ADVISORY
- [ ] No open `UNCERTAIN:` or `INSUFFICIENT_DATA:` items without a corresponding entry in Open Items
- [ ] Sprint Plan Items reference valid sprint IDs
- [ ] All findings include source references to phase outputs

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All 6 documents produced, all checks passed
- `PARTIAL` — Some documents produced (e.g., single-discipline run), documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
