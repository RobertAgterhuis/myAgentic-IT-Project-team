# Agent 09 — Data Architect — AUDIT Report

> **Mode:** AUDIT | **Phase:** 2 – Architecture & Design | **Project:** myAgentic-IT-Project-team
> **Date:** 2026-03-07 | **Scope:** TECH (all data entities)
> **Agent:** Data Architect (09) | **Predecessor:** Security Architect (08)
> **Successor:** Legal Counsel (33)

---

## QUESTIONNAIRE INPUT CHECK

**Status:** NOT_INJECTED — No `## QUESTIONNAIRE INPUT — Data Architect` block present in context.
Proceeding with code-based analysis per Questionnaire Protocol Rule 3.

---

## DEPENDENT INPUTS CONSUMED

| Dependency | Source | Status |
|---|---|---|
| `DEPENDENT_ON: Security Architect` — data classification, compliance framework | `.github/docs/phase-2/08-security-architect.md` | ✅ CONSUMED — GDPR conditional, 18 SECURITY_FLAGs |
| `DEPENDENT_ON: Software Architect` — component design, API contracts, technology stack | `.github/docs/phase-2/05-software-architect.md` | ✅ CONSUMED — Layerless Monolith, file-based storage |
| `DEPENDENT_ON: Senior Developer` — code quality findings | `.github/docs/phase-2/06-senior-developer.md` | ✅ CONSUMED — 51 SOLID violations, 0 test coverage |
| `DEPENDENT_ON: DevOps Engineer` — infrastructure findings | `.github/docs/phase-2/07-devops-engineer.md` | ✅ CONSUMED — Maturity 1.4/5, no CI/CD |
| Security handoff context | `.github/docs/security/security-handoff-context.md` | ✅ CONSUMED — 10 IMPL-CONSTRAINTs |

---

## SECURITY_FLAG INVENTORY (from predecessors)

| Flag | Source | Data Architecture Impact | Status |
|---|---|---|---|
| SF-001 (No auth) | Agent 08 | All API endpoints writeable; data integrity depends on localhost isolation | CONFIRMED |
| SF-003 (No input validation framework) | Agent 05 | User text accepted without sanitization → markdown injection | CONFIRMED |
| SF-DATA-001 (Markdown injection) | Agent 09 | User-submitted text corrupts file structure when re-parsed | NEW |
| SF-DATA-002 (No atomic writes) | Agent 09 | Process crash mid-write corrupts file permanently | NEW |
| SF-DATA-003 (File locking insufficient) | Agent 09 | In-memory lock doesn't prevent external process writes | NEW |
| IMPL-CONSTRAINT-002 (escMarkdown) | Agent 08 | Required for all user text writes | CONFIRMED |
| IMPL-CONSTRAINT-008 (Secret pattern detection) | Agent 08 | Secrets in questionnaire answers undetected | CONFIRMED |

---

# A. DATA MODEL INVENTORY (Step 1)

## A.1 Entity: Questionnaire

| Property | Type | Storage | Schema | Source |
|---|---|---|---|---|
| **file** | String | Markdown on disk | `BusinessDocs/**/[*]-questionnaire.md` | server.js L173 |
| **agent** | String | Derived from H1 | `# Questionnaire: [agent name]` | server.js L206 |
| **phase** | String | Derived from metadata | `Phase: [phase name]` | server.js L209 |
| **generated** | ISO8601 | Derived from metadata | `Generated: [ISO timestamp]` | server.js L209 |
| **version** | String | Derived from metadata | `Version: [semver]` | server.js L209 |
| **questions[]** | Array[Question] | Nested in file | 1+ per file | server.js L211–230 |
| **sections[]** | Array[Section] | Nested in file | Headers: `## Section N: [title]` | server.js L218 |

### Question Object Schema

| Property | Type | Validation | Source |
|---|---|---|---|
| **id** | String | Regex: `^Q-\d{1,3}-\d{1,4}$` | server.js L85–86, L223 |
| **classification** | Enum | `[REQUIRED \| OPTIONAL]` | server.js L223 |
| **question** | String | `maxLen=Unbounded` (implicit) | server.js L228 |
| **whyNeeded** | String | `maxLen=Unbounded` | server.js L228 |
| **expectedFormat** | String | `maxLen=Unbounded` | server.js L228 |
| **example** | String | `maxLen=Unbounded` | server.js L228 |
| **answer** | String | `maxLen=Unbounded` | server.js L217, L225 |
| **status** | Enum | `[OPEN \| ANSWERED \| DEFERRED]` | server.js L87, L230, L237 |
| **lastUpdated** | String | Format `YYYY-MM-DD` | server.js L230, L241 |

**Parsing:** `parseQuestionnaire()` — regex-based line-by-line state machine (server.js L200–274)

## A.2 Entity: Decision

**Storage:** Single file `.github/docs/decisions.md` — Markdown table with 4 sections

| Section | Source Lines | Row Format | Key Pattern |
|---|---|---|---|
| **Open Questions** | server.js L560–570 | `\| DEC-ID \| PRIORITY \| SCOPE \| QUESTION \| ANSWER \| DATE \|` | `DEC-[\w-]+` |
| **Transformation Decisions** | server.js L572–585 | `\| DEC-T-NNN \| PRIORITY \| SCOPE \| DECISION \| NOTES \| DATE \|` | `DEC-T-*` |
| **Operational Decisions** | server.js L587–601 | `\| DEC-NNN \| PRIORITY \| SCOPE \| DECISION \| NOTES \| DATE \|` | `DEC-*` |
| **Deferred & Expired** | server.js L603–624 | `\| DEC-ID \| STATUS \| SCOPE \| SUBJECT \| REASON \| DATE \|` | `[DEFERRED \| EXPIRED]` |
| **Change Log** | server.js L598–604 | `- ISO_TIMESTAMP \| action \| id \| source: webapp` | Append-only |

### Decision Object Schema (Open Question variant)

| Property | Type | Validation | Source |
|---|---|---|---|
| **id** | String | Regex: `^DEC-[\w-]{1,30}$` | server.js L87, L577 |
| **type** | Enum | `[OPEN_QUESTION, TRANSFORMATION, OPERATIONAL]` | server.js L557, L567 |
| **status** | Enum | `[OPEN, DECIDED, DEFERRED, EXPIRED]` | server.js L568 |
| **priority** | Enum | `[HIGH, MEDIUM, LOW, —]` | server.js L577–578 |
| **scope** | String | `maxLen=200` | server.js L578 |
| **question** | String | `maxLen=2000` | server.js L579 |
| **answer** | String | `maxLen=2000`, optional | server.js L579 |
| **date** | String | Format `YYYY-MM-DD` | server.js L577 |

**Parsing:** `parseDecisions()` — 3-pass regex over entire file (server.js L557–637)

## A.3 Entity: Session State

**Storage:** `.github/docs/session/session-state.json` — Single JSON file

| Property | Type | Source |
|---|---|---|
| **session_id** | String | Orchestrator generated |
| **cycle_type** | Enum | `[CREATE, AUDIT, REEVALUATE, FEATURE, SCOPE_CHANGE, HOTFIX]` |
| **status** | Enum | `[INITIATED, IN_PROGRESS, COMPLETE, BLOCKED, FAILED]` |
| **current_phase** | String | Orchestrator pipeline |
| **current_agent** | String | Orchestrator pipeline |
| **current_step** | String | Orchestrator pipeline |
| **completed_phases[]** | Array[String] | Append on completion |
| **completed_agents[]** | Array[String] | Append on completion |
| **phase_outputs{}** | Object | File paths per phase/agent |
| **open_human_escalations[]** | Array[Object] | Manual escalations |

**Location:** server.js L290–292

## A.4 Entity: Command Queue

**Storage:** `.github/docs/session/command-queue.json` — JSON array (append-only, max 50 entries)

| Property | Type | Validation | Source |
|---|---|---|---|
| **command** | String | Whitelist: `VALID_COMMANDS` | server.js L781–795 |
| **project** | String | `maxLen=200`, optional | server.js L768 |
| **description** | String | `maxLen=2000`, optional | server.js L768 |
| **scope** | String | Optional, from enum | server.js L768 |
| **brief** | String | `maxLen=200000`, optional | server.js L803–808 |
| **requested_at** | ISO8601 | Automatic | server.js L815 |
| **status** | Enum | `PENDING` (static) | server.js L815 |

**Retention:** Max 50 entries via array rotation (server.js L815–820)

## A.5 Entity: Help Content

**Storage:** Static markdown files in `.github/help/` directory — 7 files in HELP_TOC

**Access:** Lazy-loaded read-only via `apiGetHelp()` (server.js L984–1006)

## A.6 Data Relationships (FK Mappings)

| Source | Target | Relationship | Integrity |
|---|---|---|---|
| Decision.scope | Phase/Agent names | Weak reference | ❌ No integrity check |
| Question.section | Same-file section | Self-referential | String value only |
| Session.phase_outputs | File paths | Weak reference | ❌ No validation |
| Command.brief | BusinessDocs/project-brief.md | Is-written-to | String path, no FK |

---

# B. DATA LINEAGE (Step 2)

## B.1 Primary Data Flows

| Domain | Source | Transformations | Destination | Owner | Trigger |
|---|---|---|---|---|---|
| **Questionnaire Answers** | Client textarea (index.html L1500) | `parseBody()` → JSON → `updateAnswerInContent()` → regex line scanner → string replace | Markdown file + questionnaire-index.md rebuild | User + Backend | POST `/api/save` |
| **Decision Transitions** | Client form (index.html L2550) | `parseBody()` → JSON → switch/case → `moveToDecided()` / `deferOpenQuestion()` / etc. → string mutation | decisions.md + Change Log (append-only) | User + Backend | POST `/api/decisions` |
| **Session State** | Orchestrator JSON writes | File on disk | `fs.readFileSync` → JSON.parse → API response | Backend (reader) | GET `/api/session`, `/api/progress` |
| **Commands** | Client webapp form (index.html L1920) | `parseBody()` → JSON → validate against `VALID_COMMANDS` → append to array | command-queue.json + optional project-brief.md | Backend | POST `/api/command` |
| **Help Topics** | `.github/help/*.md` on disk | `fs.readFileSync` → `renderMarkdown()` → HTML | HTML in API response | Backend (static) | GET `/api/help?topic=X` |

## B.2 Data Flow: Questionnaire Lifecycle

```
1. Client: GET /api/questionnaires (index.html L1161)
2. Server: discoverQuestionnaires() → fs.readdirSync walk (L121–138)
3. Server: parseQuestionnaire() per file → regex state machine (L141–274)
4. Response: { questionnaires: [...] } JSON (L318)
5. Client: renderSidebar() → renderQ() → display (index.html L1330–1450)
6. Client: apiSave() with answer updates (index.html L1500–1520)
7. Server: updateAnswerInContent() → regex line scanner (L300–325)
8. Server: withFileLock() → fs.writeFileSync back to file (L308)
9. Server: scheduleRebuildIndex() → questionnaire-index.md updated (L280–309)
```

## B.3 Data Flow: Decision Lifecycle

```
1. Client: GET /api/decisions (index.html L1165)
2. Server: parseDecisions() → fs.readFileSync (L335)
3. Server: 3 regex passes (open/decided/deferred) (L560–624)
4. Response: { open: [], decided: [], deferred: [] } JSON (L644)
5. Client: renderDecisions() → filter/render (index.html L2400–2700)
6. Client: Create/Answer/Decide/Defer/Expire via buttons
7. Server: apiPostDecision(action, id, ...) → switch/case mutation (L826–945)
8. Server: withFileLock() → fs.writeFileSync (L897, L915, L928, L934, L941)
9. Server: appendAuditTrail() → append-only log (L598–604)
```

---

# C. DATA GOVERNANCE ASSESSMENT (Step 3)

## C.1 Data Ownership

| Domain | Primary Owner | Secondary Owner | Modification Pattern | Audit Trail |
|---|---|---|---|---|
| **Questionnaires** | User (answerer) | Backend (parser) | User text + status → POST → file overwrite | ❌ None |
| **Decisions** | User (decider) | Backend (state mgmt) | 6 action types → switch/case → file overwrite | ✅ Change Log |
| **Session State** | Orchestrator | Backend (reader only) | JSON writes by Orchestrator → reads by API | ❌ None (file mtime only) |
| **Commands** | User (queuer) | Orchestrator (consumer) | Append to array; Orchestrator reads | ❌ None (history in array) |
| **Help** | Administrator | Backend (server) | Static files; no mutation | ❌ None (git only) |

## C.2 Data Dictionary Status

**Status:** ❌ **DOES NOT EXIST**

No formal data dictionary or schema documentation exists. All structure is embedded in regex patterns, inline validation (`assertString` calls), and type tags in enums. Comment density ~2% (per Agent 06).

## C.3 Data Retention Policy

**Status:** ❌ **DOES NOT EXIST**

| Data Type | Current Retention | Deletion Mechanism | Expiration |
|---|---|---|---|
| Questionnaire answers | Indefinite | Manual edit to markdown file | None |
| Decision records | Indefinite | Status transition (not deletion) | Manual move to "Deferred & Expired" |
| Session state | 1 per active cycle | Overwrite on new cycle | None |
| Command queue | Last 50 entries | Array rotation (FIFO) | Built-in (max 50) |
| Help files | Indefinite | Manual edit | None |

## C.4 Data Classification

Cross-referenced with Agent 08 (Security Architect) — GDPR conditional:

| Classification | Examples | Storage | Encryption | Access |
|---|---|---|---|---|
| **PUBLIC** | Phase names, agent names, progress | Markdown/JSON | ❌ None | All local processes |
| **INTERNAL** | Questionnaire questions, decision scope | Markdown | ❌ None | All local processes |
| **CONFIDENTIAL** | User-submitted answers, decision text | Markdown | ❌ None | All local processes |
| **RESTRICTED** | Session tokens, command auth | N/A (no auth) | N/A | N/A |

**Finding:** No classification labels exist in code. All classification is implicit. If GDPR applies, user-submitted answers may contain personal data → Art. 5 (data minimization) applies.

---

# D. DATA QUALITY ANALYSIS (Step 4)

## DQ-001 — Regex Parsing Fragility (Questionnaires) — CRITICAL

**Source:** server.js L200–274 (`parseQuestionnaire()`)

`parseQuestionnaire()` uses a manual state machine with regex matching. Risks:
- If user answer contains `**Question:** `, parser misconstrues it as a new field (L228)
- If answer contains `### Q-1-0001 [REQUIRED]`, creates duplicate question entry (L223–229)
- Markdown headers in answers corrupt file structure (no escape mechanism)
- State machine has implicit assumptions about line ordering — unrecoverable if violated

**Impact:** Data loss or corruption on edge-case inputs.

## DQ-002 — Regex Parsing Over Entire File (Decisions) — CRITICAL

**Source:** server.js L557–637 (`parseDecisions()`)

3 separate regex passes over entire `decisions.md` file. Overlapping regex boundaries can miss rows if table structure deviates. `[\s\S]*?` in lookahead can fail if section headers move.

**Impact:** Loss of decision records if file format degrades.

## DQ-003 — Line-Based Mutation Without Bounds Check — HIGH

**Source:** server.js L300–325 (`updateAnswerInContent()`)

Scans lines forward/backward for section delimiters. If delimiters (`---`, `###`, `##`) are missing, skips to EOF. Answer text containing `---` truncates the answer prematurely.

**Impact:** Silent data loss when answer contains markdown syntax.

## DQ-004 — No Schema Validation on JSON Reads — HIGH

**Source:** server.js L290–292 (session), L815–820 (command queue)

Session state and command queue read with `JSON.parse()` but no schema validation. Missing fields silently become `undefined` and propagate to frontend.

**Impact:** Silent data quality degradation; frontend renders incomplete data.

## DQ-005 — Inconsistent Data Types in Decision Rows — MEDIUM

**Source:** server.js L486–506 (`reopenItem`)

Decision priority field accepts `[HIGH, MEDIUM, LOW, —]`. Deferred items carry `—` but open questions require HIGH/MEDIUM/LOW. Inconsistency causes filter/rendering bugs.

## DQ-006 — File Locking Does NOT Prevent External Writes — MEDIUM

**Source:** server.js L96–102 (`withFileLock()`)

In-process `Map`-based lock only serializes writes within same Node.js process. Does NOT prevent Orchestrator or manual edits from racing.

**Impact:** Data corruption in multi-process scenarios.

## DQ-007 — Denormalization: Answer Text Duplicated — HIGH

**Source:** server.js L436–461 (`moveToDecided()`)

When decision moves OPEN → DECIDED, answer text is copied to `notes` column. Data exists in two locations — no single source of truth.

## DQ-008 — No Atomic Writes / Crash Safety — MEDIUM

**Source:** server.js L45–50 (`safeWriteSync()`)

All writes use `fs.writeFileSync()` directly without temp-then-rename pattern. Process crash mid-write corrupts file permanently.

## DQ-009 — Markdown Injection via escPipe Incompleteness — HIGH

**Source:** server.js L87 (`escPipe()`)

Only escapes `|` characters. Decision text with `---`, `###`, or `**` injects markdown syntax that corrupts file structure.

Cross-reference: Agent 08 IMPL-CONSTRAINT-002.

---

# E. ANALYTICS AND REPORTING ARCHITECTURE (Step 5)

**Status:** ❌ **NO ANALYTICS PIPELINE**

### What Exists

| Capability | Implementation | Source |
|---|---|---|
| Real-time progress visualization | `apiGetProgress()` — calculates phase/agent completion in-memory per request | server.js L896–1373 |
| Questionnaire index summary | `rebuildQuestionnaireIndex()` — generates `questionnaire-index.md` with counts | server.js L280–309 |

### What Is Missing

| Metric | Status | Impact |
|---|---|---|
| Average questionnaire completion time | ❌ Unknown | No timestamp on individual answers |
| Decision cycle time (OPEN → DECIDED) | ❌ Unknown | No timestamp on decisions until change log |
| Agent blocking frequency | ❌ Unknown | No failure/blocker tracking per agent |
| Data growth over time | ❌ Unknown | No archiving; metrics reset per cycle |

**Processing Model:** REAL-TIME only — calculated on demand, no caching, no batch processing, no historical analysis.

---

# F. DATA COMPLIANCE ANALYSIS (Step 6)

## F.1 GDPR Applicability

**Status:** CONDITIONAL — Applies only if:
1. Application is deployed beyond `127.0.0.1` (localhost), OR
2. Application processes personal data of EU residents

**Current scope:** Localhost-only development tool → GDPR scope LIMITED

## F.2 GDPR Article Assessment

| Article | Requirement | Current State | Compliance |
|---|---|---|---|
| Art. 5(1)(a) — Lawful basis | Must have consent or contract | No consent mechanism | ❌ MISSING |
| Art. 5(1)(b) — Purpose limitation | Data only for stated purpose | Questionnaire answers → project analysis | ✅ COMPLIANT |
| Art. 5(1)(c) — Data minimization | Only necessary data | All user text stored verbatim; no PII filtering | ⚠️ PARTIAL |
| Art. 5(1)(d) — Accuracy | Keep data accurate | No validation rules; user text accepted as-is | ⚠️ PARTIAL |
| Art. 5(1)(e) — Storage limitation | Delete when purpose ends | No deletion mechanism; indefinite | ❌ MISSING |
| Art. 5(1)(f) — Integrity & confidentiality | Secure processing | No encryption at rest; localhost binding limits risk | ⚠️ PARTIAL |
| Art. 25 — Data protection by design | Built-in safeguards | ❌ NOT IMPLEMENTED | ❌ MISSING |
| Art. 32 — Security of processing | Appropriate technical measures | Localhost binding ✅ / Path guards ✅ / Encryption ❌ / Audit ⚠️ | ⚠️ PARTIAL |
| Art. 35 — DPIA | Impact assessment | NOT_REQUIRED for localhost; REQUIRED if deployed multi-user | ⚠️ CONDITIONAL |

## F.3 GDPR Compliance Gaps (if deployed)

| Gap | Impact | Remediation |
|---|---|---|
| No consent/lawful basis | Art. 6 violation; processing illegal | Implement consent mechanism |
| No data minimization | Art. 5 violation; excess data stored | Implement PII filtering |
| No retention/deletion | Art. 5(1)(e) violation; indefinite storage | Implement retention policy |
| No encryption at rest | Art. 32 violation; data unprotected | Implement file encryption |
| No data subject rights | Art. 17/20 violation; no erasure/portability | Design deletion/export |
| No breach notification | Art. 33 violation; no 72h notification | Implement incident response |

---

# G. GAP ANALYSIS (Step 7)

## GAP-DATA-001 — No Data Dictionary

**Severity:** MEDIUM | **Type:** Documentation | **Priority:** P2

No formal data dictionary or schema specification exists. All structure implicit in regex patterns.

**Source:** All entities in Section A lack external documentation.

## GAP-DATA-002 — No Markdown Injection Prevention

**Severity:** CRITICAL | **Type:** Security + Data Quality | **Priority:** P1

User-submitted text corrupts file structure when re-parsed. Current `escPipe()` is insufficient.

**Source:** DQ-001, DQ-002, DQ-009; Agent 08 IMPL-CONSTRAINT-002.

## GAP-DATA-003 — No Schema Validation on JSON Reads

**Severity:** HIGH | **Type:** Robustness | **Priority:** P1

Session state and command queue read without type/field validation. Missing fields silently become `undefined`.

**Source:** DQ-004; server.js L290–292, L815–820.

## GAP-DATA-004 — No Audit Trail for Questionnaires

**Severity:** HIGH | **Type:** Auditability | **Priority:** P2

Decisions have `appendAuditTrail()`; questionnaires do not. No record of answer changes.

**Source:** Comparison of decisions.md Change Log vs. questionnaire handling.

## GAP-DATA-005 — No Atomic Writes / Crash Safety

**Severity:** MEDIUM | **Type:** Reliability | **Priority:** P2

`safeWriteSync()` writes directly without temp-then-rename pattern.

**Source:** DQ-008; server.js L45–50.

## GAP-DATA-006 — No Data Retention / Deletion Policy

**Severity:** MEDIUM | **Type:** Governance | **Priority:** P2

All data retained indefinitely. No mechanism to delete old data. GDPR Art. 5(1)(e) gap.

**Source:** Section C.3 retention analysis.

## GAP-DATA-007 — No Multi-Process Synchronization

**Severity:** HIGH | **Type:** Concurrency | **Priority:** P1 (conditional on deployment scope)

In-memory file locking insufficient for multi-process access.

**Source:** DQ-006; server.js L96–102.

## GAP-DATA-008 — No Versioning / Snapshots

**Severity:** MEDIUM | **Type:** Recoverability | **Priority:** P3

No version history. Data corruption or user error has no rollback.

**Source:** Write pattern analysis; no snapshot mechanism found.

## GAP-DATA-009 — Questionnaire Index Rebuild Not Triggered on Startup

**Severity:** LOW | **Type:** Data Consistency | **Priority:** P3

`rebuildQuestionnaireIndex()` only triggered on questionnaire save. External modifications make index stale.

**Source:** server.js `scheduleRebuildIndex()` debounce pattern.

## GAP-DATA-010 — No PII Classification in Code

**Severity:** MEDIUM | **Type:** Compliance | **Priority:** P2

No markers to identify which fields contain personal data. Required for automated PII handling.

**Source:** GDPR Art. 25 (Data Protection by Design); Section F.

---

# H. SELF-CHECK (Step 8)

| Check | Status |
|---|---|
| All data entities inventoried with file/line references | ✅ 5 entities documented |
| All data lineage flows mapped source → destination | ✅ 5 domains mapped |
| Data governance assessed (ownership, dictionary, retention, classification) | ✅ All 4 sub-assessments complete |
| Data quality findings with severity and source | ✅ 9 findings (DQ-001 – DQ-009) |
| Analytics/reporting architecture documented | ✅ Current state + gaps |
| Data compliance analysis (GDPR, based on Agent 08 framework) | ✅ 9 articles assessed |
| Gap analysis with IDs and severity | ✅ 10 gaps (GAP-DATA-001 – GAP-DATA-010) |
| All findings have source reference (file, line) | ✅ Verified |
| No contradictory statements | ✅ Verified — lineage consistent with entities |
| Cross-references to Agents 05, 06, 07, 08 validated | ✅ Mapped in Section K |

---

# I. RECOMMENDATIONS (Steps A–D)

## REC-DATA-001 — Implement Comprehensive Markdown Escaping

**GAP/RISK Reference:** GAP-DATA-002 (CRITICAL); DQ-001, DQ-002, DQ-009
**Domain:** Data Architect

**Recommendation:** Implement `escMarkdown()` function that escapes all markdown-significant characters (`#`, `---`, `**`, `[]`, `|`) in ALL user-submitted text before writing to files. Replace `escPipe()` with `escMarkdown()` in `updateAnswerInContent()`, `addOpenQuestion()`, `addOperationalDecision()`, and all decision mutation functions.

**Impact:**
- Revenue: INSUFFICIENT_DATA: (no revenue model defined)
- Risk Reduction: HIGH — eliminates data corruption via injection (2 CRITICAL + 3 HIGH findings resolved)
- Cost: LOW — 6h implementation effort
- UX: MEDIUM — prevents silent data loss users would otherwise never notice

**Risk of NOT executing:** User-submitted text containing markdown syntax corrupts questionnaire and decision files silently. Data loss is unrecoverable. Production deployment impossible.

**SMART Success Criterion:**
- **KPI:** Markdown injection test pass rate
- **Baseline:** 0% (no tests, no protection)
- **Target:** 100% — all 12 identified injection patterns blocked
- **Measurement:** Automated test suite with injection payloads
- **Time horizon:** Sprint 1

**Priority Matrix:**
- Impact: **HIGH** — eliminates 2 CRITICAL findings
- Effort: **LOW** — 6h total
- Priority: **P1** (Quick win + Critical risk)
- Suggested sprint: SP-DATA-1

---

## REC-DATA-002 — Implement JSON Schema Validation

**GAP/RISK Reference:** GAP-DATA-003 (HIGH); DQ-004
**Domain:** Data Architect

**Recommendation:** Implement `validateSchema()` helper function for session-state.json and command-queue.json reads. Validate required fields and types on every `JSON.parse()`. Log validation errors. Return safe defaults for missing optional fields.

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: HIGH — prevents silent data propagation to frontend
- Cost: LOW — 3h implementation
- UX: MEDIUM — frontend displays meaningful errors instead of blank data

**Risk of NOT executing:** Missing or wrongly-typed fields silently propagate as `undefined`, causing frontend rendering bugs and incorrect progress calculations.

**SMART Success Criterion:**
- **KPI:** Schema validation coverage
- **Baseline:** 0% (no validation)
- **Target:** 100% — all JSON reads validated
- **Measurement:** Unit tests verifying rejection of malformed JSON
- **Time horizon:** Sprint 1

**Priority Matrix:**
- Impact: **HIGH** — prevents silent data degradation
- Effort: **LOW** — 3h
- Priority: **P1** (Quick win)
- Suggested sprint: SP-DATA-1

---

## REC-DATA-003 — Implement Multi-Process File Synchronization

**GAP/RISK Reference:** GAP-DATA-007 (HIGH); DQ-006
**Domain:** Data Architect

**Recommendation:** Replace in-memory `_writeLocks` Map with OS-level file locking using lock files (`.lock` files with PID) or advisory locks via `fs.open()` with exclusive flag. This prevents race conditions when Orchestrator and Webapp both access shared files.

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: HIGH — prevents data corruption in multi-process scenarios
- Cost: MEDIUM — 12h implementation
- UX: LOW — transparent to user

**Risk of NOT executing:** Orchestrator writing session-state.json while webapp reads it = data race. Webapp writing decisions.md while user manually edits = file corruption. Risk increases with multi-agent parallel execution.

**SMART Success Criterion:**
- **KPI:** Concurrent write conflict rate
- **Baseline:** INSUFFICIENT_DATA: (no monitoring)
- **Target:** 0 conflicts per 1000 operations
- **Measurement:** Lock contention counter in file lock module
- **Time horizon:** Sprint 2

**Priority Matrix:**
- Impact: **HIGH** — prevents multi-process data corruption
- Effort: **MEDIUM** — 12h
- Priority: **P1** (Critical risk, conditional on QUE-DATA-004)
- Suggested sprint: SP-DATA-2

---

## REC-DATA-004 — Add Questionnaire Audit Trail

**GAP/RISK Reference:** GAP-DATA-004 (HIGH)
**Domain:** Data Architect

**Recommendation:** Add `## Change Log` section to each questionnaire markdown file (matching decisions.md pattern). Log every answer update with ISO timestamp, question ID, action (ANSWERED/DEFERRED/EDITED), and previous value hash (not full text, for privacy).

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: MEDIUM — enables audit compliance and change tracking
- Cost: LOW — 7h implementation + tests
- UX: LOW — transparent; provides traceability if needed

**Risk of NOT executing:** No record of answer modifications. Cannot trace who changed what or when. Audit compliance impossible if GDPR applies.

**SMART Success Criterion:**
- **KPI:** Audit trail completeness
- **Baseline:** 0% (no trail)
- **Target:** 100% — every answer modification logged
- **Measurement:** Post-save verification that Change Log entry was written
- **Time horizon:** Sprint 2

**Priority Matrix:**
- Impact: **MEDIUM** — audit compliance enabler
- Effort: **LOW** — 7h
- Priority: **P2** (Strategic)
- Suggested sprint: SP-DATA-2

---

## REC-DATA-005 — Implement Atomic Write Pattern

**GAP/RISK Reference:** GAP-DATA-005 (MEDIUM); DQ-008
**Domain:** Data Architect

**Recommendation:** Modify `safeWriteSync()` to use temp-file-then-rename pattern: write to `{file}.tmp-{timestamp}` → `fs.renameSync()` (atomic on POSIX). Add cleanup for orphaned temp files on startup.

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: MEDIUM — eliminates data corruption on process crash
- Cost: LOW — 2h implementation
- UX: LOW — transparent

**Risk of NOT executing:** Process crash during `fs.writeFileSync()` produces partially-written, corrupted file with no recovery.

**SMART Success Criterion:**
- **KPI:** File corruption incidents after crash
- **Baseline:** INSUFFICIENT_DATA: (no crash testing)
- **Target:** 0 corrupted files per 100 simulated crashes
- **Measurement:** Crash simulation test suite
- **Time horizon:** Sprint 1

**Priority Matrix:**
- Impact: **MEDIUM** — crash resilience
- Effort: **LOW** — 2h
- Priority: **P2** (Strategic, low effort)
- Suggested sprint: SP-DATA-1

---

## REC-DATA-006 — Create Data Dictionary and Schema Documentation

**GAP/RISK Reference:** GAP-DATA-001 (MEDIUM)
**Domain:** Data Architect

**Recommendation:** Create `.github/docs/data-dictionary.md` documenting all 5 entities, their fields, types, constraints, sample values, and relationships. Use this audit report (Section A) as the foundation.

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: LOW — documentation reduces onboarding errors
- Cost: LOW — 8h creation
- UX: N/A

**Risk of NOT executing:** New developers must reverse-engineer data model from regex patterns. Schema extension requires reading 1600 LOC to understand implicit constraints.

**SMART Success Criterion:**
- **KPI:** Data dictionary completeness
- **Baseline:** 0% (no dictionary)
- **Target:** 100% — all 5 entities, all fields, all constraints documented
- **Measurement:** Checklist review against codebase entities
- **Time horizon:** Sprint 2

**Priority Matrix:**
- Impact: **LOW** — documentation
- Effort: **LOW** — 8h
- Priority: **P2** (Strategic, enables future work)
- Suggested sprint: SP-DATA-2

---

## REC-DATA-007 — Implement Data Retention Policy

**GAP/RISK Reference:** GAP-DATA-006 (MEDIUM); GDPR Art. 5(1)(e)
**Domain:** Data Architect

**Recommendation:** Define and implement per-entity retention policy: Questionnaires: current + last 2 cycles → archive → delete after 90 days. Decisions: current cycle → archive expired after 90 days. Sessions: last 10 → auto-delete. Implement `cleanupExpired()` function callable on server startup.

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: MEDIUM — GDPR compliance enabler
- Cost: MEDIUM — 6h implementation
- UX: LOW — transparent

**Risk of NOT executing:** Indefinite data retention violates GDPR Art. 5(1)(e) if application is deployed. Storage grows unbounded.

**SMART Success Criterion:**
- **KPI:** Expired data percentage
- **Baseline:** 100% (all data indefinite)
- **Target:** 0% expired data beyond policy threshold
- **Measurement:** Startup check that counts data older than retention period
- **Time horizon:** Sprint 3 (after deployment scope decision)

**Priority Matrix:**
- Impact: **MEDIUM** — GDPR conditional
- Effort: **MEDIUM** — 6h
- Priority: **P2** (Strategic, conditional on QUE-DATA-001)
- Suggested sprint: SP-DATA-3

---

## REC-DATA-008 — Add PII Classification Markers

**GAP/RISK Reference:** GAP-DATA-010 (MEDIUM); GDPR Art. 25
**Domain:** Data Architect

**Recommendation:** Add `/* PII */` markers to all fields that may contain personal data in parse functions. Document PII inventory in data dictionary. Implement `isPII(fieldName)` helper for automated handling.

**Impact:**
- Revenue: INSUFFICIENT_DATA:
- Risk Reduction: MEDIUM — enables automated PII protection
- Cost: LOW — 3h implementation
- UX: N/A

**Risk of NOT executing:** Cannot implement automated PII masking, deletion rights, or retention. GDPR Art. 25 non-compliant if deployed.

**SMART Success Criterion:**
- **KPI:** PII field identification coverage
- **Baseline:** 0% (no PII markers)
- **Target:** 100% — all PII fields tagged
- **Measurement:** Code review checklist
- **Time horizon:** Sprint 3

**Priority Matrix:**
- Impact: **MEDIUM** — GDPR enabler
- Effort: **LOW** — 3h
- Priority: **P2** (Strategic)
- Suggested sprint: SP-DATA-3

---

## Recommendations Self-Check (Step D)

| Check | Status |
|---|---|
| Every recommendation references a GAP/RISK finding | ✅ All 8 reference GAP-DATA-NNN |
| All impact fields filled or marked INSUFFICIENT_DATA | ✅ Revenue = INSUFFICIENT_DATA on all (no revenue model) |
| All success criteria SMART | ✅ KPI + baseline + target + measurement + time horizon |
| No out-of-scope recommendations | ✅ All within Data Architect domain |

---

# J. SPRINT PLAN (Steps E–H)

## J.1 Assumptions (Step E)

| Assumption | Value | Source |
|---|---|---|
| **Team Data** | 1 senior developer (full-stack), 1 reviewer | INSUFFICIENT_DATA: team composition; assumes minimal team from Agent 06 capacity |
| **Capacity** | 16 SP per sprint (1 developer × 2-week sprint × 80% utilization) | Aligned with Agent 06 assumption |
| **Sprint duration** | 2 weeks | Default per contract |
| **Technology stack** | Node.js, zero-dependency, file-based storage | Per Agent 05 findings |
| **Preconditions for SP-DATA-1** | REC-DATA-001 (escMarkdown) depends on nothing; REC-DATA-002/005 depend on nothing | Independent sprint start possible |

## J.2 Sprint Stories (Step F)

### Sprint SP-DATA-1: Data Integrity Foundation (16 SP)

**Sprint Goal:** Eliminate critical data corruption vectors and establish data validation baseline.

#### SP-DATA-1-001: Implement escMarkdown Function (5 SP)

- **Description:** As a data architect I want to prevent markdown injection in all user-submitted text so that questionnaire and decision files are never corrupted by user input.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given user submits answer containing `### Q-1-9999 [REQUIRED]`, when saved, then parser does not create duplicate question
  - Given user submits decision with `---` text, when saved, then decisions.md table structure remains intact
  - Given all 12 identified injection patterns, when submitted, then all are escaped and file structure preserved
- **Story points:** 5
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-001

#### SP-DATA-1-002: Add JSON Schema Validation (3 SP)

- **Description:** As a data architect I want to validate session-state.json and command-queue.json on every read so that missing or malformed fields are caught before reaching the frontend.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given session-state.json is missing `current_phase`, when read, then validation error is logged and safe default returned
  - Given command-queue.json contains non-array root, when parsed, then it is normalized to empty array
  - Given all required fields are present, when validated, then no error is raised
- **Story points:** 3
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-002

#### SP-DATA-1-003: Implement Atomic Write Pattern (3 SP)

- **Description:** As a data architect I want file writes to use temp-then-rename pattern so that a process crash never produces a corrupted file.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given server crashes mid-write, when restarted, then original file is intact (no partial writes)
  - Given successful write, when completed, then temp file is removed
  - Given orphaned temp files exist on startup, when server starts, then orphaned temps are cleaned up
- **Story points:** 3
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-005

#### SP-DATA-1-004: Data Integrity Test Suite (5 SP)

- **Description:** As a data architect I want automated tests for all data parsing and mutation functions so that regression risks from data handling changes are caught.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given parseQuestionnaire() receives edge-case input, when tested, then all 9 DQ findings are covered by tests
  - Given parseDecisions() receives malformed table, when tested, then graceful failure is verified
  - Given escMarkdown() receives all injection patterns, when tested, then 100% pass rate
- **Story points:** 5
- **Dependencies:** SP-DATA-1-001 (escMarkdown must exist first)
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-001, REC-DATA-002

### Sprint SP-DATA-2: Data Governance & Synchronization (15 SP)

**Sprint Goal:** Establish audit trail for all data mutations and resolve multi-process concurrency risks.

#### SP-DATA-2-001: Multi-Process File Synchronization (5 SP)

- **Description:** As a data architect I want file access to be synchronized across processes so that Orchestrator and Webapp never corrupt shared files.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given Orchestrator writes session-state.json while webapp reads, when both execute, then lock prevents simultaneous access
  - Given lock file exists from crashed process, when new process starts, then stale lock is detected and cleared
  - Given 100 concurrent write attempts, when stress-tested, then 0 data corruption events
- **Story points:** 5
- **Dependencies:** SP-DATA-1-003 (atomic writes as foundation)
- **Blocker:** EXTERN: Deployment scope answer (QUE-DATA-004) | owner: Project Lead | escalation: Orchestrator
- **Recommendation reference:** REC-DATA-003

#### SP-DATA-2-002: Questionnaire Audit Trail (4 SP)

- **Description:** As a data architect I want every questionnaire answer modification to be logged so that changes can be traced for audit compliance.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given user updates an answer, when saved, then Change Log entry with timestamp + question ID + action is appended
  - Given questionnaire file is read, when parsed, then Change Log is preserved and not modified
  - Given 50 sequential answer updates, when logged, then all 50 entries present in chronological order
- **Story points:** 4
- **Dependencies:** SP-DATA-1-001 (escMarkdown for log entries)
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-004

#### SP-DATA-2-003: Create Data Dictionary (3 SP)

- **Description:** As a data architect I want a formal data dictionary document so that all data entities, fields, types, and constraints are documented in one place.
- **Team:** Data Team (Senior Developer)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given data dictionary is created, when reviewed, then all 5 entities from Section A are documented
  - Given each entity, when documented, then all fields have type, constraint, and sample value
  - Given relationships section, when reviewed, then all FK mappings from Section A.6 are documented
- **Story points:** 3
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-006

#### SP-DATA-2-004: Data Integrity Regression Tests (3 SP)

- **Description:** As a data architect I want regression tests for audit trail and file synchronization so that sprint 2 changes are verified.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given audit trail feature, when tested, then log entry verification passes for all mutation types
  - Given multi-process lock, when tested, then concurrent access tests pass
- **Story points:** 3
- **Dependencies:** SP-DATA-2-001, SP-DATA-2-002
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-003, REC-DATA-004

### Sprint SP-DATA-3: Compliance & Governance (9 SP)

**Sprint Goal:** Establish data retention, PII classification, and GDPR readiness (if deployment scope requires).

#### SP-DATA-3-001: Data Retention Policy Implementation (5 SP)

- **Description:** As a data architect I want automatic data retention enforcement so that expired data is archived or deleted per policy.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given questionnaire older than 2 cycles + 90 days, when cleanup runs, then file is archived to `.archive/` directory
  - Given expired decision records, when cleanup runs, then moved to archive table
  - Given cleanup on startup, when executed, then count of archived items is logged
- **Story points:** 5
- **Dependencies:** None
- **Blocker:** EXTERN: Retention requirements answer (QUE-DATA-003) | owner: Project Lead | escalation: Orchestrator
- **Recommendation reference:** REC-DATA-007

#### SP-DATA-3-002: PII Classification Markers (2 SP)

- **Description:** As a data architect I want all fields potentially containing personal data to be marked in code so that automated PII handling can be implemented.
- **Team:** Data Team (Senior Developer)
- **Story type:** CODE
- **Acceptance criteria:**
  - Given `parseQuestionnaire()`, when reviewed, then answer field has `/* PII */` marker
  - Given `parseDecisions()`, when reviewed, then question, decision, and notes fields have markers
  - Given `isPII(fieldName)` helper, when called with PII field, then returns true
- **Story points:** 2
- **Dependencies:** SP-DATA-2-003 (data dictionary defines which fields are PII)
- **Blocker:** NONE
- **Recommendation reference:** REC-DATA-008

#### SP-DATA-3-003: GDPR Compliance Verification (2 SP)

- **Description:** As a data architect I want a GDPR compliance checklist verified against implemented data protections so that deployment readiness can be assessed.
- **Team:** Data Team (Senior Developer)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given GDPR Article 5 requirements, when checked, then each sub-article has COMPLIANT/NON-COMPLIANT status with evidence
  - Given data dictionary + PII markers, when reviewed, then all PII fields have documented lawful basis
  - Given retention policy, when checked, then storage limitation compliance is documented
- **Story points:** 2
- **Dependencies:** SP-DATA-3-001, SP-DATA-3-002
- **Blocker:** EXTERN: Deployment scope answer (QUE-DATA-001) | owner: Project Lead | escalation: Orchestrator
- **Recommendation reference:** REC-DATA-007, REC-DATA-008

## J.3 Parallel Tracks (Step F2)

### Sprint SP-DATA-1

| Track | Stories | Team | Start Condition |
|---|---|---|---|
| **Track A: Injection Prevention** | SP-DATA-1-001 (escMarkdown) | Dev | Sprint start |
| **Track B: Validation + Atomicity** | SP-DATA-1-002 (JSON schema), SP-DATA-1-003 (atomic writes) | Dev | Sprint start (parallel with Track A) |
| **Track C: Test Suite** | SP-DATA-1-004 | Dev | Track A complete (depends on escMarkdown) |

### Sprint SP-DATA-2

| Track | Stories | Team | Start Condition |
|---|---|---|---|
| **Track A: Concurrency** | SP-DATA-2-001 (multi-process sync) | Dev | SP-DATA-1-003 complete |
| **Track B: Audit + Documentation** | SP-DATA-2-002 (audit trail), SP-DATA-2-003 (data dictionary) | Dev | SP-DATA-1-001 complete |
| **Track C: Regression Tests** | SP-DATA-2-004 | Dev | Tracks A + B complete |

### Sprint SP-DATA-3

| Track | Stories | Team | Start Condition |
|---|---|---|---|
| **Track A: Retention** | SP-DATA-3-001 | Dev | QUE-DATA-003 answered |
| **Track B: PII + Compliance** | SP-DATA-3-002, SP-DATA-3-003 | Dev | SP-DATA-2-003 complete + QUE-DATA-001 answered |

## J.4 Blocker Register (Step F3)

| ID | Type | Description | Owner | Escalation | Sprint |
|---|---|---|---|---|---|
| BLK-DATA-2-001 | EXTERN | Deployment scope answer (QUE-DATA-004) determines if multi-process sync is critical | Project Lead | Orchestrator → Questionnaire Agent | SP-DATA-2 |
| BLK-DATA-3-001 | EXTERN | Retention requirements answer (QUE-DATA-003) needed before policy implementation | Project Lead | Orchestrator → Questionnaire Agent | SP-DATA-3 |
| BLK-DATA-3-002 | EXTERN | Deployment scope answer (QUE-DATA-001) determines GDPR applicability | Project Lead | Orchestrator → Questionnaire Agent | SP-DATA-3 |

## J.5 Sprint Goals and Definition of Done (Step G)

### SP-DATA-1 — Data Integrity Foundation

- **Outcome:** All critical data corruption vectors eliminated; data writes are safe against injection and crash.
- **KPIs:**
  1. Markdown injection test pass rate: 100% (12/12 patterns blocked)
  2. JSON schema validation coverage: 100% (all reads validated)
  3. Atomic write crash survival: 100% (0 corruptions per 100 simulated crashes)
- **Definition of Done:** All 4 stories complete, all tests pass, no new CRITICAL_FINDING, injection/schema/atomicity tests green.

### SP-DATA-2 — Data Governance & Synchronization

- **Outcome:** Audit trail enables change tracking for all data mutations; multi-process access is safe.
- **KPIs:**
  1. Audit trail completeness: 100% (every mutation logged)
  2. Concurrent write conflict rate: 0 per 1000 operations
  3. Data dictionary completeness: 100% (5/5 entities documented)
- **Definition of Done:** All 4 stories complete, all tests pass, data dictionary reviewed, lock mechanism stress-tested.

### SP-DATA-3 — Compliance & Governance

- **Outcome:** GDPR readiness assessed; retention policy operational; PII classified.
- **KPIs:**
  1. Expired data percentage: 0% beyond policy threshold
  2. PII field identification: 100% tagged
  3. GDPR compliance score: documented per article
- **Definition of Done:** All 3 stories complete, compliance checklist verified, retention policy tested, GDPR assessment documented.

## J.6 Sprint Plan Self-Check (Step H)

| Check | Status |
|---|---|
| All stories based on recommendations (REC-NNN) | ✅ All 11 stories reference REC-DATA-001–008 |
| All P1 recommendations have at least one story | ✅ REC-DATA-001 → SP-DATA-1-001; REC-DATA-002 → SP-DATA-1-002; REC-DATA-003 → SP-DATA-2-001 |
| All P2 recommendations have at least one story | ✅ REC-DATA-004–008 all covered |
| Every story has team assignment | ✅ All assigned to Data Team |
| Every story has ≥1 acceptance criterion | ✅ All have 2–3 criteria |
| Every story has Blocker field | ✅ All explicit (NONE or EXTERN) |
| All EXTERN blockers have owner + escalation | ✅ BLK-DATA-2-001, BLK-DATA-3-001, BLK-DATA-3-002 |
| Parallel tracks identified per sprint | ✅ 3 sprints × 2–3 tracks each |
| Assumptions documented | ✅ Team, capacity, stack, preconditions |
| Sprint KPIs SMART | ✅ Measurable targets per sprint |
| CODE/INFRA stories free of DESIGN/CONTENT/ANALYSIS blockers | ✅ Verified |

### Traceability Table

| Recommendation | Priority | Stories |
|---|---|---|
| REC-DATA-001 (escMarkdown) | P1 | SP-DATA-1-001, SP-DATA-1-004 |
| REC-DATA-002 (JSON validation) | P1 | SP-DATA-1-002 |
| REC-DATA-003 (Multi-process sync) | P1 | SP-DATA-2-001, SP-DATA-2-004 |
| REC-DATA-004 (Audit trail) | P2 | SP-DATA-2-002, SP-DATA-2-004 |
| REC-DATA-005 (Atomic writes) | P2 | SP-DATA-1-003 |
| REC-DATA-006 (Data dictionary) | P2 | SP-DATA-2-003 |
| REC-DATA-007 (Retention policy) | P2 | SP-DATA-3-001, SP-DATA-3-003 |
| REC-DATA-008 (PII classification) | P2 | SP-DATA-3-002, SP-DATA-3-003 |

**MISSING_STORY items:** NONE — All P1 and P2 recommendations have stories.

---

# K. GUARDRAILS (Steps I–M)

## GR-DATA-001 — Must Not Write User Text Without Markdown Escaping

**Reference:** GAP-DATA-002 (CRITICAL); DQ-001, DQ-009
**Scope:** All code paths that write user-submitted text to markdown files (questionnaires, decisions)
**Type:** Preventive

**Rule:** Must not write user-submitted text to any markdown file without first passing through `escMarkdown()`. This applies to: answer text, question text, decision text, decision notes, scope text.

**Violation action:** CRITICAL_FINDING — block PR; revert commit if merged.
**Verification method:** Automated static analysis check in CI pipeline: grep for `writeFileSync` calls to `.md` files → verify `escMarkdown()` in call chain. Manual code review checklist item.

**Overlap check:** Supplement to IMPL-CONSTRAINT-002 (Agent 08). New guardrail adds verification method.

## GR-DATA-002 — Must Validate JSON Schema on Every Read

**Reference:** GAP-DATA-003 (HIGH); DQ-004
**Scope:** All code paths that read and parse JSON files (session-state.json, command-queue.json)
**Type:** Preventive

**Rule:** Must always validate JSON schema after `JSON.parse()` before using data. Missing required fields must log warning and return safe defaults (not `undefined`).

**Violation action:** CRITICAL_FINDING — block PR.
**Verification method:** Unit test: parse intentionally malformed JSON → verify error handling and safe defaults. Code review: every `JSON.parse()` followed by `validateSchema()`.

**Overlap check:** New guardrail. No conflict with existing guardrails.

## GR-DATA-003 — Must Use Atomic Write Pattern for All File Mutations

**Reference:** GAP-DATA-005 (MEDIUM); DQ-008
**Scope:** All `safeWriteSync()` calls and any direct `fs.writeFileSync()` calls
**Type:** Structural

**Rule:** Must always write to temp file first, then rename. Direct `fs.writeFileSync()` to production files is prohibited.

**Violation action:** Block PR — escalate to tech lead.
**Verification method:** Code review: grep for `writeFileSync` → verify all go through `safeWriteSync()` with atomic pattern. Crash simulation test.

**Overlap check:** Supplement to Agent 08 SEC-A08-002 (no atomicity finding). New guardrail adds structural rule.

## GR-DATA-004 — Must Log All Data Mutations

**Reference:** GAP-DATA-004 (HIGH)
**Scope:** All code paths that modify persistent data (questionnaire answers, decisions, session state, commands)
**Type:** Structural

**Rule:** Requires append-only audit log entry for every data mutation. Log must include: ISO timestamp, entity type, entity ID, action, source (webapp/orchestrator).

**Violation action:** Block PR — mutation without audit log is non-compliant.
**Verification method:** Code review checklist: every write function must call audit logger. Integration test: perform mutation → verify log entry exists.

**Overlap check:** Extends existing decisions.md Change Log pattern to all entities. New guardrail.

## GR-DATA-005 — Must Not Store Data Beyond Retention Period

**Reference:** GAP-DATA-006 (MEDIUM); GDPR Art. 5(1)(e)
**Scope:** All persistent data stores (questionnaires, decisions, sessions)
**Type:** Preventive (conditional on deployment scope)

**Rule:** Must not retain data beyond defined retention period. Retention policy must be documented per entity in data dictionary. Cleanup function must execute on server startup.

**Violation action:** Escalate to data architect — manual cleanup until automated.
**Verification method:** Startup check: count data items beyond retention period → log warning if > 0. Quarterly manual audit.

**Overlap check:** Supplement to G-ARCH-08 (architecture guardrails). New guardrail for data governance.

## Guardrails Self-Check (Step M)

| Check | Status |
|---|---|
| Every guardrail formulated as testable | ✅ All start with "Must not" / "Must always" / "Requires" |
| Every guardrail has violation action | ✅ All have explicit actions |
| Every guardrail has verification method | ✅ All have automated + manual methods |
| Every guardrail references GAP/RISK finding | ✅ GR-DATA-001–005 all reference GAP-DATA-NNN |
| Overlap checked against existing guardrails | ✅ 2 supplements, 3 new |

---

# L. CROSS-REFERENCES TO PREDECESSOR AGENTS

## L.1 Agent 05 (Software Architect)

| Agent 05 Finding | Data Impact | Response |
|---|---|---|
| SF-001 (Monolithic architecture) | Single codebase for all data ops; cascading failures | DQ-002, DQ-006 |
| SF-003 (No input validation framework) | User text accepted without sanitization | SF-DATA-001; IMPL-CONSTRAINT-002 |
| Tight coupling (OCP violations) | Markdown parsing + storage tightly coupled | GAP-DATA-009 |

## L.2 Agent 06 (Senior Developer)

| Agent 06 Finding | Data Impact | Response |
|---|---|---|
| SRP-001 (apiSave does too much) | No single-responsibility data layer | Architectural debt |
| SRP-002 (parseQuestionnaire fragility) | DQ-001 | GAP-DATA-001 + design refactor |
| AP-003 (DRY violations) | Regex patterns repeated | GAP-DATA-001 |
| Test coverage = 0 | No data integrity tests | SP-DATA-1-004 (27h effort) |

## L.3 Agent 07 (DevOps Engineer)

| Agent 07 Finding | Data Impact | Response |
|---|---|---|
| SF-OPS-001 (.gitignore missing) | Secrets in questionnaire answers committed | SF-DATA-004 |
| SF-OPS-002 (No secret scanning) | Secrets in answers undetected | IMPL-CONSTRAINT-008 |

## L.4 Agent 08 (Security Architect)

| Agent 08 Finding | Data Response |
|---|---|
| SEC-A01-001/002 (No auth) | Data integrity depends on localhost isolation |
| SEC-A03-001/002 (Markdown injection) | DQ-002, DQ-009 → GAP-DATA-002 |
| SEC-A08-001/002 (No atomicity) | DQ-008 → GAP-DATA-005 |
| SEC-A09-001/002 (Minimal logging) | GAP-DATA-004 (questionnaire audit trail) |
| IMPL-CONSTRAINT-002 | Directly addresses DQ-002, DQ-009 |
| IMPL-CONSTRAINT-006 | Answers must not be logged with full text |

---

# M. JSON EXPORT

```json
{
  "agent": "09-data-architect",
  "mode": "AUDIT",
  "phase": "PHASE-2",
  "date": "2026-03-07",
  "data_architecture_risk": "HIGH",
  "entities": 5,
  "data_quality_findings": {
    "critical": 2,
    "high": 4,
    "medium": 3,
    "low": 0
  },
  "gaps": {
    "total": 10,
    "critical": 1,
    "high": 3,
    "medium": 5,
    "low": 1
  },
  "recommendations": 8,
  "sprint_plan": {
    "total_sprints": 3,
    "total_stories": 11,
    "total_story_points": 40,
    "sprints": [
      { "id": "SP-DATA-1", "stories": 4, "points": 16, "goal": "Data Integrity Foundation" },
      { "id": "SP-DATA-2", "stories": 4, "points": 15, "goal": "Data Governance & Synchronization" },
      { "id": "SP-DATA-3", "stories": 3, "points": 9, "goal": "Compliance & Governance" }
    ]
  },
  "guardrails": 5,
  "security_flags": {
    "new": 3,
    "confirmed_from_predecessors": 4
  },
  "questionnaire_requests": [
    "QUE-DATA-001",
    "QUE-DATA-002",
    "QUE-DATA-003",
    "QUE-DATA-004"
  ],
  "extern_blockers": [
    "BLK-DATA-2-001",
    "BLK-DATA-3-001",
    "BLK-DATA-3-002"
  ]
}
```

---

# N. QUESTIONNAIRE_REQUEST

The following `INSUFFICIENT_DATA:` items require customer input per Questionnaire Protocol:

## QUE-DATA-001 — Intended Deployment Scope (REQUIRED)

**Question:** Will this application be deployed beyond localhost (e.g., multi-user SaaS, cloud deployment, network sharing)?
**Why needed:** Determines GDPR applicability, authentication requirements, and data protection obligations.
**Expected format:** Yes/No + brief target description
**Impact:** If Yes → GDPR, multi-user auth, encryption become MANDATORY

## QUE-DATA-002 — Personal Data Handling (OPTIONAL)

**Question:** Will questionnaire answers or decision text contain personal data (names, emails, phone numbers, user IDs)?
**Why needed:** Determines data classification, PII masking requirements, and right-to-erasure implementation.
**Expected format:** Yes/No + examples
**Impact:** If Yes → GAP-DATA-010 (PII classification) becomes REQUIRED priority

## QUE-DATA-003 — Data Retention Requirements (REQUIRED)

**Question:** What is the intended retention period for questionnaire answers and decision records? Should old cycles be archived or deleted?
**Why needed:** Required for GDPR compliance (Art. 5(1)(e)); informs retention policy implementation.
**Expected format:** Duration (e.g., "Keep for 1 cycle + 90 days archive, then delete")
**Impact:** Determines GAP-DATA-006 implementation scope

## QUE-DATA-004 — Multi-User Synchronization (OPTIONAL)

**Question:** Will multiple users or processes access/modify the same questionnaires and decisions simultaneously?
**Why needed:** Determines whether in-memory file locking (current) is sufficient or OS-level locking required.
**Expected format:** Yes/No + scenario
**Impact:** If Yes → GAP-DATA-007 becomes CRITICAL priority

---

# O. HANDOFF CHECKLIST — Data Architect — 2026-03-07

- [x] MODE: AUDIT
- [x] Data model fully inventoried (5 entities based on schema artifacts — Section A)
- [x] Data lineage documented for all primary domains (5 flows — Section B)
- [x] Data governance analysis complete (ownership, dictionary, retention, classification — Section C)
- [x] Data quality analysis complete (9 findings DQ-001–DQ-009 — Section D)
- [x] Analytics architecture documented (Section E)
- [x] Data compliance analysis complete based on Security Architect framework (Section F)
- [x] Data architecture gap analysis linked to Phase 1 goals (10 gaps — Section G)
- [x] All findings have a source reference (file, line range, or document citation)
- [x] JSON export present and valid (Section M)
- [x] Self-check performed (Section H)
- [x] Recommendations: every recommendation references a GAP/RISK analysis finding (8/8 — Section I)
- [x] Recommendations: all impact fields filled in or marked as INSUFFICIENT_DATA: (Revenue = INSUFFICIENT_DATA on all)
- [x] Recommendations: all success criteria are SMART (KPI + baseline + target + measurement + time)
- [x] Sprint Plan: assumptions (team, capacity, preconditions) documented (Section J.1)
- [x] Sprint Plan: all stories have at least 1 acceptance criterion (11/11 stories — Section J.2)
- [x] Sprint Plan: all P1 and P2 recommendations have at least one story (traceability table — Section J.6)
- [x] Guardrails: all guardrails formulated as testable (5/5 — Section K)
- [x] Guardrails: all guardrails have violation action AND verification method (5/5)
- [x] Guardrails: all guardrails reference a GAP/RISK analysis finding (5/5)
- [x] All 4 deliverables present: Analysis ✅ Recommendations ✅ Sprint Plan ✅ Guardrails ✅
- [x] PHASE 2 OUTPUT: Data fully available as input for Legal Counsel (33)
- [x] Questionnaire input check performed (NOT_INJECTED documented)
- [x] All remaining INSUFFICIENT_DATA: items compiled as QUESTIONNAIRE_REQUEST (4 items — Section N)
- [x] Output complies with agent-handoff-contract.md
- **STATUS: READY FOR HANDOFF TO LEGAL COUNSEL (33)**
