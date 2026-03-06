# Skill Files Cross-Cutting Audit — Sweep 4

> **Scope:** All 38 skill files (`.github/skills/00-orchestrator.md` through `37-scope-change-agent.md`) + `.github/docs/agent-index.md`
> **Date:** 2025-07-15
> **Auditor:** Automated cross-cutting analysis
> **Prior sweep:** Sweep 3 — Contract integrity audit (24 findings, see `Documentation/contract-integrity-audit-sweep3.md`)

---

## Methodology

All 38 skill files were read in full. Targeted grep searches validated structural patterns across all files for: HANDOFF CHECKLIST presence, guardrail file references, `decisions.md` integration, `agent-handoff-contract` references, and phase closure self-checks. Findings are cross-referenced against the Orchestrator phase sequence in `copilot-instructions.md` and the agent-index.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 3 |
| MEDIUM | 7 |
| LOW | 4 |
| **Total** | **16** |

---

## Findings Table

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| SK-001 | CRITICAL | Handoff Format | Agent-handoff-contract referenced by zero skill files |
| SK-002 | CRITICAL | Guardrail References | Guardrail files 07-legal and 08-content never referenced by any skill file |
| SK-003 | HIGH | Handoff Format | Synthesis Agent (17) is the only agent missing HANDOFF CHECKLIST |
| SK-004 | HIGH | Missing Instructions | Critic Agent (18) does not load decisions.md |
| SK-005 | HIGH | Guardrail References | Newer agents (32-35) lack specific phase guardrail file references |
| SK-006 | MEDIUM | Missing Instructions | Phase 1-4 specialist agents have no scope change context instructions |
| SK-007 | MEDIUM | Scope Overlap | Content Strategist (32) and Brand Strategist (14) both own voice & tone |
| SK-008 | MEDIUM | Input/Output Chain | Feature Agent (24) doesn't clarify Phase 5 handoff to Orchestrator |
| SK-009 | MEDIUM | Cross-Agent Consistency | KPI Agent (29) BRAND category not in baseline schema enum |
| SK-010 | MEDIUM | Missing Instructions | Scope Change Agent (37) MARKETING dimension omits Brand Assets + Storybook |
| SK-011 | MEDIUM | Cross-Agent Consistency | Questionnaire Agent (36) trigger description is ambiguous |
| SK-012 | MEDIUM | Input/Output Chain | Brand Assets Agent (30) ignores Growth Marketer and CRO Specialist output |
| SK-013 | LOW | Cross-Agent Consistency | Agent-index table uses execution order instead of numerical order |
| SK-014 | LOW | Handoff Format | Synthesis Agent uses "DEFINITION OF DONE" header instead of "HANDOFF CHECKLIST" |
| SK-015 | LOW | Missing Instructions | Implementation Agent (20) guardrail path uses inconsistent file names |
| SK-016 | LOW | Phase Boundary Alignment | Phase closure self-check naming not fully standardized |

---

## Detailed Findings

### SK-001 — CRITICAL — Agent-handoff-contract referenced by zero skill files

**Category:** Handoff Format
**Description:** The `agent-handoff-contract` (`.github/docs/contracts/agent-handoff-contract.md`) is listed in the agent-index Contracts Reference table. However, a search across all 38 skill files for `agent-handoff-contract` returned **zero matches**. No agent references this contract as governing its input/output format.

This means the handoff contract exists as a specification document but has no enforcement pathway. Agents produce handoff output guided only by their individual skill files and the universal Handoff Checklist template in `copilot-instructions.md`.

**Impact:** The contract is dead-letter — agents may produce output that doesn't conform to the handoff contract schema, and successor agents have no guarantee about the format of their input.

**Fix:** Add an explicit reference to `agent-handoff-contract.md` in the handoff checklist section of every skill file that hands off to another agent. At minimum: all Phase 1-4 specialist agents (01-16, 32-35), Synthesis (17), Critic (18), Risk (19), and all Phase 5 agents (20-29). Format: `- [ ] Output complies with .github/docs/contracts/agent-handoff-contract.md`.

---

### SK-002 — CRITICAL — Guardrail files 07-legal and 08-content never referenced by any skill file

**Category:** Guardrail References
**Description:** The guardrails index lists 10 guardrail files. Searching all 38 skill files confirms:

| Guardrail file | Referenced by skill files |
|----------------|-------------------------|
| 00-global-guardrails | 20-implementation-agent |
| 01-business-guardrails | 01, 02, 03, 04 |
| 02-architecture-guardrails | 05, 06, 07, 09, 20 |
| 03-security-guardrails | 08, 20 |
| 04-ux-guardrails | 10, 11, 12, 13 |
| 05-marketing-guardrails | 14, 15, 16 |
| 06-implementation-guardrails | 20, 21 |
| **07-legal-guardrails** | **NONE** |
| **08-content-guardrails** | **NONE** |
| 09-questionnaire-guardrails | 36 |

Legal Counsel (33) — the primary legal agent — does not reference `07-legal-guardrails.md`. Content Strategist (32) and Localization Specialist (35) — the content/i18n agents — do not reference `08-content-guardrails.md`.

**Impact:** Two guardrail files exist but are never loaded by any agent. Rules in those files are unenforceable.

**Fix:**
- Add `07-legal-guardrails.md` reference to Legal Counsel (33) handoff checklist
- Add `08-content-guardrails.md` reference to Content Strategist (32) and Localization Specialist (35) handoff checklists
- Consider adding `07-legal-guardrails.md` to Security Architect (08) and Data Architect (09) since they handle GDPR-adjacent technical concerns

---

### SK-003 — HIGH — Synthesis Agent (17) is the only agent missing HANDOFF CHECKLIST

**Category:** Handoff Format
**Description:** A grep for "HANDOFF CHECKLIST" across all 38 skill files found matches in 36 of 37 non-orchestrator agents. The only agent without a HANDOFF CHECKLIST section is **Synthesis Agent (17)**. It uses a section headed `## DEFINITION OF DONE (SYNTHESIS)` with checkboxes at line 271.

While functionally similar, this breaks the naming convention mandated by the Universal Agent Rules in `copilot-instructions.md`, which states: "Every agent MUST produce a **Handoff Checklist** at the end of its output." The Critic Agent (18) explicitly checks for "Handoff Checklist present and fully completed" — a check that would fail if the Synthesis Agent uses a different heading.

**Impact:** The Critic may not recognize the Synthesis Agent's definition-of-done section as a valid handoff checklist. If the Critic validates the Synthesis Agent's output (which it does not currently, since Critic runs before Synthesis), this convention mismatch could cause false negative validations.

**Fix:** Rename `## DEFINITION OF DONE (SYNTHESIS)` to `## HANDOFF CHECKLIST — Synthesis Agent — [Date]` and keep the existing checkboxes.

---

### SK-004 — HIGH — Critic Agent (18) does not load decisions.md

**Category:** Missing Instructions
**Description:** The Critic Agent validates phase output for completeness, consistency, and contract compliance. However, it does **not** load or reference `.github/docs/decisions.md` anywhere in its skill file.

Agents that DO load decisions.md: Orchestrator (00), Synthesis (17), Risk (19), Implementation (20), PR/Review (22), Reevaluate (23).

The Risk Agent (19) — which runs in parallel with the Critic — loads decisions.md at Step 0. But the Critic does not. This means the Critic cannot detect when a phase agent's output contradicts a previously DECIDED item.

**Impact:** Phase output that conflicts with a DECIDED constraint passes Critic validation unchallenged. The conflict is only caught later by the Synthesis Agent (Step 0 decisions check) or the Risk Agent — but the Critic's per-agent verdict (APPROVED/NEEDS_REVISION) is issued without this validation.

**Fix:** Add a Step 0 to the Critic Agent: "Load `.github/docs/decisions.md`. For every agent output being validated, verify that no recommendation or finding contradicts a DECIDED item." Add a corresponding checklist item.

---

### SK-005 — HIGH — Newer agents (32-35) lack specific phase guardrail file references

**Category:** Guardrail References
**Description:** The "original" Phase 1-4 agents (01-16) all cite specific guardrail files with rule IDs in their handoff checklists:

- Phase 1 agents (01-04): cite `01-business-guardrails` with specific G-BUS-xx rules
- Phase 2 agents (05-09): cite `02-architecture` or `03-security` with specific G-ARCH/G-SEC rules
- Phase 3 agents (10-13): cite `04-ux-guardrails` with specific G-UX-xx rules
- Phase 4 agents (14-16): cite `05-marketing-guardrails` with specific G-MKT-xx rules

The "newer" agents added to these phases do NOT cite specific guardrails:

| Agent | Phase | Expected guardrail | Actually cited |
|-------|-------|-------------------|----------------|
| 34-Product Manager | Phase 1 | 01-business-guardrails | Generic only (`/.github/docs/guardrails/`) |
| 33-Legal Counsel | Phase 2 | 07-legal-guardrails | None |
| 32-Content Strategist | Phase 3 | 08-content-guardrails | None |
| 35-Localization Specialist | Phase 3 | 08-content-guardrails | None |

**Impact:** These agents produce guardrails output (Step G) without reading the phase-specific guardrail file first. They may duplicate existing guardrails or produce conflicting rules.

**Fix:** Add to each agent's handoff checklist: the specific guardrail file reference with applicable rule IDs, matching the pattern used by the original agents (e.g., Product Manager should reference `01-business-guardrails.md`).

---

### SK-006 — MEDIUM — Phase 1-4 specialist agents have no scope change context instructions

**Category:** Missing Instructions
**Description:** When the Scope Change Agent (37) triggers re-analysis, each re-activated agent should be aware that it's operating in a scope change context. The Scope Change Agent's Step 4 says: "Instructions per agent are identical to the base analysis cycle, with one mandatory addition" — meaning all rewriting of scope-change-aware behavior is injected by the Orchestrator at runtime rather than being part of the skill file.

Post-phase utility agents (28-Retrospective, 29-KPI, 30-Brand Assets, 31-Storybook, 36-Questionnaire) **do** have explicit `## SCOPE CHANGE context` sections in their skill files. Phase 1-4 specialist agents (01-16, 32-35) do **not**.

**Impact:** Phase 1-4 agents rely entirely on Orchestrator injection for scope change awareness. If the Orchestrator fails to inject the context block, the agent has no skill-level awareness to check for SCOPE_CHANGE_INVALIDATED markers in its input.

**Fix:** Add a brief scope change awareness paragraph to the Step 0 of each Phase 1-4 specialist agent: "If the Orchestrator has injected `## SCOPE CHANGE CONTEXT`, read the premise delta, exclude INVALIDATED findings from your predecessors, and add a `## Scope Change Impact` section as the FIRST section of all outputs."

---

### SK-007 — MEDIUM — Content Strategist (32) and Brand Strategist (14) both own voice & tone

**Category:** Scope Overlap
**Description:** Content Strategist (32, Phase 3, Step 2) defines "Voice & Tone Definition" as a core deliverable. Brand Strategist (14, Phase 4, Step 1) also defines "Brand voice/tone" and "Verbal identity" as core deliverables.

Since Phase 3 runs before Phase 4, the Content Strategist addresses this with a PLACEHOLDER mechanism: "if Phase 4 not yet complete, use `PLACEHOLDER: brand values pending Brand Strategist`". However:
1. No corresponding rule in the Brand Strategist acknowledges the Content Strategist's voice & tone work
2. No deconfliction protocol exists for when both have been completed and they diverge
3. In combo cycles (`CREATE UX MARKETING`), both run sequentially — the Brand Strategist may contradict the Content Strategist without awareness

**Impact:** Voice & tone may be defined twice with conflicting guidance. The Critic Agent validates each phase independently, not cross-phase voice & tone consistency.

**Fix:** Add to Brand Strategist (14) Step 1: "Load Content Strategist voice & tone output (if Phase 3 has completed). Align or explicitly override with rationale — document any divergence as `VOICE_TONE_OVERRIDE: [CS finding] → [BS decision] — [rationale]`."

---

### SK-008 — MEDIUM — Feature Agent (24) doesn't clarify Phase 5 handoff to Orchestrator

**Category:** Input/Output Chain
**Description:** The Feature Agent (24) creates an isolated feature cycle. The `copilot-instructions.md` Phase Sequence defines: "FEATURE [name] → Feature Agent → full cycle (Phase 1–4 + Synthesis + Sprint Plan + Phase 5)".

However, the Feature Agent skill file Step 4 says: "execute full multi-agent cycle (all 20 domain agents + Critic/Risk per phase + Brand Assets + Storybook conditionally + Synthesis)". This lists agents up through Synthesis but does **not** mention Phase 5 agents (20-29) or how the feature sprint plan transitions to Phase 5 execution.

**Impact:** Ambiguity about whether the Feature Agent directly orchestrates Phase 5 or hands the feature sprint plan back to the Orchestrator for Phase 5 execution. This could lead to features getting sprint plans without implementation.

**Fix:** Add to Feature Agent Step 5: "After Synthesis APPROVED: hand off the feature sprint plan at `Workitems/[FEATURENAME]/sprint-plan.md` to the Orchestrator for Phase 5 execution. The Orchestrator applies the standard Sprint Gate and sprint loop (Implementation → Test → PR/Review → KPI → Documentation → GitHub Integration → Retrospective) using the feature sprint plan as input."

---

### SK-009 — MEDIUM — KPI Agent (29) BRAND category not in baseline schema enum

**Category:** Cross-Agent Consistency
**Description:** The KPI Agent Step 0 defines the KPI baseline schema with category enum: `PERFORMANCE | QUALITY | BUSINESS | UX | SECURITY | TECHNICAL`. Step 2 measurement sources table includes a `BRAND` row with sources: "Sprint Completion Report (`brand_review` field)".

However, `BRAND` is not in the Step 0 enum. A KPI with category `BRAND` would be invalid according to the baseline schema. Additionally, the Step 5 section references `brand_violations_count` and `BRAND_COMPLIANCE` lessons — but there's no way to create a KPI baseline entry with category `BRAND` to track this systematically.

**Impact:** Brand compliance KPIs cannot be formally tracked in the kpi-baseline.json schema. The `brand_violations_count` is measured ad-hoc in the sprint summary but cannot be compared against a baseline target.

**Fix:** Add `BRAND` to the category enum in Step 0: `PERFORMANCE | QUALITY | BUSINESS | UX | SECURITY | TECHNICAL | BRAND`.

---

### SK-010 — MEDIUM — Scope Change Agent (37) MARKETING dimension omits Brand Assets + Storybook

**Category:** Missing Instructions
**Description:** The Scope Change Agent Step 4 defines agent activation per dimension. For `MARKETING`: "Brand Strategist → Growth Marketer → CRO Specialist → Critic + Risk". After Phase 4 completion in the normal flow, Brand Assets Agent (30) and Storybook Agent (31) run before Synthesis.

Both agents have explicit scope change context handling (BRAND_ASSETS_WAITING, STORYBOOK_WAITING markers). However, the Scope Change Agent's MARKETING dimension table does **not** list them as activated agents. This means their re-activation after a MARKETING scope change depends on implicit orchestrator behavior rather than explicit instructions.

**Impact:** A MARKETING scope change re-runs Brand Strategist but may not trigger design token and component library regeneration. Brand Assets and Storybook would still hold stale tokens from the previous Brand Strategist output.

**Fix:** Add to the MARKETING dimension row: "Brand Strategist → Growth Marketer → CRO Specialist → Critic + Risk → **Brand Assets Agent → Storybook Agent**" (matching the normal post-Phase 4 flow). Similarly for `ALL` dimension.

---

### SK-011 — MEDIUM — Questionnaire Agent (36) trigger description is ambiguous

**Category:** Cross-Agent Consistency
**Description:** The Questionnaire Agent skill file states: "**Trigger (questionnaire generation):** Called by any phase agent that has `INSUFFICIENT_DATA:` items that cannot be resolved from code or documentation alone. Called from within the Orchestrator's phase completion handler."

The first sentence implies phase agents directly call the Questionnaire Agent. The second sentence clarifies it's actually called by the Orchestrator after phase completion. The `copilot-instructions.md` Phase Sequence confirms: questionnaire generation runs after Critic + Risk validation, not during phase agent execution.

**Impact:** Ambiguity about the trigger mechanism. If an agent interprets "called by any phase agent" literally, it might try to invoke the Questionnaire Agent mid-phase instead of passing `QUESTIONNAIRE_REQUEST` items to the Orchestrator.

**Fix:** Rewrite the trigger to: "**Trigger (questionnaire generation):** Activated by the Orchestrator after Critic + Risk validation for a phase has passed. Phase agents pass `QUESTIONNAIRE_REQUEST` items with their `INSUFFICIENT_DATA:` items — the Orchestrator collects these and forwards them to this agent."

---

### SK-012 — MEDIUM — Brand Assets Agent (30) ignores Growth Marketer and CRO Specialist output

**Category:** Input/Output Chain
**Description:** Brand Assets Agent (30) declares mandatory input as: "Phase 4 brand output (Brand Strategist deliverables)". However, Phase 4 has three agents: Brand Strategist (14), Growth Marketer (15), and CRO Specialist (16).

The Brand Assets Agent generates social card templates, email headers, and marketing banners — assets that would benefit from Growth Marketer's channel strategy and CRO Specialist's conversion optimization insights (e.g., CTA-optimized banner layouts, channel-specific dimensions).

**Impact:** Marketing assets are generated based only on brand identity, without channel strategy or conversion optimization context. Assets may need rework after Phase 5 implementation surfaces growth/CRO requirements.

**Fix:** Add to Brand Assets Agent mandatory input: "Growth Marketer (15) channel strategy output (for channel-specific asset dimensions and templates) and CRO Specialist (16) conversion design output (for CTA placement and landing page assets)." Mark as OPTIONAL if Phase 4 is incomplete.

---

### SK-013 — LOW — Agent-index table uses execution order instead of numerical order

**Category:** Cross-Agent Consistency
**Description:** The agent-index Skills Reference table lists agents in phase execution order: 00-16, then 32-35, then 17-31, 36-37. File numbers jump from 16 (CRO Specialist) to 32 (Content Strategist), back to 17 (Synthesis Agent), and forward to 37 (Scope Change Agent).

This follows the logical phase sequence but makes it difficult to look up an agent by its file number.

**Impact:** Minor navigability issue. Developers looking for agent 32 by scrolling to position 32 in the table will find Reevaluate Agent (23) instead.

**Fix:** Add a second column to the agent-index table showing the file number, or add a comment noting the table is ordered by execution phase, not file number.

---

### SK-014 — LOW — Synthesis Agent uses "DEFINITION OF DONE" header instead of "HANDOFF CHECKLIST"

**Category:** Handoff Format
**Description:** All 36 non-orchestrator agents use `## HANDOFF CHECKLIST` as the standard section heading. The Synthesis Agent (17) uses `## DEFINITION OF DONE (SYNTHESIS)` instead. The content is functionally equivalent (checkbox list), but the heading doesn't match the universal convention.

The Critic Agent (18) explicitly checks for "Handoff Checklist present and fully completed" — this string pattern wouldn't match "DEFINITION OF DONE".

**Impact:** Cosmetic inconsistency. Could cause automated validation to miss the Synthesis Agent's completion checklist.

**Fix:** Rename to `## HANDOFF CHECKLIST — Synthesis Agent — [Date]`.

---

### SK-015 — LOW — Implementation Agent (20) guardrail path uses inconsistent file names

**Category:** Missing Instructions
**Description:** Implementation Agent (20) references guardrail files at line 44:
```
.github/docs/guardrails/00-global.md
.github/docs/guardrails/02-architecture.md
.github/docs/guardrails/03-security.md
.github/docs/guardrails/06-implementation-guardrails.md
```

The first three use abbreviated names (`00-global.md`, `02-architecture.md`, `03-security.md`). The actual file names per agent-index are `00-global-guardrails.md`, `02-architecture-guardrails.md`, `03-security-guardrails.md`. The fourth file (`06-implementation-guardrails.md`) uses the full name and is correct.

**Impact:** If the Implementation Agent resolves paths literally, it would fail to find 3 of 4 guardrail files.

**Fix:** Update the paths to match the canonical names from agent-index:
```
.github/docs/guardrails/00-global-guardrails.md
.github/docs/guardrails/02-architecture-guardrails.md
.github/docs/guardrails/03-security-guardrails.md
.github/docs/guardrails/06-implementation-guardrails.md
```

---

### SK-016 — LOW — Phase closure self-check naming not fully standardized

**Category:** Phase Boundary Alignment
**Description:** The last agent of each phase has a closure self-check section, but naming varies:

| Agent | Phase | Section heading |
|-------|-------|----------------|
| 34-Product Manager | Phase 1 (last) | `Step 8: Self-Check (Phase 1 Closure)` |
| 33-Legal Counsel | Phase 2 (last) | `Step 8: Self-Check (Phase 2 Closure)` |
| 35-Localization Specialist | Phase 3 (last) | `Step 6: Self-Check (Phase 3 Closure)` |
| 16-CRO Specialist | Phase 4 (last) | `Step 7: Self-Review (Phase 4 Closure)` |

CRO Specialist uses "Self-Review" while others use "Self-Check". All four agents DO have the section, which is the important part.

**Impact:** Cosmetic. Pattern matching for closure sections would miss "Self-Review" if searching for "Self-Check".

**Fix:** Rename CRO Specialist's section from "Self-Review" to "Self-Check" for consistency.

---

## Cross-Reference with Sweep 3 (Contract Audit)

| Sweep 3 Finding | Related Sweep 4 Finding | Status |
|-----------------|------------------------|--------|
| C2-001: Agent-index missing 14 contracts | SK-001: Agent-handoff-contract unreferenced | **Compounding** — contract exists but even when indexed, no skill file uses it |
| C2-004: Story status vocabulary divergence | — | No new skill-level findings |
| C2-005: Handoff contract only for Phase 1-4 | SK-001: Confirms zero usage | **Compounding** |

---

## Recommendations Priority

### Immediate (before next Phase 5 sprint)
1. **SK-015**: Fix Implementation Agent guardrail file paths (prevents file-not-found at runtime)
2. **SK-009**: Add BRAND to KPI baseline category enum (prevents schema validation failures)

### Before next full CREATE/AUDIT cycle
3. **SK-001**: Add agent-handoff-contract references to all handoff checklists
4. **SK-002**: Add 07-legal and 08-content guardrail references to agents 32-35
5. **SK-004**: Add decisions.md loading to Critic Agent Step 0
6. **SK-003/SK-014**: Rename Synthesis Agent section to HANDOFF CHECKLIST
7. **SK-005**: Add specific guardrail references to agents 32-35

### Before next scope change
8. **SK-010**: Add Brand Assets + Storybook to MARKETING dimension in Scope Change Agent
9. **SK-006**: Add scope change awareness to Phase 1-4 specialist agent Step 0 sections

### Improvement backlog
10. **SK-007, SK-008, SK-011, SK-012, SK-013, SK-016**: Lower-priority consistency and clarity improvements
