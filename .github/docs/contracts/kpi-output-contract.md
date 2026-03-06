# KPI Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the KPI Agent (Agent 29)

---

## PURPOSE
Ensures every sprint's performance is measured against defined KPIs for velocity, quality, security, and performance. The KPI Agent produces a machine-readable JSON report and a human-readable trend analysis, emitting alerts for off-track metrics that feed into Sprint Gate decision-making.

---

## OUTPUT FILES
**Location:**
- `.github/docs/metrics/sprint-[SP-N]-kpi.json`
- `.github/docs/metrics/kpi-trend.md`

**Format:** JSON + Markdown

---

## MANDATORY SECTIONS

### sprint-[SP-N]-kpi.json
Valid JSON object containing:
```json
{
  "sprintId": "SP-N",
  "date": "ISO 8601",
  "velocity": {
    "planned": <number>,
    "completed": <number>,
    "unit": "story_points | stories"
  },
  "quality": {
    "testPassRate": <percentage>,
    "bugCount": <number>,
    "codeReviewFindings": <number>
  },
  "security": {
    "secretScanResult": "PASSED | FAILED",
    "vulnerabilitiesFound": <number>,
    "criticalVulnerabilities": <number>
  },
  "performance": {
    "buildTime": <seconds>,
    "testExecutionTime": <seconds>,
    "deploymentTime": <seconds | null>
  },
  "alerts": [
    {
      "metric": "<metric_name>",
      "status": "ON_TRACK | AT_RISK | OFF_TRACK",
      "threshold": "<threshold_value>",
      "actual": "<actual_value>",
      "recommendation": "<action>"
    }
  ]
}
```

### kpi-trend.md

#### 1. Trend Header
- Date range covered
- Sprints included

#### 2. Velocity Trend
- Sprint-over-sprint velocity comparison
- Trend direction: IMPROVING | STABLE | DECLINING

**Cumulative Trend Data Table:**

| Sprint | Planned | Completed | Delta | Trend |
|--------|---------|-----------|-------|-------|
| SP-1   | N       | N         | ±N    | —     |
| SP-2   | N       | N         | ±N    | IMPROVING / STABLE / DECLINING |

#### 3. Quality Trend
- Test pass rate trend
- Bug count trend
- Code review finding trend

#### 4. Security Trend
- Secret scan results across sprints
- Vulnerability trend

#### 5. KPI Alerts
- All `KPI_ALERT` items for `OFF_TRACK` or `AT_RISK` metrics
- Recommended corrective actions

#### 6. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `sprint-[SP-N]-kpi.json` exists and is valid JSON
- [ ] All four KPI categories are present (velocity, quality, security, performance)
- [ ] `KPI_ALERT` is emitted for every `OFF_TRACK` metric
- [ ] `kpi-trend.md` is updated with the latest sprint data
- [ ] No fabricated metrics (all values must be sourced from sprint artifacts)
- [ ] Alert recommendations are actionable (not generic)

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
