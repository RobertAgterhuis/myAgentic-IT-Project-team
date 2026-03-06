````markdown
# Contract: Tooling
> Version 1.0 | Defines which tools agents may use and how tool availability is managed

---

## PURPOSE

This contract defines:
1. Which tools must be available for each phase
2. How agents verify and report tool availability
3. What agents do when tools are missing or failing
4. Prohibited tool actions (security and integrity)

---

## TOOL CATEGORIES

### Category A: Reading & Analyzing (required for Phase 1–4)

| Tool | Purpose | Minimum version | Verification command |
|------|------|----------------|-------------------|
| File system (read) | Read codebase and documentation | - | File path resolves |
| Git (read-only) | Commit history, blame, diff | 2.x | `git --version` |
| Grep / search | Detect patterns in code | - | File content searchable |

### Category B: Writing & Storing (required for all phases)

| Tool | Purpose | Minimum version | Verification command |
|------|------|----------------|-------------------|
| File system (write) | Write output documents | - | Write permissions on working directory |
| JSON validator | Validate session state and contracts | - | JSON parses without error |

### Category C: Building & Testing (required for Phase 5)

| Tool | Purpose | Minimum version | Verification command |
|------|------|----------------|-------------------|
| Test runner | Run unit tests and integration tests | Project-specific | `[runner] --version` |
| Linter / static analysis | Check code quality and style | Project-specific | `[linter] --version` |
| Build tool | Build and compile project | Project-specific | `[buildtool] --version` |
| Git (write) | Create commits, branches, PRs | 2.x | `git --version` |

### Category D: Optional (improves analysis quality)

| Tool | Purpose | Verification command |
|------|------|----------------------|
| Dependency scanner | Detect outdated or vulnerable dependencies | - |
| Code coverage tool | Measure test coverage | - |
| Performance profiler | Identify bottlenecks | - |
| Accessibility checker | Validate WCAG compliance | - |

### Category D+: Recommended (no alternative interface)

| Tool | Purpose | Verification command |
|------|------|----------------------|
| Questionnaire & Decisions Manager web UI | Visual questionnaire editing and decisions management for non-technical stakeholders. Supports: viewing/answering questionnaires, creating new decisions (DECIDED or OPEN_QUESTION), answering open questions, promoting open questions to decided items. Writes directly to `BusinessDocs/` (questionnaires) and `.github/docs/decisions.md` (decisions). **Note:** While questionnaire files can be edited directly in a text editor, this web UI is the only guided interface for non-technical users and is strongly recommended when stakeholders are filling in questionnaires. | `node .github/webapp/server.js` → http://127.0.0.1:3000 |

> **Category D+ rationale:** These tools are not strictly required (file-level editing is always possible), but they provide the **only user-friendly interface** for their function and have no equivalent alternative. Treat as RECOMMENDED — document as `TOOL_RECOMMENDED_MISSING` (not `TOOL_UNAVAILABLE`) when absent.

---

## TOOL AVAILABILITY PROTOCOL

### During verification (Onboarding Agent, mandatory):

```markdown
## TOOLING STATUS REPORT
| Tool | Status | Version | Category | Blocks |
|------|--------|--------|-----------|-----------|
| File system (read) | AVAILABLE | - | A | Phase 1–4 + Phase 5 |
| Git (read-only) | AVAILABLE | 2.43.0 | A | None (RECOMMENDED) |
| File system (write) | AVAILABLE | - | B | All phases |
| Test runner | TOOL_UNAVAILABLE | - | C | Phase 5 |
```

### Status values:

| Status | Meaning | Action |
|--------|-----------|-------|
| `AVAILABLE` | Tool present and functional | Continue |
| `TOOL_UNAVAILABLE` | Tool not found | Document, block dependent phase |
| `TOOL_DEGRADED` | Tool present but issues (wrong version, permission problem) | Document, escalate if critical |
| `TOOL_UNTESTED` | Not verified | Treat as TOOL_UNAVAILABLE |
| `TOOL_RECOMMENDED_MISSING` | Category D+ tool not found — no alternative interface | Document in Tooling Status Report and Synthesis recommendations; does NOT block any phase |

---

## PHASE DEPENDENCY

| Phase | Required categories | Phase starts when... |
|------|---------------------|-------------------|
| Onboarding | A + B | Always (minimum check) |
| Phase 1–4 (analysis) | A + B | All Category A + B AVAILABLE |
| Phase 5 (implementation) | A + B + C | All Category A + B + C AVAILABLE |

**TOOLING_GAP for Category C blocks Phase 5, but NOT Phase 1–4.** This must be explicitly documented in the Onboarding Output so that the Synthesis Agent can include a recommendation.

---

## PROHIBITED TOOL ACTIONS (ALL AGENTS, ALWAYS)

1. **PROHIBITION:** Do not read, log, or pass on any secret, credential, API key, or password — not even temporarily in memory
2. **PROHIBITION:** Do not directly access or mutate a production database outside the designated test environment
3. **PROHIBITION:** Do not make external network calls outside the explicit toolset (no arbitrary HTTP calls)
4. **PROHIBITION:** Do not perform destructive git operations (`--force push`, `reset --hard` on main/master) without explicit human confirmation via the Human Escalation Protocol
5. **PROHIBITION:** Do not commit binary files or generated artifacts that do not belong to the implementation
6. **PROHIBITION:** Do not install new tools or packages outside the defined toolset without a `TOOL_INSTALL_REQUEST` escalation

---

## TOOL_INSTALL_REQUEST PROTOCOL

If an agent concludes that a missing tool is necessary for execution:

```markdown
## TOOL_INSTALL_REQUEST
- Requesting agent: [agent name]
- Tool: [name + version]
- Reason: [why is this tool necessary?]
- Alternative without tool: [or NO ALTERNATIVE]
- Risk of not installing: [impact on cycle]
- Required action from user: [installation instruction or approval]
```

Escalate to the user via the Human Escalation Protocol. Wait for confirmation. NEVER install independently.

---

## TOOL OUTPUT PRESERVATION

- All tool output used as evidence for a finding MUST be cited with: tool name, command, exact output snippet
- Temporary tool output (e.g. test logs) is stored in `.github/docs/tool-output/[phase]/[agent]/` for traceability
- Tool output older than the current session: mark as `STALE_OUTPUT: [date]` — do not use as primary evidence

````
