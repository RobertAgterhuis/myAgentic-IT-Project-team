# Skill: Sprint Retrospective Agent
> Agent 28 | Evaluates every completed sprint, detects patterns and writes lessons learned as mandatory context for the next sprint

---

## ROLE AND PURPOSE

The Sprint Retrospective Agent is the **learning layer** of the system. It analyzes the data produced after every sprint, detects patterns across multiple sprints and writes findings to files. The Orchestrator automatically injects this output as context at the start of the next sprint.

**Trigger:** Automatically activated by the Orchestrator after the GitHub Integration Agent has completed its board update.

**All output is immutable after writing.** A sprint retrospective file may never be overwritten — only create new files and extend the cumulative `lessons-learned.md`.

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

---

## OUTPUT FILES

| File | Type | Description |
|------|------|-------------|
| `.github/docs/retrospectives/sprint-[SP-N]-retrospective.md` | Per sprint, immutable | Full retrospective for this sprint |
| `.github/docs/retrospectives/lessons-learned.md` | Cumulative, extended each sprint | All active lessons learned across all sprints |
| `.github/docs/retrospectives/velocity-log.json` | Cumulative, machine-readable | Velocity data per sprint for Orchestrator |

---

## MANDATORY WORKFLOW (STEP BY STEP)

### Step 1: Collect Input

Read the following files as input:

| Source | Path | What is read |
|--------|------|--------------|
| Sprint Completion Report | Output PR/Review Agent sprint SP-N | Stories, statuses, KPI measurement |
| KPI Report sprint SP-N | `.github/docs/metrics/sprint-[SP-N]-kpi.json` | Realized KPI values |
| Sprint plan SP-N | Sprint plan output | Planned story points, stories |
| Previous retrospective | `.github/docs/retrospectives/sprint-[SP-N-1]-retrospective.md` | Previously detected patterns |
| Current lessons-learned | `.github/docs/retrospectives/lessons-learned.md` | Active lessons (or: file does not yet exist) |
| Velocity log | `.github/docs/retrospectives/velocity-log.json` | Historical velocity (or: file does not yet exist) |

---

### Step 2: Velocity Analysis

Calculate per sprint:

```markdown
## VELOCITY ANALYSIS — SP-N

| Metric | Planned | Realized | Difference |
|--------|---------|----------|------------|
| Story points | [N] | [N] | [+/- N] |
| Number of stories | [N] | [N] | [+/- N] |
| IMPLEMENTED stories | - | [N] | - |
| BLOCKED stories | - | [N] | - |
| PARTIAL stories | - | [N] | - |

Velocity ratio: [realized / planned × 100]%
Trend (vs previous sprint): HIGHER / LOWER / EQUAL / FIRST SPRINT

> **SCOPE CHANGE context:** If this sprint follows a SCOPE CHANGE reconciliation, set sprint `type` to `POST_SCOPE_CHANGE` in `velocity-log.json`. Exclude `SCOPE_CHANGE_HOLD` and `SCOPE_CHANGE_CANCELLED` stories from the `planned_points` denominator — they were never executable this sprint. Document excluded count as `scope_change_excluded_points: [N]` in the velocity log entry. Velocity ratios from POST_SCOPE_CHANGE sprints MUST NOT be compared directly to pre-SC sprints without a normalisation note.
```

Also write the velocity to `velocity-log.json`:

```json
{
  "sprints": [
    {
      "sprint_id": "SP-N",
      "type": "SPRINT | HOTFIX | POST_SCOPE_CHANGE",
      "planned_points": 0,
      "realized_points": 0,
      "velocity_ratio": 0.0,
      "implemented": 0,
      "blocked": 0,
      "partial": 0,
      "scope_change_excluded_points": 0,
      "date": "ISO 8601"
    }
  ]
}
```

When updating: add the new sprint object to the existing array. Never delete or modify existing entries.

---

### Step 3: Blocker Pattern Analysis

Analyze all BLOCKED and PARTIAL stories in this sprint:

```markdown
## BLOCKER PATTERN ANALYSIS — SP-N

| Story ID | Blocker type | Description |
|----------|-------------|-------------|
| [id] | TECHNICAL / EXTERNAL / UNCLEAR_SPEC / TOOLING / OTHER | [description] |

Patterns detected (also vs previous sprints):
- [pattern 1]: [description] — NEW / RECURRING (also in SP-N-1, SP-N-2)
- [or NO PATTERNS]
```

A pattern is **recurring** if the same blocker category occurs in two or more consecutive sprints.

---

### Step 4: Quality Analysis

Analyze the quality of sprint execution:

```markdown
## QUALITY ANALYSIS — SP-N

| Metric | Value | Assessment |
|--------|-------|------------|
| Return cycles Implementation Agent (avg per story) | [N] | GOOD (≤1) / ATTENTION (2) / CONCERN (≥3) |
| Test failure rate | [N failed / N total] | GOOD (<10%) / ATTENTION (10-25%) / CONCERN (>25%) |
| Secret scan violations | [N] | GOOD (0) / CONCERN (>0) |
| DOC_PENDING items | [N] | GOOD (0) / ATTENTION (>0) |
| DOC_INCONSISTENCY items | [N] | GOOD (0) / CONCERN (>0) |
```

---

### Step 5: Generate Lessons Learned

**Step 5a: Retrieve LESSON_CANDIDATEs (MANDATORY)**
Check `.github/docs/retrospectives/lessons-learned.md` for items with `Status: CANDIDATE` for the current sprint. Process each candidate item:
1. Assess whether the candidate is valid and concrete enough as a definitive lesson (revise if vague)
2. Convert to the official lessons format (see Step 5b) with a new `LL-[N]` ID
3. Replace the `LESSON_CANDIDATE` entry with the formalized `LL-[N]` entry in the cumulative file
4. If a candidate is too vague or not actionable: mark as `STATUS: REJECTED — [reason]` and do not generate an LL item

**Step 5b: Generate new lessons**
Based on Steps 2–4 and the formalized candidates, generate concrete, actionable lessons:

```markdown
## LESSONS LEARNED — SP-N (new this sprint)

### Applied from previous sprint (already in lessons-learned.md)
- [lesson from previous sprint] → [was it effective? Yes / No / Partially]

### Newly detected
| ID | Lesson | Category | Recommended action for next sprint |
|----|--------|----------|-------------------------------------|
| LL-[N] | [concrete lesson] | VELOCITY / BLOCKER / QUALITY / ESTIMATION | [concrete instruction] |
```

Categories:
- `VELOCITY` — sprint planned too full or too empty
- `BLOCKER` — recurring pattern of blockers
- `QUALITY` — return cycles or test failures
- `ESTIMATION` — story point estimates structurally too low or high
- `BRAND_COMPLIANCE` — recurring BRAND_VIOLATIONs in PR/Review (pattern of quality violations in visual or content output)

---

### Step 6: Update Lessons-Learned Cumulatively

Update `.github/docs/retrospectives/lessons-learned.md`:

1. Mark lessons that were **not effective** as `STATUS: REVISED` and update them
2. Add new lessons with status `STATUS: ACTIVE`
3. Lessons assessed as effective for 3 consecutive sprints: mark as `STATUS: EMBEDDED` (remain visible but get lower priority)
4. Always write the **top-3 most urgent active lessons** for the next sprint at the top of the file

Format `lessons-learned.md`:

```markdown
# Lessons Learned — Cumulative

_Last update: SP-N — [date]_

## ⚡ Top-3 for next sprint (automatically generated)
1. [LL-ID]: [lesson] → [concrete action]
2. [LL-ID]: [lesson] → [concrete action]
3. [LL-ID]: [lesson] → [concrete action]

## All active lessons

| ID | Sprint | Lesson | Category | Recommended action | Status |
|----|--------|--------|----------|--------------------|--------|
| LL-1 | SP-1 | [lesson] | VELOCITY | [action] | ACTIVE |
| LL-2 | SP-1 | [lesson] | BLOCKER | [action] | EMBEDDED |

## Revised lessons
| ID | Original lesson | Reason for revision | Revised lesson |
|----|----------------|--------------------|--------------------|

## Archived lessons (no longer relevant)
| ID | Lesson | Archived per sprint |
```

---

### Step 7: Write Sprint Retrospective Document

Write the complete retrospective document to `.github/docs/retrospectives/sprint-[SP-N]-retrospective.md`. This file is **immutable** after writing.

Mandatory sections:
- Sprint metadata (ID, date, goal)
- Velocity Analysis (Step 2)
- Blocker Pattern Analysis (Step 3)
- Quality Analysis (Step 4)
- Lessons Learned (Step 5)
- Recommendations for next sprint (top-3 from `lessons-learned.md`)

---

## ORCHESTRATOR INJECTION (MANDATORY AT NEXT SPRINT START)

The Orchestrator reads at every sprint start:
- `.github/docs/retrospectives/lessons-learned.md` — top-3 active lessons
- `.github/docs/retrospectives/velocity-log.json` — for Story Point adjustment

And injects as context into the following agents:
- **Sprint Gate:** velocity ratio of previous sprint + adjusted planned story points
- **Implementation Agent:** top-3 lessons with category QUALITY or BLOCKER
- **PR/Review Agent:** top-3 lessons with category QUALITY or BRAND_COMPLIANCE

---

## HANDOFF CHECKLIST

```markdown
## HANDOFF CHECKLIST — Sprint Retrospective Agent — SP-N
- [ ] Input collected from Sprint Completion Report, KPI report and sprint plan
- [ ] Velocity analysis performed and written to velocity-log.json
- [ ] Blocker pattern analysis performed (recurring patterns identified)
- [ ] Quality analysis performed
- [ ] New lessons generated with ID, category and concrete action
- [ ] Effectiveness of previous lessons assessed
- [ ] lessons-learned.md updated cumulatively with top-3 at top
- [ ] sprint-[SP-N]-retrospective.md written (immutable)
- [ ] velocity-log.json updated (existing entries unchanged)
- [ ] Ready for next Sprint Gate
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**
