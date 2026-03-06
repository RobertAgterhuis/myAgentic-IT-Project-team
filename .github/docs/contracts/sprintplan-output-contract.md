````markdown
# Sprint Plan Output Contract
> Version: 1.2 | Applies to all sprint plan deliverables of all agents

---

## PURPOSE
This contract defines the mandatory structure for the **Sprint Plan** deliverable per agent.
A sprint plan without capacity assumption, team assignment, story type classification, dependencies, parallel tracks, blocker register, or measurable outcomes is NOT valid.

---

## Output File Path

`.github/docs/phases/phase-N-[discipline]-sprintplan.md`

Where `N` is the phase number (1–4) and `[discipline]` is the lowercase discipline name (e.g., `phase-3-ux-sprintplan.md`).

---

## FUNDAMENTAL PRINCIPLE: TRACK INDEPENDENCE

**CRITICAL RULE:** A blocker in a CONTENT-, DESIGN-, or ANALYSIS-story may NEVER block a CODE-story in the same sprint, and vice versa.

Every story has a `story_type`. This type determines which **execution pipeline** the story runs through:

| Story Type | Description | Execution Pipeline |
|------------|-------------|-------------------|
| `CODE` | Modify or add production code | Implementation Agent → Test Agent → PR/Review Agent |
| `INFRA` | Infrastructure, CI/CD, configuration | Implementation Agent → Test Agent → PR/Review Agent |
| `DESIGN` | Design, wireframes, prototypes, style guides | Manual or design tooling |
| `CONTENT` | Copy, campaigns, marketing materials, texts | Manual or content tooling |
| `ANALYSIS` | Research, data analysis, reporting, strategy documents | Manual |

**Blockers are track-bound:**
- An EXTERN blocker on story type `CONTENT` (e.g. waiting for client approval of campaign text) **never blocks** a `CODE` story in the same sprint.
- Parallel tracks are ALWAYS grouped per story type, so the code team is never dependent on the progress of non-technical tracks.
- The Orchestrator routes automatically based on `story_type`. CODE and INFRA stories go to the autonomous implementation pipeline. Other types follow their own throughput time.

---

## MANDATORY ASSUMPTIONS BEFORE SPRINT PLAN

Before a sprint plan is created, the following assumptions MUST be documented EXPLICITLY:

```markdown
## Sprint Plan Assumptions
- Team composition: [per team: name, roles, number of people]
  - Team A – [name]: [roles] – [n people] – capacity: [SP or hours/sprint]
  - Team B – [name]: [roles] – [n people] – capacity: [SP or hours/sprint]
  (add teams based on available data, or mark as INSUFFICIENT_DATA:)
- Sprint duration: [n weeks]
- Technology stack: [relevant for the sprint]
- Prerequisites: [what must be in place before sprint 1 starts]
```

If these assumptions are NOT available: mark as `INSUFFICIENT_DATA:` and do NOT create a fictional sprint plan.

---

## MANDATORY SCHEMA

### MARKDOWN STRUCTURE

```markdown
# Sprint Plan – [Discipline] – [Date]

## Metadata
- Agent: [name]
- Phase: [1 / 2 / 3 / 4]
- Based on recommendations: [reference document]
- Date: [ISO 8601]
- Total scope: [n sprints]
- Mode: [CREATE | AUDIT]

## Assumptions
[See mandatory assumptions above]

## Sprint [N] – [Sprint name]

### Goal
[What is the outcome of this sprint – not the output, but the result for the business/user]

### Stories

| Story ID | Description | Type | Team | Acceptance Criteria | Story Points | Dependencies | Blocker | Risk |
|----------|-------------|------|------|-------------------|--------------|-----------------|---------|--------|
| SP-N-001 | [concrete task] | CODE | [Team A] | [SMART, testable] | [number] | [story ID or external] | [NONE / INTERN: description / EXTERN: description + owner] | [optional] |

> **Type**: required. Choose from: `CODE`, `INFRA`, `DESIGN`, `CONTENT`, `ANALYSIS`. Determines the execution pipeline.  
> **Team**: required per story. Use team names from assumptions, or `INSUFFICIENT_DATA:`.  
> **Blocker**: use `NONE` if there is no blocker. Intern = resolvable within the project. Extern = outside project control (vendor, client, legislation). Always mention owner + escalation route for EXTERN.  
> **TRACK INDEPENDENCE:** A blocker from a CONTENT/DESIGN/ANALYSIS story may NEVER appear as a blocker on a CODE/INFRA story.

### Parallel Tracks
Explicitly identify which stories can be executed **in parallel** (no mutual dependency). Group first by story type, then by team:

| Track | Type | Stories | Team(s) | Start condition |
|-------|------|---------|---------|----------------|
| Track 1 (Code) | CODE | SP-N-001, SP-N-002 | Team Dev | Sprint N start |
| Track 2 (Design) | DESIGN | SP-N-003 | Team UX | Sprint N start |
| Track 3 (Content) | CONTENT | SP-N-004 | Team Marketing | Sprint N start |

> **PROHIBITION:** Do not claim a parallel track if a hidden dependency exists. Document doubt as `UNCERTAIN:`.  
> **RULE:** CODE/INFRA tracks and DESIGN/CONTENT/ANALYSIS tracks are by definition independent of each other's blockers. Document this explicitly.

### Blocker Register (Sprint N)
All blockers from stories in this sprint consolidated:

| Blocker ID | Type | Description | Owner | Expected Resolution | Escalation if not resolved by |
|------------|------|-------------|---------|--------------------|---------------------------------|
| BLK-N-001 | INTERN / EXTERN | [description] | [name/role] | [date or sprint] | [escalation route] |

### Sprint KPIs
| KPI | Baseline | Target after sprint | Measurement method |
|-----|----------|-----------------|-------------|
| [name] | [value] | [value] | [method] |

### Definition of Done (Sprint N)
- [ ] All stories complete (acceptance criteria met)
- [ ] Code review performed
- [ ] Tests passed
- [ ] KPI measurement performed
- [ ] Documentation updated
- [ ] No new CRITICAL_FINDING introduced

## Dependency Overview
Tabular or visual overview of story dependencies across sprints:

| Story | Depends on | Type | Blocking? |
|-------|----------------|------|------------|
| SP-2-001 | SP-1-003 | Internal story | Yes |
| SP-2-002 | External API delivery | EXTERN | Yes – BLK-2-001 |

## Parallel Tracks Overview
Overview of all parallel workflows across all sprints:

| Sprint | Track | Stories | Teams |
|--------|-------|---------|-------|
| Sprint 1 | Track 1 | SP-1-001, SP-1-002 | Team A |
| Sprint 1 | Track 2 | SP-1-003 | Team B |

## Sprint Plan Risk Log
| Risk | Probability | Impact | Mitigation | Sprint |
|--------|------|--------|-----------|--------|

## Consolidated Blocker Register
All blockers across all sprints:

| Blocker ID | Sprint | Type | Description | Owner | Escalation if not resolved by |
|------------|--------|------|-------------|---------|----------------------------------|

## HANDOFF CHECKLIST
- [ ] Sprint plan assumptions are explicitly documented (including teams with capacity)
- [ ] Every story has a story type classification (CODE/INFRA/DESIGN/CONTENT/ANALYSIS)
- [ ] Every story has a team assignment (or INSUFFICIENT_DATA:)
- [ ] Every story has acceptance criteria
- [ ] Every story has a story point estimate (or INSUFFICIENT_DATA:)
- [ ] Every story has a Blocker field (minimum NONE)
- [ ] All EXTERN blockers have an owner and escalation route
- [ ] Parallel tracks are identified per sprint
- [ ] Sprint KPIs are SMART formulated
- [ ] Dependency overview is completed
- [ ] Consolidated Blocker Register is present
- [ ] Definition of Done is present per sprint
- [ ] No fictional capacity assumptions
- [ ] If cycle_type is SCOPE_CHANGE: all stories in the affected dimension that are no longer executable are tagged `SCOPE_CHANGE_HOLD SC-[N]` or `SCOPE_CHANGE_CANCELLED SC-[N]`; REQUEUED stories carry restored status; unaffected stories carry original status (or `NOT_APPLICABLE — normal cycle`)
- [ ] JSON export is valid
```

---

## JSON EXPORT SCHEMA

```json
{
  "metadata": {
    "agent": "string",
    "phase": "1 | 2 | 3 | 4",
    "date": "ISO 8601",
    "based_on_recommendations": "string",
    "total_sprints": 0,
    "mode": "CREATE | AUDIT"
  },
  "assumptions": {
    "teams": [
      {
        "name": "string",
        "roles": ["string"],
        "capacity_per_sprint": "string | INSUFFICIENT_DATA"
      }
    ],
    "sprint_duration_weeks": 2,
    "prerequisites": ["string"]
  },
  "sprints": [
    {
      "sprint_number": 1,
      "name": "string",
      "goal": "string",
      "sprint_status": "QUEUED | IN_PROGRESS | COMPLETED | BACKLOG | BACKLOG (CASCADE from SP-N) | SCOPE_CHANGE_HOLD SC-[N] | SCOPE_CHANGE_CANCELLED SC-[N]",
      "depends_on_sprints": ["SP-N"],
      "parallel_tracks": [
        {
          "track": "Track 1 (Code)",
          "story_type": "CODE | INFRA | DESIGN | CONTENT | ANALYSIS",
          "stories": ["SP-1-001", "SP-1-002"],
          "teams": ["Team Dev"],
          "start_condition": "string"
        }
      ],
      "stories": [
        {
          "id": "SP-1-001",
          "description": "string",
          "story_type": "CODE | INFRA | DESIGN | CONTENT | ANALYSIS",
          "team": "string | INSUFFICIENT_DATA",
          "acceptance_criteria": ["string"],
          "story_points": 0,
          "dependencies": ["string"],
          "blocker": {
            "type": "NONE | INTERN | EXTERN",
            "description": "string | null",
            "owner": "string | null",
            "escalation_if_unresolved_by": "string | null"
          },
          "risk": "string | null",
          "recommendation_ref": "REC-001",
          "story_status": "QUEUED | IN_PROGRESS | COMPLETED | BACKLOG | SCOPE_CHANGE_HOLD SC-[N] | SCOPE_CHANGE_CANCELLED SC-[N] | REQUEUED"
        }
      ],
      "blocker_register": [
        {
          "id": "BLK-1-001",
          "type": "INTERN | EXTERN",
          "description": "string",
          "owner": "string",
          "expected_resolution": "string",
          "escalation_route": "string"
        }
      ],
      "kpis": [
        {
          "kpi": "string",
          "baseline": "string | null",
          "target": "string",
          "measurement_method": "string"
        }
      ],
      "definition_of_done": ["string"]
    }
  ],
  "dependency_map": [
    {
      "story_id": "SP-1-001",
      "depends_on": ["SP-1-000"],
      "blocking": true
    }
  ],
  "parallel_tracks_overview": [
    {
      "sprint": 1,
      "track": "Track 1",
      "stories": ["SP-1-001"],
      "teams": ["Team A"]
    }
  ],
  "consolidated_blocker_register": [
    {
      "id": "BLK-1-001",
      "sprint": 1,
      "type": "INTERN | EXTERN",
      "description": "string",
      "owner": "string",
      "escalation_route": "string"
    }
  ],
  "risk_log": [
    {
      "risk": "string",
      "probability": "High | Medium | Low",
      "impact": "High | Medium | Low",
      "mitigation": "string",
      "sprint": 0
    }
  ],
  "handoff_checklist": {
    "assumptions_documented": true,
    "all_stories_have_ac": true,
    "story_points_estimated": true,
    "smart_kpis": true,
    "dependencies_documented": true,
    "dod_present": true,
    "no_fictional_capacity": true,
    "scope_change_handling": "true | NOT_APPLICABLE",
    "json_valid": true,
    "ready_for_handoff": true
  }
}
```

---

## VALIDATION CRITERIA
A sprint plan is REJECTED if:
- Capacity assumptions per team are missing (not marked as INSUFFICIENT_DATA:)
- Stories have no team assignment
- Stories have no story type classification (CODE/INFRA/DESIGN/CONTENT/ANALYSIS)
- A CODE/INFRA story has a blocker originating from a DESIGN/CONTENT/ANALYSIS story
- Stories have no acceptance criteria
- Story points are missing without marking
- Sprint KPIs are not SMART
- Dependencies are not documented
- Blocker field is missing on a story (even NONE must be explicitly stated)
- EXTERN blockers have no owner or escalation route
- Parallel tracks are not identified (or absent without motivation)

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

````
