# GitHub Integration Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the GitHub Integration Agent (Agent 27)

---

## PURPOSE
Ensures all project work items, sprint statuses, and workflow configurations are accurately synchronized with the GitHub project board. The GitHub Integration Agent operates in two modes: initial publication (after Synthesis) and sprint update (after Documentation), producing a sync report that confirms the state of all issues, labels, milestones, and board columns.

---

## OUTPUT FILE
**Location:** `.github/docs/github/sync-report-[timestamp].md`
**Format:** Markdown

---

## MANDATORY SECTIONS

### 1. Sync Report Header
- Timestamp (ISO 8601)
- Mode: `INITIAL_PUBLICATION` | `SPRINT_UPDATE`
- GitHub project name: `[GITHUB_PROJECT_NAME]`
- Sprint ID (for sprint update mode)

### 2. Issues Created
- Count of new issues created
- Per-issue listing: Issue number, title, labels, assignee, milestone, story ID reference

### 3. Issues Updated
- Count of issues updated
- Per-issue listing: Issue number, field(s) changed, old value → new value

### 4. Issues Closed
- Count of issues closed
- Per-issue listing: Issue number, title, close reason (COMPLETED | CANCELLED | DUPLICATE)

### 5. Project Board Status
- Board columns and issue counts per column
- Issues in incorrect state (if any) flagged for correction
- Milestone progress summary

### 6. Workflow Status
- GitHub Actions workflows status (if configured)
- CI/CD pipeline sync status
- Branch protection rules verification

### 7. Sync Errors
- Any issues that failed to sync (with error details)
- Retry status: `RESOLVED` | `PENDING` | `ESCALATED`

### 8. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] Sync report exists with correct mode (INITIAL_PUBLICATION or SPRINT_UPDATE)
- [ ] All sprint stories have corresponding GitHub issues (no orphaned stories)
- [ ] Closed issues match stories with status DONE or CANCELLED
- [ ] Project board columns reflect current sprint state
- [ ] Sync errors are documented (even if zero)
- [ ] For INITIAL_PUBLICATION: all Synthesis sprint plan items are published as issues
- [ ] For SPRINT_UPDATE: all implemented/closed stories in the sprint are reflected

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
