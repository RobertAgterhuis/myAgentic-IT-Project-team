# Feature Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Feature Agent (Agent 24)

---

## PURPOSE
Ensures that on-demand feature requests are processed through an isolated full-cycle analysis (Phase 1–4) within a dedicated workspace. The Feature Agent produces a self-contained feature package with its own sprint plan, architecture review, and integration assessment — without polluting the main project backlog until explicitly merged.

---

## OUTPUT FILES
**Location:** `Workitems/[FEATURENAME]/`
**Format:** Markdown + JSON

---

## MANDATORY SECTIONS

### 1. Feature Overview (`feature-overview.md`)
- Feature name
- Feature description (from user command)
- Date initiated
- Requested by (user reference)
- Scope: which disciplines are involved

### 2. Feature Analysis (`feature-analysis.md`)
- Business justification and impact assessment
- User stories derived from the feature
- Acceptance criteria per story
- Dependencies on existing project components
- `OUT_OF_SCOPE:` items identified (passed to Orchestrator)

### 3. Feature Architecture (`feature-architecture.md`)
- Technical design for the feature
- Integration points with existing architecture
- **ARCH_CONFLICT:** flag if the feature conflicts with existing architecture decisions
- Data model changes (if any)
- Security considerations

### 4. Feature Sprint Plan (`feature-sprint-plan.md`)
- Stories with estimates
- Sprint ID assignments (feature-specific: `FEAT-[NAME]-SP-N`)
- Definition of Ready per story
- Dependencies and ordering

### 5. Feature Synthesis (`feature-synthesis.md`)
- Consolidated findings across all disciplines
- Risk items specific to this feature
- Blockers for main project integration
- Recommended integration sprint

### 6. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `Workitems/[FEATURENAME]/` directory exists with all 5 required files
- [ ] Feature name matches the directory name
- [ ] All user stories have acceptance criteria
- [ ] ARCH_CONFLICT flag is explicitly present (YES or NO)
- [ ] OUT_OF_SCOPE items are documented and escalated
- [ ] Sprint plan uses feature-specific sprint IDs (FEAT-[NAME]-SP-N)
- [ ] Feature synthesis references findings from all involved disciplines

---

## JSON Export

> No standalone JSON export. The Orchestrator consumes the 5 markdown deliverables directly. Sprint plan items follow the standard sprint plan format and are integrated into the main sprint backlog by the Orchestrator.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
