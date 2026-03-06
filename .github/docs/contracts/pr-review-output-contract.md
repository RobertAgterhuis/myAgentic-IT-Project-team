# PR/Review Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the PR/Review Agent (Agent 22)

---

## PURPOSE
Ensures every sprint's code changes undergo code quality review, secret scanning, brand compliance checks, and revert detection before merge approval. The PR/Review Agent produces a Sprint Completion Report and a security scan report, gating the merge of all stories in the sprint.

---

## OUTPUT FILES
**Location:**
- `.github/docs/phase-5/sprint-[SP-N]/sprint-completion-report.md`
- `.github/docs/security/sprint-[SP-N]-secret-scan.md`

**Format:** Markdown

---

## MANDATORY SECTIONS

### sprint-completion-report.md

#### 1. Sprint Header
- Sprint ID
- Date of review
- Stories reviewed (list of Story IDs)

#### 2. Per-Story Review
For each story:
- **Story ID**
- **Code Quality:** Findings from code review (style, complexity, maintainability)
- **Brand Compliance:** Adherence to design tokens and component inventory (if applicable)
- **Revert Detection:** Whether the PR reverts previously merged changes (YES/NO, details if YES)
- **Test Agent Verdict Reference:** Link to test report + its verdict
- **Verdict:** `APPROVED` | `REJECTED` with reason

#### 3. Secret Scan Summary
- Reference to full secret scan report
- Result: `PASSED` | `FAILED`
- If FAILED: number of secrets detected (details in security report)

#### 4. Sprint Verdict
- Overall sprint verdict: `APPROVED` | `REJECTED`
- Count: stories approved / stories rejected
- Merge readiness: `READY_TO_MERGE` | `BLOCKED`

#### 5. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

### sprint-[SP-N]-secret-scan.md

#### 1. Scan Header
- Sprint ID, date, tool used

#### 2. Scan Results
- Files scanned count
- Secrets detected count
- Per-finding: file path, line number, secret type, severity
- False positive assessment (if applicable)

#### 3. Verdict
- `PASSED` (zero secrets) | `FAILED` (secrets detected)

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] Sprint Completion Report exists for the sprint
- [ ] Every story in the sprint has a per-story review entry
- [ ] Secret scan report exists and has an explicit PASSED/FAILED verdict
- [ ] Secret scan is mandatory — cannot be skipped
- [ ] No story is APPROVED without a corresponding APPROVED test report
- [ ] Revert detection is explicitly checked per story
- [ ] Sprint verdict is consistent with per-story verdicts

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
