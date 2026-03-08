# Synthesis — Final Reports, Brand & Storybook

After all four design phases complete and pass Critic + Risk validation, the system produces a set of final deliverables. This page explains what those deliverables are, how to read them, and what the Brand & Storybook agents contribute.

---

## Overview

The synthesis stage produces **6 documents** in `.github/docs/synthesis/`:

| Document | File | Audience |
|----------|------|----------|
| **Master Report** | `final-report-master.md` | Board, management, governance |
| **Business Report** | `final-report-business.md` | Business Analyst, Sales, Finance, Domain owners |
| **Technology Report** | `final-report-tech.md` | Engineering, DevOps, Security, Data teams |
| **UX Report** | `final-report-ux.md` | UX/UI designers, Product owners, Accessibility |
| **Marketing Report** | `final-report-marketing.md` | Marketing, Growth, CRO teams |
| **Cross-Team Blocker Matrix** | `cross-team-blocker-matrix.md` | All teams + Orchestrator |

Before these reports are generated, two additional agents run (if marketing was in scope): the **Brand & Assets Agent** and the **Storybook Agent**.

---

## The Master Report

The master report is the executive-level document. It contains:

### 1. Executive Summary (max 2 pages)
- What is the product and for whom
- Solution overview (CREATE mode) or current state (AUDIT mode)
- Top-5 strategic priorities across all domains
- Overall risk profile
- Investment ratio (effort vs expected return)

### 2. Solution Blueprint Heatmap (CREATE) / Capability Heatmap (AUDIT)
A matrix showing readiness across all dimensions:
- **Rows:** business capabilities or product features
- **Columns:** Business | Technical | UX | Marketing readiness
- **Color coding:** Ready for Implementation / Needs Refinement / Blocked / Not Yet Designed

### 3. Risk Matrix
All risks from all phases consolidated and sorted by risk score (highest first). Each risk includes probability, impact, mitigation, and owner. Linked risks that reinforce each other are identified.

### 4. 12-Month Roadmap
A quarterly breakdown of deliverables, dependencies, KPI targets, and blocked items. In CREATE mode, milestones are framed as build targets ("MVP launch", "Feature X shipped"). In AUDIT mode, they're framed as remediation steps.

### 5. Combined Guardrails
All guardrails from all phases merged, deduplicated, and conflict-resolved.

### 6. KPI Dashboard
All KPIs from all phases with current baselines, 6-month targets, 12-month targets, and measurement-responsible discipline.

### 7. Open Items
All unresolved `UNCERTAIN:` and `INSUFFICIENT_DATA:` items with routing information.

### 8. Scope Change History (if applicable)
If any `SCOPE CHANGE` commands were executed, each event is documented with dimension, date, invalidated sections, and resulting premise changes.

---

## Department Reports

Each department report follows the **same 8-section structure** and is fully self-contained — the relevant team can act without reading the master report:

| Section | Content |
|---------|---------|
| **1. Summary** | Design decisions and specifications from this team's perspective |
| **2. Recommendations** | Prioritized list with source agent, effort, and impact |
| **3. Roadmap** | 12-month items for this team, with dependencies and KPI targets |
| **4. KPIs** | Baselines and targets for this team's metrics |
| **5. Blockers from other teams** | Items this team cannot start without input from another team (always present, even if "no blockers") |
| **6. Advisory alignments** | Nice-to-have coordination with other teams |
| **7. Open items** | Filtered `UNCERTAIN:` and `INSUFFICIENT_DATA:` items for this discipline |
| **8. Guardrails** | Filtered subset of combined guardrails for this team |

### Which Agents Feed Each Report

| Report | Phase | Agents |
|--------|-------|--------|
| Business | Phase 1 | Business Analyst, Domain Expert, Sales Strategist, Financial Analyst, Product Manager |
| Technology | Phase 2 | Software Architect, Senior Developer, DevOps Engineer, Security Architect, Data Architect, Legal Counsel |
| UX | Phase 3 | UX Researcher, UX Designer, UI Designer, Accessibility Specialist, Content Strategist, Localization Specialist |
| Marketing | Phase 4 | Brand Strategist, Growth Marketer, CRO Specialist |

---

## Cross-Team Blocker Matrix

This is the **dependency map** between teams. It identifies:

- **BLOCKING** dependencies — a team **cannot start** without this from another team
- **ADVISORY** dependencies — coordination is helpful but not required

Format: a matrix with teams on both axes, plus a detailed table listing each blocker with ID, priority, and recommended action.

Every `BLOCKING` item must appear as `BLOCKED` in the corresponding sprint plan story. Missing linkage causes the Synthesis Agent to flag it.

---

## Brand & Assets Agent

The Brand & Assets Agent runs **after Phase 4 passes Critic + Risk validation** and **before the Storybook Agent**. It converts Phase 4 brand strategy into usable digital assets.

### What It Produces

| Output | Location |
|--------|----------|
| Brand guidelines | `.github/docs/brand/brand-guidelines.md` |
| Design tokens | `.github/docs/brand/design-tokens.json` |
| Brand assets report | `.github/docs/brand/brand-assets-report.md` |
| Visual assets (logos, social cards, banners) | `.github/docs/brand/assets/` |

### Canva Integration

If a Canva API token was provided during onboarding, the agent creates or updates a Canva Brand Kit and generates assets (social cards, banners, favicon, email headers, UI preview covers) via the Canva Connect API.

If **no Canva token** was provided:
- Status is set to `SKIPPED_NO_TOKEN`
- The brand guidelines and design tokens are still produced (from Phase 4 text output)
- Only the Canva-dependent visual assets are skipped
- The Storybook Agent and Synthesis Agent continue with reduced brand data

### What the Brand Guidelines Cover

The brand guidelines document has 6 mandatory sections:
1. Colors (primary, secondary, accent, neutral, semantic)
2. Typography (primary and secondary typefaces, weights, usage)
3. Logo variants (primary, white, black, icon)
4. Tone of voice (keywords, examples)
5. Forbidden combinations (what to never do)
6. INSUFFICIENT_DATA log (gaps that need resolution)

---

## Storybook Agent

The Storybook Agent runs **after the Brand & Assets Agent**. It sets up the component library that governs all UI implementation.

### What It Produces

| Output | Location |
|--------|----------|
| Component inventory | `.github/docs/storybook/component-inventory.md` |
| Design tokens (CSS) | `src/tokens/tokens.css` |
| Design tokens (JS) | `src/tokens/tokens.js` |
| Storybook configuration | `.storybook/` directory |
| Component stories | Per-component `.stories.js` files |

### Why It Matters

The Storybook component inventory is the **only approved UI building block set** for Phase 5 implementation:

> **Rule ORC-18:** The Implementation Agent MUST NOT create or use UI components that are not documented in the Storybook component inventory. New components first require a Storybook story + review.

This means:
- Every UI component used in implementation must exist in Storybook first
- New components require a Storybook story before they can be implemented
- The PR/Review Agent enforces this on every pull request

### Token Source Hierarchy

The Storybook Agent uses this decision tree for design tokens:

1. **Primary:** `.github/docs/brand/design-tokens.json` (from Brand & Assets Agent)
2. **Fallback:** If design-tokens.json is missing or `SKIPPED_NO_TOKEN`, the Storybook Agent extracts tokens directly from Phase 4 Brand Strategist output

Storybook always runs, regardless of whether Canva is available.

---

## Partial Runs

If you ran only some disciplines (e.g., `CREATE TECH UX [project]`), synthesis behavior changes:

- Only department reports for the executed phases are produced
- Master Report and Cross-Team Blocker Matrix are **not** produced until all 4 phases are available
- Department reports include a `PARTIAL_RUN` disclaimer noting which phases are missing
- Run `CREATE SYNTHESIS` after completing remaining phases to get the full picture

---

## Reading the Reports

### For Executives
Start with the **Master Report**: Executive Summary → Heatmap → Risk Matrix → Roadmap.

### For Team Leads
Read **your department report** sections 1–5. Section 5 (Blockers) tells you what you need from other teams before you can start.

### For the Orchestrator / System
The **Cross-Team Blocker Matrix** drives sprint planning. Every `BLOCKING` item must be resolved or marked `BLOCKED` in the sprint plan before implementation begins.

### For Developers
The **Technology Report** (sections 2 and 8) plus the **Storybook component inventory** are your primary references during implementation.

---

## See Also

- [Pipeline](pipeline.md) — the full phase sequence leading to synthesis
- [Quality Gates](quality-gates.md) — Critic + Risk validation that must pass before synthesis
- [Sprints](sprints.md) — how synthesis outputs feed into sprint planning
- [File System Reference](../../docs/file-system-reference.md) — where all synthesis files live on disk
