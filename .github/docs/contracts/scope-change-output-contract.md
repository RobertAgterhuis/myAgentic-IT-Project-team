# Scope Change Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Scope Change Agent (Agent 37)

---

## PURPOSE
Ensures that fundamental project premise changes (business model pivots, core architecture changes, target audience shifts) are processed through a structured scope change protocol. The Scope Change Agent produces a delta report, places affected tickets on backlog hold, and prepares Sprint Gate reconciliation data to update the Master Synthesis.

---

## OUTPUT FILE
**Location:** `.github/docs/synthesis/scope-change-[N].md`
**Format:** Markdown

---

## MANDATORY SECTIONS

### 1. Scope Change Header
- Scope change number (sequential N)
- Date of scope change
- Dimension affected: `BUSINESS` | `TECH` | `UX` | `MARKETING` | `ALL`
- Change description (user-provided)
- Initiator reference

### 2. Premise Comparison
- **Old Premise:** The previous fundamental assumption or direction
- **New Premise:** The updated fundamental assumption or direction
- **Rationale:** Why the change is necessary

### 3. Affected Tickets
For each affected work item:
- **Story/Task ID**
- **Current Status:** (e.g., TODO, IN_PROGRESS, DONE)
- **New Status:** `SCOPE_CHANGE_HOLD` | `CANCELLED` | `REQUEUED`
- **Reason:** Why this ticket is affected
- **Re-analysis Required:** YES / NO

### 4. Backlog Hold Report
- Total tickets placed on hold
- Total tickets cancelled
- Total tickets requeued
- Tickets grouped by sprint ID

### 5. Re-Analysis Plan
- Which dimension(s) require re-analysis
- Which phase agents must re-execute
- Expected output: updated phase documents
- Critic + Risk validation scheduling

### 6. Sprint Gate Reconciliation
- Impact on current/next Sprint Gate
- Sprint IDs affected
- Recommended Sprint Gate actions: `HOLD` | `PROCEED_WITH_DELTA` | `RESTART_SPRINT`

### 7. Master Synthesis Update Instructions
- Sections of `final-report-master.md` that must be updated
- Cross-team blocker matrix entries to add or modify

### 8. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] Dimension is explicitly stated (BUSINESS, TECH, UX, MARKETING, or ALL)
- [ ] Old premise and new premise are both documented (not left blank)
- [ ] Every affected ticket has a status transition (SCOPE_CHANGE_HOLD, CANCELLED, or REQUEUED)
- [ ] Backlog Hold Report totals match the Affected Tickets list
- [ ] Re-Analysis Plan identifies at least one agent for re-execution
- [ ] Sprint Gate Reconciliation is present with recommended action
- [ ] Master Synthesis update instructions are present

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
