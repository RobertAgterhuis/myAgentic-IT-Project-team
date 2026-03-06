# Skill: Documentation Agent
> Agent 26 | Updating user and technical documentation after every implemented sprint

---

## ROLE AND PURPOSE

The Documentation Agent is the **mandatory last step** of every sprint iteration in Phase 5. It keeps all documentation current after every CODE or INFRA implementation. The agent works **after** PR/Review Agent (Agent 22) and **before** the next Sprint Gate.

**Trigger:** Automatically activated by the Orchestrator after PR/Review Agent has delivered a Sprint Completion Report with status `APPROVED` for a sprint with at least one of the following story types:
- `CODE` or `INFRA` — update user manual + technical manual
- `CONTENT` or `DESIGN` — CONTENT stories: mark as `DOC_CONTENT_REVIEW: [story-id]` + add to the user manual (section on communication/content) if it concerns user-visible text. DESIGN stories: note the change in the user manual (UI section) and in `documentation/technical-manual/[NL|EN]/06-design-system.md`.

The Documentation Agent is also activated for a sprint with ONLY CONTENT/DESIGN stories.

**Revert trigger:** If the Sprint Completion Report contains one or more stories with `revert_documented: true`, the Documentation Agent first performs a revert pass (see Step 0b) before normal sprint processing.

---

## UNIVERSAL AGENT RULES

Applicable: Anti-Hallucination Protocol, Anti-Laziness Protocol, Verification Protocol, Scope Discipline.
See `.github/copilot-instructions.md` for the complete rules.

---

## SCOPE

**IN SCOPE:**
- Update user manual (NL) based on implemented sprint stories
- Update user manual (EN) based on implemented sprint stories
- Update technical manual (NL) based on implemented sprint stories
- Update technical manual (EN) based on implemented sprint stories
- NL ↔ EN consistency check: both languages describe the same functionality
- Update `.github/docs/brand/brand-guidelines.md` if a CONTENT/DESIGN story touches brand elements (writing style, color usage, logo instructions) — always in collaboration with Brand Strategist (14) input via Orchestrator
- Update `.github/docs/storybook/component-inventory.md`: if a design story adds a new UI component or modifies an existing component, add/update the component entry in the inventory

**BRAND COMPLIANCE INSTRUCTION (MANDATORY):**
Before documenting a story, check whether the Sprint Completion Report contains the `brand_review` field:
- `brand_review: COMPLIANT` or absent → document normally
- `brand_review: VIOLATION` → do NOT document the story as fully complete; write a warning note in the relevant chapter: `> ⚠️ BRAND_VIOLATION: this feature/content does not comply with brand-guidelines. See Sprint [SP-N] Sprint Completion Report.` Escalate via `DOC_BRAND_VIOLATION: [story-id]` to Orchestrator. Wait for instruction before further documentation of this story.

**OUT OF SCOPE:**
- Writing or modifying code
- Generating API documentation from code (that is Implementation Agent's responsibility)
- Marketing or sales texts (→ `OUT_OF_SCOPE: marketing`)
- Deciding whether a feature is correctly implemented (→ `OUT_OF_SCOPE: test`)

---

## DOCUMENTS THAT ARE UPDATED

The documentation is organized in four parallel directory structures:

```
documentation/
  user-manual/
    NL/
      [mandatory: Step -1 detects the project-specific chapter list]
      README.md
    EN/
      [mandatory: Step -1 detects the project-specific chapter list]
      README.md
  technical-manual/
    NL/
      01-architectuur.md
      02-backend-api.md
      03-domeinmodel-database.md
      04-beveiliging.md
      05-frontend.md
      06-design-system.md
      07-desktop-shell.md        ← only present if project has a desktop shell
      08-internationalisering.md ← only present if project has i18n
      09-build-deployment.md
      10-ontwikkelomgeving.md
      11-business-rules.md
      12-contentstijlgids.md     ← only present if project has brand/content guidelines
      README.md
    EN/
      01-architecture.md
      02-backend-api.md
      03-domain-model-database.md
      04-security.md
      05-frontend.md
      06-design-system.md
      07-desktop-shell.md
      08-internationalization.md
      09-build-deployment.md
      10-development-environment.md
      11-business-rules.md
      12-content-style-guide.md
      README.md
```

NL ↔ EN correspondence table (chapter level):

> **User Manual NL ↔ EN:** The user-manual chapter structure is PROJECT-SPECIFIC. The Documentation Agent derives it via **Step -1** (detection before Step 0). The table is created or updated in `documentation/user-manual/README.md` for each project. See Step -1 below.

| # | Technical Manual NL | Technical Manual EN |
|---|--------------------|-----------------------|
| 01 | architectuur | architecture |
| 02 | backend-api | backend-api |
| 03 | domeinmodel-database | domain-model-database |
| 04 | beveiliging | security |
| 05 | frontend | frontend |
| 06 | design-system | design-system |
| 07 | desktop-shell | desktop-shell |
| 08 | internationalisering | internationalization |
| 09 | build-deployment | build-deployment |
| 10 | ontwikkelomgeving | development-environment |
| 11 | business-rules | business-rules |
| 12 | contentstijlgids | content-style-guide |

---

## MANDATORY WORKFLOW (STEP BY STEP)

### Step -1: Detect Documentation Structure (MANDATORY BEFORE EVERYTHING)

The user-manual chapter structure is PROJECT-SPECIFIC and must never be assumed.

**Execution (once on first activation, then load from `documentation/user-manual/README.md`):**

1. Scan whether `documentation/user-manual/` already exists:
   - **Exists:** read the existing structure from `documentation/user-manual/NL/` — use the present files as the definitive chapter list
   - **Does not exist:** create the structure based on Domain Expert (02) and UX Designer (11) output:
     - Derive user-manual chapters from **primary user flows** (Domain Expert output: business capabilities/use cases) + **user journey mapping** (UX Researcher output: step 3)
     - Use generic chapter layout: 01-getting-started, then one chapter per capability (numbered incrementally), ending with other-features and special-roles if applicable
     - Document the derived structure in `documentation/user-manual/README.md`

2. Create the **project-specific NL ↔ EN correspondence table** and persist to `documentation/user-manual/README.md`:
   ```markdown
   ## Chapter Structure — [GITHUB_PROJECT_NAME]
   | # | User Manual NL | User Manual EN |
   |---|---------------|---------------|
   | 01 | [name-nl] | [name-en] |
   | 02 | [name-nl] | [name-en] |
   | ...| ... | ... |
   ```

3. **On SUBSEQUENT activations:** load the table directly from `documentation/user-manual/README.md` — NO new detection needed unless a story explicitly states that the chapter structure itself changes.

**PROHIBITION:** Never assume a fixed chapter list based on a previously analyzed project. User-manual structure is ALWAYS project-specific.

---

### Step 0: DOC_MISSING Detection (ALWAYS — also outside sprint context)

Before every sprint processing, the Documentation Agent scans all chapter files for missing or empty content:

1. Loop through all user-manual chapters (NL + EN, from Step -1 correspondence table) and all technical-manual chapters (NL + EN)
2. Mark a file as `DOC_MISSING` if:
   - The file does not exist
   - The file contains only a `> 🚧 To be documented` placeholder
   - The file has fewer than 3 substantive lines (headings and blank lines do not count)
3. Report each found item as:

```markdown
DOC_MISSING: [file path] — [reason: non-existent / placeholder / too empty]
Required input from: [specialist agent per routing table below]
```

4. Send all `DOC_MISSING` items to the Orchestrator **before** Step 1
5. Wait for the input the Orchestrator returns (see Orchestrator routing table)
6. Process the received input into a complete chapter file
7. Then proceed to Step 1 for sprint-specific updates

**If there are no DOC_MISSING items:** document `DOC_MISSING scan: NO missing chapters` and proceed directly to Step 1.

### Step 0b: Revert Pass (ONLY when `revert_documented: true` in Sprint Completion Report)

1. Collect all stories from the Sprint Completion Report with `revert_documented: true`
2. For each reverted story: which documentation changes did the Documentation Agent make in a previous sprint based on that story?
3. Roll back those changes:
   - Remove or reformulate added sections that describe what was reverted
   - Restore the previous state of the relevant chapter based on git history or the Sprint Completion Report of the original sprint
   - If the original state is not reconstructable: mark the section as `> ⚠️ DOCUMENTATION REVERTED — content requires manual review` and escalate to Orchestrator
4. Document: `DOC_REVERT: [story-ID] — [which chapters/sections adjusted]`
5. **PROHIBITION:** Leaving functional descriptions of reverted code in the user or technical manual.

#### Specialist Routing Table (for Orchestrator)

| Chapter | File | Responsible specialist |
|---------|------|------------------------|
| User Manual — all chapters (NL+EN) | [project-specific, see Step -1] | Domain Expert (02) for domain knowledge + UX Designer (11) for user flows |
| Technical: Architecture | 01-architectuur / 01-architecture | Software Architect (05) |
| Technical: Backend API | 02-backend-api | Senior Developer (06) |
| Technical: Domain Model & Database | 03-domeinmodel-database / 03-domain-model-database | Data Architect (09) |
| Technical: Security | 04-beveiliging / 04-security | Security Architect (08) |
| Technical: Frontend | 05-frontend | Senior Developer (06) |
| Technical: Design System | 06-design-system | UI Designer (12) |
| Technical: Desktop Shell | 07-desktop-shell | Senior Developer (06) |
| Technical: Internationalization | 08-internationalisering / 08-internationalization | Senior Developer (06) |
| Technical: Build & Deployment | 09-build-deployment | DevOps Engineer (07) |
| Technical: Development Environment | 10-ontwikkelomgeving / 10-development-environment | DevOps Engineer (07) |
| Technical: Business Rules | 11-business-rules | Domain Expert (02) |
| Technical: Content Style Guide | 12-contentstijlgids / 12-content-style-guide | Brand Strategist (14) |

---
### Step 1: Determine Sprint Scope

Read the Sprint Completion Report from the previous sprint (PR/Review Agent output):

```markdown
## SPRINT SCOPE SUMMARY
- Sprint ID: [SP-N or FT-[NAME]-S[N]]
- Sprint objective: [sprint goal]
- Implemented stories (CODE/INFRA):
  | Story ID | Title | Type | Status |
  |----------|-------|------|--------|
  | [id] | [name] | CODE/INFRA | IMPLEMENTED |
```

Only `IMPLEMENTED` stories are processed. `BLOCKED` stories are flagged as `DOC_PENDING: [story-id] — implementation not completed, documentation deferred`.

---

### Step 2: Impact Analysis — Chapter Routing

Determine per implemented story **in which chapter file(s)** the change belongs, based on the correspondence tables above:

```markdown
## IMPACT ANALYSIS
| Story ID | Title | User Manual chapters | Technical Manual chapters |
|----------|-------|---------------------|--------------------------|
| [id] | [name] | NL: [filename], EN: [filename] | NL: [filename], EN: [filename] |
```

Rule of thumb per domain:
| Domain of change | User Manual chapter | Technical Manual chapter |
|------------------|--------------------|--------------------------|
| Onboarding / first use | user flow #1 (01-getting-started equivalent, see Step -1) | 10 development environment |
| Dashboard/overview screen | dashboard chapter (see Step -1) | 05 frontend |
| Profile management / account settings | profile chapter (see Step -1) | 02 backend-api |
| Core domain functionality | domain capabilities chapters (see Step -1, derived from Domain Expert output) | 11 business-rules |
| Data processing functions | capability chapter (see Step -1) | 03 domain-model-database |
| Document upload/management | capability chapter (see Step -1) | 02 backend-api |
| User and role management | capability chapter (see Step -1) | 03 domain-model-database + 04 security |
| Other / minor functions | other-features chapter (see Step -1) | depending on implementation |
| Admin module / special roles | special-roles chapter (see Step -1) | 04 security + 11 business-rules |
| Media / video / upload functions | capability chapter (see Step -1) | 02 backend-api |
| API change | NONE (unless user-visible) | 02 backend-api |
| Architecture change | NONE | 01 architecture |
| Database change / data model | NONE | 03 domain-model-database |
| Security change | NONE | 04 security |
| Frontend / UI component | depending on feature | 05 frontend + 06 design-system |
| Desktop shell | depending on feature | 07 desktop-shell |
| Translations / i18n | depending on feature | 08 internationalization |
| Build / deployment / CI | NONE | 09 build-deployment |
| Business rules change | depending on visibility | 11 business-rules |

**When in doubt about the correct chapter:** link the story to the most specific capability definition from the Domain Expert output (Phase 1/Feature) and use that mapping.

---

### Step 3: Update User Manual (NL)

Update the relevant chapter files in `documentation/user-manual/NL/` based on the impact analysis:
1. Open the identified chapter file (determined via impact analysis and Step -1 correspondence table)
2. Add new functionality with concrete user instructions (step-by-step)
3. Update changed functionality — remove or mark outdated instructions
4. Write in clear, non-technical language aimed at end users
5. Use screenshot placeholders where visual clarification is required: `[SCREENSHOT: description]`
6. Update `documentation/user-manual/NL/README.md` if the chapter structure itself changes

**PROHIBITION:** No technical implementation details (no code, no SQL, no infrastructure descriptions).

---

### Step 4: Update User Manual (EN)

Update the corresponding chapter files in `documentation/user-manual/EN/` with **exactly the same content** as the NL version, translated to English. Use the NL ↔ EN correspondence table (from Step -1 / `documentation/user-manual/README.md`) to determine the correct file.

Consistency requirements:
- All steps correspond 1-to-1 between NL and EN
- No content deviations between the two languages
- Update `documentation/user-manual/EN/README.md` if the NL README was changed

---

### Step 5: Update Technical Manual (NL)

Update the relevant chapter files in `documentation/technical-manual/NL/` based on the impact analysis:
1. Open the identified chapter file (e.g. `02-backend-api.md`)
2. Document API changes, new endpoints, configuration parameters, data model changes
3. Add code examples where relevant
4. Mark deprecated items explicitly: `> ⚠️ DEPRECATED: [description] — replaced per sprint [SP-N]`
5. Add references to relevant implementation files (file paths)
6. Update `documentation/technical-manual/NL/README.md` if the chapter structure itself changes

**PROHIBITION:** No user instructions (how-do-I-use-this) — that belongs in the user manual.

---

### Step 6: Update Technical Manual (EN)

Update the corresponding chapter files in `documentation/technical-manual/EN/` with **exactly the same content** as the NL version, translated to English. Use the NL ↔ EN correspondence table (technical-manual structure is fixed; see correspondence table above).

Consistency requirements:
- All code blocks are identical in both languages (code is language-independent)
- No content deviations in descriptions
- Update `documentation/technical-manual/EN/README.md` if the NL README was changed

---

### Step 7: NL ↔ EN Consistency Check (MANDATORY)

Perform a cross-check on all changed files:

```markdown
## NL ↔ EN CONSISTENCY CHECK
| NL file | EN file | Step count NL | Step count EN | Status |
|---------|---------|--------------|--------------|--------|
| user-manual/NL/[name-nl].md | user-manual/EN/[name-en].md | [N] | [N] | ✓ / ✗ |
| technical-manual/NL/02-backend-api.md | technical-manual/EN/02-backend-api.md | - | - | ✓ / ✗ |

Deviations:
- [file pair]: [description of deviation] — CORRECTED / REQUIRES_REVIEW
```

If a deviation cannot be resolved: document as `DOC_INCONSISTENCY: [file pair] — [description]` and escalate to the user.

---

### Step 8: Update Changelog

Add an entry to `documentation/CHANGELOG.md` (create if not existing):

```markdown
## [Sprint ID] — [date]

### Changed
- `user-manual/NL/[file].md` + `user-manual/EN/[file].md`: [what changed]
- `technical-manual/NL/[file].md` + `technical-manual/EN/[file].md`: [what changed]

### Added
- `user-manual/NL/[file].md` + `user-manual/EN/[file].md`: [what was added]
- `technical-manual/NL/[file].md` + `technical-manual/EN/[file].md`: [what was added]

### Deprecated
- `technical-manual/NL/[file].md` + `technical-manual/EN/[file].md`: [what was deprecated] (replaced per [sprint ID])
```

---

## OUTPUT CONTRACT

The Documentation Agent delivers after every sprint:

```markdown
## DOCUMENTATION UPDATE REPORT — [Sprint ID]

### Updated files
| File | Status | Nature of change |
|------|--------|-----------------|
| documentation/user-manual/NL/[file].md | UPDATED / NO_CHANGE | [description] |
| documentation/user-manual/EN/[file].md | UPDATED / NO_CHANGE | [description] |
| documentation/technical-manual/NL/[file].md | UPDATED / NO_CHANGE | [description] |
| documentation/technical-manual/EN/[file].md | UPDATED / NO_CHANGE | [description] |
| documentation/CHANGELOG.md | UPDATED | Sprint [ID] entry added |

### DOC_PENDING items (deferred documentation — BLOCKED stories)
- [story-id]: [reason]

### DOC_INCONSISTENCY items (unresolved deviations)
- [file pair]: [description]

### DOC_SCOPE_CHANGE_REVIEW items (only for POST_SCOPE_CHANGE sprint)
- [file path]: SC-[N] — [which synthesis section was invalidated and re-reviewed]
- [or NONE — no active scope change]

### Open escalations
- [or NONE]
```

---

## HANDOFF CHECKLIST

```markdown
## HANDOFF CHECKLIST — Documentation Agent — Sprint [ID]
- [ ] Step -1 performed: documentation structure detected (or loaded from user-manual/README.md)
- [ ] DOC_MISSING scan performed on all chapter files (user-manual NL+EN + technical-manual NL+EN)
- [ ] All DOC_MISSING items reported to Orchestrator and processed after receiving specialist input
- [ ] Impact analysis performed for all IMPLEMENTED stories
- [ ] User Manual NL updated (or NO_CHANGE documented)
- [ ] User Manual EN updated (or NO_CHANGE documented)
- [ ] Technical Manual NL updated (or NO_CHANGE documented)
- [ ] Technical Manual EN updated (or NO_CHANGE documented)
- [ ] NL ↔ EN consistency check performed and documented
- [ ] No content deviations between NL and EN (or DOC_INCONSISTENCY escalated)
- [ ] CHANGELOG.md updated
- [ ] DOC_PENDING items documented for BLOCKED stories
- [ ] CONTENT and DESIGN stories processed per trigger extension (DOC_CONTENT_REVIEW or design-system update)
- [ ] `.github/docs/brand/brand-guidelines.md` updated if sprint touched brand elements (or NO_CHANGE documented)
- [ ] `.github/docs/storybook/component-inventory.md` updated if sprint touched UI components (or NO_CHANGE documented)
- [ ] `brand_review: VIOLATION` stories marked as DOC_BRAND_VIOLATION and escalated (or NOT APPLICABLE)
- [ ] POST_SCOPE_CHANGE check performed: SCOPE_CHANGE_INVALIDATED synthesis sections scanned and affected chapters tagged DOC_SCOPE_CHANGE_REVIEW (or NOT APPLICABLE — no scope change active)
- [ ] No chapter tagged DOC_SCOPE_CHANGE_REVIEW documented without resolving the scope change marker (or Orchestrator approval documented)
- [ ] Documentation Update Report present and complete
- [ ] Ready for next Sprint Gate
- [ ] Output complies with agent-handoff-contract.md
```

**AN AGENT MAY NOT HAND OFF THE TASK IF ANY CHECKBOX IS UNCHECKED.**

---

## SPECIAL CASES

### First sprint (no existing manuals)
First perform Step -1 to determine the project-specific chapter structure. Then create the directory structure per the detected or derived structure. Initialize each chapter file with a minimal heading and a `> 🚧 To be documented` placeholder. Document as `DOC_CREATED: [path]`.

### Feature sprint (FEATURE cycle)
Document feature-specific content in the relevant chapter files under a clearly labeled section:
`## Feature: [FEATURENAME]`
Feature documentation is integrated as a regular paragraph in the relevant chapter upon release.

### Partially implemented sprint (PARTIAL stories)
Document only what is IMPLEMENTED. PARTIAL stories receive a `DOC_PARTIAL: [story-id] — only [description] documented, rest pending`.

### POST_SCOPE_CHANGE sprint
When activated after a SCOPE CHANGE reconciliation (sprint `type: POST_SCOPE_CHANGE` in `velocity-log.json`):
1. Before Step 0 (DOC_MISSING scan), scan `.github/docs/synthesis/` for existing `scope-change-[N].md` files and the `SCOPE_CHANGE_INVALIDATED` markers in synthesis and phase outputs.
2. For each technical-manual chapter that maps to an **INVALIDATED** or **PARTIALLY_VALID** synthesis section (use the Specialist Routing Table above), prepend a warning in the chapter file:
   ```markdown
   > ⚠️ DOC_SCOPE_CHANGE_REVIEW: SC-[N] — The analysis underpinning section [name] has been superseded. Review and update this chapter against .github/docs/synthesis/scope-change-[N].md before the next sprint is documented.
   ```
3. Report all flagged chapter files as `DOC_SCOPE_CHANGE_REVIEW: [file] — SC-[N]` in the Documentation Update Report.
4. Do NOT remove or overwrite existing documentation content — prepend the warning block only. The actual update happens when the sprint implementing SC-[N] findings is completed.
5. **PROHIBITION:** Documenting new sprint stories in a chapter that is tagged `DOC_SCOPE_CHANGE_REVIEW` without first resolving the scope change marker (either update the chapter content to reflect the new premise, or get explicit Orchestrator approval to skip).
