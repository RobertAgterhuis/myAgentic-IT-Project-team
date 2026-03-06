# Test Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Test Agent (Agent 21)

---

## PURPOSE
Ensures every implemented story is validated through unit tests, integration tests, and acceptance criteria verification before it can be approved for merge. The Test Agent produces a per-story test report that gates the PR/Review Agent's work.

---

## OUTPUT FILE
**Location:** `.github/docs/phase-5/sprint-[SP-N]/test-[STORY-ID].md`
**Format:** Markdown

---

## MANDATORY SECTIONS

### 1. Test Report Header
- Story ID
- Sprint ID (e.g., SP-1)
- Date of test execution
- Implementation Agent output reference (file path)

### 2. Unit Test Results
- Total unit tests executed
- Passed / Failed / Skipped counts
- Per-test listing: test name, status, failure reason (if applicable)
- Code coverage percentage (if measurable)

### 3. Integration Test Results
- Total integration tests executed
- Passed / Failed / Skipped counts
- Per-test listing: test name, status, failure reason (if applicable)
- External dependencies tested (APIs, databases, services)

### 4. Acceptance Criteria Verification
- Each acceptance criterion from the story definition listed explicitly
- Per-criterion verdict: `MET` | `NOT_MET` | `PARTIALLY_MET`
- Evidence or source reference for each verdict

### 5. Regression Check
- Existing tests still passing: YES / NO
- If NO: list of regressions introduced with details

### 6. Verdict
- Overall test verdict: `APPROVED` or `REJECTED`
- If REJECTED: itemized list of failures that must be fixed
- Recommendation: `READY_FOR_REVIEW` | `NEEDS_REWORK`

### 7. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] Test report exists for every story in the sprint
- [ ] All 3 test categories are reported (unit, integration, acceptance)
- [ ] Every acceptance criterion has an explicit verdict
- [ ] No `NOT_MET` acceptance criterion when verdict is APPROVED
- [ ] Regression check is explicitly performed
- [ ] Failed tests include failure reasons (not just "FAILED")

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
