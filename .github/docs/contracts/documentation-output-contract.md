# Documentation Agent Output Contract
> Version: 1.0 | Defines the mandatory output structure for the Documentation Agent (Agent 26)

---

## PURPOSE
Ensures project documentation is kept current after every sprint. The Documentation Agent updates the user manual, technical manual, and changelog, reporting exactly what changed and flagging any inconsistencies or missing documentation that could impact the next sprint or end-user experience.

---

## OUTPUT FILES
**Location:** `.github/docs/documentation/`
- `user-manual.md` (created or updated)
- `technical-manual.md` (created or updated)
- `CHANGELOG.md` (created or updated)
- `documentation-report-sprint-[SP-N].md` (per-sprint report)

**Format:** Markdown

---

## MANDATORY SECTIONS

### documentation-report-sprint-[SP-N].md

#### 1. Documentation Update Header
- Sprint ID
- Date of update
- Stories included in this sprint

#### 2. User Manual Updates
- Sections added or modified (with before/after summary)
- New user-facing features documented
- If no changes: explicit statement "No user manual updates required"

#### 3. Technical Manual Updates
- Sections added or modified (with before/after summary)
- Architecture changes documented
- API changes documented
- If no changes: explicit statement "No technical manual updates required"

#### 4. Changelog Entry
- Version or sprint reference
- Added / Changed / Fixed / Removed items (following Keep a Changelog format)

#### 5. Documentation Signals
- `DOC_INCONSISTENCY:` — Detected inconsistency between code and documentation (with details)
- `DOC_PENDING:` — Documentation that cannot be completed yet (with reason)
- `DOC_MISSING:` — Required documentation that does not exist yet (with specification)

#### 6. Handoff Checklist
Standard handoff checklist per Universal Agent Rules.

---

## VALIDATION CRITERIA
The Orchestrator checks (per ORC-35):
- [ ] `documentation-report-sprint-[SP-N].md` exists for the sprint
- [ ] User manual and technical manual sections are explicitly reported (even if "no changes")
- [ ] CHANGELOG.md is updated with the sprint's changes
- [ ] All `DOC_INCONSISTENCY` signals include the specific inconsistency and file references
- [ ] All `DOC_MISSING` signals specify what documentation is needed
- [ ] Documentation references match actual implemented features (no stale docs)

### Cross-reference: ORC-35
**ORC-35**: If this contract's output fails validation 3 consecutive times in the same session, the Orchestrator escalates to the user with options: ACCEPT_PARTIAL, RETRY_SIMPLIFIED, or MANUAL_OVERRIDE.

---

## JSON Export

> No standalone JSON export for this contract. Documentation output is Markdown-only.

---

## HANDOFF STATUS VALUES
- `COMPLETE` — All sections filled, all checks passed
- `PARTIAL` — Some sections filled, documented gaps
- `BLOCKED` — Cannot produce output, escalation raised
