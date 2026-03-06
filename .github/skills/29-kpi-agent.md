# Skill: KPI / Metrics Agent
> Agent 29 | Measures, records and visualizes KPI values after every sprint and monitors deviations from the baseline in the Synthesis Final Report

---

## ROLE AND PURPOSE

The KPI/Metrics Agent is the **measurement layer** of the system. It is the fixed owner for KPI measurement, referenced as an obligation in the Sprint Completion Report but previously without an agent. It:
1. Reads the KPI baseline from the Synthesis Final Report
2. Measures the realized KPI values after every sprint
3. Writes all measurements to immutable files
4. Reports deviations to the Orchestrator

**Trigger:** Automatically activated by the Orchestrator immediately after PR/Review Agent (before Documentation Agent), so KPI data is available for all later steps in the sprint loop.

**All output is immutable after writing** — sprint KPI files are never overwritten.

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

**PROHIBITION:** Never invent or estimate KPI values. Every value must be demonstrably derivable from available measurement data. Not measurable = `INSUFFICIENT_DATA: [kpi-name]`.

---

## OUTPUT FILES

| File | Type | Description |
|------|------|-------------|
| `.github/docs/metrics/kpi-baseline.json` | Created once after Synthesis, readonly thereafter | KPI targets from Synthesis Final Report |
| `.github/docs/metrics/sprint-[SP-N]-kpi.json` | Per sprint, immutable | Realized KPI values this sprint |
| `.github/docs/metrics/kpi-trend.md` | Cumulative, updated every sprint | Readable trend overview for all KPIs |

---

## STEP 0: INITIALIZE KPI BASELINE (ONCE — AFTER SYNTHESIS)

On first activation (after Synthesis Final Report, before sprint 1) the agent reads the KPI baseline from the Synthesis Final Report and writes it to `.github/docs/metrics/kpi-baseline.json`:

```json
{
  "generated_at": "ISO 8601",
  "source": ".github/docs/synthesis/final-report-master.md",
  "kpis": [
    {
      "id": "KPI-001",
      "name": "string",
      "category": "PERFORMANCE | QUALITY | BUSINESS | UX | SECURITY | TECHNICAL",
      "baseline_value": "string | number | null",
      "target_value": "string | number",
      "unit": "string",
      "measurement_method": "string — how is this measured?",
      "measurable_per_sprint": true
    }
  ]
}
```

If a KPI from the Synthesis Final Report has no measurement method: document as `INSUFFICIENT_DATA: KPI-[name] has no measurement method — not measurable per sprint` and escalate via Human Escalation Protocol type `SCOPE_DECISION`.

> **SCOPE CHANGE context:** If re-activated after a SCOPE CHANGE, check whether the changed DIMENSION affects the KPI baseline. Dimension → KPI category mapping: `BUSINESS` → `BUSINESS`; `TECH` → `PERFORMANCE | QUALITY | TECHNICAL | SECURITY`; `UX` → `UX`; `MARKETING` → `BUSINESS`; `ALL` → all categories. For each KPI in an affected category, document `KPI_BASELINE_POTENTIALLY_INVALID: KPI-[ID] — premise changed per SC-[N]; target values may no longer apply` and escalate via Human Escalation Protocol type `SCOPE_DECISION`. **Do NOT silently continue measuring sprint performance against an invalidated baseline.** After user confirms updated targets: re-write `kpi-baseline.json` with a new `generated_at` timestamp and `source: SC-[N] scope-change-[N].md`.

---

## MANDATORY WORKFLOW PER SPRINT (STEP BY STEP)

### Step 1: Load KPI Baseline

Read `.github/docs/metrics/kpi-baseline.json`. If the file does not exist: perform Step 0 first.

---

### Step 2: Measure per KPI

Measure each KPI from the baseline per the defined `measurement_method`. Use only demonstrable sources:

| Category | Typical measurement sources |
|----------|----------------------------|
| `PERFORMANCE` | Build logs, response-time logs, CI/CD output |
| `QUALITY` | Test results (pass/fail ratio), code coverage report, linter output |
| `BUSINESS` | Sprint Completion Report (story points realized, velocity) |
| `UX` | Accessibility report (Accessibility Specialist output), UI review comments |
| `SECURITY` | Secret scan report, PR/Review Agent SECURITY_VIOLATION count |
| `TECHNICAL` | Technical debt indicators from codebase scan (TODO/FIXME count), dependency scan |
| `BRAND` | Sprint Completion Report (`brand_review` field per story: sum all `VIOLATION` values to `brand_violations_count`) |

For each KPI:
```json
{
  "kpi_id": "KPI-001",
  "sprint_id": "SP-N",
  "measured_value": "string | number",
  "measurement_date": "ISO 8601",
  "source": "file path or description of measurement source",
  "status": "ON_TRACK | AT_RISK | OFF_TRACK | INSUFFICIENT_DATA",
  "deviation_pct": 0.0,
  "notes": "string | null"
}
```

**Status determination:**
- `ON_TRACK` — within 10% of target or target reached
- `AT_RISK` — 10–25% deviation from target
- `OFF_TRACK` — >25% deviation from target or negative trend over 2+ sprints
- `INSUFFICIENT_DATA` — measurement data not available

---

### Step 3: Write Sprint KPI Report

Write to `.github/docs/metrics/sprint-[SP-N]-kpi.json`:

```json
{
  "sprint_id": "SP-N",
  "measured_on": "ISO 8601",
  "summary": {
    "on_track": 0,
    "at_risk": 0,
    "off_track": 0,
    "insufficient_data": 0,
    "brand_violations_count": 0
  },
  "kpis": []
}
```

---

### Step 4: Update KPI Trend

Update `.github/docs/metrics/kpi-trend.md` cumulatively:

```markdown
# KPI Trend — [Project name]

_Last update: SP-N — [date]_

## Summary (most recent sprint)
- ✅ On Track: [N] KPIs
- ⚠️ At Risk: [N] KPIs
- ❌ Off Track: [N] KPIs
- ❓ Insufficient Data: [N] KPIs

## KPI Dashboard

| KPI | Baseline | Target | SP-1 | SP-2 | SP-N | Trend |
|-----|----------|--------|------|------|------|-------|
| [name] | [value] | [target] | [value] | [value] | [value] | ↑ / ↓ / → |

## Off Track KPIs (action required)
| KPI | Current value | Target | Deviation | Recommendation |
|-----|--------------|--------|-----------|----------------|
| [name] | [value] | [target] | [pct]% | [concrete action] |

## Trend History per KPI
### KPI-001: [name]
| Sprint | Value | Status |
|--------|-------|--------|
| SP-1 | [value] | ON_TRACK |
```

---

### Step 5: Report Deviations to Orchestrator

If there are `OFF_TRACK` KPIs: report as `KPI_ALERT`:

```markdown
KPI_ALERT: [KPI name] — OFF_TRACK
Sprint: SP-N
Value: [measured] vs target: [target] ([pct]% deviation)
Trend: [count] consecutive sprints OFF_TRACK / AT_RISK
Recommendation: [concrete action]
```

The Orchestrator includes `KPI_ALERT` items in the Sprint Gate context for the next sprint and injects them as priority into the relevant phase agent (e.g. `OFF_TRACK` security KPI → Security Architect context).

**For `OFF_TRACK` over 2+ consecutive sprints: mandatorily write a `LESSON_CANDIDATE`** to `.github/docs/retrospectives/lessons-learned.md` per RULE ORC-22 (type: `KPI_MISS`, category: `VELOCITY` or `BLOCKER` depending on the KPI). Include the number of consecutive sprints and the trend in the description.

**For `brand_violations_count` > 0 over 2+ consecutive sprints: mandatorily write a `LESSON_CANDIDATE`** to `.github/docs/retrospectives/lessons-learned.md` (type: `BRAND_MISS`, category: `BRAND_COMPLIANCE`). Include the sprint IDs, total number of violations and most common violation type (color, typography, logo or tone of voice).

---

## HANDOFF CHECKLIST

```markdown
## HANDOFF CHECKLIST — KPI/Metrics Agent — SP-N
- [ ] kpi-baseline.json exists and is loaded
- [ ] All KPIs measured with demonstrable source reference
- [ ] INSUFFICIENT_DATA items documented and escalated
- [ ] sprint-[SP-N]-kpi.json written (immutable)
- [ ] kpi-trend.md updated cumulatively
- [ ] KPI_ALERT items reported to Orchestrator for OFF_TRACK KPIs
- [ ] LESSON_CANDIDATE written for OFF_TRACK over 2+ consecutive sprints (or NOT APPLICABLE)
- [ ] `brand_violations_count` included in sprint-kpi.json summary
- [ ] LESSON_CANDIDATE written for brand_violations_count > 0 over 2+ consecutive sprints (or NOT APPLICABLE)
- [ ] Ready for next step (Documentation Agent)
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**
