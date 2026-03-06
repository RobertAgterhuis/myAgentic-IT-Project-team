# Retrospective Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Retrospective Agent (Agent 28)

---

## PURPOSE
Ensures every sprint concludes with a structured retrospective that captures what went well, what needs improvement, and actionable lessons learned. The Retrospective Agent updates the velocity log, formalizes all `LESSON_CANDIDATE` items into permanent lessons, and produces an immutable retrospective file that cannot be altered after creation.

---

## OUTPUT FILES
**Location:**
- `.github/docs/retrospectives/sprint-[SP-N]-retrospective.md` (immutable once written)
- `.github/docs/metrics/velocity-log.json` (updated)
- `.github/docs/retrospectives/lessons-learned.md` (updated)

**Format:** Markdown + JSON

---

## MANDATORY SECTIONS

### sprint-[SP-N]-retrospective.md

#### 1. Retrospective Header
- Sprint ID
- Date of retrospective
- Participants / agents involved
- Sprint goal (original) and outcome (met / partially met / not met)

#### 2. What Went Well
- Itemized list of positive outcomes with source references
- Practices to continue

#### 3. What Needs Improvement
- Itemized list of issues encountered with source references
- Root cause analysis per issue (where determinable)

#### 4. Action Items
- Concrete improvement actions for next sprint
- Owner (discipline or agent) per action item
- Priority: HIGH | MEDIUM | LOW

#### 5. LESSON_CANDIDATE Formalization
- Every `LESSON_CANDIDATE` from the sprint listed
- Each formalized into a permanent lesson with:
  - Lesson ID
  - Context: what happened
  - Lesson: what was learned
  - Application: how to apply in future sprints
- Confirmation that `lessons-learned.md` has been updated

#### 6. Velocity Log Update
- Planned vs. completed story points / stories
- Confirmation that `velocity-log.json` has been updated with this sprint's data

#### 7. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

### velocity-log.json (updated entry)
```json
{
  "sprintId": "SP-N",
  "planned": <number>,
  "completed": <number>,
  "unit": "story_points | stories",
  "sprintGoalMet": true | false,
  "date": "ISO 8601"
}
```

### lessons-learned.md (appended entries)
- New lessons appended with Lesson ID, context, lesson, and application guidance

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `sprint-[SP-N]-retrospective.md` exists and is marked immutable (no subsequent edits)
- [ ] All 3 core sections present: What Went Well, What Needs Improvement, Action Items
- [ ] Every `LESSON_CANDIDATE` from the sprint is formalized (none dropped)
- [ ] `velocity-log.json` contains an entry for this sprint
- [ ] `lessons-learned.md` is updated with new lessons from this sprint
- [ ] Sprint goal outcome is explicitly stated (met / partially met / not met)
- [ ] Action items have owners and priorities

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

---

## JSON Export

The `velocity-log.json` entry (see schema above) serves as the JSON export for this contract. The retrospective narrative is Markdown-only.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
